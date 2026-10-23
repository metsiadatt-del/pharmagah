import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile, access } from 'node:fs/promises';
const worker = await readFile(new URL('../sw.js', import.meta.url), 'utf8');
test('offline installation caches only existing application assets', async () => {
  const handlers = {};
  let cached = [];
  vm.runInNewContext(worker, { self: { addEventListener: (event, fn) => handlers[event] = fn, skipWaiting: async () => {} }, caches: { open: async () => ({ addAll: async files => { cached = files; } }) } });
  let work; handlers.install({ waitUntil: promise => work = promise }); await work;
  assert.ok(cached.includes('./index.html')); assert.ok(cached.includes('./assets/app.js'));
  for (const file of cached) await access(new URL('../' + file, import.meta.url));
});
test('offline navigation uses cached shell and external APIs bypass cache', async () => {
  const handlers = {};
  const response = { offline: true };
  vm.runInNewContext(worker, { URL, self: { addEventListener: (event, fn) => handlers[event] = fn, location: { origin: 'https://app.example.test' }, registration: { scope: 'https://app.example.test/project/' } }, caches: { match: async url => { assert.equal(url, 'https://app.example.test/project/index.html'); return response; } }, fetch: async () => { throw new Error('offline'); } });
  let work; handlers.fetch({ request: { method: 'GET', url: 'https://app.example.test/project/', mode: 'navigate' }, respondWith: promise => work = promise });
  assert.equal(await work, response);
  let intercepted = false;
  handlers.fetch({ request: { method: 'GET', url: 'https://www.ebi.ac.uk/europepmc/webservices/rest/search' }, respondWith: () => intercepted = true });
  assert.equal(intercepted, false);
});
