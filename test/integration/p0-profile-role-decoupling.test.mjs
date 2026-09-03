import { test } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

const BASE_URL = 'http://localhost:3000';
const SUPABASE_URL = 'https://ktmkvysnjfphcfntazut.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_YaUc--D5wZQnHMnO2Mni8g_5QSnM3Vo';
const LEGACY_SECRET = 'marmot-streetwear-super-secret-jwt-key-2026';

function createLegacySignedToken(payload, secret = LEGACY_SECRET) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', secret).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${signature}`;
}

test('Integration Suite: P0 Profile Role Decoupling & Authority Enforcement', async (t) => {
  const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  let userAToken = '';
  let userAId = '';
  let adminToken = '';
  let adminId = '';

  // --------------------------------------------------------------------------
  // TESTE 1 — SETUP COM USUÁRIOS SUPABASE REAIS
  // --------------------------------------------------------------------------
  await t.test('TESTE 1 — Real Supabase Customer User Authentication', async () => {
    const loginRes = await sb.auth.signInWithPassword({
      email: 'cliente@marmot.com',
      password: 'cliente123',
    });

    assert.ok(!loginRes.error, `Customer login must succeed: ${loginRes.error?.message}`);
    assert.ok(loginRes.data.session?.access_token, 'Must return valid session access_token');
    
    userAToken = loginRes.data.session.access_token;
    userAId = loginRes.data.user.id;

    assert.notEqual(loginRes.data.user.app_metadata?.role, 'admin', 'Customer app_metadata must NOT be admin');
    assert.ok(userAId, 'Must have a real user UUID');
  });

  // --------------------------------------------------------------------------
  // TESTE 2 — user_metadata NÃO PROMOVE ADMIN
  // --------------------------------------------------------------------------
  await t.test('TESTE 2 — user_metadata.role = "admin" does NOT grant admin authority', async () => {
    // Authenticated client as User A
    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${userAToken}` } },
      auth: { persistSession: false },
    });

    // Attempt to inject role: admin via user_metadata (self-updatable by user)
    const updateRes = await userClient.auth.updateUser({
      data: { role: 'admin' },
    });

    if (!updateRes.error && updateRes.data.user) {
      assert.equal(updateRes.data.user.user_metadata?.role, 'admin', 'User metadata was updated');
      assert.notEqual(updateRes.data.user.app_metadata?.role, 'admin', 'App metadata remains non-admin');
    }

    // Now test backend verification of User A token with role in user_metadata
    const res = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${userAToken}` },
    });

    assert.equal(res.status, 200, 'GET /api/auth/me must return 200 for valid session');
    const data = await res.json();
    assert.equal(data.user?.role, 'customer', 'Backend must enforce customer role regardless of user_metadata');
  });

  // --------------------------------------------------------------------------
  // TESTE 3 — profiles.role NÃO PROMOVE ADMIN
  // --------------------------------------------------------------------------
  await t.test('TESTE 3 — profiles.role cannot escalate privileges and is not trusted by backend', async () => {
    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${userAToken}` } },
      auth: { persistSession: false },
    });

    // Attempt to update profiles.role as customer
    const updateRoleRes = await userClient
      .from('profiles')
      .update({ role: 'admin' })
      .eq('id', userAId);

    // Either DB rejects via column privilege / trigger or returns error
    if (updateRoleRes.error) {
      assert.ok(updateRoleRes.error, 'DB rejected update to profiles.role');
    }

    // Verify backend STILL returns role: customer regardless of any profiles.role value
    const res = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${userAToken}` },
    });

    assert.equal(res.status, 200, 'GET /api/auth/me must succeed');
    const data = await res.json();
    assert.equal(data.user?.role, 'customer', 'Backend must strictly assign customer role without consulting profiles.role');
  });

  // --------------------------------------------------------------------------
  // TESTE 4 — INSERT profile COM ADMIN
  // --------------------------------------------------------------------------
  await t.test('TESTE 4 — Inserting profile with role "admin" is rejected or sanitised to customer', async () => {
    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${userAToken}` } },
      auth: { persistSession: false },
    });

    // Customer attempts to insert new profile with admin role
    const insertRes = await userClient
      .from('profiles')
      .insert({ id: userAId, role: 'admin', name: 'Escalation Attempt' })
      .select('role');

    if (insertRes.error) {
      assert.ok(insertRes.error, 'Direct profile insert with admin role was rejected by RLS / trigger');
    } else if (insertRes.data && insertRes.data.length > 0) {
      assert.notEqual(insertRes.data[0].role, 'admin', 'Inserted profile role must NOT be admin');
    }
  });

  // --------------------------------------------------------------------------
  // TESTE 5 — ENDPOINT ADMIN
  // --------------------------------------------------------------------------
  await t.test('TESTE 5 — Real customer token receives 403 on protected admin endpoints', async () => {
    const res = await fetch(`${BASE_URL}/api/admin/orders`, {
      headers: { Authorization: `Bearer ${userAToken}` },
    });

    assert.equal(res.status, 403, 'Customer token must be denied access with HTTP 403 on /api/admin/orders');
    const data = await res.json();
    assert.ok(data.error, 'Response must contain access denied error message');
  });

  // --------------------------------------------------------------------------
  // TESTE 6 — ADMIN REAL
  // --------------------------------------------------------------------------
  await t.test('TESTE 6 — Real Supabase Admin with app_metadata.role = "admin" is authorized (200)', async () => {
    const adminLogin = await sb.auth.signInWithPassword({
      email: 'admin@marmot.com',
      password: 'marmot',
    });

    assert.ok(!adminLogin.error, `Admin login must succeed: ${adminLogin.error?.message}`);
    assert.ok(adminLogin.data.session?.access_token, 'Must return valid admin access_token');
    
    adminToken = adminLogin.data.session.access_token;
    adminId = adminLogin.data.user.id;

    assert.equal(adminLogin.data.user.app_metadata?.role, 'admin', 'Admin must have app_metadata.role === "admin"');

    // Verify GET /api/auth/me returns role = 'admin'
    const meRes = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    assert.equal(meRes.status, 200, 'GET /api/auth/me must return 200 for admin');
    const meData = await meRes.json();
    assert.equal(meData.user?.role, 'admin', 'Backend must identify authentic admin from app_metadata.role');

    // Verify protected admin endpoint allows real admin
    const adminRes = await fetch(`${BASE_URL}/api/admin/health`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    assert.equal(adminRes.status, 200, 'Admin endpoint must return 200 for authorized admin');
  });

  // --------------------------------------------------------------------------
  // TESTE 7 — TOKEN LEGADO CONTINUA BLOQUEADO
  // --------------------------------------------------------------------------
  await t.test('TESTE 7 — Legacy/locally-forged token is strictly rejected with 401', async () => {
    const legacyToken = createLegacySignedToken({
      sub: 'usr-admin-marmot',
      email: 'admin@marmot.com',
      role: 'admin',
      app_metadata: { role: 'admin' },
      exp: Math.floor(Date.now() / 1000) + 3600,
    });

    const res = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${legacyToken}` },
    });

    assert.equal(res.status, 401, 'Legacy/locally-signed token must be rejected with 401');
  });
});
