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
  avgRating,
}) => {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        mt: 0.75,
        mb: 1.25,
        py: 1.25,
        px: { xs: 1.25, sm: 1.5 },
        borderRadius: 2,
        backgroundColor: "background.paper",
        boxShadow: 2,
        position: { sm: "relative" },
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 1.25,
      }}
    >
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={{ xs: 0.5, sm: 3 }}
        alignItems={{ xs: "flex-start", sm: "center" }}
        px={1}
      >
        <Typography variant="subtitle2" fontWeight={600} sx={{ fontSize: "0.85rem" }}>
          Artists: {uniqueArtists}
        </Typography>

        <Typography variant="subtitle2" fontWeight={600} sx={{ fontSize: "0.85rem" }}>
          Avg. Rating: {avgRating !== undefined ? avgRating.toFixed(2) : "N/A"}
        </Typography>
      </Stack>

      {totalAlbums > 0 && (
        <Box
          sx={{
            position: { xs: "static", sm: "absolute" },
            left: { sm: "50%" },
            transform: { sm: "translateX(-50%)" },
            display: "flex",
            alignItems: "center",
            gap: 1.25,
            order: { xs: 3, sm: 2 },
            width: { xs: "100%", sm: "auto" },
            justifyContent: { xs: "flex-start", sm: "center" },
          }}
        >
          <Typography variant="subtitle2" fontWeight={600} sx={{ fontSize: "0.85rem" }}>
            Listened: {listenedAlbums} / {totalAlbums}
          </Typography>

          <Typography
            variant="subtitle2"
            fontWeight={700}
            sx={{
              fontSize: "0.85rem",
              color:
                listenedAlbums / totalAlbums >= 0.9
                  ? "#1976d2"
                  : listenedAlbums / totalAlbums >= 0.7
                  ? "#2e7d32"
                  : listenedAlbums / totalAlbums >= 0.5
                  ? "#fbc02d"
                  : listenedAlbums / totalAlbums >= 0.3
                  ? "#ef6c00"
                  : "#d32f2f",
            }}
          >
            {((listenedAlbums / totalAlbums) * 100).toFixed(2)}%
          </Typography>
        </Box>
      )}

      <Button
        variant="contained"
        color="primary"
        onClick={() => navigate("/albums/new")}
        size="small"
        sx={{
          minWidth: 124,
          order: { xs: 2, sm: 3 },
          mt: { xs: 0.5, sm: 0 },
          fontSize: "0.75rem",
          mr: 0.5
        }}
      >
        + New Album
      </Button>
    </Box>
  );
};

export default AlbumSummaryBar;
