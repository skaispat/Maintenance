import { Navigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ('Admin' | 'User' | 'Viewer')[];
  requiredPage?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles = [],
  requiredPage
}) => {
  const { isAuthenticated, user } = useAuthStore();

  // Check if user is authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check if user has required role
  if (allowedRoles.length > 0 && user && !allowedRoles.includes(user.pageAccess)) {
    // Redirect to home page if user doesn't have permission
    return <Navigate to="/" replace />;
  }

  // Check for specific page access
  if (requiredPage && user) {
    // Admin has access to everything
    if (user.pageAccess === 'Admin') {
      return <>{children}</>;
    }

    // Check if the page is in the allowed list
    if (!user.allowedPages?.includes(requiredPage)) {
      return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;