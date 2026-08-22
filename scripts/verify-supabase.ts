import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ktmkvysnjfphcfntazut.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_YaUc--D5wZQnHMnO2Mni8g_5QSnM3Vo';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testTables() {
  console.log('--- TESTANDO CONEXÃO COM O SUPABASE ---');
  console.log('URL:', SUPABASE_URL);

  const tables = [
    'profiles',
    'categories',
    'products',
    'orders',
    'coupons',
    'favorites',
    'audit_logs',
    'store_settings'
  ];

  for (const table of tables) {
    try {
      const { data, error, count } = await supabase.from(table).select('*', { count: 'exact', head: true });
      if (error) {
        console.log(`❌ Tabela [${table}]: Erro -> ${error.message} (Código: ${error.code})`);
      } else {
        console.log(`✅ Tabela [${table}]: Conectada e Acessível! (Registros: ${count ?? 0})`);
      }
    } catch (err: any) {
      console.log(`❌ Tabela [${table}]: Exceção -> ${err.message}`);
    }
  }

  // Test Auth Service
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.log(`⚠️ Supabase Auth:`, error.message);
    } else {
      console.log(`✅ Supabase Auth: Serviço de Autenticação Ativo e Respondendo!`);
    }
  } catch (err: any) {
    console.log(`❌ Supabase Auth: Exceção ->`, err.message);
  }

  console.log('--- TESTE CONCLUÍDO ---');
}

testTables();
