import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
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
import { Artist } from "../models/models";
import DeleteConfirmationDialog from "../components/deleteConfirmation";
import MarqueeOnOverflow from "../components/marqueeOverflow";
import ArtistService from "../services/artistService";
import {
  getAlbumPath,
  getArtistAlbumCreatePath,
  getArtistPath,
  toSlug,
} from "../utils/slug";

const ArtistDetails: React.FC = () => {
  const { artistName } = useParams<{ artistName?: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const isNew = location.pathname === "/artists/new";

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

    const artistSlug = toSlug(artistName);

    if (!artistSlug) {
      setToast({
        open: true,
        message: "Artist not found.",
        severity: "error",
      });
      setLoading(false);
      return;
    }

    ArtistService.getAll()
      .then((artists) => {
        const data = artists.find((a) => toSlug(a.artistName) === artistSlug);

        if (!data) {
          throw new Error("Artist not found");
        }

        setArtist(data);
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
  }, [artistName, isNew]);

  const handleChange = (field: keyof Artist, value: any) => {
    setArtist((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const isValid = async () => {
    if (!artist) return false;

    if (!artist.artistName.trim()) {
      setToast({ open: true, message: "Artist name is required.", severity: "error" });
      return false;
    }

    if (!artist.letter.trim()) {
      setToast({ open: true, message: "Letter is required.", severity: "error" });
      return false;
    }

    const existingArtists = await ArtistService.getAll();
    const duplicate = existingArtists.some(
      (a) =>
        a.artistName.trim().toLowerCase() === artist.artistName.trim().toLowerCase() &&
        a.id !== artist.id
    );

    if (duplicate) {
      setToast({
        open: true,
        message: "An artist with this name already exists.",
        severity: "error",
      });
      return;
    }

    return true;
  };

  const handleSave = async () => {
    if (!artist) return;
    if (!(await isValid())) return;

    setSaving(true);

    const request = isNew
      ? ArtistService.create({
          artistName: artist.artistName,
          letter: artist.letter,
        })
      : ArtistService.update(artist.id, {
          artistName: artist.artistName,
          letter: artist.letter,
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

    ArtistService
      .delete(artist.id)
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
    <Box
      sx={{
        height: "87vh",
        display: "flex",
        flexDirection: "column",
        px: { xs: 1.5, sm: 2 },
        pt: { xs: 1, sm: 1.25 },
        pb: { xs: 1.5, sm: 2 },
      }}
    >
      <Box className="scroll" sx={{ flex: 1, overflowY: "auto" }}>
        <Box sx={{ maxWidth: 520, mx: "auto" }}>
          <Typography variant="h5" gutterBottom sx={{ mt: 5, mb: 2.25, fontWeight: 600 }}>
            {isNew ? "Add New Artist" : "Edit Artist"}
          </Typography>

          <Stack spacing={1.5}>
            <TextField
              label="Artist Name"
              value={artist.artistName}
              onChange={(e) =>
                handleChange("artistName", e.target.value)
              }
              fullWidth
              size="small"
            />
            <TextField
              label="Letter"
              value={artist.letter}
              onChange={(e) =>
                handleChange("letter", e.target.value.toUpperCase())
              }
              fullWidth
              size="small"
            />
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
                ? "Create Artist"
                : "Save Changes"
              }
            </Button>

            {!isNew && (
              <Button
                variant="outlined"
                color="error"
                onClick={() => setDeleteDialogOpen(true)}
                size="medium"
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
              size="medium"
            >
              Cancel
            </Button>
          </Stack>
        </Box>

        {!isNew && (
          <Grid
            container
            spacing={2}
            justifyContent={artist.albums && artist.albums.length <= 1 ? "center" : "flex-start"}
            sx={{
              mt: 4,
              width: "100%",
              maxWidth: artist.albums && artist.albums.length <= 1 ? 320 : 760,
              mx: "auto",
              pt: 0.5,
            }}
          >
            <Grid
              item
              xs={12}
              sx={{ textAlign: "left" }}
            >
              <Typography variant="subtitle1" fontWeight={600}>
                Albums
              </Typography>
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
                    className="artist-detail-album-card"
                    sx={{
                      height: 116,
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
                      sx={{ height: "100%" }}
                      onClick={() =>
                        navigate(getAlbumPath(artist.artistName, a.albumName), {
                          state: { fromArtistPath: getArtistPath(artist.artistName) },
                        })
                      }
                    >
                      <Box
                        sx={{
                          display: "flex",
                          height: "100%",
                          alignItems: "center",
                          gap: 1.5,
                          px: 1.25,
                          py: 1.25,
                        }}
                      >
                        <Box
                          sx={{
                            width: 88,
                            height: 88,
                            overflow: "hidden",
                            flexShrink: 0,
                          }}
                        >
                          <LazyLoadImage
                            src={a.coverURL?.trim() || "/default-cover.png"}
                            alt={a.albumName ?? "Album cover"}
                            effect="blur"
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                "/default-cover.png";
                            }}
                            style={{
                              width: 88,
                              height: 88,
                              borderRadius: 6,
                              objectFit: "cover",
                              objectPosition: "center",
                            }}
                          />
                        </Box>

                        <CardContent
                          sx={{
                            height: 88,
                            flexGrow: 1,
                            display: "flex",
                            alignItems: "center",
                            px: 0,
                            py: 0,
                            minWidth: 0,
                            "&:last-child": {
                              pb: 0,
                            },
                          }}
                        >
                          <Stack spacing={0.35} sx={{ width: "100%" }}>
                            <MarqueeOnOverflow
                              variant="subtitle2"
                              fontWeight={600}
                              duration={8}
                              sx={{ lineHeight: 1.25 }}
                            >
                              {a.albumName}
                            </MarqueeOnOverflow>

                            <Typography variant="body2" color="text.secondary">
                              {a.releaseYear ?? ""}
                            </Typography>

                            <MarqueeOnOverflow
                              variant="body2"
                              color="text.secondary"
                              duration={8}
                              sx={{ lineHeight: 1.25 }}
                            >
                              {a.genre ?? ""}
                            </MarqueeOnOverflow>

                            {a.rating != null && (
                              <Typography variant="body2" color="text.secondary">
                                {"★"} {a.rating}
                              </Typography>
                            )}
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

            <Grid item xs={12} sx={{ mt: 2, textAlign: "left" }}>
              <Button
                variant="contained"
                color="primary"
                onClick={() =>
                  navigate(getArtistAlbumCreatePath(artist.artistName), {
                    state: { fromArtistPath: getArtistPath(artist.artistName) },
                  })
                }
                size="medium"
              >
                + Add Album
              </Button>
            </Grid>
          </Grid>
        )}
      </Box>

      <style>
        {`
          @keyframes marquee {
            0% { transform: translateX(0); }
            100% { transform: translateX(-100%); }
          }

          .artist-detail-album-card:hover .marquee-enabled {
            animation: marquee var(--marquee-duration) linear infinite;
          }
        `}
      </style>

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
