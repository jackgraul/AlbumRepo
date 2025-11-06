package com.example.AlbumRepo.Service;

import com.example.AlbumRepo.Entity.Artist;
import com.example.AlbumRepo.Repository.IArtistRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ArtistService {
    private final IArtistRepository artistRepository;

    public ArtistService(IArtistRepository artistRepository) {
        this.artistRepository = artistRepository;
    }

    public List<Artist> getArtistsWithAlbums() {
        return artistRepository.findAllWithAlbums();
    }
}