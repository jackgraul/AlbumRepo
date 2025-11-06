import React, { useEffect, useState, useMemo, useRef } from "react";
import { Box, CircularProgress, Typography } from "@mui/material";
import { FixedSizeList as List } from "react-window";
import { useSearchParams, useLocation } from "react-router-dom";
import api from "../../api/apiClient";
import AlbumCard from "./albumCard";
import AlbumFilters, { ArtistOption } from "./albumFilters";
import AlbumSummaryBar from "./albumSummaryBar";
import { Album } from "../../models/models";

const CARD_WIDTH = 280;
const CARD_HEIGHT = 370;
const GAP = 15;

type SortOrder = "asc" | "desc";

interface ParsedSearch {
  q: string;
  letter: string;
  artist: string | null;
  genre: string | null;
  year: string | null;
  min: number | "";
  sortBy: string;
  order: SortOrder;
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
    sortBy: get("sortBy") ?? "letter",
    order: orderRaw === "desc" ? "desc" : "asc",
  };
}

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
  const [sortOrder, setSortOrder] = useState<SortOrder>(initial.order);
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

      const byKey = new Map<string, ArtistOption>();

      res.data.forEach((a) => {
        const name = a.artist?.artistName?.trim();
        if (!name) return;

        const rawLetter = a.artist?.letter ?? name.charAt(0);
        let letter = (rawLetter || "").toUpperCase();
        if (/^[0-9]/.test(name)) letter = "#";

        const key = name.toLowerCase();
        if (!byKey.has(key)) byKey.set(key, { name, letter });
      });

      const artists = Array.from(byKey.values()).sort(
        (x, y) => x.letter.localeCompare(y.letter) || x.name.localeCompare(y.name)
      );

      setArtistOptions(artists);
      setLoading(false);
    })
    .catch((err) => {
      console.error("❌ Error fetching albums:", err);
      setLoading(false);
    });
}, []);

  useEffect(() => {
    let filtered = [...albums];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (a) =>
          a.albumName.toLowerCase().includes(q) ||
          a.artist?.artistName?.toLowerCase().includes(q)
      );
    }

    if (selectedLetter) {
      filtered = filtered.filter((a) => {
        const name = a.artist?.artistName ?? "";
        if (selectedLetter === "#") return /^[0-9]/.test(name);
        return name.toUpperCase().startsWith(selectedLetter.toUpperCase());
      });
    }

    if (selectedArtist) {
      filtered = filtered.filter(
        (a) => a.artist?.artistName?.toLowerCase() === selectedArtist.toLowerCase()
      );
    }

    if (minRating !== "") {
      const ratingStr = String(minRating);
      const regex = new RegExp(`^${ratingStr}(\\.|$)`);
      filtered = filtered.filter((a) => {
        if (a.rating == null) return false;
        return regex.test(String(a.rating));
      });
    }

    if (genreQuery && genreQuery.trim()) {
      const gq = genreQuery.toLowerCase();
      filtered = filtered.filter((a) => a.genre?.toLowerCase().includes(gq));
    }

    if (yearQuery && yearQuery.trim()) {
      filtered = filtered.filter((a) =>
        String(a.releaseYear ?? "").startsWith(yearQuery)
      );
    }

    filtered.sort((a, b) => {
      let valA: any;
      let valB: any;

      switch (sortBy) {
        case "title":
          valA = a.albumName.toLowerCase();
          valB = b.albumName.toLowerCase();
          break;
        case "letter":
          valA = a.artist.letter;
          valB = b.artist.letter;
          break;
        case "artist":
          valA = a.artist?.artistName?.toLowerCase() ?? "";
          valB = b.artist?.artistName?.toLowerCase() ?? "";
          break;
        case "rating":
          valA = a.rating ?? 0;
          valB = b.rating ?? 0;
          break;
        default:
          valA = a.releaseYear;
          valB = b.releaseYear;
      }

      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
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
  const itemsPerRow = Math.max(1, Math.floor((containerWidth - GAP) / totalCardWidth));
  const rowCount = Math.ceil(filteredAlbums.length / itemsPerRow);

  const Row = useMemo(
    () =>
      ({ index, style }: { index: number; style: React.CSSProperties }) => {
        const startIndex = index * itemsPerRow;
        const rowItems = filteredAlbums.slice(startIndex, startIndex + itemsPerRow);

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
                  genre={album.genre ?? ""}
                  rating={album.rating ?? undefined}
                  coverURL={album.coverURL ?? "/images/default-cover.png"}
                  artistName={album.artist?.artistName ?? "Unknown Artist"}
                  fromSearch={location.search}
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
          Loading albums…
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
        uniqueArtists={
          new Set(filteredAlbums.map((a) => a.artist?.artistName)).size
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