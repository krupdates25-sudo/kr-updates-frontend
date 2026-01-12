import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import Logo from '../components/common/Logo';
import LoginForm from '../components/auth/LoginForm';
import { useAuth } from '../contexts/AuthContext';

const AdminLogin = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, login, logout } = useAuth();
  const [error, setError] = useState(null);

  if (isAuthenticated && user?.role === 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  const handleLoginSuccess = async (credentials) => {
    setError(null);
    try {
      const result = await login(credentials);
      const loggedInUser = result?.user || result?.data?.user;

      if (!result?.success || !loggedInUser) {
        setError(result?.error || 'Login failed');
        return result;
      }

      if (!['admin', 'moderator'].includes(loggedInUser.role)) {
        // Prevent public/non-staff accounts from using the hidden login
        await logout();
        setError('This login is for staff only.');
        return { success: false, error: 'Staff only' };
      }

      // All users go to dashboard after login
      navigate('/dashboard', {
        replace: true,
      });
      return result;
    } catch (e) {
      setError(e?.message || 'Login failed');
      return { success: false, error: e?.message || 'Login failed' };
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8">
          <Logo size="lg" className="mb-4" />
          <h1 className="text-xl font-semibold text-gray-900">Admin Login</h1>
          <p className="text-sm text-gray-600">
            This page is not for public users.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg border border-red-200 bg-red-50 text-red-700 text-sm">
            {error}
          </div>
        )}

        <LoginForm onLoginSuccess={handleLoginSuccess} onToggleForm={() => {}} />
      </div>
    </div>
  );
};

export default AdminLogin;


