package com.example.AlbumRepo.DTO;

import java.util.List;

public record ArtistResponse(
        Integer id,
        Character letter,
        String artistName,
        List<AlbumResponse> albums
) {}