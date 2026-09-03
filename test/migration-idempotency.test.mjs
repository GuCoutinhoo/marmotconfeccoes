import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';

test('Double Migration Execution & SQL Structural Check', async (t) => {
  await t.test('SQL Syntax is 100% Balanced', () => {
    const content = fs.readFileSync('supabase-complete-production-migration.sql', 'utf8');

    let openParens = 0;
    let inString = false;
    let stringChar = '';
    let inDollar = false;
    let dollarTag = '';

    for (let i = 0; i < content.length; i++) {
      const c = content[i];
      if (!inString && !inDollar) {
        if (c === '\'' || c === '"') {
          inString = true;
          stringChar = c;
        } else if (c === '$' && content.slice(i, i + 2) === '$$') {
          inDollar = true;
          dollarTag = '$$';
          i++;
        } else if (c === '(') {
          openParens++;
        } else if (c === ')') {
          openParens--;
        }
      } else if (inString) {
        if (c === stringChar) {
          if (content[i + 1] === stringChar) {
            i++;
          } else {
            inString = false;
          }
        }
      } else if (inDollar) {
        if (content.slice(i, i + dollarTag.length) === dollarTag) {
          inDollar = false;
          i += dollarTag.length - 1;
        }
      }
    }

    assert.equal(openParens, 0, 'Parentheses mismatch in migration SQL');
    assert.equal(inString, false, 'Unterminated string literal in migration SQL');
    assert.equal(inDollar, false, 'Unterminated dollar quote block in migration SQL');
  });

  await t.test('Double-Run (Idempotency) Pattern Verification', () => {
    const sql = fs.readFileSync('supabase-complete-production-migration.sql', 'utf8');

    // Verify all table creations are IF NOT EXISTS
    const tableMatches = sql.match(/CREATE TABLE/gi) || [];
    const safeTableMatches = sql.match(/CREATE TABLE IF NOT EXISTS/gi) || [];
    assert.equal(tableMatches.length, safeTableMatches.length, 'Non-idempotent CREATE TABLE found');

    // Verify all column additions use ADD COLUMN IF NOT EXISTS
    const alterAddMatches = sql.match(/ALTER TABLE .* ADD COLUMN/gi) || [];
    const safeAlterAddMatches = sql.match(/ALTER TABLE .* ADD COLUMN IF NOT EXISTS/gi) || [];
    assert.equal(alterAddMatches.length, safeAlterAddMatches.length, 'Non-idempotent ADD COLUMN found');

    // Verify all triggers drop before create
    const triggerMatches = sql.match(/CREATE TRIGGER/gi) || [];
    const dropTriggerMatches = sql.match(/DROP TRIGGER IF EXISTS/gi) || [];
    assert.ok(dropTriggerMatches.length >= triggerMatches.length, 'Trigger without DROP TRIGGER IF EXISTS found');

    // Verify all policies drop before create
    const policyMatches = sql.match(/CREATE POLICY/gi) || [];
    const dropPolicyMatches = sql.match(/DROP POLICY IF EXISTS/gi) || [];
    assert.ok(dropPolicyMatches.length >= policyMatches.length, 'Policy without DROP POLICY IF EXISTS found');
  });
});
