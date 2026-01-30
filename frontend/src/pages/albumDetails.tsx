import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Box, Button, TextField, Autocomplete, Typography, CircularProgress, Stack, Snackbar, Alert, Grid, Card, CardMedia } from "@mui/material";
import api from "../api/apiClient";
import { Album } from "../models/models";
import DeleteConfirmationDialog from "../components/deleteConfirmation";

const AlbumDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  const normalizeSearch = (search: string) =>
    search
      .replace(/\+/g, "-")
      .toLowerCase();

  const preservedSearch =
    location.search || ((location.state as { fromSearch?: string } | null)?.fromSearch ?? "");

  const fromArtistPath =
    (location.state as { fromArtistPath?: string } | null)?.fromArtistPath ?? null;

  const isNew = id === "new";
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);

  type ArtistOption = { id: number; artistName: string; letter: string };

  const [artistOptions, setArtistOptions] = useState<ArtistOption[]>([]);
  const [artistLoading, setArtistLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    setArtistLoading(true);
    api.get<ArtistOption[]>("/artists")
      .then(res => {
        const opts = res.data.map(a => ({ id: a.id, artistName: a.artistName, letter: a.letter }));
        setArtistOptions(opts);
      })
      .finally(() => setArtistLoading(false));
  }, []);

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

  const selectedArtist = useMemo(
    () => artistOptions.find(o => o.id === album?.artist?.id) ?? null,
    [artistOptions, album?.artist?.id]
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

  const goBack = () => {
    if (fromArtistPath) {
      navigate(fromArtistPath, {replace: true});
    } else {
      navigate({ pathname: "/albums", search: normalizeSearch(preservedSearch) });
    }
  };

  const handleSave = () => {
    if (!album) return;
    setSaving(true);

    const request = isNew
      ? api.post("/albums/add-album", (({ id, ...rest }) => rest)(album as any))
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
        setTimeout(goBack, 1200);
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
        setTimeout(goBack, 1000);
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

            <Autocomplete
              options={artistOptions}
              value={selectedArtist}
              loading={artistLoading}
              getOptionLabel={(o) => o?.artistName ?? ""}
              isOptionEqualToValue={(o, v) => o.id === v.id}
              onChange={(_, newValue) => {
                handleChange(
                  "artist",
                  newValue
                    ? {
                        id: newValue.id,
                        artistName: newValue.artistName,
                        letter: newValue.letter,
                      }
                    : {
                        id: 0,
                        artistName: "",
                        letter: "",
                      }
                );
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Artist"
                  placeholder="Search artists…"
                />
              )}
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
              <Button variant="outlined" color="error" onClick={() => setDeleteDialogOpen(true)}>
                Delete Album
              </Button>
            )}

            <DeleteConfirmationDialog
              open={deleteDialogOpen}
              message={
                <>
                  <Typography>Are you sure you want to delete:</Typography>
                  <Typography fontWeight="bold" mt={1}>
                    {album?.artist?.artistName} - {album?.albumName}
                  </Typography>
                  <Typography mt={2} color="text.secondary">
                    This action cannot be undone.
                  </Typography>
                </>
              }
              onCancel={() => setDeleteDialogOpen(false)}
              onConfirm={() => {
                setDeleteDialogOpen(false);
                handleDelete();
              }}
            />

            <Button variant="text" onClick={goBack}>
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
                  (e.target as HTMLImageElement).src = "/default-cover.png";
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