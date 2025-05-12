import { ThemeName } from '../styles/theme';

/**
 * Apply theme to the entire document
 * @param themeName The name of the theme to apply
 */
export const applyThemeToDocument = (themeName: ThemeName) => {
  // Apply theme classes to document element
  document.documentElement.classList.remove('dim', 'dark', 'light', 'theme-dim', 'theme-dark', 'theme-light');
  document.documentElement.classList.add(themeName, `theme-${themeName}`);
  document.documentElement.setAttribute('data-theme', themeName);

  // Apply theme classes to body
  document.body.classList.remove('dim', 'dark', 'light', 'theme-dim', 'theme-dark', 'theme-light');
  document.body.classList.add(themeName, `theme-${themeName}`);
  document.body.setAttribute('data-theme', themeName);

  // Apply to all iframes
  const iframes = document.querySelectorAll('iframe');
  iframes.forEach(iframe => {
    try {
      if (iframe.contentDocument) {
        // Apply to iframe document element
        iframe.contentDocument.documentElement.classList.remove('dim', 'dark', 'light', 'theme-dim', 'theme-dark', 'theme-light');
        iframe.contentDocument.documentElement.classList.add(themeName, `theme-${themeName}`);
        iframe.contentDocument.documentElement.setAttribute('data-theme', themeName);

        // Apply to iframe body if it exists
        if (iframe.contentDocument.body) {
          iframe.contentDocument.body.classList.remove('dim', 'dark', 'light', 'theme-dim', 'theme-dark', 'theme-light');
          iframe.contentDocument.body.classList.add(themeName, `theme-${themeName}`);
          iframe.contentDocument.body.setAttribute('data-theme', themeName);
        }
      }
    } catch (e) {
      console.error('Error applying theme to iframe:', e);
    }
  });

  // Dispatch a custom event to notify components
  const themeChangeEvent = new CustomEvent('themechange', { detail: { theme: themeName } });
  window.dispatchEvent(themeChangeEvent);
};
