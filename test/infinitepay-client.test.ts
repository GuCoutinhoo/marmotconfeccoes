import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { after, beforeEach, test } from 'node:test';
import {
  createInfinitePayCheckout,
  InfinitePayClientError,
  parseInfinitePayCheckoutResponse,
  sanitizeInfinitePayCheckoutUrl,
} from '../src/server/infinitePayClient';

const originalFetch = globalThis.fetch;
const originalHandle = process.env.INFINITEPAY_HANDLE;
const originalNodeEnv = process.env.NODE_ENV;

beforeEach(() => {
  process.env.INFINITEPAY_HANDLE = 'marmot-test-handle';
  process.env.NODE_ENV = 'test';
});

after(() => {
  globalThis.fetch = originalFetch;
  if (originalHandle === undefined) delete process.env.INFINITEPAY_HANDLE;
  else process.env.INFINITEPAY_HANDLE = originalHandle;
  if (originalNodeEnv === undefined) delete process.env.NODE_ENV;
  else process.env.NODE_ENV = originalNodeEnv;
});

const validCheckoutInput = {
  orderNsu: 'MM-TEST-001',
  redirectUrl: 'http://localhost:3000/checkout?infinitepay_return=1',
  items: [{ quantity: 1, price: 19_990, description: 'Pedido MM-TEST-001' }],
};

