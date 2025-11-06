package com.example.AlbumRepo.Service;

import com.example.AlbumRepo.Entity.Album;
import com.example.AlbumRepo.Entity.Artist;
import com.example.AlbumRepo.Repository.IAlbumRepository;
import com.example.AlbumRepo.Repository.IArtistRepository;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AlbumService {
    private final IAlbumRepository albumRepository;
    private final IArtistRepository artistRepository;

    public AlbumService(IAlbumRepository albumRepository, IArtistRepository artistRepository) {
        this.albumRepository = albumRepository;
        this.artistRepository = artistRepository;
    }

    public List<Album> getAlbumsWithArtists() {
        return albumRepository.findAllWithArtists();
    }
}