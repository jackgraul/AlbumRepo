package com.example.AlbumRepo.Controller;

import com.example.AlbumRepo.Entity.Artist;
import com.example.AlbumRepo.Repository.IArtistRepository;
import com.example.AlbumRepo.Service.ArtistService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/artists")
public class ArtistController {
    @Autowired
    IArtistRepository artistRepository;
    private final ArtistService artistService;

    public ArtistController(ArtistService artistService) {
        this.artistService = artistService;
    }

    // GET all artists
    @GetMapping
    public List<Artist> getAllArtists() {
        return artistRepository.findAll();
    }

    // GET artist by id
    @GetMapping("/{id}")
    public Artist getArtistById(@PathVariable Integer id) {
        return artistRepository.findById(id).orElse(null);
    }

    // POST create artist
    @PostMapping("/add-artist")
    public Artist createArtist(@RequestBody Artist artist) {
        return artistRepository.save(artist);
    }

    // PUT update artist
    @PutMapping("/{id}/update-artist")
    public Artist updateArtist(@RequestBody Artist artist) {
        return artistRepository.save(artist);
    }

    // DELETE artist
    @DeleteMapping("/{id}/delete-artist")
    public void deleteArtist(@PathVariable Integer id) {
        artistRepository.deleteById(id);
    }
}