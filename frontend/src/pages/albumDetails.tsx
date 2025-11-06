import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
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
  const location = useLocation();
  const navigate = useNavigate();

  const preservedSearch =
    location.search || ((location.state as { fromSearch?: string } | null)?.fromSearch ?? "");

  const isNew = id === "new";
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);

  const [album, setAlbum] = useState<Album | null>(
    isNew
      ? {
          id: 0,
          albumName: "",
          releaseYear: new Date().getFullYear(),
          genre: "",
          rating: null,
          coverURL: "",
          artist: { id: 0, letter: "", artistName: "" },
        }
      : null
  );

  const [toast, setToast] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error";
  }>({
    open: false,
    message: "",
    severity: "success",
  });

  const previewUrl = useMemo(() => {
    if (album?.coverURL) {
      return `http://localhost:7373/api/albums/proxy-cover?url=${encodeURIComponent(
        album.coverURL
      )}`;
    }
    return "/images/default-cover.png";
  }, [album?.coverURL]);

  useEffect(() => {
    if (isNew) return;

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
  }, [id, isNew]);

  const handleChange = (field: keyof Album, value: any) => {
    setAlbum((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const goBackToList = () =>
    navigate({ pathname: "/albums", search: preservedSearch});

  const handleSave = () => {
    if (!album) return;
    setSaving(true);

    const request = isNew
      ? api.post("/albums/add-album", album)
      : api.put(`/albums/update-album/${album.id}`, album);

    request
      .then(() => {
        setToast({
          open: true,
          message: isNew
            ? "Album created successfully!"
            : "Album saved successfully!",
          severity: "success",
        });
        setSaving(false);
        setTimeout(goBackToList, 1200);
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
      .delete(`/albums/${album.id}`)
      .then(() => {
        setToast({
          open: true,
          message: "Album deleted successfully!",
          severity: "success",
        });
        setTimeout(goBackToList, 1000);
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

  if (!album) return null;

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
        <Grid item xs={12} md={7}>
          <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
            {isNew ? "Add New Album" : "Edit Album"}
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
                handleChange(
                  "rating",
                  e.target.value ? Number(e.target.value) : null
                )
              }
              fullWidth
            />

            {!isNew && (
              <TextField
              label="Cover URL"
              value={album.coverURL ?? ""}
              onChange={(e) => handleChange("coverURL", e.target.value)}
              fullWidth
              />
            )}
          </Stack>

          <Stack direction="row" spacing={2} mt={4}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleSave}
              disabled={saving}
            >
              {saving
                ? "Saving..."
                : isNew
                ? "Create Album"
                : "Save Changes"}
            </Button>

            {!isNew && (
              <Button variant="outlined" color="error" onClick={handleDelete}>
                Delete Album
              </Button>
            )}

            <Button variant="text" onClick={goBackToList}>
              Cancel
            </Button>
          </Stack>
        </Grid>

        {!isNew && (
          <Grid item xs={12} md={5}>
            <Card
              sx={{
                width: "100%",
                maxWidth: 320,
                mx: "auto",
                borderRadius: 2,
                overflow: "hidden",
                boxShadow: 3,
                mt: { xs: 4, md: 15 },
              }}
            >
              <CardMedia
                component="img"
                height="320"
                image={previewUrl}
                alt={album.albumName}
                sx={{ objectFit: "cover" }}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/images/default-cover.png";
                }}
              />
            </Card>
          </Grid>
        )}
      </Grid>

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