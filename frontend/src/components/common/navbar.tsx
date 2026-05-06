import React from "react";
import { AppBar, Toolbar, Typography, Button, Box } from "@mui/material";
import { Link } from "react-router-dom";

const Navbar: React.FC = () => {
  return (
    <AppBar position="sticky" color="primary">
      <Toolbar
        sx={{
          minHeight: { xs: 48, sm: 52 },
          gap: { xs: 0.75, sm: 1 },
          px: { xs: 1.25, sm: 1.75 },
        }}
      >
        <img
          src="/logo.png"
          alt="AlbumRepo Logo"
          style={{ width: 30, height: 30 }}
        />

        <Typography
          variant="h6"
          component={Link}
          to="/"
          sx={{
            color: "white",
            textDecoration: "none",
            fontSize: { xs: "0.92rem", sm: "1rem" },
            fontWeight: 600,
            "&:hover": { color: "#1976d2" },
            transition: "color 0.2s ease",
          }}
        >
          AlbumRepo
        </Typography>

        <Box sx={{ flexGrow: 1 }} />

        <Button
          color="inherit"
          component={Link}
          to="/"
          size="small"
          sx={{
            color: "inherit",
            fontSize: { xs: "0.82rem", sm: "0.88rem" },
            px: { xs: 0.75, sm: 1 },
            minWidth: "auto",
            "&:hover": { color: "primary.main" },
            mr: { xs: 0.25, sm: 0.5 },
          }}
        >
          Albums
        </Button>

        <Button
          color="inherit"
          component={Link}
          to="/artists"
          size="small"
          sx={{
            color: "inherit",
            fontSize: { xs: "0.82rem", sm: "0.88rem" },
            px: { xs: 0.75, sm: 1 },
            minWidth: "auto",
            "&:hover": { color: "primary.main" },
          }}
        >
          Artists
        </Button>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
