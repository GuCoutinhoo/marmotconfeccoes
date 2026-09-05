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
import pg from 'pg';

const { Pool } = pg;
const PROD_PROJECT_REF = 'ktmkvysnjfphcfntazut';

const rawSupabaseUrl = process.env.SUPABASE_DISPOSABLE_URL || process.env.VITE_SUPABASE_URL || '';
const disposableDbUrl = process.env.DISPOSABLE_DATABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// --------------------------------------------------------------------------
// FAIL-CLOSED SAFETY GATE: Reject Production
// --------------------------------------------------------------------------
if (rawSupabaseUrl.includes(PROD_PROJECT_REF) || (disposableDbUrl && disposableDbUrl.includes(PROD_PROJECT_REF))) {
  throw new Error('REFUSING_TO_RUN_DESTRUCTIVE_TESTS_AGAINST_PRODUCTION');
}

const hasDisposableConfig = Boolean(
  disposableDbUrl ||
  (process.env.SUPABASE_DISPOSABLE_URL && serviceRoleKey)
);

if (!hasDisposableConfig) {
  throw new Error(
    'TEST ENVIRONMENT MISCONFIGURED: No disposable test database configured. Safety policy prohibits running destructive concurrency tests without an isolated disposable database environment (DISPOSABLE_DATABASE_URL or SUPABASE_DISPOSABLE_URL).'
  );
}

