import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import NewPost from './pages/NewPost';
import UserProfile from './pages/UserProfile';
import ProfilePage from './pages/ProfilePage';
import AdminManagement from './pages/AdminManagement';
import PostsManagement from './pages/PostsManagement';
import BreakingNewsManagement from './pages/BreakingNewsManagement';
import CreateBreakingNews from './pages/CreateBreakingNews';
import BreakingNewsPage from './pages/BreakingNewsPage';
import TrendingManagement from './pages/TrendingManagement';
import WhatsAppIntegration from './pages/WhatsAppIntegration';
import History from './pages/History';
// import Trending from './pages/Trending'; // Commented out as trending functionality is disabled
// import Bookmarks from './pages/Bookmarks'; // Removed - bookmarks page disabled
import AdManagement from './pages/AdManagement';
import AnnouncementManagement from './pages/AnnouncementManagement';
import NotificationManagement from './pages/NotificationManagement';
import Settings from './pages/Settings';
import PostPage from './pages/PostPage';
import VerifyEmail from './pages/VerifyEmail';
import VerifyEmailSuccess from './pages/VerifyEmailSuccess';
import ProtectedRoute from './components/common/ProtectedRoute';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import { SettingsProvider } from './contexts/SettingsContext';
import { AdProvider } from './contexts/AdContext';
import ErrorBoundary from './components/common/ErrorBoundary';
import './App.css';

const AdminDashboard = () => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900">
              Admin Dashboard
            </h1>
            <button
              onClick={logout}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              Logout
            </button>
          </div>
          <div className="space-y-4">
            <p className="text-lg">
              Welcome, Admin {user?.firstName} {user?.lastName}!
            </p>
            <p className="text-gray-600">Role: {user?.role}</p>
            <p className="text-gray-600">Email: {user?.email}</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
              <div className="bg-blue-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-blue-900">
                  Manage Users
                </h3>
                <p className="text-blue-700">View and manage user accounts</p>
              </div>
              <div className="bg-green-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-green-900">
                  Manage Posts
                </h3>
                <p className="text-green-700">
                  Create, edit, and manage blog posts
                </p>
              </div>
              <div className="bg-purple-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-purple-900">
                  Analytics
                </h3>
                <p className="text-purple-700">
                  View site statistics and analytics
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const UnauthorizedPage = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <h1 className="text-4xl font-bold text-gray-900 mb-4">
        403 - Unauthorized
      </h1>
      <p className="text-gray-600 mb-8">
        You don't have permission to access this page.
      </p>
      <a
        href="/"
        className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
      >
        Go to Homepage
      </a>
    </div>
  </div>
);

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <SettingsProvider>
          <SocketProvider>
            <AdProvider>
              <Router>
              <div className="App">
                <Routes>
                  {/* Public routes */}
                  <Route path="/auth" element={<AuthPage />} />
                  <Route path="/verify-email" element={<VerifyEmail />} />
                  <Route
                    path="/verify-email-success"
                    element={<VerifyEmailSuccess />}
                  />
                  <Route path="/unauthorized" element={<UnauthorizedPage />} />

                  {/* Test route without ProtectedRoute */}
                  <Route
                    path="/test-dashboard"
                    element={
                      <div className="min-h-screen bg-green-50 flex items-center justify-center">
                        <h1 className="text-2xl font-bold text-green-800">
                          Test Dashboard - Navigation Working!
                        </h1>
                      </div>
                    }
                  />

                  {/* Dashboard route - also accessible at /dashboard for logged-in users */}
                  <Route
                    path="/dashboard"
                    element={<Dashboard />}
                  />

                  <Route
                    path="/new-post"
                    element={
                      <ProtectedRoute>
                        <NewPost />
                      </ProtectedRoute>
                    }
                  />

                  {/* Public homepage - Dashboard */}
                  <Route path="/" element={<Dashboard />} />

                  {/* Public user profile route */}
                  <Route path="/profile/:userId" element={<UserProfile />} />

                  {/* Post page route */}
                  <Route path="/post/:slug" element={<PostPage />} />

                  {/* Breaking News page route */}
                  <Route path="/breaking-news/:id" element={<BreakingNewsPage />} />

                  {/* Current user profile route */}
                  <Route
                    path="/profile"
                    element={
                      <ProtectedRoute>
                        <ProfilePage />
                      </ProtectedRoute>
                    }
                  />

                  {/* Admin only routes */}
                  <Route
                    path="/admin/dashboard"
                    element={
                      <ProtectedRoute requiredRole="admin">
                        <AdminDashboard />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/admin/users"
                    element={
                      <ProtectedRoute requiredRole="admin">
                        <AdminManagement />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/admin/posts"
                    element={
                      <ProtectedRoute requiredRole="admin">
                        <PostsManagement />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/admin/breaking-news"
                    element={
                      <ProtectedRoute requiredRole="admin">
                        <BreakingNewsManagement />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/breaking-news/create"
                    element={
                      <ProtectedRoute requiredRole="admin">
                        <CreateBreakingNews />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/breaking-news/edit/:id"
                    element={
                      <ProtectedRoute requiredRole="admin">
                        <CreateBreakingNews />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/admin/trending"
                    element={
                      <ProtectedRoute requiredRole="admin">
                        <TrendingManagement />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/admin/integrations"
                    element={
                      <ProtectedRoute requiredRole="admin">
                        <WhatsAppIntegration />
                      </ProtectedRoute>
                    }
                  />

                  {/* WhatsApp integration route */}
                  <Route
                    path="/whatsapp-integration"
                    element={
                      <ProtectedRoute>
                        <WhatsAppIntegration />
                      </ProtectedRoute>
                    }
                  />

                  {/* History route */}
                  <Route
                    path="/history"
                    element={
                      <ProtectedRoute>
                        <History />
                      </ProtectedRoute>
                    }
                  />

                  {/* Trending route - commented out as requested */}
                  {/* <Route
                  path="/trending"
                  element={
                    <ProtectedRoute>
                      <Trending />
                    </ProtectedRoute>
                  }
                /> */}

                  {/* Bookmarks route - Removed */}
                  {/* <Route
                    path="/bookmarks"
                    element={
                      <ProtectedRoute>
                        <Bookmarks />
                      </ProtectedRoute>
                    }
                  /> */}

                  {/* Ad Management route */}
                  <Route
                    path="/ads"
                    element={
                      <ProtectedRoute>
                        <AdManagement />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/announcements"
                    element={
                      <ProtectedRoute requiredRole="admin">
                        <AnnouncementManagement />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/notifications"
                    element={
                      <ProtectedRoute requiredRole="admin">
                        <NotificationManagement />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/admin/settings"
                    element={
                      <ProtectedRoute requiredRole="admin">
                        <Settings />
                      </ProtectedRoute>
                    }
                  />

                  {/* Catch all route - redirect to homepage instead of login */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </div>
              </Router>
            </AdProvider>
          </SocketProvider>
        </SettingsProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
