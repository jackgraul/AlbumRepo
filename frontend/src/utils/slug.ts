const stripAccentsAndLigatures = (input: string): string =>
  input
    .replace(/\u00c6/g, "Ae")
    .replace(/\u00e6/g, "ae")
    .replace(/\u0152/g, "Oe")
    .replace(/\u0153/g, "oe")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

export const toSlug = (value?: string | null): string =>
  stripAccentsAndLigatures(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[\u2018\u2019'"]/g, "")
    .replace(/[^\p{Letter}\p{Number}]+/gu, "-")
    .replace(/^-+|-+$/g, "");

const toPathSegment = (value: string | null | undefined, fallback: string) =>
  toSlug(value) || fallback;

export const getArtistPath = (artistName: string | null | undefined) =>
  `/artists/${toPathSegment(artistName, "unknown-artist")}`;

export const getArtistAlbumCreatePath = (
  artistName: string | null | undefined
) => `${getArtistPath(artistName)}/albums/new`;
export const getAlbumPath = (
  artistName: string | null | undefined,
  albumName: string | null | undefined
) =>
  `/albums/${toPathSegment(artistName, "unknown-artist")}/${toPathSegment(
    albumName,
    "untitled-album"
  )}`;