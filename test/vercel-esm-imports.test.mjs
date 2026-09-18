import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

test('a Function da Vercel usa especificadores ESM explícitos para módulos locais', async () => {
  const source = await fs.readFile(path.join(process.cwd(), 'api', 'index.ts'), 'utf8');

  assert.match(source, /from '\.\.\/src\/server\/infinitePayClient\.js';/);
  assert.match(source, /from '\.\.\/src\/server\/runtime-flags\.js';/);
  assert.doesNotMatch(source, /from '\.\.\/src\/server\/(?:infinitePayClient|runtime-flags)';/);
});
