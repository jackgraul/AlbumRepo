// src/pages/AlbumDetailsPage.tsx
import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Typography, Card, CardMedia, CardContent, CircularProgress } from "@mui/material";
import api from "../api/apiClient";

interface Artist {
  id: number;
  artistName: string;
}

interface Album {
  id: number;
  albumName: string;
  releaseYear: number;
  rating?: number;
  coverURL: string;
  artist: Artist;
}

const AlbumDetailsPage: React.FC = () => {
  const { id } = useParams();
  const [album, setAlbum] = useState<Album | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get(`/albums/${id}`)
      .then((res) => {
        setAlbum(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching album:", err);
        setLoading(false);
      });
  }, [id]);

  if (loading) return <CircularProgress sx={{ m: 4 }} />;

  if (!album) return <Typography>No album found.</Typography>;

  return (
    <Card sx={{ maxWidth: 600, m: "2rem auto" }}>
      <CardMedia
        component="img"
        height="400"
        image={album.coverURL || "/images/default-cover.png"}
        alt={album.albumName}
      />
      <CardContent>
        <Typography variant="h4">{album.albumName}</Typography>
        <Typography variant="h6" sx={{ mb: 2 }}>
          <Link to={`/artists/${album.artist.id}`} style={{ textDecoration: "none" }}>
            {album.artist.artistName}
          </Link>
        </Typography>
        <Typography variant="body1">Released: {album.releaseYear}</Typography>
        {album.rating && <Typography variant="body1">Rating: ⭐ {album.rating}/10</Typography>}
      </CardContent>
    </Card>
  );
};

export default AlbumDetailsPage;