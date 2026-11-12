import axios from "axios";

const LOCAL_API_BASE_URL = "http://localhost:7373/api";

export const API_BASE_URL =
  process.env.NODE_ENV === "development"
    ? LOCAL_API_BASE_URL
    : "https://albumrepo-backend.onrender.com/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const csrfCookie = document.cookie
    .split("; ")
    .find((cookie) => cookie.startsWith("XSRF-TOKEN="));

  if (csrfCookie) {
    const csrfToken = decodeURIComponent(
      csrfCookie.substring("XSRF-TOKEN=".length)
    );

    config.headers.set("X-XSRF-TOKEN", csrfToken);
  }

  return config;
});

export default api;