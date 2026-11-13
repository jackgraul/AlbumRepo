import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/authContext";

const ProtectedRoute: React.FC = () => {
  const { user, loading } = useAuth();

  // Wait until the initial authentication check finishes.
  if (loading) {
    return null;
  }

  // Redirect unauthenticated users to the home page.
  if (!user) {
    return <Navigate to="/" replace />;
  }

  // Allow authenticated users to access the requested route.
  return <Outlet />;
};

export default ProtectedRoute;