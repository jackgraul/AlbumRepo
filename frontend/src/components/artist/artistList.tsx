import React, { useEffect, useState } from "react";
import { Artist } from "../../models/models";
import { Grid, Box, CircularProgress, Typography } from "@mui/material";
import api from "../../api/apiClient";
import ArtistCard from "../artist/artistCard";
import ArtistFilters from "../artist/artistFilters";
import ArtistSummaryBar from "./artistSummaryBar";
import { ArtistOption } from "../album/albumFilters";
import { normalizeArtistName, getNormalizedLetter } from "../artist/artistFilters";

const ArtistList: React.FC = () => {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [filteredArtists, setFilteredArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLetter, setSelectedLetter] = useState<string>("");
  const [selectedArtist, setSelectedArtist] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<string>("letter");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [artistOptions, setArtistOptions] = useState<ArtistOption[]>([]);

  useEffect(() => {
    api
      .get<Artist[]>("/artists")
      .then((res) => {
        setArtists(res.data);

        const byKey = new Map<string, ArtistOption>();

        res.data.forEach((a) => {
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

  useEffect(() => {
    let filtered = [...artists];

    if (selectedLetter) {
      const target = selectedLetter.toUpperCase();
      filtered =
        target === "#"
          ? filtered.filter((a) => getNormalizedLetter(a.artistName) === "#")
          : filtered.filter((a) => getNormalizedLetter(a.artistName) === target);
    }

    if (selectedArtist) {
      const target = selectedArtist.toLowerCase();
      filtered = filtered.filter(
        (a) => a.artistName?.toLowerCase() === target
      );
    }

    filtered.sort((a, b) => {
      const dir = sortOrder === "asc" ? 1 : -1;

      const aNorm = normalizeArtistName(a.artistName);
      const bNorm = normalizeArtistName(b.artistName);

      const aLetter = getNormalizedLetter(a.artistName);
      const bLetter = getNormalizedLetter(b.artistName);

      const aAlbums = a.albums ?? [];
      const bAlbums = b.albums ?? [];

      const aRated = aAlbums.filter((x) => x.rating != null);
      const bRated = bAlbums.filter((x) => x.rating != null);

      const aAvg = aRated.length
        ? aRated.reduce((sum, x) => sum + (x.rating ?? 0), 0) / aRated.length
        : null;

      const bAvg = bRated.length
        ? bRated.reduce((sum, x) => sum + (x.rating ?? 0), 0) / bRated.length
        : null;

      switch (sortBy) {
        case "albumCount": {
          const diff = aAlbums.length - bAlbums.length;
          if (diff !== 0) return diff * dir;
          return aNorm.localeCompare(bNorm) * dir;
        }

        case "avgRating": {
          if (aAvg == null && bAvg == null) return aNorm.localeCompare(bNorm) * dir;
          if (aAvg == null) return 1;
          if (bAvg == null) return -1;

          const diff = aAvg - bAvg;
          if (diff !== 0) return diff * dir;

          const ratedDiff = aRated.length - bRated.length;
          if (ratedDiff !== 0) return ratedDiff * -dir;

          return aNorm.localeCompare(bNorm) * dir;
        }

        case "letter": {
          if (aLetter < bLetter) return -1 * dir;
          if (aLetter > bLetter) return 1 * dir;
          return aNorm.localeCompare(bNorm) * dir;
        }

        case "artist":
        default:
          return aNorm.localeCompare(bNorm) * dir;
      }
    });

    setFilteredArtists(filtered);
  }, [artists, selectedLetter, selectedArtist, sortBy, sortOrder]);

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
    <Box sx={{ padding: 3 }}>
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

      <Grid container spacing={2}>
        {filteredArtists.map((artist) => {
          const albums = artist.albums ?? [];
          const avgRating =
            albums.filter(a => a.rating != null).length > 0
              ? (albums.reduce((sum, a) => sum + (a.rating ?? 0), 0) / albums.filter(a => a.rating != null).length).toFixed(2)
              : undefined;

          return (
            <Grid item xs={12} sm={6} md={4} lg={3} key={artist.id}>
              <ArtistCard
                id={artist.id}
                letter={getNormalizedLetter(artist.artistName)}
                artistName={artist.artistName}
                albums={albums}
                avgRating={avgRating}
              />
            </Grid>
          );
        })}
      </Grid>

      {filteredArtists.length === 0 && (
        <Typography align="center" mt={4}>
          No artists found for these filters.
        </Typography>
      )}
    </Box>
  );
};

export default ArtistList;