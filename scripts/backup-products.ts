import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://ktmkvysnjfphcfntazut.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_YaUc--D5wZQnHMnO2Mni8g_5QSnM3Vo';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function backup() {
  console.log('[BACKUP] Iniciando backup de segurança dos produtos...');
  const { data: products, error } = await supabase.from('products').select('*');
  if (error) {
    console.error('[BACKUP ERROR]:', error);
    process.exit(1);
  }

  const backupDir = path.join(process.cwd(), 'backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const filename = `products-backup-${Date.now()}.json`;
  const backupPath = path.join(backupDir, filename);
  fs.writeFileSync(backupPath, JSON.stringify(products, null, 2), 'utf-8');

  console.log(`[BACKUP SUCCESS] ${products.length} produtos salvos com sucesso em: ${backupPath}`);
  console.log(`Tamanho do arquivo de backup: ${(fs.statSync(backupPath).size / (1024 * 1024)).toFixed(2)} MB`);
}

backup().catch(console.error);
