import React from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, Typography, CardActionArea } from "@mui/material";
import { Album } from "../../models/models";

interface ArtistCardProps {
  id: number;
  letter: string;
  artistName: string;
  albums: Album[];
  avgRating?: string;
}

const ArtistCard: React.FC<ArtistCardProps> = ({ id, letter, artistName, albums, avgRating }) => {
  const navigate = useNavigate();

  return (
    <Card
      sx={{
        height: "100%",
        position: "relative",
        zIndex: 0,
        backgroundColor: "background.paper",
        display: "flex",
        flexDirection: "column",
        borderRadius: 1.5,
        border: "1px solid",
        borderColor: "divider",
        transition: "transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease",
        "&:hover": {
          zIndex: 2,
          transform: "translateY(-4px)",
          boxShadow: 6,
          borderColor: "primary.main",
        },
      }}
    >
      <CardActionArea
        onClick={() => navigate(`/artists/${id}`)}
        sx={{ flexGrow: 1 }}
      >
        <CardContent sx={{ p: 1.5, "&:last-child": { pb: 1.5 } }}>
          <Typography variant="subtitle1" fontWeight={600} noWrap>
            {artistName || "Unknown Artist"}
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
            noWrap
            sx={{ fontSize: "0.8rem", mt: 0.25 }}
          >
            {letter}
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
            noWrap
            sx={{ fontSize: "0.8rem" }}
          >
            {albums.length} {albums.length === 1 ? "album" : "albums"}
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
            noWrap
            sx={{ fontSize: "0.8rem" }}
          >
            Avg. Rating: {avgRating !== undefined ? avgRating : "N/A"}
          </Typography>
        </CardContent>
      </CardActionArea>
    </Card>
  );
};

export default ArtistCard;
