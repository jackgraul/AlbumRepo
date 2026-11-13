package com.example.AlbumRepo.Controller;

import com.example.AlbumRepo.DTO.AddAlbumRequest;
import com.example.AlbumRepo.DTO.AlbumResponse;
import com.example.AlbumRepo.DTO.UpdateAlbumRequest;
import com.example.AlbumRepo.Entity.Album;
import com.example.AlbumRepo.Entity.User;
import com.example.AlbumRepo.Repository.IAlbumRepository;
import com.example.AlbumRepo.Service.AlbumService;
import com.example.AlbumRepo.Service.CoverArtService;
import com.example.AlbumRepo.Service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/albums")
public class AlbumController {
    @Autowired
    IAlbumRepository albumRepository;
    private final AlbumService albumService;
    private final CoverArtService coverArtService;
    private final UserService userService;

    public AlbumController(AlbumService albumService, CoverArtService coverArtService, UserService userService) {
        this.albumService = albumService;
        this.coverArtService = coverArtService;
        this.userService = userService;
    }

    // GET all albums for authenticated user
    @GetMapping
    public ResponseEntity<List<AlbumResponse>> getAllAlbums(@AuthenticationPrincipal OidcUser oidcUser) {
        User user = userService.getUserByGoogleId(oidcUser.getSubject());
        List<AlbumResponse> albums = albumService.getAlbumsForUser(user.getId());
        return ResponseEntity.ok(albums);
    }

    // GET album by id for authenticated user
    @GetMapping("/{id}")
    public ResponseEntity<AlbumResponse> getAlbumById(@PathVariable Integer id, @AuthenticationPrincipal OidcUser oidcUser) {
        User user = userService.getUserByGoogleId(oidcUser.getSubject());
        AlbumResponse album = albumService.getAlbumForUser(user.getId(), id);
        return ResponseEntity.ok(album);
    }

    // GET album by lookup to search for duplicates
    @GetMapping("/lookup")
    public ResponseEntity<AlbumResponse> lookupAlbum(@RequestParam Integer artistId, @RequestParam String albumName) {
        AlbumResponse album = albumService.lookupAlbum(artistId, albumName);
        return ResponseEntity.ok(album);
    }

    // POST create new album for authenticated user
    @PostMapping("/add-album")
    public ResponseEntity<AlbumResponse> createAlbum(@RequestBody AddAlbumRequest request, @AuthenticationPrincipal OidcUser oidcUser) {
        User user = userService.getUserByGoogleId(oidcUser.getSubject());
        AlbumResponse createdAlbum = albumService.addAlbumForUser(user, request);
        return ResponseEntity.ok(createdAlbum);
    }

    // PUT update album for authenticated user
    @PutMapping("/update-album/{id}")
    public ResponseEntity<AlbumResponse> updateAlbum(@PathVariable Integer id, @RequestBody UpdateAlbumRequest request, @AuthenticationPrincipal OidcUser oidcUser) {
        User user = userService.getUserByGoogleId(oidcUser.getSubject());
        AlbumResponse updatedAlbum = albumService.updateAlbumRatingForUser(user.getId(), id, request.rating());
        return ResponseEntity.ok(updatedAlbum);
    }

    // DELETE album for authenticated user
    @DeleteMapping("/delete-album/{id}")
    public ResponseEntity<Void> deleteAlbum(@PathVariable Integer id, @AuthenticationPrincipal OidcUser oidcUser) {
        User user = userService.getUserByGoogleId(oidcUser.getSubject());
        albumService.removeAlbumForUser(user.getId(), id);
        return ResponseEntity.noContent().build();
    }
}