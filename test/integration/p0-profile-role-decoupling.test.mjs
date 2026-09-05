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

const TEST_CUSTOMER_EMAIL = process.env.TEST_CUSTOMER_EMAIL;
const TEST_CUSTOMER_PASSWORD = process.env.TEST_CUSTOMER_PASSWORD;
const TEST_ADMIN_EMAIL = process.env.TEST_ADMIN_EMAIL;
const TEST_ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD;

if (!TEST_CUSTOMER_EMAIL || !TEST_CUSTOMER_PASSWORD) {
  throw new Error('MISSING_REQUIRED_TEST_SECRET: TEST_CUSTOMER credentials');
}
if (!TEST_ADMIN_EMAIL || !TEST_ADMIN_PASSWORD) {
  throw new Error('MISSING_REQUIRED_TEST_SECRET: TEST_ADMIN credentials');
}

const BASE_URL = 'http://localhost:3000';
const PROD_PROJECT_REF = 'ktmkvysnjfphcfntazut';
const SUPABASE_URL = process.env.SUPABASE_DISPOSABLE_URL || process.env.SUPABASE_URL || 'http://127.0.0.1:54321';
const SUPABASE_ANON_KEY = process.env.SUPABASE_DISPOSABLE_ANON_KEY || process.env.SUPABASE_ANON_KEY || 'sb_publishable_YaUc--D5wZQnHMnO2Mni8g_5QSnM3Vo';
const SERVICE_ROLE_KEY = process.env.SUPABASE_DISPOSABLE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

// Fail-Closed Safety Gate: Refuse to run against production
if (SUPABASE_URL.includes(PROD_PROJECT_REF)) {
  throw new Error('REFUSING_TO_RUN_DESTRUCTIVE_TESTS_AGAINST_PRODUCTION');
}

