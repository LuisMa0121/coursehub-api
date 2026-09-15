const { test } = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM, VirtualConsole } = require('jsdom');
require('reflect-metadata');
const { NestFactory } = require('@nestjs/core');



async function until(predicate, message) {
  const deadline = Date.now() + 5000;
  while (Date.now() < deadline) {
    if (predicate()) return;
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  assert.fail(message);
}

test('Interfaz conectada al servidor NestJS real', async (t) => {
  const { AppModule } = await import('../dist/app.module.js');
  const { configureApp } = await import('../dist/setup-app.js');
  const app = await NestFactory.create(AppModule, { logger: false });
  configureApp(app);
  let dom;
  let disconnected = false;
  const requests = [];
  const scriptErrors = [];
  try {
    await app.listen(0, '127.0.0.1');
    const base = await app.getUrl();
    const virtualConsole = new VirtualConsole();
    virtualConsole.on('jsdomError', (error) => scriptErrors.push(error.message));
    dom = await JSDOM.fromURL(base + '/panel/', {
      resources: 'usable', runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole,
      beforeParse(window) {
        window.fetch = (url, options = {}) => {
          requests.push({ url, ...options });
          if (disconnected) return Promise.reject(new Error('Simulación sin red'));
          return fetch(new URL(url, base), options);
        };
        // jsdom no implementa la presentación de diálogos; los flujos y el DOM sí se ejecutan.
        window.HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', ''); };
        window.HTMLDialogElement.prototype.close = function () { this.removeAttribute('open'); };
      },
    });
    const document = dom.window.document;
    const $ = (selector) => document.querySelector(selector);
    const rows = () => [...document.querySelectorAll('#students-body tr')];
    const row = (name) => rows().find((element) => element.querySelector('.student-name').textContent === name);
    const click = (selector) => $(selector).click();
    const field = (name, value) => { $('#student-form').elements.namedItem(name).value = value; };
    const rowAction = (name, action) => row(name).querySelector(`[data-action="${action}"]`).click();
    const ready = () => !$('#loading').hidden ? false : !$('#new-student').disabled;
    const waitRows = async (count) => until(() => ready() && rows().length === count && !document.querySelector('.row-button:disabled:not(.delete)'), `Se esperaban ${count} filas`);

    await t.test('El panel sirve HTML, CSS y JavaScript', async () => {
      const response = await fetch(base + '/panel/');
      assert.equal(response.status, 200);
      assert.match(response.headers.get('content-type'), /text\/html/);
      assert.match(await response.text(), /Gestión de estudiantes/);
      for (const path of ['/panel/styles.css', '/panel/responsive.css', '/panel/app.js']) assert.equal((await fetch(base + path)).status, 200);
      const ids = [...document.querySelectorAll('[id]')].map((element) => element.id);
      assert.equal(new Set(ids).size, ids.length, 'Los controles y los iconos deben tener ids únicos');
      await until(ready, 'La interfaz debe conectarse a la API');
      assert.equal($('#empty').hidden, false);
      assert.equal($('#connection').textContent, 'Conectado al servidor');
    });
    await t.test('El botón de ejemplo registra tres estudiantes en la API', async () => {
      click('#load-demo');
      await waitRows(3);
      assert.equal($('#total-count').textContent, '3');
      assert.equal($('#active-count').textContent, '2');
      assert.equal($('#inactive-count').textContent, '1');
      assert.equal((await (await fetch(base + '/students')).json()).length, 3);
    });
    await t.test('El formulario crea un estudiante y conserva tipos JSON', async () => {
      click('#new-student');
      field('name', 'Mateo Ruiz'); field('email', 'mateo@example.com'); field('age', '23');
      field('career', 'Ingeniería de Software'); field('semester', '5');
      click('#save-student');
      await waitRows(4);
      assert.equal($('#student-dialog').open, false);
      assert.ok(row('Mateo Ruiz'));
      const saved = (await (await fetch(base + '/students')).json()).find((item) => item.name === 'Mateo Ruiz');
      assert.equal(saved.age, 23); assert.equal(saved.semester, 5); assert.equal(saved.isActive, true);
    });
    await t.test('Un correo duplicado muestra el error del backend en el formulario', async () => {
      click('#new-student');
      field('name', 'Otro Mateo'); field('email', 'MATEO@example.com'); field('age', '23');
      field('career', 'Software'); field('semester', '2');
      click('#save-student');
      await until(() => !$('#form-error').hidden && !$('#save-student').disabled, 'Debe aparecer el error de correo duplicado');
      assert.match($('#form-error').textContent, /correo/);
      assert.equal($('#student-dialog').open, true);
      assert.equal(rows().length, 4);
      click('#student-dialog [data-close]');
    });
    await t.test('Consultar ficha recupera el estudiante por id', async () => {
      rowAction('Mateo Ruiz', 'view');
      await until(() => $('#details-dialog').open, 'Debe abrirse la ficha');
      assert.match($('#student-details').textContent, /Mateo Ruiz/);
      assert.match($('#student-details').textContent, /mateo@example.com/);
      await until(() => !$('#details-dialog [data-close]').disabled, 'Debe habilitarse el cierre');
      click('#details-dialog [data-close]');
    });
    await t.test('Editar envía únicamente los campos modificados', async () => {
      rowAction('Mateo Ruiz', 'edit');
      await until(() => $('#student-dialog').open && !$('#save-student').disabled, 'Debe abrirse la edición');
      field('semester', '6');
      click('#save-student');
      await until(() => !$('#student-dialog').open && ready() && row('Mateo Ruiz')?.textContent.includes('6.º'), 'Debe guardarse el semestre');
      const request = requests.findLast((entry) => entry.method === 'PATCH');
      assert.deepEqual(JSON.parse(request.body), { semester: 6 });
    });
    await t.test('Combinar carrera, semestre y estado utiliza los filtros de la API', async () => {
      $('#filter-career').value = 'Ingeniería de Software'; $('#filter-semester').value = '3'; $('#filter-status').value = 'true';
      click('#filters button[type="submit"]');
      await waitRows(1);
      assert.ok(row('Ana Torres'));
      assert.ok(requests.some((entry) => entry.url.includes('semester=3&isActive=true')));
      assert.equal($('#total-count').textContent, '4');
    });
    await t.test('Buscar muestra un estado vacío y limpiar restaura el directorio', async () => {
      $('#search').value = 'No existe'; $('#search').dispatchEvent(new dom.window.Event('input'));
      assert.equal($('#empty').hidden, false);
      assert.match($('#empty-title').textContent, /coincidencias/);
      click('#clear-filters'); await waitRows(4);
    });
    await t.test('El filtro de inactivos funciona con false', async () => {
      $('#filter-status').value = 'false'; click('#filters button[type="submit"]'); await waitRows(1);
      assert.ok(row('Luis Pérez'));
      assert.ok(requests.some((entry) => entry.url.includes('isActive=false')));
      click('#clear-filters'); await waitRows(4);
    });
    await t.test('Desactivar impide la eliminación desde la interfaz', async () => {
      rowAction('Mateo Ruiz', 'status');
      await until(() => row('Mateo Ruiz')?.querySelector('.status-pill.inactive') && !row('Mateo Ruiz').querySelector('[data-action="status"]').disabled, 'Debe desactivarse');
      assert.equal(row('Mateo Ruiz').querySelector('[data-action="delete"]').disabled, true);
      assert.equal($('#active-count').textContent, '2');
    });
    await t.test('Reactivar, cancelar eliminación y luego eliminar', async () => {
      rowAction('Mateo Ruiz', 'status');
      await until(() => row('Mateo Ruiz') && !row('Mateo Ruiz').querySelector('[data-action="delete"]').disabled, 'Debe activarse');
      rowAction('Mateo Ruiz', 'delete');
      assert.equal($('#delete-dialog').open, true);
      click('#delete-dialog [data-close]'); assert.equal(rows().length, 4);
      rowAction('Mateo Ruiz', 'delete'); click('#confirm-delete');
      await waitRows(3); assert.equal(row('Mateo Ruiz'), undefined);
    });
    await t.test('Los datos se insertan como texto y no como HTML ejecutable', async () => {
      const malicious = '<img src=x onerror=alert(1)>';
      await fetch(base + '/students', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: malicious, email: 'safe@example.com', age: 20, career: 'Pruebas', semester: 1, isActive: true }) });
      click('#refresh'); await waitRows(4);
      assert.ok(row(malicious)); assert.equal($('#students-body img'), null);
    });
    await t.test('Sin servidor se muestra un error y Actualizar permite recuperarse', async () => {
      disconnected = true; click('#refresh');
      await until(() => !$('#page-error').hidden, 'Debe mostrarse el error de conexión');
      assert.match($('#page-error').textContent, /conectar/);
      assert.equal($('#connection').className, 'connection offline');
      disconnected = false; click('#refresh'); await waitRows(4);
      assert.equal($('#page-error').hidden, true);
      assert.equal($('#connection').className, 'connection online');
    });
    await t.test('Ayuda y cierre de diálogos funcionan sin errores de JavaScript', () => {
      click('#help-button'); assert.equal($('#help-dialog').open, true);
      click('#help-dialog [data-close]'); assert.equal($('#help-dialog').open, false);
      assert.deepEqual(scriptErrors, []);
    });
  } finally {
    dom?.window.close();
    await app.close();
  }
});
