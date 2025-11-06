import api from "../api/apiClient";
import { Album, Artist } from "./albumService";

class ArtistService {
  static async getAll(): Promise<Artist[]> {
    const { data } = await api.get<Artist[]>("/artists");
    return data;
  }

  static async getById(id: number): Promise<Artist> {
    const { data } = await api.get<Artist>(`/artists/${id}`);
    return data;
  }

  static async getAlbumsByArtist(id: number): Promise<Album[]> {
    const { data } = await api.get<Album[]>(`/artists/${id}/albums`);
    return data;
  }

  static async search(name: string): Promise<Artist[]> {
    const { data } = await api.get<Artist[]>(
      `/artists/search?name=${encodeURIComponent(name)}`
    );
    return data;
  }

  static async create(artist: Partial<Artist>): Promise<Artist> {
    const { data } = await api.post<Artist>("/artists", artist);
    return data;
  }

  static async update(id: number, artist: Partial<Artist>): Promise<Artist> {
    const { data } = await api.put<Artist>(`/artists/${id}`, artist);
    return data;
  }

  static async delete(id: number): Promise<void> {
    await api.delete(`/artists/${id}`);
  }
}

export default ArtistService;