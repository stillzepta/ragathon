import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

function client(fetch) {
  const source = fs.readFileSync(new URL('../src/api.ts', import.meta.url), 'utf8')
    .replace('import.meta.env.VITE_API_URL', '"https://backend.example"');
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const context = { exports: {}, fetch, Headers, TypeError, Error, setTimeout: (fn) => fn() };
  vm.runInNewContext(compiled, context);
  return context.exports.api;
}

test('retries one interrupted chat connection', async () => {
  let calls = 0;
  const api = client(async () => {
    if (++calls === 1) throw new TypeError('Load failed');
    return new Response('{"reply":"hello"}');
  });
  assert.equal((await (await api('/api/chat', '', { method: 'POST' })).json()).reply, 'hello');
  assert.equal(calls, 2);
});

test('does not replay run creation or HTTP failures', async () => {
  let calls = 0;
  const api = client(async () => { calls++; throw new TypeError('Load failed'); });
  await assert.rejects(api('/api/runs', '', { method: 'POST' }));
  assert.equal(calls, 1);
  const rateLimited = client(async () => { calls++; return new Response('{"detail":"Busy"}', { status: 429 }); });
  await assert.rejects(rateLimited('/api/chat', ''), /Busy/);
  assert.equal(calls, 2);
});

test('reports a useful error after two connection failures and respects cancellation', async () => {
  let calls = 0;
  const api = client(async () => { calls++; throw new TypeError('Load failed'); });
  await assert.rejects(api('/api/chat', ''), /connection to Diablo was interrupted/);
  assert.equal(calls, 2);
  await assert.rejects(api('/api/chat', '', { signal: AbortSignal.abort() }));
  assert.equal(calls, 3);
});
