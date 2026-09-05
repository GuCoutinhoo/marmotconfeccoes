import 'dotenv/config';
import fs from 'node:fs';

if (fs.existsSync('/tmp/supabase-disposable.env')) {
  try {
    const envLines = fs.readFileSync('/tmp/supabase-disposable.env', 'utf8').split('\n');
    for (const line of envLines) {
      const match = line.match(/^export\s+([A-Z0-9_]+)="?(.*?)"?$/);
      if (match && !process.env[match[1]]) {
        process.env[match[1]] = match[2];
      }
    }
  } catch {}
}

import { test } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

const BASE_URL = 'http://localhost:3000';
const PROD_PROJECT_REF = 'ktmkvysnjfphcfntazut';
const SUPABASE_URL = process.env.SUPABASE_DISPOSABLE_URL || process.env.SUPABASE_URL || 'http://127.0.0.1:54321';
const SUPABASE_ANON_KEY = process.env.SUPABASE_DISPOSABLE_ANON_KEY || process.env.SUPABASE_ANON_KEY || 'sb_publishable_YaUc--D5wZQnHMnO2Mni8g_5QSnM3Vo';

if (SUPABASE_URL.includes(PROD_PROJECT_REF)) {
  throw new Error('REFUSING_TO_RUN_DESTRUCTIVE_TESTS_AGAINST_PRODUCTION');
}

const LEGACY_SECRET = 'marmot-streetwear-super-secret-jwt-key-2026';
const FORGED_SECRET = crypto.randomBytes(32).toString('hex');

function createSignedToken(payload, secret) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', secret).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${signature}`;
}

