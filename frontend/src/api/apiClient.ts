import axios from "axios";

const LOCAL_API_BASE_URL = "http://localhost:7373/api";

export const API_BASE_URL =
  process.env.NODE_ENV === "development"
    ? LOCAL_API_BASE_URL
    : "https://albumrepo-backend.onrender.com/api";

export const buildApiUrl = (path: string): string =>
  `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export default api;