package com.example.AlbumRepo.Controller;

import com.example.AlbumRepo.Entity.Album;
import com.example.AlbumRepo.Repository.IAlbumRepository;
import com.example.AlbumRepo.Service.AlbumService;
import com.example.AlbumRepo.Service.CoverArtService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/albums")
public class AlbumController {
    @Autowired
    IAlbumRepository albumRepository;
    private final AlbumService albumService;
    private final CoverArtService coverArtService;

    public AlbumController(AlbumService albumService, CoverArtService coverArtService) {
        this.albumService = albumService;
        this.coverArtService = coverArtService;
    }

    // GET all albums
    @GetMapping
    public List<Album> getAllAlbums() {
        return albumRepository.findAll();
    }

    // GET album by id
    @GetMapping("/{id}")
    public Album getAlbumById(@PathVariable Integer id) {
        return albumRepository.findById(id).orElse(null);
    }

    // POST create new album
    @PostMapping("/add-album")
    public Album createAlbum(@RequestBody Album album) {
        Album saved = albumRepository.save(album);
        coverArtService.fetchAndSaveCover(saved);
        return saved;
    }

    @PostMapping("/fetch-covers")
    public String fetchCovers() {
        coverArtService.fetchCoversForAllAlbums();
        return "Cover images updated!";
    }

    // PUT update album
    @PutMapping("/update-album/{id}")
    public Album updateAlbum(@PathVariable Integer id, @RequestBody Album album) {
        return albumRepository.findById(id).map(existingAlbum -> {
            existingAlbum.setAlbumName(album.getAlbumName());
            existingAlbum.setGenre(album.getGenre());
            existingAlbum.setReleaseYear(album.getReleaseYear());
            existingAlbum.setRating(album.getRating());
            existingAlbum.setArtist(album.getArtist());
            return albumRepository.save(existingAlbum);
        }).orElseGet(() -> {
            album.setId(id);
            return albumRepository.save(album);
        });
    }

    // DELETE album
    @DeleteMapping("/delete-album/{id}")
    public void deleteAlbum(@PathVariable Integer id) {
        albumRepository.deleteById(id);
    }
}