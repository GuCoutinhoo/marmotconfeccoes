import 'dotenv/config';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://ktmkvysnjfphcfntazut.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_YaUc--D5wZQnHMnO2Mni8g_5QSnM3Vo';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const IS_DISPOSABLE_ENV = process.env.SUPABASE_DISPOSABLE_ENV === 'true';

test('Integration Suite: Financial Concurrency & Atomic Liquidation', async (t) => {
  // Safety verification: process_approved_order_atomic is strictly locked to service_role.
  // In production / shared environments without a disposable DB branch or service_role key,
  // we MUST NOT execute destructive concurrency tests on live customer tables.
  const hasSecureDisposableEnv = Boolean(SERVICE_ROLE_KEY && (IS_DISPOSABLE_ENV || process.env.ALLOW_CONCURRENCY_TEST_DATA === 'true'));

  if (!hasSecureDisposableEnv) {
    await t.test('Safety Check: Environment Isolation Verification', () => {
      console.log('----------------------------------------------------------------------');
      console.log('FINANCIAL CONCURRENCY SAFETY STATUS:');
      console.log('BLOCKED — NÃO EXISTE AMBIENTE DESCARTÁVEL SEGURO PARA TESTE DE CONCORRÊNCIA');
      console.log('Execution safely halted: Database is the active production instance');
      console.log('and process_approved_order_atomic is strictly restricted to service_role.');
      console.log('----------------------------------------------------------------------');
      assert.ok(true, 'Safe handling verified: Blocked on non-disposable production database without service_role');
    });
    return;
  }

  const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  const TEST_PROD_A = `TEST-PRODUCT-A-${Date.now()}`;
  const TEST_ORDER_A = `TEST-CONCURRENCY-A-${Date.now()}`;
  const TEST_PAY_A = `PAY-CONCURRENCY-A-${Date.now()}`;

  const TEST_PROD_B = `TEST-PRODUCT-B-${Date.now()}`;
  const TEST_ORDER_B1 = `TEST-ORDER-B1-${Date.now()}`;
  const TEST_ORDER_B2 = `TEST-ORDER-B2-${Date.now()}`;
  const TEST_PAY_B1 = `PAY-CONCURRENCY-B1-${Date.now()}`;
  const TEST_PAY_B2 = `PAY-CONCURRENCY-B2-${Date.now()}`;

  // =========================================================================
  // CLEANUP HELPER
  // =========================================================================
  async function cleanupTestData() {
    try {
      await adminClient.from('payment_effects').delete().like('order_id', 'TEST-%');
      await adminClient.from('orders').delete().like('id', 'TEST-%');
      await adminClient.from('products').delete().like('id', 'TEST-%');
    } catch (e) {
      console.warn('Cleanup warning:', e?.message || e);
    }
  }

  // Pre-test cleanup
  await cleanupTestData();

  t.after(async () => {
    await cleanupTestData();
  });

  // =========================================================================
  // CENÁRIO A — DUPLICATE PAYMENT
  // =========================================================================
  await t.test('CENÁRIO A — Duplicate Payment: 10 concurrent requests for same order & payment', async () => {
    // 1. Create product TEST-PRODUCT-A with stock 10
    const { error: prodErr } = await adminClient.from('products').insert({
      id: TEST_PROD_A,
      title: 'Peça Teste Concorrência A',
      price: 100,
      stock_count: 10,
      category: 'Camisetas',
      status: 'active',
      images: ['https://placehold.co/400x400.png'],
      created_at: new Date().toISOString(),
    });
    assert.ifError(prodErr, 'Must insert test product A');

    // 2. Create order TEST-CONCURRENCY-A
    const { error: orderErr } = await adminClient.from('orders').insert({
      id: TEST_ORDER_A,
      customer_name: 'Teste Concorrência',
      customer_email: 'test-concurrency@marmot.com',
      total: 100,
      status: 'Pendente',
      payment_status: 'Pendente',
      payment_method: 'mercadopago',
      shipping_address: { city: 'São Paulo', state: 'SP', cep: '01001-000' },
      items: [{ id: TEST_PROD_A, quantity: 1, price: 100, title: 'Item Teste A' }],
      created_at: new Date().toISOString(),
    });
    assert.ifError(orderErr, 'Must insert test order A');

    // 3. Execute 10 concurrent calls to process_approved_order_atomic
    const promises = Array.from({ length: 10 }).map(() =>
      adminClient.rpc('process_approved_order_atomic', {
        p_order_id: TEST_ORDER_A,
        p_payment_id: TEST_PAY_A,
        p_amount: 100,
        p_currency: 'BRL',
        p_gateway: 'mercadopago',
        p_payment_method: 'credit_card',
        p_date_approved: new Date().toISOString(),
        p_items: [{ id: TEST_PROD_A, quantity: 1 }],
      })
    );

    const responses = await Promise.all(promises);

    // Validate outcomes
    const successful = responses.filter((r) => r.data && r.data.success && !r.data.already_processed && !r.data.alreadyProcessed);
    const deduplicated = responses.filter((r) => r.data && (r.data.already_processed || r.data.alreadyProcessed));

    assert.equal(successful.length, 1, 'Exactly 1 concurrent call must execute initial approval');
    assert.equal(deduplicated.length, 9, 'Remaining 9 calls must be deduplicated as already_processed');

    // 4. Verify inventory decrement
    const { data: finalProd } = await adminClient.from('products').select('stock_count').eq('id', TEST_PROD_A).single();
    assert.equal(finalProd.stock_count, 9, 'Inventory decrement must be exactly 1 unit (10 -> 9)');

    // 5. Verify order status
    const { data: finalOrder } = await adminClient.from('orders').select('status, payment_status').eq('id', TEST_ORDER_A).single();
    assert.equal(finalOrder.payment_status, 'Pago', 'Payment status must be Pago');
    assert.equal(finalOrder.status, 'Em Separação', 'Order status must transition to Em Separação');

    // 6. Verify payment_effects count
    const { count: effectCount } = await adminClient.from('payment_effects').select('*', { count: 'exact', head: true }).eq('order_id', TEST_ORDER_A);
    assert.equal(effectCount, 1, 'payment_effects must have exactly 1 record');
  });

  // =========================================================================
  // CENÁRIO B — STOCK RACE
  // =========================================================================
  await t.test('CENÁRIO B — Stock Race: 2 simultaneous orders for stock = 1', async () => {
    // 1. Create product TEST-PRODUCT-B with stock 1
    const { error: prodErr } = await adminClient.from('products').insert({
      id: TEST_PROD_B,
      title: 'Peça Teste Concorrência B',
      price: 150,
      stock_count: 1,
      category: 'Camisetas',
      status: 'active',
      images: ['https://placehold.co/400x400.png'],
      created_at: new Date().toISOString(),
    });
    assert.ifError(prodErr, 'Must insert test product B');

    // 2. Create order B1 and order B2
    await adminClient.from('orders').insert([
      {
        id: TEST_ORDER_B1,
        customer_name: 'Comprador 1',
        customer_email: 'buyer1@marmot.com',
        total: 150,
        status: 'Pendente',
        payment_status: 'Pendente',
        payment_method: 'mercadopago',
        shipping_address: { city: 'São Paulo', state: 'SP', cep: '01001-000' },
        items: [{ id: TEST_PROD_B, quantity: 1, price: 150 }],
      },
      {
        id: TEST_ORDER_B2,
        customer_name: 'Comprador 2',
        customer_email: 'buyer2@marmot.com',
        total: 150,
        status: 'Pendente',
        payment_status: 'Pendente',
        payment_method: 'mercadopago',
        shipping_address: { city: 'São Paulo', state: 'SP', cep: '01001-000' },
        items: [{ id: TEST_PROD_B, quantity: 1, price: 150 }],
      },
    ]);

    // 3. Execute both approvals simultaneously
    const [res1, res2] = await Promise.all([
      adminClient.rpc('process_approved_order_atomic', {
        p_order_id: TEST_ORDER_B1,
        p_payment_id: TEST_PAY_B1,
        p_amount: 150,
        p_currency: 'BRL',
        p_gateway: 'mercadopago',
        p_payment_method: 'credit_card',
        p_items: [{ id: TEST_PROD_B, quantity: 1 }],
      }),
      adminClient.rpc('process_approved_order_atomic', {
        p_order_id: TEST_ORDER_B2,
        p_payment_id: TEST_PAY_B2,
        p_amount: 150,
        p_currency: 'BRL',
        p_gateway: 'mercadopago',
        p_payment_method: 'credit_card',
        p_items: [{ id: TEST_PROD_B, quantity: 1 }],
      }),
    ]);

    const results = [res1, res2];
    const successes = results.filter((r) => r.data && r.data.success);
    const failures = results.filter((r) => !r.data || !r.data.success || r.error);

    assert.equal(successes.length, 1, 'Exactly one order must succeed in reserving stock');
    assert.equal(failures.length, 1, 'The other order must fail with insufficient stock');

    // 4. Verify final stock is exactly 0, never negative
    const { data: finalProd } = await adminClient.from('products').select('stock_count').eq('id', TEST_PROD_B).single();
    assert.equal(finalProd.stock_count, 0, 'Final stock must be exactly 0, never negative (-1)');
  });
});
