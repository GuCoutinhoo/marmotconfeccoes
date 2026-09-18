import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

test('workspace efêmero aplica o schema base antes das migrations datadas', async () => {
  const workdir = await fs.mkdtemp(path.join(os.tmpdir(), 'marmot-ci-migrations-'));

  try {
    const result = spawnSync(process.execPath, ['scripts/prepare-ci-migrations.mjs'], {
      cwd: process.cwd(),
      env: { ...process.env, SUPABASE_WORKDIR: workdir },
      encoding: 'utf8',
    });
    assert.equal(result.status, 0, result.stderr || result.stdout);

    const files = (await fs.readdir(path.join(workdir, 'supabase', 'migrations'))).sort();
    assert.equal(files[0], '20260101000000_000_local_baseline_compatibility.sql');
    assert.equal(files.length, 18);
    assert.equal(new Set(files.map((file) => file.slice(0, 14))).size, files.length);

    const baseline = await fs.readFile(path.join(workdir, 'supabase', 'migrations', files[0]), 'utf8');
    const categoriesDefinition = baseline.match(/CREATE TABLE IF NOT EXISTS public\.categories \(([\s\S]*?)\);/)?.[1] || '';
    assert.match(categoriesDefinition, /data JSONB/, 'baseline deve reproduzir a coluna legada auditada pela migration final');

    const coreIndex = files.findIndex((file) => file.endsWith('20260301_001_core_schema.sql'));
    const fulfillmentIndex = files.findIndex((file) => file.endsWith('20260907140252_complete_shipping_fulfillment.sql'));
    assert.ok(coreIndex > 0, 'core_schema deve existir após o baseline');
    assert.ok(fulfillmentIndex > coreIndex, 'shipping_fulfillment não pode executar antes da criação de orders');
  } finally {
    await fs.rm(workdir, { recursive: true, force: true });
  }
});
