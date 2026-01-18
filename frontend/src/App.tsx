import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import AlbumList from "./pages/albumList";
import ArtistList from "./pages/artistList";
import AlbumDetailsPage from "./pages/albumDetails";
import ArtistDetailsPage from "./pages/artistDetails";
import Navbar from "./components/common/navbar";
import Footer from "./components/common/footer";
import { Box } from "@mui/material";

const App: React.FC = () => {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column"
      }}
    >
      <Navbar />

      <Box component="main" sx={{ flexGrow: 1 }}>
        <Routes>
          <Route path="/" element={<Navigate to="/albums" replace />} />
          <Route path="/albums" element={<AlbumList />} />
          <Route path="/artists" element={<ArtistList />} />
          <Route path="/albums/:id" element={<AlbumDetailsPage />} />
          <Route path="/artists/:id" element={<ArtistDetailsPage />} />
        </Routes>
      </Box>

      <Footer />
    </Box>
  );
};

export default App;