import 'dotenv/config';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

const TEST_CUSTOMER_EMAIL = process.env.TEST_CUSTOMER_EMAIL;
const TEST_CUSTOMER_PASSWORD = process.env.TEST_CUSTOMER_PASSWORD;
const TEST_ADMIN_EMAIL = process.env.TEST_ADMIN_EMAIL;
const TEST_ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD;

if (!TEST_CUSTOMER_EMAIL) {
  throw new Error('MISSING_REQUIRED_TEST_SECRET: TEST_CUSTOMER_EMAIL');
}
if (!TEST_CUSTOMER_PASSWORD) {
  throw new Error('MISSING_REQUIRED_TEST_SECRET: TEST_CUSTOMER_PASSWORD');
}
if (!TEST_ADMIN_EMAIL) {
  throw new Error('MISSING_REQUIRED_TEST_SECRET: TEST_ADMIN_EMAIL');
}
if (!TEST_ADMIN_PASSWORD) {
  throw new Error('MISSING_REQUIRED_TEST_SECRET: TEST_ADMIN_PASSWORD');
}

const BASE_URL = 'http://localhost:3000';
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://ktmkvysnjfphcfntazut.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_YaUc--D5wZQnHMnO2Mni8g_5QSnM3Vo';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
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

  // --------------------------------------------------------------------------
  // SETUP: Authenticate real customer from environment variables (Fail-Closed)
  // --------------------------------------------------------------------------
  await t.test('Setup: Real Supabase Customer User Authentication', async () => {
    const loginRes = await sb.auth.signInWithPassword({
      email: TEST_CUSTOMER_EMAIL,
      password: TEST_CUSTOMER_PASSWORD,
    });

    assert.ifError(loginRes.error, `AUTHENTICATION_FAILED: Customer login failed with error: ${loginRes.error?.message}`);
    assert.ok(loginRes.data.session?.access_token, 'Must return valid session access_token');

    userAToken = loginRes.data.session.access_token;
    userAId = loginRes.data.user.id;

    assert.notEqual(loginRes.data.user.app_metadata?.role, 'admin', 'Customer app_metadata must NOT be admin');
    assert.ok(userAId, 'Must have a real user UUID');
  });

  // --------------------------------------------------------------------------
  // TESTE A: Cliente tenta UPDATE profiles.role = 'admin'
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
    assert.notEqual(updateRoleRes.error.code, '23505', 'Duplicate key constraint does not count as security enforcement');
    assert.notEqual(updateRoleRes.error.code, '23503', 'Foreign key constraint does not count as security enforcement');

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
    }

    // Verify backend still considers user a customer
    const res = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${userAToken}` },
    });
    assert.equal(res.status, 200, 'GET /api/auth/me must succeed');
    const data = await res.json();
    assert.equal(data.user?.role, 'customer', 'Backend must strictly assign customer role');
  });

  // --------------------------------------------------------------------------
  // TESTE B: INSERT profile tentando role = 'admin' (Valid Payload with email NOT NULL)
  // --------------------------------------------------------------------------
  await t.test('TESTE B: Customer attempting INSERT profile with role = "admin" is rejected or sanitized', async () => {
    assert.ok(userAToken, 'AUTHENTICATION_REQUIRED: Customer token must be active');

    // Scenario 1: If in isolated/disposable test environment with service_role, create ephemeral test user
    // to execute clean INSERT with no preexisting primary key conflict
    if (SERVICE_ROLE_KEY && process.env.VITE_SUPABASE_URL && !process.env.VITE_SUPABASE_URL.includes('ktmkvysnjfphcfntazut')) {
      const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
        auth: { persistSession: false },
      });
      const ephemeralEmail = `ephemeral-sec-test-${Date.now()}@marmot-test.local`;
      const ephemeralPassword = `Pass!${crypto.randomBytes(8).toString('hex')}`;

      const { data: createdUser, error: createErr } = await adminClient.auth.admin.createUser({
        email: ephemeralEmail,
        password: ephemeralPassword,
        email_confirm: true,
      });

      if (!createErr && createdUser?.user) {
        const ephemeralUserId = createdUser.user.id;
        try {
          // Remove profile auto-created by auth trigger to test direct table INSERT
          await adminClient.from('profiles').delete().eq('id', ephemeralUserId);

          const { data: ephemeralSession } = await sb.auth.signInWithPassword({
            email: ephemeralEmail,
            password: ephemeralPassword,
          });

          if (ephemeralSession?.session?.access_token) {
            const ephemeralUserClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
              global: { headers: { Authorization: `Bearer ${ephemeralSession.session.access_token}` } },
              auth: { persistSession: false },
            });

            const insertRes = await ephemeralUserClient
              .from('profiles')
              .insert({
                id: ephemeralUserId,
                email: ephemeralEmail,
                name: 'Privilege Escalation Attempt',
                role: 'admin',
              })
              .select('role');

            if (insertRes.error) {
              assert.notEqual(insertRes.error.code, '23505', 'Duplicate key constraint (23505) does NOT count as a security defense');
              assert.notEqual(insertRes.error.code, '23503', 'Foreign key constraint (23503) does NOT count as a security defense');
              assert.notEqual(insertRes.error.code, '23502', 'Missing field constraint (23502) does NOT count as a security defense');

              const isSecurityError = insertRes.error.code === '42501' ||
                                      insertRes.error.code === 'P0001' ||
                                      /permission denied|acesso negado|not authorized/i.test(insertRes.error.message);
              assert.ok(isSecurityError, `Insert rejection must be a security rejection (got code ${insertRes.error.code}: ${insertRes.error.message})`);
            } else if (insertRes.data && insertRes.data.length > 0) {
              assert.notEqual(insertRes.data[0].role, 'admin', 'Inserted profile role must NOT be admin');
              assert.equal(insertRes.data[0].role, 'customer', 'Inserted profile role must be sanitized to customer');
            }

            const { data: profileCheck } = await ephemeralUserClient
              .from('profiles')
              .select('role')
              .eq('id', ephemeralUserId);

            if (profileCheck && profileCheck.length > 0) {
              assert.notEqual(profileCheck[0].role, 'admin', 'Profile role in database must NEVER be admin');
              assert.equal(profileCheck[0].role, 'customer', 'Profile role in database must be customer');
            }
            return;
          }
        } finally {
          await adminClient.from('profiles').delete().eq('id', ephemeralUserId);
          await adminClient.auth.admin.deleteUser(ephemeralUserId);
        }
      }
    }

    // Scenario 2: With authenticated customer session, test insert with all required fields (including email NOT NULL)
    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${userAToken}` } },
      auth: { persistSession: false },
    });

    const insertRes = await userClient
      .from('profiles')
      .insert({
        id: userAId,
        email: TEST_CUSTOMER_EMAIL,
        name: 'Privilege Escalation Attempt',
        role: 'admin',
      })
      .select('role');

    if (insertRes.error) {
      assert.notEqual(insertRes.error.code, '23502', 'Missing field constraint (23502) does NOT count as a security defense');
      assert.notEqual(insertRes.error.code, '23503', 'Foreign key constraint (23503) does NOT count as a security defense');

      // If user profile exists, 23505 may occur on non-disposable environments; however, if security policy or trigger rejects, verify it
      if (insertRes.error.code !== '23505') {
        const isSecurityError = insertRes.error.code === '42501' ||
                                insertRes.error.code === 'P0001' ||
                                /permission denied|acesso negado|not authorized/i.test(insertRes.error.message);
        assert.ok(isSecurityError, `Insert rejection must be a security rejection (got code ${insertRes.error.code}: ${insertRes.error.message})`);
      }
    } else if (insertRes.data && insertRes.data.length > 0) {
      assert.notEqual(insertRes.data[0].role, 'admin', 'Inserted profile role must NOT be admin');
      assert.equal(insertRes.data[0].role, 'customer', 'Inserted profile role must be sanitized to customer');
    }

    // Verify role in database is never admin
    const { data: profileCheck } = await userClient
      .from('profiles')
      .select('role')
      .eq('id', userAId);

    if (profileCheck && profileCheck.length > 0) {
      assert.notEqual(profileCheck[0].role, 'admin', 'Profile role in database must NEVER be admin');
      assert.equal(profileCheck[0].role, 'customer', 'Profile role in database must be customer');
    }
  });

  // --------------------------------------------------------------------------
  // TESTE C: user_metadata.role = 'admin' NÃO concede autoridade administrativa
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
      assert.equal(updateRes.data.user.user_metadata?.role, 'admin', 'User metadata was updated');
      assert.notEqual(updateRes.data.user.app_metadata?.role, 'admin', 'App metadata remains non-admin');
    }

    const res = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${userAToken}` },
    });

    assert.equal(res.status, 200, 'GET /api/auth/me must return 200 for valid session');
    const data = await res.json();
    assert.equal(data.user?.role, 'customer', 'Backend must enforce customer role regardless of user_metadata');
    assert.notEqual(data.user?.role, 'admin', 'Customer must NEVER receive admin role via user_metadata');
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
  // TESTE E: Admin legítimo via app_metadata.role = 'admin' (200)
  // --------------------------------------------------------------------------
  await t.test('TESTE E: Real Supabase Admin with app_metadata.role = "admin" is authorized (200)', async () => {
    const adminLogin = await sb.auth.signInWithPassword({
      email: TEST_ADMIN_EMAIL,
      password: TEST_ADMIN_PASSWORD,
    });

    assert.ifError(adminLogin.error, `AUTHENTICATION_FAILED: Admin login failed with error: ${adminLogin.error?.message}`);
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

    assert.equal(adminRes.status, 200, 'Admin endpoint must return 200 for authorized admin');
  });

  // --------------------------------------------------------------------------
  // TESTE F: JWT legado continua bloqueado com 401
  // --------------------------------------------------------------------------
  await t.test('TESTE F: Legacy/locally-forged token is strictly rejected with 401', async () => {
    const legacyToken = createLegacySignedToken({
      sub: 'usr-admin-marmot',
      email: TEST_ADMIN_EMAIL,
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
