package com.example.AlbumRepo.Service;

import com.example.AlbumRepo.Entity.Album;
import com.example.AlbumRepo.Repository.IAlbumRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;

@Service
public class CoverArtService {
    @Autowired
    IAlbumRepository albumRepository;
    private static final Logger logger = LoggerFactory.getLogger(CoverArtService.class);
    private final RestTemplate restTemplate = new RestTemplate();
    private final String SPOTIFY_CLIENT_ID;
    private final String SPOTIFY_CLIENT_SECRET;
    private static final String SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token";
    private String spotifyAccessToken;
    private long spotifyTokenExpiry = 0L;

    public CoverArtService(
            IAlbumRepository albumRepository,
            @Value("${SPOTIFY_CLIENT_ID}") String spotifyClientId,
            @Value("${SPOTIFY_CLIENT_SECRET}") String spotifyClientSecret
    ) {
        this.albumRepository = albumRepository;
        this.SPOTIFY_CLIENT_ID = spotifyClientId;
        this.SPOTIFY_CLIENT_SECRET = spotifyClientSecret;
    }

    /* =========================
       PUBLIC ENTRY POINT
       ========================= */

    public void fetchCoversForAllAlbums() {
        List<Album> albums = albumRepository.findAllWithoutCovers();
        logger.info("Albums missing covers: {}", albums.size());

        for (Album album : albums) {

            // Never overwrite a real cover
            if (album.getCoverURL() != null &&
                    !album.getCoverURL().isBlank() &&
                    !album.getCoverURL().contains("default-cover")) {
                continue;
            }

            String cover = fetchCoverArt(album.getArtist().getArtistName(), album.getAlbumName()
            );

            if (isValidCover(cover)) {
                album.setCoverURL(cover);
                albumRepository.save(album);
                logger.info("Updated cover for {} - {}", album.getArtist().getArtistName(), album.getAlbumName());
            } else {
                logger.warn("No cover found for {} - {}", album.getArtist().getArtistName(), album.getAlbumName());
            }

            try { Thread.sleep(1000); } catch (InterruptedException ignored) {}
        }
    }

    public String fetchCoverArt(String artist, String album) {
        String artistNorm = norm(artist);
        String albumNorm = norm(album);

        // ---- Spotify (exact only)
        String cover = fetchFromSpotifyExact(artist, album, artistNorm, albumNorm);

        if (isValidCover(cover)) {
            logger.info("Cover found via Spotify (exact match)");
            return cover;
        }

        // ---- MusicBrainz fallback
        cover = fetchFromMusicBrainz(artist, album);

        if (isValidCover(cover)) {
            logger.info("Cover found via MusicBrainz");
            return cover;
        }

        return null;
    }

    /* =========================
       SPOTIFY (STRICT)
       ========================= */

    private String fetchFromSpotifyExact(String artistOriginal, String albumOriginal, String artistNorm, String albumNorm) {
        ensureSpotifyToken();
        if (spotifyAccessToken == null) return null;

        String rawQuery = "album:\"" + albumOriginal + "\" artist:\"" + artistOriginal + "\"";

        try {
            String q = URLEncoder.encode(rawQuery, StandardCharsets.UTF_8);

            String url =
                    "https://api.spotify.com/v1/search" +
                            "?q=" + q +
                            "&type=album" +
                            "&limit=10" +
                            "&market=CA";

            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(spotifyAccessToken);

            ResponseEntity<Map> resp =
                    restTemplate.exchange(
                            url,
                            HttpMethod.GET,
                            new HttpEntity<>(headers),
                            Map.class
                    );

            Map albums = (Map) resp.getBody().get("albums");
            List<Map<String, Object>> items = (List<Map<String, Object>>) albums.get("items");

            if (items == null || items.isEmpty()) return null;

            for (Map<String, Object> item : items) {

                String spAlbumNorm = norm((String) item.get("name"));

                if (!spAlbumNorm.equals(albumNorm)) {
                    continue;
                }

                List<Map<String, Object>> artists = (List<Map<String, Object>>) item.get("artists");

                boolean artistExact =
                        artists.stream()
                                .anyMatch(a ->
                                        norm((String) a.get("name"))
                                                .equals(artistNorm));

                if (!artistExact) {
                    continue;
                }

                // EXACT MATCH FOUND
                List<Map<String, Object>> images = (List<Map<String, Object>>) item.get("images");

                if (images != null && !images.isEmpty()) {
                    return images.get(0).get("url").toString();
                }
            }

            // No exact match → fail loudly
            return null;

        } catch (Exception e) {
            logger.warn("Spotify exact search failed: {}", e.getMessage());
            return null;
        }
    }

    /* =========================
       MUSICBRAINZ
       ========================= */

    private String fetchFromMusicBrainz(String artist, String album) {
        try {
            String q = "release:\"" + album + "\" AND artist:\"" + artist + "\"";

            String url =
                    "https://musicbrainz.org/ws/2/release/" +
                            "?query=" + URLEncoder.encode(q, StandardCharsets.UTF_8) +
                            "&fmt=json&limit=1";

            HttpHeaders headers = new HttpHeaders();
            headers.set("User-Agent", "AlbumRepo/1.0 (jack@example.com)");

            ResponseEntity<Map> resp =
                    restTemplate.exchange(
                            url,
                            HttpMethod.GET,
                            new HttpEntity<>(headers),
                            Map.class
                    );

            List<Map<String, Object>> releases = (List<Map<String, Object>>) resp.getBody().get("releases");

            if (releases == null || releases.isEmpty()) return null;

            String mbid = releases.get(0).get("id").toString();

            return "https://coverartarchive.org/release/" + mbid + "/front";

        } catch (Exception e) {
            logger.warn("MusicBrainz lookup failed: {}", e.getMessage());
            return null;
        }
    }

    /* =========================
       TOKEN
       ========================= */

    private synchronized void ensureSpotifyToken() {
        if (spotifyAccessToken != null && System.currentTimeMillis() < spotifyTokenExpiry) {
            return;
        }

        try {
            String creds = SPOTIFY_CLIENT_ID + ":" + SPOTIFY_CLIENT_SECRET;

            HttpHeaders headers = new HttpHeaders();
            headers.set(
                    "Authorization",
                    "Basic " + java.util.Base64.getEncoder()
                            .encodeToString(
                                    creds.getBytes(StandardCharsets.UTF_8))
            );
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

            HttpEntity<String> req = new HttpEntity<>("grant_type=client_credentials", headers);

            ResponseEntity<Map> resp =
                    restTemplate.postForEntity(
                            SPOTIFY_TOKEN_URL,
                            req,
                            Map.class
                    );

            spotifyAccessToken = (String) resp.getBody().get("access_token");
            Integer expiresIn = (Integer) resp.getBody().get("expires_in");
            spotifyTokenExpiry =
                    System.currentTimeMillis() +
                            (expiresIn - 60) * 1000L;

            logger.info("Spotify token refreshed");

        } catch (Exception e) {
            logger.warn("Failed to refresh Spotify token: {}", e.getMessage());
            spotifyAccessToken = null;
            spotifyTokenExpiry = 0;
        }
    }

    /* =========================
       HELPERS
       ========================= */

    private boolean isValidCover(String url) {
        return url != null && !url.isBlank();
    }

    private String norm(String s) {
        return s == null ? "" :
                s.toLowerCase()
                        .replaceAll("[^a-z0-9]", "")
                        .trim();
    }
}