import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://ktmkvysnjfphcfntazut.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_YaUc--D5wZQnHMnO2Mni8g_5QSnM3Vo';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function main() {
  console.log('[AUDIT] Conectando ao Supabase:', SUPABASE_URL);

  const authRes = await supabase.auth.signInWithPassword({
    email: 'admin@marmot.com',
    password: process.env.ADMIN_PASSWORD || ''
  });
  console.log('[AUTH] Admin login session:', !!authRes.data?.session);

  // 1. List Storage Buckets
  const { data: buckets, error: bucketErr } = await supabase.storage.listBuckets();
  console.log('[STORAGE] Buckets existentes:', buckets, 'Error:', bucketErr);

  // 2. Fetch all products
  const { data: products, error: prodErr } = await supabase.from('products').select('*');
  if (prodErr) {
    console.error('[PRODUCTS] Erro ao buscar produtos:', prodErr);
    return;
  }

  console.log(`[PRODUCTS] Total de produtos encontrados no Supabase: ${products.length}`);

  let totalJsonBytes = 0;
  let base64InImage = 0;
  let base64InImages = 0;
  let base64InColors = 0;
  const affected: any[] = [];

  for (const p of products) {
    const jsonStr = JSON.stringify(p);
    totalJsonBytes += jsonStr.length;

    let hasB64 = false;
    const fields: string[] = [];

    if (typeof p.image === 'string' && p.image.startsWith('data:image')) {
      base64InImage++;
      hasB64 = true;
      fields.push('image');
    }

    if (Array.isArray(p.images)) {
      const b64Count = p.images.filter(x => typeof x === 'string' && x.startsWith('data:image')).length;
      if (b64Count > 0) {
        base64InImages += b64Count;
        hasB64 = true;
        fields.push(`images(${b64Count})`);
      }
    }

    if (Array.isArray(p.colors)) {
      let cB64Count = 0;
      for (const c of p.colors) {
        if (typeof c.image === 'string' && c.image.startsWith('data:image')) cB64Count++;
        if (typeof c.featuredImage === 'string' && c.featuredImage.startsWith('data:image')) cB64Count++;
        if (Array.isArray(c.images)) {
          cB64Count += c.images.filter(x => typeof x === 'string' && x.startsWith('data:image')).length;
        }
      }
      if (cB64Count > 0) {
        base64InColors += cB64Count;
        hasB64 = true;
        fields.push(`colors(${cB64Count})`);
      }
    }

    if (hasB64) {
      affected.push({
        id: p.id,
        title: p.title,
        category: p.category,
        fields,
        sizeKb: Math.round(jsonStr.length / 1024),
      });
    }
  }

  console.log('----------------------------------------------------');
  console.log(`[RELATÓRIO DE AUDITORIA]`);
  console.log(`Total de produtos: ${products.length}`);
  console.log(`Tamanho total do JSON: ${(totalJsonBytes / (1024 * 1024)).toFixed(2)} MB`);
  console.log(`Produtos com Base64: ${affected.length}`);
  console.log(`Ocorrências em 'image': ${base64InImage}`);
  console.log(`Ocorrências em 'images[]': ${base64InImages}`);
  console.log(`Ocorrências em 'colors[]': ${base64InColors}`);
  console.log(`Lista de produtos afetados:`);
  for (const item of affected) {
    console.log(`  - [${item.id}] "${item.title}" (${item.category}): ${item.fields.join(', ')} -> ~${item.sizeKb} KB`);
  }
  console.log('----------------------------------------------------');
}

main().catch(console.error);
