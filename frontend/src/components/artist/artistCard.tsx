import React from "react";
import {
  Card,
  CardContent,
  Typography
} from "@mui/material";

interface ArtistCardProps {
  id: number;
  letter: string;
  artistName: string;
}

const ArtistCard: React.FC<ArtistCardProps> = ({
  id,
  letter,
  artistName
}) => {
  return (
    <Card
      sx={{
        height: "100%",
        backgroundColor: "background.paper",
        display: "flex",
        flexDirection: "column",
        transition: "transform 0.2s ease, box-shadow 0.2s ease",
        "&:hover": { transform: "translateY(-4px)", boxShadow: 6 },
      }}
    >
      <CardContent>
        <Typography variant="h6" noWrap>
          {artistName || "Unknown Artist"}
        </Typography>

        <Typography variant="body2" color="text.secondary" noWrap>
          {letter}
        </Typography>
      </CardContent>
    </Card>
  );
};

export default ArtistCard;