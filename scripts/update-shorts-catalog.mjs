console.error(
  '[LEGACY_SCRIPT_DISABLED] Este script alterava somente fixtures locais e não sincronizava o catálogo de produção. ' +
  'Use "npm run catalog:sync:dry-run" e, após revisar o relatório, "npm run catalog:sync".',
);
process.exitCode = 1;
