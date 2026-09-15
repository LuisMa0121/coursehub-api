const { test } = require('node:test');
const assert = require('node:assert/strict');
require('reflect-metadata');
const { NestFactory } = require('@nestjs/core');


const scenarios = require('./course-scenarios.json');

function subset(actual, expected) {
  if (expected !== null && typeof expected === 'object') {
    assert.ok(actual !== null && typeof actual === 'object');
    for (const key of Object.keys(expected)) subset(actual[key], expected[key]);
  } else assert.deepEqual(actual, expected);
}

test('CourseHub: base de las sesiones 1 a 6', async (t) => {
  const { AppModule } = await import('../dist/app.module.js');
  const { configureApp } = await import('../dist/setup-app.js');
  const app = await NestFactory.create(AppModule, { logger: false });
  configureApp(app);
  try {
    await app.listen(0, '127.0.0.1');
    const base = await app.getUrl();
    for (const item of scenarios) await t.test(item.name, async () => {
      const response = await fetch(base + item.route, {
        method: item.method,
        headers: item.body === undefined ? {} : { 'Content-Type': 'application/json' },
        body: item.body === undefined ? undefined : JSON.stringify(item.body),
      });
      const result = typeof item.expected === 'string' ? await response.text() : await response.json();
      assert.equal(response.status, item.status, JSON.stringify(result));
      if (item.expected !== undefined) subset(result, item.expected);
      if (item.status >= 400) assert.equal(result.statusCode, item.status);
      if (item.length !== undefined) assert.equal(result.length, item.length);
    });
  } finally { await app.close(); }
});
