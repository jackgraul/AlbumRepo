
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState
} from "react";

import { User } from "../models/models";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  refreshUser: () => Promise<User | null>;
  login: () => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_URL = "http://localhost:7373";

// Read the raw CSRF token from the XSRF-TOKEN cookie.
const getCsrfTokenFromCookie = (): string | null => {
  const cookie = document.cookie
    .split("; ")
    .find(row => row.startsWith("XSRF-TOKEN="));

  return cookie
    ? decodeURIComponent(cookie.substring("XSRF-TOKEN=".length))
    : null;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshUser = useCallback(async (): Promise<User | null> => {
    try {
      setError(null);

      const response = await fetch(`${API_URL}/api/auth/me`, {
        method: "GET",
        credentials: "include"
      });

      if (response.status === 401) {
        setUser(null);
        return null;
      }

      if (!response.ok) {
        throw new Error("Failed to retrieve authenticated user");
      }

      const userData: User = await response.json();
      setUser(userData);

      return userData;

    } catch (err) {
      console.error("Authentication check failed:", err);
      setUser(null);
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred"
      );
      return null;

    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback(() => {
    window.location.href = `${API_URL}/oauth2/authorization/google`;
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    try {
      setError(null);

      // Ensure a fresh CSRF token cookie exists.
      const csrfResponse = await fetch(`${API_URL}/api/auth/csrf`, {
        method: "GET",
        credentials: "include"
      });

      if (!csrfResponse.ok) {
        throw new Error("Failed to retrieve CSRF token");
      }

      // Read the raw token directly from the cookie.
      const csrfToken = getCsrfTokenFromCookie();

      if (!csrfToken) {
        throw new Error("CSRF token cookie not found");
      }

      // Send the raw cookie token in the CSRF header.
      const logoutResponse = await fetch(`${API_URL}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
        headers: {
          "X-XSRF-TOKEN": csrfToken
        }
      });

      if (!logoutResponse.ok) {
        throw new Error("Failed to log out");
      }

      setUser(null);

    } catch (err) {
      console.error("Logout failed:", err);

      const message = err instanceof Error
        ? err.message
        : "An unexpected error occurred";

      setError(message);
      throw err;
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        refreshUser,
        login,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
};