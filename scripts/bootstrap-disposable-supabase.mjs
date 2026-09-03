#!/usr/bin/env node
/**
 * MARMOT CONFECÇÕES - BOOTSTRAP DISPOSABLE SUPABASE ENVIRONMENT
 * FASE 3 REMEDIATION: Ephemeral, isolated, reproducible test environment.
 * 
 * 1. Checks or starts disposable Supabase service (Docker Supabase CLI or high-fidelity emulator).
 * 2. Prepares ephemeral test identities:
 *    - Customer: TEST_CUSTOMER_EMAIL / TEST_CUSTOMER_PASSWORD / TEST_CUSTOMER_TOKEN
 *    - Admin: TEST_ADMIN_EMAIL / TEST_ADMIN_PASSWORD / TEST_ADMIN_TOKEN (app_metadata.role = 'admin')
 *    - Attacker: TEST_ATTACKER_EMAIL / TEST_ATTACKER_PASSWORD / TEST_ATTACKER_TOKEN
 * 3. Injects configuration into /tmp/supabase-disposable.env, process.env, and GITHUB_ENV.
 */

import http from 'node:http';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { spawn, execSync } from 'node:child_process';
import path from 'node:path';

const JWT_SECRET = process.env.DISPOSABLE_JWT_SECRET || 'super-secret-jwt-token-with-at-least-32-characters-long';
const PORT = 54321;
const DISPOSABLE_URL = `http://127.0.0.1:${PORT}`;

function signJwt(payload, secret = JWT_SECRET) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', secret).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${signature}`;
}

const ANON_KEY = signJwt({
  role: 'anon',
  iss: 'supabase',
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + 3600 * 24 * 365,
});

const SERVICE_ROLE_KEY = signJwt({
  role: 'service_role',
  iss: 'supabase',
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + 3600 * 24 * 365,
});

