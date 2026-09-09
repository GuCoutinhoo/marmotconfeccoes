# InfinitePay Checkout Integrado

Novos pagamentos da Marmot usam o Checkout Integrado hospedado pela InfinitePay.
O backend cria o pedido pendente, recalcula produtos, cupom e frete com dados
confiáveis e só então solicita o link de pagamento.

## Ambiente

```env
APP_URL=http://localhost:3000
INFINITEPAY_HANDLE=
INFINITEPAY_WEBHOOK_URL=
```

O `INFINITEPAY_HANDLE` é o identificador público da conta, sem `$`. A API pública
documentada pela InfinitePay não requer chave secreta para criar o link nem para
consultar o pagamento; portanto, nenhuma chave não documentada foi inventada.

Em localhost, o backend omite `webhook_url`, pois a InfinitePay não consegue
alcançar endereços locais. O retorno do Checkout chama `/checkout` com os
identificadores oficiais, e o backend confirma a transação por `/payment_check`
antes de alterar o pedido.

Em produção, `APP_URL` deve ser a origem HTTPS pública da loja. O backend monta
automaticamente `https://dominio/api/infinitepay/webhook`. Use
`INFINITEPAY_WEBHOOK_URL` somente para sobrescrever essa rota com outra URL HTTPS
pública.

## Fonte de verdade e idempotência

O redirect nunca marca o pedido como pago sozinho. Tanto o redirect quanto o
webhook passam pela mesma rotina server-side, que:

1. associa `order_nsu` ao pedido interno;
2. consulta `POST https://api.checkout.infinitepay.io/payment_check`;
3. exige `success=true`, `paid=true` e valor exato em centavos;
4. confirma pagamento e estoque em uma RPC transacional do Postgres;
5. dispara o fluxo pós-pagamento e a logística apenas na primeira confirmação.

Eventos repetidos usam a tabela `webhook_events` e efeitos financeiros únicos.
Não há polling nem cron para confirmar pagamentos.

## Aplicação da migração

Aplique `supabase/migrations/20260908120000_infinitepay_payment_migration.sql`
ao projeto Supabase antes de testar o checkout. Ela preserva os campos históricos
do gateway anterior e cria os campos genéricos usados por novos pagamentos.

## Teste manual seguro

1. Inicie com `npm run dev`.
2. Faça login, adicione um produto real, selecione endereço e uma cotação real.
3. Finalize e confirme que o navegador abre `checkout.infinitepay.com.br`.
4. Sem pagar, volte à loja e confirme que o pedido permanece pendente e o carrinho
   permanece intacto.
5. Em um ambiente de teste autorizado, conclua o pagamento e valide pedido pago,
   baixa de estoque e início único do fluxo do Melhor Envio.

Documentação oficial:

- https://www.infinitepay.io/checkout-documentacao
- https://www.infinitepay.io/checkout
