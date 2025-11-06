package com.example.AlbumRepo.Entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.util.List;

@Entity
@Table(name = "Artists")
public class Artist {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    private Character letter;

    @Column(name = "artist_name")
    private String artistName;

    @OneToMany(mappedBy = "artist", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnoreProperties("artist")
    private List<Album> albums;

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public Character getLetter() { return letter; }
    public void setLetter(Character letter) { this.letter = letter; }

    public String getArtistName() { return artistName; }
    public void setArtistName(String artistName) { this.artistName = artistName; }

    public List<Album> getAlbums() { return albums; }
    public void setAlbums(List<Album> albums) { this.albums = albums; }
}