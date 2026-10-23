import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { JSDOM, VirtualConsole } from 'jsdom';
const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
for (const url of ['https://example.test/', 'https://example.test/pharmagah/', 'file:///download/index.html']) {
  test(`delivered HTML boots without external assets at ${url}`, t => {
    const errors = [];
    const console = new VirtualConsole();
    console.on('jsdomError', error => errors.push(error.message));
    const dom = new JSDOM(html, {
      url, runScripts: 'dangerously', virtualConsole: console,
      beforeParse(window) {
        window.TextEncoder = TextEncoder; window.TextDecoder = TextDecoder;
        window.setImmediate = setImmediate; window.clearImmediate = clearImmediate;
        window.structuredClone = structuredClone; window.scrollTo = () => {};
      }
    });
    t.after(() => dom.window.close());
    const doc = dom.window.document;
    assert.deepEqual(errors, []);
    assert.equal(doc.querySelectorAll('[role="tab"]').length, 6);
    assert.equal(doc.querySelector('#startup-status'), null);
    assert.equal(doc.querySelectorAll('script[src],link[rel="stylesheet"]').length, 0);
    assert.match(doc.querySelector('style').textContent, /data:font\/woff2;base64/);
    doc.querySelector('[data-module="case"]').click();
    assert.equal(doc.querySelector('[aria-selected="true"]').dataset.module, 'case');
    doc.querySelector('[data-page="archive"]').click();
    assert.ok(doc.querySelector('#archive-list'));
  });
}
test('disabled JavaScript leaves an explanation instead of a blank page', () => {
  const dom = new JSDOM(html);
  assert.match(dom.window.document.querySelector('#app').textContent, /فارم‌آگاه/);
  assert.match(dom.window.document.querySelector('noscript').textContent, /جاوااسکریپت/);
  dom.window.close();
});
test('startup errors display recovery instructions without clearing archive', () => {
  const dom = new JSDOM(html, { url: 'https://example.test/', runScripts: 'outside-only' });
  const doc = dom.window.document;
  dom.window.eval(doc.querySelector('script').textContent);
  dom.window.localStorage.setItem('pharmagah-reports', 'preserved');
  dom.window.dispatchEvent(new dom.window.ErrorEvent('error'));
  assert.match(doc.querySelector('#startup-message').textContent, /Ctrl\+Shift\+R/);
  assert.equal(dom.window.localStorage.getItem('pharmagah-reports'), 'preserved');
  dom.window.close();
});
