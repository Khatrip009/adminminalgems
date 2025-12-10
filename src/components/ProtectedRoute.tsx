import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

interface Props {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<Props> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // we already ensure admin in AuthContext, but double-check:
  if (Number(user.role_id) !== 1) {
    return (
      <div className="h-screen flex items-center justify-center text-red-600">
        Access denied (admin only).
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
