package com.example.AlbumRepo.Repository;

import com.example.AlbumRepo.Entity.Album;
import com.example.AlbumRepo.Entity.Artist;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface IAlbumRepository extends JpaRepository<Album,Integer> {
    // Find all albums by artist
    List<Album> findByArtist(Artist artist);

    // Filter by genre
    List<Album> findByGenreIgnoreCase(String genre);

    // Filter by release year
    List<Album> findByReleaseYear(Integer year);

    // Filter by rating (e.g., all albums rated above 8)
    List<Album> findByRatingGreaterThanEqual(double rating);
}