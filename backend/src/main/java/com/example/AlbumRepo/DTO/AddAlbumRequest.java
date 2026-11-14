package com.example.AlbumRepo.DTO;

import com.example.AlbumRepo.Entity.Album;

public record AddAlbumRequest(
        Album album,
        Double rating
) {}