export interface Album {
  id: number;
  albumName: string;
  releaseYear: number;
  releaseOrder?: number | null;
  genre?: string | null;
  rating?: number | null;
  coverURL?: string | null;
  artist: Artist;
}

export interface Artist {
  id: number;
  letter: string;
  artistName: string;
  albums?: Album[];
}