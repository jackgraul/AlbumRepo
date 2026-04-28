const ARTIST_SORT_ALIASES: Record<string, string> = {
  "夢遊病者": "Sleepwalker"
};

const stripAccentsAndLigatures = (input: string): string =>
  input
    .replace(/Æ/g, "Ae")
    .replace(/æ/g, "ae")
    .replace(/Œ/g, "Oe")
    .replace(/œ/g, "oe")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

export const getSortBaseName = (name?: string | null): string => {
  const raw = (name || "").trim();
  const aliased = ARTIST_SORT_ALIASES[raw] ?? raw;
  return stripAccentsAndLigatures(aliased);
};

export const normalizeArtistName = (name?: string | null): string =>
  getSortBaseName(name)
    .trim()
    .replace(/^(the|a|an)\s+/i, "")
    .toLowerCase();

export const getNormalizedLetter = (name?: string | null): string => {
  const norm = normalizeArtistName(name);
  if (!norm) return "#";
  if (/^[0-9]/.test(norm)) return "#";
  return norm[0].toUpperCase();
};