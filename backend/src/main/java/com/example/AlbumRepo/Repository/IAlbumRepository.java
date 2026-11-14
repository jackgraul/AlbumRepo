package com.example.AlbumRepo.Repository;

import com.example.AlbumRepo.Entity.Album;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface IAlbumRepository extends JpaRepository<Album,Integer> {
    @Query("""
    SELECT a
    FROM Album a
    WHERE LOWER(TRIM(a.albumName)) = LOWER(TRIM(:albumName))
      AND a.artist.id = :artistId
    """)
    Optional<Album> findByAlbumNameAndArtistId(@Param("albumName") String albumName, @Param("artistId") Integer artistId);

    @Query("""
    SELECT a
    FROM Album a
    JOIN FETCH a.artist
    WHERE a.coverURL IS NULL
       OR TRIM(a.coverURL) = ''
       OR a.coverURL LIKE '%default-cover%'
    """) List<Album> findAllWithoutCovers();
}