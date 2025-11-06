import React from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, Typography, CardActionArea } from "@mui/material";
import { Album } from "../../models/models";

interface ArtistCardProps {
  id: number;
  letter: string;
  artistName: string;
  albums: Album[];
}

const ArtistCard: React.FC<ArtistCardProps> = ({ id, letter, artistName, albums }) => {
  const navigate = useNavigate();

  return (
    <Card
      sx={{
        height: "100%",
        backgroundColor: "background.paper",
        display: "flex",
        flexDirection: "column",
        transition: "transform 0.2s ease, box-shadow 0.2s ease",
        "&:hover": { transform: "translateY(-4px)", boxShadow: 6, borderColor: "primary.main" },
      }}
    >
      <CardActionArea
        onClick={() => navigate(`/artists/${id}`)}
        sx={{ flexGrow: 1 }}
      >
        <CardContent>
          <Typography variant="h6" noWrap>
            {artistName || "Unknown Artist"}
          </Typography>

          <Typography variant="body2" color="text.secondary" noWrap>
            {letter}
          </Typography>

          <Typography variant="body2" color="text.secondary" noWrap>
            {albums.length} {albums.length === 1 ? "album" : "albums"}
          </Typography>
        </CardContent>
      </CardActionArea>
    </Card>
  );
};

export default ArtistCard;