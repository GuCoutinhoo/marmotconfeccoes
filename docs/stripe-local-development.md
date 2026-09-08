# Stripe Checkout — desenvolvimento local

Novos pagamentos da Marmot usam Stripe Checkout hospedado. O navegador cria um
pedido pendente pelo backend, recebe apenas a URL pública da Checkout Session e
é redirecionado à Stripe. A página de retorno apenas consulta o estado salvo; ela
nunca confirma um pagamento.

## Variáveis locais

Preencha no `.env` da raiz, sem versioná-lo:

```env
APP_URL=http://localhost:3000
STRIPE_PUBLIC_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
```

Use chaves `pk_test_...` e `sk_test_...` juntas. O segredo do webhook local é
fornecido pelo Stripe CLI e começa com `whsec_`. Nenhuma dessas chaves deve ser
copiada para uma variável `VITE_*`.

Como o pagamento está em Test Mode, o pós-pagamento só compra frete se o Melhor
Envio também estiver configurado em `sandbox`, com um token sandbox válido. A
aplicação bloqueia deliberadamente a combinação Stripe teste + Melhor Envio
produção para impedir a compra de etiqueta real durante testes.

## Webhooks locais com Stripe CLI

Com o projeto rodando em `http://localhost:3000`:

```bash
stripe login
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Copie o `whsec_...` exibido pelo CLI para `STRIPE_WEBHOOK_SECRET` no `.env` e
reinicie o servidor. No Dashboard/CLI, assine estes eventos:

- `checkout.session.completed`
- `checkout.session.expired`
- `checkout.session.async_payment_succeeded`
- `checkout.session.async_payment_failed`
- `payment_intent.succeeded`
- `payment_intent.payment_failed`
- `refund.created`
- `refund.updated`
- `refund.failed`
- `charge.refunded`

O evento `payment_intent.succeeded` é o único que liquida o pedido. Ele executa
a transação atômica de pagamento, estoque e carrinho. Depois do commit, dispara
o fluxo idempotente do Melhor Envio. Eventos repetidos são registrados e
ignorados sem repetir os efeitos.

## Vercel

Configure as três variáveis Stripe separadamente em Preview e Production. Em
Preview, use chaves de teste e crie um endpoint webhook para a URL da implantação
que estiver sendo validada. Em Production, altere juntas as chaves pública,
secreta e o segredo do endpoint live. `APP_URL` deve apontar para o domínio
canônico da Marmot em produção.

Antes de promover, aplique a migração
`supabase/migrations/20260908120000_stripe_payment_migration.sql` e confirme que
`/api/admin/health` apresenta Stripe, banco e Melhor Envio como prontos.
