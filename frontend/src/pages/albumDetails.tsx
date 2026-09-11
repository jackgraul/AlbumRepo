import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Box, Button, TextField, Autocomplete, Typography, CircularProgress, Stack, Snackbar, Alert, Grid, Card, CardMedia } from "@mui/material";
import { Album } from "../models/models";
import DeleteConfirmationDialog from "../components/deleteConfirmation";
import AlbumService from "../services/albumService";
import ArtistService from "../services/artistService";
import { toSlug } from "../utils/slug";

type AlbumLocationState = {
  fromSearch?: string;
  fromArtistPath?: string;
};

const AlbumDetails: React.FC = () => {
  const { artistName, albumName } = useParams<{
    artistName?: string;
    albumName?: string;
  }>();
  const location = useLocation();
  const navigate = useNavigate();
  const locationState = location.state as AlbumLocationState | null;
  const hasFromSearchState =
    !!locationState &&
    Object.prototype.hasOwnProperty.call(locationState, "fromSearch");
  const routeArtistSlug = toSlug(artistName);

  const preservedSearch = hasFromSearchState
    ? locationState.fromSearch ?? ""
    : location.search;

  const fromArtistPath = locationState?.fromArtistPath ?? null;

  const isNew =
    location.pathname === "/albums/new" ||
    location.pathname.endsWith("/albums/new");
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);

  type ArtistOption = { id: number; artistName: string; letter: string };

  const [artistOptions, setArtistOptions] = useState<ArtistOption[]>([]);
  const [artistLoading, setArtistLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    setArtistLoading(true);
    ArtistService.getAll()
      .then((artists) => {
        const opts = artists.map((a) => ({
          id: a.id,
          artistName: a.artistName,
          letter: a.letter,
        }));
        setArtistOptions(opts);

        if (isNew && routeArtistSlug) {
          const matchingArtist = opts.find(
            (artist) => toSlug(artist.artistName) === routeArtistSlug
          );

          if (matchingArtist) {
            setAlbum((prev) =>
              prev && prev.artist.id === 0
                ? { ...prev, artist: matchingArtist }
                : prev
            );
          }
        }
      })
      .finally(() => setArtistLoading(false));
  }, [isNew, routeArtistSlug]);

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

  const previewUrl = useMemo(
    () => album?.coverURL?.trim() || "/default-cover.png",
    [album?.coverURL]
  );

  useEffect(() => {
    if (isNew) return;

    const artistSlug = toSlug(artistName);
    const albumSlug = toSlug(albumName);

    if (!artistSlug || !albumSlug) {
      setToast({
        open: true,
        message: "Album not found.",
        severity: "error",
      });
      setLoading(false);
      return;
    }

    AlbumService.getAll()
      .then((albums) => {
        const data = albums.find(
          (a) =>
            toSlug(a.artist?.artistName) === artistSlug &&
            toSlug(a.albumName) === albumSlug
        );

        if (!data) {
          throw new Error("Album not found");
        }

        setAlbum(data);
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
  }, [artistName, albumName, isNew]);

  const handleChange = (field: keyof Album, value: any) => {
    setAlbum((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const goBack = () => {
    if (fromArtistPath) {
      navigate(fromArtistPath, { replace: true });
    } else if (isNew && routeArtistSlug) {
      navigate(`/artists/${routeArtistSlug}`, { replace: true });
    } else {
      const params = new URLSearchParams(preservedSearch);

      if (!hasFromSearchState && routeArtistSlug && !params.has("artist")) {
        params.set("artist", routeArtistSlug);
      }

      const nextSearch = params.toString();
      navigate({
        pathname: "/albums",
        search: nextSearch ? `?${nextSearch}` : "",
      });
    }
  };

  const isValid = async () => {
    if (!album) return false;

    if (!album.albumName.trim()) {
      setToast({ open: true, message: "Album name is required.", severity: "error" });
      return false;
    }

    if (!album.artist || album.artist.id === 0) {
      setToast({ open: true, message: "Artist must be selected.", severity: "error" });
      return false;
    }

    const existingAlbums = await AlbumService.getAll();
    const duplicate = existingAlbums.some(
      (a) =>
        a.artist?.id === album.artist.id &&
        a.albumName.trim().toLowerCase() === album.albumName.trim().toLowerCase() &&
        a.id !== album.id
    );

    if (duplicate) {
      setToast({
        open: true,
        message: "This artist already has an album with that name.",
        severity: "error",
      });
      return;
    }

    return true;
  };

  const handleSave = async () => {
    if (!album) return;
    if (!(await isValid())) return;

    setSaving(true);

    const request = isNew
      ? AlbumService.create(album)
      : AlbumService.update(album.id, album);

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
    
    AlbumService
      .delete(album.id)
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
    <Box
      sx={{
        flexGrow: 1,
        display: "flex",
        justifyContent: "center",
        px: { xs: 2, md: 3 },
        mt: { xs: 2.5, md: 3 },
      }}
    >
      <Grid
        container
        spacing={3}
        sx={{
          maxWidth: 780,
          alignItems: "flex-start",
          justifyContent: "center",
        }}
      >
        <Grid item xs={12} md={7}>
          <Typography variant="h5" gutterBottom sx={{ mt: 5, mb: 2.25, fontWeight: 600 }}>
            {isNew ? "Add New Album" : "Edit Album"}
          </Typography>

          <Stack spacing={1.5}>
            <TextField
              label="Album Name"
              value={album.albumName}
              onChange={(e) => handleChange("albumName", e.target.value)}
              fullWidth
              size="small"
            />

            <Autocomplete
              size="small"
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
              size="small"
            />

            <TextField
              label="Genre"
              value={album.genre ?? ""}
              onChange={(e) => handleChange("genre", e.target.value)}
              fullWidth
              size="small"
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
              size="small"
            />

            {!isNew && (
              <TextField
                label="Cover URL"
                value={album.coverURL ?? ""}
                onChange={(e) => handleChange("coverURL", e.target.value)}
                fullWidth
                size="small"
              />
            )}
          </Stack>

          <Stack direction="row" spacing={1.5} mt={3} flexWrap="wrap" useFlexGap>
            <Button
              variant="contained"
              color="primary"
              onClick={handleSave}
              disabled={saving}
              size="medium"
            >
              {saving
                ? "Saving..."
                : isNew
                ? "Create Album"
                : "Save Changes"}
            </Button>

            {!isNew && (
              <Button
                variant="outlined"
                color="error"
                onClick={() => setDeleteDialogOpen(true)}
                size="medium"
              >
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

            <Button variant="text" onClick={goBack} size="medium">
              Cancel
            </Button>
          </Stack>
        </Grid>

        {!isNew && (
          <Grid item xs={12} md={5}>
            <Card
              sx={{
                width: "100%",
                maxWidth: 272,
                mx: "auto",
                borderRadius: 2,
                overflow: "hidden",
                boxShadow: 3,
                mt: { xs: 3, md: 10 },
              }}
            >
              <CardMedia
                component="img"
                height="272"
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