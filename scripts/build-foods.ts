/// <reference types="node" />
/**
 * Gera `src/data/foods-v1.json` a partir da planilha oficial da TACO 4ª ed. (NEPA/UNICAMP, 2011).
 * Ferramenta de desenvolvimento: não entra no app. Uso (Node 24):
 *   node scripts/build-foods.ts caminho/da/taco.xlsx
 *
 * A planilha é um zip de XMLs; um leitor de zip mínimo (zlib do Node) basta, sem biblioteca.
 * Regras (seção 2.1 da spec): "Tr" (traço) vira 0; "NA", "*" e vazio viram nulo.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { inflateRawSync } from 'node:zlib';

/** Lê um arquivo de dentro de um zip (só o que o XLSX usa: "stored" ou "deflate"). */
function readZipEntry(zip: Buffer, name: string): string {
  const eocd = zip.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
  if (eocd < 0) throw new Error('não é um zip');
  const entries = zip.readUInt16LE(eocd + 10);
  let p = zip.readUInt32LE(eocd + 16);
  for (let i = 0; i < entries; i++) {
    const method = zip.readUInt16LE(p + 10);
    const compressed = zip.readUInt32LE(p + 20);
    const nameLen = zip.readUInt16LE(p + 28);
    const extraLen = zip.readUInt16LE(p + 30);
    const commentLen = zip.readUInt16LE(p + 32);
    const local = zip.readUInt32LE(p + 42);
    const entryName = zip.toString('utf8', p + 46, p + 46 + nameLen);
    if (entryName === name) {
      const start = local + 30 + zip.readUInt16LE(local + 26) + zip.readUInt16LE(local + 28);
      const data = zip.subarray(start, start + compressed);
      return (method === 8 ? inflateRawSync(data) : data).toString('utf8');
    }
    p += 46 + nameLen + extraLen + commentLen;
  }
  throw new Error(`não achei ${name} no zip`);
}

const decode = (s: string) =>
  s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&');

type Cell = string | null;

function readSheet(xlsx: Buffer): Cell[][] {
  const shared = [...readZipEntry(xlsx, 'xl/sharedStrings.xml').matchAll(/<si>([\s\S]*?)<\/si>/g)].map((m) =>
    decode([...m[1].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((t) => t[1]).join('')),
  );
  const sheet = readZipEntry(xlsx, 'xl/worksheets/sheet1.xml');
  const colIndex = (col: string) => [...col].reduce((n, ch) => n * 26 + ch.charCodeAt(0) - 64, 0) - 1;
  return [...sheet.matchAll(/<row [^>]*>([\s\S]*?)<\/row>/g)].map(([, body]) => {
    const row: Cell[] = [];
    for (const [, col, attrs, inner] of body.matchAll(/<c r="([A-Z]+)\d+"([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
      const v = /<v>([\s\S]*?)<\/v>/.exec(inner ?? '')?.[1];
      row[colIndex(col)] = v == null ? null : / t="s"/.test(attrs) ? shared[Number(v)] : decode(v);
    }
    return row;
  });
}

/** "Tr" → 0; "NA", "*", vazio → nulo; o resto, número. */
function value(cell: Cell, digits: number): number | null {
  const s = cell?.trim();
  if (!s || s === 'NA' || s === '*') return null;
  if (s === 'Tr') return 0;
  const n = Number(s.replace(',', '.'));
  if (!Number.isFinite(n)) return null;
  const f = 10 ** digits;
  return Math.max(0, Math.round(n * f) / f);
}

const COL = { id: 0, name: 1, kcal: 3, protein: 5, fat: 6, carbs: 8, fiber: 9, sodium: 17, potassium: 18 };

/**
 * Erros de digitação da planilha oficial (conferidos com a TACO 4ª ed. em PDF).
 * 540: a célula do nome tem só "L"; os valores são os da "Feijoada" (Alimentos preparados).
 */
const NAME_FIXES: Record<number, string> = { 540: 'Feijoada' };

function build(path: string) {
  const rows = readSheet(readFileSync(path));
  const categories: string[] = [];
  const foods: (string | number | null)[][] = [];
  for (const row of rows) {
    const first = row[COL.id]?.trim() ?? '';
    if (/^\d+$/.test(first)) {
      foods.push([
        Number(first),
        NAME_FIXES[Number(first)] ?? (row[COL.name] ?? '').replace(/\s+/g, ' ').trim(),
        categories.length - 1,
        value(row[COL.kcal], 0),
        value(row[COL.protein], 1),
        value(row[COL.carbs], 1),
        value(row[COL.fat], 1),
        value(row[COL.fiber], 1),
        value(row[COL.sodium], 0),
        value(row[COL.potassium], 0),
      ]);
    } else if (first && row.filter((c) => c != null && c !== '').length === 1 && first !== 'Legenda') {
      categories.push(first);
    }
  }
  return {
    source: 'Tabela Brasileira de Composição de Alimentos (TACO), 4ª ed. revisada e ampliada. NEPA/UNICAMP, 2011.',
    unit: 'por 100 g; energia em kcal; proteína, carboidratos, gordura e fibra em g; sódio e potássio em mg',
    columns: ['id', 'name', 'category', 'kcal', 'protein', 'carbs', 'fat', 'fiber', 'sodium', 'potassium'],
    categories,
    rows: foods,
  };
}

const input = process.argv[2];
if (!input) {
  process.stderr.write('Uso: node scripts/build-foods.ts caminho/da/taco.xlsx\n');
  process.exit(1);
}
const out = join(import.meta.dirname, '..', 'src', 'data', 'foods-v1.json');
const data = build(input);
writeFileSync(out, `${JSON.stringify(data)}\n`);
process.stdout.write(`${data.rows.length} alimentos, ${data.categories.length} categorias → ${out}\n`);
