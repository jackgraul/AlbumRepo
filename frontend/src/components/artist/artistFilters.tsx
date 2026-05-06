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
import { normalizeArtistName } from "../../utils/artistName";

interface ArtistFilterProps {
  selectedLetter: string;
  setSelectedLetter: (value: string) => void;
  selectedArtist: string | null;
  setSelectedArtist: (value: string | null) => void;
  sortBy: string;
  setSortBy: (value: string) => void;
  sortOrder: "asc" | "desc";
  setSortOrder: (value: "asc" | "desc") => void;
  artistOptions: ArtistOption[];
}

const letters = ["#", ...Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i))];

const ArtistFilters: React.FC<ArtistFilterProps> = ({
  selectedLetter,
  setSelectedLetter,
  selectedArtist,
  setSelectedArtist,
  sortBy,
  setSortBy,
  sortOrder,
  setSortOrder,
  artistOptions
}) => {
  const handleLetterChange = (value: string) => {
    setSelectedLetter(value);
    if (value) setSelectedArtist(null);
  };

  const handleArtistChange = (value: string | null) => {
    setSelectedArtist(value);
  };

  const handleResetFilters = () => {
    setSelectedLetter("");
    setSelectedArtist(null);
    setSortBy("letter");
    setSortOrder("asc");
  };

  const filteredArtistOptions = useMemo(() => {
    const dir = sortOrder === "asc" ? 1 : -1;

    let list = artistOptions.map((o) => {
      const albums = o.albums ?? [];
      const avgRating =
        albums.length > 0
          ? albums.reduce((sum, a) => sum + (a.rating ?? 0), 0) / albums.length
          : null;

      return {
        ...o,
        norm: normalizeArtistName(o.name),
        letterNorm: (o.letter || "#").toUpperCase(),
        avgRating,
      };
    });

    if (selectedLetter) {
      const target = selectedLetter.toUpperCase();
      list =
        target === "#"
          ? list.filter((a) => a.letterNorm === "#")
          : list.filter((a) => a.letterNorm === target);
    }

    const compareStrings = (a: string, b: string) =>
      a < b ? -1 : a > b ? 1 : 0;

    const sorted = [...list].sort((a, b) => {
      switch (sortBy) {
        case "albums": {
          const diff = (a.albums?.length ?? 0) - (b.albums?.length ?? 0);
          if (diff !== 0) return diff * dir;

          return compareStrings(a.norm, b.norm) * dir;
        }

        case "letter": {
          const letterDiff = compareStrings(a.letterNorm, b.letterNorm);
          if (letterDiff !== 0) return letterDiff * dir;

          return compareStrings(a.norm, b.norm) * dir;
        }

        case "avgRating": {
          const ar = a.avgRating;
          const br = b.avgRating;

          if (ar == null && br == null) {
            return compareStrings(a.norm, b.norm) * dir;
          }
          if (ar == null) return 1;
          if (br == null) return -1;

          const diff = ar - br;
          if (diff !== 0) return diff * dir;

          return compareStrings(a.norm, b.norm) * dir;
        }

        case "artist":
        default:
          return compareStrings(a.norm, b.norm) * dir;
      }
    });

    return sorted;
  }, [artistOptions, selectedLetter, sortBy, sortOrder]);

  const selectedArtistOption =
    selectedArtist != null
      ? filteredArtistOptions.find((o) => o.name === selectedArtist) ?? null
      : null;

  return (
    <Box
      sx={{
        display: "flex",
        flexWrap: "wrap",
        gap: 1.25,
        alignItems: "center",
        justifyContent: { xs: "flex-start", lg: "space-between" },
        mb: 1,
        mt: 0,
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
        sx={{
          width: { xs: "100%", sm: 220, md: 240 },
          flex: { lg: "1 1 260px" },
        }}
      />

      <FormControl
        size="small"
        sx={{
          width: { xs: "calc(50% - 5px)", sm: 148 },
          flex: { lg: "1 1 180px" },
        }}
      >
        <InputLabel>Sort By</InputLabel>
        <Select
          value={sortBy}
          label="Sort By"
          onChange={(e) => setSortBy(e.target.value)}
        >
          <MenuItem value="letter">Letter</MenuItem>
          <MenuItem value="artist">Artist</MenuItem>
          <MenuItem value="albumCount">Album Count</MenuItem>
          <MenuItem value="avgRating">Average Rating</MenuItem>
        </Select>
      </FormControl>

      <FormControl
        size="small"
        sx={{
          width: { xs: "calc(50% - 5px)", sm: 152 },
          flex: { lg: "1 1 180px" },
        }}
      >
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

export default ArtistFilters;
