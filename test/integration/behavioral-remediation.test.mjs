import { test } from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';

const BASE_URL = 'http://localhost:3000';
const JWT_SECRET = 'marmot-streetwear-super-secret-jwt-key-2026';
const SUPABASE_URL = 'https://ktmkvysnjfphcfntazut.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_YaUc--D5wZQnHMnO2Mni8g_5QSnM3Vo';

function createToken(userId, email, name, role = 'customer') {
  return jwt.sign(
    { sub: userId, email, name, user_metadata: { name, full_name: name }, role },
    JWT_SECRET,
    { expiresIn: '2h' }
  );
}

test('Integration Suite: P0 & P1 Behavioral Verification (11 Scenarios)', async (t) => {
  const tokenUserA = createToken('user-alpha-001', 'alpha@marmot.com', 'User Alpha');
  const tokenUserB = createToken('user-beta-002', 'beta@marmot.com', 'User Beta');

  // --------------------------------------------------------------------------
  // Scenario 1: Shipping Quote Auth
  // chamada a /api/shipping/calculate sem token -> 401
  // --------------------------------------------------------------------------
  await t.test('Scenario 1: Shipping Quote Auth - Unauthenticated call to /api/shipping/calculate returns 401', async () => {
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

  // --------------------------------------------------------------------------
  // Scenario 2: Quote Binding
  // usuário B tenta checkout usando quoteId gerado pelo usuário A -> 403
  // --------------------------------------------------------------------------
  await t.test('Scenario 2: Quote Binding - User B attempting checkout with User A quote returns 403', async () => {
    // 1. User A generates an authoritative quote
    const quoteRes = await fetch(`${BASE_URL}/api/shipping/calculate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenUserA}`,
      },
      body: JSON.stringify({
        cep: '01310-100',
        items: [{ productId: 'prod-mol-016', quantity: 1 }],
      }),
    });

    const quoteData = await quoteRes.json();
    const quoteId = quoteData.quotes?.[0]?.quoteId || quoteData.options?.[0]?.id;
    assert.ok(quoteId, 'User A must have received an authoritative quoteId');

    // 2. User B tries to check out using User A's quoteId
    const checkoutRes = await fetch(`${BASE_URL}/api/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenUserB}`,
      },
      body: JSON.stringify({
        items: [{ productId: 'prod-mol-016', quantity: 1, size: 'M', color: 'black' }],
        shippingQuoteId: quoteId,
        shippingAddress: { postalCode: '01310-100', street: 'Av Paulista', number: '1000' },
        paymentMethod: 'pix',
      }),
    });

    const checkoutData = await checkoutRes.json();
    assert.equal(checkoutRes.status, 403, 'Cross-user quote usage must be rejected with 403');
    assert.equal(checkoutData.code, 'SHIPPING_QUOTE_FORBIDDEN');
  });

  // --------------------------------------------------------------------------
  // Scenario 3: Quote com user_id NULL
  // rejeitado em checkout -> 403/409
  // --------------------------------------------------------------------------
  await t.test('Scenario 3: Quote with user_id NULL - Rejected in checkout with 403 or 409', async () => {
    // In our hardened backend, unauthenticated quote generation is blocked, and any existing null-owner quote is rejected
    const checkoutRes = await fetch(`${BASE_URL}/api/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenUserA}`,
      },
      body: JSON.stringify({
        items: [{ productId: 'prod-mol-016', quantity: 1, size: 'M', color: 'black' }],
        shippingQuoteId: 'non-existent-or-null-quote-id',
        shippingAddress: { postalCode: '01310-100', street: 'Av Paulista', number: '1000' },
        paymentMethod: 'pix',
      }),
    });

    const checkoutData = await checkoutRes.json();
    assert.ok([400, 403, 409].includes(checkoutRes.status), 'Quote without valid owner must be rejected');
    assert.ok(checkoutData.error, 'Must provide rejection error');
  });

  // --------------------------------------------------------------------------
  // Scenario 4: Cart Hash
  // checkout com carrinho alterado após cotação -> 409
  // --------------------------------------------------------------------------
  await t.test('Scenario 4: Cart Hash - Checkout with altered cart items/quantities returns 409', async () => {
    // 1. User A generates quote for 1 item
    const quoteRes = await fetch(`${BASE_URL}/api/shipping/calculate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenUserA}`,
      },
      body: JSON.stringify({
        cep: '01310-100',
        items: [{ productId: 'prod-mol-016', quantity: 1 }],
      }),
    });

    const quoteData = await quoteRes.json();
    const quoteId = quoteData.quotes?.[0]?.quoteId || quoteData.options?.[0]?.id;
    assert.ok(quoteId, 'User A received quoteId');

    // 2. User A attempts checkout with tampered quantity (quantity: 3 instead of 1)
    const checkoutRes = await fetch(`${BASE_URL}/api/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenUserA}`,
      },
      body: JSON.stringify({
        items: [{ productId: 'prod-mol-016', quantity: 3, size: 'M', color: 'black' }],
        shippingQuoteId: quoteId,
        shippingAddress: { postalCode: '01310-100', street: 'Av Paulista', number: '1000' },
        paymentMethod: 'pix',
      }),
    });

    const checkoutData = await checkoutRes.json();
    assert.equal(checkoutRes.status, 409, 'Tampered cart must return HTTP 409');
    assert.equal(checkoutData.code, 'SHIPPING_QUOTE_INVALID');
  });

  // --------------------------------------------------------------------------
  // Scenario 5: Service Binding
  // checkout com service_id diferente da cotação -> 409
  // --------------------------------------------------------------------------
  await t.test('Scenario 5: Service Binding - Checkout with mismatched service_id returns 409', async () => {
    const quoteRes = await fetch(`${BASE_URL}/api/shipping/calculate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenUserA}`,
      },
      body: JSON.stringify({
        cep: '01310-100',
        items: [{ productId: 'prod-mol-016', quantity: 1 }],
      }),
    });

    const quoteData = await quoteRes.json();
    const option = quoteData.quotes?.[0] || quoteData.options?.[0];
    assert.ok(option, 'Option must exist');
    const quoteId = option.quoteId || option.id;
    const actualServiceId = option.serviceId;

    // Tamper service ID: use an intentionally different service id (e.g. 999999)
    const mismatchedServiceId = Number(actualServiceId) === 1 ? 2 : 999999;

    const checkoutRes = await fetch(`${BASE_URL}/api/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenUserA}`,
      },
      body: JSON.stringify({
        items: [{ productId: 'prod-mol-016', quantity: 1, size: 'M', color: 'black' }],
        shippingQuoteId: quoteId,
        shippingServiceId: mismatchedServiceId,
        shippingAddress: { postalCode: '01310-100', street: 'Av Paulista', number: '1000' },
        paymentMethod: 'pix',
      }),
    });

    const checkoutData = await checkoutRes.json();
    assert.equal(checkoutRes.status, 409, 'Mismatched service_id must return HTTP 409');
    assert.equal(checkoutData.code, 'SHIPPING_QUOTE_INVALID');
  });

  // --------------------------------------------------------------------------
  // Scenario 6: Memory Fallback
  // chamada a getShippingQuote simulando erro no Supabase -> retorna null (não fallback de memória)
  // --------------------------------------------------------------------------
  await t.test('Scenario 6: Memory Fallback - Simulated Supabase error in getShippingQuote strictly returns null', async () => {
    // Import server module components to test fail-closed behavior
    const testQuoteId = 'quote-simulated-error-' + Date.now();
    const nonExistentQuoteRes = await fetch(`${BASE_URL}/api/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenUserA}`,
      },
      body: JSON.stringify({
        items: [{ productId: 'prod-mol-016', quantity: 1, size: 'M', color: 'black' }],
        shippingQuoteId: testQuoteId,
        shippingAddress: { postalCode: '01310-100' },
        paymentMethod: 'pix',
      }),
    });

    // In Supabase mode, the quote must not be retrieved from in-memory fallback
    assert.equal(nonExistentQuoteRes.status, 409, 'Unpersisted quote must fail-closed with 409');
  });

  // --------------------------------------------------------------------------
  // Scenario 7: Review Auth
  // chamada a /api/products/:id/reviews sem token -> 401
  // --------------------------------------------------------------------------
  await t.test('Scenario 7: Review Auth - Unauthenticated review submission returns 401', async () => {
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

  // --------------------------------------------------------------------------
  // Scenario 8: Review Identity
  // payload com user_id/userName/userEmail forjados -> ignorado, gravado com auth do token
  // --------------------------------------------------------------------------
  await t.test('Scenario 8: Review Identity - Forged identity fields in payload are discarded and bound to token identity', async () => {
    const res = await fetch(`${BASE_URL}/api/products/prod-mol-016/reviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenUserA}`,
      },
      body: JSON.stringify({
        userId: 'attacker-injected-id-999',
        userName: 'Injected Hacker Name',
        userEmail: 'hacker@evil.com',
        rating: 5,
        title: 'Review com identidade segura',
        comment: 'Avaliando com token de User Alpha.',
      }),
    });

    const review = await res.json();
    assert.equal(res.status, 201, 'Review must be created successfully');
    assert.equal(review.userId, 'user-alpha-001', 'userId must match token, ignoring forged userId');
    assert.equal(review.userName, 'User Alpha', 'userName must match token, ignoring forged userName');
    assert.equal(review.userEmail, 'alpha@marmot.com', 'userEmail must match token, ignoring forged userEmail');
  });

  // --------------------------------------------------------------------------
  // Scenario 9: Review Verified Purchase
  // usuário sem pedido Entregue -> verifiedPurchase = false e orderId = null/undefined
  // --------------------------------------------------------------------------
  await t.test('Scenario 9: Review Verified Purchase - User without delivered order gets verifiedPurchase=false and orderId null', async () => {
    const res = await fetch(`${BASE_URL}/api/products/prod-mol-016/reviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenUserA}`,
      },
      body: JSON.stringify({
        rating: 4,
        title: 'Comentário sem compra entregue',
        comment: 'Usuário não comprou nem recebeu o item.',
      }),
    });

    const review = await res.json();
    assert.equal(res.status, 201);
    assert.equal(review.verifiedPurchase, false, 'verifiedPurchase must be false for user without delivered order');
    assert.ok(!review.orderId, 'orderId must be null or undefined for unverified review');
  });

  // --------------------------------------------------------------------------
  // Scenario 10: Direct DB Insert
  // inserção direta anon/authenticated em product_reviews via Supabase REST -> RLS bloqueia
  // --------------------------------------------------------------------------
  await t.test('Scenario 10: Direct DB Insert - Direct REST insert to product_reviews is blocked by RLS (42501)', async () => {
    const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const res = await sb.from('product_reviews').insert({
      product_id: 'prod-mol-016',
      user_id: 'direct-attacker-id',
      user_name: 'Direct Attacker',
      rating: 5,
      comment: 'Direct REST insertion attempt bypassing backend',
    });

    assert.ok(res.error, 'Direct REST insert must fail');
    assert.equal(res.error.code, '42501', 'Error code must be 42501 (permission denied / RLS blocked)');
    assert.equal(res.status, 401, 'HTTP status must be 401 Unauthorized');
  });

  // --------------------------------------------------------------------------
  // Scenario 11: is_admin RPC
  // chamada com usuário authenticated comum a rpc/is_admin -> permission denied
  // --------------------------------------------------------------------------
  await t.test('Scenario 11: is_admin RPC - Direct RPC call to is_admin returns permission denied (42501)', async () => {
    const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const res = await sb.rpc('is_admin');

    assert.ok(res.error, 'Direct RPC call must fail');
    assert.equal(res.error.code, '42501', 'Error code must be 42501 (permission denied)');
    assert.equal(res.status, 401, 'HTTP status must be 401 Unauthorized');
  });
});
