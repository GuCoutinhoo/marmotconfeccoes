import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://ktmkvysnjfphcfntazut.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_YaUc--D5wZQnHMnO2Mni8g_5QSnM3Vo';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testStorage() {
  console.log('[STORAGE TEST] Logging in as admin...');
  const authRes = await supabase.auth.signInWithPassword({
    email: 'admin@marmot.com',
    password: 'marmot'
  });
  console.log('[AUTH] Admin login session:', !!authRes.data?.session);

  // Try creating bucket
  console.log('[STORAGE TEST] Creating bucket product-images...');
  const { data: createData, error: createErr } = await supabase.storage.createBucket('product-images', {
    public: true,
    fileSizeLimit: 10485760, // 10MB
    allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif', 'image/svg+xml']
  });
  console.log('[STORAGE TEST] Create bucket result:', createData, 'Error:', createErr);

  // List buckets again
  const { data: buckets, error: listErr } = await supabase.storage.listBuckets();
  console.log('[STORAGE TEST] Buckets now:', buckets, 'Error:', listErr);

  // Test uploading a small sample buffer
  const sampleBuf = Buffer.from('RIFF....WEBPVP8 ...test', 'utf-8');
  const testPath = `products/test-prod/test-${Date.now()}.txt`;
  const { data: upData, error: upErr } = await supabase.storage.from('product-images').upload(testPath, sampleBuf, {
    contentType: 'text/plain',
    upsert: true
  });
  console.log('[STORAGE TEST] Upload result:', upData, 'Error:', upErr);

  // Get public URL and test fetching it
  const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(testPath);
  console.log('[STORAGE TEST] Public URL:', urlData.publicUrl);

  try {
    const fetchRes = await fetch(urlData.publicUrl);
    console.log('[STORAGE TEST] Fetch public URL status:', fetchRes.status, fetchRes.statusText);
    const text = await fetchRes.text();
    console.log('[STORAGE TEST] Fetched content:', text);
  } catch (fe) {
    console.error('[STORAGE TEST] Fetch error:', fe);
  }

  // Clean up test file
  await supabase.storage.from('product-images').remove([testPath]);
  console.log('[STORAGE TEST] Test file cleaned up.');
}

testStorage().catch(console.error);
