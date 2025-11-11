import { useState } from 'react';
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  User,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import authService from '../../services/authService';

const RegisterForm = ({ onRegisterSuccess, onToggleForm }) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState({ type: '', text: '' });

  const validateForm = () => {
    const newErrors = {};

    // Username validation - simplified
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    }

    // Email validation - simplified
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password validation - simplified
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    // Name validation - simplified
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear specific error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      setMessage({
        type: 'error',
        text: 'Please fill in all required fields correctly',
      });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const { confirmPassword: _, ...registrationData } = formData;
      const response = await authService.register(registrationData);
      console.log('Registration response:', response);
      // Check if registration was actually successful
      if (response && response.statusCode === 201) {
        setMessage({
          type: 'success',
          text: 'Account created successfully! Welcome to newsfeed!',
        });

        // Clear form
        setFormData({
          username: '',
          email: '',
          password: '',
          confirmPassword: '',
          firstName: '',
          lastName: '',
        });

        // Call parent component success handler immediately
        onRegisterSuccess && onRegisterSuccess(response.data);
      } else {
        // Registration failed - show backend error messages
        let errorMessage = 'Registration failed. Please try again.';

        if (response?.data?.message) {
          errorMessage = response.data.message;
        } else if (
          response?.data?.errors &&
          Array.isArray(response.data.errors)
        ) {
          // Join all error messages
          errorMessage = response.data.errors.join('. ');
        }

        setMessage({ type: 'error', text: errorMessage });
      }
    } catch (error) {
      console.error('Registration error:', error);
      console.error('Error response data:', error.response?.data);

      let errorMessage = 'Registration failed. Please try again.';

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (
        error.response?.data?.errors &&
        Array.isArray(error.response.data.errors)
      ) {
        // Handle validation errors array
        errorMessage = error.response.data.errors.join('. ');
      } else if (error.response?.status === 400) {
        errorMessage = 'Please check your information and try again.';
      } else if (error.response?.status === 409) {
        errorMessage =
          'Username or email already exists. Please try different ones.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-slate-900 mb-3 leading-tight">
          Create Account
        </h1>
        <p className="text-slate-600 text-lg font-medium">
          Join our community and get started today
        </p>
      </div>

      {/* Message Display */}
      {message.text && (
        <div
          className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
            message.type === 'error'
              ? 'bg-red-50 border border-red-200 text-red-700'
              : 'bg-green-50 border border-green-200 text-green-700'
          }`}
        >
          {message.type === 'error' ? (
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
          ) : (
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
          )}
          <span className="text-sm font-medium">{message.text}</span>
        </div>
      )}

      {/* Register Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Name Fields */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Full Name
          </label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className={`w-full px-4 py-4 border rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all duration-200 font-medium ${
                  errors.firstName
                    ? 'border-red-300 bg-red-50'
                    : 'border-slate-300 bg-white hover:border-slate-400'
                }`}
                placeholder="First name"
                disabled={loading}
              />
              {errors.firstName && (
                <p className="mt-1 text-xs text-red-600 font-medium">
                  {errors.firstName}
                </p>
              )}
            </div>

            <div>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                className={`w-full px-4 py-4 border rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all duration-200 font-medium ${
                  errors.lastName
                    ? 'border-red-300 bg-red-50'
                    : 'border-slate-300 bg-white hover:border-slate-400'
                }`}
                placeholder="Last name"
                disabled={loading}
              />
              {errors.lastName && (
                <p className="mt-1 text-xs text-red-600 font-medium">
                  {errors.lastName}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Email Field */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Email Address
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className={`w-full px-4 py-4 border rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all duration-200 font-medium ${
              errors.email
                ? 'border-red-300 bg-red-50'
                : 'border-slate-300 bg-white hover:border-slate-400'
            }`}
            placeholder="Enter your email address"
            disabled={loading}
          />
          {errors.email && (
            <p className="mt-2 text-sm text-red-600 flex items-center gap-1 font-medium">
              <AlertCircle className="w-4 h-4" />
              {errors.email}
            </p>
          )}
        </div>

        {/* Username Field */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Username
          </label>
          <input
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
            className={`w-full px-4 py-4 border rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all duration-200 font-medium ${
              errors.username
                ? 'border-red-300 bg-red-50'
                : 'border-slate-300 bg-white hover:border-slate-400'
            }`}
            placeholder="Choose a unique username"
            disabled={loading}
          />
          {errors.username && (
            <p className="mt-2 text-sm text-red-600 flex items-center gap-1 font-medium">
              <AlertCircle className="w-4 h-4" />
              {errors.username}
            </p>
          )}
        </div>

        {/* Password Fields */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={`w-full px-4 py-4 pr-12 border rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all duration-200 font-medium ${
                  errors.password
                    ? 'border-red-300 bg-red-50'
                    : 'border-slate-300 bg-white hover:border-slate-400'
                }`}
                placeholder="Create a strong password"
                disabled={loading}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-4 flex items-center hover:bg-slate-50 rounded-r-xl transition-colors"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5 text-slate-400 hover:text-slate-600" />
                ) : (
                  <Eye className="h-5 w-5 text-slate-400 hover:text-slate-600" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="mt-2 text-sm text-red-600 flex items-center gap-1 font-medium">
                <AlertCircle className="w-4 h-4" />
                {errors.password}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Confirm Password
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={`w-full px-4 py-4 pr-12 border rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all duration-200 font-medium ${
                  errors.confirmPassword
                    ? 'border-red-300 bg-red-50'
                    : 'border-slate-300 bg-white hover:border-slate-400'
                }`}
                placeholder="Confirm your password"
                disabled={loading}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-4 flex items-center hover:bg-slate-50 rounded-r-xl transition-colors"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={loading}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-5 w-5 text-slate-400 hover:text-slate-600" />
                ) : (
                  <Eye className="h-5 w-5 text-slate-400 hover:text-slate-600" />
                )}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="mt-2 text-sm text-red-600 flex items-center gap-1 font-medium">
                <AlertCircle className="w-4 h-4" />
                {errors.confirmPassword}
              </p>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-slate-800 text-white py-4 px-4 rounded-xl font-bold text-lg hover:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
        >
          {loading ? (
            <div className="flex items-center justify-center gap-3">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Creating account...
            </div>
          ) : (
            'Create Account'
          )}
        </button>
      </form>

      {/* Login Link */}
      <div className="mt-8 text-center">
        <p className="text-slate-600 font-medium">
          Already have an account?{' '}
          <button
            type="button"
            onClick={onToggleForm}
            className="text-slate-800 hover:text-slate-900 font-bold transition-colors"
          >
            Sign In
          </button>
        </p>
      </div>
    </div>
  );
};

export default RegisterForm;
