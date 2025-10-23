package com.example.AlbumRepo.Repository;

import com.example.AlbumRepo.Entity.Artist;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface IArtistRepository extends JpaRepository<Artist,Integer> {
    @Query("SELECT a FROM Artist a LEFT JOIN FETCH a.albums")
    List<Artist> findAllWithAlbums();

    // Find artists whose names start with a letter
    List<Artist> findByArtistNameStartingWithIgnoreCase(String letter);

    // Optionally, a custom query to fetch with albums eagerly
    @Query("SELECT DISTINCT a FROM Artist a LEFT JOIN FETCH a.albums WHERE UPPER(a.artistName) LIKE CONCAT(:letter, '%')")
    List<Artist> findWithAlbumsByStartingLetter(@Param("letter") String letter);
}