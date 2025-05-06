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
    <div className="space-y-6 bg-[#121212] p-6 rounded-lg border border-gray-800/50 shadow-md">
      <h3 className="text-2xl font-semibold text-white border-b border-gray-800 pb-4">System Integration</h3>

      {/* Auto Launch */}
      <FormField
        control={form.control}
        name="autoLaunch"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between rounded-lg border border-gray-800/30 p-5 bg-[#1a1a1a]">
            <div className="space-y-2">
              <FormLabel className="text-base font-medium text-white">Start with Windows</FormLabel>
              <FormDescription className="text-sm text-gray-400">
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
          <FormItem className="flex flex-row items-center justify-between rounded-lg border border-gray-800/30 p-5 bg-[#1a1a1a] mt-4">
            <div className="space-y-2">
              <FormLabel className="text-base font-medium text-white">Minimize to System Tray</FormLabel>
              <FormDescription className="text-sm text-gray-400">
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

      <div className="space-y-5 mt-8 pt-6 border-t border-gray-800/50">
        <div>
          <h4 className="text-xl font-semibold text-white">Global Hotkeys</h4>
          <FormDescription className="text-sm text-gray-400 mt-1">
            These hotkeys work even when Scribble is minimized to the system tray
          </FormDescription>
        </div>

        {/* New Note Global Hotkey */}
        <FormField
          control={form.control}
          name="globalHotkeys.newNote"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border border-gray-800/30 p-5 bg-[#1a1a1a]">
              <div className="space-y-2">
                <FormLabel className="text-base font-medium text-white">New Note</FormLabel>
                <FormDescription className="text-sm text-gray-400">
                  Global hotkey to create a new note
                </FormDescription>
              </div>
              <FormControl>
                <Input
                  {...field}
                  className="w-48 bg-gradient-to-b from-[#2a2a2a] to-[#222222] border border-gray-700/30 text-gray-300 focus:border-primary/50 focus:ring-1 focus:ring-primary/30 shadow-sm font-mono"
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
            <FormItem className="flex flex-row items-center justify-between rounded-lg border border-gray-800/30 p-5 bg-[#1a1a1a]">
              <div className="space-y-2">
                <FormLabel className="text-base font-medium text-white">Show App</FormLabel>
                <FormDescription className="text-sm text-gray-400">
                  Global hotkey to show the main window
                </FormDescription>
              </div>
              <FormControl>
                <Input
                  {...field}
                  className="w-48 bg-gradient-to-b from-[#2a2a2a] to-[#222222] border border-gray-700/30 text-gray-300 focus:border-primary/50 focus:ring-1 focus:ring-primary/30 shadow-sm font-mono"
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
