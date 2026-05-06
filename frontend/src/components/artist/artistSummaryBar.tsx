import React from "react";
import { Box, Typography, Button, Stack } from "@mui/material";
import { useNavigate } from "react-router-dom";

interface ArtistSummaryBarProps {
  totalArtists: number;
}

const ArtistSummaryBar: React.FC<ArtistSummaryBarProps> = ({ totalArtists }) => {
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
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 1.25,
      }}
    >
      <Stack direction="row" spacing={2} alignItems="center" px={1}>
        <Typography variant="subtitle2" fontWeight={600} sx={{ fontSize: "0.85rem" }}>
          Total Artists: {totalArtists}
        </Typography>
      </Stack>

      <Button
        variant="contained"
        color="primary"
        onClick={() => navigate("/artists/new")}
        size="small"
        sx={{ minWidth: 124, fontSize: "0.75rem", mr: 0.5 }}
      >
        + New Artist
      </Button>
    </Box>
  );
};

export default ArtistSummaryBar;
