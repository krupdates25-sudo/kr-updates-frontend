import {
  Search,
  Bell,
  User,
  Menu,
  Settings,
  LogOut,
  ChevronDown,
  Shield,
  Edit3,
  Bookmark,
  BookOpen,
  TrendingUp,
  Activity,
  Zap,
  X,
  // Sun, Moon, Monitor - Removed, always using light theme
  FileText,
  Megaphone,
  Tag,
  Clock,
} from 'lucide-react';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
// import { useTheme } from '../../contexts/ThemeContext'; // Removed - always using light theme
import AnnouncementDropdown from '../common/AnnouncementDropdown';
import announcementService from '../../services/announcementService';
import searchService from '../../services/searchService';

const Header = ({ onSidebarToggle }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false); // Mobile search modal
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isAnnouncementOpen, setIsAnnouncementOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [searchResults, setSearchResults] = useState(null);
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const { user, logout } = useAuth();
  const fetchUnreadCountRef = useRef(false);
  // const { theme, toggleTheme } = useTheme(); // Removed - always using light theme

  // Fetch unread announcement count
  useEffect(() => {
    const userId = user?.id || user?._id;
    
    // Prevent multiple simultaneous calls
    if (!userId || fetchUnreadCountRef.current) {
      return;
    }

    const fetchUnreadCount = async () => {
      // Prevent concurrent calls
      if (fetchUnreadCountRef.current) return;
      fetchUnreadCountRef.current = true;
      
      try {
        const response = await announcementService.getUnreadCount();
        setUnreadCount(response.data?.count || 0);
      } catch (error) {
        console.error('Error fetching unread count:', error);
      } finally {
        fetchUnreadCountRef.current = false;
      }
    };

    fetchUnreadCount();
    
    // Poll for updates every 5 minutes
    const interval = setInterval(() => {
      if (!fetchUnreadCountRef.current) {
        fetchUnreadCount();
      }
    }, 5 * 60 * 1000);
    
    return () => {
      clearInterval(interval);
      fetchUnreadCountRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, user?._id]); // Only depend on user ID, not entire user object

  // Search functionality with debouncing
  const performSearch = useCallback(async (query) => {
    if (!query || query.trim().length < 2) {
      setSearchResults(null);
      setSearchSuggestions([]);
      return;
    }

    setIsSearching(true);
    try {
      const [globalResults, suggestions] = await Promise.all([
        searchService.globalSearch(query, 5),
        searchService.getSuggestions(query, 8),
      ]);

      setSearchResults(globalResults.data);
      setSearchSuggestions(suggestions.data || []);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults(null);
      setSearchSuggestions([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim()) {
        performSearch(searchQuery);
      } else {
        setSearchResults(null);
        setSearchSuggestions([]);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [searchQuery, performSearch]);

  const handleLogout = async () => {
    await logout();
    setIsUserMenuOpen(false);
  };

  const isAdmin = user?.role === 'admin';

  // Helper function to render search results (reusable for desktop and mobile)
  const renderSearchResults = () => (
    <>
      {isSearching && (
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500"></div>
          <span className="ml-2 text-sm text-gray-600">Searching...</span>
        </div>
      )}

      {/* Search Results */}
      {searchResults && !isSearching && (
        <div className="space-y-4">
          {/* Posts */}
          {searchResults.posts && searchResults.posts.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Posts ({searchResults.posts.length})
              </p>
              <div className="space-y-1">
                {searchResults.posts.map((post) => (
                  <button
                    key={post.id}
                    className="flex items-start gap-3 w-full p-2 text-left hover:bg-gray-100 rounded-lg transition-colors"
                    onClick={() => {
                      navigate(`/post/${post.slug || String(post._id || post.id || '')}`);
                      setSearchQuery('');
                      setIsSearchFocused(false);
                      setIsSearchModalOpen(false);
                    }}
                  >
                    <div className="flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden bg-gray-100">
                      {post.featuredImage?.url || post.image ? (
                        <img
                          src={post.featuredImage?.url || post.image}
                          alt={post.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <FileText className="w-6 h-6 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {post.title}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {post.excerpt}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-400">
                          {post.category}
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Users */}
          {searchResults.users && searchResults.users.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <User className="w-4 h-4" />
                Users ({searchResults.users.length})
              </p>
              <div className="space-y-1">
                {searchResults.users.map((user) => (
                  <button
                    key={user.id}
                    className="flex items-center gap-3 w-full p-2 text-left hover:bg-gray-100 rounded-lg transition-colors"
                    onClick={() => {
                      navigate(`/profile/${user.username}`);
                      setSearchQuery('');
                      setIsSearchFocused(false);
                      setIsSearchModalOpen(false);
                    }}
                  >
                    <User className="w-4 h-4 text-green-500" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-xs text-gray-500">
                        @{user.username} • {user.role}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Announcements */}
          {searchResults.announcements && searchResults.announcements.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Megaphone className="w-4 h-4" />
                Announcements ({searchResults.announcements.length})
              </p>
              <div className="space-y-1">
                {searchResults.announcements.map((announcement) => (
                  <button
                    key={announcement.id}
                    className="flex items-start gap-3 w-full p-2 text-left hover:bg-gray-100 rounded-lg transition-colors"
                    onClick={() => {
                      if (announcement.actionUrl) {
                        window.location.href = announcement.actionUrl;
                      } else {
                        navigate('/announcements', {
                          state: { searchQuery: announcement.title },
                        });
                      }
                      setSearchQuery('');
                      setIsSearchFocused(false);
                      setIsSearchModalOpen(false);
                    }}
                  >
                    <Megaphone className="w-4 h-4 text-orange-500 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {announcement.title}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {announcement.message}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Categories */}
          {searchResults.categories && searchResults.categories.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Tag className="w-4 h-4" />
                Categories ({searchResults.categories.length})
              </p>
              <div className="space-y-1">
                {searchResults.categories.map((category, index) => (
                  <button
                    key={index}
                    className="flex items-center gap-3 w-full p-2 text-left hover:bg-gray-100 rounded-lg transition-colors"
                    onClick={() => {
                      if (window.location.pathname === '/dashboard') {
                        window.dispatchEvent(
                          new CustomEvent('setCategoryFilter', {
                            detail: { category: category.name },
                          })
                        );
                      } else {
                        navigate('/dashboard', {
                          state: { filterCategory: category.name },
                        });
                      }
                      setSearchQuery('');
                      setIsSearchFocused(false);
                      setIsSearchModalOpen(false);
                    }}
                  >
                    <Tag className="w-4 h-4 text-purple-500" />
                    <span className="text-sm text-gray-700">{category.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Search Suggestions */}
      {searchSuggestions.length > 0 && !searchResults && !isSearching && (
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Suggestions
          </p>
          <div className="space-y-1">
            {searchSuggestions.map((suggestion, index) => (
              <button
                key={index}
                className="flex items-center gap-3 w-full p-2 text-left hover:bg-gray-100 rounded-lg transition-colors"
                onClick={() => {
                  setSearchQuery(suggestion.text);
                  performSearch(suggestion.text);
                }}
              >
                <Search className="w-4 h-4 text-gray-400" />
                <div className="flex-1 min-w-0">
                  <span className="text-sm text-gray-700">{suggestion.text}</span>
                  <span className="text-xs text-gray-500 ml-2">
                    {suggestion.category}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* No Results */}
      {searchQuery && !isSearching && searchResults && searchResults.total === 0 && (
        <div className="text-center py-4">
          <Search className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-500">
            No results found for "{searchQuery}"
          </p>
        </div>
      )}
    </>
  );

  // Get current page name for header display
  const getCurrentPageName = () => {
    const path = location.pathname;
    if (path === '/dashboard' || path === '/') return 'My Feed';
    if (path === '/history') return 'History';
    if (path === '/profile') return 'Profile';
    if (path === '/ads') return 'Ad Management';
    if (path.startsWith('/admin')) return 'Admin Panel';
    return 'KRUPDATES';
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-30 w-full shadow-sm">
      <div className="flex items-center justify-between h-14 sm:h-16 px-3 sm:px-4 md:px-6 w-full">
        {/* Left side - Search and Notifications (Mobile) / Page Name and Search (Desktop) */}
        <div className="flex items-center gap-2 sm:gap-3 md:gap-4 flex-1">
          {/* Burger Menu Button - Desktop only */}
          <button
            onClick={onSidebarToggle}
            className="hidden lg:flex p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Toggle sidebar"
          >
            <Menu className="w-5 h-5 text-gray-600" />
          </button>

          {/* Current Page Name - Desktop */}
          <div className="hidden lg:block">
            <h1 className="text-lg font-semibold text-gray-900">
              {getCurrentPageName()}
            </h1>
          </div>

          {/* Mobile: Search and Notifications on Left */}
          <div className="lg:hidden flex items-center gap-2">
            {/* Search Icon Button */}
          <button
            onClick={() => setIsSearchModalOpen(true)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Search"
          >
            <Search className="w-5 h-5 text-gray-600" />
          </button>

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setIsAnnouncementOpen(!isAnnouncementOpen)}
                className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Bell className="w-5 h-5 text-gray-600" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-semibold shadow-lg animate-pulse">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>

              <AnnouncementDropdown
                isOpen={isAnnouncementOpen}
                onClose={() => setIsAnnouncementOpen(false)}
                unreadCount={unreadCount}
                onUnreadCountChange={setUnreadCount}
              />
            </div>
          </div>

          {/* Desktop: Full Search Bar */}
          <div className="hidden lg:flex flex-1 max-w-xl">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search articles, authors, topics..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm bg-white text-gray-900 placeholder-gray-500"
              />

              {/* Desktop Search suggestions overlay */}
              {isSearchFocused &&
                (searchQuery ||
                  searchResults ||
                  searchSuggestions.length > 0) && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-xl z-50 max-h-80 overflow-y-auto">
                    <div className="p-4">{renderSearchResults()}</div>
                  </div>
                )}
            </div>
          </div>
        </div>

        {/* Right side - Notifications (Desktop) and User menu */}
        <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3">
          {/* Notifications - Desktop only */}
          <div className="hidden lg:block relative">
            <button
              onClick={() => setIsAnnouncementOpen(!isAnnouncementOpen)}
              className="relative p-2 md:p-2.5 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Bell className="w-5 h-5 text-gray-600" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-semibold shadow-lg animate-pulse">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>

            <AnnouncementDropdown
              isOpen={isAnnouncementOpen}
              onClose={() => setIsAnnouncementOpen(false)}
              unreadCount={unreadCount}
              onUnreadCountChange={setUnreadCount}
            />
          </div>

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-1.5 sm:gap-2 md:gap-3 p-1 sm:p-1.5 md:p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-blue-600 flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-xs sm:text-sm">
                  {user?.firstName?.charAt(0) || 'U'}
                </span>
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-semibold text-gray-700">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs capitalize flex items-center gap-1 text-gray-500">
                  {isAdmin && <Shield className="w-3 h-3 text-red-500" />}
                  {user?.role}
                </p>
              </div>
              <ChevronDown
                className={`hidden md:block w-4 h-4 transition-transform duration-200 text-gray-500 ${
                  isUserMenuOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* Dropdown Menu */}
            {isUserMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsUserMenuOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-72 bg-white border border-gray-200 rounded-lg shadow-xl z-50">
                  {/* User info */}
                  <div className="p-4 border-b border-gray-200 bg-gray-50">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-blue-600 flex items-center justify-center shadow-lg">
                        <span className="text-white font-bold text-lg">
                          {user?.firstName?.charAt(0) || 'U'}
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800">
                          {user?.firstName} {user?.lastName}
                        </p>
                        <p className="text-sm text-gray-600">
                          {user?.email}
                        </p>
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full mt-1 capitalize ${
                            isAdmin
                              ? 'bg-red-100 text-red-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {isAdmin && <Shield className="w-3 h-3" />}
                          {user?.role}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Menu items */}
                  <div className="p-2">
                    {/* Admin Panel Access - Only for Admin */}
                    {isAdmin && (
                      <>
                        <div className="border-t border-gray-200 my-2"></div>
                        <button className="flex items-center gap-3 w-full p-3 text-left hover:bg-red-50 rounded-lg transition-colors">
                          <Shield className="w-5 h-5 text-red-500" />
                          <div>
                            <span className="font-semibold text-red-600">
                              Admin Panel
                            </span>
                            <p className="text-xs text-red-500">
                              Manage users & content
                            </p>
                          </div>
                        </button>
                      </>
                    )}

                    <div className="border-t border-gray-200 my-2"></div>

                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 w-full p-3 text-left hover:bg-red-50 rounded-lg transition-colors text-red-600"
                    >
                      <LogOut className="w-5 h-5" />
                      <span className="font-medium">Sign Out</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Search Modal */}
      {isSearchModalOpen && (
        <>
          <div
            className="fixed inset-0 bg-gray-500/50 z-50 lg:hidden"
            onClick={() => setIsSearchModalOpen(false)}
          />
          <div className="fixed inset-x-0 top-0 bg-white z-50 lg:hidden shadow-lg">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search articles, authors, topics..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    autoFocus
                    className="w-full pl-10 pr-10 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm bg-white text-gray-900 placeholder-gray-500"
                  />
                  <button
                    onClick={() => setIsSearchModalOpen(false)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-400" />
                  </button>
                </div>
              </div>
            </div>
            <div className="max-h-[calc(100vh-80px)] overflow-y-auto">
              <div className="p-4">
                {(searchQuery || searchResults || searchSuggestions.length > 0) &&
                  renderSearchResults()}
                {!searchQuery &&
                  !searchResults &&
                  searchSuggestions.length === 0 && (
                    <div className="text-center py-8">
                      <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-sm text-gray-500">
                        Start typing to search...
                      </p>
                    </div>
                  )}
              </div>
            </div>
          </div>
        </>
      )}
    </header>
  );
};

export default Header;
