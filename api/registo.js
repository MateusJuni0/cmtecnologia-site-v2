// Append-only records kept outside the public folder (SITE_DATA_DIR, a volume on the VPS): Instagram link
// visits and leads. express.static serves the project root, so these files must never live in it.
// Best effort: a failed write is logged and never breaks the visitor's request.
import fs from 'node:fs';
import path from 'node:path';

const DADOS = process.env.SITE_DATA_DIR || '/var/lib/cmtec-site-data';
// Thousands of visits or leads fit in a few hundred KB. Past this size someone is abusing a public endpoint
// (it accepts 25 MB bodies), so new lines are dropped instead of filling the host disk.
const MAX_FICHEIRO = 5 * 1024 * 1024;

// Returns true when the line was written, so a caller can tell "kept" from "lost".
export function registar(ficheiro, linha) {
  try {
    fs.mkdirSync(DADOS, { recursive: true });
    const destino = path.join(DADOS, ficheiro);
    if (fs.existsSync(destino) && fs.statSync(destino).size > MAX_FICHEIRO) {
      console.error(`registo ${ficheiro} acima de ${MAX_FICHEIRO} bytes: linha descartada`);
      return false;
    }
    fs.appendFileSync(destino, JSON.stringify(linha) + '\n', { mode: 0o600 });
    return true;
  } catch (e) {
    console.error(`registo ${ficheiro} falhou: ${String(e).slice(0, 200)}`);
    return false;
  }
}

// Only a short lowercase tag is accepted as origin (e.g. "instagram"); anything else is dropped.
export function origemValida(valor) {
  return typeof valor === 'string' && /^[a-z0-9-]{1,20}$/.test(valor) ? valor : null;
}

// A field as a string of at most `max` characters, so one request can never write a large line.
export function cortar(valor, max) {
  return String(valor == null ? '' : valor).slice(0, max);
}
