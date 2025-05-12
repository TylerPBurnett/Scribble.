import { useState, useEffect } from 'react';
import { Check, RefreshCw } from 'lucide-react';
import { Theme, ThemeName, themes } from '../../shared/styles/theme';
import { useTheme } from '../../shared/providers/ThemeProvider';

interface ThemesSectionProps {
  currentTheme: ThemeName;
  onChange: (theme: ThemeName) => void;
}

export function ThemesSection({ currentTheme, onChange }: ThemesSectionProps) {
  // Theme options
  const themeOptions = Object.values(themes);
  // Get the theme context
  const { setTheme } = useTheme();
  // State to force a refresh
  const [refreshKey, setRefreshKey] = useState(0);
  // State to track if we're refreshing
  const [isRefreshing, setIsRefreshing] = useState(false);
  // State to track the current theme display
  const [displayTheme, setDisplayTheme] = useState(currentTheme);

  // Handle theme selection
  const handleThemeSelect = (theme: ThemeName) => {
    console.log('Theme selected:', theme);
    // Update the form value
    onChange(theme);
    // Update the display theme
    setDisplayTheme(theme);
    // Apply the theme immediately
    setTheme(theme);
    // Force a refresh after a short delay
    setTimeout(() => {
      setRefreshKey(prev => prev + 1);
    }, 100);
  };

  // Force refresh function
  const forceRefresh = () => {
    console.log('Forcing theme refresh');
    setIsRefreshing(true);

    // Re-apply the current theme
    setTheme(currentTheme);

    // Force a refresh of the component
    setTimeout(() => {
      setRefreshKey(prev => prev + 1);
      setIsRefreshing(false);
    }, 300);
  };

  // Apply theme classes to body
  useEffect(() => {
    // Remove all theme classes from body
    document.body.classList.remove('dim', 'dark', 'light', 'theme-dim', 'theme-dark', 'theme-light');
    // Add the current theme classes to body
    document.body.classList.add(currentTheme, `theme-${currentTheme}`);
    // Also set data attribute
    document.body.setAttribute('data-theme', currentTheme);

    console.log('Theme applied to body:', currentTheme);
  }, [currentTheme, refreshKey]);

  // Listen for theme change events
  useEffect(() => {
    const handleThemeChange = (event: Event) => {
      const customEvent = event as CustomEvent<{ theme: ThemeName }>;
      console.log('Theme change event received:', customEvent.detail.theme);
      setDisplayTheme(customEvent.detail.theme);
      setRefreshKey(prev => prev + 1);
    };

    window.addEventListener('themechange', handleThemeChange);

    return () => {
      window.removeEventListener('themechange', handleThemeChange);
    };
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-semibold text-foreground border-b border-border pb-4">Themes</h3>
        <button
          onClick={forceRefresh}
          className="flex items-center gap-1 px-3 py-1 rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
          disabled={isRefreshing}
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {themeOptions.map((theme) => (
          <ThemeCard
            key={`${theme.name}-${refreshKey}`}
            theme={theme}
            isSelected={displayTheme === theme.name}
            onSelect={() => handleThemeSelect(theme.name)}
          />
        ))}
      </div>
    </div>
  );
}

interface ThemeCardProps {
  theme: Theme;
  isSelected: boolean;
  onSelect: () => void;
}

function ThemeCard({ theme, isSelected, onSelect }: ThemeCardProps) {
  // Get border color based on selection state
  const getBorderColor = () => {
    if (isSelected) {
      return theme.preview.primary;
    }
    return 'rgba(31, 31, 31, 0.3)';
  };

  // Get box shadow based on selection state
  const getBoxShadow = () => {
    if (isSelected) {
      return `0 4px 12px ${theme.preview.primary}40`;
    }
    return 'none';
  };

  return (
    <div
      style={{
        position: 'relative',
        borderRadius: '0.5rem',
        overflow: 'hidden',
        border: `1px solid ${getBorderColor()}`,
        transition: 'all 0.2s ease',
        cursor: 'pointer',
        transform: isSelected ? 'scale(1.02)' : 'scale(1)',
        boxShadow: getBoxShadow(),
      }}
      onClick={onSelect}
    >
      {/* Theme preview */}
      <div style={{ height: '8rem', width: '100%', backgroundColor: theme.preview.background }}>
        {/* Header bar */}
        <div
          style={{
            height: '1.5rem',
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            paddingLeft: '0.5rem',
            paddingRight: '0.5rem',
            backgroundColor: `color-mix(in srgb, ${theme.preview.background} 80%, black)`
          }}
        >
          <div style={{ display: 'flex', gap: '0.375rem' }}>
            <div style={{ width: '0.625rem', height: '0.625rem', borderRadius: '9999px', backgroundColor: 'rgba(239, 68, 68, 0.8)' }}></div>
            <div style={{ width: '0.625rem', height: '0.625rem', borderRadius: '9999px', backgroundColor: 'rgba(234, 179, 8, 0.8)' }}></div>
            <div style={{ width: '0.625rem', height: '0.625rem', borderRadius: '9999px', backgroundColor: 'rgba(34, 197, 94, 0.8)' }}></div>
          </div>
        </div>

        {/* Content preview */}
        <div style={{ padding: '0.75rem' }}>
          {/* Note card preview */}
          <div
            style={{
              height: '4rem',
              width: '100%',
              borderRadius: '0.375rem',
              padding: '0.5rem',
              backgroundColor: theme.preview.card,
              color: theme.preview.foreground
            }}
          >
            <div
              style={{
                width: '50%',
                height: '0.75rem',
                marginBottom: '0.5rem',
                borderRadius: '0.125rem',
                backgroundColor: `color-mix(in srgb, ${theme.preview.foreground} 15%, transparent)`
              }}
            ></div>
            <div
              style={{
                width: '100%',
                height: '0.5rem',
                marginBottom: '0.375rem',
                borderRadius: '0.125rem',
                backgroundColor: `color-mix(in srgb, ${theme.preview.foreground} 10%, transparent)`
              }}
            ></div>
            <div
              style={{
                width: '75%',
                height: '0.5rem',
                borderRadius: '0.125rem',
                backgroundColor: `color-mix(in srgb, ${theme.preview.foreground} 10%, transparent)`
              }}
            ></div>
          </div>
        </div>
      </div>

      {/* Theme info */}
      <div style={{
        padding: '1rem',
        backgroundColor: theme.preview.card,
        color: theme.preview.foreground
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h4 style={{
              fontWeight: '500',
              color: theme.preview.foreground,
              margin: 0
            }}>{theme.label}</h4>
            <p style={{
              fontSize: '0.875rem',
              color: `color-mix(in srgb, ${theme.preview.foreground} 70%, transparent)`,
              margin: '0.25rem 0 0 0'
            }}>{theme.description}</p>
          </div>

          {isSelected && (
            <div style={{
              width: '1.25rem',
              height: '1.25rem',
              borderRadius: '9999px',
              backgroundColor: theme.preview.primary,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Check style={{ width: '0.75rem', height: '0.75rem', color: '#000000' }} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
