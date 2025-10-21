package com.example.AlbumRepo.Service;

import com.example.AlbumRepo.Entity.Artist;
import com.example.AlbumRepo.Repository.IArtistRepository;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ArtistService {
    private final IArtistRepository artistRepository;

    public ArtistService(IArtistRepository artistRepository) {
        this.artistRepository = artistRepository;
    }

    // ✅ Get all artists (optionally sorted)
    public List<Artist> getAllArtists(String sortBy, String direction) {
        Sort sort = Sort.by(Sort.Direction.fromString(direction), sortBy);
        return artistRepository.findAll(sort);
    }

    // ✅ Filter by starting letter
    public List<Artist> getArtistsByLetter(String letter, String sortBy, String direction) {
        Sort sort = Sort.by(Sort.Direction.fromString(direction), sortBy);
        List<Artist> artists = artistRepository.findByArtistNameStartingWithIgnoreCase(letter);
        // Sorting manually (since custom query doesn’t auto-sort)
        return artists.stream()
                .sorted((a, b) -> direction.equalsIgnoreCase("asc")
                        ? a.getArtistName().compareToIgnoreCase(b.getArtistName())
                        : b.getArtistName().compareToIgnoreCase(a.getArtistName()))
                .toList();
    }

    // ✅ Get artist by ID
    public Artist getArtistById(Integer id) {
        return artistRepository.findById(id).orElse(null);
    }
}