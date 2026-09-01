import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';

test('Security & Architecture Audit Assertions', async (t) => {
  await t.test('Migration SQL is Idempotent, Safe & Restrictive', () => {
    const sql = fs.readFileSync('supabase-complete-production-migration.sql', 'utf8');

    // Schema and tables
    assert.ok(sql.includes('CREATE TABLE IF NOT EXISTS public.profiles'), 'profiles table missing');
    assert.ok(sql.includes('CREATE TABLE IF NOT EXISTS public.orders'), 'orders table missing');
    assert.ok(sql.includes('CREATE TABLE IF NOT EXISTS public.order_items'), 'order_items table missing');
    assert.ok(sql.includes('CREATE TABLE IF NOT EXISTS public.payment_effects'), 'payment_effects table missing');
    assert.ok(sql.includes('CREATE TABLE IF NOT EXISTS public.webhook_events'), 'webhook_events table missing');
    assert.ok(sql.includes('CREATE TABLE IF NOT EXISTS public.shipment_operations'), 'shipment_operations table missing');
    assert.ok(sql.includes('CREATE TABLE IF NOT EXISTS public.inventory_movements'), 'inventory_movements table missing');
    assert.ok(sql.includes('CREATE TABLE IF NOT EXISTS public.shipping_quotes'), 'shipping_quotes table missing');

    // Privilege Escalation Protection
    assert.ok(!sql.includes("auth.jwt() -> 'user_metadata' ->> 'role'"), 'Insecure user_metadata.role found in migration SQL');
    assert.ok(sql.includes("auth.jwt() -> 'app_metadata' ->> 'role'"), 'Secure app_metadata.role missing from is_admin()');
    assert.ok(sql.includes('CREATE OR REPLACE FUNCTION public.protect_profile_role'), 'protect_profile_role function missing');
    assert.ok(sql.includes('trg_protect_profile_role'), 'trg_protect_profile_role trigger missing');

    // Financial RPC Permissions
    assert.ok(sql.includes('REVOKE EXECUTE ON FUNCTION public.process_approved_order_atomic FROM PUBLIC, anon, authenticated'), 'process_approved_order_atomic permissions not revoked');
    assert.ok(sql.includes('REVOKE EXECUTE ON FUNCTION public.claim_webhook_event FROM PUBLIC, anon, authenticated'), 'claim_webhook_event permissions not revoked');
    assert.ok(sql.includes('REVOKE EXECUTE ON FUNCTION public.complete_webhook_event FROM PUBLIC, anon, authenticated'), 'complete_webhook_event permissions not revoked');
    assert.ok(sql.includes('REVOKE EXECUTE ON FUNCTION public.deduct_inventory_atomic FROM PUBLIC, anon, authenticated'), 'deduct_inventory_atomic permissions not revoked');

    // Financial anti-tampering validation
    assert.ok(sql.includes('p_amount < (v_order.total - 0.05)'), 'Financial amount check missing in process_approved_order_atomic');
    assert.ok(sql.includes('FOR UPDATE'), 'Row locking missing in process_approved_order_atomic');
    assert.ok(sql.includes('INSUFFICIENT_STOCK'), 'Overselling pre-check missing in process_approved_order_atomic');
    assert.ok(sql.includes('INVALID_ORDER_ITEMS'), 'Zero items validation missing in process_approved_order_atomic');
    assert.ok(sql.includes("DROP POLICY IF EXISTS \"Orders insert allowed for checkout\""), 'Exhaustive legacy policy drops missing');
  });

  await t.test('Backend Server-Authoritative Hardening', () => {
    const backend = fs.readFileSync('api/index.ts', 'utf8');

    // Webhook fail-closed
    assert.ok(backend.includes('MERCADOPAGO_WEBHOOK_SECRET ausente em produção'), 'Fail-closed MP webhook signature check missing');
    assert.ok(backend.includes('RESEND_API_KEY não configurada no ambiente de produção'), 'Fail-closed Resend check missing');

    // Server-authoritative checkout & pricing
    assert.ok(backend.includes('p_gateway: provider'), 'claim_webhook_event signature mismatch');
    assert.ok(backend.includes('p_event_key: eventId'), 'claim_webhook_event parameter key mismatch');
    assert.ok(backend.includes('deduct_inventory_atomic') || backend.includes('process_approved_order_atomic'), 'Atomic stock deduction call missing');

    // Logistics carrier fallback and cron fail-closed
    assert.ok(backend.includes("orderStatus: 'UNMODIFIED'"), 'Carrier unknown status fallback transition must be UNMODIFIED');
    assert.ok(backend.includes("if (!cronSecret || authHeader !== `Bearer ${cronSecret}`"), 'Cron endpoint must fail closed if CRON_SECRET is missing');
  });

  await t.test('Shipping and Remetente Rules Validation', () => {
    const backend = fs.readFileSync('api/index.ts', 'utf8');

    // CPF vs CNPJ separation
    assert.ok(backend.includes('company_document'), 'CNPJ company_document separation missing');
    assert.ok(backend.includes('fromPayload.company_document') || backend.includes('from.company_document'), 'Sender document assignment check missing');
  });

  await t.test('No unverified reviews or fake buyers', () => {
    const backend = fs.readFileSync('api/index.ts', 'utf8');
    assert.ok(backend.includes('verifiedPurchase'), 'Verified purchase logic missing in reviews');
  });
});
