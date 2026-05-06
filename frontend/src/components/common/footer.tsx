import React from "react";
import { Box, Typography } from "@mui/material";

const Footer: React.FC = () => {
  const year = new Date().getFullYear();

  return (
    <Box
      component="footer"
      sx={{
        py: 0.5,
        backgroundColor: "background.paper",
        boxShadow: 2,
        textAlign: "center",
      }}
    >
      <Typography variant="caption" color="text.secondary">
        &copy; {year} AlbumRepo. All rights reserved.
      </Typography>
    </Box>
  );
};

export default Footer;
