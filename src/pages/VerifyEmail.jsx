import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Mail,
  CheckCircle,
  AlertCircle,
  Loader,
  RefreshCw,
  ArrowRight,
} from 'lucide-react';
import Logo from '../components/common/Logo';
import authService from '../services/authService';

const VerifyEmail = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    // Get email from localStorage or URL params
    const storedEmail = localStorage.getItem('pendingVerificationEmail');
    const emailParam = searchParams.get('email');
    setEmail(emailParam || storedEmail || '');
  }, [searchParams]);

  const handleResendVerification = async () => {
    if (!email) {
      setMessage({
        type: 'error',
        text: 'Please enter your email address',
      });
      return;
    }

    setResending(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await authService.resendVerification(email);
      if (response.success) {
        setMessage({
          type: 'success',
          text: 'Verification email sent! Please check your inbox.',
        });
      } else {
        setMessage({
          type: 'error',
          text: response.message || 'Failed to send verification email',
        });
      }
    } catch (error) {
      console.error('Error resending verification:', error);
      setMessage({
        type: 'error',
        text:
          error.response?.data?.message ||
          'Failed to send verification email. Please try again.',
      });
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 text-center">
          <Logo size="lg" className="mb-4" />
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
              <Mail className="w-10 h-10 text-white" />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold text-gray-900 text-center mb-3">
            Check Your Email
          </h1>
          <p className="text-gray-600 text-center mb-6 text-lg">
            We've sent a verification link to
          </p>

          {/* Email Display */}
          {email && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-blue-900 font-semibold text-center break-all">
                {email}
              </p>
            </div>
          )}

          {/* Instructions */}
          <div className="space-y-4 mb-6">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-blue-600 font-semibold text-sm">1</span>
              </div>
              <p className="text-gray-700 leading-relaxed">
                Open your email inbox and look for a message from{' '}
                <span className="font-semibold">KR Updates</span>
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-blue-600 font-semibold text-sm">2</span>
              </div>
              <p className="text-gray-700 leading-relaxed">
                Click the{' '}
                <span className="font-semibold">"Verify Email Address"</span>{' '}
                button in the email
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-blue-600 font-semibold text-sm">3</span>
              </div>
              <p className="text-gray-700 leading-relaxed">
                You'll be automatically redirected to your dashboard
              </p>
            </div>
          </div>

          {/* Message Display */}
          {message.text && (
            <div
              className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
                message.type === 'success'
                  ? 'bg-green-50 border border-green-200'
                  : 'bg-red-50 border border-red-200'
              }`}
            >
              {message.type === 'success' ? (
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              )}
              <p
                className={`text-sm ${
                  message.type === 'success' ? 'text-green-800' : 'text-red-800'
                }`}
              >
                {message.text}
              </p>
            </div>
          )}

          {/* Resend Button */}
          <div className="space-y-4">
            <button
              onClick={handleResendVerification}
              disabled={resending || !email}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {resending ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <RefreshCw className="w-5 h-5" />
                  Resend Verification Email
                </>
              )}
            </button>

            {/* Back to Login */}
            <button
              onClick={() => navigate('/auth')}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 text-gray-700 hover:text-gray-900 font-medium transition-colors"
            >
              Back to Login
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Help Text */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500 text-center">
              Didn't receive the email? Check your spam folder or try resending.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