async function isEndpointHealthy(url) {
  return new Promise((resolve) => {
    const req = http.get(`${url}/auth/v1/health`, (res) => {
      resolve(res.statusCode === 200);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(500, () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function waitForEndpoint(url, timeoutSeconds = 15) {
  const start = Date.now();
  while (Date.now() - start < timeoutSeconds * 1000) {
    if (await isEndpointHealthy(url)) {
      return true;
    }
    await new Promise(r => setTimeout(r, 300));
  }
  return false;
}

async function main() {
  console.log('======================================================================');
  console.log('MARMOT CONFECÇÕES — BOOTSTRAPPING DISPOSABLE TEST ENVIRONMENT');
  console.log('======================================================================');

  let activeUrl = DISPOSABLE_URL;
  let activeAnonKey = ANON_KEY;
  let activeServiceKey = SERVICE_ROLE_KEY;

  const healthy = await isEndpointHealthy(activeUrl);

  if (!healthy) {
    let dockerAvailable = false;
    try {
      execSync('docker info', { stdio: 'ignore' });
      dockerAvailable = true;
    } catch {}

    if (dockerAvailable) {
      console.log('[BOOTSTRAP] Docker detected. Starting Supabase CLI disposable instance...');
      try {
        execSync('npx --yes supabase start -x studio,inbucket,storage,realtime,analytics,edge_runtime', { stdio: 'inherit' });
      } catch (e) {
        console.warn('[BOOTSTRAP] Supabase CLI start encountered error, falling back to background emulator daemon:', e.message);
      }
    }

    const checkAgain = await isEndpointHealthy(activeUrl);
    if (!checkAgain) {
      console.log('[BOOTSTRAP] Starting high-fidelity disposable Supabase daemon on port 54321...');
      const daemonScript = path.resolve('scripts/disposable-supabase-server.mjs');
      const child = spawn(process.execPath, [daemonScript], {
        detached: true,
        stdio: 'ignore',
      });
      child.unref();

      const becameHealthy = await waitForEndpoint(activeUrl, 10);
      if (!becameHealthy) {
        throw new Error(`[BOOTSTRAP CRITICAL] Disposable Supabase failed to respond on ${activeUrl} within 10s.`);
      }
    }
  }

  console.log(`[BOOTSTRAP] Verified healthy Supabase endpoint at: ${activeUrl}`);

  // Test identities
  const customerEmail = 'test-customer-e2e@marmot-disposable.test';
  const customerPassword = 'CustomerPass123!Safe';
  const customerToken = signJwt({
    sub: 'usr-customer-e2e-001',
    email: customerEmail,
    role: 'authenticated',
    app_metadata: { provider: 'email', providers: ['email'], role: 'customer' },
    user_metadata: { name: 'Cliente E2E Teste', full_name: 'Cliente E2E Teste' },
    aud: 'authenticated',
    exp: Math.floor(Date.now() / 1000) + 3600 * 24,
  });

  const adminEmail = 'test-admin-e2e@marmot-disposable.test';
  const adminPassword = 'AdminPass123!Safe';
  const adminToken = signJwt({
    sub: 'usr-admin-e2e-001',
    email: adminEmail,
    role: 'authenticated',
    app_metadata: { provider: 'email', providers: ['email'], role: 'admin' },
    user_metadata: { name: 'Administrador E2E Teste', full_name: 'Administrador E2E Teste' },
    aud: 'authenticated',
    exp: Math.floor(Date.now() / 1000) + 3600 * 24,
  });

  const attackerEmail = 'test-attacker-e2e@marmot-disposable.test';
  const attackerPassword = 'AttackerPass123!Safe';
  const attackerToken = signJwt({
    sub: 'usr-attacker-e2e-001',
    email: attackerEmail,
    role: 'authenticated',
    app_metadata: { provider: 'email', providers: ['email'], role: 'customer' },
    user_metadata: { name: 'Attacker Teste', full_name: 'Attacker Teste' },
    aud: 'authenticated',
    exp: Math.floor(Date.now() / 1000) + 3600 * 24,
  });

  const envMap = {
    SUPABASE_DISPOSABLE_URL: activeUrl,
    SUPABASE_DISPOSABLE_ANON_KEY: activeAnonKey,
    SUPABASE_DISPOSABLE_SERVICE_ROLE_KEY: activeServiceKey,
    SUPABASE_SERVICE_ROLE_KEY: activeServiceKey,
    TEST_CUSTOMER_EMAIL: customerEmail,
    TEST_CUSTOMER_PASSWORD: customerPassword,
    TEST_CUSTOMER_TOKEN: customerToken,
    TEST_ADMIN_EMAIL: adminEmail,
    TEST_ADMIN_PASSWORD: adminPassword,
    TEST_ADMIN_TOKEN: adminToken,
    TEST_ATTACKER_EMAIL: attackerEmail,
    TEST_ATTACKER_PASSWORD: attackerPassword,
    TEST_ATTACKER_TOKEN: attackerToken,
  };

  for (const [k, v] of Object.entries(envMap)) {
    process.env[k] = v;
  }

  // Export to /tmp/supabase-disposable.env
  const envContent = Object.entries(envMap).map(([k, v]) => `export ${k}="${v}"`).join('\n') + '\n';
  fs.writeFileSync('/tmp/supabase-disposable.env', envContent, 'utf8');

  // Export to GITHUB_ENV if in CI
  if (process.env.GITHUB_ENV) {
    const ghContent = Object.entries(envMap).map(([k, v]) => `${k}=${v}`).join('\n') + '\n';
    fs.appendFileSync(process.env.GITHUB_ENV, ghContent, 'utf8');
  }

  console.log('----------------------------------------------------------------------');
  console.log('✅ DISPOSABLE TEST ENVIRONMENT READY');
  console.log(`Endpoint: ${activeUrl}`);
  console.log(`Customer: ${customerEmail}`);
  console.log(`Admin:    ${adminEmail} (app_metadata.role = 'admin')`);
  console.log(`Attacker: ${attackerEmail}`);
  console.log('======================================================================');
}

main().catch((err) => {
  console.error('[BOOTSTRAP CRITICAL] Error:', err);
  process.exit(1);
});
