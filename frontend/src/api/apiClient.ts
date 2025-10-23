// src/api/apiClient.ts
import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:7373/api", // your Spring Boot port
  headers: {
    "Content-Type": "application/json",
  },
});

export default api;