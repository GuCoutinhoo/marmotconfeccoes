import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const api = fs.readFileSync(path.join(root, 'api/index.ts'), 'utf8');
const checkout = fs.readFileSync(path.join(root, 'src/pages/CheckoutPage.tsx'), 'utf8');
const client = fs.readFileSync(path.join(root, 'src/server/infinitePayClient.ts'), 'utf8');
const migration = fs.readFileSync(path.join(root, 'supabase/migrations/20260908120000_infinitepay_payment_migration.sql'), 'utf8');
const envExample = fs.readFileSync(path.join(root, '.env.example'), 'utf8');
const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));

function sourceFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(fullPath);
    return /\.(?:ts|tsx|js|jsx|mjs|cjs)$/.test(entry.name) ? [fullPath] : [];
  });
}

test('InfinitePay migration: checkout, security, idempotency and fulfillment invariants', async (t) => {
  await t.test('uses only the two documented InfinitePay endpoints', () => {
    assert.ok(client.includes("postInfinitePay('/links'"));
    assert.ok(client.includes("postInfinitePay('/payment_check'"));
    assert.ok(client.includes("const INFINITEPAY_API_BASE_URL = 'https://api.checkout.infinitepay.io'"));
    assert.ok(!client.includes('Authorization'));
    assert.ok(!client.includes('INFINITEPAY_SECRET'));
  });

  await t.test('persists a pending order before requesting a checkout link', () => {
    const handler = api.slice(api.indexOf('async function handleCreateInfinitePayCheckout'), api.indexOf('interface InfinitePayConfirmationInput'));
    assert.ok(handler.indexOf('await db.saveOrder(order)') > 0);
    assert.ok(handler.indexOf('await db.saveOrder(order)') < handler.indexOf('createInfinitePayCheckoutForOrder(order'));
    assert.ok(handler.includes("paymentStatus: 'Pendente'"));
    assert.ok(handler.includes("paymentProvider: 'infinitepay'"));
  });

  await t.test('recalculates prices, variants, stock, coupon and persisted shipping server-side', () => {
    const handler = api.slice(api.indexOf('async function handleCreateInfinitePayCheckout'), api.indexOf('interface InfinitePayConfirmationInput'));
    assert.ok(handler.includes('await db.getProductById(productId)'));
    assert.ok(handler.includes('await db.validateCoupon('));
    assert.ok(handler.includes('await db.getShippingQuote(requestedQuoteId)'));
    assert.ok(handler.includes('generateCanonicalCartHash(destinationCep, validatedItems)'));
    assert.ok(!handler.includes('rawItem.price'));
    assert.ok(!handler.includes('body.total'));
    assert.ok(!handler.includes('body.shippingFee'));
  });

  await t.test('sends exact integer-cent items including shipping', () => {
    assert.ok(client.includes('Math.round((value + Number.EPSILON) * 100)'));
    assert.ok(api.includes('lineItemsTotal !== productNetCents + shippingCents'));
    assert.ok(api.includes("description: `Frete - ${shippingLabel}`"));
  });

  await t.test('omits an unreachable localhost webhook and builds a public HTTPS webhook', () => {
    assert.ok(client.includes('if (!isPublicHttpsUrl(baseUrl)) return undefined'));
    assert.ok(client.includes('/api/infinitepay/webhook'));
    assert.ok(api.includes('webhookUrl,'));
    assert.ok(api.includes('APP_URL_NOT_CONFIGURED'));
  });

  await t.test('serializes duplicate checkout-link creation in Postgres', () => {
    assert.ok(migration.includes('CREATE OR REPLACE FUNCTION public.claim_payment_session_creation'));
    assert.ok(migration.includes('FOR UPDATE'));
    assert.ok(migration.includes("checkout_session_state = 'creating'"));
    assert.ok(migration.includes("INTERVAL '45 seconds'"));
    assert.ok(api.includes('claimPaymentSessionCreation('));
    assert.ok(api.includes('CHECKOUT_CREATION_IN_PROGRESS'));
  });

  await t.test('redirect and webhook share one server-side confirmation routine', () => {
    assert.ok(api.includes("app.post('/api/infinitepay/confirm', requireAuth"));
    assert.ok(api.includes("app.post('/api/infinitepay/webhook'"));
    assert.ok((api.match(/confirmInfinitePayPayment\(\{/g) || []).length >= 3);
    assert.ok(checkout.includes("fetch('/api/infinitepay/confirm'"));
    assert.ok(!checkout.includes('setInterval('));
  });

  await t.test('server-to-server payment check is required before paid state', () => {
    const confirm = api.slice(api.indexOf('async function confirmInfinitePayPayment'), api.indexOf("app.post('/api/infinitepay/checkout'"));
    assert.ok(confirm.includes('await checkInfinitePayPayment('));
    assert.ok(confirm.includes('!checked.success || !checked.paid'));
    assert.ok(confirm.includes('checked.amount !== expectedAmountCents'));
    assert.ok(confirm.indexOf('await checkInfinitePayPayment(') < confirm.indexOf('processApprovedOrderAtomic('));
  });

  await t.test('approved payment, stock, ledger and cart cleanup are atomic', () => {
    const settlement = migration.slice(migration.indexOf('CREATE OR REPLACE FUNCTION public.process_approved_order_atomic'), migration.indexOf('CREATE OR REPLACE FUNCTION public.process_provider_refund_atomic'));
    assert.ok(settlement.includes('FROM public.orders'));
    assert.ok(settlement.includes('FOR UPDATE'));
    assert.ok(settlement.includes('INSERT INTO public.payment_effects'));
    assert.ok(settlement.includes('UPDATE public.products'));
    assert.ok(settlement.includes('INSERT INTO public.inventory_movements'));
    assert.ok(settlement.includes('DELETE FROM public.cart_items'));
    assert.ok(settlement.includes("payment_status = 'Pago'"));
  });

  await t.test('webhook replay is deduplicated before business effects', () => {
    assert.ok(api.includes("db.claimWebhookEvent('infinitepay', transactionNsu"));
    assert.ok(api.includes("claim.status === 'already_completed'"));
    assert.ok(migration.includes("'alreadyProcessed', TRUE"));
  });

  await t.test('shipment starts only after verified atomic settlement', () => {
    const confirm = api.slice(api.indexOf('async function confirmInfinitePayPayment'), api.indexOf("app.post('/api/infinitepay/checkout'"));
    assert.ok(confirm.includes('needsShipmentFulfillment(settledOrder)'));
    assert.ok(confirm.includes('scheduleShipmentFulfillment('));
    assert.ok(confirm.indexOf('processApprovedOrderAtomic(') < confirm.indexOf('scheduleShipmentFulfillment('));
  });

  await t.test('browser code contains no backend credential and cart clearing is conditional on paid DB state', () => {
    const browserSources = sourceFiles(path.join(root, 'src'))
      .filter((file) => !file.includes(`${path.sep}server${path.sep}`))
      .map((file) => fs.readFileSync(file, 'utf8')).join('\n');
    assert.ok(!browserSources.includes('INFINITEPAY_SECRET'));
    assert.ok(checkout.includes("paymentStatus === 'Pago'"));
    assert.ok(checkout.includes('clearCart()'));
  });

  await t.test('environment template declares only documented InfinitePay configuration', () => {
    assert.match(envExample, /^INFINITEPAY_HANDLE=\s*$/m);
    assert.match(envExample, /^INFINITEPAY_WEBHOOK_URL=\s*$/m);
    assert.ok(!envExample.includes('STRIPE_'));
    assert.ok(!envExample.includes('MERCADOPAGO_'));
  });

  await t.test('legacy gateways have no runtime package, route or client', () => {
    const runtimeText = [api, envExample, ...sourceFiles(path.join(root, 'src')).map((file) => fs.readFileSync(file, 'utf8'))].join('\n');
    assert.doesNotMatch(runtimeText, /mercado\s*_?\s*pago|mercadopago|api\/stripe|stripe checkout/i);
    assert.ok(!packageJson.dependencies.mercadopago);
    assert.ok(!packageJson.dependencies.stripe);
  });

  await t.test('historical provider columns are preserved during generic schema evolution', () => {
    assert.ok(migration.includes('provider-specific columns remain untouched'));
    assert.ok(migration.includes('payment_provider_payment_id'));
    assert.ok(migration.includes('payment_provider_session_id'));
    assert.ok(!migration.includes('DROP COLUMN'));
  });
});
