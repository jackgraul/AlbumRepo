import React from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, Typography, Box, CardActionArea } from "@mui/material";
import { LazyLoadImage } from "react-lazy-load-image-component";
import "react-lazy-load-image-component/src/effects/blur.css";

interface AlbumCardProps {
  id: number;
  albumName: string;
  releaseYear: number;
  rating?: number;
  genre?: string;
  coverURL?: string;
  artistName: string;
}

// Keep consistent with AlbumList
const IMAGE_SIZE = 280;           // Square cover area
const CONTENT_MIN_HEIGHT = 120;   // Increased from 80 → fits multi-line text and rating

const AlbumCard: React.FC<AlbumCardProps> = ({
  id,
  albumName,
  releaseYear,
  rating,
  genre,
  coverURL,
  artistName,
}) => {
  const navigate = useNavigate();

  const proxiedUrl = coverURL
    ? `http://localhost:7373/api/albums/proxy-cover?url=${encodeURIComponent(coverURL)}`
    : "/images/default-cover.png";

return (
  <Card
    sx={{
      height: IMAGE_SIZE + CONTENT_MIN_HEIGHT,
      width: "100%",
      display: "flex",
      flexDirection: "column",
      backgroundColor: "background.paper",
      borderRadius: 2,
      overflow: "hidden",
      transition: "box-shadow 0.2s ease, transform 0.2s ease",
      border: "2px solid transparent",
      "&:hover": { boxShadow: 6, transform: "translateY(-4px)", borderColor: "#1976d2" },
    }}
  >
    <CardActionArea
      onClick={() => navigate(`/albums/${id}`)}
      sx={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "stretch" }}
    >
      {/* ✅ Square image section */}
      <Box
        sx={{
          width: "100%",
          height: IMAGE_SIZE,
          overflow: "hidden",
          flexShrink: 0,
        }}
      >
        <LazyLoadImage
          src={proxiedUrl}
          alt={albumName}
          effect="blur"
          referrerPolicy="no-referrer"
          onError={(e) => {
            (e.target as HTMLImageElement).src = "/images/default-cover.png";
          }}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "center",
            display: "block",
          }}
        />
      </Box>

      <CardContent
        sx={{
          minHeight: CONTENT_MIN_HEIGHT,
          p: 2,
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-start",
        }}
      >
        <Typography variant="h6" fontWeight={600} noWrap sx={{ lineHeight: 1.2, pb: 1 }}>
          {albumName}
        </Typography>

        <Typography variant="body2" color="text.secondary" noWrap>
          {artistName} • {releaseYear} {genre && `• ${genre}`}
        </Typography>

        {rating !== undefined ? (
          <Typography variant="body2" sx={{ mt: 1 }}>
            ⭐ {rating} / 10
          </Typography>
        ) : (
          <Box sx={{ mt: 1, height: 20 }} />
        )}
      </CardContent>
    </CardActionArea>
  </Card>
);
};

export default AlbumCard;