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

  const [searchQuery, setSearchQuery] = useState("");
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
        console.error("❌ Error fetching artists:", err);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    let filtered = [...artists];

    // search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (a) => a.artistName && a.artistName.toLowerCase().includes(q)
      );
    }

    // letter filter (use same logic as options)
    if (selectedLetter) {
      const target = selectedLetter.toUpperCase();
      filtered =
        target === "#"
          ? filtered.filter((a) => getNormalizedLetter(a.artistName) === "#")
          : filtered.filter((a) => getNormalizedLetter(a.artistName) === target);
    }

    // specific artist
    if (selectedArtist) {
      const target = selectedArtist.toLowerCase();
      filtered = filtered.filter(
        (a) => a.artistName?.toLowerCase() === target
      );
    }

    const dir = sortOrder === "asc" ? 1 : -1;

    filtered.sort((a, b) => {
      const aName = a.artistName || "";
      const bName = b.artistName || "";

      const aNorm = normalizeArtistName(aName);
      const bNorm = normalizeArtistName(bName);

      const aLetter = getNormalizedLetter(a.artistName);
      const bLetter = getNormalizedLetter(b.artistName);

      if (sortBy === "letter") {
        if (aLetter < bLetter) return -1 * dir;
        if (aLetter > bLetter) return 1 * dir;

        if (aNorm < bNorm) return -1 * dir;
        if (aNorm > bNorm) return 1 * dir;

        return 0;
      }

      // sortBy === "artist"
      if (aNorm < bNorm) return -1 * dir;
      if (aNorm > bNorm) return 1 * dir;
      return 0;
    });

    setFilteredArtists(filtered);
  }, [artists, searchQuery, selectedLetter, selectedArtist, sortBy, sortOrder]);

  if (loading) {
    return (
      <Box textAlign="center" mt={5}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ padding: 3 }}>
      <ArtistFilters
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
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
        {filteredArtists.map((artist) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={artist.id}>
            <ArtistCard
              id={artist.id}
              letter={getNormalizedLetter(artist.artistName)}
              artistName={artist.artistName}
              albums={artist.albums ?? []}
            />
          </Grid>
        ))}
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