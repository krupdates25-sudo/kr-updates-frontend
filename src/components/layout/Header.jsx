import {
  Bell,
  User,
  Menu,
  LogOut,
  ChevronDown,
  Shield,
  MapPin,
  Globe,
  Check,
} from 'lucide-react';
import { useLanguageLocation } from '../../contexts/LanguageLocationContext';
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import AnnouncementDropdown from '../common/AnnouncementDropdown';
import updatesService from '../../services/updatesService';
import Logo from '../common/Logo';

const Header = ({
  onSidebarToggle,
  topTags = [],
  activeTag = null,
  onTagSelect = null,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isAnnouncementOpen, setIsAnnouncementOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isUpdatesOpen, setIsUpdatesOpen] = useState(false);
  const [updatesSubmitted, setUpdatesSubmitted] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [updatesForm, setUpdatesForm] = useState({
    name: '',
    phone: '',
    email: '',
  });
  const { user, logout } = useAuth();
  const { location: currentLocation, setLocation, language: currentLanguage, setLanguage } = useLanguageLocation();
  const [isLocationMenuOpen, setIsLocationMenuOpen] = useState(false);
  const [isLanguageMenuOpen, setIsLanguageMenuOpen] = useState(false);

  const locations = [
    'All',
    'Kishangarh Renwal',
    'Jaipur',
    'Rajasthan',
    'New Delhi',
    'Mumbai',
    'Ahmedabad',
    'Udaipur',
    'Jodhpur',
    'Sikar'
  ];

  const languages = [
    { code: 'hi', name: 'Hindi' },
    { code: 'en', name: 'English' }
  ];
  const isStaff = !!user && ['admin', 'moderator'].includes(user.role);

  const handleLogout = async () => {
    await logout();
    setIsUserMenuOpen(false);
  };

  const isAdmin = user?.role === 'admin';

  // Get current page name for header display
  const getCurrentPageName = () => {
    const path = location.pathname;
    if (path === '/dashboard' || path === '/') return isStaff ? 'My Feed' : 'KRUPDATES';
    if (path === '/history') return 'History';
    if (path === '/profile') return 'Profile';
    if (path === '/ads') return 'Ad Management';
    if (path.startsWith('/admin')) return 'Admin Panel';
    return 'KRUPDATES';
  };

  const showTagRow = Array.isArray(topTags) && topTags.length > 0 && typeof onTagSelect === 'function';
  const handleTagClick = (tag) => {
    if (typeof onTagSelect === 'function') onTagSelect(tag);
  };

  const [updatesSubmitting, setUpdatesSubmitting] = useState(false);
  const [updatesError, setUpdatesError] = useState(null);

  const handleUpdatesSubmit = async () => {
    setUpdatesError(null);
    setUpdatesSubmitting(true);

    const payload = {
      ...updatesForm,
      pageUrl: typeof window !== 'undefined' ? window.location.href : '',
    };

    // Always keep local fallback
    try {
      localStorage.setItem(
        'kr_updates_lead',
        JSON.stringify({ ...payload, capturedAt: new Date().toISOString() })
      );
      setIsSubscribed(true);
    } catch {
      // ignore
    }

    try {
      await updatesService.subscribe(payload);
      setUpdatesSubmitted(true);
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 2200);
      setIsSubscribed(true);
    } catch (e) {
      setUpdatesError(
        (typeof e === 'string' && e) ||
        e?.message ||
        e?.response?.data?.message ||
        'Failed to save details. Please try again.'
      );
    } finally {
      setUpdatesSubmitting(false);
    }
  };

  // Hide "Want updates?" once the user has already submitted details
  useEffect(() => {
    try {
      const existing = localStorage.getItem('kr_updates_lead');
      if (existing) setIsSubscribed(true);
    } catch {
      // ignore
    }
  }, []);

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-30 w-full shadow-sm">
      <div className="relative flex items-center justify-between h-14 sm:h-16 px-3 sm:px-4 md:px-6 w-full">
        {/* Left side */}
        <div className="flex items-center gap-2 sm:gap-3 md:gap-4 flex-1 min-w-0">
          {/* Burger Menu Button - Desktop only (only for authenticated users) */}
          {isStaff && (
            <button
              onClick={onSidebarToggle}
              className="hidden lg:flex p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Toggle sidebar"
            >
              <Menu className="w-5 h-5 text-gray-600" />
            </button>
          )}
        </div>

        {/* Centered logo */}
        <button
          onClick={() => navigate(isStaff ? '/dashboard' : '/')}
          className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center"
          aria-label="Go to home"
        >
          <Logo size="md" />
        </button>

        {/* Right side - Icons and User menu */}
        <div className="flex items-center justify-end gap-1 sm:gap-1.5 md:gap-3 flex-1">

          {/* Language Selector */}
          <div className="relative">
            <button
              onClick={() => {
                setIsLanguageMenuOpen(!isLanguageMenuOpen);
                setIsLocationMenuOpen(false);
                setIsUserMenuOpen(false);
              }}
              className="p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-1 group"
              title="Select language"
            >
              <Globe className={`w-5 h-5 ${currentLanguage === 'hi' ? 'text-blue-600' : 'text-gray-600'} group-hover:rotate-12 transition-transform`} />
              <span className="hidden lg:inline text-xs font-medium text-gray-700">
                {languages.find(l => l.code === currentLanguage)?.name || 'Language'}
              </span>
            </button>

            {isLanguageMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsLanguageMenuOpen(false)} />
                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden py-1">
                  <div className="px-4 py-2 border-b border-gray-100 bg-gray-50">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Select Language</span>
                  </div>
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        setLanguage(lang.code);
                        setIsLanguageMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors hover:bg-gray-50 ${currentLanguage === lang.code ? 'text-blue-600 font-semibold bg-blue-50/50' : 'text-gray-700'
                        }`}
                    >
                      {lang.name}
                      {currentLanguage === lang.code && <Check className="w-4 h-4" />}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
          {/* Notifications - Desktop only (only for authenticated users) */}
          {isStaff && (
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
          )}

          {/* Desktop: Want updates? CTA (Public users only) */}
          {!isStaff && !isSubscribed && (
            <button
              onClick={() => {
                setUpdatesSubmitted(false);
                setIsUpdatesOpen(true);
              }}
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2 border border-blue-200 text-blue-700 rounded-lg hover:bg-blue-50 transition-colors font-medium text-sm sm:text-base"
            >
              <Bell className="w-4 h-4" />
              Want updates?
            </button>
          )}

          {/* Staff user menu (admin/moderator only) */}
          {isStaff && (
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
                  className={`hidden md:block w-4 h-4 transition-transform duration-200 text-gray-500 ${isUserMenuOpen ? 'rotate-180' : ''
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
                          <p className="text-sm text-gray-600">{user?.email}</p>
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full mt-1 capitalize ${isAdmin
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
          )}
        </div>
      </div>

      {/* Location Tabs Row */}
      {(location.pathname === '/' || location.pathname === '/dashboard') && (
        <div className="px-3 sm:px-4 md:px-6 pb-2 border-b border-gray-50">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
            <div className="flex-shrink-0 flex items-center gap-1 px-2 py-1 text-gray-400">
              <MapPin className="w-3.5 h-3.5" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Region</span>
            </div>
            {locations.map((loc) => {
              const isActive = currentLocation === loc;
              return (
                <button
                  key={loc}
                  onClick={() => setLocation(loc)}
                  className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-200 ${isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-200 border-blue-600 scale-105'
                      : 'bg-gray-50 text-gray-600 border border-gray-100 hover:bg-gray-100 hover:border-gray-200'
                    }`}
                >
                  {loc}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Tag chips row (max 5) */}
      {showTagRow && (
        <div className="px-3 sm:px-4 md:px-6 pb-2 mt-1">
          <div className="flex items-center justify-center gap-2 overflow-x-auto no-scrollbar py-1">
            {topTags.slice(0, 5).map((tag) => {
              const isActive = activeTag && String(activeTag).toLowerCase() === String(tag).toLowerCase();
              return (
                <button
                  key={tag}
                  onClick={() => handleTagClick(tag)}
                  className={`whitespace-nowrap inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border transition-colors ${isActive
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                    }`}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Confetti */}
      {showConfetti && (
        <>
          <style>{`
            @keyframes kr-confetti-fall {
              0% { transform: translateY(-10px) rotate(0deg); opacity: 1; }
              100% { transform: translateY(80vh) rotate(720deg); opacity: 0; }
            }
          `}</style>
          <div className="pointer-events-none fixed inset-0 z-[60] overflow-hidden">
            {Array.from({ length: 40 }).map((_, i) => (
              <span
                key={i}
                style={{
                  position: 'absolute',
                  top: '-10px',
                  left: `${Math.random() * 100}%`,
                  width: `${6 + Math.random() * 6}px`,
                  height: `${8 + Math.random() * 10}px`,
                  background: ['#2563eb', '#16a34a', '#f59e0b', '#ef4444', '#7c3aed'][i % 5],
                  animation: `kr-confetti-fall ${1.4 + Math.random() * 0.9}s linear`,
                  animationDelay: `${Math.random() * 0.2}s`,
                  borderRadius: '2px',
                }}
              />
            ))}
          </div>
        </>
      )}

      {/* Want updates modal (bottom sheet on mobile, small centered modal on desktop) */}
      {isUpdatesOpen && !isStaff && (
        <>
          <div
            className="fixed inset-0 bg-gray-500/50 z-50"
            onClick={() => setIsUpdatesOpen(false)}
          />
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
            <div className="w-full sm:max-w-md bg-white shadow-2xl rounded-t-2xl sm:rounded-2xl">
              <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-blue-600" />
                  <h2 className="text-base font-semibold text-gray-900">Want updates?</h2>
                </div>
                <button
                  onClick={() => setIsUpdatesOpen(false)}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  aria-label="Close"
                >
                  <span className="text-gray-500 text-xl leading-none">×</span>
                </button>
              </div>

              <div className="p-4 space-y-3">
                {!updatesSubmitted ? (
                  <>
                    <p className="text-sm text-gray-600">
                      Share your details and we’ll keep you updated.
                    </p>

                    {updatesError && (
                      <div className="p-3 rounded-lg border border-red-200 bg-red-50 text-red-700 text-sm">
                        {updatesError}
                      </div>
                    )}

                    <div className="space-y-2">
                      <input
                        value={updatesForm.name}
                        onChange={(e) => setUpdatesForm((p) => ({ ...p, name: e.target.value }))}
                        placeholder="Your name"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                      <input
                        value={updatesForm.phone}
                        onChange={(e) => setUpdatesForm((p) => ({ ...p, phone: e.target.value }))}
                        placeholder="Mobile number"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                      <input
                        value={updatesForm.email}
                        onChange={(e) => setUpdatesForm((p) => ({ ...p, email: e.target.value }))}
                        placeholder="Email (optional)"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={() => setIsUpdatesOpen(false)}
                        className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium text-sm"
                      >
                        Not now
                      </button>
                      <button
                        onClick={handleUpdatesSubmit}
                        disabled={updatesSubmitting}
                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {updatesSubmitting ? 'Saving...' : 'Submit'}
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="py-6 text-center">
                    <div className="mx-auto w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-3">
                      <span className="text-green-700 text-2xl">✓</span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Thank you!</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      We received your details.
                    </p>
                    <button
                      onClick={() => setIsUpdatesOpen(false)}
                      className="mt-4 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
                    >
                      Done
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Mobile fixed bottom bar (logged out) */}
      {!isStaff && !isSubscribed && (
        <div className="sm:hidden fixed inset-x-0 bottom-0 z-40 px-3 pb-3">
          <button
            onClick={() => {
              setUpdatesSubmitted(false);
              setIsUpdatesOpen(true);
            }}
            className="w-full bg-blue-600 text-white rounded-xl shadow-lg px-4 py-3 flex items-center justify-between"
          >
            <span className="text-sm font-semibold">Want updates?</span>
            <span className="text-sm opacity-90">Tap to share details</span>
          </button>
        </div>
      )}
    </header>
  );
};

export default Header;
