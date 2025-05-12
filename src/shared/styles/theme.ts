import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Define the available theme names
export type ThemeName = 'dim' | 'dark' | 'light';

// Theme interface
export interface Theme {
  name: ThemeName;
  label: string;
  description: string;
  // Preview colors for the theme selector
  preview: {
    background: string;
    foreground: string;
    primary: string;
    card: string;
  };
}

// Define the themes
export const themes: Record<ThemeName, Theme> = {
  dim: {
    name: 'dim',
    label: 'Dim',
    description: 'The original Scribble theme with muted colors',
    preview: {
      background: '#282a36',
      foreground: '#f8f8f2',
      primary: '#f59e0b',
      card: '#21222c',
    },
  },
  dark: {
    name: 'dark',
    label: 'Dark',
    description: 'A true dark theme with deeper blacks and higher contrast',
    preview: {
      background: '#121212',
      foreground: '#ffffff',
      primary: '#f59e0b',
      card: '#1a1a1a',
    },
  },
  light: {
    name: 'light',
    label: 'Light',
    description: 'A light theme with white background and dark text',
    preview: {
      background: '#ffffff',
      foreground: '#333333',
      primary: '#3b82f6',
      card: '#f9fafb',
    },
  },
};

// Utility function to combine class names with Tailwind
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
