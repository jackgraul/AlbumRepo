package com.example.AlbumRepo.Service;

import com.example.AlbumRepo.Entity.Album;
import com.example.AlbumRepo.Repository.IAlbumRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.text.Normalizer;
import java.util.List;
import java.util.Map;

@Service
public class CoverArtService {

    private final RestTemplate restTemplate;
    private final IAlbumRepository albumRepository;
    private static final Logger logger = LoggerFactory.getLogger(CoverArtService.class);

    // MusicBrainz requires a proper identifying UA
    private static final String USER_AGENT = "AlbumRepo/1.0 ( jack.graul@example.com )";
    private static final String DEFAULT_COVER = "/images/default-cover.png";

    // MusicBrainz rate limiting (>= 1.2s between calls)
    private static long lastMusicBrainzCall = 0L;

    public CoverArtService(IAlbumRepository albumRepository) {
        this.restTemplate = new RestTemplate();
        this.albumRepository = albumRepository;
    }

    // --------------------------------------------------
    // Public API
    // --------------------------------------------------

    public void fetchCoversForAllAlbums() {
        List<Album> albums = albumRepository.findAllWithoutCovers();
        logger.info("Albums found without covers: {}", albums.size());

        for (Album album : albums) {
            if (isMissingCover(album.getCoverURL())) {
                logger.info("Fetching cover for album '{}' (no valid cover set).",
                        album.getAlbumName());
                fetchAndSaveCover(album);
            }
        }
    }

    public void fetchAndSaveCover(Album album) {
        String originalArtist = album.getArtist().getArtistName();
        String originalTitle = album.getAlbumName();

        try {
            logger.info("Fetching cover for {} - {}", originalArtist, originalTitle);

            String artist = cleanForSearch(originalArtist);
            String title = cleanForSearch(originalTitle);

            // Try with original text
            String coverUrl = fetchFromMusicBrainz(artist, title);

            // Retry with ASCII-normalized if nothing
            if (!isValidCover(coverUrl)) {
                String artistAscii = normalizeAscii(artist);
                String titleAscii = normalizeAscii(title);
                logger.info("Retrying MusicBrainz with ASCII-normalized search for {} - {}",
                        artistAscii, titleAscii);
                coverUrl = fetchFromMusicBrainz(artistAscii, titleAscii);
            }

            if (!isValidCover(coverUrl)) {
                coverUrl = DEFAULT_COVER;
                logger.warn("No MusicBrainz cover found for {} - {}, using default.",
                        originalArtist, originalTitle);
            }

            logSelectedSource(originalArtist, originalTitle, coverUrl);

            album.setCoverURL(coverUrl);
            albumRepository.save(album);
            logger.info("Saved cover for {} - {}: {}", originalArtist, originalTitle, coverUrl);

        } catch (Exception e) {
            logger.error("Error saving cover for {} - {}: {}", originalArtist, originalTitle, e.getMessage());
            album.setCoverURL(DEFAULT_COVER);
            albumRepository.save(album);
        } finally {
            try { Thread.sleep(1100); } catch (InterruptedException ignored) {}
        }
    }

    // --------------------------------------------------
    // MusicBrainz + CoverArtArchive
    // --------------------------------------------------

