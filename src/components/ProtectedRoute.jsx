import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { PlaceholderPage } from "../features/placeholder/PlaceholderPage";

export const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, role, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    // Redirect them to the /login page, but save the current location they were
    // trying to go to when they were redirected. This allows us to send them
    // along to that page after they login, which is a nicer user experience
    // than dropping them off on the home page.
    return <Navigate to="/dci-access" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes((role || "").toLowerCase())) {
    return <PlaceholderPage title="Access Denied" description="You don't have permission to access this page." />;
  }

  return children;
};
