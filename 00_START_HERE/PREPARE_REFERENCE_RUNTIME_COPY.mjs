import { mkdirSync, readdirSync, copyFileSync, existsSync } from 'node:fs';
import { dirname, resolve, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const packageRoot = resolve(here, '..');
const source = resolve(packageRoot, '05_RUNTIME_REPOSITORIES');
const destination = resolve(packageRoot, '04_REFERENCE_IMPLEMENTATION/recommendation-system-v1/data/repository');

if (!existsSync(source)) throw new Error(`Runtime repository not found: ${source}`);
mkdirSync(destination, { recursive: true });
const csvs = readdirSync(source).filter((name) => name.toLowerCase().endsWith('.csv')).sort();
for (const name of csvs) copyFileSync(resolve(source, name), resolve(destination, name));
console.log(`Prepared ${csvs.length} reference repository CSV files in ${destination}`);
