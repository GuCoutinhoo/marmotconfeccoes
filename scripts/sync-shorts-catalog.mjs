import 'dotenv/config';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';

const ROOT = process.cwd();
const PRODUCTS_FIXTURE = path.join(ROOT, 'data', 'store_products.json');
const CATEGORIES_FIXTURE = path.join(ROOT, 'data', 'store_categories.json');
const PUBLIC_DIR = path.join(ROOT, 'public');
const BACKUP_ROOT = path.join(ROOT, 'catalog-backups');
const BUCKET = 'product-images';
const APPLY = process.argv.includes('--apply');
const EXPECTED_IDS = Array.from({ length: 11 }, (_, index) => `prod-sho-${String(index + 1).padStart(3, '0')}`);
const EXCESS_IDS = ['prod-sho-012', 'prod-sho-013', 'prod-sho-014', 'prod-sho-015'];
const ALL_SHORT_IDS = [...EXPECTED_IDS, ...EXCESS_IDS];
const EXPECTED_CATEGORY_IDS = ['camisetas', 'moletons', 'jaquetas', 'calcas', 'cargos', 'shorts', 'tenis', 'acessorios'];
const FORBIDDEN_IMAGE_PATTERNS = [/^\//, /^data:/i, /localhost/i, /127\.0\.0\.1/i, /unsplash/i, /\/uploads\//i];
const COMPARE_FIELDS = [
  'id', 'slug', 'title', 'subtitle', 'description', 'price', 'promo_price', 'category',
  'subcategory', 'collection', 'tags', 'rating', 'review_count', 'stock_count', 'sku',
  'sizes', 'colors', 'image', 'images', 'details', 'care_instructions', 'composition',
  'weight', 'height', 'width', 'length', 'status', 'is_new_release', 'is_best_seller',
  'featured',
];

function fail(message, code = 'CATALOG_SYNC_FAILED') {
  const error = new Error(message);
  error.code = code;
  throw error;
}

function slugify(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function timestampForPath() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

function stableJson(value) {
  if (Array.isArray(value)) return value.map(stableJson);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stableJson(value[key])]));
  }
  return value;
}

function productPayload(product) {
  return {
    id: product.id,
    slug: product.slug,
    title: product.title,
    subtitle: product.subtitle || '',
    description: product.description || '',
    price: Number(product.price),
    promo_price: product.promoPrice ?? null,
    category: product.category,
    subcategory: product.subcategory || '',
    collection: product.collection || '',
    tags: product.tags || [],
    rating: product.rating ?? 5,
    review_count: product.reviewCount ?? 0,
    stock_count: product.stockCount ?? 0,
    sku: product.sku || '',
    sizes: product.sizes || [],
    colors: product.colors || [],
    image: product.image || '',
    images: product.images || [],
    details: product.details || [],
    care_instructions: product.careInstructions || [],
    composition: product.composition || [],
    weight: product.weight ?? 0.35,
    height: product.height ?? 4,
    width: product.width ?? 20,
    length: product.length ?? 25,
    is_new_release: Boolean(product.isNewRelease),
    is_best_seller: Boolean(product.isBestSeller),
    featured: Boolean(product.featured),
    status: product.status || 'active',
    data: null,
    updated_at: new Date().toISOString(),
  };
}

function categoryPayload(category) {
  return {
    id: category.id,
    slug: category.slug,
    name: category.name,
    tagline: category.tagline || '',
    description: category.description || '',
    image: category.image || '',
    subcategories: category.subcategories || [],
    product_count: Number(category.productCount || 0),
    order: Number(category.order || 0),
    active: category.active !== false,
    data: null,
  };
}

function assertHttpsImage(value, label) {
  if (typeof value !== 'string' || !value.startsWith('https://')) fail(`${label} não é uma URL HTTPS persistente.`, 'INVALID_IMAGE_URL');
  if (FORBIDDEN_IMAGE_PATTERNS.some((pattern) => pattern.test(value))) fail(`${label} contém uma referência proibida.`, 'INVALID_IMAGE_URL');
}

