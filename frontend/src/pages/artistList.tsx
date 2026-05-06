import React, { useEffect, useState } from "react";
import { Artist } from "../models/models";
import { Box, CircularProgress, Typography } from "@mui/material";
import ArtistCard from "../components/artist/artistCard";
import ArtistFilters from "../components/artist/artistFilters";
import { ArtistOption } from "../components/album/albumFilters";
import { getNormalizedLetter, normalizeArtistName } from "../utils/artistName";
import ArtistSummaryBar from "../components/artist/artistSummaryBar";
import ArtistService from "../services/artistService";

const ArtistList: React.FC = () => {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLetter, setSelectedLetter] = useState<string>("");
  const [selectedArtist, setSelectedArtist] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<string>("letter");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [artistOptions, setArtistOptions] = useState<ArtistOption[]>([]);

  useEffect(() => {
    ArtistService.getAll()
      .then((data) => {
        setArtists(data);

        const byKey = new Map<string, ArtistOption>();

        data.forEach((a) => {
          const name = a.artistName?.trim();
          if (!name) return;

          const letter = getNormalizedLetter(a.artistName);
          const key = name.toLowerCase();

          if (!byKey.has(key)) {
            byKey.set(key, { name, letter });
          }
        });

        const options = Array.from(byKey.values()).sort((x, y) => {
          const lx = x.letter.toUpperCase();
          const ly = y.letter.toUpperCase();
          if (lx < ly) return -1;
          if (lx > ly) return 1;

          const nx = normalizeArtistName(x.name);
          const ny = normalizeArtistName(y.name);
          return nx.localeCompare(ny);
        });

        setArtistOptions(options);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching artists:", err);
        setLoading(false);
      });
  }, []);

  const enrichedArtists = React.useMemo(() => {
    return artists.map((a) => {
      const albums = a.albums ?? [];
      const rated = albums.filter(x => x.rating != null);

      const avgRating =
        rated.length > 0
          ? rated.reduce((sum, x) => sum + (x.rating ?? 0), 0) / rated.length
          : null;

      return {
        ...a,
        _normName: normalizeArtistName(a.artistName),
        _letter: getNormalizedLetter(a.artistName),
        _albumCount: albums.length,
        _ratedCount: rated.length,
        _avgRating: avgRating,
      };
    });
  }, [artists]);

  const filteredArtists = React.useMemo(() => {
    let filtered = [...enrichedArtists];

    if (selectedLetter) {
      const target = selectedLetter.toUpperCase();
      filtered = filtered.filter(a => a._letter === target);
    }

    if (selectedArtist) {
      const target = selectedArtist.toLowerCase();
      filtered = filtered.filter(
        a => a.artistName?.toLowerCase() === target
      );
    }

    const dir = sortOrder === "asc" ? 1 : -1;

    filtered.sort((a, b) => {
      switch (sortBy) {
        case "albumCount": {
          const diff = a._albumCount - b._albumCount;
          if (diff !== 0) return diff * dir;
          return a._normName.localeCompare(b._normName) * dir;
        }

        case "avgRating": {
          if (a._avgRating == null && b._avgRating == null)
            return a._normName.localeCompare(b._normName) * dir;
          if (a._avgRating == null) return 1;
          if (b._avgRating == null) return -1;

          const diff = a._avgRating - b._avgRating;
          if (diff !== 0) return diff * dir;

          const ratedDiff = a._ratedCount - b._ratedCount;
          if (ratedDiff !== 0) return ratedDiff * -dir;

          return a._normName.localeCompare(b._normName) * dir;
        }

        case "letter":
          if (a._letter < b._letter) return -1 * dir;
          if (a._letter > b._letter) return 1 * dir;
          return a._normName.localeCompare(b._normName) * dir;

        case "artist":
        default:
          return a._normName.localeCompare(b._normName) * dir;
      }
    });

    return filtered;
  }, [
    enrichedArtists,
    selectedLetter,
    selectedArtist,
    sortBy,
    sortOrder,
  ]);

  if (loading) {
    return (
      <Box textAlign="center" mt={5}>
        <CircularProgress />
        <Typography variant="body2" mt={2}>
          Loading artists...
        </Typography>
      </Box>
    );
  }

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
      <ArtistFilters
        selectedLetter={selectedLetter}
        setSelectedLetter={setSelectedLetter}
        selectedArtist={selectedArtist}
        setSelectedArtist={setSelectedArtist}
        artistOptions={artistOptions}
        sortBy={sortBy}
        setSortBy={setSortBy}
        sortOrder={sortOrder}
        setSortOrder={setSortOrder}
      />

      <ArtistSummaryBar totalArtists={filteredArtists.length} />

      {filteredArtists.length === 0 ? (
        <Typography align="center" mt={4}>
          No artists found for these filters.
        </Typography>
      ) : (
        <Box
          className="scroll"
          sx={{ flex: 1, overflowY: "auto", pt: 0.5 }}
        >
          <Box
            sx={{
              display: "grid",
              gap: 1.5,
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(auto-fill, minmax(250px, 1fr))",
                xl: "repeat(auto-fill, minmax(275px, 1fr))",
              },
              alignItems: "stretch",
            }}
          >
            {filteredArtists.map((artist) => {
              const albums = artist.albums ?? [];
              const avgRating =
                albums.filter(a => a.rating != null).length > 0
                  ? (albums.reduce((sum, a) => sum + (a.rating ?? 0), 0) / albums.filter(a => a.rating != null).length).toFixed(2)
                  : undefined;

              return (
                <Box key={artist.id}>
                  <ArtistCard
                    id={artist.id}
                    letter={getNormalizedLetter(artist.artistName)}
                    artistName={artist.artistName}
                    albums={albums}
                    avgRating={avgRating}
                  />
                </Box>
              );
            })}
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default ArtistList;
