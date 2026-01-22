import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  Button,
  TextField,
  Typography,
  CircularProgress,
  Stack,
  Snackbar,
  Alert,
  Grid,
} from "@mui/material";
import { LazyLoadImage } from "react-lazy-load-image-component";
import "react-lazy-load-image-component/src/effects/blur.css";
import api from "../api/apiClient";
import { Artist } from "../models/models";
import DeleteConfirmationDialog from "../components/deleteConfirmation";

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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const [toast, setToast] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error",
  });

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
      ? api.post("/artists/add-artist", {
          artistName: artist.artistName,
          letter: artist.letter,
        })
      : api.put(`/artists/update-artist/${artist.id}`, {
          artistName: artist.artistName,
          letter: artist.letter
        });

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
      .catch((err) => {
        setToast({
          open: true,
          message:
            err?.response?.data?.message || "Failed to save artist.",
          severity: "error",
        });
        setSaving(false);
      });
  };

  const handleDelete = () => {
    if (!artist) return;

    api
      .delete(`/artists/delete-artist/${artist.id}`)
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

  const handleToastClose = () =>
    setToast((prev) => ({ ...prev, open: false }));

  if (loading)
    return (
      <Box textAlign="center" mt={5}>
        <CircularProgress />
      </Box>
    );

  if (!artist) return null;

  return (
    <Box sx={{flexGrow: 1, px: 4, mt: 5}}>
      <Box sx={{maxWidth: 600, mx: "auto"}}>
        <Typography variant="h4" gutterBottom sx={{mb: 3}}>
          {isNew ? "Add New Artist" : "Edit Artist"}
        </Typography>

        <Stack spacing={2}>
          <TextField
            label="Artist Name"
            value={artist.artistName}
            onChange={(e) =>
              handleChange("artistName", e.target.value)
            }
            fullWidth
          />
          <TextField
            label="Letter"
            value={artist.letter}
            onChange={(e) =>
              handleChange("letter", e.target.value.toUpperCase())
            }
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
              : "Save Changes"
            }
          </Button>

          {!isNew && (
            <Button
              variant="outlined"
              color="error"
              onClick={() => setDeleteDialogOpen(true)}
            >
              Delete Artist
            </Button>
          )}

          <DeleteConfirmationDialog
            open={deleteDialogOpen}
            message={
              <>
                <Typography>
                  Are you sure you want to delete:
                </Typography>
                <Typography fontWeight="bold" mt={1}>
                  {artist.artistName}
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

          <Button
            variant="text"
            onClick={() => navigate("/artists")}
          >
            Cancel
          </Button>
        </Stack>
      </Box>

      {!isNew && (
        <Grid
          container
          spacing={3}
          justifyContent={artist.albums && artist.albums.length <= 1 ? "center" : "flex-start"}
          sx={{
            mt: 6,
            maxWidth: artist.albums && artist.albums.length <= 1 ? "33vw" : "66vw",
            mx: "auto",
          }}
        >
          <Grid
            item
            xs={12}
            sx={{textAlign: "left"}}
          >
            <Typography variant="h6">Albums</Typography>
          </Grid>

          {artist.albums?.length ? (
            artist.albums.map((a) => (
              <Grid
                item
                key={a.id}
                xs={12}
                md={artist.albums && artist.albums.length <= 1 ? 12 : 6}
              >
                <Card
                  sx={{
                    height: 125,
                    borderRadius: 1.5,
                    border: "1px solid",
                    borderColor: "divider",
                    transition: "transform 0.2s ease, box-shadow 0.2s ease",
                    "&:hover": {
                      transform: "translateY(-4px)",
                      boxShadow: 6,
                      borderColor: "primary.main",
                    },
                  }}
                >
                  <CardActionArea
                    onClick={() =>
                      navigate(`/albums/${a.id}`, {
                        state: { fromArtistPath: `/artists/${artist.id}` },
                      })
                    }
                  >
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 2,
                        px: 1.5,
                      }}
                    >
                      <Box
                        sx={{
                          width: 100,
                          height: 100,
                          overflow: "hidden",
                          flexShrink: 0,
                        }}
                      >
                        <LazyLoadImage
                          src={a.coverURL ?? ""}
                          alt={a.albumName ?? "Album cover"}
                          effect="blur"
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              "/images/default-cover.png";
                          }}
                          style={{
                            width: 100,
                            height: 100,
                            borderRadius: 8,
                            objectFit: "cover",
                            objectPosition: "center",
                          }}
                        />
                      </Box>

                      <CardContent
                        sx={{
                          height: 120,
                          flexGrow: 1,
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "center",
                          px: 0,
                        }}
                      >
                        <Stack spacing={0.75} mt={1}>
                          <Typography variant="subtitle1" fontWeight={600}>
                            {a.albumName}
                          </Typography>

                          <Typography variant="body2" color="text.secondary">
                            {a.releaseYear ?? ""}
                          </Typography>

                          {a.rating != null && (
                            <Typography variant="body2" color="text.secondary">
                              ★ {a.rating}
                            </Typography>
                          )}

                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{lineHeight: 1.4}}
                          >
                            {a.genre ?? ""}
                          </Typography>
                        </Stack>
                      </CardContent>
                    </Box>
                  </CardActionArea>
                </Card>
              </Grid>
            ))
          ) : (
            <Grid item xs={12}>
              <Typography color="text.secondary" textAlign="left">
                No albums for this artist.
              </Typography>
            </Grid>
          )}

          <Grid item xs={12} sx={{mt: 2, textAlign: "left"}}>
            <Button
              variant="contained"
              color="primary"
              onClick={() => navigate("/albums/new")}
            >
              + Add Album
            </Button>
          </Grid>
        </Grid>
      )}

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