import React from "react";
import { Routes, Route, useLocation  } from "react-router-dom";
import AlbumList from "./pages/albumList";
import ArtistList from "./pages/artistList";
import AlbumDetailsPage from "./pages/albumDetails";
import ArtistDetailsPage from "./pages/artistDetails";
import GuidePage from "./pages/guide";
import SignInPage from "./pages/signIn";
import Navbar from "./components/common/navbar";
import Footer from "./components/common/footer";
import ProtectedRoute from "./components/common/protectedRoute";
import { Box } from "@mui/material";
import { AuthProvider } from "./context/authContext";

const App: React.FC = () => {
  const location = useLocation();
  const isSignInPage = location.pathname === "/";

  return (
    <AuthProvider>
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column"
        }}
      >
        {!isSignInPage && <Navbar />}

        <Box component="main" sx={{ flexGrow: 1 }}>
          <Routes>
            {/* Default route */}
            <Route path="/" element={<SignInPage />} />

            {/* Public routes */}
            <Route path="/guide" element={<GuidePage />} />

            {/* Protected routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/albums" element={<AlbumList />} />
              <Route path="/artists" element={<ArtistList />} />
              <Route path="/albums/new" element={<AlbumDetailsPage />} />
              <Route path="/artists/new" element={<ArtistDetailsPage />} />
              <Route path="/artists/:artistName/albums/new" element={<AlbumDetailsPage />} />
              <Route path="/albums/:artistName/:albumName" element={<AlbumDetailsPage />} />
              <Route path="/artists/:artistName" element={<ArtistDetailsPage />} />
            </Route>
          </Routes>
        </Box>

        <Footer />
      </Box>
    </AuthProvider>
  );
};

export default App;