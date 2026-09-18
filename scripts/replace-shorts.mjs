console.error(
  '[LEGACY_SCRIPT_DISABLED] Escritas de catálogo não podem usar chave pública nem partir diretamente deste script legado. ' +
  'Use "npm run catalog:sync:dry-run" e, após revisar o relatório, "npm run catalog:sync".',
);
process.exitCode = 1;
