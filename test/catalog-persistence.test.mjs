import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const api = fs.readFileSync(path.join(root, 'api/index.ts'), 'utf8');
const context = fs.readFileSync(path.join(root, 'src/context/StoreContext.tsx'), 'utf8');
const client = fs.readFileSync(path.join(root, 'src/lib/supabaseClient.ts'), 'utf8');

test('catalog production flow has Supabase-only authoritative mutations', () => {
  assert.match(api, /fetchAllProductsFromAuthoritativeStore/);
  assert.match(api, /getRequiredSupabaseAdminClient\('createProduct'\)/);
  assert.match(api, /PRODUCT_STORE_NOT_CONFIGURED: o Supabase é obrigatório para criar produtos/);
  assert.match(api, /if \(this\.mode === 'supabase' && !IS_TEST_MODE\) \{\s*return;/);
  assert.doesNotMatch(context, /createProductInSupabase|updateProductInSupabase|deleteProductInSupabase|updateProductStockInSupabase/);
  assert.doesNotMatch(client, /fetchProductsFromSupabaseDirect/);
  assert.doesNotMatch(api, /pCat === 'acessorios'|activeCategorySlugs/);
});

test('React state changes only after product API confirmation', () => {
  assert.match(context, /if \(!res\.ok\)[\s\S]*?const created: Product = await res\.json\(\);[\s\S]*?setProducts/);
  assert.match(context, /const persisted: Product = await res\.json\(\);[\s\S]*?setProducts/);
  assert.match(context, /if \(!res\.ok\)[\s\S]*?setProducts\(\(prev\) => prev\.filter/);
  assert.doesNotMatch(context, /fetch\(`\/api\/products\/\$\{encodeURIComponent\(id\)\}\/stock`[\s\S]{0,350}\.catch\(\(\) => \{\}\)/);
});

test('static mappings and hardcoded shorts are absent from runtime catalog path', () => {
  assert.doesNotMatch(api, /getCamisetaImageMapping|getJaquetaImageMapping|buildShortsProducts/);
  assert.doesNotMatch(client, /getCamisetaImageMapping|getJaquetaImageMapping|getShortsImageMapping|buildShortsProducts|applyJaquetaMapping/);
  assert.doesNotMatch(context, /localStorage\.setItem\(['"]@marmot_cached_products|buildShortsProducts/);
});

test('canonical schema guards legacy JSONB and invalid monetary or stock values', () => {
  const migration = fs.readFileSync(
    path.join(root, 'supabase/migrations/20260914120000_canonical_catalog_persistence.sql'),
    'utf8',
  );
  assert.match(migration, /products_data_must_be_null/);
  assert.match(migration, /products_price_nonnegative/);
  assert.match(migration, /products_stock_nonnegative/);
  assert.match(migration, /products_set_updated_at/);
});

test('browser roles cannot mutate catalog tables directly', () => {
  const migration = fs.readFileSync(
    path.join(root, 'supabase/migrations/20260914121000_lock_catalog_mutations_to_backend.sql'),
    'utf8',
  );
  assert.match(migration, /revoke insert, update, delete, truncate on public\.products from anon, authenticated/);
  assert.match(migration, /grant select on public\.products, public\.categories to anon, authenticated/);
});

test('catalog RLS and category JSONB have one canonical representation', () => {
  const policies = fs.readFileSync(
    path.join(root, 'supabase/migrations/20260915171500_consolidate_catalog_read_policies.sql'),
    'utf8',
  );
  const categoryJson = fs.readFileSync(
    path.join(root, 'supabase/migrations/20260915172500_remove_redundant_category_jsonb.sql'),
    'utf8',
  );
  assert.match(policies, /Catalog products are publicly readable/);
  assert.match(policies, /Catalog categories are publicly readable/);
  assert.match(categoryJson, /CATEGORY_LEGACY_DATA_DIVERGED: migration aborted/);
  assert.match(categoryJson, /categories_legacy_data_must_be_null/);
});
