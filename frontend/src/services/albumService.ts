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

  static async getById(id: number | string): Promise<Album> {
    const { data } = await api.get<Album>(`/albums/${id}`);
    return data;
  }

  static async create(album: Album | AlbumPayload): Promise<Album> {
    const { data } = await api.post<Album>(
      "/albums/add-album",
      toAlbumPayload(album)
    );
    return data;
  }

  static async update(id: number, album: Album): Promise<Album> {
    const { data } = await api.put<Album>(`/albums/update-album/${id}`, album);
    return data;
  }

  static async delete(id: number): Promise<void> {
    await api.delete(`/albums/delete-album/${id}`);
  }
}

export default AlbumService;