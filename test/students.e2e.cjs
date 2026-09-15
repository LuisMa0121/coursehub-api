const { test } = require('node:test');
const assert = require('node:assert/strict');
require('reflect-metadata');
const { NestFactory } = require('@nestjs/core');


const scenarios = require('./scenarios.json');

function assertSubset(actual, expected) {
  if (expected !== null && typeof expected === 'object') {
    assert.ok(actual !== null && typeof actual === 'object');
    for (const key of Object.keys(expected)) assertSubset(actual[key], expected[key]);
  } else {
    assert.deepEqual(actual, expected);
  }
}

test('API de estudiantes: peticiones HTTP reales', async (t) => {
  const { AppModule } = await import('../dist/app.module.js');
  const { configureApp } = await import('../dist/setup-app.js');
  const app = await NestFactory.create(AppModule, { logger: false });
  configureApp(app);
  try {
    // Puerto efímero: no afecta a una API que el alumno esté ejecutando.
    await app.listen(0, '127.0.0.1');
    const baseUrl = await app.getUrl();
    for (const scenario of scenarios) {
      await t.test(scenario.name, async () => {
        const response = await fetch(baseUrl + scenario.route, {
          method: scenario.method,
          headers: scenario.body === undefined ? {} : { 'Content-Type': 'application/json' },
          body: scenario.body === undefined ? undefined : JSON.stringify(scenario.body),
        });
        const result = await response.json();
        assert.equal(response.status, scenario.status, JSON.stringify(result));
        if (scenario.status >= 400) {
          assert.equal(result.statusCode, scenario.status);
          assert.ok(result.message);
        }
        if (scenario.expected !== undefined) assertSubset(result, scenario.expected);
        if (scenario.length !== undefined) {
          assert.ok(Array.isArray(result));
          assert.equal(result.length, scenario.length);
        }
      });
    }
  } finally {
    await app.close();
  }
});