test('Integration Suite: Financial Concurrency & Atomic Liquidation', async (t) => {
  let pool = null;
  let supabaseAdmin = null;

  if (disposableDbUrl) {
    pool = new Pool({ connectionString: disposableDbUrl });
  } else {
    supabaseAdmin = createClient(process.env.SUPABASE_DISPOSABLE_URL, serviceRoleKey, {
      auth: { persistSession: false },
    });
  }

  async function callProcessApprovedOrderAtomic(params) {
    if (pool) {
      const sql = `
        SELECT public.process_approved_order_atomic(
          $1::text,
          $2::text,
          $3::numeric,
          $4::text,
          $5::text,
          $6::text,
          $7::timestamptz,
          $8::jsonb,
          $9::jsonb
        ) AS result;
      `;
      const values = [
        params.p_order_id,
        params.p_payment_id,
        params.p_amount || 100,
        params.p_currency || 'BRL',
        params.p_gateway || 'mercadopago',
        params.p_payment_method || 'credit_card',
        params.p_date_approved || new Date().toISOString(),
        JSON.stringify(params.p_items || []),
        JSON.stringify(params.p_raw_payload || {}),
      ];
      try {
        const res = await pool.query(sql, values);
        return { data: res.rows[0].result, error: null };
      } catch (err) {
        return { data: null, error: err };
      }
    } else {
      return await supabaseAdmin.rpc('process_approved_order_atomic', params);
    }
  }

  async function insertProduct(product) {
    const imagesJson = typeof product.images === 'string'
      ? product.images
      : JSON.stringify(product.images || []);

    if (pool) {
      await pool.query(
        `INSERT INTO public.products (id, title, price, stock_count, category, status, images, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8)
         ON CONFLICT (id) DO UPDATE SET stock_count = EXCLUDED.stock_count;`,
        [
          product.id,
          product.title,
          product.price,
          product.stock_count,
          product.category,
          product.status,
          imagesJson,
          product.created_at || new Date().toISOString(),
        ]
      );
    } else {
      const { error } = await supabaseAdmin.from('products').upsert({
        ...product,
        images: Array.isArray(product.images) ? product.images : JSON.parse(imagesJson),
      });
      if (error) throw error;
    }
  }

  async function insertOrder(order) {
    if (pool) {
      await pool.query(
        `INSERT INTO public.orders (
          id, customer_name, customer_email, total, status, payment_status, payment_method, shipping_address, items, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (id) DO UPDATE SET payment_status = EXCLUDED.payment_status;`,
        [
          order.id,
          order.customer_name,
          order.customer_email,
          order.total,
          order.status,
          order.payment_status,
          order.payment_method,
          JSON.stringify(order.shipping_address),
          JSON.stringify(order.items),
          order.created_at || new Date().toISOString(),
        ]
      );
    } else {
      const { error } = await supabaseAdmin.from('orders').upsert(order);
      if (error) throw error;
    }
  }

  async function getProductStock(productId) {
    if (pool) {
      const res = await pool.query(`SELECT stock_count FROM public.products WHERE id = $1;`, [productId]);
      return res.rows[0]?.stock_count;
    } else {
      const { data } = await supabaseAdmin.from('products').select('stock_count').eq('id', productId).single();
      return data?.stock_count;
    }
  }

  async function getOrderStatus(orderId) {
    if (pool) {
      const res = await pool.query(`SELECT status, payment_status FROM public.orders WHERE id = $1;`, [orderId]);
      return res.rows[0];
    } else {
      const { data } = await supabaseAdmin.from('orders').select('status, payment_status').eq('id', orderId).single();
      return data;
    }
  }

  async function getPaymentEffectsCount(orderId) {
    if (pool) {
      const res = await pool.query(`SELECT count(*)::integer AS total FROM public.payment_effects WHERE order_id = $1;`, [orderId]);
      return res.rows[0]?.total;
    } else {
      const { count } = await supabaseAdmin.from('payment_effects').select('*', { count: 'exact', head: true }).eq('order_id', orderId);
      return count;
    }
  }

  async function getInventoryMovementsCount(orderId) {
    if (pool) {
      const res = await pool.query(`SELECT count(*)::integer AS total FROM public.inventory_movements WHERE order_id = $1;`, [orderId]);
      return res.rows[0]?.total;
    } else {
      const { count } = await supabaseAdmin.from('inventory_movements').select('*', { count: 'exact', head: true }).eq('order_id', orderId);
      return count;
    }
  }

  const RUN_ID = crypto.randomUUID();
  const TEST_PROD_A = `P-A-${RUN_ID}`;
  const TEST_ORDER_A = `ORD-A-${RUN_ID}`;
  const TEST_PAY_A = `PAY-A-${RUN_ID}`;

  const TEST_PROD_B = `P-B-${RUN_ID}`;
  const TEST_ORDER_B1 = `ORD-B1-${RUN_ID}`;
  const TEST_ORDER_B2 = `ORD-B2-${RUN_ID}`;
  const TEST_PAY_B1 = `PAY-B1-${RUN_ID}`;
  const TEST_PAY_B2 = `PAY-B2-${RUN_ID}`;

  const allOrderIds = [TEST_ORDER_A, TEST_ORDER_B1, TEST_ORDER_B2];
  const allProductIds = [TEST_PROD_A, TEST_PROD_B];

  // Precise cleanup targeting ONLY the exact IDs generated for this specific run (BLOCKER 13)
  async function cleanupTestData() {
    try {
      if (pool) {
        await pool.query(`DELETE FROM public.payment_effects WHERE order_id = ANY($1::text[]);`, [allOrderIds]);
        await pool.query(`DELETE FROM public.order_status_history WHERE order_id = ANY($1::text[]);`, [allOrderIds]);
        await pool.query(`DELETE FROM public.inventory_movements WHERE order_id = ANY($1::text[]) OR product_id = ANY($2::text[]);`, [allOrderIds, allProductIds]);
        await pool.query(`DELETE FROM public.order_items WHERE order_id = ANY($1::text[]);`, [allOrderIds]);
        await pool.query(`DELETE FROM public.orders WHERE id = ANY($1::text[]);`, [allOrderIds]);
        await pool.query(`DELETE FROM public.products WHERE id = ANY($1::text[]);`, [allProductIds]);
      } else if (supabaseAdmin) {
        await supabaseAdmin.from('payment_effects').delete().in('order_id', allOrderIds);
        await supabaseAdmin.from('order_status_history').delete().in('order_id', allOrderIds);
        await supabaseAdmin.from('inventory_movements').delete().in('order_id', allOrderIds);
        await supabaseAdmin.from('order_items').delete().in('order_id', allOrderIds);
        await supabaseAdmin.from('orders').delete().in('id', allOrderIds);
        await supabaseAdmin.from('products').delete().in('id', allProductIds);
      }
    } catch (e) {
      console.warn('Cleanup warning:', e?.message || e);
    }
  }

  await cleanupTestData();

  t.after(async () => {
    await cleanupTestData();
    if (pool) await pool.end();
  });

  // =========================================================================
  // CENÁRIO A — DUPLICATE PAYMENT (BLOCKER 12)
  // =========================================================================
  await t.test('CENÁRIO A — Duplicate Payment: 10 concurrent requests for same order & payment', async () => {
    await insertProduct({
      id: TEST_PROD_A,
      title: 'Peça Teste Concorrência A',
      price: 100,
      stock_count: 10,
      category: 'Camisetas',
      status: 'active',
      images: JSON.stringify(['https://placehold.co/400x400.png']),
      created_at: new Date().toISOString(),
    });

    await insertOrder({
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

    const promises = Array.from({ length: 10 }).map(() =>
      callProcessApprovedOrderAtomic({
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

    const successful = responses.filter((r) => r.data && r.data.success && !r.data.already_processed && !r.data.alreadyProcessed);
    const deduplicated = responses.filter((r) => r.data && (r.data.already_processed || r.data.alreadyProcessed));

    assert.equal(successful.length, 1, 'Exactly 1 concurrent call must execute initial approval');
    assert.equal(deduplicated.length, 9, 'Remaining 9 calls must be deduplicated as already_processed');

    const stock = await getProductStock(TEST_PROD_A);
    assert.equal(stock, 9, 'Inventory decrement must be exactly 1 unit (10 -> 9)');

    const order = await getOrderStatus(TEST_ORDER_A);
    assert.equal(order?.payment_status, 'Pago', 'Payment status must transition to Pago');
    assert.equal(order?.status, 'Em Separação', 'Order status must transition to Em Separação');

    const effectCount = await getPaymentEffectsCount(TEST_ORDER_A);
    assert.equal(effectCount, 1, 'payment_effects must contain exactly 1 financial record');

    const movementCount = await getInventoryMovementsCount(TEST_ORDER_A);
    assert.equal(movementCount, 1, 'inventory_movements must contain exactly 1 sale entry');
  });

  // =========================================================================
  // CENÁRIO B — STOCK RACE (BLOCKER 12)
  // =========================================================================
  await t.test('CENÁRIO B — Stock Race: 2 simultaneous orders for stock = 1', async () => {
    await insertProduct({
      id: TEST_PROD_B,
      title: 'Peça Teste Concorrência B',
      price: 150,
      stock_count: 1,
      category: 'Camisetas',
      status: 'active',
      images: JSON.stringify(['https://placehold.co/400x400.png']),
      created_at: new Date().toISOString(),
    });

    await insertOrder({
      id: TEST_ORDER_B1,
      customer_name: 'Comprador 1',
      customer_email: 'buyer1@marmot.com',
      total: 150,
      status: 'Pendente',
      payment_status: 'Pendente',
      payment_method: 'mercadopago',
      shipping_address: { city: 'São Paulo', state: 'SP', cep: '01001-000' },
      items: [{ id: TEST_PROD_B, quantity: 1, price: 150 }],
      created_at: new Date().toISOString(),
    });

    await insertOrder({
      id: TEST_ORDER_B2,
      customer_name: 'Comprador 2',
      customer_email: 'buyer2@marmot.com',
      total: 150,
      status: 'Pendente',
      payment_status: 'Pendente',
      payment_method: 'mercadopago',
      shipping_address: { city: 'São Paulo', state: 'SP', cep: '01001-000' },
      items: [{ id: TEST_PROD_B, quantity: 1, price: 150 }],
      created_at: new Date().toISOString(),
    });

    const [res1, res2] = await Promise.all([
      callProcessApprovedOrderAtomic({
        p_order_id: TEST_ORDER_B1,
        p_payment_id: TEST_PAY_B1,
        p_amount: 150,
        p_currency: 'BRL',
        p_gateway: 'mercadopago',
        p_payment_method: 'credit_card',
        p_items: [{ id: TEST_PROD_B, quantity: 1 }],
      }),
      callProcessApprovedOrderAtomic({
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

    const stock = await getProductStock(TEST_PROD_B);
    assert.equal(stock, 0, 'Final stock must be exactly 0, never negative (-1)');
    assert.ok(stock >= 0, 'Negative stock must be strictly false');

    const countB1 = await getPaymentEffectsCount(TEST_ORDER_B1);
    const countB2 = await getPaymentEffectsCount(TEST_ORDER_B2);
    assert.equal((countB1 || 0) + (countB2 || 0), 1, 'Sum of payment_effects across both orders must equal exactly 1');

    const failedOrderId = successes[0] === res1 ? TEST_ORDER_B2 : TEST_ORDER_B1;
    const failedEffects = failedOrderId === TEST_ORDER_B1 ? countB1 : countB2;
    assert.equal(failedEffects || 0, 0, 'Rejected order must have 0 payment_effects approved');

    const failedMovements = await getInventoryMovementsCount(failedOrderId);
    assert.equal(failedMovements || 0, 0, 'Rejected order must have 0 inventory deductions');

    const failedOrder = await getOrderStatus(failedOrderId);
    assert.notEqual(failedOrder?.payment_status, 'Pago', 'Rejected order payment_status must NOT be Pago');
    assert.notEqual(failedOrder?.status, 'Em Separação', 'Rejected order status must NOT be Em Separação');
  });
});
