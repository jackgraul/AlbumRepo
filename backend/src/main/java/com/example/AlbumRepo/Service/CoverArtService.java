package com.example.AlbumRepo.Service;

import com.example.AlbumRepo.Entity.Album;
import com.example.AlbumRepo.Repository.IAlbumRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.io.BufferedWriter;
import java.io.FileWriter;
import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.text.Normalizer;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
public class CoverArtService {

    private final RestTemplate restTemplate = new RestTemplate();
    private final IAlbumRepository albumRepository;
    private static final Logger logger = LoggerFactory.getLogger(CoverArtService.class);
    private static final String USER_AGENT = "AlbumRepo/1.0 ( jack.graul99@gmail.com )";
    private static final String DEFAULT_COVER = "/default-cover.png";
    private static long lastMusicBrainzCall = 0L;
    private final String SPOTIFY_CLIENT_ID;
    private final String SPOTIFY_CLIENT_SECRET;
    private static final String SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token";
    private String spotifyAccessToken;
    private long spotifyTokenExpiry = 0L;

    public CoverArtService(
            IAlbumRepository albumRepository,
            @Value("${SPOTIFY_CLIENT_ID}") String spotifyClientId,
            @Value("${SPOTIFY_CLIENT_SECRET}") String spotifyClientSecret) {
        this.albumRepository = albumRepository;
        this.SPOTIFY_CLIENT_ID = spotifyClientId;
        this.SPOTIFY_CLIENT_SECRET = spotifyClientSecret;
    }

    // --------------------------------------------------
    // Public API
    // --------------------------------------------------

    public void fetchCoversForAllAlbums() {
        List<Album> albums = albumRepository.findAllWithoutCovers();
        logger.info("Albums found without covers: {}", albums.size());

        for (Album album : albums) {
            if (shouldUpdateCover(album.getCoverURL())) {
                fetchAndSaveCover(album);
            }
        }
    }

    public void fetchAndSaveCover(Album album) {
        String originalArtist = album.getArtist().getArtistName();
        String originalTitle = album.getAlbumName();

        try {
            logger.info("Fetching cover for {} - {}", originalArtist, originalTitle);

            String artist = norm(originalArtist);
            String title = norm(originalTitle);

            String coverUrl = fetchFromSpotify(artist, title);

            if (!isValidCover(coverUrl)) {
                coverUrl = fetchFromMusicBrainz(artist, title);
            }

            if (!isValidCover(coverUrl)) {
                coverUrl = DEFAULT_COVER;
                logger.warn("No cover found for {} - {}", originalArtist, originalTitle);
            }

            album.setCoverURL(coverUrl);
            albumRepository.save(album);

            String source =
                    coverUrl.contains("spotify") ? "Spotify" :
                            coverUrl.contains("coverartarchive") ? "MusicBrainz" :
                                    coverUrl.equals(DEFAULT_COVER) ? "Default" : "Unknown";

            logCoverUpdate(album, source);
            logger.info("Saved cover for {} - {} ({})",
                    originalArtist, originalTitle, source);

        } catch (Exception e) {
            logger.error("Cover fetch failed for {} - {}: {}",
                    originalArtist, originalTitle, e.getMessage());
        } finally {
            try { Thread.sleep(1100); } catch (InterruptedException ignored) {}
        }
    }

    // --------------------------------------------------
    // Spotify
    // --------------------------------------------------

    private synchronized void ensureSpotifyToken() {
        if (spotifyAccessToken != null &&
                System.currentTimeMillis() < spotifyTokenExpiry) return;

        try {
            HttpHeaders headers = new HttpHeaders();
            String creds = SPOTIFY_CLIENT_ID + ":" + SPOTIFY_CLIENT_SECRET;
            headers.set("Authorization", "Basic " +
                    java.util.Base64.getEncoder()
                            .encodeToString(creds.getBytes(StandardCharsets.UTF_8)));
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

            HttpEntity<String> req =
                    new HttpEntity<>("grant_type=client_credentials", headers);

            ResponseEntity<Map> resp =
                    restTemplate.postForEntity(SPOTIFY_TOKEN_URL, req, Map.class);

            spotifyAccessToken = (String) resp.getBody().get("access_token");
            Integer expiresIn = (Integer) resp.getBody().get("expires_in");
            spotifyTokenExpiry =
                    System.currentTimeMillis() + (expiresIn - 60) * 1000L;

            logger.info("Spotify token refreshed");

        } catch (Exception e) {
            logger.warn("Spotify token error: {}", e.getMessage());
        }
    }

    private String fetchFromSpotify(String artist, String album) {
        ensureSpotifyToken();
        if (spotifyAccessToken == null) return null;

        try {
            String q = URLEncoder.encode(
                    "album:" + album + " artist:" + artist,
                    StandardCharsets.UTF_8);

            String url =
                    "https://api.spotify.com/v1/search?q=" +
                            q + "&type=album&limit=10";

            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(spotifyAccessToken);

            ResponseEntity<Map> resp =
                    restTemplate.exchange(
                            url, HttpMethod.GET,
                            new HttpEntity<>(headers), Map.class);

            Map albums = (Map) resp.getBody().get("albums");
            List<Map<String, Object>> items =
                    (List<Map<String, Object>>) albums.get("items");

            if (items == null || items.isEmpty()) return null;

            Map<String, Object> best = null;
            int bestScore = -1;

            for (Map<String, Object> item : items) {
                String spTitle = norm((String) item.get("name"));
                List<Map<String, Object>> artists =
                        (List<Map<String, Object>>) item.get("artists");

                boolean artistMatch = artists.stream()
                        .anyMatch(a -> norm((String) a.get("name"))
                                .equals(artist));

                int score = 0;
                if (spTitle.equals(album)) score += 60;
                else if (spTitle.contains(album)) score += 30;
                if (artistMatch) score += 40;

                if (score > bestScore) {
                    bestScore = score;
                    best = item;
                }
            }

            if (bestScore < 50) {
                logger.info("Strict Spotify search failed, retrying fuzzy search");
                return fetchFromSpotifyFuzzy(artist, album);
            }

            List<Map<String, Object>> images =
                    (List<Map<String, Object>>) best.get("images");

            return images.get(0).get("url").toString();

        } catch (Exception e) {
            logger.warn("Spotify search failed: {}", e.getMessage());
            return null;
        }
    }

