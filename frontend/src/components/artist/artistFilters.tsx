import React, { useMemo } from "react";
import {
  Box,
  Button,
  TextField,
  InputLabel,
  MenuItem,
  FormControl,
  Select,
  Autocomplete,
} from "@mui/material";
import { ArtistOption } from "../album/albumFilters";

interface ArtistFilterProps {
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  selectedLetter: string;
  setSelectedLetter: (value: string) => void;
  selectedArtist: string | null;
  setSelectedArtist: (value: string | null) => void;
  artistOptions: ArtistOption[];
  sortBy: string;
  setSortBy: (value: string) => void;
  sortOrder: "asc" | "desc";
  setSortOrder: (value: "asc" | "desc") => void;
}

const ARTIST_SORT_ALIASES: Record<string, string> = {
  "夢遊病者": "Sleepwalker"
};

const stripAccentsAndLigatures = (input: string): string =>
  input
    .replace(/Æ/g, "Ae")
    .replace(/æ/g, "ae")
    .replace(/Œ/g, "Oe")
    .replace(/œ/g, "oe")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

export const getSortBaseName = (name?: string | null): string => {
  const raw = (name || "").trim();
  const aliased = ARTIST_SORT_ALIASES[raw] ?? raw;
  return stripAccentsAndLigatures(aliased);
};

export const normalizeArtistName = (name?: string | null): string =>
  getSortBaseName(name)
    .trim()
    .replace(/^(the|a|an)\s+/i, "")
    .toLowerCase();

export const getNormalizedLetter = (name?: string | null): string => {
  const norm = normalizeArtistName(name);
  if (!norm) return "#";
  if (/^[0-9]/.test(norm)) return "#";
  return norm[0].toUpperCase();
};

const letters = ["#", ...Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i))];

const ArtistFilters: React.FC<ArtistFilterProps> = ({
  searchQuery,
  setSearchQuery,
  selectedLetter,
  setSelectedLetter,
  selectedArtist,
  setSelectedArtist,
  artistOptions,
  sortBy,
  setSortBy,
  sortOrder,
  setSortOrder,
}) => {
  const handleLetterChange = (value: string) => {
    setSelectedLetter(value);
    if (value) setSelectedArtist(null);
  };

  const handleArtistChange = (value: string | null) => {
    setSelectedArtist(value);
    if (value) setSelectedLetter("");
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedLetter("");
    setSelectedArtist(null);
    setSortBy("letter");
    setSortOrder("asc");
  };

  const filteredArtistOptions = useMemo(() => {
    const dir = sortOrder === "asc" ? 1 : -1;

    let list = artistOptions.map((o) => ({
      ...o,
      norm: normalizeArtistName(o.name),
      letterNorm: (o.letter || "#").toUpperCase(),
    }));

    // letter filter
    if (selectedLetter) {
      const target = selectedLetter.toUpperCase();
      list =
        target === "#"
          ? list.filter((a) => a.letterNorm === "#")
          : list.filter((a) => a.letterNorm === target);
    }

    const sorted = [...list].sort((a, b) => {
      if (sortBy === "albums") {
        const diff = (a.albums?.length ?? 0) - (b.albums?.length ?? 0);
        if (diff !== 0) return diff * dir;

        if (a.norm < b.norm) return -1 * dir;
        if (a.norm > b.norm) return 1 * dir;
        return 0;
      }

      if (sortBy === "letter") {
        if (a.letterNorm < b.letterNorm) return -1 * dir;
        if (a.letterNorm > b.letterNorm) return 1 * dir;

        if (a.norm < b.norm) return -1 * dir;
        if (a.norm > b.norm) return 1 * dir;
        return 0;
      }

      // sortBy === "artist"
      if (a.norm < b.norm) return -1 * dir;
      if (a.norm > b.norm) return 1 * dir;
      return 0;
    });

    return sorted;
  }, [artistOptions, selectedLetter, sortBy, sortOrder]);

  const selectedArtistOption =
    selectedArtist != null
      ? filteredArtistOptions.find((o) => o.name === selectedArtist) ?? null
      : null;

  return (
    <Box
      display="flex"
      flexWrap="wrap"
      gap={2}
      alignItems="center"
      justifyContent="space-between"
      mb={3}
    >
      <TextField
        label="Search artists"
        variant="outlined"
        size="small"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        sx={{ flex: 1, minWidth: "250px" }}
      />

      <FormControl size="small" sx={{ width: 120 }}>
        <InputLabel>Letter</InputLabel>
        <Select
          value={selectedLetter}
          label="Letter"
          onChange={(e) => handleLetterChange(e.target.value)}
        >
          <MenuItem value="">All</MenuItem>
          {letters.map((l) => (
            <MenuItem key={l} value={l}>
              {l}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <Autocomplete
        size="small"
        options={filteredArtistOptions}
        groupBy={(o) => (o.letter || "").toUpperCase()}
        getOptionLabel={(o) => o.name}
        value={selectedArtistOption}
        onChange={(_, newVal) => handleArtistChange(newVal?.name ?? null)}
        renderInput={(params) => (
          <TextField {...params} label="Artist" variant="outlined" />
        )}
        sx={{ width: 220 }}
      />

      <FormControl size="small" sx={{ width: 160 }}>
        <InputLabel>Sort By</InputLabel>
        <Select
          value={sortBy}
          label="Sort By"
          onChange={(e) => setSortBy(e.target.value)}
        >
          <MenuItem value="letter">Letter</MenuItem>
          <MenuItem value="artist">Artist</MenuItem>
          <MenuItem value="albumCount">Album Count</MenuItem>
        </Select>
      </FormControl>

      <FormControl size="small" sx={{ width: 120 }}>
        <InputLabel>Order</InputLabel>
        <Select
          value={sortOrder}
          label="Order"
          onChange={(e) => setSortOrder(e.target.value as "asc" | "desc")}
        >
          <MenuItem value="asc">Ascending</MenuItem>
          <MenuItem value="desc">Descending</MenuItem>
        </Select>
      </FormControl>

      <Button
        variant="outlined"
        color="primary"
        onClick={handleResetFilters}
        sx={{ ml: "auto", height: 40 }}
      >
        Reset Filters
      </Button>
    </Box>
  );
};

export default ArtistFilters;