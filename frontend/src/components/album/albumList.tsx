import React, { useEffect, useState, useMemo, useRef } from "react";
import { Box, CircularProgress, Typography } from "@mui/material";
import { FixedSizeList as List } from "react-window";
import { useSearchParams, useLocation } from "react-router-dom";
import api from "../../api/apiClient";
import AlbumCard from "./albumCard";
import AlbumFilters, { ArtistOption, getNormalizedLetter, normalizeArtistName } from "./albumFilters";
import AlbumSummaryBar from "./albumSummaryBar";
import { Album } from "../../models/models";

const CARD_WIDTH = 280;
const CARD_HEIGHT = 340;
const GAP = 15;

interface ParsedSearch {
  q: string;
  letter: string;
  artist: string | null;
  genre: string | null;
  year: string | null;
  min: number | "";
  sortBy: string;
  order: string;
}

function parseSearch(search: string): ParsedSearch {
  const sp = new URLSearchParams(search);
  const get = (k: string) => sp.get(k);
  const minRaw = get("min");
  const orderRaw = get("order");

  return {
    q: get("q") ?? "",
    letter: get("letter") ?? "",
    artist: get("artist"),
    genre: get("genre"),
    year: get("year"),
    min: minRaw !== null && minRaw !== "" ? Number(minRaw) : "",
    sortBy: get("sortBy") ?? "artist",
    order: orderRaw === "desc" ? "desc" : "asc",
  };
}

const getArtistLetter = (album: Album): string =>
  getNormalizedLetter(album.artist?.artistName);

