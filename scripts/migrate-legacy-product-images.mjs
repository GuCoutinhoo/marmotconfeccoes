import 'dotenv/config';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

const bucket = 'product-images';
const root = process.cwd();
const url = String(process.env.SUPABASE_URL || '').trim();
const serviceRole = String(process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();

if (!url || !serviceRole) {
  throw new Error('SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórias.');
}

const supabase = createClient(url, serviceRole, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
});

const isLegacy = (value) => typeof value === 'string' && /^\/?uploads\//i.test(value);

async function persistLegacyImage(productId, legacyUrl) {
  const relative = legacyUrl.replace(/^\//, '');
  const absolute = path.resolve(root, 'public', relative);
  const publicRoot = path.resolve(root, 'public');
  if (!absolute.startsWith(`${publicRoot}${path.sep}`)) throw new Error('Caminho local inválido.');

  const bytes = await fs.readFile(absolute);
  const extension = path.extname(absolute).toLowerCase();
  const contentTypes = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.gif': 'image/gif' };
  const contentType = contentTypes[extension];
  if (!contentType) throw new Error(`Formato não permitido: ${extension}`);

  const digest = crypto.createHash('sha256').update(bytes).digest('hex');
  const storagePath = `products/${String(productId).replace(/[^a-zA-Z0-9_-]/g, '_')}/legacy/${digest.slice(0, 24)}${extension === '.jpeg' ? '.jpg' : extension}`;
  const storage = supabase.storage.from(bucket);
  const { data: existing, error: listError } = await storage.list(path.posix.dirname(storagePath), {
    search: path.posix.basename(storagePath),
    limit: 2,
  });
  if (listError) throw new Error(`Falha ao consultar Storage: ${listError.message}`);
  if (!existing?.some((entry) => entry.name === path.posix.basename(storagePath))) {
    const { error: uploadError } = await storage.upload(storagePath, bytes, {
      contentType,
      cacheControl: '31536000',
      upsert: false,
    });
    if (uploadError) throw new Error(`Falha no upload: ${uploadError.message}`);
  }
  const { data } = storage.getPublicUrl(storagePath);
  if (!data?.publicUrl?.startsWith('https://')) throw new Error('URL pública persistente não gerada.');
  return data.publicUrl;
}

async function main() {
  const { data: products, error } = await supabase
    .from('products')
    .select('id,image,images,colors')
    .order('id');
  if (error || !Array.isArray(products)) throw new Error(`Falha ao consultar produtos: ${error?.message || 'resposta inválida'}`);

  let updated = 0;
  let migratedImages = 0;
  const failures = [];

  for (const product of products) {
    try {
      const replacements = new Map();
      const candidates = new Set([
        product.image,
        ...(Array.isArray(product.images) ? product.images : []),
        ...(Array.isArray(product.colors)
          ? product.colors.flatMap((color) => [color?.image, color?.featuredImage, ...(Array.isArray(color?.images) ? color.images : [])])
          : []),
      ].filter(isLegacy));
      if (candidates.size === 0) continue;

      for (const candidate of candidates) {
        replacements.set(candidate, await persistLegacyImage(product.id, candidate));
        migratedImages += 1;
      }

      const replace = (value) => replacements.get(value) || value;
      const nextImage = replace(product.image);
      const nextImages = (Array.isArray(product.images) ? product.images : []).map(replace);
      const nextColors = (Array.isArray(product.colors) ? product.colors : []).map((color) => ({
        ...color,
        image: replace(color?.image),
        featuredImage: replace(color?.featuredImage),
        images: (Array.isArray(color?.images) ? color.images : []).map(replace),
      }));

      const { data: confirmation, error: updateError } = await supabase
        .from('products')
        .update({ image: nextImage, images: nextImages, colors: nextColors, data: null, updated_at: new Date().toISOString() })
        .eq('id', product.id)
        .select('id')
        .single();
      if (updateError || confirmation?.id !== product.id) throw new Error(updateError?.message || 'Atualização não confirmada.');
      updated += 1;
      console.log(`[MIGRATED] ${product.id}: ${candidates.size} imagem(ns)`);
    } catch (migrationError) {
      failures.push({ productId: product.id, error: migrationError?.message || String(migrationError) });
      console.error(`[FAILED] ${product.id}: ${migrationError?.message || migrationError}`);
    }
  }

  console.log(`[SUMMARY] products=${products.length} updated=${updated} images=${migratedImages} failures=${failures.length}`);
  if (failures.length > 0) process.exitCode = 1;
}

await main();
