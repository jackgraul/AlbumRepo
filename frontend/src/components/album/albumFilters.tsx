import React, { useMemo } from "react";
import {
  Box,
  TextField,
  InputLabel,
  MenuItem,
  FormControl,
  Select,
  Autocomplete
} from "@mui/material";

interface AlbumFiltersProps {
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  selectedLetter: string;
  setSelectedLetter: (value: string) => void;
  selectedArtist: string | null;
  setSelectedArtist: (value: string | null) => void;
  artistOptions: string[];
  minRating: number | "";
  setMinRating: (value: number | "") => void;
  sortBy: string;
  setSortBy: (value: string) => void;
  sortOrder: "asc" | "desc";
  setSortOrder: (value: "asc" | "desc") => void;
}

const AlbumFilters: React.FC<AlbumFiltersProps> = ({
  searchQuery,
  setSearchQuery,
  selectedLetter,
  setSelectedLetter,
  selectedArtist,
  setSelectedArtist,
  artistOptions,
  minRating,
  setMinRating,
  sortBy,
  setSortBy,
  sortOrder,
  setSortOrder,
}) => {
  const letters = ["#", ...Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i))];

  const handleLetterChange = (value: string) => {
    setSelectedLetter(value);
    if (value) setSelectedArtist(null);
  };

  const handleArtistChange = (value: string | null) => {
    setSelectedArtist(value);
    if (value) setSelectedLetter("");
  };

  // 🔤 Filter the artist list dynamically based on selected letter
  const filteredArtistOptions = useMemo(() => {
    if (!selectedLetter) return artistOptions;

    if (selectedLetter === "#") {
      return artistOptions.filter((name) => /^[0-9]/.test(name));
    }

    return artistOptions.filter((name) =>
      name.toUpperCase().startsWith(selectedLetter.toUpperCase())
    );
  }, [artistOptions, selectedLetter]);

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
      {/* Search */}
      <TextField
        label="Search albums or artists"
        variant="outlined"
        size="small"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        sx={{ flex: 1, minWidth: "250px" }}
      />

      {/* Letter */}
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

      {/* Artist */}
      <Autocomplete
        size="small"
        options={filteredArtistOptions}
        value={selectedArtist}
        onChange={(_, newValue) => handleArtistChange(newValue)}
        renderInput={(params) => (
          <TextField {...params} label="Artist" variant="outlined" />
        )}
        sx={{ width: 220 }}
      />

      {/* Rating */}
      <FormControl size="small" sx={{ width: 150 }}>
        <InputLabel>Min Rating</InputLabel>
        <Select
          value={minRating}
          label="Min Rating"
          onChange={(e) => setMinRating(e.target.value as number | "")}
        >
          <MenuItem value="">All</MenuItem>
          {[1,2,3,4,5,6,7,8,9,10].map((r) => (
            <MenuItem key={r} value={r}>{r}</MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Sorting */}
      <FormControl size="small" sx={{ width: 160 }}>
        <InputLabel>Sort By</InputLabel>
        <Select
          value={sortBy}
          label="Sort By"
          onChange={(e) => setSortBy(e.target.value)}
        >
          <MenuItem value="year">Year</MenuItem>
          <MenuItem value="letter">Letter</MenuItem>
          <MenuItem value="artist">Artist</MenuItem>
          <MenuItem value="title">Title</MenuItem>
          <MenuItem value="genre">Genre</MenuItem>
          <MenuItem value="rating">Rating</MenuItem>
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
    </Box>
  );
};

export default AlbumFilters;