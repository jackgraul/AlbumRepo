package com.example.AlbumRepo.Service;

import java.util.LinkedHashMap;
import java.util.Map;

public class CacheService {

    private static final int MAX_ENTRIES = 200;
    private static final Map<String, byte[]> CACHE =
            new LinkedHashMap<>(MAX_ENTRIES, 0.75f, true) {
                @Override
                protected boolean removeEldestEntry(Map.Entry<String, byte[]> eldest) {
                    return size() > MAX_ENTRIES;
                }
            };

    public static synchronized byte[] get(String key) {
        return CACHE.get(key);
    }

    public static synchronized void put(String key, byte[] value) {
        CACHE.put(key, value);
    }
}