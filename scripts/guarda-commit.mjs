// Trava de commit: bloqueia CPF sem máscara e chave de API nas linhas adicionadas.
// test/ fica de fora porque os testes usam CPF falso de propósito (regra 10).
import { execFileSync } from 'node:child_process';

const TRAVAS = [
  ['CPF sem máscara', /\b\d{3}\.\d{3}\.\d{3}-\d{2}\b/],
  ['chave de API', /\b(sk-[A-Za-z0-9_-]{20,}|gh[pousr]_[A-Za-z0-9]{20,}|AKIA[0-9A-Z]{16})\b/],
  ['token em variável', /\b[A-Z_]*(API_KEY|API_TOKEN|SECRET|PASSWORD)\s*=\s*['"]?[A-Za-z0-9_\/+-]{12,}/],
];

const diff = execFileSync('git', ['diff', '--cached', '-U0', '--no-color', '--diff-filter=ACM'], { encoding: 'utf8', maxBuffer: 1 << 26 });
let arquivo = '', achados = 0;
for (const linha of diff.split('\n')) {
  if (linha.startsWith('+++ ')) { arquivo = linha.slice(6); continue; }
  if (!linha.startsWith('+') || arquivo.startsWith('test/')) continue;
  for (const [nome, re] of TRAVAS) {
    // Coordenadas de SVG podem ter o formato de um CPF.
    if (nome === 'CPF sem máscara' && arquivo.endsWith('.svg')) continue;
    if (re.test(linha)) { console.error(`bloqueado: ${nome} em ${arquivo}`); achados++; }
  }
}
if (achados) {
  console.error('Commit parado. Tire o dado do arquivo; se for chave real, gire na hora.');
  process.exit(1);
}