function validateProductImages(product) {
  assertHttpsImage(product.image, `${product.id}.image`);
  if (!Array.isArray(product.images) || product.images.length === 0) fail(`${product.id}.images está vazio.`, 'INVALID_PRODUCT_IMAGES');
  product.images.forEach((url, index) => assertHttpsImage(url, `${product.id}.images[${index}]`));
  if (product.image !== product.images[0]) fail(`${product.id}.image precisa ser igual a images[0].`, 'INVALID_MAIN_IMAGE');
  if (!Array.isArray(product.colors) || product.colors.length !== 2) fail(`${product.id} precisa ter exatamente duas variantes.`, 'INVALID_PRODUCT_COLORS');
  product.colors.forEach((color, colorIndex) => {
    assertHttpsImage(color.image, `${product.id}.colors[${colorIndex}].image`);
    assertHttpsImage(color.featuredImage, `${product.id}.colors[${colorIndex}].featuredImage`);
    if (!Array.isArray(color.images) || color.images.length === 0) fail(`${product.id}.colors[${colorIndex}].images está vazio.`, 'INVALID_COLOR_IMAGES');
    color.images.forEach((url, imageIndex) => assertHttpsImage(url, `${product.id}.colors[${colorIndex}].images[${imageIndex}]`));
  });
}

async function readJson(filePath) {
  return JSON.parse(await fs.readFile(filePath, 'utf8'));
}

async function loadDesiredFixtures() {
  const [productsRaw, categoriesRaw] = await Promise.all([readJson(PRODUCTS_FIXTURE), readJson(CATEGORIES_FIXTURE)]);
  const products = (Array.isArray(productsRaw) ? productsRaw : productsRaw.products || [])
    .filter((product) => String(product.id).startsWith('prod-sho-'))
    .sort((left, right) => left.id.localeCompare(right.id));
  const categories = (Array.isArray(categoriesRaw) ? categoriesRaw : categoriesRaw.categories || [])
    .filter((category) => EXPECTED_CATEGORY_IDS.includes(category.id))
    .sort((left, right) => EXPECTED_CATEGORY_IDS.indexOf(left.id) - EXPECTED_CATEGORY_IDS.indexOf(right.id));

  const productIds = products.map((product) => product.id);
  if (JSON.stringify(productIds) !== JSON.stringify(EXPECTED_IDS)) fail(`Fixture de shorts inválida: ${productIds.join(', ')}`, 'INVALID_SHORTS_FIXTURE');
  const categoryIds = categories.map((category) => category.id);
  if (JSON.stringify(categoryIds) !== JSON.stringify(EXPECTED_CATEGORY_IDS)) fail(`Fixture de categorias inválida: ${categoryIds.join(', ')}`, 'INVALID_CATEGORIES_FIXTURE');
  for (const [index, product] of products.entries()) {
    const expectedSku = `MM-SHO-${String(index + 1).padStart(3, '0')}`;
    if (product.sku !== expectedSku || product.category !== 'shorts') fail(`${product.id} possui SKU ou categoria inválida.`, 'INVALID_SHORTS_FIXTURE');
    if (!Array.isArray(product.colors) || product.colors.length !== 2 || !Array.isArray(product.images) || product.images.length !== 2) {
      fail(`${product.id} precisa conter duas imagens e duas variantes.`, 'INVALID_SHORTS_FIXTURE');
    }
  }
  return { products, categories };
}

async function validateLocalImages(products) {
  const files = new Map();
  for (const product of products) {
    for (const localRef of product.images) {
      const fileName = String(localRef).replace(/^\/+/, '');
      const absolutePath = path.join(PUBLIC_DIR, fileName);
      const buffer = await fs.readFile(absolutePath).catch(() => fail(`Imagem ausente: ${fileName}`, 'MISSING_IMAGE'));
      const pngSignature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
      if (buffer.length === 0 || !buffer.subarray(0, 8).equals(pngSignature)) fail(`PNG inválido: ${fileName}`, 'INVALID_IMAGE');
      const metadata = await sharp(buffer).metadata();
      if (metadata.format !== 'png' || !metadata.width || !metadata.height) fail(`Imagem inválida: ${fileName}`, 'INVALID_IMAGE');
      const sha256 = crypto.createHash('sha256').update(buffer).digest('hex');
      files.set(localRef, { localRef, fileName, absolutePath, buffer, sha256, width: metadata.width, height: metadata.height });
    }
  }
  if (files.size !== 22) fail(`Esperadas 22 imagens únicas; encontradas ${files.size}.`, 'INVALID_IMAGE_COUNT');
  return files;
}

