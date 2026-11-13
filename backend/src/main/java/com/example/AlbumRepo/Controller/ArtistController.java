package com.example.AlbumRepo.Controller;

import com.example.AlbumRepo.DTO.ArtistResponse;
import com.example.AlbumRepo.Entity.Artist;
import com.example.AlbumRepo.Entity.User;
import com.example.AlbumRepo.Repository.IArtistRepository;
import com.example.AlbumRepo.Service.ArtistService;
import com.example.AlbumRepo.Service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/artists")
public class ArtistController {
    private final ArtistService artistService;
    private final UserService userService;

    public ArtistController(ArtistService artistService, UserService userService) {
        this.artistService = artistService;
        this.userService = userService;
    }

    // GET all artists belonging to the authenticated user
    @GetMapping
    public List<ArtistResponse> getAllArtists(@AuthenticationPrincipal OidcUser oidcUser) {
        User user = userService.getUserByGoogleId(oidcUser.getSubject());
        return artistService.getArtistsForUser(user.getId());
    }

    // GET artist by id for authenticated user
    @GetMapping("/{id}")
    public ArtistResponse getArtistById(@PathVariable Integer id, @AuthenticationPrincipal OidcUser oidcUser) {
        User user = userService.getUserByGoogleId(oidcUser.getSubject());
        return artistService.getArtistForUser(user.getId(), id);
    }

    // POST create artist for authenticated user
    @PostMapping("/add-artist")
    public ArtistResponse createArtist(@RequestBody Artist artist, @AuthenticationPrincipal OidcUser oidcUser) {
        User user = userService.getUserByGoogleId(oidcUser.getSubject());
        return artistService.addArtistForUser(user, artist);
    }

    // PUT update artist for authenticated user
    @PutMapping("/update-artist/{id}")
    public ArtistResponse updateArtist(@PathVariable Integer id, @RequestBody Artist artist, @AuthenticationPrincipal OidcUser oidcUser) {
        User user = userService.getUserByGoogleId(oidcUser.getSubject());
        return artistService.updateArtistForUser(user, id, artist);
    }

    // DELETE artist for authenticated user
    @DeleteMapping("/delete-artist/{id}")
    public ResponseEntity<Void> deleteArtist(@PathVariable Integer id, @AuthenticationPrincipal OidcUser oidcUser) {
        User user = userService.getUserByGoogleId(oidcUser.getSubject());
        artistService.removeArtistForUser(user, id);
        return ResponseEntity.noContent().build();
    }
}