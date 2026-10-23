import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { JSDOM } from 'jsdom';
const css = await readFile(new URL('../src/style.css', import.meta.url), 'utf8');
function contrast(a, b) {
  const luminance = hex => {
    const rgb = hex.match(/[a-f\d]{2}/gi).map(v => parseInt(v, 16) / 255).map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4);
    return rgb[0] * .2126 + rgb[1] * .7152 + rgb[2] * .0722;
  };
  const [high, low] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (high + .05) / (low + .05);
}
test('stylesheet parses and keeps responsive and print rules', () => {
  const dom = new JSDOM(`<style>${css}</style>`);
  assert.ok(dom.window.document.styleSheets[0].cssRules.length > 100);
  assert.match(css, /max-width:400px/);
  assert.match(css, /@media print/);
  assert.match(css, /prefers-reduced-motion/);
  dom.window.close();
});
test('small text is at least 12px or uses scalable rem units', () => {
  const sizes = [...css.matchAll(/font-size:(\d+(?:\.\d+)?)px/g)].map(m => Number(m[1]));
  assert.ok(sizes.every(size => size >= 12));
  assert.match(css, /textarea\{[^}]*font-size:1rem/);
  assert.match(css, /\.module-tab strong\{font-size:\.9375rem/);
});
test('main text, buttons and clinical text have readable contrast', () => {
  for (const [foreground, background] of [['354840', 'faf7f2'], ['ffffff', '326f64'], ['425a45', 'fffdfa'], ['64715c', 'fffdfa'], ['526647', 'edf2e7']]) {
    assert.ok(contrast(foreground, background) >= 4.5, `${foreground} on ${background}`);
  }
});
test('offline cache and app readiness use the same updated version', async () => {
  const worker = await readFile(new URL('../sw.js', import.meta.url), 'utf8');
  const app = await readFile(new URL('../src/app.js', import.meta.url), 'utf8');
  const version = worker.match(/const CACHE = '([^']+)'/)[1];
  assert.equal(version, 'pharmagah-v2');
  assert.ok(app.includes(`caches.open('${version}')`));
});
test('generated styles match source and all local fonts are supplied', async () => {
  assert.equal(await readFile(new URL('../assets/style.css', import.meta.url), 'utf8'), css);
  for (const match of css.matchAll(/url\('\.\/(.*?)'\)/g)) {
    const font = await readFile(new URL(`../assets/${match[1]}`, import.meta.url));
    assert.equal(font.subarray(0, 4).toString(), 'wOF2');
  }
});
