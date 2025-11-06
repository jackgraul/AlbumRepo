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

type SortOrder = "asc" | "desc";
type SortBy = "title" | "letter" | "artist" | "rating" | "year";

export interface ArtistOption {
  name: string;
  letter: string;
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
  sortBy: SortBy | string;
  setSortBy: (value: SortBy | string) => void;
  sortOrder: SortOrder;
  setSortOrder: (value: SortOrder) => void;
  artistOptions: ArtistOption[];
}

const AlbumFilters: React.FC<AlbumFiltersProps> = ({
  searchQuery,
  setSearchQuery,
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
  const letters = ["#", ...Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i))];

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
    setGenreQuery("");
    setYearQuery("");
    setMinRating("");
    setSortBy("letter");
    setSortOrder("asc");
  };

const filteredArtistOptions = useMemo(() => {
  if (!selectedLetter) return artistOptions;

  const L = selectedLetter.toUpperCase();
  return L === "#"
    ? artistOptions.filter((o) => o.letter === "#")
    : artistOptions.filter((o) => o.letter.toUpperCase() === L);
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
      <TextField
        label="Search albums or artists"
        variant="outlined"
        size="small"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        sx={{ flex: 1, minWidth: "200px" }}
      />

      <FormControl size="small" sx={{ width: 90 }}>
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
        sx={{ flex: 1, minWidth: "100px" }}
      />

      <FormControl size="small" sx={{ width: 125 }}>
        <InputLabel>Rating</InputLabel>
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

      <FormControl size="small" sx={{ width: 125 }}>
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
          onChange={(e) => setSortOrder(e.target.value as SortOrder)}
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