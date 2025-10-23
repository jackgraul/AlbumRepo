import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  TextField,
  Typography,
  CircularProgress,
  Stack,
  Snackbar,
  Alert,
  Grid,
  Card,
  CardMedia,
} from "@mui/material";
import api from "../api/apiClient";
import { Album } from "../models/models";

const AlbumDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [album, setAlbum] = useState<Album | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // ✅ Toast state
  const [toast, setToast] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error",
  });

  // ✅ Fetch album
  useEffect(() => {
    api
      .get<Album>(`/albums/${id}`)
      .then((res) => {
        setAlbum(res.data);
        setLoading(false);
      })
      .catch(() => {
        setToast({
          open: true,
          message: "Error fetching album.",
          severity: "error",
        });
        setLoading(false);
      });
  }, [id]);

  const handleChange = (field: keyof Album, value: any) => {
    setAlbum((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const handleSave = () => {
    if (!album) return;
    setSaving(true);
    api
      .put(`/albums/update-album/${album.id}`, album)
      .then(() => {
        setToast({
          open: true,
          message: "Album saved successfully!",
          severity: "success",
        });
        setSaving(false);
        setTimeout(() => navigate("/"), 1200);
      })
      .catch(() => {
        setToast({
          open: true,
          message: "Failed to save album.",
          severity: "error",
        });
        setSaving(false);
      });
  };

  const handleDelete = () => {
    if (!album) return;
    api
      .delete(`/albums/delete-album/${album.id}`)
      .then(() => {
        setToast({
          open: true,
          message: "Album deleted successfully!",
          severity: "success",
        });
        setTimeout(() => navigate("/"), 1000);
      })
      .catch(() => {
        setToast({
          open: true,
          message: "Failed to delete album.",
          severity: "error",
        });
      });
  };

  const handleToastClose = () => setToast((prev) => ({ ...prev, open: false }));

  if (loading)
    return (
      <Box textAlign="center" mt={5}>
        <CircularProgress />
      </Box>
    );

  if (!album) return <Typography>Album not found.</Typography>;

  const proxiedUrl = album.coverURL
    ? `http://localhost:7373/api/albums/proxy-cover?url=${encodeURIComponent(
        album.coverURL
      )}`
    : "/images/default-cover.png";

  return (
    <Box sx={{ flexGrow: 1, display: "flex", justifyContent: "center", mt: 5 }}>
      <Grid
        container
        spacing={4}
        sx={{
          maxWidth: 900,
          alignItems: "flex-start",
          justifyContent: "center",
        }}
      >
        {/* Left column: Form */}
        <Grid item xs={12} md={7}>
          <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
            Edit Album
          </Typography>

          <Stack spacing={2}>
            <TextField
              label="Album Name"
              value={album.albumName}
              onChange={(e) => handleChange("albumName", e.target.value)}
              fullWidth
            />
            <TextField
              label="Artist"
              value={album.artist?.artistName ?? ""}
              onChange={(e) =>
                handleChange("artist", {
                  ...album.artist,
                  artistName: e.target.value,
                })
              }
              fullWidth
            />
            <TextField
              label="Release Year"
              type="number"
              value={album.releaseYear ?? ""}
              onChange={(e) => handleChange("releaseYear", Number(e.target.value))}
              fullWidth
            />
            <TextField
              label="Genre"
              value={album.genre ?? ""}
              onChange={(e) => handleChange("genre", e.target.value)}
              fullWidth
            />
            <TextField
              label="Rating"
              type="number"
              value={album.rating ?? ""}
              onChange={(e) =>
                handleChange("rating", e.target.value ? Number(e.target.value) : null)
              }
              fullWidth
            />
            <TextField
              label="Cover URL"
              value={album.coverURL ?? ""}
              onChange={(e) => handleChange("coverURL", e.target.value)}
              fullWidth
            />
          </Stack>

          <Stack direction="row" spacing={2} mt={4}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? "Saving..." : "Save Changes"}
            </Button>
            <Button variant="outlined" color="error" onClick={handleDelete}>
              Delete Album
            </Button>
            <Button variant="text" onClick={() => navigate("/")}>
              Cancel
            </Button>
          </Stack>
        </Grid>

        {/* Right column: Cover image */}
        <Grid item xs={12} md={5}>
          <Card
            sx={{
              width: "100%",
              maxWidth: 320,
              mx: "auto",
              borderRadius: 2,
              overflow: "hidden",
              boxShadow: 3,
              marginTop: 15
            }}
          >
            <CardMedia
              component="img"
              height="320"
              image={proxiedUrl}
              alt={album.albumName}
              sx={{ objectFit: "cover" }}
            />
          </Card>
        </Grid>
      </Grid>

      {/* ✅ Snackbar Toast */}
      <Snackbar
        open={toast.open}
        autoHideDuration={2500}
        onClose={handleToastClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={handleToastClose}
          severity={toast.severity}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AlbumDetails;