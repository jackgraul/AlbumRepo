package com.example.AlbumRepo.Repository;

import com.example.AlbumRepo.Entity.Artist;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface IArtistRepository extends JpaRepository<Artist,Integer> {
    Optional<Artist> findByArtistNameIgnoreCase(String artistName);
}