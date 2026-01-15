import React from "react";
import { Box, Typography, Button, Stack } from "@mui/material";
import { useNavigate } from "react-router-dom";

interface AlbumSummaryBarProps {
  totalAlbums: number;
  listenedAlbums?: number;
  uniqueArtists: number;
  wrongCoverAlbums?: number;
  avgRating?: number;
}

const AlbumSummaryBar: React.FC<AlbumSummaryBarProps> = ({
  totalAlbums,
  listenedAlbums,
  uniqueArtists,
  wrongCoverAlbums,
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
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
      }}
    >
      <Stack direction="row" spacing={3} alignItems="center">
        <Typography variant="subtitle1" fontWeight={600}>
          Total Albums: {totalAlbums}
        </Typography>
        <Typography variant="subtitle1" fontWeight={600}>
          Listened Albums: {listenedAlbums ?? 0}
        </Typography>
        <Typography variant="subtitle1" fontWeight={600}>
          Artists: {uniqueArtists}
        </Typography>
        <Typography variant="subtitle1" fontWeight={600}>
          Avg. Rating: {avgRating !== undefined ? avgRating.toFixed(2) : "N/A"}
        </Typography>
      </Stack>

      <Typography variant="subtitle1" fontWeight={600}>
        Wrong / No Cover: {wrongCoverAlbums ?? 0}
      </Typography>

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