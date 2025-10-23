// src/pages/ArtistDetailsPage.tsx
import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Typography, CircularProgress, Grid } from "@mui/material";
import api from "../api/apiClient";
import AlbumCard from "../components/album/albumCard";

interface Album {
  id: number;
  albumName: string;
  releaseYear: number;
  genre?: string;
  rating?: number;
  coverURL?: string;
  artist: Artist
}

interface Artist {
  id: number;
  artistName: string;
  albums: Album[];
}

const ArtistDetailsPage: React.FC = () => {
  const { id } = useParams();
  const [artist, setArtist] = useState<Artist | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get(`/artists/${id}`)
      .then((res) => {
        setArtist(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching artist:", err);
        setLoading(false);
      });
  }, [id]);

  if (loading) return <CircularProgress sx={{ m: 4 }} />;

  if (!artist) return <Typography>No artist found.</Typography>;

  return (
    <div style={{ padding: "2rem" }}>
      <Typography variant="h4" gutterBottom>
        {artist.artistName}
      </Typography>
      <Grid container spacing={2}>
        {artist.albums.map((album) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={album.id}>
            <AlbumCard {...album} artistName={artist.artistName} />
          </Grid>
        ))}
      </Grid>
    </div>
  );
};

export default ArtistDetailsPage;