package com.example.AlbumRepo.Entity;

import jakarta.persistence.*;
import java.time.OffsetDateTime;

@Entity
@Table(
        name = "User_Albums",
        schema = "AlbumRepo",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uq_user_albums",
                        columnNames = {"user_id", "album_id"}
                )
        }
)
public class UserAlbum {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "album_id", nullable = false)
    private Album album;

    private Double rating;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = OffsetDateTime.now();
        }
    }

    public Long getId() { return id; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public Album getAlbum() { return album; }
    public void setAlbum(Album album) { this.album = album; }

    public Double getRating() { return rating; }
    public void setRating(Double rating) { this.rating = rating; }
}