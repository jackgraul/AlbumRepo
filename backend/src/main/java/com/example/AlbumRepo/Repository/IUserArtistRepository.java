package com.example.AlbumRepo.Repository;

import com.example.AlbumRepo.Entity.UserArtist;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface IUserArtistRepository extends JpaRepository<UserArtist, Long> {
    boolean existsByUser_IdAndArtist_Id(Long userId, Integer artistId);
    Optional<UserArtist> findByUser_IdAndArtist_Id(Long userId, Integer artistId);

    @Query("""
    SELECT ua
    FROM UserArtist ua
    JOIN FETCH ua.artist
    WHERE ua.user.id = :userId
    """)
    List<UserArtist> findArtistsForUser(@Param("userId") Long userId);
}