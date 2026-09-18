# Dados locais

Os arquivos JSON desta pasta são fixtures para desenvolvimento, testes e migrações controladas.
Eles não são banco de dados e não são fonte autoritativa em produção.

Em produção, o catálogo é lido e alterado exclusivamente no Supabase. A sincronização
controlada dos shorts atuais usa `npm run catalog:sync:dry-run` para auditoria e
`npm run catalog:sync` para aplicar a migração com `SUPABASE_SERVICE_ROLE_KEY`.

O processo de build e deploy nunca deve sincronizar ou sobrescrever o catálogo
automaticamente. Alterações persistentes devem passar pela API administrativa ou por uma
migração explícita e auditável.
