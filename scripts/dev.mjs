import { spawn } from 'node:child_process';
import { existsSync, readFileSync, unwatchFile, watchFile } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const envPath = path.join(projectRoot, '.env');
const inheritedEnvironment = { ...process.env };

let serverProcess;
let restartRequested = false;
let shuttingDown = false;
let restartTimer;

function getDevelopmentEnvironment() {
  const localEnvironment = existsSync(envPath)
    ? dotenv.parse(readFileSync(envPath))
    : {};

  return {
    ...inheritedEnvironment,
    ...localEnvironment,
    NODE_ENV: localEnvironment.NODE_ENV || inheritedEnvironment.NODE_ENV || 'development',
  };
}

function startServer() {
  restartRequested = false;
  console.log('[DEV] Iniciando o backend com o ambiente local (valores ocultos).');

  serverProcess = spawn(process.execPath, ['--import', 'tsx', 'server.ts'], {
    cwd: projectRoot,
    env: getDevelopmentEnvironment(),
    stdio: 'inherit',
    windowsHide: true,
  });

  serverProcess.once('exit', (code) => {
    if (shuttingDown) {
      process.exit(0);
    }

    if (restartRequested) {
      startServer();
      return;
    }

    process.exit(code ?? 1);
  });
}

function restartServer() {
  if (shuttingDown) return;

  restartRequested = true;
  console.log('[DEV] .env alterado; reiniciando o backend por completo.');

  if (serverProcess && serverProcess.exitCode === null) {
    serverProcess.kill('SIGTERM');
  } else {
    startServer();
  }
}

watchFile(envPath, { interval: 500 }, (current, previous) => {
  if (current.mtimeMs === previous.mtimeMs && current.size === previous.size) return;

  clearTimeout(restartTimer);
  restartTimer = setTimeout(restartServer, 150);
});

function shutdown() {
  if (shuttingDown) return;
  shuttingDown = true;
  clearTimeout(restartTimer);
  unwatchFile(envPath);

  if (serverProcess && serverProcess.exitCode === null) {
    serverProcess.kill('SIGTERM');
  } else {
    process.exit(0);
  }
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

startServer();
