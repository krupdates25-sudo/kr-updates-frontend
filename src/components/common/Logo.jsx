import { useSettings } from '../../contexts/SettingsContext';
import kruMainLogo from '../../assets/KRU_main.png';

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

  // Show logo image if available from settings, otherwise use default KRU_main.png
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

  // Default KRU main logo
  return (
    <div className={`flex items-center ${className}`}>
      <img
        src={kruMainLogo}
        alt="KRUPDATES"
        className={`${logoSize[size]} object-contain`}
      />
    </div>
  );
};

export default Logo;
