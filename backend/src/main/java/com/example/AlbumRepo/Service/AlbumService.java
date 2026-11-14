package com.example.AlbumRepo.Service;

import com.example.AlbumRepo.DTO.AddAlbumRequest;
import com.example.AlbumRepo.DTO.AlbumResponse;
import com.example.AlbumRepo.DTO.ArtistSummaryResponse;
import com.example.AlbumRepo.DTO.UpdateAlbumMetadataRequest;
import com.example.AlbumRepo.Entity.*;
import com.example.AlbumRepo.Repository.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.text.Normalizer;
import java.util.List;
import java.util.Locale;

@Service
public class AlbumService {
    private final IAlbumRepository albumRepository;
    private final IArtistRepository artistRepository;
    private final IUserAlbumRepository userAlbumRepository;
    private final IUserArtistRepository userArtistRepository;
    private final CoverArtService coverArtService;

    public AlbumService(
            IAlbumRepository albumRepository,
            IArtistRepository artistRepository,
            IUserAlbumRepository userAlbumRepository,
            IUserArtistRepository userArtistRepository,
            CoverArtService coverArtService) {
        this.albumRepository = albumRepository;
        this.artistRepository = artistRepository;
        this.userAlbumRepository = userAlbumRepository;
        this.userArtistRepository = userArtistRepository;
        this.coverArtService = coverArtService;
    }

    @Transactional(readOnly = true)
    public List<AlbumResponse> getAlbumsForUser(Long userId) {
        return userAlbumRepository.findAlbumsForUser(userId)
                .stream()
                .map(this::toAlbumResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public AlbumResponse getAlbumForUser(Long userId, String artistSlug, String albumSlug) {
        return userAlbumRepository.findAlbumsForUser(userId)
                .stream()
                .filter(userAlbum -> {
                    Album album = userAlbum.getAlbum();

                    return toSlug(album.getArtist().getArtistName())
                            .equals(artistSlug)
                            && toSlug(album.getAlbumName())
                            .equals(albumSlug);
                })
                .findFirst()
                .map(this::toAlbumResponse)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Album not found in user's collection"
                ));
    }

    @Transactional
    public AlbumResponse addAlbumForUser(User user, AddAlbumRequest request) {
        if (request.album().getAlbumName() == null
                || request.album().getAlbumName().isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Album name cannot be empty"
            );
        }

        if (request.album().getArtist() == null
                || request.album().getArtist().getArtistName() == null
                || request.album().getArtist().getArtistName().isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Artist name cannot be empty"
            );
        }

        String albumName = request.album().getAlbumName().trim();
        String artistName = request.album().getArtist()
                .getArtistName().trim();

        // Find or create the shared artist
        Artist artist = artistRepository
                .findByArtistNameIgnoreCase(artistName)
                .orElseGet(() -> {
                    Artist newArtist = new Artist();
                    newArtist.setArtistName(artistName);
                    newArtist.setLetter(
                            request.album().getArtist().getLetter()
                    );
                    return artistRepository.save(newArtist);
                });

        // Ensure the artist belongs to the user's collection
        if (!userArtistRepository.existsByUser_IdAndArtist_Id(
                user.getId(), artist.getId())) {

            UserArtist userArtist = new UserArtist();
            userArtist.setUser(user);
            userArtist.setArtist(artist);
            userArtistRepository.save(userArtist);
        }

        // Find or create the shared album
        Album album = albumRepository
                .findByAlbumNameAndArtistId(albumName, artist.getId())
                .orElseGet(() -> {

                    Album newAlbum = new Album();
                    newAlbum.setAlbumName(albumName);
                    newAlbum.setArtist(artist);
                    newAlbum.setReleaseYear(
                            request.album().getReleaseYear()
                    );
                    newAlbum.setReleaseOrder(
                            request.album().getReleaseOrder()
                    );
                    newAlbum.setGenre(request.album().getGenre());

                    String coverUrl = request.album().getCoverURL();

                    if (coverUrl == null || coverUrl.isBlank()
                            || coverUrl.contains("default-cover")) {

                        coverUrl = coverArtService.fetchCoverArt(
                                artistName,
                                albumName
                        );
                    }

                    newAlbum.setCoverURL(coverUrl);

                    // Do not store a user's rating in the shared catalogue
                    return albumRepository.save(newAlbum);
                });

        // Associate the album with the user
        UserAlbum userAlbum = userAlbumRepository
                .findByUser_IdAndAlbum_Id(user.getId(), album.getId())
                .orElseGet(() -> {
                    UserAlbum newUserAlbum = new UserAlbum();
                    newUserAlbum.setUser(user);
                    newUserAlbum.setAlbum(album);
                    newUserAlbum.setRating(request.rating());

                    return userAlbumRepository.save(newUserAlbum);
                });

        return toAlbumResponse(userAlbum);
    }

    @Transactional
    public AlbumResponse updateAlbumRatingForUser(Long userId, Integer albumId, Double rating) {
        UserAlbum userAlbum = userAlbumRepository
                .findByUser_IdAndAlbum_Id(userId, albumId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Album not found in user's collection"
                ));

        userAlbum.setRating(rating);

        return toAlbumResponse(userAlbum);
    }

    @Transactional
    public Album updateAlbumMetadata(Integer albumId, UpdateAlbumMetadataRequest request) {

        Album album = albumRepository.findById(albumId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Album not found"
                ));

        Artist artist = artistRepository.findById(request.artist().id())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Artist not found"
                ));

        album.setAlbumName(request.albumName());
        album.setArtist(artist);
        album.setReleaseYear(request.releaseYear());
        album.setGenre(request.genre());
        album.setCoverURL(request.coverURL());
        album.setReleaseOrder(request.releaseOrder());

        return albumRepository.save(album);
    }

    @Transactional
    public void removeAlbumForUser(Long userId, Integer albumId) {
        UserAlbum userAlbum = userAlbumRepository
                .findByUser_IdAndAlbum_Id(userId, albumId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Album not found in user's collection"
                ));

        userAlbumRepository.delete(userAlbum);
    }

    public AlbumResponse lookupAlbum(Integer artistId, String albumName) {
        if (artistId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Artist ID cannot be empty");
        }

        if (albumName == null || albumName.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Album name cannot be empty");
        }

        Album album = albumRepository
                .findByAlbumNameAndArtistId(albumName.trim(), artistId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Album not found"));

        ArtistSummaryResponse artist = new ArtistSummaryResponse(
                album.getArtist().getId(),
                album.getArtist().getLetter(),
                album.getArtist().getArtistName()
        );

        return new AlbumResponse(
                album.getId(),
                album.getAlbumName(),
                album.getReleaseYear(),
                album.getReleaseOrder(),
                album.getGenre(),
                album.getCoverURL(),
                null,
                artist
        );
    }

    private AlbumResponse toAlbumResponse(UserAlbum userAlbum) {
        Album album = userAlbum.getAlbum();

        ArtistSummaryResponse artist = new ArtistSummaryResponse(
                album.getArtist().getId(),
                album.getArtist().getLetter(),
                album.getArtist().getArtistName()
        );

        return new AlbumResponse(
                album.getId(),
                album.getAlbumName(),
                album.getReleaseYear(),
                album.getReleaseOrder(),
                album.getGenre(),
                album.getCoverURL(),
                userAlbum.getRating(),
                artist
        );
    }

    private String toSlug(String value) {
        if (value == null) {
            return "";
        }

        String normalized = Normalizer.normalize(
                value,
                Normalizer.Form.NFD
        );

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