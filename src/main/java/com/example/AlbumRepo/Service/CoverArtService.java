package com.example.AlbumRepo.Service;

import com.example.AlbumRepo.Entity.Album;
import com.example.AlbumRepo.Repository.IAlbumRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;

@Service
public class CoverArtService {

    private final RestTemplate restTemplate;
    private final IAlbumRepository albumRepository;
    private static final Logger logger = LoggerFactory.getLogger(CoverArtService.class);

    public CoverArtService(IAlbumRepository albumRepository) {
        this.restTemplate = new RestTemplate();
        this.albumRepository = albumRepository;
    }

    public void fetchAndSaveCover(Album album) {
        try {
            logger.info("Fetching cover for album: {} by artist: {}",
                    album.getAlbumName(), album.getArtist().getArtistName());

            // Construct MusicBrainz search URL
            String artist = URLEncoder.encode(album.getArtist().getArtistName(), StandardCharsets.UTF_8);
            String title = URLEncoder.encode(album.getAlbumName(), StandardCharsets.UTF_8);
            String searchUrl = "https://musicbrainz.org/ws/2/release/?query=artist:" + artist +
                    "%20AND%20release:" + title + "&fmt=json";

            logger.info("Search URL: {}", searchUrl);

            Map response = restTemplate.getForObject(searchUrl, Map.class);
            List releases = (List) response.get("releases");

            if (releases != null && !releases.isEmpty()) {
                String mbid = (String) ((Map) releases.get(0)).get("id"); // MusicBrainz release ID
                String coverUrl = "https://coverartarchive.org/release/" + mbid + "/front-250"; // get front cover

                logger.info("Found cover URL: {}", coverUrl);
                album.setCoverURL(coverUrl);
            } else {
                logger.warn("No releases found for album: {}. Using default cover.", album.getAlbumName());
                album.setCoverURL("/images/default-cover.png");
            }

            albumRepository.save(album);
            logger.info("Saved album '{}' with cover URL: {}", album.getAlbumName(), album.getCoverURL());

        } catch (Exception e) {
            logger.error("Error fetching cover for album: {}. Using default cover.",
                    album.getAlbumName(), e);
            album.setCoverURL("/images/default-cover.png");
            albumRepository.save(album);
        }
    }

    public void fetchCoversForAllAlbums() {
        List<Album> albums = albumRepository.findAll();
        logger.info("Albums found: {}", albums.size());
        for (Album album : albums) {
            String coverUrl = album.getCoverURL();
            if (coverUrl == null || coverUrl.trim().isEmpty()) {
                logger.info("Fetching cover for album '{}' as cover URL is missing.", album.getAlbumName());
                fetchAndSaveCover(album);
            } else {
                logger.info("Skipping album '{}', cover URL already set.", album.getAlbumName());
            }
        }
    }
}