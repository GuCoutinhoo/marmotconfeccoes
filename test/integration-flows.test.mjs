import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const sqlPath = path.resolve(process.cwd(), 'supabase-complete-production-migration.sql');
const apiPath = path.resolve(process.cwd(), 'api/index.ts');

test('Integration & Audit Verification: P0 Production Hardening', async (t) => {
  const sql = fs.readFileSync(sqlPath, 'utf8');
  const api = fs.readFileSync(apiPath, 'utf8');

  await t.test('1. process_approved_order_atomic locks order FOR UPDATE before idempotency check', () => {
    const fnStart = sql.indexOf('CREATE OR REPLACE FUNCTION public.process_approved_order_atomic');
    assert.ok(fnStart > 0, 'Function must exist in SQL');
    const fnBody = sql.slice(fnStart, fnStart + 2500);

    const lockIdx = fnBody.indexOf('FOR UPDATE');
    const idempotencyIdx = fnBody.indexOf('payment_effects');

    assert.ok(lockIdx > 0, 'Order row lock FOR UPDATE must be present');
    assert.ok(idempotencyIdx > 0, 'Idempotency check must be present');
    assert.ok(lockIdx < idempotencyIdx, 'Order lock must happen BEFORE checking payment_effects to prevent race condition');
  });

  await t.test('2. process_approved_order_atomic fails closed when product is not found', () => {
    assert.ok(sql.includes('INVALID_ORDER_ITEM: Produto %s não encontrado no catálogo'), 'Stock check must fail if product is missing');
    assert.ok(sql.includes('Produto % não encontrado durante dedução de estoque'), 'Stock deduction must abort if product is missing');
  });

  await t.test('3. Permissive RLS policies are explicitly dropped', () => {
    assert.ok(sql.includes('DROP POLICY IF EXISTS "Order items insert allowed" ON public.order_items;'));
    assert.ok(sql.includes('DROP POLICY IF EXISTS "Returns insert allowed" ON public.returns;'));
  });

  await t.test('4. Free shipping threshold is unified to 399.00', () => {
    assert.ok(sql.includes('399.00'), 'SQL default must be 399.00');
    assert.ok(sql.includes('FRETE GRÁTIS EM COMPRAS ACIMA DE R$ 399'), 'SQL announcement must state R$ 399');
    assert.ok(api.includes('authoritativeSubtotal >= 399.00'), 'Order calculation must use threshold 399.00');
    assert.ok(api.includes('subtotal >= 399.00'), 'Mercado Pago preference must use threshold 399.00');
  });

  await t.test('5. Fail-Closed shipping quote validation without fallback to client shippingFee', () => {
    // In order creation
    assert.ok(!api.includes('validatedShippingFee = Math.max(0, Number(body.shippingFee) || 0)'), 'Must not fallback to body.shippingFee');
    assert.ok(api.includes('Cotação de frete obrigatória para pedidos com subtotal inferior a R$ 399,00'), 'Must reject if quote is missing under 399');
    // In MP preference
    assert.ok(api.includes('Cotação de frete obrigatória para compras abaixo de R$ 399,00'), 'Must reject in MP preference if quote missing');
  });

  await t.test('6. POST /api/returns requires authentication and validates ownership', () => {
    assert.ok(api.includes("app.post('/api/returns', requireAuth,"), 'Must use requireAuth');
    assert.ok(api.includes('order.userId !== authUser.id'), 'Must check order ownership against authenticated user');
  });

  await t.test('7. Melhor Envio label generation is fail-closed on service ID, addresses, and print URL', () => {
    assert.ok(api.includes("code: 'MISSING_SERVICE_ID'"), 'Must reject missing service ID');
    assert.ok(api.includes("code: 'INCOMPLETE_DEST_ADDRESS'"), 'Must reject incomplete destination address');
    assert.ok(api.includes("code: 'INCOMPLETE_SENDER_DATA'"), 'Must reject incomplete sender address');
    assert.ok(api.includes("code: 'PRINT_URL_FAILED'"), 'Must fail closed if printUrl is not returned');
  });

  await t.test('8. Tracking webhooks prevent status spoofing by validating secret or re-verifying with carrier API', () => {
    assert.ok(api.includes('MELHOR_ENVIO_WEBHOOK_SECRET'), 'Must check webhook secret');
    assert.ok(api.includes('/me/shipment/tracking'), 'Must query canonical carrier API if unauthenticated');
  });
});
