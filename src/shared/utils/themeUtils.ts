import { ThemeName } from '../services/themeService';

/**
 * Get theme colors for a specific theme
 * @param themeName The name of the theme
 * @returns An object containing the theme colors
 */
export const getThemeColors = (themeName: ThemeName) => {
  switch (themeName) {
    case 'dim':
      return {
        background: 'hsl(231, 15%, 18%)',
        foreground: 'hsl(60, 9.1%, 97.8%)',
        card: 'hsl(232, 14%, 15%)',
        cardForeground: 'hsl(60, 9.1%, 97.8%)',
        primary: 'hsl(39, 100%, 50%)',
        backgroundNotes: 'hsl(231, 15%, 18%)',
        backgroundTitlebar: 'hsl(232, 14%, 15%)',
        backgroundSidebar: 'hsl(232, 14%, 15%)',
        border: 'hsl(232, 14%, 13%)',
      };
    case 'dark':
      return {
        background: 'hsl(0, 0%, 7%)',
        foreground: 'hsl(0, 0%, 100%)',
        card: 'hsl(0, 0%, 10%)',
        cardForeground: 'hsl(0, 0%, 100%)',
        primary: 'hsl(39, 100%, 50%)',
        backgroundNotes: 'hsl(0, 0%, 7%)',
        backgroundTitlebar: 'hsl(0, 0%, 10%)',
        backgroundSidebar: 'hsl(0, 0%, 10%)',
        border: 'hsl(0, 0%, 15%)',
      };
    case 'light':
      return {
        background: 'hsl(0, 0%, 100%)',
        foreground: 'hsl(0, 0%, 10%)',
        card: 'hsl(0, 0%, 98%)',
        cardForeground: 'hsl(0, 0%, 10%)',
        primary: 'hsl(39, 100%, 50%)',
        backgroundNotes: 'hsl(0, 0%, 100%)',
        backgroundTitlebar: 'hsl(0, 0%, 96%)',
        backgroundSidebar: 'hsl(0, 0%, 96%)',
        border: 'hsl(0, 0%, 90%)',
      };
    default:
      return {
        background: 'hsl(231, 15%, 18%)',
        foreground: 'hsl(60, 9.1%, 97.8%)',
        card: 'hsl(232, 14%, 15%)',
        cardForeground: 'hsl(60, 9.1%, 97.8%)',
        primary: 'hsl(39, 100%, 50%)',
        backgroundNotes: 'hsl(231, 15%, 18%)',
        backgroundTitlebar: 'hsl(232, 14%, 15%)',
        backgroundSidebar: 'hsl(232, 14%, 15%)',
        border: 'hsl(232, 14%, 13%)',
      };
  }
};

/**
 * Apply theme colors to an HTML element
 * @param element The HTML element to apply the theme to
 * @param themeName The name of the theme to apply
 */
export const applyThemeToElement = (element: HTMLElement, themeName: ThemeName) => {
  const colors = getThemeColors(themeName);
  
  // Apply theme colors directly as CSS variables
  element.style.setProperty('--background', colors.background);
  element.style.setProperty('--foreground', colors.foreground);
  element.style.setProperty('--card', colors.card);
  element.style.setProperty('--card-foreground', colors.cardForeground);
  element.style.setProperty('--primary', colors.primary);
  element.style.setProperty('--background-notes', colors.backgroundNotes);
  element.style.setProperty('--background-titlebar', colors.backgroundTitlebar);
  element.style.setProperty('--background-sidebar', colors.backgroundSidebar);
  element.style.setProperty('--border', colors.border);
  
  // Also set classes and data attributes
  element.classList.remove('dim', 'dark', 'light');
  element.classList.add(themeName);
  element.setAttribute('data-theme', themeName);
  
  // If this is the body element, also set direct styles
  if (element === document.body) {
    element.style.backgroundColor = colors.background;
    element.style.color = colors.foreground;
  }
};

/**
 * Apply theme to the entire document
 * @param themeName The name of the theme to apply
 */
export const applyThemeToDocument = (themeName: ThemeName) => {
  // Apply to document element
  applyThemeToElement(document.documentElement, themeName);
  
  // Apply to body
  applyThemeToElement(document.body, themeName);
  
  // Apply to all iframes
  const iframes = document.querySelectorAll('iframe');
  iframes.forEach(iframe => {
    try {
      if (iframe.contentDocument) {
        applyThemeToElement(iframe.contentDocument.documentElement, themeName);
        
        if (iframe.contentDocument.body) {
          applyThemeToElement(iframe.contentDocument.body, themeName);
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
