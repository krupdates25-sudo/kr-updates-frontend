import { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import BottomNavigation from './BottomNavigation';

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
 * @param {string} props.contentClassName - Additional CSS classes for content area (optional)
 * @param {boolean} props.defaultSidebarOpen - Default sidebar state (optional, defaults to true on desktop for sidebar open)
 */
const PageLayout = ({ 
  children, 
  activeTab = 'feed',
  onTabChange = () => {},
  hideBottomNav = false,
  contentClassName = '',
  defaultSidebarOpen = undefined // undefined means use default behavior (open on desktop)
}) => {
  // Initialize sidebar state - if defaultSidebarOpen is explicitly false, use that; otherwise default to open on desktop
  const [sidebarOpen, setSidebarOpen] = useState(() => {
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20 lg:pb-0">
      {/* Sidebar - Hidden on mobile, visible on desktop */}
      <Sidebar
        isOpen={sidebarOpen}
        onToggle={handleSidebarToggle}
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />

      {/* Main Content Area - Full width with proper sidebar offset */}
      <div className={`relative z-10 transition-all duration-300 ${sidebarOpen ? 'lg:ml-72' : 'lg:ml-0'}`}>
        {/* Header */}
        <Header onSidebarToggle={handleSidebarToggle} />

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

