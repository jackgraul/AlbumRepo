import api from "../api/apiClient";
import { Album, Artist } from "./albumService";

class ArtistService {
  // 🔹 Get all artists
  static async getAll(): Promise<Artist[]> {
    const { data } = await api.get<Artist[]>("/artists");
    return data;
  }

  // 🔹 Get artist by ID
  static async getById(id: number): Promise<Artist> {
    const { data } = await api.get<Artist>(`/artists/${id}`);
    return data;
  }

  // 🔹 Get albums for a specific artist
  static async getAlbumsByArtist(id: number): Promise<Album[]> {
    const { data } = await api.get<Album[]>(`/artists/${id}/albums`);
    return data;
  }

  // 🔹 Search artists by name
  static async search(name: string): Promise<Artist[]> {
    const { data } = await api.get<Artist[]>(
      `/artists/search?name=${encodeURIComponent(name)}`
    );
    return data;
  }

  // 🔹 Create a new artist
  static async create(artist: Partial<Artist>): Promise<Artist> {
    const { data } = await api.post<Artist>("/artists", artist);
    return data;
  }

  // 🔹 Update artist info
  static async update(id: number, artist: Partial<Artist>): Promise<Artist> {
    const { data } = await api.put<Artist>(`/artists/${id}`, artist);
    return data;
  }

  // 🔹 Delete artist
  static async delete(id: number): Promise<void> {
    await api.delete(`/artists/${id}`);
  }
}

export default ArtistService;