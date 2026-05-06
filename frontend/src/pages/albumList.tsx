import React, { useEffect, useState, useMemo, useRef } from "react";
import { Box, CircularProgress, Typography } from "@mui/material";
import { FixedSizeList as List } from "react-window";
import { useSearchParams, useLocation } from "react-router-dom";
import AlbumCard from "../components/album/albumCard";
import AlbumFilters, { ArtistOption } from "../components/album/albumFilters";
import { getNormalizedLetter, normalizeArtistName } from "../utils/artistName";
import AlbumSummaryBar from "../components/album/albumSummaryBar";
import { Album } from "../models/models";
import AlbumService from "../services/albumService";

const MIN_CARD_WIDTH = 145;
const MAX_CARD_WIDTH = 172;
const IDEAL_CARD_WIDTH = 156;
const GAP = 10;
const SCROLLBAR_GUTTER = 24;

const getAlbumGridMetrics = (viewportWidth: number) => {
  const listWidth = Math.max(
    320,
    viewportWidth - (viewportWidth < 600 ? 32 : 64)
  );
  const contentWidth = Math.max(280, listWidth - SCROLLBAR_GUTTER);
  const itemGuess = Math.max(
    1,
    Math.floor((contentWidth + GAP) / (IDEAL_CARD_WIDTH + GAP))
  );
  const rawCardWidth = Math.floor(
    (contentWidth - GAP * (itemGuess - 1)) / itemGuess
  );
  const cardWidth = Math.max(
    MIN_CARD_WIDTH,
    Math.min(MAX_CARD_WIDTH, rawCardWidth)
  );
  const itemsPerRow = Math.max(
    1,
    Math.floor((contentWidth + GAP) / (cardWidth + GAP))
  );
  const imageSize = cardWidth;
  const contentHeight = Math.max(70, Math.round(cardWidth * 0.37));
  const rowHeight = imageSize + contentHeight + GAP * 2;

  return {
    listWidth,
    contentWidth,
    cardWidth,
    imageSize,
    contentHeight,
    itemsPerRow,
    rowHeight,
  };
};

const toSlug = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-") 
    .replace(/^-+|-+$/g, "");

const collator = new Intl.Collator(undefined, {
  usage: "sort",
  sensitivity: "base",
  numeric: true
});

const getArtistLetter = (album: Album): string =>
  getNormalizedLetter(album.artist?.artistName);

const AlbumList: React.FC = () => {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedLetter, setSelectedLetter] = useState<string>(searchParams.get("letter")?.toUpperCase() ?? "");
  const [selectedArtist, setSelectedArtist] = useState<string | null>(searchParams.get("artist") ?? "");
  const [genreQuery, setGenreQuery] = useState<string | null>(searchParams.get("genre")?.replace(/-/g, " ") ?? "");
  const [yearQuery, setYearQuery] = useState<string | null>(searchParams.get("year") ?? "");
  const [minRating, setMinRating] = useState<number | string>(() => {
    const val = searchParams.get("min");
    if (!val) return "";
    if (val === "null") return "null";
    return Number(val);
  });
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
    if (selectedLetter) params.set("letter", selectedLetter.toLowerCase());
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
    AlbumService.getAll()
      .then((data) => {
        setAlbums(data);

        const byKey = new Map<string, ArtistOption>();

        data.forEach((a) => {
          const name = a.artist?.artistName?.trim();
          if (!name) return;

          const letter = getNormalizedLetter(name);
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
    if (minRating === "null") {
      filtered = filtered.filter((a) => a.rating == null);
    } else if (minRating !== "") {
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

  const {
    listWidth,
    contentWidth,
    cardWidth,
    imageSize,
    contentHeight,
    itemsPerRow,
    rowHeight,
  } = getAlbumGridMetrics(containerWidth);
  const rowCount = Math.ceil(filteredAlbums.length / itemsPerRow);
  const ratedAlbums = filteredAlbums.filter((a) => a.rating !== null);
  const listHeight = Math.max(380, window.innerHeight - 220);

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
              width: "100%",
              py: 0.5,
            }}
          >
            <Box
              sx={{
                width: `${contentWidth}px`,
                mr: `${SCROLLBAR_GUTTER}px`,
                display: "flex",
                justifyContent: "center",
                alignItems: "stretch",
                gap: `${GAP}px`,
              }}
            >
              {rowItems.map((album) => (
                <Box
                  key={album.id}
                  sx={{
                    width: `${cardWidth}px`,
                    flexShrink: 0,
                  }}
                >
                  <AlbumCard
                    id={album.id}
                    albumName={album.albumName}
                    releaseYear={album.releaseYear}
                    cardWidth={cardWidth}
                    imageSize={imageSize}
                    contentHeight={contentHeight}
                    releaseOrder={album.releaseOrder ?? undefined}
                    genre={album.genre ?? ""}
                    rating={album.rating ?? undefined}
                    coverURL={
                      album.coverURL ?? "/default-cover.png"
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
          </Box>
        );
      },
    [
      filteredAlbums,
      itemsPerRow,
      location.search,
      cardWidth,
      imageSize,
      contentHeight,
    ]
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
    <Box
      sx={{
        px: { xs: 1.5, sm: 2 },
        pt: { xs: 0.75, sm: 1 },
        pb: { xs: 0.75, sm: 1 },
        overflowX: "hidden",
      }}
    >
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
        <Box
          className="scroll"
          sx={{ display: "flex", justifyContent: "center" }}
        >
          <List
            height={listHeight}
            itemCount={rowCount}
            itemSize={rowHeight}
            width={listWidth}
          >
            {Row}
          </List>
        </Box>
      )}
    </Box>
  );
};

export default AlbumList;
