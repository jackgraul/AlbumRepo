package com.example.AlbumRepo.DTO;

public record AlbumResponse(
        Integer id,
        String albumName,
        Integer releaseYear,
        Integer releaseOrder,
        String genre,
        String coverURL,
        Double rating,
        ArtistSummaryResponse artist
) {}