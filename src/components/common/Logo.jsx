import { useSettings } from '../../contexts/SettingsContext';

const Logo = ({ size = 'md', className = '' }) => {
  const { settings, loading } = useSettings();
  const textSizes = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
    xl: 'text-3xl',
  };

  const logoSize = {
    sm: 'h-6',
    md: 'h-8',
    lg: 'h-12',
    xl: 'h-16',
  };

  // Show logo image if available, otherwise show text
  if (settings?.siteLogo && !loading) {
    return (
      <div className={`flex items-center ${className}`}>
        <img
          src={settings.siteLogo}
          alt={settings.siteName || 'Logo'}
          className={`${logoSize[size]} object-contain`}
        />
      </div>
    );
  }

  // KRUPDATES text logo with KRUP in black and DATES in blue
  return (
    <div className={`flex items-center ${className}`}>
      <h1 className={`font-bold ${textSizes[size]} tracking-tight`}>
        <span className="text-gray-900 dark:text-white">KRUP</span>
        <span className="text-blue-600 dark:text-blue-400">DATES</span>
      </h1>
    </div>
  );
};

export default Logo;
