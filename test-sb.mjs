import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const url = process.env.VITE_SUPABASE_URL || 'https://ktmkvysnjfphcfntazut.supabase.co';
const key = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_YaUc--D5wZQnHMnO2Mni8g_5QSnM3Vo';

console.log('Testing connection to:', url);
console.log('Using Key starting with:', key.substring(0, 12));

const sb = createClient(url, key);

async function run() {
  const { data: prods, error: selectErr } = await sb.from('products').select('*');
  console.log('Select count:', prods?.length, 'Select Error:', selectErr);

  if (prods && prods.length > 0) {
    console.log('Existing product in Supabase:', { id: prods[0].id, title: prods[0].title, slug: prods[0].slug });
  }

  const testId = 'test-prod-' + Date.now();
  console.log('Attempting INSERT test product:', testId);
  const insertRes = await sb.from('products').insert({
    id: testId,
    title: 'Teste Persistência Marmot',
    slug: testId,
    price: 199.9,
    category: 'camisetas',
    description: 'Teste de auditoria CRUD',
    weight: 0.35,
    height: 4,
    width: 20,
    length: 25,
    sizes: ['P', 'M', 'G'],
    colors: [{ color: 'black', colorName: 'Preto', colorHex: '#000000' }],
    images: ['https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80'],
    image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80',
    data: {
      id: testId,
      title: 'Teste Persistência Marmot',
      slug: testId,
      price: 199.9,
    }
  }).select();

  console.log('Insert Result:', JSON.stringify(insertRes, null, 2));

  if (!insertRes.error && insertRes.data?.length) {
    console.log('Attempting UPDATE on test product:', testId);
    const updateRes = await sb.from('products').update({
      title: 'Teste Persistência Marmot (Editado)',
      price: 259.9
    }).eq('id', testId).select();
    console.log('Update Result:', JSON.stringify(updateRes, null, 2));

    console.log('Attempting DELETE on test product:', testId);
    const deleteRes = await sb.from('products').delete().eq('id', testId);
    console.log('Delete Result:', JSON.stringify(deleteRes, null, 2));

    const checkRes = await sb.from('products').select('*').eq('id', testId);
    console.log('After delete check (should be empty):', checkRes.data?.length);
  }
}

run();