    private String fetchFromMusicBrainz(String artist, String albumTitle) {
        try {
            waitMusicBrainzWindow();

            String encodedArtist = URLEncoder.encode(artist, StandardCharsets.UTF_8);
            String encodedTitle = URLEncoder.encode(albumTitle, StandardCharsets.UTF_8);

            String searchUrl = "https://musicbrainz.org/ws/2/release/?query="
                    + "artist:" + encodedArtist
                    + "%20AND%20release:" + encodedTitle
                    + "&fmt=json";

            HttpHeaders headers = new HttpHeaders();
            headers.add("User-Agent", USER_AGENT);
            headers.add("Accept-Charset", "UTF-8");
            HttpEntity<Void> entity = new HttpEntity<>(headers);

            logger.info("Calling MusicBrainz for {} - {}", artist, albumTitle);

            ResponseEntity<Map> responseEntity =
                    restTemplate.exchange(searchUrl, HttpMethod.GET, entity, Map.class);

            if (!responseEntity.getStatusCode().is2xxSuccessful()) {
                logger.warn("MusicBrainz search non-2xx for {} - {}: {}",
                        artist, albumTitle, responseEntity.getStatusCode());
                return null;
            }

            Map body = responseEntity.getBody();
            if (body == null) return null;

            List<Map<String, Object>> releases = (List<Map<String, Object>>) body.get("releases");
            if (releases == null || releases.isEmpty()) {
                logger.warn("No MusicBrainz releases found for {} - {}", artist, albumTitle);
                return null;
            }

            String targetTitle = norm(albumTitle);
            String targetArtist = norm(artist);

            Map<String, Object> best = null;
            int bestQuality = -1;

            for (Map<String, Object> release : releases) {
                String releaseTitleRaw = (String) release.get("title");
                if (releaseTitleRaw == null) continue;

                String releaseTitle = norm(releaseTitleRaw);

                List<Map<String, Object>> acList =
                        (List<Map<String, Object>>) release.get("artist-credit");

                boolean anyArtistExact = false;
                boolean anyArtistLoose = false;

                if (acList != null) {
                    for (Map<String, Object> ac : acList) {
                        String creditName = ac.get("name") instanceof String
                                ? norm((String) ac.get("name"))
                                : null;

                        Map artistObj = (Map) ac.get("artist");
                        String artistName = null;
                        if (artistObj != null) {
                            Object n = artistObj.get("name");
                            if (n instanceof String) {
                                artistName = norm((String) n);
                            }
                        }

                        String candidate = creditName != null ? creditName : artistName;
                        if (candidate == null) continue;

                        if (candidate.equals(targetArtist)) {
                            anyArtistExact = true;
                        } else if (candidate.contains(targetArtist) || targetArtist.contains(candidate)) {
                            anyArtistLoose = true;
                        }
                    }
                }

                int q = 0;

                // Title relevance
                if (releaseTitle.equals(targetTitle)) {
                    q += 60;
                } else if (releaseTitle.contains(targetTitle) || targetTitle.contains(releaseTitle)) {
                    q += 30;
                }

                // Artist relevance
                if (anyArtistExact) {
                    q += 40;
                } else if (anyArtistLoose) {
                    q += 20;
                }

                // Official releases get a bump
                String status = (String) release.get("status");
                if (status != null && "Official".equalsIgnoreCase(status)) {
                    q += 10;
                }

                // Use MB "score" if present
                Object scoreObj = release.get("score");
                if (scoreObj instanceof Number) {
                    int mbScore = ((Number) scoreObj).intValue(); // 0-100
                    q += mbScore / 5;
                }

                if (q > bestQuality) {
                    bestQuality = q;
                    best = release;
                }
            }

            final int QUALITY_THRESHOLD = 50;
            if (best == null || bestQuality < QUALITY_THRESHOLD) {
                logger.warn("No strong MusicBrainz match for {} - {} (bestQuality={})",
                        artist, albumTitle, bestQuality);
                return null;
            }

            logger.info("Chosen MusicBrainz release for {} - {} with quality {}",
                    artist, albumTitle, bestQuality);

            // Try CAA: release-group first, then release
            return resolveCoverArtUrl(best, entity);

        } catch (Exception e) {
            logger.warn("MusicBrainz lookup failed for {} - {}: {}", artist, albumTitle, e.getMessage());
            return null;
        }
    }