test('Integration Suite: P0 Profile Role Decoupling & Authority Enforcement', async (t) => {
  const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  let userAToken = process.env.TEST_CUSTOMER_TOKEN || '';
  let userAId = process.env.TEST_CUSTOMER_ID || '';
  let adminToken = process.env.TEST_ADMIN_TOKEN || '';

  // --------------------------------------------------------------------------
  // SETUP: Authenticate real customer from GoTrue if token not yet loaded
  // --------------------------------------------------------------------------
  await t.test('Setup: Real Supabase Customer User Authentication', async () => {
    const loginRes = await sb.auth.signInWithPassword({
      email: TEST_CUSTOMER_EMAIL,
      password: TEST_CUSTOMER_PASSWORD,
    });
    assert.ifError(loginRes.error, `AUTHENTICATION_FAILED: Customer login failed: ${loginRes.error?.message}`);
    assert.ok(loginRes.data.session?.access_token, 'Must return valid session access_token');
    userAToken = loginRes.data.session.access_token;
    userAId = loginRes.data.user.id;
    assert.notEqual(loginRes.data.user.app_metadata?.role, 'admin', 'Customer app_metadata must NOT be admin');
    assert.ok(userAId, 'Must have a real user UUID');
  });

  // --------------------------------------------------------------------------
  // TESTE A: Cliente tenta UPDATE profiles.role = 'admin' (BLOCKER 8)
  // --------------------------------------------------------------------------
  await t.test('TESTE A: Customer attempting UPDATE profiles.role = "admin" is strictly blocked', async () => {
    assert.ok(userAToken, 'AUTHENTICATION_REQUIRED: Customer token must be active');
    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${userAToken}` } },
      auth: { persistSession: false },
    });

    const updateRoleRes = await userClient
      .from('profiles')
      .update({ role: 'admin' })
      .eq('id', userAId);

    // Assert update was explicitly rejected by security control
    assert.ok(updateRoleRes.error, 'Customer must NOT be allowed to modify profiles.role');

    // Structural constraint errors DO NOT count as security enforcement
    assert.notEqual(updateRoleRes.error.code, '23505', 'Duplicate key constraint (23505) does NOT count as security enforcement');
    assert.notEqual(updateRoleRes.error.code, '23503', 'Foreign key constraint (23503) does NOT count as security enforcement');
    assert.notEqual(updateRoleRes.error.code, '23502', 'Missing field constraint (23502) does NOT count as security enforcement');
    assert.notEqual(updateRoleRes.error.code, '42P17', 'Infinite recursion error (42P17) does NOT count as security enforcement');
    assert.notEqual(updateRoleRes.error.code, '22P02', 'Syntax error (22P02) does NOT count as security enforcement');

    const isSecurityError = updateRoleRes.error.code === '42501' ||
                            updateRoleRes.error.code === 'P0001' ||
                            /permission denied|acesso negado|not authorized/i.test(updateRoleRes.error.message);
    assert.ok(isSecurityError, `Update error must be a security rejection (got code ${updateRoleRes.error.code}: ${updateRoleRes.error.message})`);

    // Verify role in database was NOT modified to admin
    const { data: profileCheck } = await userClient
      .from('profiles')
      .select('role')
      .eq('id', userAId);

    if (profileCheck && profileCheck.length > 0) {
      assert.notEqual(profileCheck[0].role, 'admin', 'Profile role in database must NOT be admin');
      assert.equal(profileCheck[0].role, 'customer', 'Profile role in database must be customer');
    }

    // Verify backend still considers user a customer
    const res = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${userAToken}` },
    });
    assert.equal(res.status, 200, 'GET /api/auth/me must succeed');
    const data = await res.json();
    assert.equal(data.user?.role, 'customer', 'Backend must report role as customer');
  });

  // --------------------------------------------------------------------------
  // TESTE A.1: Cliente consegue ler e editar apenas o próprio perfil nos campos permitidos (sem 42P17)
  // --------------------------------------------------------------------------
  await t.test('TESTE A.1: Customer can read and update permitted fields on own profile without 42P17 recursion', async () => {
    assert.ok(userAToken, 'AUTHENTICATION_REQUIRED: Customer token must be active');
    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${userAToken}` } },
      auth: { persistSession: false },
    });

    // 1. Read own profile
    const { data: profile, error: readErr } = await userClient
      .from('profiles')
      .select('id, email, name, role, phone')
      .eq('id', userAId)
      .single();

    assert.ifError(readErr, 'Customer must be able to read own profile without error');
    assert.ok(profile, 'Profile must be returned');
    assert.equal(profile.id, userAId, 'Must be own profile');
    assert.equal(profile.role, 'customer', 'Role must be customer');

    // 2. Update permitted fields (e.g. phone)
    const testPhone = '11999998888';
    const { error: updateErr } = await userClient
      .from('profiles')
      .update({ phone: testPhone })
      .eq('id', userAId);

    assert.ifError(updateErr, 'Customer must be able to update permitted fields on own profile without 42P17 recursion');

    // 3. Verify updated field
    const { data: updatedProfile, error: verifyErr } = await userClient
      .from('profiles')
      .select('phone')
      .eq('id', userAId)
      .single();

    assert.ifError(verifyErr, 'Must read updated profile');
    assert.equal(updatedProfile?.phone, testPhone, 'Phone must be updated');
  });

  // --------------------------------------------------------------------------
  // TESTE B: Ephemeral User INSERT profiles.role = 'admin' (BLOCKER 9)
  // --------------------------------------------------------------------------
  await t.test('TESTE B: Ephemeral 4th user attempting INSERT profiles.role = "admin" is rejected or sanitized', async () => {
    assert.ok(SERVICE_ROLE_KEY, 'SERVICE_ROLE_KEY is required to provision ephemeral user fixture');
    const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const ephemeralNonce = crypto.randomBytes(4).toString('hex');
    const ephemeralEmail = `ephemeral-insert-${Date.now()}-${ephemeralNonce}@marmot-disposable.test`;
    const ephemeralPassword = `Pass!${crypto.randomBytes(12).toString('base64url')}9#`;

    // 1. Create ephemeral 4th user via real GoTrue admin
    const { data: authUser, error: createAuthErr } = await adminClient.auth.admin.createUser({
      email: ephemeralEmail,
      password: ephemeralPassword,
      email_confirm: true,
      user_metadata: { name: 'Ephemeral Insert Test', full_name: 'Ephemeral Insert Test' },
    });
    assert.ifError(createAuthErr, 'Ephemeral user creation in GoTrue must succeed');
    const ephemeralUserId = authUser.user.id;
    assert.ok(ephemeralUserId, 'Must receive real GoTrue user id');

    try {
      // 2. If handle_new_user created a profile, delete it to test manual INSERT
      await adminClient.from('profiles').delete().eq('id', ephemeralUserId);

      // 3. Authenticate with real GoTrue signInWithPassword
      const ephemeralPublicClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
      const { data: ephSession, error: ephSignErr } = await ephemeralPublicClient.auth.signInWithPassword({
        email: ephemeralEmail,
        password: ephemeralPassword,
      });
      assert.ifError(ephSignErr, 'Ephemeral user signInWithPassword must succeed');
      const ephemeralToken = ephSession?.session?.access_token;
      assert.ok(ephemeralToken, 'Must receive real access_token for ephemeral user');

      // 4. Authenticated client tries INSERT with role = 'admin' and complete valid payload
      const ephemeralUserClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        global: { headers: { Authorization: `Bearer ${ephemeralToken}` } },
        auth: { persistSession: false },
      });

      const insertRes = await ephemeralUserClient
        .from('profiles')
        .insert({
          id: ephemeralUserId,
          email: ephemeralEmail,
          name: 'Ephemeral Insert Tester',
          role: 'admin',
        })
        .select();

      // Constraint errors DO NOT count as security enforcement
      if (insertRes.error) {
        assert.notEqual(insertRes.error.code, '23505', 'Duplicate key constraint (23505) does NOT count as a security defense');
        assert.notEqual(insertRes.error.code, '23503', 'Foreign key constraint (23503) does NOT count as a security defense');
        assert.notEqual(insertRes.error.code, '23502', 'Missing field constraint (23502) does NOT count as a security defense');

        const isSecurityError = insertRes.error.code === '42501' ||
                                insertRes.error.code === 'P0001' ||
                                /permission denied|acesso negado|not authorized/i.test(insertRes.error.message);
        assert.ok(isSecurityError, `Insert rejection must be a security rejection (got code ${insertRes.error.code}: ${insertRes.error.message})`);
      } else if (insertRes.data && insertRes.data.length > 0) {
        // If insert succeeded, trigger must sanitize role to customer
        assert.notEqual(insertRes.data[0].role, 'admin', 'Inserted profile role must NOT be admin');
        assert.equal(insertRes.data[0].role, 'customer', 'Inserted profile role must be sanitized to customer');
      }

      // Check final state in database
      const { data: profileCheck } = await adminClient
        .from('profiles')
        .select('role')
        .eq('id', ephemeralUserId);

      if (profileCheck && profileCheck.length > 0) {
        assert.notEqual(profileCheck[0].role, 'admin', 'Profile role in database must NEVER be admin');
        assert.equal(profileCheck[0].role, 'customer', 'Profile role in database must be customer');
      }
    } finally {
      // 5. Cleanup ephemeral profile and auth user (even on test failure)
      try {
        await adminClient.from('profiles').delete().eq('id', ephemeralUserId);
        await adminClient.auth.admin.deleteUser(ephemeralUserId);
      } catch {}
    }
  });

  // --------------------------------------------------------------------------
  // TESTE C: user_metadata.role = 'admin' NÃO concede autoridade administrativa (BLOCKER 10)
  // --------------------------------------------------------------------------
  await t.test('TESTE C: user_metadata.role = "admin" does NOT grant admin authority', async () => {
    assert.ok(userAToken, 'AUTHENTICATION_REQUIRED: Customer token must be active');
    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${userAToken}` } },
      auth: { persistSession: false },
    });

    const updateRes = await userClient.auth.updateUser({
      data: { role: 'admin' },
    });
    if (!updateRes.error && updateRes.data.user) {
      assert.equal(updateRes.data.user.user_metadata?.role, 'admin', 'User metadata was updated to admin');
      assert.notEqual(updateRes.data.user.app_metadata?.role, 'admin', 'App metadata remains non-admin');
    }

    const res = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${userAToken}` },
    });
    assert.equal(res.status, 200, 'GET /api/auth/me must return 200 for valid session');
    const data = await res.json();
    assert.equal(data.user?.role, 'customer', 'Backend must enforce customer role regardless of user_metadata');
    assert.notEqual(data.user?.role, 'admin', 'Customer must NEVER receive admin role via user_metadata');

    // Also verify protected admin endpoints return 403 Forbidden
    const adminOrdersRes = await fetch(`${BASE_URL}/api/admin/orders`, {
      headers: { Authorization: `Bearer ${userAToken}` },
    });
    assert.equal(adminOrdersRes.status, 403, 'Customer with user_metadata.role=admin must be denied with 403 on /api/admin/*');
  });

  // --------------------------------------------------------------------------
  // TESTE D: Token customer em endpoint administrativo (403)
  // --------------------------------------------------------------------------
  await t.test('TESTE D: Customer token receives 403 Forbidden on protected admin endpoints', async () => {
    assert.ok(userAToken, 'AUTHENTICATION_REQUIRED: Customer token must be active');
    const res = await fetch(`${BASE_URL}/api/admin/orders`, {
      headers: { Authorization: `Bearer ${userAToken}` },
    });
    assert.equal(res.status, 403, 'Customer token must be denied access with HTTP 403 on /api/admin/orders');
    const data = await res.json();
    assert.ok(data.error, 'Response must contain access denied error message');
  });

  // --------------------------------------------------------------------------
  // TESTE E: Admin legítimo via app_metadata.role = 'admin' (BLOCKER 11)
  // --------------------------------------------------------------------------
  await t.test('TESTE E: Real Supabase Admin with app_metadata.role = "admin" is authorized (200)', async () => {
    const adminLogin = await sb.auth.signInWithPassword({
      email: TEST_ADMIN_EMAIL,
      password: TEST_ADMIN_PASSWORD,
    });
    assert.ifError(adminLogin.error, `AUTHENTICATION_FAILED: Admin login failed: ${adminLogin.error?.message}`);
    assert.ok(adminLogin.data?.session?.access_token, 'Must return valid admin access_token');
    adminToken = adminLogin.data.session.access_token;
    assert.equal(adminLogin.data.user.app_metadata?.role, 'admin', 'Admin must have app_metadata.role === "admin"');

    const meRes = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.equal(meRes.status, 200, 'GET /api/auth/me must return 200 for admin');
    const meData = await meRes.json();
    assert.equal(meData.user?.role, 'admin', 'Backend must identify authentic admin from app_metadata.role');

    const adminRes = await fetch(`${BASE_URL}/api/admin/health`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.equal(adminRes.status, 200, 'Admin endpoint /api/admin/health must return 200 for authorized admin');
  });
});
