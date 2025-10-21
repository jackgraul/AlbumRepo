package com.example.AlbumRepo.Repository;

import com.example.AlbumRepo.Entity.Album;
import com.example.AlbumRepo.Entity.Artist;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface IAlbumRepository extends JpaRepository<Album,Integer> {
    @Query("SELECT a FROM Album a JOIN FETCH a.artist WHERE a.coverURL IS NULL OR a.coverURL = '' OR a.coverURL LIKE CONCAT('%', '/images/default-cover.png', '%') OR a.coverURL LIKE CONCAT('%', 'spacer.gif', '%')")
    List<Album> findAllWithoutCovers();

    // Find all albums by artist
    List<Album> findByArtist(Artist artist);

    // Filter by genre
    List<Album> findByGenreIgnoreCase(String genre);

    // Filter by release year
    List<Album> findByReleaseYear(Integer year);

    // Filter by rating (e.g., all albums rated above 8)
    List<Album> findByRatingGreaterThanEqual(double rating);
}