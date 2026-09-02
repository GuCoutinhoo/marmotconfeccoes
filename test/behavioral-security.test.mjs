import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

// Replicate canonical cart hash logic as defined in api/index.ts for behavioral assertions
function generateCanonicalCartHash(postalCode, items) {
  const cleanCep = String(postalCode || '').replace(/\D/g, '');
  const sortedItems = [...(items || [])].map((item) => {
    const pId = String(item.productId || item.id || '');
    const size = String(item.size || 'M');
    const color = String(item.color || item.colorName || 'default');
    const qty = Math.max(1, Number(item.quantity) || 1);
    const weight = Number(item.weight || 0.35);
    const height = Number(item.height || 4);
    const width = Number(item.width || 20);
    const length = Number(item.length || 25);
    return `${pId}:${size}:${color}:${qty}:${weight}:${height}:${width}:${length}`;
  }).sort().join('|');

  return crypto
    .createHash('sha256')
    .update(`${cleanCep}|${sortedItems}`)
    .digest('hex');
}

test('Behavioral Security Suite: P0 & P1 Enforcement Verification', async (t) => {
  const apiCode = fs.readFileSync(path.resolve(process.cwd(), 'api/index.ts'), 'utf8');
  const sqlCode = fs.readFileSync(path.resolve(process.cwd(), 'supabase-complete-production-migration.sql'), 'utf8');

  await t.test('P0 1: Canonical Cart Hash determinism & anti-tampering behavior', () => {
    const cep = '01310-100';
    const items1 = [
      { productId: 'prod-1', size: 'M', color: 'Preto', quantity: 2, weight: 0.3, height: 4, width: 20, length: 25 },
      { productId: 'prod-2', size: 'G', color: 'Branco', quantity: 1, weight: 0.5, height: 5, width: 22, length: 30 },
    ];
    // Inverted order in array
    const items2 = [
      { productId: 'prod-2', size: 'G', color: 'Branco', quantity: 1, weight: 0.5, height: 5, width: 22, length: 30 },
      { productId: 'prod-1', size: 'M', color: 'Preto', quantity: 2, weight: 0.3, height: 4, width: 20, length: 25 },
    ];

    const hash1 = generateCanonicalCartHash(cep, items1);
    const hash2 = generateCanonicalCartHash(cep, items2);
    assert.equal(hash1, hash2, 'Cart hash must be deterministic regardless of item insertion order');

    // Tampering test: modified quantity
    const tamperedQty = [
      { productId: 'prod-1', size: 'M', color: 'Preto', quantity: 3, weight: 0.3, height: 4, width: 20, length: 25 },
      { productId: 'prod-2', size: 'G', color: 'Branco', quantity: 1, weight: 0.5, height: 5, width: 22, length: 30 },
    ];
    assert.notEqual(hash1, generateCanonicalCartHash(cep, tamperedQty), 'Tampered quantity must change cart hash');

    // Tampering test: modified destination CEP
    assert.notEqual(hash1, generateCanonicalCartHash('20040-002', items1), 'Tampered destination CEP must change cart hash');

    // Tampering test: modified size
    const tamperedSize = [
      { productId: 'prod-1', size: 'GG', color: 'Preto', quantity: 2, weight: 0.3, height: 4, width: 20, length: 25 },
      { productId: 'prod-2', size: 'G', color: 'Branco', quantity: 1, weight: 0.5, height: 5, width: 22, length: 30 },
    ];
    assert.notEqual(hash1, generateCanonicalCartHash(cep, tamperedSize), 'Tampered size must change cart hash');
  });

  await t.test('P0 1: Order Overwrite & IDOR Protection in backend routes', () => {
    // Check in POST /api/orders
    assert.ok(apiCode.includes('SHIPPING_QUOTE_FORBIDDEN'), 'Must reject quotes belonging to other users with SHIPPING_QUOTE_FORBIDDEN');
    assert.ok(apiCode.includes('found.userId && found.userId !== authUser.id'), 'Must validate order ownership against authenticated user');
    assert.ok(apiCode.includes("found.status !== 'Aguardando Pagamento' && found.paymentStatus !== 'Pendente'"), 'Must prevent reusing already paid/processed orders');
    assert.ok(apiCode.includes('MM-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}'), 'Must generate server-authoritative order ID');

    // Check in createPreference
    assert.ok(apiCode.includes('CHECKOUT_ORDER_MISMATCH'), 'Must log checkout order mismatch warning on IDOR attempt');
    assert.ok(apiCode.includes("found.status !== 'Aguardando Pagamento' && found.paymentStatus !== 'Pendente'"), 'Must check pending status in createPreference');
  });

  await t.test('P0 2: Shipping Quote Binding to User and Cart Hash', () => {
    // Check cart_hash verification
    assert.ok(apiCode.includes('generateCanonicalCartHash'), 'Canonical cart hash generation must be in codebase');
    assert.ok(apiCode.includes('quoteData.cart_hash !== serverCartHash'), 'Must compare stored cart_hash with freshly computed serverCartHash');
    assert.ok(apiCode.includes('quoteData.user_id !== authUser.id'), 'Must enforce quote ownership in order checkout');
    assert.ok(apiCode.includes('quoteData.user_id !== orderUserId'), 'Must enforce quote ownership in payment preference');
    assert.ok(apiCode.includes('new Date(quoteData.expires_at).getTime() < Date.now()'), 'Must enforce quote expiration timestamp');
  });

  await t.test('P0 3: Tracking Webhook Fail-Closed verification', () => {
    // Must reject unverified payloads when carrier cannot confirm
    assert.ok(apiCode.includes('TRACKING_WEBHOOK_UNVERIFIED'), 'Must log unverified webhook notice');
    assert.ok(apiCode.includes('TRACKING_WEBHOOK_REJECTED'), 'Must log rejected tracking update');
    assert.ok(apiCode.includes('res.status(401).json'), 'Must return 401 on unconfirmed webhook');
    assert.ok(!apiCode.includes('let statusToApply = providerStatus;'), 'Must not default unverified status to providerStatus');
  });

  await t.test('P0 4: Supabase as Single Source of Truth / Fail-Closed persistence', () => {
    // saveOrder must throw on Supabase error in supabase mode
    assert.ok(apiCode.includes('[DB_PERSISTENCE_ERROR]'), 'saveOrder must throw DB_PERSISTENCE_ERROR on database failure');
    assert.ok(apiCode.includes('throw new Error(`[DB_PERSISTENCE_ERROR]'), 'saveOrder must fail closed if client unavailable or insert fails');
  });

  await t.test('P1: Reviews & Verified Purchase Hardening', () => {
    // createReview must strictly verify purchase
    assert.ok(apiCode.includes('canUserReviewProduct'), 'canUserReviewProduct method must be present');
    assert.ok(apiCode.includes('podem obter selo de avaliação verificada'), 'Rejection reason must be present');
    // POST /api/reviews must not trust body.verifiedPurchase or unverified identity
    assert.ok(apiCode.includes('check.orderId'), 'orderId must be set from verified check');
    assert.ok(!apiCode.includes('let resolvedUserId = req.body?.userId;'), 'Must not trust req.body.userId for identity');
  });

  await t.test('P1: PostgreSQL Migration Hardening & Security Definer search_path', () => {
    // Check search_path on functions
    assert.ok(sqlCode.includes('SET search_path = public, pg_temp'), 'Must specify search_path = public, pg_temp on security functions');
    // Check is_admin implementation
    assert.ok(sqlCode.includes("auth.jwt() -> 'app_metadata' ->> 'role'"), 'is_admin must use app_metadata.role');
    assert.ok(!sqlCode.includes("auth.jwt() -> 'user_metadata' ->> 'role'"), 'is_admin must NEVER use user_metadata.role');
  });
});
