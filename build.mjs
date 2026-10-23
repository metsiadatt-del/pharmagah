import { build } from 'esbuild';
import { copyFile, readFile, writeFile } from 'node:fs/promises';
await build({ entryPoints: ['src/app.js'], bundle: true, minify: true, outfile: 'assets/app.js', format: 'iife', target: ['es2020'], legalComments: 'eof' });
await writeFile('assets/app.js', (await readFile('assets/app.js', 'utf8')).replace(/[ \t]+$/gm, ''));
await copyFile('src/style.css', 'assets/style.css');
await copyFile('node_modules/@fontsource/vazirmatn/LICENSE', 'assets/FONT-LICENSE.txt');
for (const script of ['arabic', 'latin']) {
  await copyFile(`node_modules/@fontsource/vazirmatn/files/vazirmatn-${script}-400-normal.woff2`, `assets/vazirmatn-${script}.woff2`);
  await copyFile(`node_modules/@fontsource/vazirmatn/files/vazirmatn-${script}-700-normal.woff2`, `assets/vazirmatn-${script}-bold.woff2`);
}
let css = await readFile('assets/style.css', 'utf8');
for (const match of [...css.matchAll(/url\('\.\/(.*?)'\)/g)]) {
  const font = await readFile(`assets/${match[1]}`);
  css = css.replace(match[0], `url('data:font/woff2;base64,${font.toString('base64')}')`);
}
const script = (await readFile('assets/app.js', 'utf8')).replace(/<\/script/gi, '<\\/script');
const template = await readFile('src/index.html', 'utf8');
const html = template.replace('<!-- APP_STYLES -->', () => `<style>${css}</style>`).replace('<!-- APP_SCRIPT -->', () => `<script>${script}</script>`);
await writeFile('index.html', html);
console.log('Self-contained HTML and static application assets prepared.');
