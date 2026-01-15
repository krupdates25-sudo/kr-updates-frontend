import { useSettings } from '../../contexts/SettingsContext';
import kruMainLogo from '../../assets/KRU_main.png';

const Logo = ({ size = 'md', className = '' }) => {
  const { settings, loading } = useSettings();
  
  const logoSize = {
    sm: 'h-10 max-h-10',
    md: 'h-16 max-h-16',
    lg: 'h-20 max-h-20',
    xl: 'h-24 max-h-24',
  };

  // Determine which logo to use
  // Use settings logo only if it exists, is not empty, and is a valid URL
  const hasCustomLogo = settings?.siteLogo && 
                        typeof settings.siteLogo === 'string' && 
                        settings.siteLogo.trim() !== '' &&
                        !loading;

  const logoSrc = hasCustomLogo ? settings.siteLogo : kruMainLogo;
  const logoAlt = hasCustomLogo ? (settings.siteName || 'Logo') : 'KRUPDATES';

  // Always show the logo image (default KRU_main.png or custom from settings)
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <img
        src={logoSrc}
        alt={logoAlt}
        className={`${logoSize[size]} w-auto object-contain`}
        style={{ maxWidth: '100%' }}
        onError={(e) => {
          // Fallback to default logo if custom logo fails to load
          if (hasCustomLogo && e.target.src !== kruMainLogo) {
            e.target.src = kruMainLogo;
            e.target.alt = 'KRUPDATES';
          }
        }}
      />
    </div>
  );
};

export default Logo;
