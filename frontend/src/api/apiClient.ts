import axios from "axios";

//const BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:7373/api";
const BASE_URL = "http://localhost:7373/api";

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export default api;