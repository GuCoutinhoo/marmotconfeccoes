#!/usr/bin/env node
/**
 * MARMOT CONFECÇÕES - DISPOSABLE SUPABASE HTTP EMULATOR DAEMON
 * Serves Auth, PostgREST, RLS, and Atomic Financial Operations on port 54321.
 */

import http from 'node:http';
import crypto from 'node:crypto';

const JWT_SECRET = process.env.DISPOSABLE_JWT_SECRET || 'super-secret-jwt-token-with-at-least-32-characters-long';
const PORT = 54321;

function signJwt(payload, secret = JWT_SECRET) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', secret).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${signature}`;
}

function verifyJwt(token, secret = JWT_SECRET) {
  try {
    const [headerB64, bodyB64, sig] = token.split('.');
    if (!headerB64 || !bodyB64 || !sig) return null;
    const expectedSig = crypto.createHmac('sha256', secret).update(`${headerB64}.${bodyB64}`).digest('base64url');
    if (crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig))) {
      return JSON.parse(Buffer.from(bodyB64, 'base64url').toString('utf8'));
    }
  } catch {
    return null;
  }
  return null;
}

const CUSTOMER_ID = '11111111-1111-4111-8111-111111111111';
const ADMIN_ID = '22222222-2222-4222-8222-222222222222';
const ATTACKER_ID = '33333333-3333-4333-8333-333333333333';

const TEST_USERS = {
  customer: {
    id: CUSTOMER_ID,
    email: 'test-customer-e2e@marmot-disposable.test',
    password: 'CustomerPass123!Safe',
    role: 'customer',
    app_metadata: { provider: 'email', providers: ['email'], role: 'customer' },
    user_metadata: { name: 'Cliente E2E Teste', full_name: 'Cliente E2E Teste' },
  },
  admin: {
    id: ADMIN_ID,
    email: 'test-admin-e2e@marmot-disposable.test',
    password: 'AdminPass123!Safe',
    role: 'admin',
    app_metadata: { provider: 'email', providers: ['email'], role: 'admin' },
    user_metadata: { name: 'Administrador E2E Teste', full_name: 'Administrador E2E Teste' },
  },
  attacker: {
    id: ATTACKER_ID,
    email: 'test-attacker-e2e@marmot-disposable.test',
    password: 'AttackerPass123!Safe',
    role: 'customer',
    app_metadata: { provider: 'email', providers: ['email'], role: 'customer' },
    user_metadata: { name: 'Attacker Teste', full_name: 'Attacker Teste' },
  }
};

const dbStore = {
  users: new Map(),
  profiles: new Map(),
  products: new Map(),
  orders: new Map(),
  paymentEffects: new Map(), // key: `${gateway}:${payment_id}` or by orderId
  orderStatusHistory: [],
  inventoryMovements: [],
  locks: new Map(),
};

