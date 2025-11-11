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
  Sun,
  Moon,
  Monitor,
  FileText,
  Megaphone,
  Tag,
  Clock,
} from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import AnnouncementDropdown from '../common/AnnouncementDropdown';
import announcementService from '../../services/announcementService';
import searchService from '../../services/searchService';

const Header = ({ onSidebarToggle }) => {
  const navigate = useNavigate();
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isAnnouncementOpen, setIsAnnouncementOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [searchResults, setSearchResults] = useState(null);
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  // Fetch unread announcement count
  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const response = await announcementService.getUnreadCount();
        setUnreadCount(response.data?.count || 0);
      } catch (error) {
        console.error('Error fetching unread count:', error);
      }
    };

    if (user) {
      fetchUnreadCount();
      // Poll for updates every 5 minutes
      const interval = setInterval(fetchUnreadCount, 5 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [user]);

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

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-30 w-full shadow-sm">
      <div className="flex items-center justify-between h-16 px-6 w-full">
        {/* Left side - Menu button and Search */}
        <div className="flex items-center gap-4 flex-1">
          <button
            onClick={onSidebarToggle}
            className="lg:hidden p-2.5 rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <Menu className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>

          {/* Search */}
          <div className="flex-1 max-w-xl">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search articles, authors, topics..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                className="w-full pl-12 pr-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
              />

              {/* Search suggestions overlay */}
              {isSearchFocused &&
                (searchQuery ||
                  searchResults ||
                  searchSuggestions.length > 0) && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-50 max-h-80 overflow-y-auto">
                    <div className="p-4">
                      {isSearching && (
                        <div className="flex items-center justify-center py-4">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500"></div>
                          <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                            Searching...
                          </span>
                        </div>
                      )}

                      {/* Search Results */}
                      {searchResults && !isSearching && (
                        <div className="space-y-4">
                          {/* Posts */}
                          {searchResults.posts &&
                            searchResults.posts.length > 0 && (
                              <div>
                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                                  <FileText className="w-4 h-4" />
                                  Posts ({searchResults.posts.length})
                                </p>
                                <div className="space-y-1">
                                  {console.log(
                                    'Header - Rendering posts:',
                                    searchResults.posts.length
                                  )}
                                  {searchResults.posts.map((post) => {
                                    console.log(
                                      'Header - Rendering post:',
                                      post.id,
                                      post.title
                                    );
                                    return (
                                      <button
                                        key={post.id}
                                        className="flex items-start gap-3 w-full p-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                        onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          console.log(
                                            'Header - Post clicked:',
                                            post.id,
                                            post.title
                                          );
                                          console.log(
                                            'Header - Click event:',
                                            e
                                          );
                                          console.log(
                                            'Header - Post object:',
                                            post
                                          );
                                          alert(`Post clicked: ${post.title}`);

                                          // Always navigate to dashboard with modal state
                                          navigate('/dashboard', {
                                            state: {
                                              openPostModal: true,
                                              postId: post.id,
                                              postSlug: post.slug,
                                            },
                                          });

                                          setSearchQuery('');
                                          setIsSearchFocused(false);
                                        }}
                                      >
                                        <div className="flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700">
                                          {post.featuredImage?.url ||
                                          post.image ? (
                                            <img
                                              src={
                                                post.featuredImage?.url ||
                                                post.image
                                              }
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
                                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                            {post.title}
                                          </p>
                                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                            {post.excerpt}
                                          </p>
                                          <div className="flex items-center gap-2 mt-1">
                                            <span className="text-xs text-gray-400">
                                              {post.category}
                                            </span>
                                          </div>
                                        </div>
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                          {/* Users */}
                          {searchResults.users &&
                            searchResults.users.length > 0 && (
                              <div>
                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                                  <User className="w-4 h-4" />
                                  Users ({searchResults.users.length})
                                </p>
                                <div className="space-y-1">
                                  {searchResults.users.map((user) => (
                                    <button
                                      key={user.id}
                                      className="flex items-center gap-3 w-full p-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                      onClick={() => {
                                        navigate(`/profile/${user.username}`);
                                        setSearchQuery('');
                                        setIsSearchFocused(false);
                                      }}
                                    >
                                      <User className="w-4 h-4 text-green-500" />
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                          {user.firstName} {user.lastName}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                          @{user.username} • {user.role}
                                        </p>
                                      </div>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}

                          {/* Announcements */}
                          {searchResults.announcements &&
                            searchResults.announcements.length > 0 && (
                              <div>
                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                                  <Megaphone className="w-4 h-4" />
                                  Announcements (
                                  {searchResults.announcements.length})
                                </p>
                                <div className="space-y-1">
                                  {searchResults.announcements.map(
                                    (announcement) => (
                                      <button
                                        key={announcement.id}
                                        className="flex items-start gap-3 w-full p-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                        onClick={() => {
                                          if (announcement.actionUrl) {
                                            // If announcement has an action URL, navigate to it
                                            window.location.href =
                                              announcement.actionUrl;
                                          } else {
                                            // Otherwise, navigate to announcements page with search
                                            navigate('/announcements', {
                                              state: {
                                                searchQuery: announcement.title,
                                              },
                                            });
                                          }
                                          setSearchQuery('');
                                          setIsSearchFocused(false);
                                        }}
                                      >
                                        <Megaphone className="w-4 h-4 text-orange-500 mt-0.5" />
                                        <div className="flex-1 min-w-0">
                                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                            {announcement.title}
                                          </p>
                                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                            {announcement.message}
                                          </p>
                                        </div>
                                      </button>
                                    )
                                  )}
                                </div>
                              </div>
                            )}

                          {/* Categories */}
                          {searchResults.categories &&
                            searchResults.categories.length > 0 && (
                              <div>
                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                                  <Tag className="w-4 h-4" />
                                  Categories ({searchResults.categories.length})
                                </p>
                                <div className="space-y-1">
                                  {searchResults.categories.map(
                                    (category, index) => (
                                      <button
                                        key={index}
                                        className="flex items-center gap-3 w-full p-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                        onClick={() => {
                                          // Check if we're already on dashboard
                                          if (
                                            window.location.pathname ===
                                            '/dashboard'
                                          ) {
                                            // If already on dashboard, trigger filter directly
                                            window.dispatchEvent(
                                              new CustomEvent(
                                                'setCategoryFilter',
                                                {
                                                  detail: {
                                                    category: category.name,
                                                  },
                                                }
                                              )
                                            );
                                          } else {
                                            // Navigate to dashboard with category filter
                                            navigate('/dashboard', {
                                              state: {
                                                filterCategory: category.name,
                                              },
                                            });
                                          }
                                          setSearchQuery('');
                                          setIsSearchFocused(false);
                                        }}
                                      >
                                        <Tag className="w-4 h-4 text-purple-500" />
                                        <span className="text-sm text-gray-700 dark:text-gray-300">
                                          {category.name}
                                        </span>
                                      </button>
                                    )
                                  )}
                                </div>
                              </div>
                            )}
                        </div>
                      )}

                      {/* Search Suggestions */}
                      {searchSuggestions.length > 0 &&
                        !searchResults &&
                        !isSearching && (
                          <div>
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                              <Clock className="w-4 h-4" />
                              Suggestions
                            </p>
                            <div className="space-y-1">
                              {searchSuggestions.map((suggestion, index) => (
                                <button
                                  key={index}
                                  className="flex items-center gap-3 w-full p-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                  onClick={() => {
                                    setSearchQuery(suggestion.text);
                                    performSearch(suggestion.text);
                                  }}
                                >
                                  <Search className="w-4 h-4 text-gray-400" />
                                  <div className="flex-1 min-w-0">
                                    <span className="text-sm text-gray-700 dark:text-gray-300">
                                      {suggestion.text}
                                    </span>
                                    <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                                      {suggestion.category}
                                    </span>
                                  </div>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                      {/* No Results */}
                      {searchQuery &&
                        !isSearching &&
                        searchResults &&
                        searchResults.total === 0 && (
                          <div className="text-center py-4">
                            <Search className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              No results found for "{searchQuery}"
                            </p>
                          </div>
                        )}
                    </div>
                  </div>
                )}
            </div>
          </div>
        </div>

        {/* Right side - Notifications and User menu */}
        <div className="flex items-center gap-3">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title={`Current theme: ${theme}`}
          >
            {theme === 'light' && <Sun className="w-5 h-5 text-amber-500" />}
            {theme === 'dark' && <Moon className="w-5 h-5 text-indigo-400" />}
            {theme === 'system' && (
              <Monitor className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            )}
          </button>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setIsAnnouncementOpen(!isAnnouncementOpen)}
              className="relative p-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <Bell className="w-5 h-5 text-gray-600 dark:text-gray-300" />
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
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-sm">
                  {user?.firstName?.charAt(0) || 'U'}
                </span>
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs capitalize flex items-center gap-1 text-gray-500 dark:text-gray-400">
                  {isAdmin && <Shield className="w-3 h-3 text-red-500" />}
                  {user?.role}
                </p>
              </div>
              <ChevronDown
                className={`w-4 h-4 transition-transform duration-200 text-gray-500 dark:text-gray-400 ${
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
                <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-50">
                  {/* User info */}
                  <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-blue-600 flex items-center justify-center shadow-lg">
                        <span className="text-white font-bold text-lg">
                          {user?.firstName?.charAt(0) || 'U'}
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800 dark:text-gray-200">
                          {user?.firstName} {user?.lastName}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {user?.email}
                        </p>
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full mt-1 capitalize ${
                            isAdmin
                              ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                              : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
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
                        <div className="border-t border-gray-200 dark:border-gray-700 my-2"></div>
                        <button className="flex items-center gap-3 w-full p-3 text-left hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                          <Shield className="w-5 h-5 text-red-500" />
                          <div>
                            <span className="font-semibold text-red-600 dark:text-red-400">
                              Admin Panel
                            </span>
                            <p className="text-xs text-red-500 dark:text-red-400">
                              Manage users & content
                            </p>
                          </div>
                        </button>
                      </>
                    )}

                    <div className="border-t border-gray-200 dark:border-gray-700 my-2"></div>

                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 w-full p-3 text-left hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors text-red-600 dark:text-red-400"
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
    </header>
  );
};

export default Header;