test('Integration Suite: Behavioral Remediation & Security Enforcement', async (t) => {
  const legacyToken = createSignedToken({
    sub: 'user-legacy-001',
    email: 'legacy@marmot.com',
    name: 'Legacy Token User',
    role: 'admin',
    app_metadata: { role: 'admin' },
    exp: Math.floor(Date.now() / 1000) + 3600,
  }, LEGACY_SECRET);

  const forgedToken = createSignedToken({
    sub: 'user-forged-001',
    email: 'attacker@evil.com',
    name: 'Forged Token Attacker',
    role: 'admin',
    app_metadata: { role: 'admin' },
    exp: Math.floor(Date.now() / 1000) + 3600,
  }, FORGED_SECRET);

  // --------------------------------------------------------------------------
  // 1. JWT Legado -> 401
  // --------------------------------------------------------------------------
  await t.test('Security P0: Token signed with legacy secret is strictly rejected with 401 on /api/shipping/calculate', async () => {
    const res = await fetch(`${BASE_URL}/api/shipping/calculate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${legacyToken}`,
      },
      body: JSON.stringify({
        cep: '01310-100',
        items: [{ productId: 'prod-mol-016', quantity: 1 }],
      }),
    });
    assert.equal(res.status, 401, 'Legacy signed token must return HTTP 401');
    const data = await res.json();
    assert.ok(data.error, 'Must return unauthorized error response');
  });

  await t.test('Security P0: Token signed with legacy secret is strictly rejected with 401 on /api/orders', async () => {
    const res = await fetch(`${BASE_URL}/api/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${legacyToken}`,
      },
      body: JSON.stringify({
        items: [{ productId: 'prod-mol-016', quantity: 1, size: 'M', color: 'black' }],
        shippingQuoteId: 'some-quote-id',
        shippingAddress: { postalCode: '01310-100', street: 'Av Paulista', number: '1000' },
        paymentMethod: 'pix',
      }),
    });
    assert.equal(res.status, 401, 'Legacy signed token must return HTTP 401 on orders');
  });

  await t.test('Security P0: Token signed with legacy secret is strictly rejected with 401 on /api/products/:id/reviews', async () => {
    const res = await fetch(`${BASE_URL}/api/products/prod-mol-016/reviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${legacyToken}`,
      },
      body: JSON.stringify({
        rating: 5,
        title: 'Fake Review',
        comment: 'Attempting to post review with legacy token.',
      }),
    });
    assert.equal(res.status, 401, 'Legacy signed token must return HTTP 401 on reviews');
  });

  await t.test('Security P0: Token signed with legacy secret is strictly rejected with 401 on /api/auth/me', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${legacyToken}` },
    });
    assert.equal(res.status, 401, 'Legacy signed token must return HTTP 401 on /api/auth/me');
  });

  await t.test('Security P0: Token signed with legacy secret is strictly rejected with 401 on /api/mercadopago/create-preference', async () => {
    const res = await fetch(`${BASE_URL}/api/mercadopago/create-preference`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${legacyToken}`,
      },
      body: JSON.stringify({
        items: [{ id: 'prod-mol-016', title: 'Camiseta', quantity: 1, unit_price: 150 }],
        shippingQuoteId: 'some-quote-id',
      }),
    });
    assert.equal(res.status, 401, 'Legacy signed token must return HTTP 401 on create-preference');
  });

  // --------------------------------------------------------------------------
  // 2. JWT Forjado -> 401
  // --------------------------------------------------------------------------
  await t.test('Security P0: Forged token with invalid HMAC secret is strictly rejected with 401 on /api/auth/me', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${forgedToken}` },
    });
    assert.equal(res.status, 401, 'Forged token must be rejected with HTTP 401');
  });

  await t.test('Security P0: Forged token is rejected with 401 on /api/orders', async () => {
    const res = await fetch(`${BASE_URL}/api/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${forgedToken}`,
      },
      body: JSON.stringify({
        items: [{ productId: 'prod-mol-016', quantity: 1, size: 'M', color: 'black' }],
        paymentMethod: 'pix',
      }),
    });
    assert.equal(res.status, 401, 'Forged token must return HTTP 401');
  });

  // --------------------------------------------------------------------------
  // 3. Unauthenticated requests -> 401
  // --------------------------------------------------------------------------
  await t.test('Fail-Closed: Unauthenticated call to /api/shipping/calculate returns 401', async () => {
    const res = await fetch(`${BASE_URL}/api/shipping/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cep: '01310-100',
        items: [{ productId: 'prod-mol-016', quantity: 1 }],
      }),
    });
    const data = await res.json();
    assert.equal(res.status, 401, 'Unauthenticated calculation must return HTTP 401');
    assert.ok(data.error, 'Must return error message on unauthenticated call');
  });

  await t.test('Fail-Closed: Unauthenticated call to /api/orders returns 401', async () => {
    const res = await fetch(`${BASE_URL}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: [{ productId: 'prod-mol-016', quantity: 1, size: 'M', color: 'black' }],
        paymentMethod: 'pix',
      }),
    });
    assert.equal(res.status, 401, 'Unauthenticated order creation must return HTTP 401');
  });

  await t.test('Fail-Closed: Unauthenticated review submission returns 401', async () => {
    const res = await fetch(`${BASE_URL}/api/products/prod-mol-016/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        rating: 5,
        title: 'Excelente corte',
        comment: 'Tecido de altíssima qualidade.',
      }),
    });
    const data = await res.json();
    assert.equal(res.status, 401, 'Unauthenticated review must return HTTP 401');
    assert.ok(data.error, 'Must provide error message');
  });

  await t.test('Fail-Closed: Mercado Pago with invalid token returns 401', async () => {
    const res = await fetch(`${BASE_URL}/api/mercadopago/create-preference`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer invalid.token.payload',
      },
      body: JSON.stringify({
        items: [{ id: 'prod-mol-016', title: 'Camiseta', quantity: 1, unit_price: 150 }],
        shippingQuoteId: 'some-quote-id',
      }),
    });
    assert.equal(res.status, 401, 'Invalid bearer token must return HTTP 401 on Mercado Pago preference');
  });

  // --------------------------------------------------------------------------
  // 4. Database Security: Direct REST inserts & RPC lockdown
  // --------------------------------------------------------------------------
  await t.test('Database Security: Direct REST insert to product_reviews is blocked by RLS (42501)', async () => {
    const customerToken = process.env.TEST_CUSTOMER_TOKEN;
    const testUserId = process.env.TEST_CUSTOMER_ID || crypto.randomUUID();

    // 1. Authenticated customer attempt with valid real user UUID
    if (customerToken) {
      const sbAuth = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        global: { headers: { Authorization: `Bearer ${customerToken}` } },
        auth: { persistSession: false, autoRefreshToken: false },
      });
      const authRes = await sbAuth.from('product_reviews').insert({
        product_id: 'prod-mol-016',
        user_id: testUserId,
        user_name: 'Authenticated Test Customer',
        rating: 5,
        comment: 'Direct REST insertion attempt by authenticated customer bypassing backend',
      });
      assert.ok(authRes.error, 'Direct REST insert by authenticated user must fail');
      assert.notEqual(authRes.error.code, '22P02', 'Error must NOT be 22P02 (invalid UUID syntax)');
      assert.equal(authRes.error.code, '42501', 'Error code must be 42501 (permission denied / RLS blocked)');
    }

    // 2. Anonymous attempt with valid UUID
    const sbAnon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const anonRes = await sbAnon.from('product_reviews').insert({
      product_id: 'prod-mol-016',
      user_id: testUserId,
      user_name: 'Anonymous Attacker',
      rating: 5,
      comment: 'Direct REST insertion attempt by anon bypassing backend',
    });
    assert.ok(anonRes.error, 'Direct REST insert by anon must fail');
    assert.notEqual(anonRes.error.code, '22P02', 'Error must NOT be 22P02 (invalid UUID syntax)');
    assert.equal(anonRes.error.code, '42501', 'Error code must be 42501 (permission denied / RLS blocked)');
  });

  await t.test('Database Security: Direct RPC call to is_admin as anon returns permission denied (42501)', async () => {
    const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const res = await sb.rpc('is_admin');
    assert.ok(res.error, 'Direct RPC call as anon must fail');
    assert.equal(res.error.code, '42501', 'Error code must be 42501 (permission denied)');
  });

  await t.test('Database Security: Direct RPC call to is_admin as authenticated returns permission denied (42501)', async () => {
    const customerToken = process.env.TEST_CUSTOMER_TOKEN;
    if (!customerToken) {
      assert.fail('TEST_CUSTOMER_TOKEN required for authenticated is_admin RPC test');
    }
    const sbAuth = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${customerToken}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const res = await sbAuth.rpc('is_admin');
    assert.ok(res.error, 'Direct RPC call as authenticated user must fail');
    assert.equal(res.error.code, '42501', 'Error code must be 42501 (permission denied)');
  });
});
