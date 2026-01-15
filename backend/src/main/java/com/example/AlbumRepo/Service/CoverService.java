package com.example.AlbumRepo.Service;

import org.springframework.http.*;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.util.List;

@Service
public class CoverService {

    private final RestTemplate restTemplate;

    public CoverService() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(5000);
        factory.setReadTimeout(5000);
        this.restTemplate = new RestTemplate(factory);
    }

    public String normalizeUrl(String url) {
        return url.replaceAll("/front-\\d+$", "/front").replaceAll("\\?.*$", "");
    }

    public byte[] fetchAndCache(String url) {
        String cacheKey = normalizeUrl(url);

        byte[] cached = CacheService.get(cacheKey);
        if (cached != null) return cached;

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.set("User-Agent", "Mozilla/5.0");
            headers.setAccept(List.of(MediaType.ALL));
            HttpEntity<Void> requestEntity = new HttpEntity<>(headers);

            ResponseEntity<byte[]> response = restTemplate.exchange(
                    url, HttpMethod.GET, requestEntity, byte[].class);

            byte[] imageBytes = response.getBody();
            if (imageBytes == null || imageBytes.length == 0) return null;

            try (InputStream in = new ByteArrayInputStream(imageBytes)) {
                BufferedImage original = ImageIO.read(in);
                if (original == null) return null;

                int size = Math.min(original.getWidth(), original.getHeight());
                int x = (original.getWidth() - size) / 2;
                int y = (original.getHeight() - size) / 2;
                BufferedImage cropped = original.getSubimage(x, y, size, size);

                Image scaled = cropped.getScaledInstance(600, 600, Image.SCALE_SMOOTH);
                BufferedImage normalized = new BufferedImage(600, 600, BufferedImage.TYPE_INT_RGB);
                Graphics2D g2d = normalized.createGraphics();
                g2d.drawImage(scaled, 0, 0, null);
                g2d.dispose();

                try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
                    ImageIO.write(normalized, "jpg", out);
                    byte[] finalBytes = out.toByteArray();
                    CacheService.put(cacheKey, finalBytes);
                    return finalBytes;
                }
            }

        } catch (Exception e) {
            return null;
        }
    }
}