import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Card,
  CardContent,
  Typography,
  Box,
  CardActionArea,
} from "@mui/material";
import MarqueeOnOverflow from "../marqueeOverflow";
import { LazyLoadImage } from "react-lazy-load-image-component";
import { buildApiUrl } from "../../api/apiClient";

interface AlbumCardProps {
  id: number;
  albumName: string;
  releaseYear: number;
  cardWidth: number;
  imageSize: number;
  contentHeight: number;
  releaseOrder?: number;
  rating?: number;
  genre?: string;
  coverURL?: string;
  artistName: string;
  fromSearch: string;
  eager: boolean;
}

const AlbumCard: React.FC<AlbumCardProps> = ({
  id,
  albumName,
  releaseYear,
  cardWidth,
  imageSize,
  contentHeight,
  rating,
  genre,
  coverURL,
  artistName,
  fromSearch,
  eager,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const searchToCarry = fromSearch || location.search;
  const proxiedUrl =
    coverURL && coverURL.startsWith("http")
      ? buildApiUrl(
          `/albums/proxy-cover?url=${encodeURIComponent(coverURL)}`
        )
      : "/default-cover.png";

  return (
    <Card
      className="album-card"
      sx={{
        height: imageSize + contentHeight,
        maxWidth: cardWidth,
        width: "100%",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "background.paper",
        borderRadius: 1.5,
        overflow: "hidden",
        transition: "box-shadow 0.2s ease, transform 0.2s ease",
        border: "2px solid transparent",
        "&:hover": {
          boxShadow: 6,
          transform: "translateY(-4px)",
          borderColor: "#1976d2",
        },
      }}
    >
      <CardActionArea
        onClick={() =>
          navigate(
            { pathname: `/albums/${id}`, search: searchToCarry },
            { state: { fromSearch: searchToCarry } }
          )
        }
        sx={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "stretch",
        }}
      >
        <Box
          sx={{
            width: "100%",
            height: imageSize,
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
              (e.target as HTMLImageElement).src = "/default-cover.png";
            }}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
              display: "block",
            }}
          />
        </Box>

        <CardContent
          sx={{
            height: contentHeight,
            boxSizing: "border-box",
            pt: 1,
            px: 1.25,
            pb: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-start",
            gap: 0.5,
            "&:last-child": {
              pb: 1,
            },
          }}
        >
          <MarqueeOnOverflow
            variant="subtitle2"
            fontWeight={600}
            duration={8}
            sx={{ lineHeight: 1.1, fontSize: "0.85rem" }}
          >
            {albumName}
          </MarqueeOnOverflow>

          <MarqueeOnOverflow
            variant="body2"
            color="text.secondary"
            duration={6}
            sx={{ fontSize: "0.65rem", lineHeight: 0.8 }}
          >
            {artistName} • {releaseYear}
          </MarqueeOnOverflow>

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              minWidth: 0,
            }}
          >
            <MarqueeOnOverflow
              variant="body2"
              color="text.secondary"
              duration={8}
              sx={{ fontSize: "0.65rem", lineHeight: 0.8 }}
            >
              {genre}
            </MarqueeOnOverflow>
            {rating !== undefined && (
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 500,
                  fontSize: "0.7rem",
                  flexShrink: 0,
                  whiteSpace: "nowrap",
                }}
              >
                ★ {rating} / 10
              </Typography>
            )}
          </Box>
        </CardContent>
      </CardActionArea>

      <style>
        {`
          @keyframes marquee {
            0% { transform: translateX(0); }
            100% { transform: translateX(-100%); }
          }

          .album-card:hover .marquee-enabled {
            animation: marquee var(--marquee-duration) linear infinite;
          }
        `}
      </style>
    </Card>
  );
};

export default AlbumCard;