const AlbumList: React.FC = () => {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const initial = useRef<ParsedSearch>(parseSearch(location.search)).current;
  const [searchQuery, setSearchQuery] = useState<string>(initial.q);
  const [selectedLetter, setSelectedLetter] = useState<string>(initial.letter);
  const [selectedArtist, setSelectedArtist] = useState<string | null>(initial.artist);
  const [genreQuery, setGenreQuery] = useState<string | null>(initial.genre);
  const [yearQuery, setYearQuery] = useState<string | null>(initial.year);
  const [minRating, setMinRating] = useState<number | "">(initial.min);
  const [sortBy, setSortBy] = useState<string>(initial.sortBy);
  const [sortOrder, setSortOrder] = useState<string>(initial.order);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [filteredAlbums, setFilteredAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [containerWidth, setContainerWidth] = useState(window.innerWidth);
  const [artistOptions, setArtistOptions] = useState<ArtistOption[]>([]);
  const isHydratingRef = useRef(false);

  useEffect(() => {
    const handleResize = () => setContainerWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    isHydratingRef.current = true;
    const next = parseSearch(location.search);

    if (searchQuery !== next.q) setSearchQuery(next.q);
    if (selectedLetter !== next.letter) setSelectedLetter(next.letter);
    if (selectedArtist !== next.artist) setSelectedArtist(next.artist);
    if (genreQuery !== next.genre) setGenreQuery(next.genre);
    if (yearQuery !== next.year) setYearQuery(next.year);
    if (minRating !== next.min) setMinRating(next.min);
    if (sortBy !== next.sortBy) setSortBy(next.sortBy);
    if (sortOrder !== next.order) setSortOrder(next.order);

    setTimeout(() => {
      isHydratingRef.current = false;
    }, 0);
  }, [location.search]);

  useEffect(() => {
    if (isHydratingRef.current) return;

    const params = new URLSearchParams();
    if (searchQuery) params.set("q", searchQuery);
    if (selectedLetter) params.set("letter", selectedLetter);
    if (selectedArtist) params.set("artist", selectedArtist);
    if (genreQuery) params.set("genre", genreQuery);
    if (yearQuery) params.set("year", yearQuery);
    if (minRating !== "") params.set("min", String(minRating));
    if (sortBy && sortBy !== "letter") params.set("sortBy", sortBy);
    if (sortOrder && sortOrder !== "asc") params.set("order", sortOrder);

    const next = params.toString();
    const curr = location.search.replace(/^\?/, "");
    if (next !== curr) {
      setSearchParams(params, { replace: true });
    }
  }, [
    searchQuery,
    selectedLetter,
    selectedArtist,
    genreQuery,
    yearQuery,
    minRating,
    sortBy,
    sortOrder,
    location.search,
    setSearchParams,
  ]);

  useEffect(() => {
    api
      .get<Album[]>("/albums")
      .then((res) => {
        setAlbums(res.data);

        // Build sorted artist options (letter, then normalized name)
        const byKey = new Map<string, ArtistOption>();

        res.data.forEach((a) => {
          const name = a.artist?.artistName?.trim();
          if (!name) return;

          let letter = getNormalizedLetter(name);
          const key = name.toLowerCase();

          if (!byKey.has(key)) byKey.set(key, { name, letter });
        });

        const artists = Array.from(byKey.values()).sort((x, y) => {
          const l = x.letter.localeCompare(y.letter);
          if (l !== 0) return l;
          const nx = normalizeArtistName(x.name);
          const ny = normalizeArtistName(y.name);
          return nx.localeCompare(ny);
        });

        setArtistOptions(artists);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching albums:", err);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    let filtered = [...albums];

    // search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (a) =>
          a.albumName.toLowerCase().includes(q) ||
          a.artist?.artistName?.toLowerCase().includes(q)
      );
    }

    // letter filter
    if (selectedLetter) {
      const target = selectedLetter.toUpperCase();
      filtered = filtered.filter((a) => getArtistLetter(a) === target);
    }

    // artist filter
    if (selectedArtist) {
      filtered = filtered.filter(
        (a) =>
          a.artist?.artistName?.toLowerCase() ===
          selectedArtist.toLowerCase()
      );
    }

    // min rating
    if (minRating !== "") {
      const ratingStr = String(minRating);
      const regex = new RegExp(`^${ratingStr}(\\.|$)`);
      filtered = filtered.filter((a) => {
        if (a.rating == null) return false;
        return regex.test(String(a.rating));
      });
    }

    // genre filter
    if (genreQuery && genreQuery.trim()) {
      const gq = genreQuery.toLowerCase();
      filtered = filtered.filter((a) =>
        a.genre?.toLowerCase().includes(gq)
      );
    }

    // year filter
    if (yearQuery && yearQuery.trim()) {
      filtered = filtered.filter((a) =>
        String(a.releaseYear ?? "").startsWith(yearQuery)
      );
    }

    const dir = sortOrder === "asc" ? 1 : -1;

    filtered.sort((a, b) => {
      // Sort by letter
      if (sortBy === "letter") {
        // Letter
        const aLetter = getArtistLetter(a);
        const bLetter = getArtistLetter(b);
        if (aLetter < bLetter) return -1 * dir;
        if (aLetter > bLetter) return 1 * dir;

        // Artist
        const aName = normalizeArtistName(a.artist?.artistName);
        const bName = normalizeArtistName(b.artist?.artistName);
        if (aName < bName) return -1 * dir;
        if (aName > bName) return 1 * dir;

        // Year
        const aY = a.releaseYear ?? 9999;
        const bY = b.releaseYear ?? 9999;
        if (aY < bY) return -1 * dir;
        if (aY > bY) return 1 * dir;

        // Release order
        const aOrder = a.releaseOrder;
        const bOrder = b.releaseOrder;

        if (aOrder != null || bOrder != null) {
          if (aOrder == null) return 1;
          if (bOrder == null) return -1;
          if (aOrder < bOrder) return -1 * dir;
          if (aOrder > bOrder) return 1 * dir;
        }

        // Title fallback
        const aTitle = (a.albumName || "").toLowerCase();
        const bTitle = (b.albumName || "").toLowerCase();
        if (aTitle < bTitle) return -1 * dir;
        if (aTitle > bTitle) return 1 * dir;

        return 0;
      }

      // Sort by artist
      if (sortBy === "artist") {
        // Artist
        const aName = normalizeArtistName(a.artist?.artistName);
        const bName = normalizeArtistName(b.artist?.artistName);
        if (aName < bName) return -1 * dir;
        if (aName > bName) return 1 * dir;

        // Year
        const aY = a.releaseYear ?? 9999;
        const bY = b.releaseYear ?? 9999;
        if (aY < bY) return -1 * dir;
        if (aY > bY) return 1 * dir;

        // Release order
        const aOrder = a.releaseOrder;
        const bOrder = b.releaseOrder;

        if (aOrder != null || bOrder != null) {
          if (aOrder == null) return 1;
          if (bOrder == null) return -1;
          if (aOrder < bOrder) return -1 * dir;
          if (aOrder > bOrder) return 1 * dir;
        }

        // Title fallback
        const aTitle = (a.albumName || "").toLowerCase();
        const bTitle = (b.albumName || "").toLowerCase();
        if (aTitle < bTitle) return -1 * dir;
        if (aTitle > bTitle) return 1 * dir;

        return 0;
      }

      // Title
      if (sortBy === "title") {
        const aTitle = (a.albumName || "").toLowerCase();
        const bTitle = (b.albumName || "").toLowerCase();
        if (aTitle < bTitle) return -1 * dir;
        if (aTitle > bTitle) return 1 * dir;
        return 0;
      }

      // Year
      const aY = a.releaseYear ?? 9999;
      const bY = b.releaseYear ?? 9999;
      if (aY < bY) return -1 * dir;
      if (aY > bY) return 1 * dir;

      // Release order
      const aOrder = a.releaseOrder;
      const bOrder = b.releaseOrder;

      if (aOrder != null || bOrder != null) {
        if (aOrder == null) return 1;
        if (bOrder == null) return -1;
        if (aOrder < bOrder) return -1 * dir;
        if (aOrder > bOrder) return 1 * dir;
      }

      return 0;
    });

    setFilteredAlbums(filtered);
  }, [
    albums,
    searchQuery,
    selectedLetter,
    selectedArtist,
    genreQuery,
    yearQuery,
    minRating,
    sortBy,
    sortOrder,
  ]);

  const totalCardWidth = CARD_WIDTH + GAP;
  const itemsPerRow = Math.max(
    1,
    Math.floor((containerWidth - GAP) / totalCardWidth)
  );
  const rowCount = Math.ceil(filteredAlbums.length / itemsPerRow);

  const Row = useMemo(
    () =>
      ({ index, style }: { index: number; style: React.CSSProperties }) => {
        const startIndex = index * itemsPerRow;
        const rowItems = filteredAlbums.slice(
          startIndex,
          startIndex + itemsPerRow
        );

        return (
          <Box
            style={style}
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "stretch",
              gap: `${GAP}px`,
              width: "100%",
              px: 1,
              py: 0,
              pt: 1,
              paddingRight: 3,
            }}
          >
            {rowItems.map((album) => (
              <Box
                key={album.id}
                sx={{
                  width: `${CARD_WIDTH}px`,
                  flexShrink: 0,
                }}
              >
                <AlbumCard
                  id={album.id}
                  albumName={album.albumName}
                  releaseYear={album.releaseYear}
                  releaseOrder={album.releaseOrder ?? undefined}
                  genre={album.genre ?? ""}
                  rating={album.rating ?? undefined}
                  coverURL={
                    album.coverURL ?? "/images/default-cover.png"
                  }
                  artistName={
                    album.artist?.artistName ?? "Unknown Artist"
                  }
                  fromSearch={location.search}
                  eager={index <= 5}
                />
              </Box>
            ))}
          </Box>
        );
      },
    [filteredAlbums, itemsPerRow, location.search]
  );

  if (loading) {
    return (
      <Box textAlign="center" mt={5}>
        <CircularProgress />
        <Typography variant="body2" mt={2}>
          Loading albums...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2, overflowX: "hidden" }}>
      <AlbumFilters
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedLetter={selectedLetter}
        setSelectedLetter={setSelectedLetter}
        selectedArtist={selectedArtist}
        setSelectedArtist={setSelectedArtist}
        artistOptions={artistOptions}
        genreQuery={genreQuery}
        setGenreQuery={setGenreQuery}
        yearQuery={yearQuery}
        setYearQuery={setYearQuery}
        minRating={minRating}
        setMinRating={setMinRating}
        sortBy={sortBy}
        setSortBy={setSortBy}
        sortOrder={sortOrder}
        setSortOrder={setSortOrder}
      />

      <AlbumSummaryBar
        totalAlbums={filteredAlbums.length}
        listenedAlbums={filteredAlbums.filter(a => a.rating !== null).length}
        uniqueArtists={
          new Set(
            filteredAlbums.map((a) => a.artist?.artistName)
          ).size
        }
        wrongCoverAlbums={filteredAlbums.filter(a => a.coverURL === "/images/default-cover.png" || a.coverURL === '').length}
        avgRating={filteredAlbums.filter(a => a.rating !== null).length > 0 
          ? Number((filteredAlbums.reduce((sum, a) => sum + (a.rating ?? 0), 0) / filteredAlbums.filter(a => a.rating != null).length).toFixed(2)) 
          : undefined
        }
      />

      {filteredAlbums.length === 0 ? (
        <Typography align="center" mt={4}>
          No albums found for these filters.
        </Typography>
      ) : (
        <Box sx={{ display: "flex", justifyContent: "center" }}>
          <List
            height={window.innerHeight - 180}
            itemCount={rowCount}
            itemSize={CARD_HEIGHT + GAP * 3}
            width={containerWidth}
          >
            {Row}
          </List>
        </Box>
      )}
    </Box>
  );
};

export default AlbumList;