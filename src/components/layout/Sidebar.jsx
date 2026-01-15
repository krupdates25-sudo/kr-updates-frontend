import {
  Home,
  TrendingUp,
  Bookmark,
  History,
  Settings,
  Users,
  Tag,
  Menu,
  X,
  Plus,
  Sparkles,
  Code,
  Zap,
  Shield,
  UserPlus,
  MessageSquare,
  User,
  LogOut,
  Target,
  Bell,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Logo from '../common/Logo';
import { useEffect, useMemo } from 'react';

const Sidebar = ({ isOpen, onToggle, activeTab, onTabChange }) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Removed automatic refreshProfile call to prevent infinite loops
  // Profile is already loaded from AuthContext on app initialization

  // Check user permissions
  const isAdmin = user?.role === 'admin';
  const isModerator = user?.role === 'moderator';
  
  // On mobile, sidebar should only be visible for Admin and Moderator
  // Regular users should use bottom navigation instead
  const shouldShowSidebarOnMobile = isAdmin || isModerator;

  // More robust permission check
  const canCreatePosts = useMemo(() => {
    if (!user) return false;

    console.log('🔍 Permission check - User:', user);
    console.log('🔍 Permission check - Role:', user.role);
    console.log('🔍 Permission check - canPublish:', user.canPublish);
    console.log(
      '🔍 Permission check - canPublish type:',
      typeof user.canPublish
    );

    // Admin can always create posts
    if (user.role === 'admin') {
      console.log('🔍 Admin user - can create posts');
      return true;
    }

    // For moderators and users, check canPublish permission
    if (user.role === 'moderator' || user.role === 'user') {
      const canPublish = user.canPublish === true;
      console.log('🔍 Non-admin user - canPublish check result:', canPublish);
      return canPublish;
    }

    console.log('🔍 Unknown role - cannot create posts');
    return false;
  }, [user]);

  const canManageAds =
    user && (user.role === 'admin' || user.role === 'moderator');

  console.log('Sidebar - canCreatePosts:', canCreatePosts);

  // Base navigation items for all users
  const baseNavigationItems = [
    {
      id: 'feed',
      label: 'My Feed',
      icon: Home,
      count: null,
      path: '/dashboard',
    },
    // Trending functionality commented out as requested
    // {
    //   id: 'trending',
    //   label: 'Trending',
    //   icon: TrendingUp,
    //   count: null,
    //   path: '/trending',
    // },
    // Bookmarks page removed
    // {
    //   id: 'bookmarks',
    //   label: 'Bookmarks',
    //   icon: Bookmark,
    //   count: null,
    //   path: '/bookmarks',
    // },
    {
      id: 'history',
      label: 'History',
      icon: History,
      count: null,
      path: '/history',
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: User,
      count: null,
      path: '/profile',
    },
  ];

  // Admin/Moderator only navigation items
  const adminNavigationItems = [
    {
      id: 'ads',
      label: 'Ad Management',
      icon: Target,
      count: null,
      path: '/ads',
    },
  ];

  // Combine navigation items based on user role
  const navigationItems = canManageAds
    ? [...baseNavigationItems, ...adminNavigationItems]
    : baseNavigationItems;

  // Admin navigation items
  const adminItems = [
    {
      id: 'admin-users',
      label: 'User Management',
      icon: Users,
      path: '/admin/users',
    },
    {
      id: 'admin-posts',
      label: 'Posts Management',
      icon: Tag,
      path: '/admin/posts',
    },
    {
      id: 'admin-breaking-news',
      label: 'Breaking News',
      icon: Bell,
      path: '/admin/breaking-news',
    },
    {
      id: 'admin-trending',
      label: 'Trending Posts',
      icon: TrendingUp,
      path: '/admin/trending',
    },
    {
      id: 'admin-announcements',
      label: 'Announcements',
      icon: Bell,
      path: '/announcements',
    },
    {
      id: 'admin-subscribers',
      label: 'Update Subscribers',
      icon: MessageSquare,
      path: '/admin/subscribers',
    },
    // {
    //   id: 'admin-notifications',
    //   label: 'Notifications',
    //   icon: Bell,
    //   path: '/notifications',
    // },
    // {
    //   id: 'admin-integrations',
    //   label: 'Integrations',
    //   icon: MessageSquare,
    //   path: '/admin/integrations',
    // },
  ];

  const renderNavItem = (item) => {
    const isActive = activeTab === item.id;
    const Icon = item.icon || Tag;

    return (
      <button
        key={item.id}
        onClick={() => {
          if (item.path) {
            navigate(item.path);
          } else if (onTabChange) {
            onTabChange(item.id);
          }
        }}
        className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors relative rounded-lg mx-2 ${
          isActive
            ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 font-semibold'
            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100'
        }`}
      >
        {/* Active indicator */}
        {isActive && (
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-gray-800 dark:bg-gray-200 rounded-r-full"></div>
        )}
        <Icon
          className={`w-5 h-5 transition-colors ${
            isActive
              ? 'text-gray-800 dark:text-gray-200'
              : 'text-gray-500 dark:text-gray-400'
          }`}
        />
        <span className="flex-1 font-medium truncate">{item.label}</span>
        {item.count && (
          <span
            className={`text-xs px-2 py-1 rounded-full font-semibold transition-colors ${
              isActive
                ? 'bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-800'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
            }`}
          >
            {item.count}
          </span>
        )}
      </button>
    );
  };

  const renderAdminItem = (item) => {
    const Icon = item.icon;

    return (
      <button
        key={item.id}
        onClick={() => navigate(item.path)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors relative rounded-lg mx-2 text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400"
      >
        <Icon className="w-5 h-5 text-red-500" />
        <span className="flex-1 font-medium truncate">{item.label}</span>
      </button>
    );
  };

  return (
    <>
      {/* Desktop overlay when sidebar is open */}
      {isOpen && (
        <div
          className="hidden lg:block fixed inset-0 bg-gray-800/50 z-40"
          onClick={onToggle}
        />
      )}

      {/* Sidebar - Completely hidden on mobile (lg+), toggleable on desktop */}
      <div
        className={`
        fixed inset-y-0 left-0 z-50 w-72 
        bg-white dark:bg-gray-800
        transform transition-transform duration-300 ease-in-out flex-col h-screen 
        shadow-xl border-r border-gray-200 dark:border-gray-700
        overflow-hidden
        hidden lg:flex
        ${isOpen ? 'lg:translate-x-0' : '-translate-x-full'}
      `}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
          <Logo size="md" />
          <button
            onClick={onToggle}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
        </div>

        {/* New Post Button */}
        {canCreatePosts && (
          <div className="px-4 py-4">
            <button
              onClick={() => navigate('/new-post')}
              className="w-full flex items-center gap-3 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span>New Post</span>
            </button>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-2 scrollbar-hide">
          <div className="space-y-1">
            {navigationItems.map((item) => renderNavItem(item))}
          </div>

          {/* Admin Section */}
          {isAdmin && (
            <div className="mt-8">
              <div className="px-6 py-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-red-600 dark:text-red-400 flex items-center gap-2">
                  <Shield className="w-3 h-3" />
                  Administration
                </h3>
              </div>
              <div className="space-y-1">
                {adminItems.map((item) => renderAdminItem(item))}
              </div>
            </div>
          )}
        </nav>

        {/* Settings - Admin Only */}
        {isAdmin && (
          <div className="border-t border-gray-200 dark:border-gray-700 p-4">
            <button
              onClick={() => navigate('/admin/settings')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                activeTab === 'settings'
                  ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 font-semibold'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
            >
              <Settings
                className={`w-5 h-5 ${
                  activeTab === 'settings'
                    ? 'text-gray-800 dark:text-gray-200'
                    : 'text-gray-500 dark:text-gray-400'
                }`}
              />
              <span className="font-medium truncate">Settings</span>
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default Sidebar;
