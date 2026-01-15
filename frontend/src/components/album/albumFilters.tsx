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
  Menu,
} from "@mui/material";
import { Album } from "../../models/models";

export interface ArtistOption {
  name: string;
  letter: string;
  albums?: Album[];
}

interface AlbumFiltersProps {
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  selectedLetter: string;
  setSelectedLetter: (value: string) => void;
  selectedArtist: string | null;
  setSelectedArtist: (value: string | null) => void;
  genreQuery: string | null;
  setGenreQuery: (value: string | null) => void;
  yearQuery: string | null;
  setYearQuery: (value: string | null) => void;
  minRating: number | "";
  setMinRating: (value: number | "") => void;
  sortBy: string;
  setSortBy: (value: string) => void;
  sortOrder: string;
  setSortOrder: (value: string) => void;
  artistOptions: ArtistOption[];
}

const letters = ["#", ...Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i))];

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

const AlbumFilters: React.FC<AlbumFiltersProps> = ({
  selectedLetter,
  setSelectedLetter,
  selectedArtist,
  setSelectedArtist,
  genreQuery,
  setGenreQuery,
  yearQuery,
  setYearQuery,
  minRating,
  setMinRating,
  sortBy,
  setSortBy,
  sortOrder,
  setSortOrder,
  artistOptions,
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
    setSelectedLetter("");
    setSelectedArtist(null);
    setGenreQuery("");
    setYearQuery("");
    setMinRating("");
    setSortBy("letter");
    setSortOrder("asc");
  };

  const filteredArtistOptions = useMemo(() => {
    let base =
      !selectedLetter
        ? artistOptions
        : selectedLetter.toUpperCase() === "#"
        ? artistOptions.filter((o) => o.letter === "#")
        : artistOptions.filter(
            (o) => (o.letter || "").toUpperCase() === selectedLetter.toUpperCase()
          );

    return [...base].sort((a, b) => {
      const aLetter = (a.letter || "#").toUpperCase();
      const bLetter = (b.letter || "#").toUpperCase();

      if (aLetter < bLetter) return -1;
      if (aLetter > bLetter) return 1;

      const aName = normalizeArtistName(a.name);
      const bName = normalizeArtistName(b.name);

      if (aName < bName) return -1;
      if (aName > bName) return 1;

      return 0;
    });
  }, [artistOptions, selectedLetter]);

  const selectedArtistOption =
    selectedArtist
      ? artistOptions.find((o) => o.name === selectedArtist) ?? null
      : null;

  return (
    <Box
      display="flex"
      flexWrap="wrap"
      gap={2}
      alignItems="center"
      justifyContent="space-between"
      mb={3}
      mt={1}
    >
      <FormControl size="small" sx={{ width: 125 }}>
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
        sx={{ width: 400 }}
      />

      <TextField
        label="Search genre"
        variant="outlined"
        size="small"
        value={genreQuery ?? ""}
        onChange={(e) => setGenreQuery(e.target.value)}
        sx={{ flex: 1, minWidth: "100px" }}
      />

      <TextField
        label="Search year"
        variant="outlined"
        size="small"
        value={yearQuery ?? ""}
        onChange={(e) => setYearQuery(e.target.value)}
        sx={{ width: 150 }}
      />

      <FormControl size="small" sx={{ width: 125 }}>
        <InputLabel>Rating</InputLabel>
        <Select
          value={minRating}
          label="Min Rating"
          onChange={(e) => setMinRating(e.target.value as number | "")}
        >
          <MenuItem value="">All</MenuItem>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((r) => (
            <MenuItem key={r} value={r}>
              {r}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl size="small" sx={{ width: 200 }}>
        <InputLabel>Sort By</InputLabel>
        <Select
          value={sortBy}
          label="Sort By"
          onChange={(e) => setSortBy(e.target.value)}
        >
          <MenuItem value="artist">Artist</MenuItem>
          <MenuItem value="title">Title</MenuItem>
          <MenuItem value="year">Year</MenuItem>
          <MenuItem value="genre">Genre</MenuItem>
          <MenuItem value="rating">Rating</MenuItem>
        </Select>
      </FormControl>

      <FormControl size="small" sx={{ width: 200 }}>
        <InputLabel>Order</InputLabel>
        <Select
          value={sortOrder}
          label="Order"
          onChange={(e) => setSortOrder(e.target.value)}
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

export default AlbumFilters;