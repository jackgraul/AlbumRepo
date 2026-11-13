package com.example.AlbumRepo.DTO;

public record AuthResponse(
        Long id,
        String email,
        String displayName
) {}