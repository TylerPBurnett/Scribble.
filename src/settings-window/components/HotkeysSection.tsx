import { useState } from 'react';
import {
  HotkeyAction,
  HOTKEY_CATEGORIES,
  HOTKEY_LABELS,
  DEFAULT_HOTKEYS
} from '../../shared/services/hotkeyService';
import { HotkeyEditor } from './HotkeyEditor';

interface HotkeysSectionProps {
  hotkeys: Record<HotkeyAction, string>;
  onChange: (hotkeys: Record<HotkeyAction, string>) => void;
}

export function HotkeysSection({ hotkeys, onChange }: HotkeysSectionProps) {
  const [activeCategory, setActiveCategory] = useState<string>(Object.keys(HOTKEY_CATEGORIES)[0]);

  // Handle hotkey change
  const handleHotkeyChange = (action: HotkeyAction, value: string) => {
    onChange({
      ...hotkeys,
      [action]: value
    });
  };

  // Handle reset to defaults
  const handleResetToDefaults = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onChange(DEFAULT_HOTKEYS);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-semibold text-foreground border-b border-border pb-4">Keyboard Shortcuts</h3>
        <button
          className="flex items-center gap-1 px-3 py-1 rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
          onClick={handleResetToDefaults}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="opacity-80">
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
            <path d="M3 3v5h5"></path>
          </svg>
          <span>Reset to defaults</span>
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-6 mt-6">
        {/* Category tabs */}
        <div className="w-full md:w-1/4">
          <div className="flex flex-col space-y-2 bg-card/95 backdrop-blur-sm rounded-lg p-2 border border-border/30">
            {Object.entries(HOTKEY_CATEGORIES).map(([key, category]) => (
              <button
                key={key}
                className={`
                  text-left px-4 py-3 rounded-md text-sm transition-colors duration-200 border
                  ${activeCategory === key
                    ? 'bg-primary/10 text-primary font-medium border-primary/30 shadow-sm'
                    : 'hover:bg-secondary/50 text-muted-foreground border-transparent hover:border-border/50'}
                `}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setActiveCategory(key);
                }}
              >
                {category.title}
              </button>
            ))}
          </div>
        </div>

        {/* Hotkey editors */}
        <div className="w-full md:w-3/4 bg-card/95 backdrop-blur-sm rounded-lg p-5 border border-border/30">
          <div className="space-y-3">
            {HOTKEY_CATEGORIES[activeCategory as keyof typeof HOTKEY_CATEGORIES]?.actions.map((action) => (
              <HotkeyEditor
                key={action}
                action={action}
                label={HOTKEY_LABELS[action]}
                currentValue={hotkeys[action]}
                onChange={handleHotkeyChange}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
