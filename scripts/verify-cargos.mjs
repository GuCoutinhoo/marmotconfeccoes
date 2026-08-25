import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ktmkvysnjfphcfntazut.supabase.co';
const SUPABASE_KEY = 'sb_publishable_YaUc--D5wZQnHMnO2Mni8g_5QSnM3Vo';

const EXPECTED_MODELS = [
  'Calça Cargo Baggy',
  'Calça Cargo Balloon',
  'Calça Cargo Convertible',
  'Calça Cargo Distressed',
  'Calça Cargo Multi Pocket',
  'Calça Cargo Nylon',
  'Calça Cargo Panel',
  'Calça Cargo Parachute',
  'Calça Cargo Strap',
  'Calça Cargo Tactical',
  'Calça Cargo Washed',
  'Calça Cargo Zip'
];

async function verify() {
  console.log('=== AUDITORIA COMPLETA DE VALIDAÇÃO DOS 12 MODELOS NO SUPABASE ===\n');
  const sb = createClient(SUPABASE_URL, SUPABASE_KEY);

  // 1. Check category Cargos in DB
  const { data: catCargos, error: catErr } = await sb.from('categories').select('*').eq('id', 'cargos').single();
  if (catErr || !catCargos) {
    console.error('ERRO: Categoria Cargos não encontrada no banco:', catErr);
  } else {
    console.log(`✓ Categoria Cargos no banco: ID = ${catCargos.id} | Nome = ${catCargos.name} | Slug = ${catCargos.slug} | Product Count = ${catCargos.product_count}`);
  }

  // 2. Query products in Cargos
  const { data: cargos, error: crgErr } = await sb.from('products').select('*').eq('category', 'cargos').order('title', { ascending: true });
  
  if (crgErr) {
    console.error('ERRO ao buscar calças cargo:', crgErr);
    process.exit(1);
  }

  console.log(`\nTOTAL DE PRODUTOS NA CATEGORIA CARGOS: ${cargos.length} (Esperado: 12)`);
  if (cargos.length !== 12) {
    console.error('ERRO: Quantidade divergente de 12!');
  }

  let allFound = true;
  for (const expected of EXPECTED_MODELS) {
    const found = cargos.find(p => p.title.toLowerCase().trim() === expected.toLowerCase().trim());
    if (found) {
      console.log(`\n✓ [MODELO ENCONTRADO] ${found.title}`);
      console.log(`  - ID: ${found.id}`);
      console.log(`  - Slug: ${found.slug}`);
      console.log(`  - Categoria: ${found.category}`);
      console.log(`  - Subcategoria: ${found.subcategory}`);
      console.log(`  - Preço: R$ ${found.price}`);
      console.log(`  - Tags: ${JSON.stringify(found.tags)}`);
      console.log(`  - Descrição no Banco:\n    ${found.description.replace(/\n/g, '\n    ')}`);
    } else {
      console.error(`✗ [FALTANDO]: ${expected}`);
      allFound = false;
    }
  }

  // 3. Check for duplicates
  const titles = cargos.map(c => c.title);
  const uniqueTitles = new Set(titles);
  console.log(`\nValidação de unicidade: ${uniqueTitles.size} únicos de ${titles.length} registros.`);
  if (uniqueTitles.size !== 12) {
    console.error('ERRO: Existem duplicatas!');
  } else {
    console.log('✓ Nenhuma duplicata encontrada.');
  }

  // 4. Check category Calças
  const { data: calcas } = await sb.from('products').select('id, title, slug').eq('category', 'calcas');
  console.log(`\nTotal de calças na categoria "calcas": ${calcas?.length}`);

  // 5. Total catalog count
  const { data: allProds } = await sb.from('products').select('id, category');
  console.log(`Total geral de produtos no catálogo Supabase: ${allProds?.length}`);

  if (allFound && cargos.length === 12 && uniqueTitles.size === 12) {
    console.log('\n=============================================');
    console.log('>>> TODOS OS 12 MODELOS VALIDADOS COM SUCESSO NO BANCO DE DADOS <<<');
    console.log('=============================================\n');
  }
}

verify();
