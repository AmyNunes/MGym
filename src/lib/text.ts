/** Para buscar sem acento e sem diferença de maiúsculas: "Açaí" → "acai". */
export function normalizeSearch(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

/** Todas as palavras da busca aparecem no texto (em qualquer ordem)? */
export function matchesSearch(haystack: string, query: string): boolean {
  const words = normalizeSearch(query).split(/\s+/).filter(Boolean);
  if (!words.length) return true;
  const text = normalizeSearch(haystack);
  return words.every((w) => text.includes(w));
}
