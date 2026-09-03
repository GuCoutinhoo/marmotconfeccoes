import { createClient } from '@supabase/supabase-js';
import { CATALOG_90_PRODUCTS } from '../src/data/catalog90Products';
import { buildProductSupabasePayload } from '../src/lib/supabaseClient';
import * as fs from 'fs';
import * as path from 'path';

const SUPABASE_PROJECT_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://ktmkvysnjfphcfntazut.supabase.co';
const SUPABASE_DEFAULT_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_YaUc--D5wZQnHMnO2Mni8g_5QSnM3Vo';

const supabase = createClient(SUPABASE_PROJECT_URL, SUPABASE_DEFAULT_ANON_KEY, {
  auth: { persistSession: false }
});

async function getAuthenticatedClient() {
  const anonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_YaUc--D5wZQnHMnO2Mni8g_5QSnM3Vo';
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

  if (serviceKey) {
    console.log('[SEED] Usando SUPABASE_SERVICE_ROLE_KEY');
    return createClient(SUPABASE_PROJECT_URL, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });
  }

  const baseClient = createClient(SUPABASE_PROJECT_URL, anonKey, {
    auth: { persistSession: false }
  });

  // Tentar login de admin comum
  const credentialsList = [
    { email: 'admin@marmot.com', password: process.env.ADMIN_PASSWORD || '' },
    { email: 'admin@marmot.com.br', password: process.env.ADMIN_PASSWORD || '' },
    { email: 'contato@marmotstreetwear.com.br', password: process.env.ADMIN_PASSWORD || '' }
  ];

  for (const cred of credentialsList) {
    const { data, error } = await baseClient.auth.signInWithPassword(cred);
    if (!error && data?.session?.access_token) {
      console.log(`[SEED] Autenticado com sucesso como ${cred.email}`);
      return createClient(SUPABASE_PROJECT_URL, anonKey, {
        global: {
          headers: {
            Authorization: `Bearer ${data.session.access_token}`
          }
        },
        auth: { persistSession: false, autoRefreshToken: false }
      });
    }
  }

  console.log('[SEED] Usando cliente anônimo padrão');
  return baseClient;
}

async function main() {
  console.log(`\n======================================================`);
  console.log(`[SEED 90 PRODUCTS] Iniciando cadastro de ${CATALOG_90_PRODUCTS.length} produtos...`);
  console.log(`Supabase URL: ${SUPABASE_PROJECT_URL}`);
  console.log(`======================================================\n`);

  const client = await getAuthenticatedClient();
  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < CATALOG_90_PRODUCTS.length; i++) {
    const prod = CATALOG_90_PRODUCTS[i];
    const payload = buildProductSupabasePayload(prod);

    const { error } = await client
      .from('products')
      .upsert(payload, { onConflict: 'id' });

    if (error) {
      console.error(`❌ [${i + 1}/${CATALOG_90_PRODUCTS.length}] Falha ao inserir ${prod.title}:`, error.message);
      errorCount++;
    } else {
      console.log(`✓ [${i + 1}/${CATALOG_90_PRODUCTS.length}] Inserido/Atualizado: ${prod.title} (${prod.id})`);
      successCount++;
    }
  }

  // 2. Sincronizar também o cache local products.json para consistência
  try {
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    const productsFile = path.join(dataDir, 'products.json');
    fs.writeFileSync(productsFile, JSON.stringify(CATALOG_90_PRODUCTS, null, 2), 'utf-8');
    console.log(`✓ Cache local atualizado em ${productsFile}`);
  } catch (err) {
    console.warn(`Aviso ao escrever cache local:`, err);
  }

  console.log(`\n======================================================`);
  console.log(`[SEED 90 PRODUCTS] Concluído!`);
  console.log(`Sucessos: ${successCount} | Falhas: ${errorCount}`);
  console.log(`Total de produtos no catálogo: ${CATALOG_90_PRODUCTS.length}`);
  console.log(`======================================================\n`);
}

main().catch(err => {
  console.error('Fatal seed error:', err);
  process.exit(1);
});