    /**
     * Use Cover Art Archive:
     *  1) Try release-group front-500
     *  2) If 404/Not Found, try release front-500
     *  3) If both fail, return null
     */
    private String resolveCoverArtUrl(Map<String, Object> best, HttpEntity<Void> entity) {
        Map<String, Object> bestRg = (Map<String, Object>) best.get("release-group");
        String rgid = (bestRg != null && bestRg.get("id") instanceof String)
                ? (String) bestRg.get("id")
                : null;
        String rid = (best.get("id") instanceof String)
                ? (String) best.get("id")
                : null;

        // Build candidate URLs in order
        String[] candidates;
        if (rgid != null && rid != null) {
            candidates = new String[] {
                    "https://coverartarchive.org/release-group/" + rgid + "/front-500",
                    "https://coverartarchive.org/release/" + rid + "/front-500"
            };
        } else if (rgid != null) {
            candidates = new String[] {
                    "https://coverartarchive.org/release-group/" + rgid + "/front-500"
            };
        } else if (rid != null) {
            candidates = new String[] {
                    "https://coverartarchive.org/release/" + rid + "/front-500"
            };
        } else {
            logger.warn("Best candidate missing IDs for CoverArtArchive.");
            return null;
        }

        for (String url : candidates) {
            try {
                ResponseEntity<byte[]> resp =
                        restTemplate.exchange(url, HttpMethod.GET, entity, byte[].class);
                int status = resp.getStatusCode().value();

                if (status >= 200 && status < 300) {
                    logger.info("Using CoverArtArchive URL: {}", url);
                    return url;
                } else if (status == 404) {
                    logger.debug("CoverArtArchive 404 for {}", url);
                } else {
                    logger.warn("CoverArtArchive {} for {}", status, url);
                }
            } catch (HttpClientErrorException.NotFound e) {
                logger.debug("CoverArtArchive 404 for {}", url);
            } catch (Exception e) {
                logger.warn("Error calling CoverArtArchive {}: {}", url, e.getMessage());
            }
        }

        logger.warn("No cover art found in CoverArtArchive for chosen MusicBrainz release.");
        return null;
    }

    // --------------------------------------------------
    // Helpers
    // --------------------------------------------------

    private synchronized void waitMusicBrainzWindow() {
        long now = System.currentTimeMillis();
        long elapsed = now - lastMusicBrainzCall;
        if (elapsed < 1200) {
            try { Thread.sleep(1200 - elapsed); } catch (InterruptedException ignored) {}
        }
        lastMusicBrainzCall = System.currentTimeMillis();
    }

    private boolean isMissingCover(String coverUrl) {
        if (coverUrl == null) return true;
        String u = coverUrl.trim();
        if (u.isEmpty()) return true;
        if (u.equals(DEFAULT_COVER)) return true;
        if (u.contains("spacer.gif")) return true;
        return false;
    }

    private boolean isValidCover(String coverUrl) {
        if (coverUrl == null) return false;
        String u = coverUrl.trim();
        if (u.isEmpty()) return false;
        if (u.contains("spacer.gif")) return false;
        return true;
    }

    private void logSelectedSource(String artist, String title, String coverUrl) {
        String source =
                coverUrl == null ? "None" :
                        coverUrl.contains("coverartarchive") ? "MusicBrainz" :
                                coverUrl.equals(DEFAULT_COVER) ? "Default" :
                                        "Unknown";
        logger.info("Selected cover source for {} - {}: {}", artist, title, source);
    }

    private String cleanForSearch(String text) {
        if (text == null) return "";
        return text
                .replaceAll("[^\\p{L}\\p{N}\\s:'&.,()\\-]", "")
                .replaceAll("\\s+", " ")
                .trim();
    }

    private String normalizeAscii(String text) {
        if (text == null) return "";
        String normalized = Normalizer.normalize(text, Normalizer.Form.NFD);
        return normalized.replaceAll("\\p{M}", ""); // strip diacritics
    }

    private String norm(String text) {
        return normalizeAscii(cleanForSearch(text)).toLowerCase();
    }
}