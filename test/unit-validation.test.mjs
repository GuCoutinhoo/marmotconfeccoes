import test from 'node:test';
import assert from 'node:assert/strict';

// Helper pure functions matching backend logic for validation tests
function cleanDocument(doc) {
  if (!doc) return '';
  return String(doc).replace(/\D/g, '');
}

function isValidCPF(cpf) {
  const clean = cleanDocument(cpf);
  if (clean.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(clean)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(clean.charAt(i), 10) * (10 - i);
  let rev = 11 - (sum % 11);
  if (rev === 10 || rev === 11) rev = 0;
  if (rev !== parseInt(clean.charAt(9), 10)) return false;
  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(clean.charAt(i), 10) * (11 - i);
  rev = 11 - (sum % 11);
  if (rev === 10 || rev === 11) rev = 0;
  return rev === parseInt(clean.charAt(10), 10);
}

function calculateOrderTotal(subtotal, shippingFee, discountPercentage, discountFixed = 0) {
  const percDiscount = (subtotal * (discountPercentage || 0)) / 100;
  const totalDiscount = Math.min(subtotal, percDiscount + (discountFixed || 0));
  const finalTotal = Math.max(0, subtotal - totalDiscount + shippingFee);
  return {
    subtotal: Number(subtotal.toFixed(2)),
    discount: Number(totalDiscount.toFixed(2)),
    shippingFee: Number(shippingFee.toFixed(2)),
    total: Number(finalTotal.toFixed(2)),
  };
}

test('Unit Tests: Core Business Logic & Sanitization', async (t) => {
  await t.test('CPF Normalization and Validation', () => {
    assert.equal(cleanDocument('123.456.789-00'), '12345678900');
    assert.equal(cleanDocument(' 11.222.333/0001-99 '), '11222333000199');

    // Invalid CPFs
    assert.equal(isValidCPF('00000000000'), false);
    assert.equal(isValidCPF('11111111111'), false);
    assert.equal(isValidCPF('12345678901'), false);
    assert.equal(isValidCPF('123'), false);
  });

  await t.test('Order Calculation Server-Authoritative Logic', () => {
    // 10% coupon on R$ 200 with R$ 25 shipping
    const res = calculateOrderTotal(200.0, 25.0, 10, 0);
    assert.equal(res.subtotal, 200.0);
    assert.equal(res.discount, 20.0);
    assert.equal(res.shippingFee, 25.0);
    assert.equal(res.total, 205.0);

    // Discount cannot exceed subtotal
    const highDiscount = calculateOrderTotal(100.0, 15.0, 150, 0);
    assert.equal(highDiscount.discount, 100.0);
    assert.equal(highDiscount.total, 15.0);
  });

  await t.test('Idempotency Key & Webhook Event Key Formatting', () => {
    const gateway = 'mercadopago';
    const eventId = 'pay_987654321';
    const key = `${gateway}:${eventId}`;
    assert.equal(key, 'mercadopago:pay_987654321');
  });
});
