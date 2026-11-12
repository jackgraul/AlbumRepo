
import React from "react";
import {
  Box,
  Button,
  Container,
  Typography
} from "@mui/material";
import { useAuth } from "../context/authContext";

const SignInPage: React.FC = () => {
  const { login, user, loading } = useAuth();

  // If already authenticated, go to the albums page.
  if (!loading && user) {
    window.location.replace("/albums");
    return null;
  }

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "70vh",
          gap: 2
        }}
      >
        <Typography variant="h3">
          AlbumRepo
        </Typography>

        <Typography variant="body1">
          Sign in to manage your personal album collection.
        </Typography>

        {!loading && (
          <Button
            variant="contained"
            size="large"
            onClick={login}
          >
            Sign in with Google
          </Button>
        )}
      </Box>
    </Container>
  );
};

export default SignInPage;