import { useEffect, useState } from 'react';
import moment from 'moment';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface AttendanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: { clockIn: string; clockOut?: string }) => void;
  initialData?: { clockIn?: string; clockOut?: string };
}

export function AttendanceDialog({
  open,
  onOpenChange,
  onSubmit,
  initialData
}: AttendanceDialogProps) {
  const baseDate = initialData?.clockIn
    ? moment(initialData.clockIn)
    : moment();
  const [clockin, setClockin] = useState('00:00');
  const [clockout, setClockout] = useState('00:00');

  const [openDialog, setOpenDialog] = useState<'start' | 'end' | null>(null);
  const [tempTime, setTempTime] = useState({ hour: 0, minute: 0 });

  useEffect(() => {
    if (initialData?.clockIn) {
      const m = moment(initialData.clockIn);
      setClockin(m.format('HH:mm'));
    }

    if (initialData?.clockOut) {
      const m = moment(initialData.clockOut);
      setClockout(m.format('HH:mm'));
    }
  }, [initialData]);

  const confirmTime = () => {
    const formatted = `${String(tempTime.hour).padStart(2, '0')}:${String(tempTime.minute).padStart(2, '0')}`;
    if (openDialog === 'start') setClockin(formatted);
    if (openDialog === 'end') setClockout(formatted);
    setOpenDialog(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const [inH, inM] = clockin.split(':').map(Number);
    const [outH, outM] = clockout?.split(':').map(Number) || [];

    const newClockIn = baseDate
      .clone()
      .set({ hour: inH, minute: inM, second: 0 });
    const newClockOut = clockout
      ? baseDate.clone().set({ hour: outH, minute: outM, second: 0 })
      : null;

    onSubmit({
      clockIn: newClockIn.toISOString(),
      clockOut: newClockOut?.toISOString()
    });

    onOpenChange(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{initialData ? 'Edit' : 'Add'} Attendance</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Clock In */}
            <div className="flex flex-row items-center gap-4 space-y-2">
              <Label>Clock In Time</Label>
              <Button
                type="button"
                variant="outline"
                className="bg-white text-black hover:bg-gray-100 hover:text-black"
                onClick={() => {
                  const [h, m] = clockin.split(':').map(Number);
                  setTempTime({ hour: h, minute: m });
                  setOpenDialog('start');
                }}
              >
                {clockin}
              </Button>
            </div>

            {/* Clock Out */}
            <div className="flex flex-row items-center gap-4 space-y-2">
              <Label>Clock Out Time</Label>
              <Button
                type="button"
                variant="outline"
                className="bg-white text-black hover:bg-gray-100 hover:text-black"
                onClick={() => {
                  const [h, m] = clockout.split(':').map(Number);
                  setTempTime({ hour: h, minute: m });
                  setOpenDialog('end');
                }}
              >
                {clockout}
              </Button>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                type="button"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="border-none bg-supperagent text-white hover:bg-supperagent/90"
              >
                Submit
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Time Picker Modal */}
      <Dialog open={!!openDialog} onOpenChange={() => setOpenDialog(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              Select {openDialog === 'start' ? 'Start' : 'End'} Time
            </DialogTitle>
          </DialogHeader>

          <div className="mb-4 flex justify-center text-2xl font-bold">
            {String(tempTime.hour).padStart(2, '0')}:
            {String(tempTime.minute).padStart(2, '0')}
          </div>

          <div className="flex gap-4">
            <TimeScrollList
              title="Hours"
              items={Array.from({ length: 24 }, (_, i) => ({
                value: i,
                label: String(i).padStart(2, '0')
              }))}
              selectedValue={tempTime.hour}
              onSelect={(val) =>
                setTempTime((prev) => ({ ...prev, hour: val }))
              }
            />
            <TimeScrollList
              title="Minutes"
              items={Array.from({ length: 12 }, (_, i) => i * 5).map((m) => ({
                value: m,
                label: String(m).padStart(2, '0')
              }))}
              selectedValue={tempTime.minute}
              onSelect={(val) =>
                setTempTime((prev) => ({ ...prev, minute: val }))
              }
            />
          </div>

          <div className="mt-4 flex justify-end gap-2">
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
        </DialogContent>
      </Dialog>
    </>
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
