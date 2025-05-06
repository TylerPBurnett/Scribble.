import { FormControl, FormDescription, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { UseFormReturn } from 'react-hook-form';
import { z } from 'zod';
import { AppSettings } from '../../shared/services/settingsService';

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
};

export function SystemSection({ form }: SystemSectionProps) {
  return (
    <div className="space-y-6 bg-card p-6 rounded-lg border border-border shadow-md">
      <h3 className="text-2xl font-semibold text-foreground border-b border-border pb-4">System Integration</h3>

      {/* Auto Launch */}
      <FormField
        control={form.control}
        name="autoLaunch"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between rounded-lg border border-border/30 p-5 bg-card/80">
            <div className="space-y-2">
              <FormLabel className="text-base font-medium text-foreground">Start with Windows</FormLabel>
              <FormDescription className="text-sm text-muted-foreground">
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
          <FormItem className="flex flex-row items-center justify-between rounded-lg border border-border/30 p-5 bg-card/80 mt-4">
            <div className="space-y-2">
              <FormLabel className="text-base font-medium text-foreground">Minimize to System Tray</FormLabel>
              <FormDescription className="text-sm text-muted-foreground">
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
          <h4 className="text-xl font-semibold text-foreground">Global Hotkeys</h4>
          <FormDescription className="text-sm text-muted-foreground mt-1">
            These hotkeys work even when Scribble is minimized to the system tray
          </FormDescription>
        </div>

        {/* New Note Global Hotkey */}
        <FormField
          control={form.control}
          name="globalHotkeys.newNote"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border border-border/30 p-5 bg-card/80">
              <div className="space-y-2">
                <FormLabel className="text-base font-medium text-foreground">New Note</FormLabel>
                <FormDescription className="text-sm text-muted-foreground">
                  Global hotkey to create a new note
                </FormDescription>
              </div>
              <FormControl>
                <Input
                  {...field}
                  className="w-48 bg-secondary/80 border border-border/50 text-secondary-foreground focus:border-primary/50 focus:ring-1 focus:ring-primary/30 shadow-sm font-mono"
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
            <FormItem className="flex flex-row items-center justify-between rounded-lg border border-border/30 p-5 bg-card/80">
              <div className="space-y-2">
                <FormLabel className="text-base font-medium text-foreground">Show App</FormLabel>
                <FormDescription className="text-sm text-muted-foreground">
                  Global hotkey to show the main window
                </FormDescription>
              </div>
              <FormControl>
                <Input
                  {...field}
                  className="w-48 bg-secondary/80 border border-border/50 text-secondary-foreground focus:border-primary/50 focus:ring-1 focus:ring-primary/30 shadow-sm font-mono"
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
