// Monta dist/ para o Cloudflare Pages: arquivos de public/ e o worker em _worker.js.
import { execFileSync } from 'node:child_process';
import { cpSync, rmSync } from 'node:fs';

rmSync('dist', { recursive: true, force: true });
cpSync('public', 'dist', { recursive: true });
execFileSync('npx', ['--yes', 'esbuild@0.25.0', 'src/worker.mjs', '--bundle', '--format=esm', '--outfile=dist/_worker.js'], { stdio: 'inherit', shell: true });
