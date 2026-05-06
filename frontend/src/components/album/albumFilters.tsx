import React, { useMemo } from "react";
import { Box, Button, TextField, InputLabel, MenuItem, FormControl, Select, Autocomplete } from "@mui/material";
import { Album } from "../../models/models";
import { normalizeArtistName } from "../../utils/artistName";

export interface ArtistOption {
  name: string;
  letter: string;
  albums?: Album[];
}

interface AlbumFiltersProps {
  selectedLetter: string;
  setSelectedLetter: (value: string) => void;
  selectedArtist: string | null;
  setSelectedArtist: (value: string | null) => void;
  genreQuery: string | null;
  setGenreQuery: (value: string | null) => void;
  yearQuery: string | null;
  setYearQuery: (value: string | null) => void;
  minRating: number | string;
  setMinRating: (value: number | string) => void;
  sortBy: string;
  setSortBy: (value: string) => void;
  sortOrder: string;
  setSortOrder: (value: string) => void;
  artistOptions: ArtistOption[];
}

const letters = ["#", ...Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i))];
const compactSelectMenuProps = {
  PaperProps: {
    sx: {
      "& .MuiMenuItem-root": {
        fontSize: "0.7rem",
        minHeight: 28,
        py: 0.3,
      },
    },
  },
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
  const toSlug = (v: string) =>
    v.trim().toLowerCase().replace(/\s+/g, "-");

  const handleLetterChange = (value: string) => {
    setSelectedLetter(value);
    if (value) setSelectedArtist(null);
  };

  const handleArtistChange = (value: string | null) => {
    setSelectedArtist(value ? toSlug(value) : null);
  };

  const handleResetFilters = () => {
    setSelectedLetter("");
    setSelectedArtist(null);
    setGenreQuery("");
    setYearQuery("");
    setMinRating("");
    setSortBy("artist");
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
      ? artistOptions.find((o) => toSlug(o.name) === selectedArtist) ?? null
      : null;

  return (
    <Box
      sx={{
        display: "flex",
        flexWrap: "wrap",
        gap: 1.25,
        alignItems: "center",
        justifyContent: { xs: "flex-start", lg: "space-between" },
        mb: 1.75,
        mt: 0.25,
        "& .MuiInputLabel-root": {
          fontSize: "0.82rem",
        },
        "& .MuiInputBase-input": {
          fontSize: "0.82rem",
        },
        "& .MuiSelect-select": {
          fontSize: "0.82rem",
        },
        "& .MuiAutocomplete-input": {
          fontSize: "0.82rem !important",
        },
      }}
    >
      <FormControl
        size="small"
        sx={{
          width: { xs: "100%", sm: 104 },
          flex: { lg: "0 0 104px" },
        }}
      >
        <InputLabel>Letter</InputLabel>
        <Select
          value={selectedLetter}
          label="Letter"
          onChange={(e) => handleLetterChange(e.target.value)}
          MenuProps={compactSelectMenuProps}
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
        ListboxProps={{
          sx: {
            py: 0.25,
          },
        }}
        renderOption={(props, option) => (
          <Box
            component="li"
            {...props}
            sx={{
              fontSize: "0.7rem",
              minHeight: 28,
              py: 0.3,
            }}
          >
            {option.name}
          </Box>
        )}
        renderGroup={(params) => (
          <li key={params.key}>
            <Box
              sx={{
                px: 1.5,
                py: 0.4,
                fontSize: "0.65rem",
                fontWeight: 600,
                lineHeight: 1.2,
                color: "primary.main",
              }}
            >
              {params.group}
            </Box>
            <Box component="ul" sx={{ p: 0, m: 0 }}>
              {params.children}
            </Box>
          </li>
        )}
        renderInput={(params) => (
          <TextField {...params} label="Artist" variant="outlined" />
        )}
        sx={{
          width: { xs: "100%", sm: 220, md: 240 },
          flex: { lg: "1 1 220px" },
        }}
      />

      <TextField
        label="Genre"
        variant="outlined"
        size="small"
        value={genreQuery ?? ""}
        onChange={(e) => setGenreQuery(e.target.value)}
        sx={{
          flex: { xs: "1 1 100%", lg: "1 1 180px" },
          minWidth: { xs: "100%", sm: 140 },
        }}
      />

      <TextField
        label="Year"
        variant="outlined"
        size="small"
        value={yearQuery ?? ""}
        onChange={(e) => setYearQuery(e.target.value)}
        sx={{
          width: { xs: "calc(50% - 5px)", sm: 96 },
          flex: { lg: "0 0 96px" },
        }}
      />

      <FormControl
        size="small"
        sx={{
          width: { xs: "calc(50% - 5px)", sm: 110 },
          flex: { lg: "0 0 110px" },
        }}
      >
        <InputLabel>Rating</InputLabel>
        <Select
          value={minRating}
          label="Min Rating"
          onChange={(e) => setMinRating(e.target.value as number | string)}
          MenuProps={compactSelectMenuProps}
        >
          <MenuItem value="">All</MenuItem>
          <MenuItem value="null">No Rating</MenuItem>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((r) => (
            <MenuItem key={r} value={r}>
              {r}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl
        size="small"
        sx={{
          width: { xs: "calc(50% - 5px)", sm: 148 },
          flex: { lg: "1 1 148px" },
        }}
      >
        <InputLabel>Sort By</InputLabel>
        <Select
          value={sortBy}
          label="Sort By"
          onChange={(e) => setSortBy(e.target.value)}
          MenuProps={compactSelectMenuProps}
        >
          <MenuItem value="artist">Artist</MenuItem>
          <MenuItem value="title">Title</MenuItem>
          <MenuItem value="year">Year</MenuItem>
          <MenuItem value="genre">Genre</MenuItem>
          <MenuItem value="rating">Rating</MenuItem>
        </Select>
      </FormControl>

      <FormControl
        size="small"
        sx={{
          width: { xs: "calc(50% - 5px)", sm: 152 },
          flex: { lg: "1 1 152px" },
        }}
      >
        <InputLabel>Order</InputLabel>
        <Select
          value={sortOrder}
          label="Order"
          onChange={(e) => setSortOrder(e.target.value)}
          MenuProps={compactSelectMenuProps}
        >
          <MenuItem value="asc">Ascending</MenuItem>
          <MenuItem value="desc">Descending</MenuItem>
        </Select>
      </FormControl>

      <Button
        variant="outlined"
        color="primary"
        onClick={handleResetFilters}
        size="small"
        sx={{
          minWidth: { xs: "100%", sm: 128 },
          height: 40,
          ml: { lg: "auto" },
          fontSize: "0.8rem",
        }}
      >
        Reset Filters
      </Button>
    </Box>
  );
};

export default AlbumFilters;
