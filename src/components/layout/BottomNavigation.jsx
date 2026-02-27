import { useState, useEffect } from 'react';
import {
  Home,
  History,
  User,
  Users,
  Tag,
  Bell,
  Settings,
  Target,
  Plus,
  Menu,
  X,
  TrendingUp,
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const BottomNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);

  const isAdmin = user?.role === 'admin';
  const isModerator = user?.role === 'moderator';
  const shouldShow = !!isAuthenticated && (isAdmin || isModerator);

  // Determine active tab based on current path
  const getActiveTab = () => {
    const path = location.pathname;
    if (path === '/dashboard' || path === '/') return 'feed';
    if (path === '/history') return 'history';
    if (path === '/profile') return 'profile';
    if (path === '/admin/users') return 'admin-users';
    if (path === '/admin/posts') return 'admin-posts';
    if (path === '/admin/breaking-news') return 'admin-breaking-news';
    if (path === '/admin/trending') return 'admin-trending';
    if (path === '/announcements') return 'admin-announcements';
    if (path === '/admin/settings') return 'admin-settings';
    if (path === '/ads') return 'ads';
    if (path === '/new-post') return 'new-post';
    return null;
  };

  const activeTab = getActiveTab();

  // Base navigation items for all users
  const baseNavigationItems = [
    {
      id: 'feed',
      label: 'Feed',
      icon: Home,
      path: '/dashboard',
    },
    {
      id: 'history',
      label: 'History',
      icon: History,
      path: '/history',
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: User,
      path: '/profile',
    },
  ];

  // Admin/Moderator additional items
  const adminNavigationItems = [
    {
      id: 'new-post',
      label: 'New Post',
      icon: Plus,
      path: '/new-post',
    },
    {
      id: 'ads',
      label: 'Ads',
      icon: Target,
      path: '/ads',
    },
    {
      id: 'admin-users',
      label: 'Users',
      icon: Users,
      path: '/admin/users',
    },
    {
      id: 'admin-posts',
      label: 'Posts',
      icon: Tag,
      path: '/admin/posts',
    },
    {
      id: 'admin-breaking-news',
      label: 'Breaking',
      icon: Bell,
      path: '/admin/breaking-news',
    },
    {
      id: 'admin-trending',
      label: 'Trending',
      icon: TrendingUp,
      path: '/admin/trending',
    },
    {
      id: 'admin-announcements',
      label: 'Announce',
      icon: Bell,
      path: '/announcements',
    },
    {
      id: 'admin-settings',
      label: 'Settings',
      icon: Settings,
      path: '/admin/settings',
    },
  ];

  // Combine navigation items based on user role
  const allNavigationItems = isAdmin
    ? [...baseNavigationItems, ...adminNavigationItems]
    : isModerator
    ? [...baseNavigationItems, ...adminNavigationItems.slice(0, 2)] // Only New Post and Ads for moderators
    : baseNavigationItems;

  // Get main nav items - always show exactly 3 items
  // For admin/moderator: Feed, History, More (Profile goes to expanded menu)
  // For regular users: Feed, History, Profile
  const mainNavItems = isAdmin || isModerator
    ? [
        baseNavigationItems[0], // Feed
        baseNavigationItems[1], // History
        {
          id: 'more',
          label: 'More',
          icon: Menu,
          path: null, // Special case - opens menu
        },
      ]
    : baseNavigationItems.slice(0, 3); // Feed, History, Profile
  
  // Get remaining items for expanded menu
  const expandedNavItems = isAdmin || isModerator
    ? [
        baseNavigationItems[2], // Profile
        ...adminNavigationItems,
      ]
    : [];

  // Close expanded menu when route changes
  useEffect(() => {
    setIsExpanded(false);
  }, [location.pathname]);

  // Close expanded menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isExpanded && !event.target.closest('.bottom-nav-container')) {
        setIsExpanded(false);
      }
    };

    if (isExpanded) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [isExpanded]);

  const handleNavClick = (path) => {
    navigate(path);
    setIsExpanded(false);
  };

  const renderNavItem = (item, isMain = false) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
    const isMoreButton = item.id === 'more';

            return (
              <button
                key={item.id}
        onClick={() => {
          if (isMoreButton) {
            setIsExpanded(!isExpanded);
          } else {
            handleNavClick(item.path);
          }
        }}
        className={`flex flex-col items-center justify-center transition-all duration-200 relative ${
          isMain
            ? 'flex-1 h-full min-w-0 px-1'
            : 'w-full px-4 py-3 hover:bg-gray-50'
        } ${
          isActive || (isMoreButton && isExpanded)
            ? 'text-[var(--color-primary)]'
            : 'text-gray-600'
        }`}
                >
        {isMoreButton && isExpanded ? (
          <X className={`${isMain ? 'w-5 h-5 mb-1' : 'w-6 h-6 mb-1.5'}`} />
        ) : (
                  <Icon
            className={`${isMain ? 'w-5 h-5 mb-1' : 'w-6 h-6 mb-1.5'} ${
                      isActive ? 'text-[var(--color-primary)]' : ''
                    }`}
                  />
        )}
        <span className={`${isMain ? 'text-xs' : 'text-sm'} font-medium text-center leading-tight truncate w-full`}>
                    {item.label}
                  </span>
        {(isActive || (isMoreButton && isExpanded)) && isMain && (
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-12 h-0.5 bg-[var(--color-primary)] rounded-full" />
        )}
        {isActive && !isMain && (
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-[var(--color-primary)] rounded-r-full" />
                  )}
                </button>
              );
  };

  // IMPORTANT: return must be AFTER hooks to avoid hooks-order violations when auth changes.
  if (!shouldShow) return null;

  return (
    <>
      {/* Expanded Menu Overlay */}
      {isExpanded && (isAdmin || isModerator) && expandedNavItems.length > 0 && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity duration-300"
          onClick={() => setIsExpanded(false)}
        />
      )}

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bottom-nav-container">
        {/* Expanded Menu Panel */}
        {isExpanded && (isAdmin || isModerator) && expandedNavItems.length > 0 && (
          <div className="absolute bottom-full left-0 right-0 bg-white rounded-t-3xl border-t border-x border-gray-200 max-h-[60vh] overflow-y-auto animate-slide-up" style={{ borderTopLeftRadius: '24px', borderTopRightRadius: '24px' }}>
            {/* Handle bar */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-12 h-1 bg-gray-300 rounded-full" />
            </div>

            {/* Menu Header */}
            <div className="px-4 py-3 border-b border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900">
                More Options
              </h3>
            </div>

            {/* Menu Items - Grid Layout 3 columns */}
            <div className="grid grid-cols-3 gap-2 p-3">
              {expandedNavItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.path)}
                  className={`flex flex-col items-center justify-center p-3 rounded-lg transition-all duration-200 relative ${
                    activeTab === item.id
                      ? 'bg-gray-100 text-[var(--color-primary)]'
                      : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <item.icon className="w-6 h-6 mb-1.5" />
                  <span className="text-xs font-medium text-center leading-tight">
                    {item.label}
                  </span>
                  {activeTab === item.id && (
                    <div className="absolute top-1 right-1 w-2 h-2 bg-[var(--color-primary)] rounded-full" />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Main Navigation Bar - Curved Top */}
        <div className={`bg-white border-t border-gray-200 shadow-2xl safe-area-bottom transition-all duration-300 ${isExpanded ? 'border-t-0' : ''}`} style={{ borderTopLeftRadius: isExpanded ? '0' : '24px', borderTopRightRadius: isExpanded ? '0' : '24px' }}>
          <div className="flex items-center justify-between h-16 px-1 pb-safe">
            {/* Main 3 Navigation Items - No gaps */}
            {mainNavItems.map((item) => renderNavItem(item, true))}
          </div>
      </div>
    </nav>

      {/* Add CSS for slide-up animation */}
      <style>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </>
  );
};

export default BottomNavigation;
