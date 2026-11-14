import axios from "axios";
import api from "../api/apiClient";
import { Album } from "../models/models";

type AlbumPayload = Omit<Album, "id">;

const toAlbumPayload = (album: Album | AlbumPayload): AlbumPayload => {
  const { id, ...payload } = album as Album;
  return payload;
};

class AlbumService {
  static async getAll(): Promise<Album[]> {
    const { data } = await api.get<Album[]>("/albums");
    return data;
  }

  static async getBySlug(artistSlug: string, albumSlug: string): Promise<Album> {
    const { data } = await api.get<Album>(
      `/albums/${encodeURIComponent(artistSlug)}/${encodeURIComponent(albumSlug)}`
    );

    return data;
  }

  static async lookup(artistId: number, albumName: string): Promise<Album | null> {
    try {
      const { data } = await api.get<Album>("/albums/lookup", {
        params: {
          artistId,
          albumName,
        },
      });

      return data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return null;
      }

      throw error;
    }
  }

  static async create(album: Album | AlbumPayload): Promise<Album> {
    const { data } = await api.post<Album>("/albums/add-album", {
      album: toAlbumPayload(album),
      rating: album.rating ?? null,
    });
    return data;
  }

  static async update(id: number, rating: number | null): Promise<Album> {
    const { data } = await api.put<Album>(
      `/albums/update-album/${id}`,
      { rating }
    );
    return data;
  }

  static async updateMetadata(id: number, album: Album): Promise<Album> {
    const { data } = await api.put<Album>(
      `/albums/update-metadata/${id}`,
      album
    );
    return data;
  }

  static async delete(id: number): Promise<void> {
    await api.delete(`/albums/delete-album/${id}`);
  }
}

export default AlbumService;