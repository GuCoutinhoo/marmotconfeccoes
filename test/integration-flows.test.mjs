import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const api = fs.readFileSync(path.join(root, 'api/index.ts'), 'utf8');
const checkout = fs.readFileSync(path.join(root, 'src/pages/CheckoutPage.tsx'), 'utf8');
const stripeClient = fs.readFileSync(path.join(root, 'src/server/stripeClient.ts'), 'utf8');
const migration = fs.readFileSync(
  path.join(root, 'supabase/migrations/20260908120000_stripe_payment_migration.sql'),
  'utf8',
);
const envExample = fs.readFileSync(path.join(root, '.env.example'), 'utf8');
const packageJson = fs.readFileSync(path.join(root, 'package.json'), 'utf8');

function sourceFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(fullPath);
    return /\.(?:ts|tsx|js|jsx|mjs|cjs)$/.test(entry.name) ? [fullPath] : [];
  });
}

test('Stripe migration: payment, security, idempotency and fulfillment invariants', async (t) => {
  await t.test('Stripe webhook receives the raw body before JSON middleware', () => {
    const rawRoute = api.indexOf("app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), handleStripeWebhook)");
    const jsonMiddleware = api.indexOf('app.use(express.json(');
    assert.ok(rawRoute > 0, 'Stripe raw-body webhook route is missing');
    assert.ok(jsonMiddleware > rawRoute, 'JSON middleware must be registered after the raw-body webhook');
  });

  await t.test('Webhook signature and test/live mode are fail-closed', () => {
    assert.ok(api.includes('webhooks.constructEvent(req.body, signature, webhookSecret)'));
    assert.ok(api.includes('STRIPE_WEBHOOK_SIGNATURE_INVALID'));
    assert.ok(api.includes('STRIPE_WEBHOOK_MODE_MISMATCH'));
    assert.ok(api.includes('webhookSecretValid'));
  });

  await t.test('payment_intent.succeeded is the sole payment settlement event', () => {
    const checkoutCompleted = api.slice(
      api.indexOf("case 'checkout.session.completed'"),
      api.indexOf("case 'payment_intent.succeeded'"),
    );
    const paymentSucceeded = api.slice(
      api.indexOf("case 'payment_intent.succeeded'"),
      api.indexOf("case 'payment_intent.payment_failed'"),
    );
    assert.ok(!checkoutCompleted.includes('processApprovedOrderAtomic('));
    assert.ok(paymentSucceeded.includes('settleStripePaymentIntent(intent)'));
    assert.ok(api.includes("case 'checkout.session.async_payment_succeeded'"));
  });

  await t.test('Success page is read-only and never marks an order paid', () => {
    assert.ok(checkout.includes('/api/stripe/checkout-session/'));
    assert.ok(checkout.includes('/api/stripe/orders/'));
    assert.ok(checkout.includes('fetch(endpoint, { headers: getCheckoutAuthHeaders() })'));
    assert.ok(!checkout.includes('/return/verify'));
    const statusRoutes = api.slice(
      api.indexOf("app.get('/api/stripe/checkout-session/:sessionId/status'"),
      api.indexOf('// --- Admin Stats & Overview ---'),
    );
    assert.ok(statusRoutes.includes('requireAuth'));
    assert.ok(statusRoutes.includes("confirmed: order.paymentStatus === 'Pago'"));
    assert.ok(!statusRoutes.includes("paymentStatus = 'Pago'"));
  });

  await t.test('The pending order is persisted before Stripe Checkout is created', () => {
    const handler = api.slice(
      api.indexOf('async function handleCreateStripeCheckout'),
      api.indexOf('async function updateStripeOrderState'),
    );
    assert.ok(handler.indexOf('await db.saveOrder(order)') > 0);
    assert.ok(handler.indexOf('await db.saveOrder(order)') < handler.indexOf('createStripeSessionForOrder(order'));
    assert.ok(handler.includes("paymentStatus: 'Pendente'"));
    assert.ok(handler.includes("paymentProvider: 'stripe'"));
  });

  await t.test('Prices, variants, stock, coupon and shipping are recalculated by the backend', () => {
    const handler = api.slice(
      api.indexOf('async function handleCreateStripeCheckout'),
      api.indexOf('async function updateStripeOrderState'),
    );
    assert.ok(handler.includes('await db.getProductById(productId)'));
    assert.ok(handler.includes('const unitPrice = Number('));
    assert.ok(handler.includes('await db.validateCoupon('));
    assert.ok(handler.includes('await db.getShippingQuote(requestedQuoteId)'));
    assert.ok(handler.includes('generateCanonicalCartHash(destinationCep, validatedItems)'));
    assert.ok(!handler.includes('rawItem.price'));
    assert.ok(!handler.includes('body.total'));
    assert.ok(!handler.includes('body.shippingFee'));
  });

  await t.test('BRL values use integer cents and Stripe line items reconcile exactly', () => {
    assert.ok(stripeClient.includes('Math.round((value + Number.EPSILON) * 100)'));
    assert.ok(api.includes("currency: 'brl'"));
    assert.ok(api.includes('lineItemsTotal !== productNetCents + shippingCents'));
    assert.ok(api.includes('amountCents !== reaisToCents(Number(order.total))'));
  });

  await t.test('Checkout Session is linked through order/user metadata', () => {
    assert.ok(api.includes('client_reference_id: order.id'));
    assert.ok(api.includes('order_id: order.id'));
    assert.ok(api.includes("user_id: String(order.userId || '')"));
    assert.ok(api.includes('STRIPE_SESSION_ORDER_MISMATCH'));
    assert.ok(api.includes('PAYMENT_USER_MISMATCH'));
  });

  await t.test('Success and cancel URLs are environment-aware', () => {
    assert.ok(api.includes('resolveStripeBaseUrl(req)'));
    assert.ok(api.includes('stripe_return=success&session_id={CHECKOUT_SESSION_ID}'));
    assert.ok(api.includes('stripe_return=cancel&order_id='));
    assert.ok(stripeClient.includes("return 'http://localhost:3000'"));
    assert.ok(api.includes('APP_URL_NOT_CONFIGURED'));
  });

  await t.test('Double-click and concurrent Checkout Session creation are serialized', () => {
    assert.ok(migration.includes('CREATE OR REPLACE FUNCTION public.claim_payment_session_creation'));
    assert.ok(migration.includes('FOR UPDATE'));
    assert.ok(migration.includes("checkout_session_state = 'creating'"));
    assert.ok(migration.includes("INTERVAL '45 seconds'"));
    assert.ok(api.includes('claimPaymentSessionCreation('));
    assert.ok(api.includes('CHECKOUT_CREATION_IN_PROGRESS'));
    assert.ok(api.includes('idempotencyKey:'));
  });

  await t.test('Approved payment, inventory, ledger and cart cleanup are atomic', () => {
    const settlement = migration.slice(
      migration.indexOf('CREATE OR REPLACE FUNCTION public.process_approved_order_atomic'),
      migration.indexOf('CREATE OR REPLACE FUNCTION public.process_provider_refund_atomic'),
    );
    assert.ok(settlement.includes('FROM public.orders'));
    assert.ok(settlement.includes('FOR UPDATE'));
    assert.ok(settlement.includes('INSERT INTO public.payment_effects'));
    assert.ok(settlement.includes('UPDATE public.products'));
    assert.ok(settlement.includes('INSERT INTO public.inventory_movements'));
    assert.ok(settlement.includes('DELETE FROM public.cart_items'));
    assert.ok(settlement.includes("payment_status = 'Pago'"));
  });

  await t.test('Failed and expired events can never downgrade paid/refunded orders', () => {
    assert.ok(migration.includes("v_order.payment_status IN ('Pago', 'Reembolsado')"));
    assert.ok(migration.includes("'terminal_payment_state'"));
    assert.ok(api.includes("case 'payment_intent.payment_failed'"));
    assert.ok(api.includes("case 'checkout.session.expired'"));
  });

  await t.test('Webhook replay is deduplicated before business effects', () => {
    assert.ok(api.includes("db.claimWebhookEvent('stripe', event.id, event.type"));
    assert.ok(api.includes('STRIPE_WEBHOOK_DUPLICATE_IGNORED'));
    assert.ok(migration.includes('payment_effects'));
    assert.ok(migration.includes("'alreadyProcessed', TRUE"));
  });

  await t.test('Shipment purchase starts only after trusted settlement or admin reconciliation', () => {
    assert.ok(api.includes("scheduleShipmentFulfillment(linkedOrderId, 'webhook')"));
    assert.ok(api.includes("scheduleShipmentFulfillment(settled.order.id, 'admin_sync')"));
    assert.ok(!api.includes('payment_return'));
    assert.ok(!api.includes('payment_verification'));
    assert.ok(api.includes("if (order.paymentProvider === 'stripe')"));
    assert.ok(api.includes("order.paymentStatus === 'Pago'"));
  });

  await t.test('Refunds call Stripe first and persist idempotently afterwards', () => {
    const refundRoute = api.slice(
      api.indexOf("app.post('/api/admin/orders/:id/refund'"),
      api.indexOf('// --- Payments & Financial Transactions ---'),
    );
    assert.ok(refundRoute.includes('requireAdmin'));
    assert.ok(refundRoute.includes('getRequiredStripeClient().refunds.create'));
    assert.ok(refundRoute.includes('idempotencyKey:'));
    assert.ok(refundRoute.includes('processProviderRefundAtomic'));
    assert.ok(migration.includes('UNIQUE(payment_provider, provider_refund_id)'));
  });

  await t.test('Manual payment reconciliation is admin-only and checks Stripe', () => {
    const syncRoute = api.slice(
      api.indexOf("app.post('/api/admin/orders/:id/sync-payment'"),
      api.indexOf('// --- Admin Stats & Overview ---'),
    );
    assert.ok(syncRoute.includes('requireAdmin'));
    assert.ok(syncRoute.includes('checkout.sessions.retrieve'));
    assert.ok(syncRoute.includes("session.payment_status !== 'paid'"));
    assert.ok(syncRoute.includes('settleStripePaymentIntent'));
  });

  await t.test('Stripe secrets remain server-only', () => {
    const browserSources = sourceFiles(path.join(root, 'src'))
      .filter((file) => !file.includes(`${path.sep}server${path.sep}`))
      .map((file) => fs.readFileSync(file, 'utf8'))
      .join('\n');
    assert.ok(!browserSources.includes('STRIPE_SECRET_KEY'));
    assert.ok(!browserSources.includes('STRIPE_WEBHOOK_SECRET'));
    assert.ok(!browserSources.includes('sk_test_'));
    assert.ok(!browserSources.includes('sk_live_'));
    assert.ok(!envExample.includes('VITE_STRIPE_SECRET'));
  });

  await t.test('Environment template declares empty Stripe variables', () => {
    assert.match(envExample, /^STRIPE_PUBLIC_KEY=\s*$/m);
    assert.match(envExample, /^STRIPE_SECRET_KEY=\s*$/m);
    assert.match(envExample, /^STRIPE_WEBHOOK_SECRET=\s*$/m);
    assert.ok(!envExample.includes('MERCADOPAGO_'));
  });

  await t.test('Mercado Pago has no runtime dependency or route', () => {
    const runtimeText = [
      api,
      packageJson,
      envExample,
      ...sourceFiles(path.join(root, 'src')).map((file) => fs.readFileSync(file, 'utf8')),
    ].join('\n');
    assert.doesNotMatch(runtimeText, /mercado\s*_?\s*pago|mercadopago/i);
    assert.ok(!JSON.parse(packageJson).dependencies.mercadopago);
    assert.ok(JSON.parse(packageJson).dependencies.stripe);
  });

  await t.test('Historical provider data is preserved during schema evolution', () => {
    assert.ok(migration.includes('provider-specific columns remain untouched'));
    assert.ok(migration.includes('payment_provider_payment_id'));
    assert.ok(migration.includes('payment_provider_session_id'));
    assert.ok(!migration.includes('DROP COLUMN'));
  });
});
