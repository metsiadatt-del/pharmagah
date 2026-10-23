import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { JSDOM } from 'jsdom';
const bundle = await readFile(new URL('../assets/app.js', import.meta.url), 'utf8');
const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
function setup(t, stored = null) {
  const dom = new JSDOM(html, { url: 'https://app.example.test/', runScripts: 'outside-only' });
  const w = dom.window;
  w.TextEncoder = TextEncoder; w.TextDecoder = TextDecoder; w.structuredClone = structuredClone; w.scrollTo = () => {}; w.setImmediate = setImmediate; w.clearImmediate = clearImmediate;
  w.HTMLDialogElement.prototype.showModal = function () { this.open = true; };
  w.HTMLDialogElement.prototype.close = function () { this.open = false; };
  if (stored) w.localStorage.setItem('pharmagah-reports', stored);
  w.eval(bundle);
  t.after(() => w.close());
  return { w, d: w.document, click: selector => w.document.querySelector(selector).click() };
}
const result = { resultList: { result: [{ id: '12345678', title: 'Mock study for integration testing', authorString: 'Test Author', pubYear: '2025', firstPublicationDate: '2025-01-01', abstractText: '<p>Test abstract, not clinical evidence.</p>', pubTypeList: { pubType: ['Journal Article'] } }] } };
async function runSearch(ctx) {
  ctx.w.fetch = async () => ({ ok: true, json: async () => result });
  ctx.click('[data-hint]');
  await ctx.d.querySelector('form').onsubmit({ preventDefault() {} });
}
test('dashboard renders all six tabs and updates each framework', t => {
  const ctx = setup(t);
  assert.equal(ctx.d.querySelectorAll('[role="tab"]').length, 6);
  for (const id of ['pharma', 'case', 'disease', 'cosmetic', 'supplement', 'interaction']) { ctx.click(`[data-module="${id}"]`); assert.equal(ctx.d.querySelector('[aria-selected="true"]').dataset.module, id); assert.ok(ctx.d.querySelector('#query')); }
  assert.match(ctx.d.querySelector('.privacy-note').textContent, /نبود نتیجه/);
});
test('search, notes, save, archive filtering, reload and deletion work', async t => {
  const ctx = setup(t);
  await runSearch(ctx);
  assert.equal(ctx.d.querySelectorAll('.article-card').length, 1);
  const notes = ctx.d.querySelector('#research-notes'); notes.value = 'یادداشت محلی'; notes.dispatchEvent(new ctx.w.Event('input'));
  ctx.click('[data-action="save"]');
  const saved = ctx.w.localStorage.getItem('pharmagah-reports'); assert.equal(JSON.parse(saved)[0].notes, 'یادداشت محلی');
  ctx.click('[data-page="archive"]'); assert.equal(ctx.d.querySelectorAll('.report-row').length, 1);
  const filter = ctx.d.querySelector('#archive-filter'); filter.value = 'cosmetic'; filter.dispatchEvent(new ctx.w.Event('change')); assert.equal(ctx.d.querySelectorAll('.report-row').length, 0);
  const fresh = setup(t, saved); fresh.click('[data-page="archive"]'); fresh.click('[data-open]'); assert.equal(fresh.d.querySelector('#research-notes').value, 'یادداشت محلی');
  fresh.click('[data-action="delete"]'); fresh.click('#confirm-delete'); assert.equal(JSON.parse(fresh.w.localStorage.getItem('pharmagah-reports')).length, 0);
});
test('offline search is blocked without calling network', async t => {
  const ctx = setup(t); let calls = 0; ctx.w.fetch = async () => { calls++; };
  Object.defineProperty(ctx.w.navigator, 'onLine', { value: false, configurable: true });
  ctx.click('[data-hint]'); await ctx.d.querySelector('form').onsubmit({ preventDefault() {} });
  assert.equal(calls, 0); assert.match(ctx.d.querySelector('#toast').textContent, /اینترنت لازم/);
});
test('zero results and network failures do not fabricate a report', async t => {
  const ctx = setup(t); ctx.w.fetch = async () => ({ ok: true, json: async () => ({ resultList: { result: [] } }) });
  ctx.click('[data-hint]'); await ctx.d.querySelector('form').onsubmit({ preventDefault() {} }); assert.match(ctx.d.querySelector('#toast').textContent, /پیدا نشد/); assert.equal(ctx.d.querySelector('#print-report'), null);
  ctx.w.fetch = async () => { throw new Error('network unavailable'); };
  await ctx.d.querySelector('form').onsubmit({ preventDefault() {} }); assert.equal(ctx.d.querySelector('#print-report'), null); assert.equal(ctx.d.querySelector('[type="submit"]').disabled, false);
});
test('article and notes HTML are escaped', async t => {
  const ctx = setup(t); ctx.w.fetch = async () => ({ ok: true, json: async () => ({ resultList: { result: [{ ...result.resultList.result[0], title: '<img src=x onerror=alert(1)>' }] } }) });
  ctx.click('[data-hint]'); await ctx.d.querySelector('form').onsubmit({ preventDefault() {} }); assert.equal(ctx.d.querySelector('.article-main img'), null); assert.match(ctx.d.querySelector('.article-main h3').textContent, /<img/);
});
test('print expands abstracts and restores their previous state', async t => {
  const ctx = setup(t); await runSearch(ctx); let printed = false;
  ctx.w.print = () => { printed = true; assert.ok([...ctx.d.querySelectorAll('#print-report details')].every(el => el.open)); };
  ctx.click('[data-action="pdf"]'); assert.equal(printed, true); ctx.w.dispatchEvent(new ctx.w.Event('afterprint')); assert.ok([...ctx.d.querySelectorAll('#print-report details')].every(el => !el.open));
});
test('source library and settings expose unavailable integrations honestly', t => {
  const ctx = setup(t); ctx.click('[data-page="sources"]'); assert.equal(ctx.d.querySelectorAll('.source-card').length, 6); assert.match(ctx.d.querySelector('#content').textContent, /دسترسی ندارد/);
  ctx.click('[data-action="settings"]'); assert.equal(ctx.d.querySelector('#modal').open, true); assert.ok(ctx.d.querySelector('#backup')); assert.ok(ctx.d.querySelector('#restore'));
});
test('corrupt saved data does not prevent dashboard rendering', t => { const ctx = setup(t, '{bad-json'); assert.equal(ctx.d.querySelectorAll('[role="tab"]').length, 6); });
test('bundled Word export creates a downloadable DOCX blob', async t => {
  const ctx = setup(t); await runSearch(ctx); let downloaded;
  ctx.w.URL.createObjectURL = blob => { downloaded = blob; return 'blob:test'; }; ctx.w.URL.revokeObjectURL = () => {};
  ctx.w.HTMLAnchorElement.prototype.click = () => {};
  await ctx.d.querySelector('[data-action="word"]').onclick();
  assert.ok(downloaded); assert.ok(downloaded.size > 3000); assert.match(downloaded.type, /wordprocessingml/);
});
test('backup import preserves existing reports and rejects invalid data', async t => {
  const ctx = setup(t); await runSearch(ctx); ctx.click('[data-action="save"]');
  const saved = JSON.parse(ctx.w.localStorage.getItem('pharmagah-reports'));
  ctx.click('[data-action="settings"]');
  await ctx.d.querySelector('#restore').onchange({ target: { files: [{ size: 100, text: async () => JSON.stringify({ version: 1, reports: [saved[0], { ...saved[0], id: 'another-report' }] }) }] } });
  assert.equal(JSON.parse(ctx.w.localStorage.getItem('pharmagah-reports')).length, 2);
  ctx.click('[data-action="settings"]');
  await ctx.d.querySelector('#restore').onchange({ target: { files: [{ size: 100, text: async () => JSON.stringify({ version: 1, reports: [null] }) }] } });
  assert.equal(JSON.parse(ctx.w.localStorage.getItem('pharmagah-reports')).length, 2);
});
test('arrow keys navigate the RTL module tabs', t => { const ctx = setup(t); ctx.d.querySelector('[data-module="pharma"]').dispatchEvent(new ctx.w.KeyboardEvent('keydown', { key: 'ArrowLeft' })); assert.equal(ctx.d.querySelector('[aria-selected="true"]').dataset.module, 'case'); });
