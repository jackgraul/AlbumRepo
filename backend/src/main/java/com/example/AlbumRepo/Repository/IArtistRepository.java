package com.example.AlbumRepo.Repository;

import com.example.AlbumRepo.Entity.Artist;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface IArtistRepository extends JpaRepository<Artist,Integer> {
    @Query("SELECT a FROM Artist a LEFT JOIN FETCH a.albums")
    List<Artist> findAllWithAlbums();
}