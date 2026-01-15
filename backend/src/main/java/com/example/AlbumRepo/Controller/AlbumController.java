package com.example.AlbumRepo.Controller;

import com.example.AlbumRepo.Entity.Album;
import com.example.AlbumRepo.Repository.IAlbumRepository;
import com.example.AlbumRepo.Service.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.*;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.util.DigestUtils;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;

import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.util.List;
import java.util.concurrent.TimeUnit;

@RestController
@RequestMapping("/api/albums")
public class AlbumController {
    @Autowired
    IAlbumRepository albumRepository;
    private final AlbumService albumService;
    private final CoverArtService coverArtService;
    private final CoverService coverService;
    private final CoverPreloader coverPreloader;

    public AlbumController(AlbumService albumService, CoverArtService coverArtService, CoverService coverService, CoverPreloader coverPreloader) {
        this.albumService = albumService;
        this.coverArtService = coverArtService;
        this.coverService = coverService;
        this.coverPreloader = coverPreloader;
    }

    // GET all albums
    @GetMapping
    public ResponseEntity<List<Album>> getAllAlbums() {
        List<Album> albums = albumService.getAlbumsWithArtists();
        ResponseEntity<List<Album>> response = ResponseEntity.ok(albums);

        albums.forEach(album -> coverPreloader.preload(album.getCoverURL()));

        return response;
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
            existingAlbum.setCoverURL(album.getCoverURL());
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

    @GetMapping("/proxy-cover")
    public ResponseEntity<byte[]> proxyCover(
            @RequestParam String url,
            @RequestHeader(value = HttpHeaders.IF_NONE_MATCH, required = false) String ifNoneMatch
    ) {
        byte[] cached = coverService.fetchAndCache(url);
        if (cached == null) return ResponseEntity.notFound().build();

        String eTag = "\"" + DigestUtils.md5DigestAsHex(cached) + "\"";
        if (eTag.equals(ifNoneMatch)) {
            return ResponseEntity.status(HttpStatus.NOT_MODIFIED).eTag(eTag).build();
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.IMAGE_JPEG);
        headers.setCacheControl(CacheControl.maxAge(7, TimeUnit.DAYS));
        headers.setETag(eTag);

        return new ResponseEntity<>(cached, headers, HttpStatus.OK);
    }
}