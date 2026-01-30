import React, { useEffect, useState, useMemo, useRef } from "react";
import { Box, CircularProgress, Typography } from "@mui/material";
import { FixedSizeList as List } from "react-window";
import { useSearchParams, useLocation } from "react-router-dom";
import api from "../api/apiClient";
import AlbumCard from "../components/album/albumCard";
import AlbumFilters, { ArtistOption, getNormalizedLetter, normalizeArtistName } from "../components/album/albumFilters";
import AlbumSummaryBar from "../components/album/albumSummaryBar";
import { Album } from "../models/models";

const CARD_WIDTH = 280;
const CARD_HEIGHT = 340;
const GAP = 15;

const toSlug = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const collator = new Intl.Collator(undefined, {
  usage: "sort",
  sensitivity: "base",
  numeric: true,
  ignorePunctuation: true,
});

const getArtistLetter = (album: Album): string =>
  getNormalizedLetter(album.artist?.artistName);

const AlbumList: React.FC = () => {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedLetter, setSelectedLetter] = useState<string>(searchParams.get("letter") ?? "");
  const [selectedArtist, setSelectedArtist] = useState<string | null>(searchParams.get("artist") ?? "");
  const [genreQuery, setGenreQuery] = useState<string | null>(searchParams.get("genre")?.replace(/-/g, " ") ?? "");
  const [yearQuery, setYearQuery] = useState<string | null>(searchParams.get("year") ?? "");
  const [minRating, setMinRating] = useState<number | "">(searchParams.get("min") ? Number(searchParams.get("min")) : "");
  const [sortBy, setSortBy] = useState<string>(searchParams.get("sortby") ?? "artist");
  const [sortOrder, setSortOrder] = useState<string>(searchParams.get("order") ?? "asc");
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [containerWidth, setContainerWidth] = useState(window.innerWidth);
  const [artistOptions, setArtistOptions] = useState<ArtistOption[]>([]);
  const isHydratingRef = useRef(false);

  // handle window resize
  useEffect(() => {
    const handleResize = () => setContainerWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const buildSearchParams = () => {
    const params = new URLSearchParams();
    if (selectedLetter) params.set("letter", selectedLetter);
    if (selectedArtist) params.set("artist", selectedArtist);
    if (genreQuery) params.set("genre", toSlug(genreQuery));
    if (yearQuery) params.set("year", yearQuery);
    if (minRating !== "") params.set("min", String(minRating));
    if (sortBy !== "artist") params.set("sortby", sortBy);
    if (sortOrder !== "asc") params.set("order", sortOrder);
    return params;
  };

  // sync state to URL
  useEffect(() => {
    if (isHydratingRef.current) return;

    const params = buildSearchParams();
    const next = params.toString();
    const curr = location.search.replace(/^\?/, "");
    if (next !== curr) setSearchParams(params, { replace: true });
  }, [
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

  // initial data fetch
  useEffect(() => {
    api
      .get<Album[]>("/albums")
      .then((res) => {
        setAlbums(res.data);

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

  const filteredAlbums = useMemo(() => {
    let filtered = [...albums];

    // letter filter
    if (selectedLetter) {
      const target = selectedLetter.toUpperCase();
      filtered = filtered.filter((a) => getArtistLetter(a) === target);
    }

    // artist filter
    if (selectedArtist) {
      filtered = filtered.filter(
        (a) =>
          toSlug(a.artist?.artistName ?? "") === selectedArtist
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

    // sorting
    type SortKey = string | number;

    const artistFallback = (a: Album): SortKey[] => [
      normalizeArtistName(a.artist?.artistName),
      a.releaseYear ?? 9999,
      a.releaseOrder ?? 9999,
      (a.albumName || "").toLowerCase(),
    ];

    const sortExtractors: Record<string, (a: Album) => SortKey[]> = {
      artist: (a) => [
        ...artistFallback(a),
      ],

      title: (a) => [
        (a.albumName || "").toLowerCase(),
        ...artistFallback(a),
      ],

      year: (a) => [
        a.releaseYear ?? 9999,
        a.releaseOrder ?? 9999,
        ...artistFallback(a),
      ],

      genre: (a) => [
        (a.genre || "").toLowerCase(),
        ...artistFallback(a),
      ],

      rating: (a) => [
        a.rating ?? -1,
        ...artistFallback(a),
      ],
    };

    const compareTuples = (
      a: SortKey[],
      b: SortKey[],
      dir: 1 | -1
    ) => {
      const len = Math.max(a.length, b.length);

      for (let i = 0; i < len; i++) {
        const av = a[i];
        const bv = b[i];

        if (av == null && bv == null) continue;
        if (av == null) return 1 * dir;
        if (bv == null) return -1 * dir;

        if (typeof av === "string" && typeof bv === "string") {
          const cmp = collator.compare(av, bv);
          if (cmp !== 0) return cmp * dir;
          continue;
        }

        if (av < bv) return -1 * dir;
        if (av > bv) return 1 * dir;
      }

      return 0;
    };

    const dir: 1 | -1 = sortOrder === "asc" ? 1 : -1;

    filtered.sort((a, b) =>
      compareTuples(
        sortExtractors[sortBy](a),
        sortExtractors[sortBy](b),
        dir
      )
    );

    return filtered;
  }, [
    albums,
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
  const ratedAlbums = filteredAlbums.filter(a => a.rating !== null);

  // render contents
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
        listenedAlbums={ratedAlbums.length}
        uniqueArtists={
          new Set(
            filteredAlbums.map((a) => a.artist?.artistName)
          ).size
        }
        avgRating={ratedAlbums.length > 0 
          ? Number((ratedAlbums.reduce((sum, a) => sum + (a.rating ?? 0), 0) / ratedAlbums.length).toFixed(2)) 
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