async function auditReferences(supabase, productIds) {
  const result = {};
  for (const [table, column] of [
    ['order_items', 'product_id'],
    ['cart_items', 'product_id'],
    ['favorites', 'product_id'],
    ['product_reviews', 'product_id'],
    ['inventory_movements', 'product_id'],
  ]) {
    const { data, error, count } = await supabase.from(table).select(`id,${column}`, { count: 'exact' }).in(column, productIds);
    if (error) fail(`Falha ao auditar ${table}: ${error.message}`, 'REFERENCE_AUDIT_FAILED');
    result[table] = { count: count ?? data?.length ?? 0, ids: (data || []).map((row) => row.id) };
  }
  for (const table of ['orders', 'returns']) {
    const { data, error } = await supabase.from(table).select('id,items');
    if (error) fail(`Falha ao auditar ${table}: ${error.message}`, 'REFERENCE_AUDIT_FAILED');
    const referenced = (data || []).filter((row) => Array.isArray(row.items) && row.items.some((item) => productIds.includes(item.productId || item.product_id || item.id)));
    result[table] = { count: referenced.length, ids: referenced.map((row) => row.id) };
  }
  result.total = Object.values(result).reduce((sum, value) => sum + (typeof value?.count === 'number' ? value.count : 0), 0);
  return result;
}

async function uploadImages(supabase, products, files) {
  const storage = supabase.storage.from(BUCKET);
  const urlByLocalRef = new Map();
  const objects = [];
  for (const product of products) {
    for (const [index, localRef] of product.images.entries()) {
      const file = files.get(localRef);
      const color = product.colors[index];
      const objectName = `${slugify(color.color || color.colorName)}-${file.sha256.slice(0, 16)}.png`;
      const storagePath = `products/${product.id}/${objectName}`;
      if (APPLY) {
        const { error } = await storage.upload(storagePath, file.buffer, {
          contentType: 'image/png',
          cacheControl: '31536000',
          upsert: true,
        });
        if (error) fail(`Falha no upload de ${file.fileName}: ${error.message}`, 'STORAGE_UPLOAD_FAILED');
      }
      const { data } = storage.getPublicUrl(storagePath);
      if (!data?.publicUrl?.startsWith('https://')) fail(`URL pública inválida para ${storagePath}.`, 'INVALID_PUBLIC_URL');
      urlByLocalRef.set(localRef, data.publicUrl);
      objects.push({ productId: product.id, localFile: file.fileName, storagePath, publicUrl: data.publicUrl, sha256: file.sha256, width: file.width, height: file.height });
    }
  }
  if (objects.length !== 22) fail(`Esperados 22 uploads; preparados ${objects.length}.`, 'INVALID_UPLOAD_COUNT');
  return { urlByLocalRef, objects };
}

function buildDesiredProducts(products, urlByLocalRef) {
  return products.map((product) => {
    const images = product.images.map((localRef) => urlByLocalRef.get(localRef));
    const colors = product.colors.map((color) => {
      const localRefs = Array.isArray(color.images) && color.images.length > 0 ? color.images : [color.featuredImage || color.image];
      const colorImages = localRefs.map((localRef) => urlByLocalRef.get(localRef));
      if (colorImages.some((url) => !url)) fail(`Não foi possível mapear imagens da variante ${product.id}/${color.color}.`, 'IMAGE_MAPPING_FAILED');
      return { ...color, image: colorImages[0], featuredImage: colorImages[0], images: colorImages };
    });
    const desired = { ...product, image: images[0], images, colors };
    validateProductImages(desired);
    return desired;
  });
}

function compareProducts(desiredPayloads, actualRows) {
  const actualById = new Map(actualRows.map((row) => [row.id, row]));
  const differences = [];
  for (const desired of desiredPayloads) {
    const actual = actualById.get(desired.id);
    if (!actual) {
      differences.push({ id: desired.id, field: 'row', expected: 'present', actual: 'missing' });
      continue;
    }
    for (const field of COMPARE_FIELDS) {
      if (JSON.stringify(stableJson(desired[field])) !== JSON.stringify(stableJson(actual[field]))) {
        differences.push({ id: desired.id, field, expected: desired[field], actual: actual[field] });
      }
    }
  }
  return differences;
}

async function verifyStorageObjects(supabase, objects) {
  const storage = supabase.storage.from(BUCKET);
  const verified = [];
  for (const object of objects) {
    const folder = path.posix.dirname(object.storagePath);
    const name = path.posix.basename(object.storagePath);
    const { data, error } = await storage.list(folder, { limit: 100, search: name });
    if (error || !(data || []).some((entry) => entry.name === name)) fail(`Objeto não confirmado no Storage: ${object.storagePath}`, 'STORAGE_VERIFY_FAILED');
    if (APPLY) {
      const response = await fetch(object.publicUrl, { method: 'HEAD' });
      if (!response.ok) fail(`URL pública indisponível (${response.status}): ${object.storagePath}`, 'PUBLIC_URL_VERIFY_FAILED');
    }
    verified.push(object.storagePath);
  }
  return verified;
}

