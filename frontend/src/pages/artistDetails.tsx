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
} from "@mui/material";
import api from "../api/apiClient";
import { Artist } from "../models/models";

const ArtistDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = id === "new";

  const [artist, setArtist] = useState<Artist | null>(
    isNew
      ? {
          id: 0,
          artistName: "",
          letter: "",
        }
      : null
  );
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);

  const [toast, setToast] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error",
  });

  // ✅ Fetch artist if editing
  useEffect(() => {
    if (isNew) return;

    api
      .get<Artist>(`/artists/${id}`)
      .then((res) => {
        setArtist(res.data);
        setLoading(false);
      })
      .catch(() => {
        setToast({
          open: true,
          message: "Error fetching artist.",
          severity: "error",
        });
        setLoading(false);
      });
  }, [id, isNew]);

  const handleChange = (field: keyof Artist, value: any) => {
    setArtist((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const handleSave = () => {
    if (!artist) return;
    setSaving(true);

    const request = isNew
      ? api.post("/artists/add-artist", artist)
      : api.put(`/artists/update-artist/${artist.id}`, artist);

    request
      .then(() => {
        setToast({
          open: true,
          message: isNew
            ? "Artist created successfully!"
            : "Artist saved successfully!",
          severity: "success",
        });
        setSaving(false);
        setTimeout(() => navigate("/artists"), 1200);
      })
      .catch(() => {
        setToast({
          open: true,
          message: "Failed to save artist.",
          severity: "error",
        });
        setSaving(false);
      });
  };

  const handleDelete = () => {
    if (!artist) return;
    api
      .delete(`/artists/${artist.id}`)
      .then(() => {
        setToast({
          open: true,
          message: "Artist deleted successfully!",
          severity: "success",
        });
        setTimeout(() => navigate("/artists"), 1000);
      })
      .catch(() => {
        setToast({
          open: true,
          message: "Failed to delete artist.",
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

  if (!artist) return null;

  return (
    <Box sx={{ flexGrow: 1, display: "flex", justifyContent: "center", mt: 5 }}>
      <Grid
        container
        spacing={4}
        sx={{
          maxWidth: 600,
          alignItems: "flex-start",
          justifyContent: "center",
        }}
      >
        <Grid item xs={12}>
          <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
            {isNew ? "Add New Artist" : "Edit Artist"}
          </Typography>

          <Stack spacing={2}>
            <TextField
              label="Artist Name"
              value={artist.artistName}
              onChange={(e) => handleChange("artistName", e.target.value)}
              fullWidth
            />
            <TextField
              label="Letter"
              value={artist.letter}
              onChange={(e) => handleChange("letter", e.target.value)}
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
              {saving
                ? "Saving..."
                : isNew
                ? "Create Artist"
                : "Save Changes"}
            </Button>

            {!isNew && (
              <Button variant="outlined" color="error" onClick={handleDelete}>
                Delete Artist
              </Button>
            )}

            <Button variant="text" onClick={() => navigate("/artists")}>
              Cancel
            </Button>
          </Stack>
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

export default ArtistDetails;