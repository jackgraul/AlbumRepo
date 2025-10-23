package com.example.AlbumRepo.Controller;

import com.example.AlbumRepo.Entity.Album;
import com.example.AlbumRepo.Repository.IAlbumRepository;
import com.example.AlbumRepo.Service.AlbumService;
import com.example.AlbumRepo.Service.CoverArtService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
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
        return albumService.getAlbumsWithArtists();
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

    @GetMapping("/proxy-cover")
    public ResponseEntity<byte[]> proxyCover(@RequestParam String url) {
        try {
            RestTemplate restTemplate = new RestTemplate();
            byte[] imageBytes = restTemplate.getForObject(url, byte[].class);

            // Convert to BufferedImage
            InputStream in = new ByteArrayInputStream(imageBytes);
            BufferedImage original = ImageIO.read(in);
            if (original == null) {
                return ResponseEntity.notFound().build();
            }

            // ✅ Determine square crop area (center-crop)
            int size = Math.min(original.getWidth(), original.getHeight());
            int x = (original.getWidth() - size) / 2;
            int y = (original.getHeight() - size) / 2;
            BufferedImage cropped = original.getSubimage(x, y, size, size);

            // ✅ Resize to uniform dimensions (optional, e.g. 600x600)
            Image scaled = cropped.getScaledInstance(600, 600, Image.SCALE_SMOOTH);
            BufferedImage normalized = new BufferedImage(600, 600, BufferedImage.TYPE_INT_RGB);
            Graphics2D g2d = normalized.createGraphics();
            g2d.drawImage(scaled, 0, 0, null);
            g2d.dispose();

            // ✅ Write to JPEG bytes
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            ImageIO.write(normalized, "jpg", out);
            out.flush();

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.IMAGE_JPEG);
            headers.setCacheControl(CacheControl.noCache());

            return new ResponseEntity<>(out.toByteArray(), headers, HttpStatus.OK);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.notFound().build();
        }
    }
}