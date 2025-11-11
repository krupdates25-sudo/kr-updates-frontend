import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, Loader, ArrowRight, AlertCircle } from 'lucide-react';
import Logo from '../components/common/Logo';
import { useAuth } from '../contexts/AuthContext';

const VerifyEmailSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { updateUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = searchParams.get('token');

    if (!token) {
      setError('No verification token found');
      setLoading(false);
      return;
    }

    // Store token and fetch user profile
    const verifyAndLogin = async () => {
      try {
        // Store token
        localStorage.setItem('authToken', token);

        // Fetch user profile to get full user data
        const response = await fetch('http://localhost:5000/api/v1/auth/me', {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          if (data.data) {
            // Update auth context
            updateUser(data.data);
            localStorage.setItem('user', JSON.stringify(data.data));

            // Clear pending verification email
            localStorage.removeItem('pendingVerificationEmail');

            // Redirect to dashboard after a short delay
            setTimeout(() => {
              navigate('/dashboard', { replace: true });
            }, 2000);
          } else {
            throw new Error('Failed to fetch user data');
          }
        } else {
          throw new Error('Failed to verify token');
        }
      } catch (err) {
        console.error('Verification error:', err);
        setError('Failed to complete verification. Please try logging in.');
        setLoading(false);
      }
    };

    verifyAndLogin();
  }, [searchParams, navigate, updateUser]);

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Verification Failed
            </h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => navigate('/auth')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 text-center">
          <Logo size="lg" className="mb-4" />
        </div>

        {/* Success Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 text-center">
          {loading ? (
            <>
              <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Loader className="w-10 h-10 text-white animate-spin" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-3">
                Verifying...
              </h1>
              <p className="text-gray-600 mb-6">
                Please wait while we complete your verification
              </p>
            </>
          ) : (
            <>
              <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg animate-pulse">
                <CheckCircle className="w-12 h-12 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-3">
                Email Verified!
              </h1>
              <p className="text-gray-600 mb-6">
                Your email has been successfully verified. Redirecting to
                dashboard...
              </p>
              <div className="flex items-center justify-center gap-2 text-blue-600">
                <Loader className="w-5 h-5 animate-spin" />
                <span className="text-sm">Redirecting</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifyEmailSuccess;
