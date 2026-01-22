import React from "react";
import { AppBar, Toolbar, Typography, Button, Box } from "@mui/material";
import { Link } from "react-router-dom";

const Navbar: React.FC = () => {
  return (
    <AppBar position="sticky" color="primary">
      <Toolbar>
        <img
          src="/logo.png"
          alt="AlbumRepo Logo"
          style={{ width: 50, height: 50 }}
        />

        <Typography
          variant="h6"
          component={Link}
          to="/"
          sx={{
            color: "white",
            textDecoration: "none",
            "&:hover": { color: "#1976d2" },
            transition: "color 0.2s ease"
          }}
        >
          AlbumRepo
        </Typography>

        <Box sx={{ flexGrow: 1 }} />

        <Button 
          color="inherit" 
          component={Link} to="/" 
          sx={{color: "inherit", fontSize: "1.1rem", "&:hover": {color: "primary.main"}, mr: 2}}
        >
          Albums
        </Button>

        <Button 
          color="inherit" 
          component={Link} to="/artists" 
          sx={{color: "inherit", fontSize: "1.1rem", "&:hover": {color: "primary.main"}}}
        >
          Artists
        </Button>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;