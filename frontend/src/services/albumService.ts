import api from "../api/apiClient";

export interface Artist {
  id?: number;
  artistName: string;
}

export interface Album {
  id: number;
  albumName: string;
  releaseYear: number;
  rating?: number;
  genre?: string;
  coverURL: string;
  artist: Artist;
}

class AlbumService {
  // 🔹 Get all albums
  static async getAll(): Promise<Album[]> {
    const { data } = await api.get<Album[]>("/albums");
    return data;
  }

  // 🔹 Get single album by ID
  static async getById(id: number): Promise<Album> {
    const { data } = await api.get<Album>(`/albums/${id}`);
    return data;
  }

  // 🔹 Get albums by artist ID
  static async getByArtist(artistId: number): Promise<Album[]> {
    const { data } = await api.get<Album[]>(`/artists/${artistId}/albums`);
    return data;
  }

  // 🔹 Search albums by title or artist
  static async search(query: string): Promise<Album[]> {
    const { data } = await api.get<Album[]>(`/albums/search?query=${encodeURIComponent(query)}`);
    return data;
  }

  // 🔹 Create new album
  static async create(album: Partial<Album>): Promise<Album> {
    const { data } = await api.post<Album>("/albums/add-album", album);
    return data;
  }

  // 🔹 Update an album
  static async update(id: number, album: Partial<Album>): Promise<Album> {
    const { data } = await api.put<Album>(`/albums/update-album/${id}`, album);
    return data;
  }

  // 🔹 Delete an album
  static async delete(id: number): Promise<void> {
    await api.delete(`/albums/delete-album/${id}`);
  }
}

export default AlbumService;