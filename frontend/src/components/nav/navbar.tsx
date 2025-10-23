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
          style={{ color: "white", textDecoration: "none", flexGrow: 1 }}
        >
          AlbumRepo
        </Typography>
        <Button color="inherit" component={Link} to="/">
          Albums
        </Button>
        <Button color="inherit" component={Link} to="/artists">
          Artists
        </Button>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;