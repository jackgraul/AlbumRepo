package com.example.AlbumRepo.Service;

import com.example.AlbumRepo.Entity.Album;
import com.example.AlbumRepo.Repository.IAlbumRepository;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
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
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class CoverArtService {

    private final RestTemplate restTemplate;
    private final IAlbumRepository albumRepository;
    private static final Logger logger = LoggerFactory.getLogger(CoverArtService.class);

    @Value("${discogs.api.token}")
    private String discogsToken;

    // --- MusicBrainz Rate Limiting ---
    private static long lastMusicBrainzCall = 0;

    private synchronized void waitMusicBrainzWindow() {
        long now = System.currentTimeMillis();
        long elapsed = now - lastMusicBrainzCall;
        if (elapsed < 1200) {
            try {
                Thread.sleep(1200 - elapsed);
            } catch (InterruptedException ignored) {}
        }
        lastMusicBrainzCall = System.currentTimeMillis();
    }

    public CoverArtService(IAlbumRepository albumRepository) {
        this.restTemplate = new RestTemplate();
        this.albumRepository = albumRepository;
    }

    // --------------------------------------------------
    // Main Fetch Logic (Unicode + ASCII fallback)
    // --------------------------------------------------
    public void fetchAndSaveCover(Album album) {
        String artist = album.getArtist().getArtistName();
        String title = album.getAlbumName();
        String coverUrl = null;

        try {
            logger.info("Fetching cover for {} - {}", artist, title);

            // Clean but preserve punctuation
            artist = cleanForSearch(artist);
            title = cleanForSearch(title);

            // Try full Unicode search
            coverUrl = tryAllSources(artist, title);

            // Retry with ASCII-normalized fallback
            if (coverUrl == null) {
                String artistAscii = normalizeAscii(artist);
                String titleAscii = normalizeAscii(title);
                logger.info("Retrying with ASCII-normalized search for {} - {}", artistAscii, titleAscii);
                coverUrl = tryAllSources(artistAscii, titleAscii);
            }

            // Fallback to default
            if (coverUrl == null) {
                coverUrl = "/images/default-cover.png";
                logger.warn("No cover found for {} - {}, using default.", artist, title);
            }

            // Identify which source worked
            logger.info("Selected cover source for {} - {}: {}",
                    artist, title,
                    coverUrl.contains("coverartarchive") ? "MusicBrainz" :
                            coverUrl.contains("metal-archives") ? "Metal Archives" :
                                    coverUrl.contains("discogs") ? "Discogs" :
                                            coverUrl.contains("snmc.io") ? "RateYourMusic" : "Default");

            album.setCoverURL(coverUrl);
            albumRepository.save(album);
            logger.info("Saved cover for {} - {}: {}", artist, title, coverUrl);

        } catch (Exception e) {
            logger.error("Error saving cover for {} - {}: {}", artist, title, e.getMessage());
            album.setCoverURL("/images/default-cover.png");
            albumRepository.save(album);
        } finally {
            try { Thread.sleep(1100); } catch (InterruptedException ignored) {}
        }
    }

    private String tryAllSources(String artist, String title) {
        String coverUrl = fetchFromMusicBrainz(artist, title);
        if (coverUrl != null) return coverUrl;

        coverUrl = fetchFromMetalArchives(artist, title);
        if (coverUrl != null) return coverUrl;

        coverUrl = fetchFromRateYourMusic(artist, title);
        if (coverUrl != null) return coverUrl;

        return fetchFromDiscogs(artist, title);
    }

    public void fetchCoversForAllAlbums() {
        List<Album> albums = albumRepository.findAllWithoutCovers();
        logger.info("Albums found: {}", albums.size());
        for (Album album : albums) {
            String coverUrl = album.getCoverURL();
            if (coverUrl == null || coverUrl.trim().isEmpty()
                    || coverUrl.equals("/images/default-cover.png")
                    || coverUrl.contains("spacer.gif")) {
                logger.info("Fetching cover for album '{}' as cover URL is missing.", album.getAlbumName());
                fetchAndSaveCover(album);
            }
        }
    }

    // --------------------------------------------------
    // MusicBrainz
    // --------------------------------------------------
    private String fetchFromMusicBrainz(String artist, String albumTitle) {
        try {
            String encodedArtist = URLEncoder.encode(artist, StandardCharsets.UTF_8);
            String encodedTitle = URLEncoder.encode(albumTitle, StandardCharsets.UTF_8);

            String searchUrl = "https://musicbrainz.org/ws/2/release/?query=artist:" + encodedArtist +
                    "%20AND%20release:" + encodedTitle + "&fmt=json";

            HttpHeaders headers = new HttpHeaders();
            headers.add("User-Agent", "AlbumRepo/1.0 ( jack.graul@example.com )");
            headers.add("Accept-Charset", "UTF-8");
            HttpEntity<Void> entity = new HttpEntity<>(headers);

            logger.info("Calling MusicBrainz for {} - {}", artist, albumTitle);

            ResponseEntity<Map> responseEntity = restTemplate.exchange(searchUrl, HttpMethod.GET, entity, Map.class);
            Map body = responseEntity.getBody();
            if (body == null) return null;

            List<Map> releases = (List<Map>) body.get("releases");
            if (releases == null || releases.isEmpty()) return null;

            for (Map release : releases) {
                String releaseId = (String) release.get("id");
                Map releaseGroup = (Map) release.get("release-group");

                String coverUrl = (releaseGroup != null && releaseGroup.get("id") != null)
                        ? "https://coverartarchive.org/release-group/" + releaseGroup.get("id") + "/front-500"
                        : "https://coverartarchive.org/release/" + releaseId + "/front-500";

                try {
                    ResponseEntity<byte[]> resp = restTemplate.exchange(coverUrl, HttpMethod.GET, entity, byte[].class);
                    int status = resp.getStatusCode().value();

                    if (status >= 200 && status < 400) { // Accept redirects too
                        logger.info("Found valid MusicBrainz cover for {} - {}: {}", artist, albumTitle, coverUrl);
                        return coverUrl;
                    }
                } catch (HttpClientErrorException.NotFound e) {
                    // skip this release
                } catch (Exception e) {
                    logger.debug("MusicBrainz cover check failed for release {}: {}", releaseId, e.getMessage());
                }

                Thread.sleep(500); // gentle rate limiting
            }

            logger.warn("No MusicBrainz covers found for {} - {}", artist, albumTitle);

        } catch (Exception e) {
            logger.warn("MusicBrainz lookup failed for {} - {}: {}", artist, albumTitle, e.getMessage());
        }

        // Fallback directly to Discogs if MusicBrainz failed completely
        try {
            String discogsCover = fetchFromDiscogs(artist, albumTitle);
            if (discogsCover != null) {
                logger.info("Using Discogs fallback for {} - {}: {}", artist, albumTitle, discogsCover);
                return discogsCover;
            }
        } catch (Exception ignored) {}

        return null;
    }

    // --------------------------------------------------
    // Metal Archives
    // --------------------------------------------------
    private String fetchFromMetalArchives(String artist, String albumTitle) {
        try {
            String searchUrl = "https://www.metal-archives.com/search/ajax-advanced/searching/albums/?bandName="
                    + URLEncoder.encode(artist, StandardCharsets.UTF_8)
                    + "&releaseTitle=" + URLEncoder.encode(albumTitle, StandardCharsets.UTF_8)
                    + "&iDisplayStart=0&iDisplayLength=1";

            Map response = restTemplate.getForObject(searchUrl, Map.class);
            List<List<String>> aaData = (List<List<String>>) response.get("aaData");
            if (aaData != null && !aaData.isEmpty()) {
                String html = aaData.get(0).get(0);
                Matcher m = Pattern.compile("href=\"(.*?)\"").matcher(html);
                if (m.find()) {
                    String albumUrl = m.group(1);
                    String htmlPage = restTemplate.getForObject(albumUrl, String.class);
                    Matcher imgMatch = Pattern.compile("<img src=\"(https://www\\.metal-archives\\.com/images/\\d+/\\d+/\\d+/\\d+/.*?)\"")
                            .matcher(htmlPage);
                    if (imgMatch.find()) {
                        return imgMatch.group(1);
                    }
                }
            }
        } catch (Exception e) {
            logger.warn("Metal Archives lookup failed for {} - {}", artist, albumTitle);
        }
        return null;
    }

    // --------------------------------------------------
    // RateYourMusic
    // --------------------------------------------------
    private String fetchFromRateYourMusic(String artist, String albumTitle) {
        try {
            String searchUrl = "https://rateyourmusic.com/search?searchterm="
                    + URLEncoder.encode(artist + " " + albumTitle, StandardCharsets.UTF_8)
                    + "&type=l";

            HttpHeaders headers = new HttpHeaders();
            headers.add("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64)");
            headers.add("Accept-Language", "en-US,en;q=0.9");
            headers.add("Accept-Charset", "UTF-8");
            HttpEntity<Void> entity = new HttpEntity<>(headers);

            ResponseEntity<String> response = restTemplate.exchange(searchUrl, HttpMethod.GET, entity, String.class);
            String html = response.getBody();
            if (html == null) return null;

            Document doc = Jsoup.parse(html);
            Element img = doc.selectFirst("img[src^=https://e.snmc.io/i/], img[src*=/cover/], img[src*=/i/]");
            if (img != null) {
                return img.attr("src");
            }
        } catch (Exception e) {
            logger.warn("RateYourMusic lookup failed for {} - {}", artist, albumTitle);
        }
        return null;
    }

    // --------------------------------------------------
    // Discogs
    // --------------------------------------------------
    private String fetchFromDiscogs(String artist, String albumTitle) {
        try {
            String url = "https://api.discogs.com/database/search?artist="
                    + URLEncoder.encode(artist, StandardCharsets.UTF_8)
                    + "&release_title=" + URLEncoder.encode(albumTitle, StandardCharsets.UTF_8)
                    + "&type=release"
                    + "&per_page=3"
                    + "&token=" + discogsToken;

            ResponseEntity<Map> response = restTemplate.getForEntity(url, Map.class);
            Map body = response.getBody();
            if (body == null) return null;

            List<Map> results = (List<Map>) body.get("results");
            for (Map result : results) {
                Object thumb = result.get("cover_image");
                if (thumb != null) {
                    String imgUrl = thumb.toString();
                    if (imgUrl.endsWith(".jpg") || imgUrl.endsWith(".png")) {
                        if (!imgUrl.contains("spacer.gif")) {
                            return imgUrl;
                        }
                    }
                }
            }

        } catch (Exception e) {
            logger.warn("Discogs lookup failed for {} - {}", artist, albumTitle);
        }
        return null;
    }

    // --------------------------------------------------
    // Utility: Cleaning and Normalization
    // --------------------------------------------------
    private String cleanForSearch(String text) {
        return text
                .replaceAll("[^\\p{L}\\p{N}\\s:'&.,()\\-]", "")
                .replaceAll("\\s+", " ")
                .trim();
    }

    private String normalizeAscii(String text) {
        String normalized = Normalizer.normalize(text, Normalizer.Form.NFD);
        return normalized.replaceAll("\\p{M}", ""); // remove diacritics
    }
}