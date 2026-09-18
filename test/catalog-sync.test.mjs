import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const root = process.cwd();

async function readJson(relativePath) {
  return JSON.parse(await fs.readFile(path.join(root, relativePath), 'utf8'));
}

test('fixture canônico contém exatamente os 11 shorts e 22 imagens esperados', async () => {
  const raw = await readJson('data/store_products.json');
  const products = (Array.isArray(raw) ? raw : raw.products || [])
    .filter((product) => String(product.id).startsWith('prod-sho-'))
    .sort((left, right) => left.id.localeCompare(right.id));
  const expectedTitles = [
    'Shorts Baggy Denim',
    'Shorts Cargo Baggy',
    'Shorts Denim Washed',
    'Shorts Distressed',
    'Shorts Flame',
    'Shorts Graphic',
    'Shorts Mesh Sport',
    'Shorts Minimal',
    'Shorts Panel',
    'Shorts Parachute',
    'Shorts Tech Nylon',
  ];

  assert.equal(products.length, 11);
  assert.deepEqual(products.map((product) => product.title), expectedTitles);
  assert.deepEqual(
    products.map((product) => product.id),
    expectedTitles.map((_, index) => `prod-sho-${String(index + 1).padStart(3, '0')}`),
  );
  assert.deepEqual(
    products.map((product) => product.sku),
    expectedTitles.map((_, index) => `MM-SHO-${String(index + 1).padStart(3, '0')}`),
  );

  const images = products.flatMap((product) => product.images || []);
  assert.equal(new Set(images).size, 22);
  for (const image of images) {
    const filePath = path.join(root, 'public', image.replace(/^\/+/, ''));
    const file = await fs.readFile(filePath);
    assert.ok(file.length > 8, `${image} deve existir e possuir conteúdo`);
    assert.deepEqual([...file.subarray(0, 8)], [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  }
});

test('pipeline de produção exige service role e mantém sync explícito', async () => {
  const [script, packageJson, legacyUpdate, legacyReplace] = await Promise.all([
    fs.readFile(path.join(root, 'scripts', 'sync-shorts-catalog.mjs'), 'utf8'),
    readJson('package.json'),
    fs.readFile(path.join(root, 'scripts', 'update-shorts-catalog.mjs'), 'utf8'),
    fs.readFile(path.join(root, 'scripts', 'replace-shorts.mjs'), 'utf8'),
  ]);

  assert.match(script, /SUPABASE_SERVICE_ROLE_KEY/);
  assert.doesNotMatch(script, /VITE_SUPABASE_ANON_KEY|SUPABASE_ANON_KEY/);
  assert.equal(packageJson.scripts['catalog:sync'], 'node scripts/sync-shorts-catalog.mjs --apply');
  assert.equal(packageJson.scripts['catalog:sync:dry-run'], 'node scripts/sync-shorts-catalog.mjs --dry-run');
  assert.match(legacyUpdate, /LEGACY_SCRIPT_DISABLED/);
  assert.match(legacyReplace, /LEGACY_SCRIPT_DISABLED/);
});

test('as oito categorias canônicas permanecem na fixture de migração', async () => {
  const raw = await readJson('data/store_categories.json');
  const categories = Array.isArray(raw) ? raw : raw.categories || [];
  assert.deepEqual(
    categories.map((category) => category.id),
    ['camisetas', 'moletons', 'jaquetas', 'calcas', 'cargos', 'shorts', 'tenis', 'acessorios'],
  );
});
