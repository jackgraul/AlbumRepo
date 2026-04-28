import api from "../api/apiClient";
import { Artist } from "../models/models";

type ArtistPayload = Pick<Artist, "artistName" | "letter">;

class ArtistService {
  static async getAll(): Promise<Artist[]> {
    const { data } = await api.get<Artist[]>("/artists");
    return data;
  }

  static async getById(id: number | string): Promise<Artist> {
    const { data } = await api.get<Artist>(`/artists/${id}`);
    return data;
  }

  static async create(artist: ArtistPayload): Promise<Artist> {
    const { data } = await api.post<Artist>("/artists/add-artist", artist);
    return data;
  }

  static async update(id: number, artist: ArtistPayload): Promise<Artist> {
    const { data } = await api.put<Artist>(
      `/artists/update-artist/${id}`,
      artist
    );
    return data;
  }

  static async delete(id: number): Promise<void> {
    await api.delete(`/artists/delete-artist/${id}`);
  }
}

export default ArtistService;