async function restoreDatabase(supabase, snapshot) {
  await stageProductSlugs(supabase, snapshot.products.map((product) => product.id), 'rollback');
  const { error: productError } = await supabase.from('products').upsert(snapshot.products, { onConflict: 'id' });
  const { error: categoryError } = await supabase.from('categories').upsert(snapshot.categories, { onConflict: 'id' });
  if (productError || categoryError) fail(`Rollback incompleto: ${productError?.message || categoryError?.message}`, 'ROLLBACK_FAILED');
}

async function stageProductSlugs(supabase, productIds, operation) {
  const nonce = crypto.randomBytes(8).toString('hex');
  for (const productId of productIds) {
    const temporarySlug = `catalog-sync-${operation}-${nonce}-${productId}`;
    const { error } = await supabase.from('products').update({ slug: temporarySlug }).eq('id', productId);
    if (error) fail(`Falha ao preparar slug temporário de ${productId}: ${error.message}`, 'SLUG_STAGING_FAILED');
  }
}

async function main() {
  const supabaseUrl = String(process.env.SUPABASE_URL || '').trim();
  const serviceRoleKey = String(process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
  if (!supabaseUrl) fail('SUPABASE_URL não configurada.', 'SUPABASE_URL_MISSING');
  if (!serviceRoleKey) fail('SUPABASE_SERVICE_ROLE_KEY não configurada.', 'SUPABASE_SERVICE_ROLE_KEY_MISSING');

  const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
  const { products: fixtureProducts, categories: fixtureCategories } = await loadDesiredFixtures();
  const localImages = await validateLocalImages(fixtureProducts);
  const [{ data: currentShorts, error: shortsError }, { data: currentCategories, error: categoriesError }, { data: buckets, error: bucketsError }] = await Promise.all([
    supabase.from('products').select('*').in('id', ALL_SHORT_IDS).order('id'),
    supabase.from('categories').select('*').order('id'),
    supabase.storage.listBuckets(),
  ]);
  if (shortsError) fail(`Falha ao ler shorts: ${shortsError.message}`, 'SHORTS_READ_FAILED');
  if (categoriesError) fail(`Falha ao ler categorias: ${categoriesError.message}`, 'CATEGORIES_READ_FAILED');
  if (bucketsError) fail(`Falha ao listar buckets: ${bucketsError.message}`, 'BUCKET_READ_FAILED');
  const bucket = (buckets || []).find((item) => item.name === BUCKET);
  if (!bucket || !bucket.public) fail(`Bucket público ${BUCKET} não está disponível.`, 'BUCKET_NOT_READY');

  const initialReferences = await auditReferences(supabase, ALL_SHORT_IDS);
  if (initialReferences.total > 0) fail(`Migração abortada: ${initialReferences.total} referência(s) comerciais aos shorts atuais.`, 'SHORTS_REFERENCED');

  const backupDir = path.join(BACKUP_ROOT, timestampForPath());
  const snapshot = { createdAt: new Date().toISOString(), products: currentShorts || [], categories: currentCategories || [], references: initialReferences };
  await fs.mkdir(backupDir, { recursive: true });
  await fs.writeFile(path.join(backupDir, 'shorts-before.json'), `${JSON.stringify(snapshot, null, 2)}\n`, 'utf8');

  const { urlByLocalRef, objects } = await uploadImages(supabase, fixtureProducts, localImages);
  const desiredProducts = buildDesiredProducts(fixtureProducts, urlByLocalRef);
  const desiredProductPayloads = desiredProducts.map(productPayload);
  const desiredCategoryPayloads = fixtureCategories.map(categoryPayload);
  const report = {
    mode: APPLY ? 'apply' : 'dry-run',
    startedAt: new Date().toISOString(),
    backupDir,
    before: { shorts: currentShorts?.map(({ id, sku, title }) => ({ id, sku, title })) || [], categories: currentCategories?.map(({ id, slug, name }) => ({ id, slug, name })) || [], references: initialReferences },
    storage: { bucket: BUCKET, objects },
    desired: desiredProducts.map(({ id, sku, title }) => ({ id, sku, title })),
  };

  if (!APPLY) {
    report.result = 'DRY_RUN_OK';
    report.finishedAt = new Date().toISOString();
    await fs.writeFile(path.join(backupDir, 'sync-report.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8');
    console.log(`[DRY-RUN] ${desiredProducts.length} produtos, ${objects.length} imagens, ${fixtureCategories.length} categorias validados.`);
    console.log(`Backup lógico: ${backupDir}`);
    return;
  }

  let databaseChanged = false;
  try {
    await verifyStorageObjects(supabase, objects);
    const { data: categoriesUpdated, error: categoryUpsertError } = await supabase.from('categories').upsert(desiredCategoryPayloads, { onConflict: 'id' }).select('id');
    if (categoryUpsertError || categoriesUpdated?.length !== 8) fail(`Upsert de categorias não confirmado: ${categoryUpsertError?.message || categoriesUpdated?.length}`, 'CATEGORY_UPSERT_FAILED');

    databaseChanged = true;
    await stageProductSlugs(supabase, ALL_SHORT_IDS, 'apply');
    const { data: productsUpdated, error: productUpsertError } = await supabase.from('products').upsert(desiredProductPayloads, { onConflict: 'id' }).select('*');
    if (productUpsertError || productsUpdated?.length !== 11) fail(`Upsert de shorts não confirmado: ${productUpsertError?.message || productsUpdated?.length}`, 'PRODUCT_UPSERT_FAILED');

    const differences = compareProducts(desiredProductPayloads, productsUpdated || []);
    if (differences.length > 0) fail(`Divergências após upsert: ${JSON.stringify(differences)}`, 'PRODUCT_VERIFY_FAILED');

    const finalReferences = await auditReferences(supabase, ALL_SHORT_IDS);
    if (finalReferences.total > 0) fail(`Exclusão abortada: ${finalReferences.total} referência(s) encontrada(s) na revalidação.`, 'SHORTS_REFERENCED');
    const { data: deleted, error: deleteError } = await supabase.from('products').delete().in('id', EXCESS_IDS).select('id');
    if (deleteError) fail(`Falha ao remover shorts excedentes: ${deleteError.message}`, 'EXCESS_DELETE_FAILED');

    const { data: finalRows, error: finalReadError } = await supabase.from('products').select('*').eq('category', 'shorts').order('id');
    if (finalReadError) fail(`Falha na leitura final: ${finalReadError.message}`, 'FINAL_READ_FAILED');
    const finalIds = (finalRows || []).map((row) => row.id);
    if (JSON.stringify(finalIds) !== JSON.stringify(EXPECTED_IDS)) fail(`IDs finais incorretos: ${finalIds.join(', ')}`, 'FINAL_ID_MISMATCH');
    const finalDifferences = compareProducts(desiredProductPayloads, finalRows || []);
    if (finalDifferences.length > 0) fail(`Divergências finais: ${JSON.stringify(finalDifferences)}`, 'FINAL_PRODUCT_MISMATCH');
    for (const row of finalRows || []) validateProductImages(row);
    const verifiedStorage = await verifyStorageObjects(supabase, objects);

    const { data: finalCategories, error: finalCategoriesError } = await supabase.from('categories').select('id,slug,name').order('id');
    if (finalCategoriesError) fail(`Falha na verificação de categorias: ${finalCategoriesError.message}`, 'FINAL_CATEGORIES_READ_FAILED');
    const finalCategoryIds = (finalCategories || []).map((category) => category.id).sort();
    if (JSON.stringify(finalCategoryIds) !== JSON.stringify([...EXPECTED_CATEGORY_IDS].sort())) fail(`Categorias finais incorretas: ${finalCategoryIds.join(', ')}`, 'FINAL_CATEGORY_MISMATCH');

    report.after = { shorts: finalRows.map(({ id, sku, title }) => ({ id, sku, title })), categories: finalCategories, storageObjectsVerified: verifiedStorage };
    report.deleted = deleted || [];
    report.result = 'APPLIED_AND_VERIFIED';
  } catch (error) {
    report.result = 'FAILED';
    report.error = { code: error.code || 'CATALOG_SYNC_FAILED', message: error.message };
    if (databaseChanged) {
      await restoreDatabase(supabase, snapshot);
      report.rollback = 'DATABASE_RESTORED';
    }
    throw error;
  } finally {
    report.finishedAt = new Date().toISOString();
    await fs.writeFile(path.join(backupDir, 'sync-report.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  }

  console.log(`[OK] ${report.after.shorts.length} shorts sincronizados, ${report.after.storageObjectsVerified.length} imagens verificadas.`);
  console.log(`[OK] Removidos: ${(report.deleted || []).map((item) => item.id).join(', ') || 'nenhum'}.`);
  console.log(`[OK] Categorias: ${report.after.categories.length}.`);
  console.log(`Backup e relatório: ${backupDir}`);
}

main().catch((error) => {
  console.error(`[CATALOG_SYNC_ERROR:${error.code || 'UNEXPECTED'}] ${error.message}`);
  process.exitCode = 1;
});
