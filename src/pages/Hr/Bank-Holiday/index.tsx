import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit, Calendar as CalendarIcon } from 'lucide-react';
import axiosInstance from '@/lib/axios';
import { useToast } from '@/components/ui/use-toast';
import {
  Table,
  TableBody,
  TableHeader,
  TableCell,
  TableHead,
  TableRow
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { BlinkingDots } from '@/components/shared/blinking-dots';

interface BankHoliday {
  _id: string;
  date: string;
  title: string;
  year: number;
}

interface ApiResponse {
  data: {
    result: BankHoliday[];
  };
}

function BankHolidayPage() {
  const [holidays, setHolidays] = useState<BankHoliday[]>([]);
  const [date, setDate] = useState<Date | undefined>(undefined); // Selected date as Date object
  const [title, setTitle] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState<BankHoliday | null>(
    null
  );
  const { toast } = useToast();
const [isLoadingHolidays, setIsLoadingHolidays] = useState(true);


  // Fetch holidays on mount
  const fetchHolidays = async () => {
    setIsLoadingHolidays(true);
    try {
      const response = await axiosInstance.get<ApiResponse>('/hr/bank-holiday');
      const holidaysData = response.data?.data?.result || [];
      setHolidays(holidaysData);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to load holidays. Please try again later.',
        variant: 'destructive'
      });
      console.error('Error fetching holidays:', error);
    }finally {
    setIsLoadingHolidays(false); 
  }
  };

  useEffect(() => {
    fetchHolidays();
  }, []);

  // Reset form fields
  const resetForm = () => {
    setDate(undefined);
    setTitle('');
    setEditingHoliday(null);
  };

  // Save holiday (create or update)
  const handleSaveHoliday = async () => {
    if (!date || !title.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please select a date and enter a title.',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);
    const formattedDate = date.toISOString().split('T')[0]; // YYYY-MM-DD
    const holidayData = {
      date: formattedDate,
      title: title.trim(),
      year: date.getFullYear()
    };

    try {
      if (editingHoliday) {
        await axiosInstance.patch(
          `/hr/bank-holiday/${editingHoliday._id}`,
          holidayData
        );
        toast({ title: 'Holiday updated successfully!' });
      } else {
        await axiosInstance.post('/hr/bank-holiday', holidayData);
        toast({ title: 'Holiday added successfully!' });
      }

      // Refresh list
      await fetchHolidays();
      resetForm();
      setIsDialogOpen(false);
    } catch (error: any) {
      toast({
        title: error.response?.data?.message || 'Failed to save holiday.',
        variant: 'destructive'
      });
      console.error('Error saving holiday:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Delete holiday
  const handleDeleteHoliday = async (id: string) => {
    try {
      await axiosInstance.delete(`/hr/bank-holiday/${id}`);
      setHolidays((prev) => prev.filter((h) => h._id !== id));
      toast({ title: 'Holiday deleted successfully!' });
    } catch (error: any) {
      toast({
        title: error.response?.data?.message || 'Failed to delete holiday.',
        variant: 'destructive'
      });
      console.error('Error deleting holiday:', error);
    }
  };

  // Handle edit button click
  const handleEditClick = (holiday: BankHoliday) => {
    setEditingHoliday(holiday);
    setDate(new Date(holiday.date)); // Convert string to Date object
    setTitle(holiday.title);
    setIsDialogOpen(true);
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
if(isLoadingHolidays) {
  return (
    <>
    <div className="flex justify-center py-6">
                <BlinkingDots size="large" color="bg-supperagent" />
              </div>
    </>
  )
}
  return (
    <div className="">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">
          Bank Holiday Management
        </h1>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={resetForm}
              className="bg-supperagent text-white hover:bg-supperagent/90"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Holiday
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingHoliday ? 'Edit Holiday' : 'Add New Holiday'}
              </DialogTitle>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              {/* Date Field */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="date" className="text-right">
                  Date
                </Label>
                <div className="col-span-3">
                  <DatePicker
                    selected={date || null}
                    onChange={(newDate: Date | null) =>
                      setDate(newDate || undefined)
                    }
                    dateFormat="dd-MM-yyyy"
                    customInput={
                      <button
                        type="button"
                        className="flex w-full items-center justify-start rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-supperagent"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date ? (
                          date.toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                          })
                        ) : (
                          <span>Pick a date</span>
                        )}
                      </button>
                    }
                    wrapperClassName="w-full"
                    showYearDropdown
                    scrollableYearDropdown
                    yearDropdownItemNumber={15}
                    popperPlacement="bottom-start"
                    todayButton="Today"
                    placeholderText="Pick a date"
                    preventOpenOnFocus
                    minDate={new Date(new Date().getFullYear(), 0, 1)} // Jan 1 of current year
                    maxDate={new Date(new Date().getFullYear(), 11, 31)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="title" className="text-right">
                  Title
                </Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="col-span-3"
                  placeholder="e.g., Christmas Day"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  resetForm();
                  setIsDialogOpen(false);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveHoliday}
                disabled={isLoading || !date || !title.trim()}
                className='bg-supperagent text-white hover:bg-supperagen'
              >
                {isLoading ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent bg-supperagent text-white hover:bg-supperagent" />
                ) : editingHoliday ? (
                  'Update Holiday'
                ) : (
                  'Save Holiday'
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Holidays Table */}
      <div className="rounded-lg bg-white p-4 shadow-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Year</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {holidays.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="h-24 text-center text-gray-500"
                >
                  No holidays found. Add one using the button above.
                </TableCell>
              </TableRow>
            ) : (
              holidays
                .filter((holiday) => {
                  const currentYear = new Date().getFullYear();
                  return holiday.year === currentYear;
                })
                .sort(
                  (a, b) =>
                    new Date(a.date).getTime() - new Date(b.date).getTime()
                )
                .map((holiday) => (
                  <TableRow key={holiday._id}>
                    <TableCell className="font-medium">
                      {holiday.title}
                    </TableCell>
                    <TableCell>{formatDate(holiday.date)}</TableCell>
                    <TableCell>{holiday.year}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="default"
                          size="icon"
                          onClick={() => handleEditClick(holiday)}
                          title="Edit holiday"
                          className="bg-supperagent text-white hover:bg-supperagent/90"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="default"
                          size="icon"
                          onClick={() => handleDeleteHoliday(holiday._id)}
                          title="Delete holiday"
                          className="bg-destructive text-white hover:bg-destructive/90"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export default BankHolidayPage;
