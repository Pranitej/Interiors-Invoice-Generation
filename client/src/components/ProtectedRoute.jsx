// client/src/components/ProtectedRoute.jsx
import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

/**
 * Wraps a route so only authenticated users with the right role can access it.
 * roles: array of allowed role strings. If omitted, any authenticated user is allowed.
 */
export default function ProtectedRoute({ children, roles }) {
  const { user } = useContext(AuthContext);

  if (!user) return <Navigate to="/" replace />;

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
