import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import AlbumList from "./components/album/albumList";
import ArtistList from "./components/artist/artistList";
import AlbumDetailsPage from "./pages/albumDetails";
import ArtistDetailsPage from "./pages/artistDetails";
import Navbar from "./components/nav/navbar";

const App: React.FC = () => {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Navigate to="/albums" replace />} />
        <Route path="/albums" element={<AlbumList />} />
        <Route path="/artists" element={<ArtistList />} />
        <Route path="/albums/:id" element={<AlbumDetailsPage />} />
        <Route path="/artists/:id" element={<ArtistDetailsPage />} />
      </Routes>
    </>
  );
};

export default App;