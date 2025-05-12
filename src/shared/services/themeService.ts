// This file is kept for backward compatibility
// New code should import from '../styles/theme' and '../providers/ThemeProvider'

import { themes } from '../styles/theme';
import { ThemeContext, ThemeProvider, useTheme } from '../providers/ThemeProvider';
import { applyThemeToDocument } from '../utils/themeUtils';
import type { ThemeName, Theme } from '../styles/theme';

// Re-export everything for backward compatibility
export type { ThemeName, Theme };
export { themes, ThemeContext, ThemeProvider, useTheme, applyThemeToDocument };
