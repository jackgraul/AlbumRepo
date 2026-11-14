package com.example.AlbumRepo.Service;

import com.example.AlbumRepo.DTO.AlbumResponse;
import com.example.AlbumRepo.DTO.ArtistResponse;
import com.example.AlbumRepo.DTO.ArtistSummaryResponse;
import com.example.AlbumRepo.Entity.*;
import com.example.AlbumRepo.Repository.IArtistRepository;
import com.example.AlbumRepo.Repository.IUserAlbumRepository;
import com.example.AlbumRepo.Repository.IUserArtistRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.text.Normalizer;
import java.util.*;

@Service
public class ArtistService {
    private final IArtistRepository artistRepository;
    private final IUserArtistRepository userArtistRepository;
    private final IUserAlbumRepository userAlbumRepository;

    public ArtistService(
            IArtistRepository artistRepository,
            IUserArtistRepository userArtistRepository,
            IUserAlbumRepository userAlbumRepository) {
        this.artistRepository = artistRepository;
        this.userArtistRepository = userArtistRepository;
        this.userAlbumRepository = userAlbumRepository;
    }

    @Transactional(readOnly = true)
    public List<ArtistResponse> getArtistsForUser(Long userId) {
        List<UserArtist> userArtists = userArtistRepository.findArtistsForUser(userId);
        List<UserAlbum> userAlbums = userAlbumRepository.findAlbumsForUser(userId);
        Map<Integer, List<AlbumResponse>> albumsByArtist = new HashMap<>();

        for (UserAlbum userAlbum : userAlbums) {
            Album album = userAlbum.getAlbum();

            AlbumResponse albumResponse = new AlbumResponse(
                    album.getId(),
                    album.getAlbumName(),
                    album.getReleaseYear(),
                    album.getReleaseOrder(),
                    album.getGenre(),
                    album.getCoverURL(),
                    userAlbum.getRating(),
                    new ArtistSummaryResponse(
                            album.getArtist().getId(),
                            album.getArtist().getLetter(),
                            album.getArtist().getArtistName()
                    )
            );

            albumsByArtist
                    .computeIfAbsent(
                            album.getArtist().getId(),
                            key -> new ArrayList<>()
                    )
                    .add(albumResponse);
        }

        return userArtists.stream()
                .map(userArtist -> {
                    Artist artist = userArtist.getArtist();

                    return new ArtistResponse(
                            artist.getId(),
                            artist.getLetter(),
                            artist.getArtistName(),
                            albumsByArtist.getOrDefault(
                                    artist.getId(),
                                    new ArrayList<>()
                            )
                    );
                })
                .toList();
    }

    @Transactional(readOnly = true)
    public ArtistResponse getArtistByIdForUser(Long userId, Integer artistId) {
        UserArtist userArtist = userArtistRepository
                .findByUser_IdAndArtist_Id(userId, artistId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Artist not found in user's collection"
                ));

        Artist artist = userArtist.getArtist();

        List<AlbumResponse> albums = userAlbumRepository
                .findAlbumsForUser(userId)
                .stream()
                .filter(userAlbum ->
                        userAlbum.getAlbum().getArtist().getId().equals(artistId))
                .map(userAlbum -> {
                    Album album = userAlbum.getAlbum();

                    return new AlbumResponse(
                            album.getId(),
                            album.getAlbumName(),
                            album.getReleaseYear(),
                            album.getReleaseOrder(),
                            album.getGenre(),
                            album.getCoverURL(),
                            userAlbum.getRating(),
                            new ArtistSummaryResponse(
                                    album.getArtist().getId(),
                                    album.getArtist().getLetter(),
                                    album.getArtist().getArtistName()
                            )
                    );
                })
                .toList();

        return new ArtistResponse(
                artist.getId(),
                artist.getLetter(),
                artist.getArtistName(),
                albums
        );
    }

    @Transactional(readOnly = true)
    public ArtistResponse getArtistBySlugForUser(Long userId, String artistSlug) {
        return getArtistsForUser(userId)
                .stream()
                .filter(artist ->
                        toSlug(artist.artistName()).equals(artistSlug)
                )
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Artist not found in user's collection"
                ));
    }

    @Transactional
    public ArtistResponse addArtistForUser(User user, Artist artist) {
        if (artist.getArtistName() == null || artist.getArtistName().isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Artist name cannot be empty"
            );
        }

        String artistName = artist.getArtistName().trim();
        artist.setArtistName(artistName);

        // Find an existing catalogue artist or create one.
        Artist existingArtist = artistRepository
                .findByArtistNameIgnoreCase(artistName)
                .orElseGet(() -> {
                    Artist newArtist = new Artist();
                    newArtist.setArtistName(artistName);
                    newArtist.setLetter(artist.getLetter());
                    return artistRepository.save(newArtist);
                });

        // Check whether this user already has the artist.
        if (!userArtistRepository.existsByUser_IdAndArtist_Id(
                user.getId(), existingArtist.getId())) {

            UserArtist userArtist = new UserArtist();
            userArtist.setUser(user);
            userArtist.setArtist(existingArtist);

            userArtistRepository.save(userArtist);
        }

        return getArtistByIdForUser(user.getId(), existingArtist.getId());
    }

    @Transactional
    public ArtistResponse updateArtistForUser(User user, Integer artistId, Artist updatedArtist) {
        UserArtist userArtist = userArtistRepository
                .findByUser_IdAndArtist_Id(user.getId(), artistId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Artist not found in user's collection"
                ));

        String artistName = updatedArtist.getArtistName();

        if (artistName == null || artistName.isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Artist name cannot be empty"
            );
        }

        Artist existingArtist = userArtist.getArtist();

        existingArtist.setArtistName(artistName.trim());
        existingArtist.setLetter(updatedArtist.getLetter());

        artistRepository.save(existingArtist);

        return getArtistByIdForUser(user.getId(), existingArtist.getId());
    }

    @Transactional
    public void removeArtistForUser(User user, Integer artistId) {

        UserArtist userArtist = userArtistRepository
                .findByUser_IdAndArtist_Id(user.getId(), artistId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Artist not found in user's collection"
                ));

        userArtistRepository.delete(userArtist);
    }

    private String toSlug(String value) {
        if (value == null) {
            return "";
        }

        String normalized = Normalizer.normalize(value, Normalizer.Form.NFD);

        normalized = normalized
                .replaceAll("\\p{M}+", "")
                .toLowerCase(Locale.ROOT)
                .replace("&", " and ")
                .replace("æ", "ae")
                .replace("œ", "oe")
                .replace("ß", "ss")
                .replace("ø", "o")
                .replace("ł", "l")
                .replace("đ", "d")
                .replace("þ", "th");

        return normalized
                .replaceAll("['\"’‘“”]", "")
                .replaceAll("[^\\p{L}\\p{N}]+", "-")
                .replaceAll("^-|-$", "");
    }
}