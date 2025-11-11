import { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import LoginForm from '../components/auth/LoginForm';
import RegisterForm from '../components/auth/RegisterForm';
import Logo from '../components/common/Logo';
import { useAuth } from '../contexts/AuthContext';

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const navigate = useNavigate();
  const { user, isAuthenticated, login, register } = useAuth();

  // Early return if authenticated - use Navigate component for reliable redirect
  // This is checked on every render, so it will redirect immediately when auth state changes
  if (isAuthenticated && user) {
    console.log('AuthPage: User authenticated, redirecting to /dashboard');
    return <Navigate to="/dashboard" replace />;
  }

  const handleLoginSuccess = async (credentials) => {
    try {
      console.log('AuthPage: Login attempt with:', credentials);
      const result = await login(credentials);
      console.log('AuthPage: Login result:', result);

      if (result.success && result.user) {
        console.log('AuthPage: Login successful, user:', result.user);

        // Always redirect to dashboard regardless of role
        const redirectPath = '/dashboard';
        console.log('AuthPage: Redirecting to:', redirectPath);

        // Use setTimeout to ensure state has updated
        setTimeout(() => {
          navigate(redirectPath, { replace: true });
        }, 100);

        return result;
      } else {
        console.error('AuthPage: Login failed:', result.error);
        // Don't redirect on failed login, just return the error
        return result;
      }
    } catch (error) {
      console.error('AuthPage: Login error:', error);
      return { success: false, error: error.message };
    }
  };

  const handleRegisterSuccess = async (responseData) => {
    try {
      console.log('Registration successful, response data:', responseData);

      // Store user email for verification page
      if (responseData.data?.user?.email) {
        localStorage.setItem('pendingVerificationEmail', responseData.data.user.email);
      }

      // Redirect to email verification page
      navigate('/verify-email', { replace: true });

      return { success: true, user: responseData.data?.user };
    } catch (error) {
      console.error('Registration success handler error:', error);
      return { success: false, error: error.message };
    }
  };

  const toggleForm = () => {
    setIsLogin(!isLogin);
  };

  return (
    <div className="min-h-screen bg-white flex">
      {/* Left side - Form */}
      <div className="flex-1 flex items-center justify-center px-4 py-8 lg:px-8">
        <div className="w-full max-w-md">
          {/* Brand */}
          <div className="mb-12">
            <Logo size="lg" className="mb-8" />
          </div>

          {/* Form */}
          <div className="relative">
            {isLogin ? (
              <LoginForm
                onLoginSuccess={handleLoginSuccess}
                onToggleForm={toggleForm}
              />
            ) : (
              <RegisterForm
                onRegisterSuccess={handleRegisterSuccess}
                onToggleForm={toggleForm}
              />
            )}
          </div>
        </div>
      </div>

      {/* Right side - Illustration */}
      <div className="hidden lg:flex flex-1 items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 p-8">
        <div className="text-center max-w-md">
          {/* Illustration */}
          <div className="w-80 h-80 mx-auto mb-8 bg-gradient-to-br from-blue-500 to-slate-600 rounded-3xl flex items-center justify-center relative overflow-hidden shadow-2xl">
            {/* Modern device mockup */}
            <div className="w-40 h-64 bg-white rounded-3xl shadow-2xl flex items-center justify-center relative border-4 border-gray-100">
              {/* Screen content */}
              <div className="w-32 h-56 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl p-4 flex flex-col items-center justify-center">
                {/* Header */}
                <div className="w-full bg-white rounded-lg p-3 mb-4 shadow-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-blue-500 rounded-lg flex items-center justify-center">
                      <svg
                        className="w-3 h-3 text-white"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z" />
                      </svg>
                    </div>
                    <div className="text-xs font-semibold text-gray-700">
                      NewsHub
                    </div>
                  </div>
                </div>

                {/* Content blocks */}
                <div className="w-full space-y-2">
                  <div className="bg-white rounded-lg p-2 shadow-sm">
                    <div className="w-full h-2 bg-gray-200 rounded mb-1"></div>
                    <div className="w-3/4 h-2 bg-gray-100 rounded"></div>
                  </div>
                  <div className="bg-white rounded-lg p-2 shadow-sm">
                    <div className="w-full h-2 bg-gray-200 rounded mb-1"></div>
                    <div className="w-2/3 h-2 bg-gray-100 rounded"></div>
                  </div>
                  <div className="bg-white rounded-lg p-2 shadow-sm">
                    <div className="w-full h-2 bg-gray-200 rounded mb-1"></div>
                    <div className="w-4/5 h-2 bg-gray-100 rounded"></div>
                  </div>
                </div>
              </div>

              {/* Home indicator */}
              <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-16 h-1 bg-gray-300 rounded-full"></div>
            </div>

            {/* Floating security elements */}
            <div className="absolute top-8 left-8 w-12 h-12 bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg flex items-center justify-center">
              <svg
                className="w-6 h-6 text-green-500"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </div>

            <div className="absolute bottom-8 right-8 w-12 h-12 bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg flex items-center justify-center">
              <svg
                className="w-6 h-6 text-blue-500"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                  clipRule="evenodd"
                />
              </svg>
            </div>

            <div className="absolute top-1/2 left-4 w-10 h-10 bg-white/80 backdrop-blur-sm rounded-xl shadow-lg flex items-center justify-center">
              <svg
                className="w-5 h-5 text-indigo-500"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>

            {/* Decorative circles */}
            <div className="absolute top-4 right-4 w-6 h-6 bg-white/30 rounded-full"></div>
            <div className="absolute bottom-4 left-4 w-4 h-4 bg-white/30 rounded-full"></div>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900">
              Secure & Professional
            </h2>
            <p className="text-gray-600 leading-relaxed">
              Experience enterprise-grade security with our modern
              authentication system. Your data is protected with
              industry-standard encryption and secure protocols.
            </p>

            {/* Features */}
            <div className="grid grid-cols-2 gap-4 mt-8">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                  <svg
                    className="w-6 h-6 text-blue-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <p className="text-sm font-semibold text-gray-700">
                  Secure Login
                </p>
              </div>

              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                  <svg
                    className="w-6 h-6 text-green-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <p className="text-sm font-semibold text-gray-700">
                  Verified Access
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
