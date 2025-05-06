import { FormControl, FormDescription, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { UseFormReturn } from 'react-hook-form';
import { z } from 'zod';
import { AppSettings } from '../../shared/services/settingsService';
import { ThemeName } from '../../shared/services/themeService';

// Define the form schema with Zod
const formSchema = z.object({
  autoLaunch: z.boolean(),
  minimizeToTray: z.boolean(),
  globalHotkeys: z.object({
    newNote: z.string(),
    showApp: z.string(),
  }),
});

type SystemSectionProps = {
  form: UseFormReturn<any>;
  theme?: ThemeName;
};

export function SystemSection({ form, theme = 'dim' }: SystemSectionProps) {
  return (
    <div className="space-y-6 bg-card/95 backdrop-blur-sm p-6 rounded-lg border border-border/50 shadow-md">
      <h3 className={`text-2xl font-semibold border-b border-border/50 pb-4 ${theme === 'light' ? 'text-black' : 'text-foreground'}`}>System Integration</h3>

      {/* Auto Launch */}
      <FormField
        control={form.control}
        name="autoLaunch"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between rounded-lg border border-border/30 p-5 bg-card/95 backdrop-blur-sm">
            <div className="space-y-2">
              <FormLabel className={`text-base font-medium ${theme === 'light' ? 'text-black' : 'text-foreground'}`}>Start with Windows</FormLabel>
              <FormDescription className={`text-sm ${theme === 'light' ? 'text-black/70' : 'text-muted-foreground'}`}>
                Launch Scribble automatically when you log in
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

      {/* Minimize to Tray */}
      <FormField
        control={form.control}
        name="minimizeToTray"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between rounded-lg border border-border/30 p-5 bg-card/95 backdrop-blur-sm mt-4">
            <div className="space-y-2">
              <FormLabel className={`text-base font-medium ${theme === 'light' ? 'text-black' : 'text-foreground'}`}>Minimize to System Tray</FormLabel>
              <FormDescription className={`text-sm ${theme === 'light' ? 'text-black/70' : 'text-muted-foreground'}`}>
                Keep Scribble running in the system tray when closed
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

      <div className="space-y-5 mt-8 pt-6 border-t border-border/50">
        <div>
          <h4 className={`text-xl font-semibold ${theme === 'light' ? 'text-black' : 'text-foreground'}`}>Global Hotkeys</h4>
          <FormDescription className={`text-sm mt-1 ${theme === 'light' ? 'text-black/70' : 'text-muted-foreground'}`}>
            These hotkeys work even when Scribble is minimized to the system tray
          </FormDescription>
        </div>

        {/* New Note Global Hotkey */}
        <FormField
          control={form.control}
          name="globalHotkeys.newNote"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border border-border/30 p-5 bg-card/95 backdrop-blur-sm">
              <div className="space-y-2">
                <FormLabel className={`text-base font-medium ${theme === 'light' ? 'text-black' : 'text-foreground'}`}>New Note</FormLabel>
                <FormDescription className={`text-sm ${theme === 'light' ? 'text-black/70' : 'text-muted-foreground'}`}>
                  Global hotkey to create a new note
                </FormDescription>
              </div>
              <FormControl>
                <Input
                  {...field}
                  className={`w-48 bg-secondary border border-border/50 focus:border-primary/50 focus:ring-1 focus:ring-primary/30 shadow-sm font-mono ${theme === 'light' ? 'text-black' : 'text-secondary-foreground'}`}
                  placeholder="e.g. CommandOrControl+Alt+N"
                />
              </FormControl>
            </FormItem>
          )}
        />

        {/* Show App Global Hotkey */}
        <FormField
          control={form.control}
          name="globalHotkeys.showApp"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border border-border/30 p-5 bg-card/95 backdrop-blur-sm">
              <div className="space-y-2">
                <FormLabel className={`text-base font-medium ${theme === 'light' ? 'text-black' : 'text-foreground'}`}>Show App</FormLabel>
                <FormDescription className={`text-sm ${theme === 'light' ? 'text-black/70' : 'text-muted-foreground'}`}>
                  Global hotkey to show the main window
                </FormDescription>
              </div>
              <FormControl>
                <Input
                  {...field}
                  className={`w-48 bg-secondary border border-border/50 focus:border-primary/50 focus:ring-1 focus:ring-primary/30 shadow-sm font-mono ${theme === 'light' ? 'text-black' : 'text-secondary-foreground'}`}
                  placeholder="e.g. CommandOrControl+Alt+S"
                />
              </FormControl>
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
