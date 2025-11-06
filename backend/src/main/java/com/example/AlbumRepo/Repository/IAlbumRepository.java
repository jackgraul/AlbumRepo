package com.example.AlbumRepo.Repository;

import com.example.AlbumRepo.Entity.Album;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface IAlbumRepository extends JpaRepository<Album,Integer> {
    @Query("SELECT a FROM Album a JOIN FETCH a.artist")
    List<Album> findAllWithArtists();

    @Query("SELECT a FROM Album a JOIN FETCH a.artist WHERE a.coverURL IS NULL OR a.coverURL = '' OR a.coverURL LIKE CONCAT('%', '/images/default-cover.png', '%') OR a.coverURL LIKE CONCAT('%', 'spacer.gif', '%')")
    List<Album> findAllWithoutCovers();
}