import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Plus,
  Trash2,
  Save,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import axiosInstance from '@/lib/axios';
import { useToast } from '@/components/ui/use-toast';

// Updated interface to match your API response
interface BankHoliday {
  _id: string; // API uses _id, not id
  date: string;
  title: string;
  year: number;
}

// Interface for the API response structure
interface ApiResponse {
  data: {
    result: BankHoliday[];
  };
}

function BankHolidayPage() {
  const [holidays, setHolidays] = useState<BankHoliday[]>([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [title, setTitle] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);


  const {toast}= useToast()

  // Load holidays from API on component mount
  const fetchHolidays = async () => {
    try {
      const response = await axiosInstance.get<ApiResponse>('/hr/bank-holiday');
      // Handle the nested response structure properly
      const holidaysData = response.data?.data?.result || [];
      setHolidays(holidaysData);
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: 'Failed to load holidays. Please try again later.',
      });
      console.error('Error fetching holidays:', error);
    }
  };
  useEffect(() => {

    fetchHolidays();
  }, []);

  const handleSaveHoliday = async () => {
    if (!selectedDate || !title.trim()) {
      setMessage({
        type: 'error',
        text: 'Please fill in both date and title fields.',
      });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    const newHoliday = {
      date: selectedDate,
      title: title.trim(),
      year: new Date(selectedDate).getFullYear(),
    };

    try {
      const response = await axiosInstance.post<ApiResponse>('/hr/bank-holiday', newHoliday);
      const addedHoliday = response.data?.data?.result;
      
      // Handle both single object and array responses
      if (addedHoliday) {
        setHolidays((prev) =>
          [...prev, addedHoliday].sort(
            (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
          )
        );
      }
       fetchHolidays();
      setSelectedDate('');
      setTitle('');
      toast({ title: 'Bank holiday added successfully!' });
    } catch (error: any) {
      toast({
        title: error.response?.data?.message || 'Failed to add holiday.',
        className: 'bg-destructive text-white border-none'
      });
      console.error('Error adding holiday:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Delete holiday via API
  const handleDeleteHoliday = async (id: string) => {
    try {
      await axiosInstance.delete(`/hr/bank-holiday/${id}`);
      setHolidays((prev) => prev.filter((holiday) => holiday._id !== id));
      toast({ title:'Bank holiday deleted successfully!' });
    } catch (error: any) {
      toast({
       
        title: error.response?.data?.message || 'Failed to delete holiday.', className: 'bg-destructive text-white border-none'
      });
      console.error('Error deleting holiday:', error);
    }
  };

  // Fixed Group holidays by year - handles both year property and date fallback
  const getHolidaysByYear = () => {
    const groupedHolidays = holidays.reduce((acc, holiday) => {
      // Safely get year - use the year property if available, otherwise extract from date
      const year = holiday.year || new Date(holiday.date).getFullYear();

      if (!acc[year]) {
        acc[year] = [];
      }

      acc[year].push({
        ...holiday,
        year, // Ensure year is attached to each holiday
      });

      return acc;
    }, {} as Record<number, BankHoliday[]>);

    return Object.keys(groupedHolidays)
      .map((year) => parseInt(year))
      .sort((a, b) => b - a)
      .map((year) => ({
        year,
        holidays: groupedHolidays[year].sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        ),
      }));
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Auto-hide message
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Bank Holiday Management</h1>
          <p className="text-gray-600">Manage bank holidays for different years</p>
        </div>

       
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Add Holiday Form */}
          <div className="lg:col-span-1">
            <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-xl">
              <div className="bg-supperagent px-6 py-4">
                <h2 className="flex items-center gap-2 text-xl font-semibold text-white">
                  <Plus className="h-5 w-5" />
                  Add New Holiday
                </h2>
              </div>
              <div className="space-y-6 p-6">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Holiday Date
                  </label>
                  <DatePicker
                    selected={selectedDate ? new Date(selectedDate) : null}
                    onChange={(date: Date | null) => {
                      if (date) {
                        setSelectedDate(date.toISOString().split('T')[0]); // YYYY-MM-DD
                      } else {
                        setSelectedDate('');
                      }
                    }}
                    dateFormat="dd-MM-yyyy"
                    className="w-full rounded-md border border-gray-300 px-4 py-2 bg-white hover:border-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                    wrapperClassName="w-full"
                    placeholderText="Select a date"
                    todayButton="Today"
                    showYearDropdown
                    scrollableYearDropdown
                    yearDropdownItemNumber={15}
                    popperPlacement="bottom-start"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Holiday Title
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Christmas Day"
                    className="w-full rounded-md border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button
                  onClick={handleSaveHoliday}
                  disabled={isLoading || !selectedDate || !title.trim()}
                  className="flex w-full items-center justify-center gap-2 rounded-md bg-supperagent px-6 py-2 font-semibold text-white shadow-lg hover:bg-opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    <Save className="h-5 w-5" />
                  )}
                  {isLoading ? 'Saving...' : 'Save Holiday'}
                </button>
              </div>
            </div>
          </div>

          {/* Holidays List */}
          <div className="lg:col-span-2">
            <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-xl">
              <div className="bg-supperagent px-6 py-4">
                <h2 className="text-xl font-semibold text-white">Scheduled Bank Holidays</h2>
              </div>
              <div className="max-h-[600px] overflow-y-auto">
                {getHolidaysByYear().length === 0 ? (
                  <div className="p-12 text-center">
                    <Calendar className="mx-auto mb-4 h-16 w-16 text-gray-300" />
                    <h3 className="mb-2 text-lg font-medium text-gray-900">No holidays scheduled</h3>
                    <p className="text-gray-500">Add your first bank holiday to get started.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {getHolidaysByYear().map(({ year, holidays: yearHolidays }) => (
                      <div key={year} className="p-6">
                        <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-gray-900">
                          {year}
                          <span className="ml-2 text-sm text-gray-500">
                            ({yearHolidays.length} holiday{yearHolidays.length !== 1 ? 's' : ''})
                          </span>
                        </h3>
                        <div className="space-y-3">
                          {yearHolidays.map((holiday) => (
                            <div
                              key={holiday._id}
                              className="group flex items-center justify-between rounded-xl bg-gray-50 p-4 transition-all hover:bg-gray-100"
                            >
                              <div className='flex flex-row items-center  gap-4'>
                                <h4 className="mb-1 font-semibold text-gray-900">{holiday.title}</h4>
                                <p className="text-sm text-gray-600">{formatDate(holiday.date)}</p>
                              </div>
                              <button
                                onClick={() => handleDeleteHoliday(holiday._id)}
                                className="rounded-lg p-2 text-red-500 opacity-0 hover:bg-red-50 group-hover:opacity-100 transition-all"
                                title="Delete holiday"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BankHolidayPage;