function mockProviderResponse(status: number, body: unknown): void {
  globalThis.fetch = async () => new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

test('aceita somente os hosts oficiais explícitos de checkout', () => {
  assert.equal(
    sanitizeInfinitePayCheckoutUrl('https://checkout.infinitepay.io/merchant?lenc=opaque'),
    'https://checkout.infinitepay.io/merchant?lenc=opaque',
  );
  assert.equal(
    sanitizeInfinitePayCheckoutUrl('https://checkout.infinitepay.com.br/merchant?lenc=opaque'),
    'https://checkout.infinitepay.com.br/merchant?lenc=opaque',
  );
});

test('bloqueia domínio malicioso, subdomínio não autorizado e porta não padrão', () => {
  for (const value of [
    'https://example.com/checkout',
    'https://checkout.infinitepay.io.example.com/checkout',
    'https://evil.checkout.infinitepay.io/checkout',
    'https://checkout.infinitepay.io:8443/checkout',
  ]) {
    assert.throws(() => sanitizeInfinitePayCheckoutUrl(value), (error: unknown) => {
      return error instanceof InfinitePayClientError && error.code === 'INFINITEPAY_INVALID_CHECKOUT_URL';
    });
  }
});

test('bloqueia HTTP e credenciais embutidas na URL', () => {
  for (const value of [
    'http://checkout.infinitepay.io/checkout',
    'https://user:password@checkout.infinitepay.io/checkout',
  ]) {
    assert.throws(() => sanitizeInfinitePayCheckoutUrl(value), (error: unknown) => {
      return error instanceof InfinitePayClientError && error.code === 'INFINITEPAY_INVALID_CHECKOUT_URL';
    });
  }
});

test('valida o contrato real { url } e rejeita resposta sem URL', () => {
  assert.deepEqual(
    parseInfinitePayCheckoutResponse({ url: 'https://checkout.infinitepay.io/merchant', extra: true }),
    { url: 'https://checkout.infinitepay.io/merchant' },
  );
  assert.throws(() => parseInfinitePayCheckoutResponse({ checkout_url: 'https://checkout.infinitepay.io/merchant' }), (error: unknown) => {
    return error instanceof InfinitePayClientError && error.code === 'INFINITEPAY_INVALID_RESPONSE';
  });
});

test('mapeia resposta 4xx da InfinitePay para erro controlado não retryable', async () => {
  mockProviderResponse(422, { error: 'invalid request' });
  await assert.rejects(createInfinitePayCheckout(validCheckoutInput), (error: unknown) => {
    return error instanceof InfinitePayClientError &&
      error.code === 'INFINITEPAY_HTTP_ERROR' && error.status === 422 && !error.retryable;
  });
});

test('mapeia resposta 5xx da InfinitePay para erro controlado retryable', async () => {
  mockProviderResponse(503, { error: 'unavailable' });
  await assert.rejects(createInfinitePayCheckout(validCheckoutInput), (error: unknown) => {
    return error instanceof InfinitePayClientError &&
      error.code === 'INFINITEPAY_HTTP_ERROR' && error.status === 503 && error.retryable;
  });
});

test('mapeia timeout para erro controlado retryable', async () => {
  globalThis.fetch = async () => {
    throw new DOMException('The operation was aborted.', 'AbortError');
  };
  await assert.rejects(createInfinitePayCheckout(validCheckoutInput), (error: unknown) => {
    return error instanceof InfinitePayClientError && error.code === 'INFINITEPAY_TIMEOUT' && error.retryable;
  });
});

test('checkout criado retorna URL validada no contrato do cliente', async () => {
  mockProviderResponse(200, { url: 'https://checkout.infinitepay.io/merchant?lenc=opaque' });
  const result = await createInfinitePayCheckout(validCheckoutInput);
  assert.deepEqual(result, { url: 'https://checkout.infinitepay.io/merchant?lenc=opaque' });
});

test('fluxo mantém idempotência, retry de failed e contrato checkoutUrl', () => {
  const root = process.cwd();
  const checkoutPage = fs.readFileSync(path.join(root, 'src/pages/CheckoutPage.tsx'), 'utf8');
  const accountPage = fs.readFileSync(path.join(root, 'src/pages/AccountPage.tsx'), 'utf8');
  const api = fs.readFileSync(path.join(root, 'api/index.ts'), 'utf8');
  const migration = fs.readFileSync(path.join(root, 'supabase/migrations/20260908120000_infinitepay_payment_migration.sql'), 'utf8');

  assert.ok(checkoutPage.includes('if (checkoutRequestInFlightRef.current) return;'));
  assert.ok(checkoutPage.includes('checkoutRequestInFlightRef.current = true;'));
  assert.ok(checkoutPage.includes('const checkoutUrl = data.checkoutUrl;'));
  assert.ok(checkoutPage.includes('window.location.assign(checkoutUrl);'));
  assert.ok(accountPage.includes('window.location.assign(data.checkoutUrl);'));

  const createHandler = api.slice(
    api.indexOf('async function handleCreateInfinitePayCheckout'),
    api.indexOf('interface InfinitePayConfirmationInput'),
  );
  assert.ok(createHandler.includes('checkoutUrl: checkout.url'));
  assert.ok(!createHandler.includes('targetUrl: checkout.url'));
  assert.ok(createHandler.includes('getOrderByCheckoutAttempt(orderUserId, checkoutAttemptId)'));
  assert.ok(createHandler.includes('existingOrderId: retryOrderId') || checkoutPage.includes('existingOrderId: retryOrderId'));

  const releaseFunction = migration.slice(
    migration.indexOf('CREATE OR REPLACE FUNCTION public.release_payment_session_creation'),
    migration.indexOf('-- Financial failures/expiry'),
  );
  assert.ok(releaseFunction.includes("checkout_session_state = 'failed'"));
  assert.ok(releaseFunction.includes('checkout_session_lease_until = NULL'));

  const claimFunction = migration.slice(
    migration.indexOf('CREATE OR REPLACE FUNCTION public.claim_payment_session_creation'),
    migration.indexOf('DROP FUNCTION IF EXISTS public.link_payment_session_atomic'),
  );
  assert.ok(claimFunction.includes('checkout_session_lease_until > NOW()'));
  assert.ok(claimFunction.includes("checkout_session_state = 'creating'"));
  assert.ok(!claimFunction.includes("checkout_session_state = 'failed' THEN"));
});
