package com.example.AlbumRepo.Repository;

import com.example.AlbumRepo.Entity.UserAlbum;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface IUserAlbumRepository extends JpaRepository<UserAlbum, Long> {
    Optional<UserAlbum> findByUser_IdAndAlbum_Id(Long userId, Integer albumId);

    @Query("""
    SELECT ua
    FROM UserAlbum ua
    JOIN FETCH ua.album a
    JOIN FETCH a.artist
    WHERE ua.user.id = :userId
    """)
    List<UserAlbum> findAlbumsForUser(@Param("userId") Long userId);
}