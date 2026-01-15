package com.example.AlbumRepo.Service;

import com.example.AlbumRepo.Service.CoverService;
import org.springframework.stereotype.Service;

import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@Service
public class CoverPreloader {

    private final CoverService coverService;
    private final ExecutorService executor = Executors.newFixedThreadPool(5);

    public CoverPreloader(CoverService coverService) {
        this.coverService = coverService;
    }

    public void preload(String url) {
        if (url == null) return;

        String cacheKey = coverService.normalizeUrl(url);
        if (CacheService.get(cacheKey) != null) return; // already cached

        executor.submit(() -> {
            coverService.fetchAndCache(url); // only fetch + cache, no controller
        });
    }
}