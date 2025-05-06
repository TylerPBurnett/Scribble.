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
    <div className="space-y-6 bg-background-titlebar/90 p-6 rounded-lg border-0">
      <h3 className="text-xl font-medium border-b-0 pb-3">System Integration</h3>

      {/* Auto Launch */}
      <FormField
        control={form.control}
        name="autoLaunch"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between rounded-lg border-0 p-4 bg-background-notes/50">
            <div className="space-y-1">
              <FormLabel className="text-base">Start with Windows</FormLabel>
              <FormDescription className="text-sm">
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
          <FormItem className="flex flex-row items-center justify-between rounded-lg border-0 p-4 bg-background-notes/50">
            <div className="space-y-1">
              <FormLabel className="text-base">Minimize to System Tray</FormLabel>
              <FormDescription className="text-sm">
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

      <div className="space-y-4 mt-6">
        <h4 className="text-lg font-medium">Global Hotkeys</h4>
        <FormDescription className="text-sm">
          These hotkeys work even when Scribble is minimized to the system tray
        </FormDescription>

        {/* New Note Global Hotkey */}
        <FormField
          control={form.control}
          name="globalHotkeys.newNote"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border-0 p-4 bg-background-notes/50">
              <div className="space-y-1">
                <FormLabel className="text-base">New Note</FormLabel>
                <FormDescription className="text-sm">
                  Global hotkey to create a new note
                </FormDescription>
              </div>
              <FormControl>
                <Input
                  {...field}
                  className="w-40 bg-background-tertiary/50 border-border/50"
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
            <FormItem className="flex flex-row items-center justify-between rounded-lg border-0 p-4 bg-background-notes/50">
              <div className="space-y-1">
                <FormLabel className="text-base">Show App</FormLabel>
                <FormDescription className="text-sm">
                  Global hotkey to show the main window
                </FormDescription>
              </div>
              <FormControl>
                <Input
                  {...field}
                  className="w-40 bg-background-tertiary/50 border-border/50"
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
