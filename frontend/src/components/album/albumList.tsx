import React, { useEffect, useState, useMemo } from "react";
import { Box, CircularProgress, Typography } from "@mui/material";
import { FixedSizeList as List } from "react-window";
import api from "../../api/apiClient";
import AlbumCard from "./albumCard";
import AlbumFilters from "./albumFilters";
import AlbumSummaryBar from "./albumSummaryBar";
import { Album } from "../../models/models";

const CARD_WIDTH = 280;
const CARD_HEIGHT = 370; // match AlbumCard height
const GAP = 15; // uniform spacing for both directions

const AlbumList: React.FC = () => {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [filteredAlbums, setFilteredAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [containerWidth, setContainerWidth] = useState(window.innerWidth);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLetter, setSelectedLetter] = useState<string>("");
  const [selectedArtist, setSelectedArtist] = useState<string | null>(null);
  const [minRating, setMinRating] = useState<number | "">("");
  const [sortBy, setSortBy] = useState<string>("letter");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [artistOptions, setArtistOptions] = useState<string[]>([]);

  useEffect(() => {
    const handleResize = () => setContainerWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    api
      .get<Album[]>("/albums")
      .then((res) => {
        setAlbums(res.data);
        setLoading(false);

        const artists: string[] = Array.from(
          new Set(
            res.data
              .map((a) => a.artist?.artistName)
              .filter((n): n is string => !!n)
          )
        ).sort((a, b) => a.localeCompare(b));
        setArtistOptions(artists);
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
        (a) =>
          a.artist?.artistName?.toLowerCase() === selectedArtist.toLowerCase()
      );
    }

    if (minRating !== "") {
      filtered = filtered.filter((a) => (a.rating ?? 0) >= Number(minRating));
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
  }, [albums, searchQuery, selectedLetter, selectedArtist, minRating, sortBy, sortOrder]);

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
              paddingRight: 3
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
                />
              </Box>
            ))}
          </Box>
        );
      },
    [filteredAlbums, itemsPerRow]
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
        minRating={minRating}
        setMinRating={setMinRating}
        sortBy={sortBy}
        setSortBy={setSortBy}
        sortOrder={sortOrder}
        setSortOrder={setSortOrder}
      />

      {/* ✅ Summary bar */}
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
            itemSize={CARD_HEIGHT + GAP * 3} // ✅ equal vertical & horizontal gap
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