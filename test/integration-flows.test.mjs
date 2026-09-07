import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const sqlPath = path.resolve(process.cwd(), 'supabase-complete-production-migration.sql');
const fulfillmentSqlPath = path.resolve(process.cwd(), 'supabase/migrations/20260907140252_complete_shipping_fulfillment.sql');
const eventDrivenSqlPath = path.resolve(process.cwd(), 'supabase/migrations/20260907233335_event_driven_hobby_runtime.sql');
const apiPath = path.resolve(process.cwd(), 'api/index.ts');
const vercelPath = path.resolve(process.cwd(), 'vercel.json');
const envExamplePath = path.resolve(process.cwd(), '.env.example');
const checkoutPath = path.resolve(process.cwd(), 'src/pages/CheckoutPage.tsx');
const cartContextPath = path.resolve(process.cwd(), 'src/context/CartContext.tsx');
const shippingCalculatorPath = path.resolve(process.cwd(), 'src/components/ShippingCalculator.tsx');
const mercadoPagoUrlHelperPath = path.resolve(process.cwd(), 'src/services/mercadoPagoPreferenceUrls.ts');
const mercadoPagoBackendPath = path.resolve(process.cwd(), 'src/services/mercadopagoBackend.ts');
const mercadoPagoServicePath = path.resolve(process.cwd(), 'src/services/mercadopagoService.ts');

