import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { AppSettings } from '../shared/services/settingsService';

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
  darkMode: z.boolean(),
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
  const [isSelectingLocation, setIsSelectingLocation] = useState(false);

  // Initialize the form with react-hook-form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      saveLocation: initialSettings.saveLocation,
      autoSave: initialSettings.autoSave,
      autoSaveInterval: initialSettings.autoSaveInterval,
      darkMode: initialSettings.darkMode,
    },
  });

  // Handle form submission
  function onSubmit(values: z.infer<typeof formSchema>) {
    onSave(values as AppSettings);
    onOpenChange(false);
  }

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
      <DialogContent className="sm:max-w-[800px] max-h-[calc(100vh-80px)] overflow-y-auto border-none bg-background-notes font-twitter">
        <DialogHeader className="mb-6">
          <DialogTitle className="text-2xl">Settings</DialogTitle>
          <DialogDescription>
            Configure your Scribble application preferences.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 py-4">
            {/* Storage Section */}
            <div className="space-y-6 bg-background-titlebar/90 p-6 rounded-lg border-0">
              <h3 className="text-xl font-medium border-b-0 pb-3">Storage</h3>

              <FormField
                control={form.control}
                name="saveLocation"
                render={({ field }) => (
                  <FormItem className="bg-background-notes/50 p-4 rounded-lg border-0">
                    <FormLabel className="text-base">Save Location</FormLabel>
                    <div className="flex gap-2 mt-2">
                      <FormControl>
                        <Input
                          {...field}
                          readOnly
                          className="bg-background-titlebar border-0 flex-1"
                        />
                      </FormControl>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={handleSaveLocationSelect}
                        disabled={isSelectingLocation}
                        className="shrink-0"
                      >
                        Browse...
                      </Button>
                    </div>
                    <FormDescription className="mt-2">
                      Choose where to save your notes
                    </FormDescription>
                  </FormItem>
                )}
              />
            </div>

            {/* Auto Save Section */}
            <div className="space-y-6 bg-background-titlebar/90 p-6 rounded-lg border-0">
              <h3 className="text-xl font-medium border-b-0 pb-3">Auto Save</h3>

              <FormField
                control={form.control}
                name="autoSave"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border-0 p-4 bg-background-notes/50">
                    <div className="space-y-1">
                      <FormLabel className="text-base">Auto Save</FormLabel>
                      <FormDescription className="text-sm">
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
                    <FormItem className="bg-background-notes/50 p-4 rounded-lg border-0">
                      <FormLabel className="text-base">Auto Save Interval (seconds)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          max={60}
                          className="bg-background-titlebar border-0 mt-2"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormDescription className="mt-2">
                        How often to automatically save notes (1-60 seconds)
                      </FormDescription>
                    </FormItem>
                  )}
                />
              )}
            </div>

            {/* Appearance Section */}
            <div className="space-y-6 bg-background-titlebar/90 p-6 rounded-lg border-0">
              <h3 className="text-xl font-medium border-b-0 pb-3">Appearance</h3>

              <FormField
                control={form.control}
                name="darkMode"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border-0 p-4 bg-background-notes/50">
                    <div className="space-y-1">
                      <FormLabel className="text-base">Dark Mode</FormLabel>
                      <FormDescription className="text-sm">
                        Use dark theme for the application
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
            </div>

            <DialogFooter className="pt-6">
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
                className="px-6"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="px-6 bg-primary hover:bg-primary-dark"
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
