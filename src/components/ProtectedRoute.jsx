import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
export default function ProtectedRoute({ children }) {
  const { context, loading } = useAuth();
  const location = useLocation();
  if (loading)
    return (
      <div className="page-loader">
        <span />
      </div>
    );
  return context ? (
    children
  ) : (
    <Navigate to="/login" state={{ from: location }} replace />
  );
}
