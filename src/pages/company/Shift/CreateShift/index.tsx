
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useState } from 'react';

import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormControl
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import axiosInstance from '@/lib/axios';
import { useNavigate } from 'react-router-dom';
import { MoveLeft } from 'lucide-react';


const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

const timeOnlySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  startTime: z.string().regex(timeRegex, 'Start time must be in HH:mm format'),
  endTime: z.string().regex(timeRegex, 'End time must be in HH:mm format')
});

type TimeOnlyFormData = z.infer<typeof timeOnlySchema>;

export default function TimeOnlyPickerForm() {
  const form = useForm<TimeOnlyFormData>({
    resolver: zodResolver(timeOnlySchema),
    defaultValues: {
      name: '',
      startTime: '00:00',
      endTime: '00:00'
    }
  });

  const navigate = useNavigate();

  const [openDialog, setOpenDialog] = useState<'start' | 'end' | null>(null);
  const [tempTime, setTempTime] = useState({ hour: 9, minute: 0 });

  const handleTimeClick = (type: 'start' | 'end') => {
    const [hour, minute] = form
      .getValues(type === 'start' ? 'startTime' : 'endTime')
      .split(':')
      .map(Number);
    setTempTime({ hour, minute });
    setOpenDialog(type);
  };

  const selectTime = (hour: number, minute: number) => {
    setTempTime({ hour, minute });
  };

  const confirmTime = () => {
    if (!openDialog) return;

    const time = `${String(tempTime.hour).padStart(2, '0')}:${String(tempTime.minute).padStart(2, '0')}`;
    form.setValue(openDialog === 'start' ? 'startTime' : 'endTime', time, {
      shouldValidate: true
    });
    setOpenDialog(null);
  };

  const onSubmit = async (data) => {
    try {
      // Send the times as strings in HH:MM format
      const payload = {
        name: data.name,
        startTime: data.startTime,
        endTime: data.endTime
      };

      const response = await axiosInstance.post('/hr/shift', payload);
      if (response) {
        navigate('/admin/hr/shift');
      }
    } catch (error) {
      console.error('Error creating shift:', error);
    }
  };

  return (
    <Card className="w-full ">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-xl font-semibold">
          Shift Time Configuration
        </CardTitle>
        <Button
          onClick={() => navigate(-1)}
          className="bg-supperagent text-white hover:bg-supperagent/90"
        >
          <MoveLeft />
          Back
        </Button>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="flex flex-row items-center justify-between gap-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel>Shift Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Morning Shift" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel>Start Time</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          {...field}
                          onClick={() => handleTimeClick('start')}
                          className="cursor-pointer"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endTime"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel>End Time</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          {...field}
                          onClick={() => handleTimeClick('end')}
                          className="cursor-pointer"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => form.reset()}
              >
                Reset
              </Button>
              <Button
                type="submit"
                className="bg-supperagent text-white hover:bg-supperagent/90"
              >
                Save Shift
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>

      {/* Time Selection Dialog */}
      <Dialog
  open={!!openDialog}
  onOpenChange={(open) => !open && setOpenDialog(null)}
>
  <DialogContent className="sm:max-w-[425px]">
    <DialogHeader>
      <DialogTitle>
        Select {openDialog === 'start' ? 'Start' : 'End'} Time
      </DialogTitle>
    </DialogHeader>

    <div className="grid gap-4 py-4">
      {/* Current time display */}
      <div className="flex items-center justify-center gap-2">
        <span className="text-2xl font-bold">
          {String(tempTime.hour).padStart(2, '0')}:
          {String(tempTime.minute).padStart(2, '0')}
        </span>
      </div>

      {/* Manual Input */}
      <div className="flex gap-4 justify-center">
        <div className="flex flex-col items-center">
          <label className="text-sm font-medium">Hour</label>
          <Input
            type="number"
            min="0"
            max="23"
            value={tempTime.hour}
            onChange={(e) =>
              selectTime(
                Math.min(23, Math.max(0, parseInt(e.target.value || '0'))),
                tempTime.minute
              )
            }
            className="w-32 text-center border rounded-md py-1"
          />
        </div>
        <div className="flex flex-col items-center">
          <label className="text-sm font-medium">Minute</label>
          <Input
            type="number"
            min="0"
            max="59"
            step="5"
            value={tempTime.minute}
            onChange={(e) =>
              selectTime(
                tempTime.hour,
                Math.min(59, Math.max(0, parseInt(e.target.value || '0')))
              )
            }
            className="w-32 text-center border rounded-md py-1"
          />
        </div>
      </div>

      {/* Scroll List */}
      <div className="flex gap-4">
        <TimeScrollList
          title="Hours"
          items={Array.from({ length: 24 }, (_, i) => ({
            value: i,
            label: i.toString().padStart(2, '0')
          }))}
          selectedValue={tempTime.hour}
          onSelect={(value) => selectTime(value, tempTime.minute)}
        />
        <TimeScrollList
          title="Minutes"
          items={Array.from({ length: 12 }, (_, i) => i * 5).map((m) => ({
            value: m,
            label: m.toString().padStart(2, '0')
          }))}
          selectedValue={tempTime.minute}
          onSelect={(value) => selectTime(tempTime.hour, value)}
        />
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-2 pt-4">
        <Button variant="outline" onClick={() => setOpenDialog(null)}>
          Cancel
        </Button>
        <Button
          onClick={confirmTime}
          className="bg-supperagent text-white hover:bg-supperagent/90"
        >
          Confirm
        </Button>
      </div>
    </div>
  </DialogContent>
</Dialog>

    </Card>
  );
}

interface TimeScrollListProps {
  title: string;
  items: { value: number; label: string }[];
  selectedValue: number;
  onSelect: (value: number) => void;
}

function TimeScrollList({
  title,
  items,
  selectedValue,
  onSelect
}: TimeScrollListProps) {
  return (
    <div className="flex-1">
      <h3 className="mb-1 text-sm font-medium text-muted-foreground">
        {title}
      </h3>
      <ScrollArea className="h-48 rounded-md border">
        <div className="flex flex-col gap-1 p-1">
          {items.map((item) => (
            <Button
              key={item.value}
              variant="ghost"
              className={cn(
                'h-9 w-full justify-center px-2',
                item.value === selectedValue &&
                  'bg-black text-white hover:bg-black'
              )}
              onClick={() => onSelect(item.value)}
              aria-selected={item.value === selectedValue}
            >
              {item.label}
            </Button>
          ))}
        </div>
        <ScrollBar orientation="vertical" />
      </ScrollArea>
    </div>
  );
}
