import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState
} from "react";
import api from "../api/apiClient";
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

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshUser = useCallback(async (): Promise<User | null> => {
    try {
      setError(null);

      const { data } = await api.get<User>("/auth/me");

      setUser(data);
      return data;

    } catch (err: any) {
      if (err.response?.status === 401) {
        setUser(null);
        return null;
      }

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
    window.location.href = `${api.defaults.baseURL?.replace("/api", "")}/oauth2/authorization/google`;
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    try {
      setError(null);
      await api.post("/auth/logout");
      setUser(null);
    } catch (err) {
      console.error("Logout failed:", err);
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