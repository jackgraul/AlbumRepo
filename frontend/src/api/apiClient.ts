import axios from "axios";

const LOCAL_API_BASE_URL = "http://localhost:7373/api";
const isDevelopment = process.env.NODE_ENV === "development";

export const API_BASE_URL = isDevelopment
  ? LOCAL_API_BASE_URL
  : process.env.REACT_APP_API_URL ?? LOCAL_API_BASE_URL;

export const buildApiUrl = (path: string): string =>
  `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export default api;