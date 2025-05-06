import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { AppSettings } from '../shared/services/settingsService';
import { DEFAULT_HOTKEYS, HotkeyAction } from '../shared/services/hotkeyService';
import { ThemeName, useTheme } from '../shared/services/themeService';
import { HotkeysSection } from './components/HotkeysSection';
import { SystemSection } from './components/SystemSection';
import { ThemesSection } from './components/ThemesSection';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';

// Define the form schema with Zod
const formSchema = z.object({
  saveLocation: z.string().min(1, {
    message: 'Save location is required.',
  }),
  autoSave: z.boolean(),
  autoSaveInterval: z.number().min(1).max(60),
  theme: z.string(), // Theme name instead of darkMode
  // System integration settings
  autoLaunch: z.boolean().optional(),
  minimizeToTray: z.boolean().optional(),
  globalHotkeys: z.object({
    newNote: z.string(),
    showApp: z.string(),
  }).optional(),
  // Hotkeys are handled separately from the form
});

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialSettings: AppSettings;
  onSave: (settings: AppSettings) => void;
}

export function SettingsDialog({
  open,
  onOpenChange,
  initialSettings,
  onSave,
}: SettingsDialogProps) {
  const { theme } = useTheme();
  const [isSelectingLocation, setIsSelectingLocation] = useState(false);
  const [hotkeys, setHotkeys] = useState<Record<HotkeyAction, string>>(
    initialSettings.hotkeys as Record<HotkeyAction, string> || DEFAULT_HOTKEYS
  );

  // Initialize the form with react-hook-form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      saveLocation: initialSettings.saveLocation,
      autoSave: initialSettings.autoSave,
      autoSaveInterval: initialSettings.autoSaveInterval,
      theme: initialSettings.theme || 'dim',
      autoLaunch: initialSettings.autoLaunch || false,
      minimizeToTray: initialSettings.minimizeToTray || true,
      globalHotkeys: initialSettings.globalHotkeys || {
        newNote: 'CommandOrControl+Alt+N',
        showApp: 'CommandOrControl+Alt+S',
      },
    },
  });

  // Handle form submission
  function onSubmit(values: z.infer<typeof formSchema>) {
    // Combine form values with hotkeys
    const combinedSettings: AppSettings = {
      ...values,
      hotkeys,
    } as AppSettings;

    onSave(combinedSettings);
    onOpenChange(false);
  }

  // Handle hotkey changes
  const handleHotkeyChange = (updatedHotkeys: Record<HotkeyAction, string>) => {
    setHotkeys(updatedHotkeys);
  };

  // Handle save location selection
  const handleSaveLocationSelect = async () => {
    setIsSelectingLocation(true);
    try {
      const result = await window.settings.selectDirectory();
      if (!result.canceled && result.filePaths.length > 0) {
        form.setValue('saveLocation', result.filePaths[0]);
      }
    } catch (error) {
      console.error('Error selecting directory:', error);
    } finally {
      setIsSelectingLocation(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={`sm:max-w-[800px] max-h-[calc(100vh-80px)] overflow-y-auto border border-border/30 backdrop-blur-md font-twitter shadow-2xl
          ${theme === 'light'
            ? 'bg-background/95 text-foreground'
            : 'bg-background/80'}`}
      >
        <DialogHeader className="mb-8">
          <DialogTitle className={`text-3xl font-semibold ${theme === 'light' ? 'text-black' : 'text-foreground'}`}>Settings</DialogTitle>
          <DialogDescription className={`mt-2 text-base ${theme === 'light' ? 'text-black/80' : 'text-muted-foreground'}`}>
            Configure your Scribble application preferences.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 py-4">
            {/* Storage Section */}
            <div className="space-y-6 bg-card/95 backdrop-blur-sm p-6 rounded-lg border border-border/50 shadow-md">
              <h3 className={`text-2xl font-semibold border-b border-border/50 pb-4 ${theme === 'light' ? 'text-black' : 'text-foreground'}`}>Storage</h3>

              <FormField
                control={form.control}
                name="saveLocation"
                render={({ field }) => (
                  <FormItem className="bg-card/95 backdrop-blur-sm p-5 rounded-lg border border-border/30">
                    <FormLabel className={`text-base font-medium ${theme === 'light' ? 'text-black' : 'text-foreground'}`}>Save Location</FormLabel>
                    <div className="flex gap-2 mt-3">
                      <FormControl>
                        <Input
                          {...field}
                          readOnly
                          className={`bg-secondary border border-border/50 flex-1 focus:border-primary/50 focus:ring-1 focus:ring-primary/30 shadow-sm ${theme === 'light' ? 'text-black' : 'text-secondary-foreground'}`}
                        />
                      </FormControl>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleSaveLocationSelect}
                        disabled={isSelectingLocation}
                        className="shrink-0 border-border/50 bg-secondary hover:bg-secondary/80 text-secondary-foreground font-medium px-4 shadow-sm transition-colors duration-200 active:scale-95"
                      >
                        Browse...
                      </Button>
                    </div>
                    <FormDescription className={`mt-3 text-sm ${theme === 'light' ? 'text-black/70' : 'text-muted-foreground'}`}>
                      Choose where to save your notes
                    </FormDescription>
                  </FormItem>
                )}
              />
            </div>

            {/* Auto Save Section */}
            <div className="space-y-6 bg-card/95 backdrop-blur-sm p-6 rounded-lg border border-border/50 shadow-md">
              <h3 className={`text-2xl font-semibold border-b border-border/50 pb-4 ${theme === 'light' ? 'text-black' : 'text-foreground'}`}>Auto Save</h3>

              <FormField
                control={form.control}
                name="autoSave"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border border-border/30 p-5 bg-card/95 backdrop-blur-sm">
                    <div className="space-y-2">
                      <FormLabel className={`text-base font-medium ${theme === 'light' ? 'text-black' : 'text-foreground'}`}>Auto Save</FormLabel>
                      <FormDescription className={`text-sm ${theme === 'light' ? 'text-black/70' : 'text-muted-foreground'}`}>
                        Automatically save notes while typing
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className="data-[state=checked]:bg-primary"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {form.watch('autoSave') && (
                <FormField
                  control={form.control}
                  name="autoSaveInterval"
                  render={({ field }) => (
                    <FormItem className="bg-card/95 backdrop-blur-sm p-5 rounded-lg border border-border/30 mt-4">
                      <FormLabel className={`text-base font-medium ${theme === 'light' ? 'text-black' : 'text-foreground'}`}>Auto Save Interval (seconds)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          max={60}
                          className={`bg-secondary border border-border/50 mt-3 w-full md:w-1/3 focus:border-primary/50 focus:ring-1 focus:ring-primary/30 shadow-sm ${theme === 'light' ? 'text-black' : 'text-secondary-foreground'}`}
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormDescription className={`mt-3 text-sm ${theme === 'light' ? 'text-black/70' : 'text-muted-foreground'}`}>
                        How often to automatically save notes (1-60 seconds)
                      </FormDescription>
                    </FormItem>
                  )}
                />
              )}
            </div>

            {/* Appearance Section */}
            <div className="space-y-6 bg-card/95 backdrop-blur-sm p-6 rounded-lg border border-border/50 shadow-md">
              <ThemesSection
                currentTheme={form.watch('theme') as ThemeName}
                onChange={(theme) => form.setValue('theme', theme)}
              />
            </div>

            {/* System Integration Section */}
            <SystemSection form={form} theme={theme} />

            {/* Hotkeys Section */}
            <div className="space-y-6 bg-card/95 backdrop-blur-sm p-6 rounded-lg border border-border/50 shadow-md">
              <HotkeysSection
                hotkeys={hotkeys}
                onChange={handleHotkeyChange}
                theme={theme}
              />
            </div>

            <DialogFooter className="pt-8 border-t border-border/50 mt-6 bg-card/95 backdrop-blur-sm p-4 rounded-b-lg -mx-6 -mb-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className={`px-6 py-2.5 border-border/50 bg-secondary hover:bg-secondary/90 font-medium shadow-sm transition-all duration-200 active:scale-95 ${theme === 'light' ? 'text-black' : 'text-secondary-foreground'}`}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="px-6 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground font-medium shadow-md transition-all duration-200 active:scale-95 border-0"
              >
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
