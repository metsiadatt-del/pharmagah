import { build } from 'esbuild';
import { copyFile, readFile, writeFile } from 'node:fs/promises';
await build({ entryPoints: ['src/app.js'], bundle: true, minify: true, outfile: 'assets/app.js', format: 'esm', target: ['es2022'], legalComments: 'eof' });
await writeFile('assets/app.js', (await readFile('assets/app.js', 'utf8')).replace(/[ \t]+$/gm, ''));
await copyFile('src/style.css', 'assets/style.css');
await copyFile('node_modules/@fontsource/vazirmatn/LICENSE', 'assets/FONT-LICENSE.txt');
for (const script of ['arabic', 'latin']) {
  await copyFile(`node_modules/@fontsource/vazirmatn/files/vazirmatn-${script}-400-normal.woff2`, `assets/vazirmatn-${script}.woff2`);
  await copyFile(`node_modules/@fontsource/vazirmatn/files/vazirmatn-${script}-700-normal.woff2`, `assets/vazirmatn-${script}-bold.woff2`);
}
console.log('Static application assets prepared.');