    private String fetchFromSpotifyFuzzy(String artist, String album) {
        try {
            String q = URLEncoder.encode(
                    artist + " " + album,
                    StandardCharsets.UTF_8);

            String url =
                    "https://api.spotify.com/v1/search?q=" +
                            q + "&type=album&limit=1";

            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(spotifyAccessToken);

            ResponseEntity<Map> resp =
                    restTemplate.exchange(
                            url, HttpMethod.GET,
                            new HttpEntity<>(headers), Map.class);

            Map albums = (Map) resp.getBody().get("albums");
            List<Map<String, Object>> items =
                    (List<Map<String, Object>>) albums.get("items");

            if (items == null || items.isEmpty()) return null;

            List<Map<String, Object>> images =
                    (List<Map<String, Object>>) items.get(0).get("images");

            return images.get(0).get("url").toString();

        } catch (Exception e) {
            return null;
        }
    }

    // --------------------------------------------------
    // MusicBrainz
    // --------------------------------------------------

    private String fetchFromMusicBrainz(String artist, String album) {
        try {
            waitMusicBrainzWindow();

            String url =
                    "https://musicbrainz.org/ws/2/release/?query=artist:" +
                            URLEncoder.encode(artist, StandardCharsets.UTF_8) +
                            "%20AND%20release:" +
                            URLEncoder.encode(album, StandardCharsets.UTF_8) +
                            "&fmt=json";

            HttpHeaders headers = new HttpHeaders();
            headers.set("User-Agent", USER_AGENT);

            ResponseEntity<Map> resp =
                    restTemplate.exchange(
                            url, HttpMethod.GET,
                            new HttpEntity<>(headers), Map.class);

            List<Map<String, Object>> releases =
                    (List<Map<String, Object>>) resp.getBody().get("releases");

            if (releases == null || releases.isEmpty()) return null;

            Map<String, Object> best = releases.get(0);
            return resolveCoverArtUrl(best);

        } catch (Exception e) {
            logger.warn("MusicBrainz failed: {}", e.getMessage());
            return null;
        }
    }

    private String resolveCoverArtUrl(Map<String, Object> release) {
        try {
            String id = (String) release.get("id");
            String url =
                    "https://coverartarchive.org/release/" + id + "/front-500";

            restTemplate.getForEntity(url, byte[].class);
            return url;

        } catch (HttpClientErrorException.NotFound e) {
            return null;
        }
    }

    // --------------------------------------------------
    // Helpers
    // --------------------------------------------------

    private void logCoverUpdate(Album album, String source) {
        String line = String.format(
                "%s | %s - %s (%s) | %s%n",
                LocalDateTime.now(),
                album.getArtist().getArtistName(),
                album.getAlbumName(),
                album.getReleaseYear(),
                source
        );

        try (BufferedWriter w =
                     new BufferedWriter(new FileWriter("cover-updates.txt", true))) {
            w.write(line);
        } catch (IOException e) {
            logger.warn("Cover log write failed: {}", e.getMessage());
        }
    }

    private synchronized void waitMusicBrainzWindow() {
        long now = System.currentTimeMillis();
        long elapsed = now - lastMusicBrainzCall;
        if (elapsed < 1200) {
            try { Thread.sleep(1200 - elapsed); } catch (InterruptedException ignored) {}
        }
        lastMusicBrainzCall = System.currentTimeMillis();
    }

    private boolean shouldUpdateCover(String coverUrl) {
        if (coverUrl == null) return true;
        String u = coverUrl.trim();
        return u.isEmpty() || u.equals(DEFAULT_COVER);
    }

    private boolean isValidCover(String url) {
        return url != null && !url.trim().isEmpty();
    }

    // --------------------------------------------------
    // NORMALIZATION (critical)
    // --------------------------------------------------

    private String norm(String text) {
        if (text == null) return "";

        String s = text;

        s = s.replace('’', '\'')
                .replace('‘', '\'')
                .replace('“', '"')
                .replace('”', '"')
                .replace('–', '-')
                .replace('—', '-')
                .replace("…", "");

        s = s.replace("Æ", "AE").replace("æ", "ae")
                .replace("Ø", "O").replace("ø", "o")
                .replace("Å", "A").replace("å", "a")
                .replace("Þ", "Th").replace("þ", "th")
                .replace("Ð", "D").replace("ð", "d")
                .replace("ß", "ss");

        s = Normalizer.normalize(s, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "");

        s = s.replaceAll("[\\p{Punct}]+$", "")
                .replaceAll("\\s+", " ")
                .trim();

        return s.toLowerCase();
    }
}