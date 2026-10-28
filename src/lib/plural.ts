const pluralWord = (w: string) => {
  if (/[rsz]$/.test(w)) return `${w}es`;
  if (/m$/.test(w)) return `${w.slice(0, -1)}ns`;
  if (/ão$/.test(w)) return `${w.slice(0, -2)}ões`;
  if (/l$/.test(w)) return `${w.slice(0, -1)}is`;
  return `${w}s`;
};

/** Plural de uma medida: "fatia média" → "fatias médias"; "colher de sopa" → "colheres de sopa". */
export function pluralizeMeasure(label: string): string {
  const words = label.trim().split(/\s+/);
  const stop = words.findIndex((w) => /^(de|do|da|dos|das|com)$/.test(w));
  const end = stop < 0 ? words.length : stop;
  return words.map((w, i) => (i < end ? pluralWord(w) : w)).join(' ');
}
