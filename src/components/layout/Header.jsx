import {
  Bell,
  User,
  Menu,
  LogOut,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Shield,
  MapPin,
  Globe,
  Check,
  Download,
  RefreshCw,
  Search,
} from 'lucide-react';
import { useLanguageLocation } from '../../contexts/LanguageLocationContext';
import { useState, useEffect, useMemo, useRef } from 'react';
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
  const [deferredInstallPrompt, setDeferredInstallPrompt] = useState(null);
  const [isInstallAvailable, setIsInstallAvailable] = useState(false);
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);
  const [swRegistration, setSwRegistration] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [pwaToast, setPwaToast] = useState(null);
  const [updatesForm, setUpdatesForm] = useState({
    name: '',
    phone: '',
    email: '',
  });
  const { user, logout } = useAuth();
  const {
    location: currentLocation,
    setLocation,
    selectedLocations,
    toggleSelectedLocation,
    language: currentLanguage,
    setLanguage,
    availableLocations,
  } = useLanguageLocation();
  const [isLocationMenuOpen, setIsLocationMenuOpen] = useState(false);
  const [isLanguageMenuOpen, setIsLanguageMenuOpen] = useState(false);
  const locationStripRef = useRef(null);
  const locationStripPausedRef = useRef(false);
  const locationStripResumeTimeoutRef = useRef(null);

  const locations = useMemo(() => {
    const locs = Array.isArray(availableLocations) ? availableLocations : [];
    // Ensure "All" is always first (and not duplicated)
    const withoutAll = locs.filter((l) => String(l).toLowerCase() !== 'all');
    return ['All', ...withoutAll];
  }, [availableLocations]);

  // Location strip: smooth auto-scroll, pause on user scroll/touch, loop without duplicate tabs
  useEffect(() => {
    if (locations.length === 0) return;
    const el = locationStripRef.current;
    if (!el) return;

    const step = 0.4;
    let rafId = null;

    const tick = () => {
      if (locationStripPausedRef.current) {
        rafId = requestAnimationFrame(tick);
        return;
      }
      const max = el.scrollWidth - el.clientWidth;
      if (max <= 0) {
        rafId = requestAnimationFrame(tick);
        return;
      }
      el.scrollLeft += step;
      if (el.scrollLeft >= max) {
        el.scrollLeft = 0;
      }
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);

    const pause = (e) => {
      // Don't pause when user clicks a location pill (so selecting a tab doesn't stop scroll)
      if (e && e.target && e.target.closest && e.target.closest('button')) return;
      locationStripPausedRef.current = true;
      if (locationStripResumeTimeoutRef.current) {
        clearTimeout(locationStripResumeTimeoutRef.current);
      }
      locationStripResumeTimeoutRef.current = setTimeout(() => {
        locationStripPausedRef.current = false;
        locationStripResumeTimeoutRef.current = null;
      }, 2500);
    };

    el.addEventListener('touchstart', pause, { passive: true });
    el.addEventListener('wheel', pause, { passive: true });
    el.addEventListener('mousedown', pause);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      if (locationStripResumeTimeoutRef.current) clearTimeout(locationStripResumeTimeoutRef.current);
      el.removeEventListener('touchstart', pause);
      el.removeEventListener('wheel', pause);
      el.removeEventListener('mousedown', pause);
    };
  }, [locations.length]);

  const scrollLocationStrip = (direction) => {
    const el = locationStripRef.current;
    if (!el) return;
    locationStripPausedRef.current = true;
    if (locationStripResumeTimeoutRef.current) clearTimeout(locationStripResumeTimeoutRef.current);
    const amount = Math.min(120, el.clientWidth * 0.5);
    el.scrollBy({ left: direction === 'left' ? -amount : amount, behavior: 'smooth' });
    locationStripResumeTimeoutRef.current = setTimeout(() => {
      locationStripPausedRef.current = false;
      locationStripResumeTimeoutRef.current = null;
    }, 2500);
  };

  const languages = [
    { code: 'hi', name: 'Hindi' },
    { code: 'en', name: 'English' }
  ];
  const isStaff = !!user && ['admin', 'moderator'].includes(user.role);

  // PWA: capture install prompt, and detect service worker updates
  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      setDeferredInstallPrompt(e);
      setIsInstallAvailable(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredInstallPrompt(null);
      setIsInstallAvailable(false);
      setPwaToast('App installed');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  useEffect(() => {
    // Detect "already installed" / standalone mode (Android, desktop, iOS)
    const standalone =
      (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) ||
      window.navigator.standalone === true;
    if (standalone) setIsInstalled(true);

    if (!('serviceWorker' in navigator)) return;
    let cleanupUpdateFound = null;

    (async () => {
      try {
        const reg = await navigator.serviceWorker.getRegistration();
        if (reg) {
          setSwRegistration(reg);
          if (reg.waiting) setIsUpdateAvailable(true);

          const onUpdateFound = () => {
            const installing = reg.installing;
            if (!installing) return;
            const onStateChange = () => {
              if (installing.state === 'installed' && navigator.serviceWorker.controller) {
                setIsUpdateAvailable(true);
              }
            };
            installing.addEventListener('statechange', onStateChange);
            cleanupUpdateFound = () => installing.removeEventListener('statechange', onStateChange);
          };

          reg.addEventListener('updatefound', onUpdateFound);
          cleanupUpdateFound = () => reg.removeEventListener('updatefound', onUpdateFound);
        }
      } catch {
        // ignore
      }
    })();

    return () => {
      if (typeof cleanupUpdateFound === 'function') cleanupUpdateFound();
    };
  }, []);

  useEffect(() => {
    if (!pwaToast) return;
    const t = window.setTimeout(() => setPwaToast(null), 2200);
    return () => window.clearTimeout(t);
  }, [pwaToast]);

  const checkForPwaUpdate = async () => {
    if (!('serviceWorker' in navigator)) return false;
    try {
      const reg = swRegistration || (await navigator.serviceWorker.getRegistration());
      if (!reg) return false;
      setSwRegistration(reg);

      await reg.update();
      if (reg.waiting) {
        setIsUpdateAvailable(true);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const handlePwaAction = async () => {
    // If there's an update waiting, activate it and reload.
    if (isUpdateAvailable && swRegistration?.waiting) {
      try {
        const onControllerChange = () => {
          window.location.reload();
        };
        navigator.serviceWorker.addEventListener('controllerchange', onControllerChange, { once: true });
        swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
        return;
      } catch {
        // fall through
      }
    }

    // Otherwise, try install prompt if available
    if (!isInstalled && deferredInstallPrompt) {
      try {
        deferredInstallPrompt.prompt();
        const choice = await deferredInstallPrompt.userChoice;
        if (choice?.outcome === 'accepted') {
          setPwaToast('Installing…');
        }
      } catch {
        // ignore
      } finally {
        setDeferredInstallPrompt(null);
        setIsInstallAvailable(false);
      }
      return;
    }

    // If installed: check for updates on demand; apply if found
    const updateReady = await checkForPwaUpdate();
    if (updateReady) {
      try {
        const reg = swRegistration || (await navigator.serviceWorker.getRegistration());
        if (reg?.waiting) {
          setIsUpdateAvailable(true);
          navigator.serviceWorker.addEventListener('controllerchange', () => window.location.reload(), { once: true });
          reg.waiting.postMessage({ type: 'SKIP_WAITING' });
          return;
        }
      } catch {
        // ignore
      }
    }

    // Quiet UX: no blocking alert
    setPwaToast(isInstalled ? 'No update available' : 'Install not available on this device');
  };

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
      <div className="grid grid-cols-[1fr_auto_1fr] items-center h-14 sm:h-16 px-3 sm:px-4 md:px-6 w-full gap-2">
        {/* Left side: Search (dashboard/home) + Burger for staff */}
        <div className="flex items-center gap-2 sm:gap-3 md:gap-4 min-w-0">
          {/* Search (expanded with placeholder) – show on dashboard/home; click goes to Location & search */}
          {(location.pathname === '/' || location.pathname === '/dashboard') && (
            <>
              {/* Mobile: icon only */}
              <button
                onClick={() => navigate('/explore-location')}
                className="sm:hidden flex items-center justify-center p-2 rounded-lg hover:bg-gray-100 active:scale-95 transition-all duration-200 shrink-0"
                aria-label="Search"
                title="Search"
              >
                <Search className="w-5 h-5 text-gray-600" />
              </button>

              {/* Desktop/tablet: expanded pill with placeholder */}
              <button
                onClick={() => navigate('/explore-location')}
                className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 hover:border-gray-300 transition-colors min-w-0 w-full max-w-[360px]"
                aria-label="Search posts and location"
                title="Search posts and change location"
              >
                <Search className="w-4 h-4 text-gray-400 shrink-0" />
                <span className="text-sm text-gray-500 truncate">
                  Search posts or location…
                </span>
              </button>
            </>
          )}
          {/* Burger Menu Button - Desktop only (only for authenticated users) */}
          {isStaff && (
            <button
              onClick={onSidebarToggle}
              className="hidden lg:flex p-2 rounded-lg hover:bg-gray-100 transition-colors shrink-0"
              aria-label="Toggle sidebar"
            >
              <Menu className="w-5 h-5 text-gray-600" />
            </button>
          )}
        </div>

        {/* Centered logo - smaller on mobile so right-side icons (language, etc.) fit */}
        <button
          onClick={() => navigate(isStaff ? '/dashboard' : '/')}
          className="flex items-center justify-center shrink-0"
          aria-label="Go to home"
        >
          <span className="sm:hidden"><Logo size="sm" /></span>
          <span className="hidden sm:inline"><Logo size="md" /></span>
        </button>

        {/* Right side - Icons and User menu; min width on mobile so language icon stays visible */}
        <div className="flex items-center justify-end gap-1 sm:gap-1.5 md:gap-3 min-w-[160px] sm:min-w-0">

          {/* Language Selector - shrink-0 so it never hides behind logo */}
          <div className="relative shrink-0">
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

          {/* PWA Install / Update (always visible) */}
          <button
            onClick={handlePwaAction}
            className={`shrink-0 p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-1 ${
              isUpdateAvailable ? 'text-orange-600' : isInstallAvailable ? 'text-blue-600' : 'text-gray-600'
            }`}
            title={
              isUpdateAvailable
                ? 'Update app'
                : isInstallAvailable
                  ? 'Install app'
                  : isInstalled
                    ? 'Check for updates'
                    : 'Install app'
            }
            aria-label="Install or update app"
          >
            {isUpdateAvailable ? (
              <span className="relative inline-flex">
                <RefreshCw className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-orange-500 rounded-full" />
              </span>
            ) : isInstalled ? (
              <RefreshCw className="w-5 h-5 opacity-70" />
            ) : (
              <Download className="w-5 h-5" />
            )}
          </button>

          {/* PWA toast (non-blocking) */}
          {pwaToast && (
            <div className="fixed top-16 sm:top-[72px] right-3 z-[80] px-3 py-2 rounded-lg shadow-lg border border-gray-200 bg-white text-gray-800 text-sm font-medium">
              {pwaToast}
            </div>
          )}
          {/* Notifications - Admin/Moderator (visible on all screen sizes) */}
          {isStaff && (
            <div className="relative shrink-0">
              <button
                onClick={() => setIsAnnouncementOpen(!isAnnouncementOpen)}
                className="relative p-1.5 sm:p-2 md:p-2.5 rounded-lg hover:bg-gray-100 transition-colors"
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

          {/* Staff user menu (admin/moderator only) - compact on mobile so language icon fits */}
          {isStaff && (
            <div className="relative shrink-0">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-1 sm:gap-2 md:gap-3 p-1 sm:p-1.5 md:p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-[var(--color-primary)] flex items-center justify-center shadow-lg shrink-0">
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
                        <div className="w-12 h-12 rounded-lg bg-[var(--color-primary)] flex items-center justify-center shadow-lg">
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

      {/* Location strip: scrollable by hand, smooth auto-scroll (does not stop on tab select), small arrows */}
      {(location.pathname === '/' || location.pathname === '/dashboard') && locations.length > 0 && (
        <div className="w-full pb-2 border-b border-gray-50">
          <div className="flex items-center gap-1 py-1 w-full">
            <div className="flex-shrink-0 flex items-center gap-1 px-2 py-1 text-gray-400">
              <MapPin className="w-3.5 h-3.5" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Region</span>
            </div>
            <button
              type="button"
              onClick={() => scrollLocationStrip('left')}
              className="flex-shrink-0 p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              aria-label="Scroll locations left"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div
              ref={locationStripRef}
              className="flex-1 min-w-0 overflow-x-auto overflow-y-hidden scroll-smooth scrollbar-hide flex items-center gap-2 py-0.5"
            >
              <div className="flex items-center gap-2 py-0.5 w-max min-w-full">
                {locations.map((loc) => {
                  const name = String(loc);
                  const isAll = name === 'All';
                  const multi = Array.isArray(selectedLocations) && selectedLocations.length > 0;
                  const isSelected = isAll
                    ? !multi && currentLocation === 'All'
                    : (multi ? selectedLocations.includes(name) : currentLocation === name);
                  return (
                    <button
                      key={loc}
                      type="button"
                      onClick={() => {
                        if (isAll) {
                          setLocation('All');
                        } else if (typeof toggleSelectedLocation === 'function') {
                          toggleSelectedLocation(name);
                        } else {
                          setLocation(name);
                        }
                      }}
                      className={`flex-shrink-0 whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-bold transition-colors duration-200 ${
                        isSelected
                          ? 'bg-[var(--color-primary)] text-white shadow-md border-[var(--color-primary)]'
                          : 'bg-gray-50 text-gray-600 border border-gray-100 hover:bg-gray-100 hover:border-gray-200'
                      }`}
                    >
                      {loc}
                    </button>
                  );
                })}
              </div>
            </div>
            <button
              type="button"
              onClick={() => scrollLocationStrip('right')}
              className="flex-shrink-0 p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              aria-label="Scroll locations right"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
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
                  <Bell className="w-5 h-5 text-[var(--color-primary)]" />
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
                        className="flex-1 px-4 py-2 bg-[var(--color-primary)] text-white rounded-lg hover:opacity-90 transition-colors font-medium text-sm disabled:opacity-60 disabled:cursor-not-allowed"
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
                      className="mt-4 w-full px-4 py-2 bg-[var(--color-primary)] text-white rounded-lg hover:opacity-90 transition-colors font-medium text-sm"
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
            className="w-full bg-[var(--color-primary)] text-white rounded-xl shadow-lg px-4 py-3 flex items-center justify-between"
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
