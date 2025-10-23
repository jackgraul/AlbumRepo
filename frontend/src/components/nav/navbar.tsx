// src/components/Navbar.tsx
import React from "react";
import { AppBar, Toolbar, Typography, Button } from "@mui/material";
import { Link } from "react-router-dom";

const Navbar: React.FC = () => {
  return (
    <AppBar position="sticky" color="primary">
      <Toolbar>
        <Typography
          variant="h6"
          component={Link}
          to="/"
          sx={{
            color: "white",
            textDecoration: "none",
            flexGrow: 1,
            "&:hover": { color: "#1976d2" },
            transition: "color 0.2s ease",
          }}
        >
          AlbumRepo
        </Typography>
        <Button color="inherit" component={Link} to="/" sx={{color: "inherit", "&:hover": {color: "primary.main"}}}>
          Albums
        </Button>
        <Button color="inherit" component={Link} to="/artists" sx={{color: "inherit", "&:hover": {color: "primary.main"}}}>
          Artists
        </Button>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;