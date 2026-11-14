package com.example.AlbumRepo.Repository;

import com.example.AlbumRepo.Entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface IUserRepository extends JpaRepository<User, Long> {
    Optional<User> findByGoogleId(String googleId);
}