import 'dotenv/config';
import assert from 'node:assert/strict';
import { createClient } from '@supabase/supabase-js';
import { DatabaseManager } from '../api/index.ts';

const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
const id = `persistence-test-${suffix}`;
const slug = `persistence-test-${suffix}`;
const categoryId = `category-persistence-test-${suffix}`;
const serviceClient = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
});

const productA = {
  id,
  slug,
  title: 'Persistência A',
  subtitle: 'Estado A',
  description: 'Descrição A',
  price: 101.11,
  promoPrice: 99.01,
  category: 'camisetas',
  subcategory: 'Teste A',
  collection: 'QA',
  tags: ['teste-a'],
  rating: 4.2,
  reviewCount: 3,
  stockCount: 7,
  sku: `QA-A-${suffix}`,
  sizes: ['P', 'M'],
  colors: [{ color: 'preto', colorName: 'Preto', colorHex: '#111111', image: 'https://example.com/a.jpg', featuredImage: 'https://example.com/a.jpg', images: ['https://example.com/a.jpg'], stockCount: 7, sizes: ['P', 'M'] }],
  image: 'https://example.com/a.jpg',
  images: ['https://example.com/a.jpg'],
  details: ['Detalhe A'],
  careInstructions: ['Cuidado A'],
  composition: ['Algodão A'],
  weight: 0.31,
  height: 4,
  width: 21,
  length: 26,
  isNewRelease: true,
  isBestSeller: false,
  featured: true,
  status: 'active',
};

const productB = {
  title: 'Persistência B',
  slug: `${slug}-b`,
  subtitle: 'Estado B',
  description: 'Descrição B',
  price: 202.22,
  promoPrice: 188.88,
  category: 'moletons',
  subcategory: 'Teste B',
  collection: 'QA B',
  tags: ['teste-b', 'persistente'],
  rating: 4.8,
  reviewCount: 8,
  stockCount: 9,
  sku: `QA-B-${suffix}`,
  sizes: ['G', 'GG'],
  colors: [{ color: 'azul', colorName: 'Azul', colorHex: '#123456', image: 'https://example.com/b.jpg', featuredImage: 'https://example.com/b.jpg', images: ['https://example.com/b.jpg', 'https://example.com/b2.jpg'], stockCount: 9, sizes: ['G', 'GG'] }],
  image: 'https://example.com/b.jpg',
  images: ['https://example.com/b.jpg', 'https://example.com/b2.jpg'],
  details: ['Detalhe B'],
  careInstructions: ['Cuidado B'],
  composition: ['Algodão B'],
  weight: 0.62,
  height: 6,
  width: 29,
  length: 34,
  isNewRelease: false,
  isBestSeller: true,
  featured: false,
  status: 'active',
};

let db;
try {
  db = new DatabaseManager();
  const created = await db.createProduct(productA);
  assert.equal(created.title, 'Persistência A');

  const updated = await db.updateProduct(id, productB);
  assert.equal(updated.title, 'Persistência B');
  assert.equal(updated.slug, productB.slug);
  assert.deepEqual(updated.images, productB.images);
  assert.deepEqual(JSON.parse(JSON.stringify(updated.colors)), productB.colors);

  const { data: direct, error: directError } = await serviceClient.from('products').select('*').eq('id', id).single();
  assert.ifError(directError);
  assert.equal(direct.title, productB.title);
  assert.equal(Number(direct.price), productB.price);
  assert.equal(Number(direct.rating), productB.rating);
  assert.equal(direct.review_count, productB.reviewCount);
  assert.equal(direct.data, null);

  const coldStart = new DatabaseManager();
  const reloaded = await coldStart.getProductById(id);
  assert.equal(reloaded?.title, productB.title);
  assert.deepEqual(reloaded?.images, productB.images);

  const stockUpdated = await coldStart.updateProductStock(id, 13);
  assert.equal(stockUpdated.stockCount, 13);
  const { data: stockDirect } = await serviceClient.from('products').select('stock_count').eq('id', id).single();
  assert.equal(stockDirect.stock_count, 13);

  const categoryCreated = await db.createCategory({
    id: categoryId,
    slug: categoryId,
    name: 'Categoria temporária de persistência',
    image: 'https://example.com/category.jpg',
    active: false,
  });
  assert.equal(categoryCreated.id, categoryId);
  assert.equal(await db.deleteCategory(categoryId), true);
  const { data: deletedCategory, error: deletedCategoryError } = await serviceClient
    .from('categories')
    .select('id')
    .eq('id', categoryId)
    .maybeSingle();
  assert.ifError(deletedCategoryError);
  assert.equal(deletedCategory, null);

  await assert.rejects(() => db.createProduct({ ...productA, id: `${id}-duplicate`, slug: productB.slug }), /duplicate|unique/i);
  await assert.rejects(() => db.updateProduct(id, { image: '/uploads/not-persistent.jpg', images: ['/uploads/not-persistent.jpg'] }), /PRODUCT_IMAGE_NOT_PERSISTENT/i);
  await assert.rejects(() => db.updateProductStock(id, -1), /PRODUCT_INVALID_STOCK/i);

  const anonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  if (anonKey) {
    const anon = createClient(process.env.SUPABASE_URL, anonKey, { auth: { persistSession: false } });
    const { error: unauthorizedError } = await anon.from('products').update({ title: 'NÃO DEVE SALVAR' }).eq('id', id);
    assert.ok(unauthorizedError, 'Mutation anônima deveria ser rejeitada pela RLS.');

    const originalServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    try {
      process.env.SUPABASE_SERVICE_ROLE_KEY = anonKey;
      const invalidAdminDb = new DatabaseManager();
      await assert.rejects(
        () => invalidAdminDb.getRequiredSupabaseAdminClient('negative credential test'),
        /SUPABASE_SERVICE_ROLE_INVALID_OR_NOT_CONFIGURED/,
      );
    } finally {
      process.env.SUPABASE_SERVICE_ROLE_KEY = originalServiceRoleKey;
    }
  }

  assert.equal(await coldStart.deleteProduct(id), true);
  const afterDeleteColdStart = new DatabaseManager();
  assert.equal(await afterDeleteColdStart.getProductById(id), null);
  const { data: deletedDirect, error: deletedError } = await serviceClient.from('products').select('id').eq('id', id).maybeSingle();
  assert.ifError(deletedError);
  assert.equal(deletedDirect, null);

  console.log('[PASS] product create/read/update/stock/delete persisted through direct query and cold starts');
  console.log('[PASS] category create/delete persisted with the validated administrative client');
  console.log('[PASS] duplicate slug, local image, invalid stock, public mutation and invalid admin credential failed closed');
} finally {
  await serviceClient.from('products').delete().or(`id.eq.${id},id.eq.${id}-duplicate`);
  await serviceClient.from('categories').delete().eq('id', categoryId);
}
