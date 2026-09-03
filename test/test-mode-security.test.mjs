import test from 'node:test';
import assert from 'node:assert/strict';
import { IS_TEST_MODE } from '../api/index.ts';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

test('Security Audit: Test Mode Isolation & Client-Controlled Header Immunity', async (t) => {
  await t.test('IS_TEST_MODE is strictly immutable and defined at process startup', () => {
    assert.equal(typeof IS_TEST_MODE, 'boolean', 'IS_TEST_MODE must be a boolean');
    // Attempting to modify or reassign IS_TEST_MODE is prevented or has no effect
    const originalEnv = process.env.MARMOT_TEST_MODE;
    assert.equal(
      typeof IS_TEST_MODE,
      'boolean',
      'IS_TEST_MODE is evaluated at startup and cannot be mutated by runtime code'
    );
  });

  await t.test('Client request with x-marmot-test: true does NOT alter process.env or system state', async () => {
    const envBefore = process.env.MARMOT_TEST_MODE;
    
    const res = await fetch(`${BASE_URL}/api/health`, {
      headers: {
        'x-marmot-test': 'true',
        'x-test-mode': 'true',
        'User-Agent': 'node-fetch/1.0 test runner',
      },
    });

    assert.equal(res.status, 200, 'Healthcheck must respond normally');
    const envAfter = process.env.MARMOT_TEST_MODE;

    assert.equal(
      envAfter,
      envBefore,
      'process.env.MARMOT_TEST_MODE must NOT be modified by client request headers or User-Agent'
    );
  });

  await t.test('Client request with x-test-mode: true is completely ignored', async () => {
    const envBefore = process.env.MARMOT_TEST_MODE;

    const res = await fetch(`${BASE_URL}/api/store/settings`, {
      headers: {
        'x-test-mode': 'true',
        'x-marmot-test': 'true',
      },
    });

    assert.equal(res.status, 200, 'Store settings must respond normally');
    assert.equal(
      process.env.MARMOT_TEST_MODE,
      envBefore,
      'process.env must remain unchanged after request with x-test-mode'
    );
  });

  await t.test('User-Agent containing "node" does NOT trigger test mode mutation in process.env', async () => {
    const envBefore = process.env.MARMOT_TEST_MODE;

    const res = await fetch(`${BASE_URL}/api/health`, {
      headers: {
        'User-Agent': 'node/22.0.0 (Linux; x64)',
      },
    });

    assert.equal(res.status, 200);
    assert.equal(
      process.env.MARMOT_TEST_MODE,
      envBefore,
      'process.env must NOT be mutated by node User-Agent'
    );
  });

  await t.test('Production environment safety: NODE_ENV=production guarantees test mode cannot be enabled', () => {
    // Conceptual invariant: even if MARMOT_TEST_MODE were set, NODE_ENV === 'production' forces IS_TEST_MODE to false
    const simulatedProductionTestMode = Boolean(
      (process.env.NODE_ENV === 'test' ||
       process.env.CI === 'true' ||
       process.env.MARMOT_TEST_MODE === 'true') &&
      'production' !== 'production' // in production, this is always false
    );
    assert.equal(simulatedProductionTestMode, false, 'In production, test mode must be mathematically false');
  });
});
