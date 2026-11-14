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

let csrfToken: string | null = null;
let csrfTokenPromise: Promise<string> | null = null;

export const refreshCsrfToken = async (): Promise<string> => {
  if (!csrfTokenPromise) {
    csrfTokenPromise = api
      .get<{ token: string }>("/auth/csrf")
      .then((response) => {
        csrfToken = response.data.token;
        return csrfToken;
      })
      .finally(() => {
        csrfTokenPromise = null;
      });
  }

  return csrfTokenPromise;
};

api.interceptors.request.use(async (config) => {
  const method = config.method?.toLowerCase();

  if (["post", "put", "patch", "delete"].includes(method ?? "")) {
    if (!csrfToken) {
      await refreshCsrfToken();
    }

    if (csrfToken) {
      config.headers.set("X-XSRF-TOKEN", csrfToken);
    }
  }

  return config;
});

export default api;