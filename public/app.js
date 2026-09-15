'use strict';

const $ = (selector) => document.querySelector(selector);
const state = { all: [], filtered: [], editing: null, deleting: null, pending: false, loadId: 0 };
let toastTimer;

async function api(path = '', method = 'GET', body) {
  let response;
  try {
    response = await fetch(`/students${path}`, {
      method,
      headers: body === undefined ? {} : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new Error('No pudimos conectar con el servidor. Comprueba que esté encendido y pulsa Actualizar.');
  }
  let result;
  try { result = await response.json(); }
  catch { throw new Error('El servidor devolvió una respuesta inesperada. Comprueba la dirección de la aplicación.'); }
  if (!response.ok) throw new Error(Array.isArray(result.message) ? result.message.join('. ') : result.message || 'No se pudo completar la operación.');
  return result;
}

function showError(element, message = '') {
  element.textContent = message;
  element.hidden = !message;
}

function toast(message, error = false) {
  clearTimeout(toastTimer);
  const element = $('#toast');
  element.textContent = message;
  element.className = `toast${error ? ' error' : ''}`;
  element.hidden = false;
  toastTimer = setTimeout(() => { element.hidden = true; }, 5000);
}

function connection(online) {
  const element = $('#connection');
  element.className = `connection ${online ? 'online' : 'offline'}`;
  element.replaceChildren(document.createElement('span'), document.createTextNode(online ? 'Conectado al servidor' : 'Sin conexión'));
}

function node(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function populateCareers() {
  const select = $('#filter-career');
  const current = select.value;
  const careers = [...new Set(state.all.map((student) => student.career))].sort((a, b) => a.localeCompare(b, 'es'));
  if (current && !careers.includes(current)) careers.push(current);
  select.replaceChildren(new Option('Todas las carreras', ''));
  $('#careers').replaceChildren();
  for (const career of careers) {
    select.add(new Option(career, career));
    $('#careers').append(new Option(career, career));
  }
  select.value = current;
}

function render() {
  $('#total-count').textContent = state.all.length;
  $('#active-count').textContent = state.all.filter((student) => student.isActive).length;
  $('#inactive-count').textContent = state.all.filter((student) => !student.isActive).length;
  const search = $('#search').value.trim().toLocaleLowerCase('es');
  const students = state.filtered.filter((student) => `${student.name} ${student.email}`.toLocaleLowerCase('es').includes(search));
  const tbody = $('#students-body');
  tbody.replaceChildren();
  for (const student of students) {
    const row = node('tr');
    row.dataset.id = student.id;
    const identity = node('td');
    const block = node('div', 'student-cell');
    const initials = student.name.split(/\s+/).filter(Boolean).slice(0, 2).map((word) => word[0]).join('').toUpperCase();
    const avatar = node('span', `avatar tone-${student.id % 3}`, initials);
    avatar.setAttribute('aria-hidden', 'true');
    const text = node('div');
    text.append(node('span', 'student-name', student.name), node('span', 'student-email', student.email));
    block.append(avatar, text);
    identity.append(block);
    const career = node('td');
    career.append(node('span', 'career-tag', student.career));
    const status = node('td');
    status.append(node('span', `status-pill${student.isActive ? '' : ' inactive'}`, student.isActive ? 'Activo' : 'Inactivo'));
    const actions = node('td');
    const buttons = node('div', 'row-actions');
    for (const [action, label] of [['view', 'Ver'], ['edit', 'Editar'], ['status', student.isActive ? 'Desactivar' : 'Activar'], ['delete', 'Eliminar']]) {
      const button = node('button', `row-button ${action}`, label);
      button.type = 'button';
      button.dataset.action = action;
      button.setAttribute('aria-label', `${label} a ${student.name}`);
      button.disabled = state.pending || (action === 'delete' && !student.isActive);
      if (action === 'delete' && !student.isActive) button.title = 'Activa al estudiante antes de eliminarlo';
      buttons.append(button);
    }
    actions.append(buttons);
    row.append(identity, career, node('td', '', `${student.semester}.º semestre`), node('td', '', `${student.age} años`), status, actions);
    ['Estudiante', 'Carrera', 'Semestre', 'Edad', 'Estado', 'Acciones'].forEach((label, index) => { row.children[index].dataset.label = label; });
    tbody.append(row);
  }
  $('#table-wrap').hidden = students.length === 0;
  $('#empty').hidden = students.length > 0;
  const emptyDatabase = state.all.length === 0;
  $('#empty-title').textContent = emptyDatabase ? 'Tu directorio empieza aquí' : 'No encontramos coincidencias';
  $('#empty-description').textContent = emptyDatabase ? 'Registra tu primer estudiante o explora con tres datos de ejemplo.' : 'Prueba con otro nombre o correo, o limpia los filtros para ver el directorio.';
  $('#empty-create').hidden = !emptyDatabase;
  $('#load-demo').hidden = !emptyDatabase;
  $('#list-count').textContent = students.length;
  $('#results-summary').textContent = `Mostrando ${students.length} de ${state.all.length} estudiantes`;
}

async function loadStudents() {
  const loadId = ++state.loadId;
  const query = new URLSearchParams();
  for (const [key, value] of new FormData($('#filters'))) if (value) query.set(key, value);
  $('#loading').hidden = false;
  $('#empty').hidden = true;
  $('#table-wrap').hidden = true;
  $('#new-student').disabled = true;
  showError($('#page-error'));
  try {
    const [all, filtered] = await Promise.all([api(), query.size ? api(`?${query}`) : Promise.resolve(null)]);
    if (loadId !== state.loadId) return false;
    if (!Array.isArray(all) || (filtered !== null && !Array.isArray(filtered))) throw new Error('El servidor no devolvió un listado válido.');
    state.all = all;
    state.filtered = filtered ?? all;
    populateCareers();
    render();
    connection(true);
    $('#new-student').disabled = false;
    return true;
  } catch (error) {
    if (loadId !== state.loadId) return false;
    showError($('#page-error'), error.message);
    connection(false);
    $('#results-summary').textContent = 'No se pudo actualizar el directorio. Pulsa Actualizar para reintentar.';
    return false;
  } finally {
    if (loadId === state.loadId) $('#loading').hidden = true;
  }
}

function openStudent(student = null) {
  state.editing = student;
  const form = $('#student-form');
  form.reset();
  showError($('#form-error'));
  $('#form-title').textContent = student ? 'Editar estudiante' : 'Nuevo estudiante';
  $('#save-student').textContent = student ? 'Guardar cambios' : 'Registrar estudiante';
  if (student) {
    for (const field of ['name', 'email', 'age', 'career', 'semester']) form.elements.namedItem(field).value = student[field];
    form.elements.namedItem('isActive').checked = student.isActive;
  }
  $('#student-dialog').showModal();
  $('#student-name').focus();
}

function setPending(pending) {
  state.pending = pending;
  document.querySelectorAll('dialog button').forEach((button) => { button.disabled = pending; });
  if (!$('#table-wrap').hidden) render();
}

$('#student-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  if (state.pending || !event.currentTarget.reportValidity()) return;
  const data = new FormData(event.currentTarget);
  const student = {
    name: data.get('name').trim(), email: data.get('email').trim().toLowerCase(),
    age: Number(data.get('age')), career: data.get('career').trim(),
    semester: Number(data.get('semester')), isActive: data.has('isActive'),
  };
  const editing = state.editing;
  const body = editing ? Object.fromEntries(Object.entries(student).filter(([key, value]) => editing[key] !== value)) : student;
  setPending(true);
  showError($('#form-error'));
  $('#save-student').textContent = 'Guardando…';
  try {
    await api(editing ? `/${editing.id}` : '', editing ? 'PATCH' : 'POST', body);
    $('#student-dialog').close();
    await loadStudents();
    toast(editing ? 'Los cambios se guardaron correctamente.' : 'Estudiante registrado correctamente.');
  } catch (error) {
    showError($('#form-error'), error.message);
  } finally {
    setPending(false);
    $('#save-student').textContent = editing ? 'Guardar cambios' : 'Registrar estudiante';
  }
});

$('#students-body').addEventListener('click', async (event) => {
  const button = event.target.closest('button[data-action]');
  if (!button || button.disabled || state.pending) return;
  const student = state.all.find((item) => item.id === Number(button.closest('tr').dataset.id));
  if (!student) return;
  const action = button.dataset.action;
  if (action === 'delete') {
    state.deleting = student;
    showError($('#delete-error'));
    $('#delete-description').textContent = `Se eliminará a ${student.name} del directorio. Esta acción no se puede deshacer.`;
    $('#delete-dialog').showModal();
    return;
  }
  setPending(true);
  try {
    if (action === 'status') {
      await api(`/${student.id}/status`, 'PATCH', { isActive: !student.isActive });
      await loadStudents();
      toast(student.isActive ? 'Estudiante desactivado.' : 'Estudiante activado.');
    } else {
      const fresh = await api(`/${student.id}`);
      if (action === 'edit') openStudent(fresh);
      if (action === 'view') {
        const details = $('#student-details');
        details.replaceChildren();
        for (const [label, value] of [['Identificador', `#${fresh.id}`], ['Nombre', fresh.name], ['Correo', fresh.email], ['Edad', `${fresh.age} años`], ['Carrera', fresh.career], ['Semestre', fresh.semester], ['Estado', fresh.isActive ? 'Activo' : 'Inactivo']]) {
          details.append(node('dt', '', label), node('dd', '', value));
        }
        $('#details-dialog').showModal();
      }
    }
  } catch (error) { toast(error.message, true); }
  finally { setPending(false); }
});

$('#confirm-delete').addEventListener('click', async () => {
  if (!state.deleting || state.pending) return;
  setPending(true);
  try {
    await api(`/${state.deleting.id}`, 'DELETE');
    $('#delete-dialog').close();
    state.deleting = null;
    await loadStudents();
    toast('Estudiante eliminado correctamente.');
  } catch (error) { showError($('#delete-error'), error.message); }
  finally { setPending(false); }
});

$('#load-demo').addEventListener('click', async () => {
  if (state.pending) return;
  setPending(true);
  const button = $('#load-demo');
  button.disabled = true;
  button.textContent = 'Cargando…';
  try {
    const samples = [
      { name: 'Ana Torres', email: 'ana.torres@example.com', age: 21, career: 'Ingeniería de Software', semester: 3, isActive: true },
      { name: 'Luis Pérez', email: 'luis.perez@example.com', age: 22, career: 'Redes y Telecomunicaciones', semester: 4, isActive: false },
      { name: 'Sofía Mendoza', email: 'sofia.mendoza@example.com', age: 20, career: 'Ingeniería de Software', semester: 2, isActive: true },
    ];
    for (const sample of samples) await api('', 'POST', sample);
    toast('Se cargaron tres estudiantes de ejemplo.');
  } catch (error) { toast(error.message, true); }
  finally {
    await loadStudents();
    setPending(false);
    button.disabled = false;
    button.textContent = 'Cargar ejemplo';
  }
});

$('#new-student').addEventListener('click', () => { if (!state.pending) openStudent(); });
$('#empty-create').addEventListener('click', () => { if (!state.pending) openStudent(); });
$('#help-button').addEventListener('click', () => $('#help-dialog').showModal());
$('#refresh').addEventListener('click', loadStudents);
$('#filters').addEventListener('submit', (event) => { event.preventDefault(); loadStudents(); });
$('#clear-filters').addEventListener('click', () => { $('#filters').reset(); loadStudents(); });
$('#search').addEventListener('input', render);
document.querySelectorAll('[data-close]').forEach((button) => button.addEventListener('click', () => { if (!state.pending) button.closest('dialog').close(); }));
document.querySelectorAll('dialog').forEach((dialog) => dialog.addEventListener('cancel', (event) => { if (state.pending) event.preventDefault(); }));
loadStudents();
