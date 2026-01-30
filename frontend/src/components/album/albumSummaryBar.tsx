import React from "react";
import { Box, Typography, Button, Stack } from "@mui/material";
import { useNavigate } from "react-router-dom";

interface AlbumSummaryBarProps {
  totalAlbums: number;
  listenedAlbums: number;
  uniqueArtists: number;
  wrongCoverAlbums?: number;
  noGenre?: number;
  avgRating?: number;
}

const AlbumSummaryBar: React.FC<AlbumSummaryBarProps> = ({
  totalAlbums,
  listenedAlbums,
  uniqueArtists,
  wrongCoverAlbums,
  noGenre,
  avgRating
}) => {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        mt: 2,
        mb: 2,
        py: 1.5,
        px: 2,
        borderRadius: 2,
        backgroundColor: "background.paper",
        boxShadow: 2,
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
      }}
    >
      <Stack direction="row" spacing={5} alignItems="center">
        <Typography variant="subtitle1" fontWeight={600}>
          Artists: {uniqueArtists}
        </Typography>

        <Typography variant="subtitle1" fontWeight={600}>
          Avg. Rating: {avgRating !== undefined ? avgRating.toFixed(2) : "N/A"}
        </Typography>
      </Stack>

      {totalAlbums > 0 && (
        <Box
          sx={{
            position: "absolute",
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            alignItems: "center",
            gap: 2
          }}
        >
          <Typography variant="h6" fontWeight={600}>
            Listened: {listenedAlbums} / {totalAlbums}
          </Typography>

          <Typography
            variant="h6"
            fontWeight={700}
            sx={{
              color:
                listenedAlbums / totalAlbums >= 0.9
                  ? "#1976d2"
                  : listenedAlbums / totalAlbums >= 0.7
                  ? "#2e7d32"
                  : listenedAlbums / totalAlbums >= 0.5
                  ? "#fbc02d"
                  : listenedAlbums / totalAlbums >= 0.3
                  ? "#ef6c00"
                  : "#d32f2f"
            }}
          >
            ({Math.round((listenedAlbums / totalAlbums) * 100)}%)
          </Typography>
        </Box>
      )}

      <Button
        variant="contained"
        color="primary"
        onClick={() => navigate("/albums/new")}
        sx={{ mt: { xs: 1, sm: 0 } }}
      >
        + New Album
      </Button>
    </Box>
  );
};

export default AlbumSummaryBar;