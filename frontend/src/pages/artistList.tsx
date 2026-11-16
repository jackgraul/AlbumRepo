import React, {useCallback, useEffect, useMemo, useRef, useState} from "react";
import {useSearchParams} from "react-router-dom";
import {Artist} from "../models/models";
import {Box, CircularProgress, Typography} from "@mui/material";
import {FixedSizeList as List} from "react-window";
import ArtistCard from "../components/artist/artistCard";
import ArtistFilters from "../components/artist/artistFilters";
import {ArtistOption} from "../components/album/albumFilters";
import {getNormalizedLetter, normalizeArtistName} from "../utils/artistName";
import ArtistSummaryBar from "../components/artist/artistSummaryBar";
import ArtistService from "../services/artistService";
import {toSlug} from "../utils/slug";

const ARTIST_CARD_HEIGHT = 115;
const ARTIST_ROW_GAP = 12;
const ARTIST_SCROLLBAR_GUTTER = 8;
const ARTIST_ROW_HEIGHT = ARTIST_CARD_HEIGHT + ARTIST_ROW_GAP;

type EnrichedArtist = Artist & {
  _normName: string;
  _letter: string;
  _albumCount: number;
  _ratedCount: number;
  _avgRating: number | null;
};

interface ArtistRowData {
  artists: EnrichedArtist[];
  columns: number;
}

const ArtistRowDataContext = React.createContext<ArtistRowData | null>(null);

function ArtistGridRow({index, style}: {index: number; style: React.CSSProperties;}) {
  const data = React.useContext(ArtistRowDataContext);
  if (!data) return null;

  const startIndex = index * data.columns;
  const rowArtists = data.artists.slice(startIndex, startIndex + data.columns);

  return (
    <Box
      style={style}
      sx={{
        display: "grid",
        gridTemplateColumns: `repeat(${data.columns}, minmax(0, 1fr))`,
        alignContent: "start",
        columnGap: 1.5,
        pr: `${ARTIST_SCROLLBAR_GUTTER}px`,
        pb: `${ARTIST_ROW_GAP}px`,
        boxSizing: "border-box"
      }}
    >
      {rowArtists.map((artist) => (
        <Box key={artist.id} sx={{height: ARTIST_CARD_HEIGHT, minWidth: 0}}>
          <ArtistCard
            id={artist.id}
            letter={artist._letter}
            artistName={artist.artistName}
            albums={artist.albums ?? []}
            avgRating={artist._avgRating == null ? undefined : artist._avgRating.toFixed(2)}
          />
        </Box>
      ))}
    </Box>
  );
}

const ArtistList: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewportWidth, setViewportWidth] = useState(window.innerWidth);
  const [gridSize, setGridSize] = useState({width: 0, height: 0});
  const gridViewportRef = useRef<HTMLDivElement | null>(null);
  const selectedLetter = searchParams.get("letter")?.toUpperCase() ?? "";
  const selectedArtist = searchParams.get("artist");
  const sortBy = searchParams.get("sortby") ?? "letter";
  const sortOrder: "asc" | "desc" = searchParams.get("order") === "desc" ? "desc" : "asc";
  const [artistOptions, setArtistOptions] = useState<ArtistOption[]>([]);

  const updateSearchParams = useCallback((updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (value == null || value === "") params.delete(key);
      else params.set(key, value);
    });

    if (params.toString() !== searchParams.toString()) {
      setSearchParams(params, {replace: true});
    }
  }, [searchParams, setSearchParams]);

  const setSelectedLetter = useCallback((value: string) => {
    updateSearchParams({
      letter: value ? value.toLowerCase() : null,
      ...(value ? {artist: null} : {})
    });
  }, [updateSearchParams]);

  const setSelectedArtist = useCallback((value: string | null) => {
    updateSearchParams({artist: value});
  }, [updateSearchParams]);

  const setSortBy = useCallback((value: string) => {
    updateSearchParams({sortby: value === "letter" ? null : value});
  }, [updateSearchParams]);

  const setSortOrder = useCallback((value: "asc" | "desc") => {
    updateSearchParams({order: value === "asc" ? null : value});
  }, [updateSearchParams]);

  const resetFilters = useCallback(() => {
    updateSearchParams({
      letter: null,
      artist: null,
      sortby: null,
      order: null
    });
  }, [updateSearchParams]);

  useEffect(() => {
    const handleResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const element = gridViewportRef.current;
    if (!element || typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver(([entry]) => {
      const width = Math.floor(entry.contentRect.width);
      const height = Math.floor(entry.contentRect.height);
      setGridSize((current) =>
        current.width === width && current.height === height
          ? current
          : {width, height}
      );
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, [loading]);

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
            byKey.set(key, {name, letter});
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

  const enrichedArtists = useMemo<EnrichedArtist[]>(() => {
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
        _avgRating: avgRating
      };
    });
  }, [artists]);

  const filteredArtists = useMemo(() => {
    let filtered = [...enrichedArtists];

    if (selectedLetter) {
      const target = selectedLetter.toUpperCase();
      filtered = filtered.filter(a => a._letter === target);
    }

    if (selectedArtist) {
      filtered = filtered.filter(
        a => toSlug(a.artistName) === selectedArtist
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
    sortOrder
  ]);

  const minCardWidth = viewportWidth >= 1536 ? 275 : 250;
  const columns = viewportWidth < 600
    ? 1
    : Math.max(1, Math.floor((gridSize.width + 12) / (minCardWidth + 12)));
  const rowCount = Math.ceil(filteredArtists.length / columns);
  const rowData = useMemo<ArtistRowData>(() => ({
    artists: filteredArtists,
    columns,
  }), [filteredArtists, columns]);

  if (loading) {
    return (
      <Box textAlign="center" mt={5}>
        <CircularProgress size={60} thickness={4} sx={{mt: 25}}/>
        <Typography variant="body1" mt={2}>
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
        px: {xs: 1.5, sm: 2},
        pt: {xs: 1, sm: 1.25},
        pb: {xs: 1.5, sm: 2}
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
        onResetFilters={resetFilters}
      />

      <ArtistSummaryBar totalArtists={filteredArtists.length} />

      <Box
        ref={gridViewportRef}
        sx={{flex: 1, minHeight: 0, overflow: "hidden", pt: 0.5}}
      >
        {filteredArtists.length === 0 ? (
          <Typography align="center" mt={4}>
            No artists found for these filters.
          </Typography>
        ) : gridSize.width > 0 && gridSize.height > 0 ? (
          <ArtistRowDataContext.Provider value={rowData}>
            <List
              className="scroll artist-virtual-scroll"
              height={gridSize.height}
              itemCount={rowCount}
              itemSize={ARTIST_ROW_HEIGHT}
              overscanCount={1}
              width={gridSize.width}
            >
              {ArtistGridRow}
            </List>
          </ArtistRowDataContext.Provider>
        ) : null}
      </Box>
    </Box>
  );
};

export default ArtistList;