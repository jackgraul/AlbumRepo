import React from "react";
import { Box, Typography, Button, Stack } from "@mui/material";
import { useNavigate } from "react-router-dom";

interface AlbumSummaryBarProps {
  totalAlbums: number;
  uniqueArtists: number;
}

const AlbumSummaryBar: React.FC<AlbumSummaryBarProps> = ({
  totalAlbums,
  uniqueArtists,
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
      {/* Left side: totals */}
      <Stack direction="row" spacing={3} alignItems="center">
        <Typography variant="subtitle1" fontWeight={600}>
          Total Albums: {totalAlbums}
        </Typography>
        <Typography variant="subtitle1" fontWeight={600}>
          Artists: {uniqueArtists}
        </Typography>
      </Stack>

      {/* Right side: action button */}
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