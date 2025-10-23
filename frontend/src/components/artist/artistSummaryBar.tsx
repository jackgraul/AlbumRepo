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
      {/* Left side: total count */}
      <Stack direction="row" spacing={3} alignItems="center">
        <Typography variant="subtitle1" fontWeight={600}>
          Total Artists: {totalArtists}
        </Typography>
      </Stack>

      {/* Right side: new button */}
      <Button
        variant="contained"
        color="primary"
        onClick={() => navigate("/artists/new")}
        sx={{ mt: { xs: 1, sm: 0 } }}
      >
        + New Artist
      </Button>
    </Box>
  );
};

export default ArtistSummaryBar;