function initUserInStore(u) {
  dbStore.users.set(u.id, u);
  dbStore.users.set(u.email.toLowerCase(), u);
  dbStore.profiles.set(u.id, {
    id: u.id,
    email: u.email,
    name: u.user_metadata?.name || 'User',
    role: u.app_metadata?.role || 'customer',
    avatar_url: '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });
}

for (const key of Object.keys(TEST_USERS)) {
  initUserInStore(TEST_USERS[key]);
}

// Simple mutex queue per orderId for true concurrency serialization
async function acquireOrderLock(orderId) {
  while (dbStore.locks.get(orderId)) {
    await dbStore.locks.get(orderId);
  }
  let unlock;
  const promise = new Promise(resolve => { unlock = resolve; });
  dbStore.locks.set(orderId, promise);
  return () => {
    dbStore.locks.delete(orderId);
    unlock();
  };
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = url.pathname;
  const method = req.method;

  let body = '';
  req.on('data', chunk => { body += chunk; });
  await new Promise(r => req.on('end', r));
  let parsedBody = {};
  try {
    if (body) parsedBody = JSON.parse(body);
  } catch {}

  const authHeader = req.headers['authorization'] || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  const apiKey = req.headers['apikey'] || token;
  const verifiedClaims = token ? verifyJwt(token) : null;
  const apiKeyClaims = apiKey ? verifyJwt(apiKey) : null;
  const effectiveRole = verifiedClaims?.role || apiKeyClaims?.role || 'anon';
  const isServiceRole = effectiveRole === 'service_role';

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD');

  if (method === 'OPTIONS') {
    res.statusCode = 200;
    return res.end(JSON.stringify({ ok: true }));
  }

  // 1. Health check
  if (pathname === '/auth/v1/health' || pathname === '/health') {
    res.statusCode = 200;
    return res.end(JSON.stringify({ version: 'v2.116.0', name: 'GoTrue / Supabase Disposable Test' }));
  }

  // 2. Sign In with Password
  if (pathname === '/auth/v1/token' && url.searchParams.get('grant_type') === 'password') {
    const { email, password } = parsedBody;
    const user = dbStore.users.get(email?.toLowerCase());
    if (!user || user.password !== password) {
      res.statusCode = 400;
      return res.end(JSON.stringify({ error: 'invalid_grant', error_description: 'Invalid login credentials' }));
    }

    const accessToken = signJwt({
      sub: user.id,
      email: user.email,
      role: 'authenticated',
      app_metadata: user.app_metadata,
      user_metadata: user.user_metadata,
      aud: 'authenticated',
      exp: Math.floor(Date.now() / 1000) + 3600,
    });

    res.statusCode = 200;
    return res.end(JSON.stringify({
      access_token: accessToken,
      token_type: 'bearer',
      expires_in: 3600,
      refresh_token: 'rf-' + crypto.randomUUID(),
      user: {
        id: user.id,
        email: user.email,
        app_metadata: user.app_metadata,
        user_metadata: user.user_metadata,
        role: 'authenticated',
        aud: 'authenticated',
      },
    }));
  }

  // 3. User verification (/auth/v1/user)
  if (pathname === '/auth/v1/user') {
    if (method === 'GET') {
      if (!verifiedClaims || !verifiedClaims.sub) {
        res.statusCode = 401;
        return res.end(JSON.stringify({ error: 'invalid_jwt', message: 'JWT verification failed' }));
      }
      const user = dbStore.users.get(verifiedClaims.sub);
      if (!user) {
        res.statusCode = 401;
        return res.end(JSON.stringify({ error: 'user_not_found', message: 'User not found' }));
      }
      res.statusCode = 200;
      return res.end(JSON.stringify({
        id: user.id,
        email: user.email,
        app_metadata: user.app_metadata,
        user_metadata: user.user_metadata,
        role: 'authenticated',
        aud: 'authenticated',
      }));
    }

    if (method === 'PUT') {
      if (!verifiedClaims || !verifiedClaims.sub) {
        res.statusCode = 401;
        return res.end(JSON.stringify({ error: 'invalid_jwt', message: 'JWT verification failed' }));
      }
      const user = dbStore.users.get(verifiedClaims.sub);
      if (parsedBody.data) {
        user.user_metadata = { ...user.user_metadata, ...parsedBody.data };
      }
      res.statusCode = 200;
      return res.end(JSON.stringify({
        id: user.id,
        email: user.email,
        app_metadata: user.app_metadata,
        user_metadata: user.user_metadata,
        role: 'authenticated',
        aud: 'authenticated',
      }));
    }
  }

  // 4. Admin user creation (/auth/v1/admin/users)
  if (pathname === '/auth/v1/admin/users') {
    if (!isServiceRole) {
      res.statusCode = 403;
      return res.end(JSON.stringify({ error: 'unauthorized', message: 'Service role required' }));
    }

    if (method === 'POST') {
      const newId = crypto.randomUUID();
      const newUser = {
        id: newId,
        email: parsedBody.email,
        password: parsedBody.password,
        app_metadata: parsedBody.app_metadata || { provider: 'email', providers: ['email'], role: 'customer' },
        user_metadata: parsedBody.user_metadata || {},
      };
      initUserInStore(newUser);
      res.statusCode = 200;
      return res.end(JSON.stringify({
        user: {
          id: newUser.id,
          email: newUser.email,
          app_metadata: newUser.app_metadata,
          user_metadata: newUser.user_metadata,
        }
      }));
    }
  }

  // 5. Admin user deletion (/auth/v1/admin/users/:id)
  if (pathname.startsWith('/auth/v1/admin/users/')) {
    if (!isServiceRole) {
      res.statusCode = 403;
      return res.end(JSON.stringify({ error: 'unauthorized', message: 'Service role required' }));
    }
    const targetId = pathname.split('/').pop();
    const user = dbStore.users.get(targetId);
    if (user) {
      dbStore.users.delete(targetId);
      dbStore.users.delete(user.email.toLowerCase());
      dbStore.profiles.delete(targetId);
    }
    res.statusCode = 200;
    return res.end(JSON.stringify({ message: 'User deleted' }));
  }

  // 6. PostgREST: /rest/v1/rpc/is_admin
  if (pathname === '/rest/v1/rpc/is_admin') {
    if (!isServiceRole) {
      res.statusCode = 403;
      return res.end(JSON.stringify({
        code: '42501',
        message: 'permission denied for function is_admin',
        details: 'Apenas a service_role possui autorização para executar esta rotina.'
      }));
    }
    res.statusCode = 200;
    return res.end(JSON.stringify(true));
  }

  // 7. PostgREST: /rest/v1/product_reviews
  if (pathname === '/rest/v1/product_reviews') {
    if (effectiveRole === 'anon') {
      res.statusCode = 403;
      return res.end(JSON.stringify({
        code: '42501',
        message: 'new row violates row-level security policy for table "product_reviews"',
        details: 'Direct REST insert to product_reviews is blocked by RLS'
      }));
    }
  }

  // 8. PostgREST: /rest/v1/profiles
  if (pathname === '/rest/v1/profiles') {
    if (method === 'GET') {
      const eqParam = url.searchParams.get('id');
      const targetId = eqParam ? eqParam.replace(/^eq\./, '') : null;
      if (targetId) {
        const p = dbStore.profiles.get(targetId);
        res.statusCode = 200;
        return res.end(JSON.stringify(p ? [p] : []));
      }
      res.statusCode = 200;
      return res.end(JSON.stringify(Array.from(dbStore.profiles.values())));
    }

    if (method === 'PATCH' || method === 'PUT') {
      if ('role' in parsedBody && !isServiceRole) {
        res.statusCode = 403;
        return res.end(JSON.stringify({
          code: '42501',
          message: 'permission denied for column role of table profiles',
          details: 'Acesso negado: a coluna role de profiles só pode ser alterada via service_role administrativo.'
        }));
      }

      const eqParam = url.searchParams.get('id');
      const targetId = eqParam ? eqParam.replace(/^eq\./, '') : null;
      if (targetId && dbStore.profiles.has(targetId)) {
        const p = dbStore.profiles.get(targetId);
        if (parsedBody.name) p.name = parsedBody.name;
        if (isServiceRole && parsedBody.role) p.role = parsedBody.role;
        p.updated_at = new Date().toISOString();
        res.statusCode = 200;
        return res.end(JSON.stringify([p]));
      }
      res.statusCode = 200;
      return res.end(JSON.stringify([]));
    }

    if (method === 'POST') {
      const insertPayload = Array.isArray(parsedBody) ? parsedBody[0] : parsedBody;
      if (!insertPayload) {
        res.statusCode = 400;
        return res.end(JSON.stringify({ code: '23502', message: 'Empty payload' }));
      }

      const finalRole = isServiceRole ? (insertPayload.role || 'customer') : 'customer';
      const newProfile = {
        id: insertPayload.id || crypto.randomUUID(),
        email: insertPayload.email,
        name: insertPayload.name || 'User',
        role: finalRole,
        avatar_url: insertPayload.avatar_url || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      dbStore.profiles.set(newProfile.id, newProfile);
      res.statusCode = 201;
      return res.end(JSON.stringify([newProfile]));
    }

    if (method === 'DELETE') {
      const eqParam = url.searchParams.get('id');
      const targetId = eqParam ? eqParam.replace(/^eq\./, '') : null;
      if (targetId) {
        dbStore.profiles.delete(targetId);
      }
      res.statusCode = 200;
      return res.end(JSON.stringify([]));
    }
  }

  // 9. PostgREST: /rest/v1/products
  if (pathname === '/rest/v1/products') {
    if (method === 'GET') {
      const idParam = url.searchParams.get('id')?.replace(/^eq\./, '');
      const isSingle = req.headers['accept']?.includes('application/vnd.pgrst.object+json');
      if (idParam) {
        const p = dbStore.products.get(idParam);
        if (isSingle) {
          if (!p) { res.statusCode = 406; return res.end(JSON.stringify({ message: 'JSON object requested, multiple (or no) rows returned' })); }
          res.statusCode = 200;
          return res.end(JSON.stringify(p));
        }
        res.statusCode = 200;
        return res.end(JSON.stringify(p ? [p] : []));
      }
      res.statusCode = 200;
      return res.end(JSON.stringify(Array.from(dbStore.products.values())));
    }

    if (method === 'POST') {
      const items = Array.isArray(parsedBody) ? parsedBody : [parsedBody];
      for (const item of items) {
        dbStore.products.set(item.id, { ...item });
      }
      res.statusCode = 201;
      return res.end(JSON.stringify(items));
    }

    if (method === 'DELETE') {
      const likeParam = url.searchParams.get('id')?.replace(/^like\./, '').replace(/%/g, '');
      if (likeParam) {
        for (const [k] of dbStore.products) {
          if (k.includes(likeParam)) dbStore.products.delete(k);
        }
      }
      res.statusCode = 200;
      return res.end(JSON.stringify([]));
    }
  }

  // 10. PostgREST: /rest/v1/orders
  if (pathname === '/rest/v1/orders') {
    if (method === 'GET') {
      const idParam = url.searchParams.get('id')?.replace(/^eq\./, '');
      const isSingle = req.headers['accept']?.includes('application/vnd.pgrst.object+json');
      if (idParam) {
        const o = dbStore.orders.get(idParam);
        if (isSingle) {
          if (!o) { res.statusCode = 406; return res.end(JSON.stringify({ message: 'Not found' })); }
          res.statusCode = 200;
          return res.end(JSON.stringify(o));
        }
        res.statusCode = 200;
        return res.end(JSON.stringify(o ? [o] : []));
      }
      res.statusCode = 200;
      return res.end(JSON.stringify(Array.from(dbStore.orders.values())));
    }

    if (method === 'POST') {
      const items = Array.isArray(parsedBody) ? parsedBody : [parsedBody];
      for (const item of items) {
        dbStore.orders.set(item.id, { ...item });
      }
      res.statusCode = 201;
      return res.end(JSON.stringify(items));
    }

    if (method === 'DELETE') {
      const likeParam = url.searchParams.get('id')?.replace(/^like\./, '').replace(/%/g, '');
      if (likeParam) {
        for (const [k] of dbStore.orders) {
          if (k.includes(likeParam)) dbStore.orders.delete(k);
        }
      }
      res.statusCode = 200;
      return res.end(JSON.stringify([]));
    }
  }

  // 11. PostgREST: /rest/v1/payment_effects
  if (pathname === '/rest/v1/payment_effects') {
    if (method === 'HEAD' || method === 'GET') {
      const orderIdParam = url.searchParams.get('order_id')?.replace(/^eq\./, '');
      let count = 0;
      const results = [];
      for (const effect of dbStore.paymentEffects.values()) {
        if (!orderIdParam || effect.order_id === orderIdParam) {
          count++;
          results.push(effect);
        }
      }
      res.setHeader('Range-Unit', 'items');
      res.setHeader('Content-Range', `0-${Math.max(0, count - 1)}/${count}`);
      res.statusCode = 200;
      if (method === 'HEAD') return res.end();
      return res.end(JSON.stringify(results));
    }

    if (method === 'DELETE') {
      const likeParam = url.searchParams.get('order_id')?.replace(/^like\./, '').replace(/%/g, '');
      if (likeParam) {
        for (const [k, v] of dbStore.paymentEffects) {
          if (v.order_id?.includes(likeParam)) dbStore.paymentEffects.delete(k);
        }
      }
      res.statusCode = 200;
      return res.end(JSON.stringify([]));
    }
  }

  // 12. Cleanup for secondary test tables
  if (['/rest/v1/order_status_history', '/rest/v1/inventory_movements', '/rest/v1/order_items'].includes(pathname)) {
    res.statusCode = 200;
    return res.end(JSON.stringify([]));
  }

  // 13. RPC: process_approved_order_atomic
  if (pathname === '/rest/v1/rpc/process_approved_order_atomic') {
    const params = parsedBody;
    const orderId = params.p_order_id;
    const paymentId = String(params.p_payment_id);
    const gateway = params.p_gateway || 'mercadopago';
    const amount = parseFloat(params.p_amount);

    const releaseLock = await acquireOrderLock(orderId);
    try {
      // 1. Order lookup
      const order = dbStore.orders.get(orderId);
      if (!order) {
        res.statusCode = 400;
        return res.end(JSON.stringify({
          success: false,
          error: 'ORDER_NOT_FOUND',
          message: `Pedido ${orderId} não encontrado.`
        }));
      }

      // 2. Check if already processed (Idempotency)
      const effectKey = `${gateway}:${paymentId}`;
      const effectExists = dbStore.paymentEffects.has(effectKey) ||
        Array.from(dbStore.paymentEffects.values()).some(e => e.order_id === orderId);

      if (effectExists || order.payment_status === 'Pago') {
        res.statusCode = 200;
        return res.end(JSON.stringify({
          success: true,
          already_processed: true,
          order_id: orderId,
          status: order.status,
          message: 'Pagamento já processado anteriormente com sucesso.'
        }));
      }

      // 3. Amount validation (within 0.05 tolerance)
      const orderTotal = parseFloat(order.total);
      if (amount < (orderTotal - 0.05) || amount > (orderTotal + 0.05)) {
        order.payment_status = 'Pagamento Divergente';
        order.updated_at = new Date().toISOString();
        res.statusCode = 200;
        return res.end(JSON.stringify({
          success: false,
          already_processed: false,
          error: 'Valor de pagamento divergente do total do pedido.'
        }));
      }

      // 4. Stock validation
      const items = Array.isArray(params.p_items) && params.p_items.length > 0
        ? params.p_items
        : (Array.isArray(order.items) ? order.items : []);

      if (items.length === 0) {
        res.statusCode = 200;
        return res.end(JSON.stringify({
          success: false,
          already_processed: false,
          error: 'INVALID_ORDER_ITEMS: Pedido não possui itens canônicos registrados no banco de dados.'
        }));
      }

      for (const item of items) {
        const prodId = item.productId || item.product_id || item.id;
        const product = dbStore.products.get(prodId);
        if (!product) {
          res.statusCode = 200;
          return res.end(JSON.stringify({
            success: false,
            already_processed: false,
            error: `INVALID_ORDER_ITEM: Produto ${item.title || prodId} não encontrado no catálogo.`
          }));
        }

        const requestedQty = parseInt(item.quantity || 1, 10);
        if (product.stock_count < requestedQty) {
          res.statusCode = 200;
          return res.end(JSON.stringify({
            success: false,
            already_processed: false,
            error: `INSUFFICIENT_STOCK: Estoque insuficiente para o produto ${item.title || prodId} (${product.stock_count} disponível, ${requestedQty} solicitado)`
          }));
        }
      }

      // 5. Deduct inventory
      for (const item of items) {
        const prodId = item.productId || item.product_id || item.id;
        const product = dbStore.products.get(prodId);
        const requestedQty = parseInt(item.quantity || 1, 10);
        product.stock_count -= requestedQty;
        product.updated_at = new Date().toISOString();
      }

      // 6. Record payment effect
      dbStore.paymentEffects.set(effectKey, {
        id: crypto.randomUUID(),
        gateway,
        payment_id: paymentId,
        order_id: orderId,
        amount,
        currency: params.p_currency || 'BRL',
        payment_method: params.p_payment_method || 'Mercado Pago',
        status: 'approved',
        created_at: new Date().toISOString(),
      });

      // 7. Update order status
      order.status = 'Em Separação';
      order.payment_status = 'Pago';
      order.shipping_status = 'Preparando';
      order.paid_at = params.p_date_approved || new Date().toISOString();
      order.mercado_pago_payment_id = paymentId;
      order.updated_at = new Date().toISOString();

      res.statusCode = 200;
      return res.end(JSON.stringify({
        success: true,
        already_processed: false,
        order_id: orderId,
        payment_id: paymentId,
        new_status: 'Em Separação',
        payment_status: 'Pago',
        message: 'Pagamento processado com sucesso.'
      }));
    } finally {
      releaseLock();
    }
  }

  // Fallback
  res.statusCode = 200;
  return res.end(JSON.stringify({ ok: true }));
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`[DISPOSABLE-SUPABASE-DAEMON] Listening on http://127.0.0.1:${PORT}`);
});
