import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Card, CardContent, Typography, Box, CardActionArea } from "@mui/material";
import { LazyLoadImage } from "react-lazy-load-image-component";
import "react-lazy-load-image-component/src/effects/blur.css";

interface AlbumCardProps {
  id: number;
  albumName: string;
  releaseYear: number;
  releaseOrder?: number;
  rating?: number;
  genre?: string;
  coverURL?: string;
  artistName: string;
  fromSearch: string;
  eager: boolean;
}

const IMAGE_SIZE = 280; // slightly reduced
const CONTENT_MIN_HEIGHT = 90; // smaller content section

const AlbumCard: React.FC<AlbumCardProps> = ({
  id,
  albumName,
  releaseYear,
  rating,
  genre,
  coverURL,
  artistName,
  fromSearch,
  eager
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const searchToCarry = fromSearch || location.search;

  const proxiedUrl =
  coverURL && coverURL.startsWith("http")
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
        onClick={() =>
          navigate(
            { pathname: `/albums/${id}`, search: searchToCarry },
            { state: { fromSearch: searchToCarry } }
          )
        }
        sx={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "stretch" }}
      >
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
            loading={eager ? "eager" : "lazy"}
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
            pt: 1,
            px: 2,
            pb: 2,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          {/* Album title */}
          <Typography
            variant="h6"
            fontWeight={600}
            noWrap
            sx={{ lineHeight: 1, pb: 3 }}
          >
            {albumName}
          </Typography>

          {/* Bottom row */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
            }}
          >
            <Box sx={{ display: "flex", flexDirection: "column" }}>
              <Typography variant="body2" color="text.secondary" noWrap>
                {artistName} • {releaseYear}
              </Typography>
              
              <Typography variant="body2" color="text.secondary" noWrap>
                {genre}
              </Typography>
            </Box>

            {rating !== undefined && (
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                ★ {rating} / 10
              </Typography>
            )}
          </Box>
        </CardContent>
      </CardActionArea>
    </Card>
  );
};

export default AlbumCard;