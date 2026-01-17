import { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import BottomNavigation from './BottomNavigation';
import { useAuth } from '../../contexts/AuthContext';

/**
 * Common PageLayout component that provides consistent layout structure
 * across all pages with Sidebar, Header, and BottomNavigation.
 * 
 * Features:
 * - Full-width content area that adapts to sidebar state
 * - Consistent padding and spacing
 * - Responsive design (mobile/desktop)
 * - Manages sidebar state internally
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Page content to render
 * @param {string} props.activeTab - Active tab for sidebar navigation (optional)
 * @param {Function} props.onTabChange - Callback when tab changes (optional)
 * @param {boolean} props.hideBottomNav - Hide bottom navigation on mobile (optional)
 * @param {boolean} props.hideSidebar - Hide sidebar completely (optional)
 * @param {string} props.contentClassName - Additional CSS classes for content area (optional)
 * @param {boolean} props.defaultSidebarOpen - Default sidebar state (optional, defaults to true on desktop for sidebar open)
 */
const PageLayout = ({ 
  children, 
  activeTab = 'feed',
  onTabChange = () => {},
  hideBottomNav = false,
  hideSidebar = false,
  contentClassName = '',
  defaultSidebarOpen = undefined, // undefined means use default behavior (open on desktop)
  headerProps = {}, // optional props passed to Header (e.g. topTags, activeTag, onTagSelect)
}) => {
  const { user, isAuthenticated } = useAuth();
  const isStaff = isAuthenticated && user && ['admin', 'moderator'].includes(user.role);

  // Force-hide sidebar for public users (no public login). This prevents sidebar
  // showing up due to any stale localStorage "user" object.
  const effectiveHideSidebar = hideSidebar || !isStaff;

  // Initialize sidebar state - if defaultSidebarOpen is explicitly false, use that; otherwise default to open on desktop
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (!isStaff) {
      return false;
    }
    if (defaultSidebarOpen === false) {
      return false; // Explicitly set to closed (full width)
    }
    // Default behavior: open on desktop (lg+), closed on mobile
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 1024; // lg breakpoint
    }
    return false;
  });

  const handleSidebarToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleTabChange = (tabId) => {
    setSidebarOpen(false); // Close sidebar on mobile after selection
    onTabChange(tabId);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 lg:pb-0">
      {/* Sidebar - Hidden on mobile, visible on desktop, or hidden completely if hideSidebar is true */}
      {!effectiveHideSidebar && (
        <Sidebar
          isOpen={sidebarOpen}
          onToggle={handleSidebarToggle}
          activeTab={activeTab}
          onTabChange={handleTabChange}
        />
      )}

      {/* Main Content Area - Full width with proper sidebar offset */}
      <div className={`relative z-10 transition-all duration-300 ${!effectiveHideSidebar && sidebarOpen ? 'lg:ml-72' : 'lg:ml-0'}`}>
        {/* Header */}
        <Header onSidebarToggle={handleSidebarToggle} {...headerProps} />

        {/* Main Content - Full width with consistent padding */}
        <main className={`w-full min-h-screen ${contentClassName}`}>
          {children}
        </main>
      </div>

      {/* Bottom Navigation - For all users on mobile (unless hidden) */}
      {!hideBottomNav && <BottomNavigation />}
    </div>
  );
};

export default PageLayout;

