import React, { useEffect, useState } from "react";
import { Artist } from "../../models/models"
import { Grid, Box, CircularProgress, Typography } from "@mui/material";
import api from "../../api/apiClient";
import ArtistCard from "../artist/artistCard";
import ArtistFilters from "../artist/artistFilters";
import ArtistSummaryBar from "./artistSummaryBar";

const ArtistList: React.FC = () => {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [filteredArtists, setFilteredArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLetter, setSelectedLetter] = useState<string>("");
  const [selectedArtist, setSelectedArtist] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<string>("letter");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [artistOptions, setArtistOptions] = useState<string[]>([]);

useEffect(() => {
  api.get<Artist[]>("/artists")
    .then((res) => {
      console.log("Artists fetched:", res.data);
      setArtists(res.data);
      setLoading(false);

      const names = Array.from(
        new Set(res.data.map((a) => a.artistName).filter(Boolean))
      ).sort((a, b) => a.localeCompare(b));

      setArtistOptions(names);
    })
    .catch((err) => {
      console.error("❌ Error fetching artists:", err);
      setLoading(false);
    });
}, []);

  useEffect(() => {
    let filtered = [...artists];

    if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        filtered = filtered.filter(
        (a) =>
            a.artistName &&
            a.artistName.toLowerCase().includes(q)
        );
    }

    if (selectedLetter) {
      filtered = filtered.filter((a) => {
        const name = a.artistName ?? "";
        if (selectedLetter === "#") return /^[0-9]/.test(name);
        return name.toUpperCase().startsWith(selectedLetter.toUpperCase());
      });
    }

    if (selectedArtist) {
      filtered = filtered.filter(
        (a) => a.artistName.toLowerCase() === selectedArtist.toLowerCase()
      );
    }

    filtered.sort((a, b) => {
      let valA: any;
      let valB: any;

      switch (sortBy) {
        case "letter":
          valA = a.letter;
          valB = b.letter;
          break;
        case "artist":
          valA = a.artistName.toLowerCase();
          valB = b.artistName.toLowerCase();
          break;
        default:
          valA = a.artistName.toLowerCase();
          valB = b.artistName.toLowerCase();
      }

      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    setFilteredArtists(filtered);
  }, [
    artists,
    searchQuery,
    selectedLetter,
    selectedArtist,
    sortBy,
    sortOrder,
  ]);

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
              letter={artist.letter}
              artistName={artist.artistName}
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