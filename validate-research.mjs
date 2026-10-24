import { readFile } from 'node:fs/promises';
const files = ['research/source-registry.json', 'research/report.schema.json', 'research/search-strategy.json'];
for (const file of files) JSON.parse(await readFile(file, 'utf8'));
const registry = JSON.parse(await readFile(files[0], 'utf8'));
const strategy = JSON.parse(await readFile(files[2], 'utf8'));
if (!registry.connected.some(source => source.status === 'connected')) throw new Error('At least one connected source is required.');
for (const module of Object.keys(strategy.default_page_size)) if (!Number.isInteger(strategy.default_page_size[module]) || strategy.default_page_size[module] < 1) throw new Error(`Invalid page size for ${module}.`);
console.log(`Validated ${files.length} research configuration files.`);
