import React from "react";
import { Box, Typography } from "@mui/material";

const Footer: React.FC = () => {
  const year = new Date().getFullYear();

  return (
    <Box
      component="footer"
      sx={{
        mt: 4,
        py: 2,
        px: 3,
        backgroundColor: "background.paper",
        boxShadow: 2,
        textAlign: "center",
      }}
    >
      <Typography variant="body2" color="text.secondary">
        &copy; {year} AlbumRepo. All rights reserved.
      </Typography>
    </Box>
  );
};

export default Footer;