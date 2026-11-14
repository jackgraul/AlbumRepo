package com.example.AlbumRepo.DTO;

public record UpdateAlbumMetadataRequest(
        String albumName,
        ArtistRequest artist,
        Integer releaseYear,
        String genre,
        String coverURL,
        Integer releaseOrder
) {
    public record ArtistRequest(
            Integer id,
            String artistName,
            String letter
    ) {}
}