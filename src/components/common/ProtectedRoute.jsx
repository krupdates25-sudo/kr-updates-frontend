import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const ProtectedRoute = ({ children, requiredRole = null }) => {
  const { user, loading, isAuthenticated } = useAuth();

  console.log(
    'ProtectedRoute - loading:',
    loading,
    'isAuthenticated:',
    isAuthenticated,
    'user:',
    user,
    'requiredRole:',
    requiredRole
  );

  // Show loading state while checking authentication
  if (loading) {
    console.log('ProtectedRoute showing loading spinner');
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Redirect to auth if not authenticated
  if (!isAuthenticated) {
    console.log('ProtectedRoute redirecting to /auth - not authenticated');
    return <Navigate to="/auth" replace />;
  }

  // Check role-based access if required
  if (requiredRole && user?.role !== requiredRole) {
    console.log(
      'ProtectedRoute redirecting to /unauthorized - insufficient role'
    );
    return <Navigate to="/unauthorized" replace />;
  }

  console.log('ProtectedRoute rendering children');
  return children;
};

export default ProtectedRoute;