test('Integration & Audit Verification: P0 Production Hardening', async (t) => {
  const sql = fs.readFileSync(sqlPath, 'utf8');
  const fulfillmentSql = fs.readFileSync(fulfillmentSqlPath, 'utf8');
  const eventDrivenSql = fs.readFileSync(eventDrivenSqlPath, 'utf8');
  const api = fs.readFileSync(apiPath, 'utf8');
  const vercelConfig = JSON.parse(fs.readFileSync(vercelPath, 'utf8'));
  const envExample = fs.readFileSync(envExamplePath, 'utf8');
  const checkout = fs.readFileSync(checkoutPath, 'utf8');
  const cartContext = fs.readFileSync(cartContextPath, 'utf8');
  const shippingCalculator = fs.readFileSync(shippingCalculatorPath, 'utf8');
  const mercadoPagoUrlHelper = fs.readFileSync(mercadoPagoUrlHelperPath, 'utf8');
  const mercadoPagoBackend = fs.readFileSync(mercadoPagoBackendPath, 'utf8');
  const mercadoPagoService = fs.readFileSync(mercadoPagoServicePath, 'utf8');

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
    assert.ok(api.includes('Cotação de frete inválida ou não encontrada. Por favor, recalcule o frete para continuar.'), 'Must reject if the real quote is missing');
    // In MP preference
    assert.equal(
      api.split('Cotação de frete inválida ou não encontrada. Por favor, recalcule o frete para continuar.').length - 1,
      2,
      'Both order creation and the Mercado Pago preference must require the real quote, including free shipping'
    );
  });

  await t.test('6. POST /api/returns requires authentication and validates ownership', () => {
    assert.ok(api.includes("app.post('/api/returns', requireAuth,"), 'Must use requireAuth');
    assert.ok(api.includes('order.userId !== authUser.id'), 'Must check order ownership against authenticated user');
  });

  await t.test('7. Melhor Envio label generation is fail-closed on service ID, addresses, and print URL', () => {
    assert.ok(api.includes("'SHIPPING_QUOTE_MISMATCH'"), 'Must reject a service that differs from the selected quote');
    assert.ok(api.includes("'INVALID_RECIPIENT_DATA'"), 'Must reject incomplete destination data');
    assert.ok(api.includes("'INVALID_SENDER_DATA'"), 'Must reject incomplete sender data');
    assert.ok(api.includes("'PRINT_URL_FAILED'"), 'Must fail closed if printUrl is not returned');
  });

  await t.test('8. Tracking webhooks prevent status spoofing by validating secret or re-verifying with carrier API', () => {
    assert.ok(api.includes('MELHOR_ENVIO_WEBHOOK_SECRET'), 'Must check webhook secret');
    assert.ok(api.includes('/me/shipment/tracking'), 'Must query canonical carrier API if unauthenticated');
  });

  await t.test('9. Checkout forwards the authoritative shipping quote identifier', () => {
    assert.ok(
      checkout.includes('shippingQuoteId: activeShippingOption?.quoteId'),
      'Checkout must forward the quoteId returned by the shipping API'
    );
  });

  await t.test('10. Shipping quote lookup uses the real database primary key', () => {
    assert.ok(api.includes(".eq('id', quoteId)"), 'Shipping quote lookup must filter by shipping_quotes.id');
    assert.ok(!api.includes('quote_id.eq.${quoteId}'), 'Lookup must not reference the nonexistent quote_id column');
  });

  await t.test('11. Shipping calculation and checkout bind the same product variant', () => {
    assert.ok(cartContext.includes('size: item.selectedSize'), 'Shipping request must include selected size');
    assert.ok(
      cartContext.includes('colorName: item.selectedColor.colorName || item.selectedColor.color'),
      'Shipping request must include selected color'
    );
    assert.ok(
      api.includes("colorName: String(item.colorName || item.color || dbProduct.colors?.[0]?.colorName || 'Padrão')"),
      'Shipping quote hash must preserve the selected color'
    );
    assert.ok(
      shippingCalculator.includes('colorName: item.selectedColor.colorName || item.selectedColor.color'),
      'Reusable shipping calculator must preserve cart variant color'
    );
  });

  await t.test('12. New checkout lets the backend generate the authoritative order ID', () => {
    assert.ok(!checkout.includes('const [draftOrderId'), 'Frontend must not invent a draft order ID');
    assert.ok(!checkout.includes('orderId: currentOrderId'), 'New checkout must not send a nonexistent order as reusable');
    assert.ok(
      api.includes('orderId = `MM-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`'),
      'Backend must generate the authoritative ID for new orders'
    );
  });

  await t.test('13. Mercado Pago callbacks are omitted for localhost and private URLs', () => {
    assert.ok(
      mercadoPagoUrlHelper.includes("if (!isPublicHttpsUrl(cleanBaseUrl)) return {};"),
      'Callback fields must be omitted unless APP_URL is public HTTPS'
    );
    assert.ok(mercadoPagoUrlHelper.includes("host === 'localhost'"), 'localhost must be rejected');
    assert.ok(mercadoPagoUrlHelper.includes("octets[0] === 192 && octets[1] === 168"), 'Private LAN addresses must be rejected');
    assert.ok(api.includes('...callbackFields'), 'Preference routes must use the shared callback policy');
    assert.ok(
      mercadoPagoUrlHelper.includes('options.callbackUrl') &&
      mercadoPagoUrlHelper.indexOf('options.callbackUrl') < mercadoPagoUrlHelper.indexOf('options.appUrl'),
      'An explicit public Mercado Pago callback URL must take precedence over local APP_URL'
    );
    assert.ok(api.includes('callbackUrl: process.env.MERCADOPAGO_CALLBACK_URL'));
  });

  await t.test('14. Mercado Pago failures remain retryable without inventing order IDs', () => {
    assert.ok(api.includes("code: 'MERCADOPAGO_PREFERENCE_ERROR'"), 'Gateway failure must have a stable error code');
    assert.ok(api.includes('orderId: newOrder.id'), 'Gateway failure must return the persisted server order ID');
    assert.ok(checkout.includes('existingOrderId: retryOrderId'), 'Checkout retry must reuse only the server-issued order ID');
    assert.ok(checkout.includes('setRetryOrderId(errData.orderId.trim())'), 'Checkout must retain the server-issued ID after a gateway error');
  });

  await t.test('15. Order-created email waits for a valid Mercado Pago preference', () => {
    const preferenceSuccess = api.indexOf('const prefResponse = await preference.create({ body: preferencePayload });');
    const orderEmail = api.indexOf("template: 'order_created'", preferenceSuccess);
    assert.ok(preferenceSuccess > 0 && orderEmail > preferenceSuccess, 'Order-created email must be sent only after preference creation succeeds');
  });

  await t.test('16. Local product image URLs are not forwarded to Mercado Pago', () => {
    assert.ok(api.includes('resolveMercadoPagoPictureUrl(item.image, appUrl)'));
    assert.ok(
      mercadoPagoUrlHelper.includes('if (!baseUrl || !isPublicHttpsUrl(baseUrl)) return undefined;'),
      'Relative images must be omitted when APP_URL is local'
    );
  });

  await t.test('17. End-user auth never mutates the cached Supabase service-role client', () => {
    assert.ok(api.includes('private supabaseAuth: SupabaseClient | null = null;'));
    const registerRoute = api.slice(api.indexOf("app.post('/api/auth/register'"), api.indexOf("app.post('/api/auth/login'"));
    const loginRoute = api.slice(api.indexOf("app.post('/api/auth/login'"), api.indexOf("app.get('/api/auth/me'"));
    assert.ok(registerRoute.includes('db.getSupabaseAuthClient()'), 'Registration must use the dedicated anon auth client');
    assert.ok(loginRoute.includes('db.getSupabaseAuthClient()'), 'Login must use the dedicated anon auth client');
    assert.ok(!registerRoute.includes('db.getSupabaseAdminClient()'), 'Registration must never authenticate on the service-role client');
    assert.ok(!loginRoute.includes('db.getSupabaseAdminClient()'), 'Login must never authenticate on the service-role client');
  });

  await t.test('18. Mercado Pago retries preserve discounts, exact cents, and payment idempotency', () => {
    assert.ok(
      api.split('buildMercadoPagoProductItems(').length >= 4,
      'Both initial checkout and pay-now must use the shared discounted-item builder'
    );
    assert.ok(api.includes('const remainderUnits = lineNetCents % quantity;'), 'Discount distribution must reconcile indivisible cents');
    assert.ok(
      mercadoPagoBackend.includes('`order-${params.orderId}-${params.paymentMethod}`'),
      'Transparent payment retries must reuse a deterministic idempotency key'
    );
    assert.ok(!mercadoPagoBackend.includes('`order-${params.orderId}-${Date.now()}`'));
    const cachedClientBlock = mercadoPagoService.slice(
      mercadoPagoService.indexOf('cachedClient = new MercadoPagoConfig'),
      mercadoPagoService.indexOf('cachedAccessToken = token')
    );
    assert.ok(!cachedClientBlock.includes('idempotencyKey'), 'A cached SDK client must not reuse one idempotency key for unrelated requests');
  });

  await t.test('19. Checkout Pro return is automatic and fail-closed', () => {
    assert.ok(mercadoPagoUrlHelper.includes("auto_return: 'approved'"), 'Approved payments must auto-return');
    assert.ok(mercadoPagoUrlHelper.includes('/checkout?mp_return=success&order_id='));
    assert.ok(mercadoPagoUrlHelper.includes('/checkout?mp_return=failure&order_id='));
    assert.ok(mercadoPagoUrlHelper.includes('/checkout?mp_return=pending&order_id='));
    assert.ok(
      api.includes("app.post('/api/mercado-pago/return/verify', requireAuth"),
      'The browser return must be authenticated'
    );
    assert.ok(
      api.includes("externalReference !== order.id") && api.includes("'MERCADOPAGO_ORDER_MISMATCH'"),
      'Payment external_reference must match the authoritative order ID'
    );
    assert.ok(
      api.includes('if (!paymentData && !explicitPaymentId)'),
      'An explicit payment_id must never fall back to another payment search result'
    );
    assert.ok(
      checkout.includes("fetch('/api/mercado-pago/return/verify'") &&
      checkout.includes('data.paymentValidated !== true'),
      'The confirmation page must depend on server-side payment validation'
    );
    assert.ok(
      !checkout.includes('Fallback to fetch current order state from DB'),
      'A failed return verification must never be converted into a confirmation from URL/database fallback'
    );
  });

  await t.test('20. Shipping is charged through the Mercado Pago shipment field', () => {
    assert.ok(api.includes("cost: Number(validatedShippingFee.toFixed(2))"));
    assert.ok(api.includes("cost: Number(Number(order.shippingFee || 0).toFixed(2))"));
    assert.ok(api.split("mode: 'not_specified'").length - 1 >= 2);
    assert.ok(!api.includes("title: `Frete - ${validatedShippingOption.carrier}`"), 'Shipping must not be represented as a synthetic product');
  });

  await t.test('21. Payment, freight purchase and label generation are distinct durable states', () => {
    assert.ok(fulfillmentSql.includes('shipment_purchase_status'));
    assert.ok(fulfillmentSql.includes('label_generation_status'));
    assert.ok(fulfillmentSql.includes("NEW.shipping_status := 'Aguardando compra de frete'"));
    assert.ok(api.includes("order.shippingStatus = 'Frete comprado'"));
    assert.ok(api.includes("order.shippingStatus = 'Etiqueta gerada'"));
  });

  await t.test('22. Shipment purchase uses an atomic lease and reuses the persisted external shipment', () => {
    const claimStart = fulfillmentSql.indexOf('CREATE OR REPLACE FUNCTION public.claim_shipment_operation');
    const claimBody = fulfillmentSql.slice(claimStart, claimStart + 4500);
    assert.ok(claimStart > 0);
    assert.ok(claimBody.includes('ON CONFLICT (order_id) DO NOTHING'));
    assert.ok(claimBody.includes('FOR UPDATE'));
    assert.ok(claimBody.includes('lock_token'));
    assert.ok(api.includes('Persist before checkout: every retry reuses this exact external shipment.'));
    assert.ok(api.includes("existingOperation.shipment_id"));
  });

  await t.test('23. Fulfillment recovery is event-driven and compatible with serverless execution', () => {
    const webhookStart = api.indexOf("app.all(['/api/mercado-pago/webhook'");
    const webhookBody = api.slice(webhookStart, webhookStart + 18000);
    assert.ok(webhookBody.includes("scheduleShipmentFulfillment(fulfillmentOrderId, 'webhook')"));
    assert.ok(webhookBody.includes("scheduleShipmentFulfillment(linkedOrder.id, 'webhook_retry')"));
    assert.ok(api.includes("scheduleShipmentFulfillment(result.order.id, 'payment_return')"));
    assert.ok(api.includes("scheduleShipmentFulfillment(result.order.id, 'payment_verification')"));
    assert.ok(api.includes('waitUntil(task)'));
    assert.ok(eventDrivenSql.includes("'status', 'already_completed'"));
    assert.ok(eventDrivenSql.includes("'order_id', v_event.order_id"));
    assert.ok(!api.includes('processPendingPaidShipments'));
  });

  await t.test('23b. Vercel runtime has no scheduled route, schedule, timer, or dedicated secret', () => {
    assert.equal(vercelConfig.crons, undefined);
    assert.equal(vercelConfig.fluid, true);
    assert.ok(!JSON.stringify(vercelConfig).includes('*/15'));
    assert.ok(!api.includes('/api/cron/'));
    assert.ok(!api.includes('CRON_SECRET'));
    assert.ok(!api.includes('setInterval('));
    assert.ok(!envExample.includes('CRON_SECRET'));
    assert.ok(api.includes("app.post('/api/admin/tracking/sync-active', requireAdmin"));
    assert.ok(api.includes("app.use('/api', (_req, res)"));
  });

  await t.test('24. Webhook idempotency is notification-based and database-atomic', () => {
    assert.ok(api.includes('const notificationId = req.body?.id'));
    assert.ok(api.includes("req.body?.data?.id || req.query.id"));
    assert.match(api, /notificationId\r?\n\s*\?/);
    assert.ok(fulfillmentSql.includes('ON CONFLICT (gateway, event_key) DO NOTHING'));
    assert.ok(fulfillmentSql.includes('FOR UPDATE'));
  });

  await t.test('25. Atomic payment settlement is not followed by a second stock debit', () => {
    const applyStart = api.indexOf('async function applyMercadoPagoPaymentToOrder');
    const applyEnd = api.indexOf("app.all(['/api/mercado-pago/webhook'", applyStart);
    const settlement = api.slice(applyStart, applyEnd);
    assert.ok(settlement.includes('db.processApprovedOrderAtomic('));
    assert.ok(!settlement.includes('deductStockAtomic('));
    assert.ok(api.includes("rpc('process_approved_order_atomic'"));
  });

  await t.test('26. Shipment creation is fail-closed without real fiscal, sender, recipient and quote data', () => {
    const processorStart = api.indexOf('async function processMelhorEnvioShipment');
    const processorEnd = api.indexOf('// --- ADMIN: GERAR ENVIO REAL', processorStart);
    const processor = api.slice(processorStart, processorEnd);
    assert.ok(processor.includes("code: 'MISSING_SHIPPING_QUOTE'") || processor.includes("'MISSING_SHIPPING_QUOTE'"));
    assert.ok(processor.includes("'INVALID_SENDER_DATA'"));
    assert.ok(processor.includes("'INVALID_RECIPIENT_DATA'"));
    assert.ok(processor.includes("'MISSING_SHIPMENT_DOCUMENT_MODE'"));
    assert.ok(processor.includes("'MISSING_INVOICE_KEY'"));
    assert.ok(!processor.includes("'11988421092'"));
    assert.ok(!processor.includes("'contato@marmot.com.br'"));
  });
});
