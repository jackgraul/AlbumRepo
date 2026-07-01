package com.example.AlbumRepo.Service;

import com.example.AlbumRepo.Entity.Album;
import com.example.AlbumRepo.Repository.IAlbumRepository;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class AlbumService {
    private final IAlbumRepository albumRepository;

    public AlbumService(IAlbumRepository albumRepository) { this.albumRepository = albumRepository; }

    public List<Album> getAlbumsWithArtists() {
        return albumRepository.findAllWithArtists();
    }
}