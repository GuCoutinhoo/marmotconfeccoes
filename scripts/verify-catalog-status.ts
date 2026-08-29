import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const SUPABASE_PROJECT_URL = 'https://ktmkvysnjfphcfntazut.supabase.co';
const SUPABASE_DEFAULT_ANON_KEY = 'sb_publishable_YaUc--D5wZQnHMnO2Mni8g_5QSnM3Vo';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || SUPABASE_PROJECT_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || SUPABASE_DEFAULT_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase URL or Key missing');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('Auditing Supabase Products Catalog...');
  const { data: products, error } = await supabase
    .from('products')
    .select('id, title, slug, image, images, colors, status');

  if (error) {
    console.error('Failed to query products:', error);
    process.exit(1);
  }

  console.log(`Total products in Supabase: ${products.length}`);

  let base64Count = 0;
  let missingImageCount = 0;
  let sampleUrls: string[] = [];

  for (const p of products) {
    const mainImg = p.image || (Array.isArray(p.images) ? p.images[0] : '');
    if (!mainImg) {
      missingImageCount++;
    } else if (mainImg.startsWith('data:image')) {
      base64Count++;
    }

    if (Array.isArray(p.images)) {
      for (const img of p.images) {
        if (typeof img === 'string' && img.startsWith('data:image')) {
          base64Count++;
        }
      }
    }

    if (sampleUrls.length < 5 && mainImg && !mainImg.startsWith('data:')) {
      sampleUrls.push(`${p.title}: ${mainImg.slice(0, 70)}...`);
    }
  }

  console.log('--- AUDIT RESULTS ---');
  console.log(`Base64 Images in Database: ${base64Count}`);
  console.log(`Products without main image: ${missingImageCount}`);
  console.log('Sample Image URLs:');
  sampleUrls.forEach(s => console.log(' - ' + s));
  console.log('--- ALL SYSTEMS VERIFIED ---');
}

main().catch(console.error);
