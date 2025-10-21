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

    // ✅ Filter by artist
    public List<Album> getAlbumsByArtist(Integer artistId, String sortBy, String direction) {
        Artist artist = artistRepository.findById(artistId)
                .orElseThrow(() -> new RuntimeException("Artist not found"));

        Sort sort = Sort.by(Sort.Direction.fromString(direction), sortBy);
        List<Album> albums = albumRepository.findByArtist(artist);

        return albums.stream()
                .sorted((a, b) -> direction.equalsIgnoreCase("asc")
                        ? a.getAlbumName().compareToIgnoreCase(b.getAlbumName())
                        : b.getAlbumName().compareToIgnoreCase(a.getAlbumName()))
                .toList();
    }

    // ✅ Filter by genre
    public List<Album> getAlbumsByGenre(String genre) {
        return albumRepository.findByGenreIgnoreCase(genre);
    }

    // ✅ Filter by release year
    public List<Album> getAlbumsByYear(Integer year) {
        return albumRepository.findByReleaseYear(year);
    }

    // ✅ Filter by rating threshold
    public List<Album> getAlbumsByRating(double minRating) {
        return albumRepository.findByRatingGreaterThanEqual(minRating);
    }
}