import { useEffect, useState } from 'react';
import { Eye, Pen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import axiosInstance from '@/lib/axios';
import { useToast } from '@/components/ui/use-toast';
import { BlinkingDots } from '@/components/shared/blinking-dots';
import { DynamicPagination } from '@/components/shared/DynamicPagination';
import moment from 'moment';
import { Input } from '@/components/ui/input';
import { useRouter } from '@/routes/hooks';
import { useNavigate } from 'react-router-dom';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { count } from 'console';

export default function AttendanceApprovalPage() {
  const [attendanceList, setAttendance] = useState<any[]>([]);
  const [groupedData, setGroupedData] = useState<
    Array<{ date: string; count: number }>
  >([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAttendance, setEditingAttendance] = useState<any>();
  const [initialLoading, setInitialLoading] = useState(true);
  const { toast } = useToast();
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(String(now.getMonth() + 1)); // Months are 0-indexed
  const [selectedYear, setSelectedYear] = useState(String(now.getFullYear()));
  const fetchData = async (
    page,
    entriesPerPage,
    searchTerm = '',
    month?: string,
    year?: string
  ) => {
    try {
      setInitialLoading(true);
      const response = await axiosInstance.get(`/hr/attendance?approvalStatus=pending`, {
        params: {
          page,
          limit: entriesPerPage,
          ...(searchTerm ? { searchTerm } : {}),
          ...(month ? { month } : {}),
          ...(year ? { year } : {})
        }
      });
  
      const result = response.data.data.result;
      setAttendance(result);
      setTotalPages(response.data.data.meta.totalPage);
  
      const grouped = result.reduce((acc, item) => {
        const date = moment(item.clockIn).format('YYYY-MM-DD');
        const existing = acc.find((entry) => entry.date === date);
        if (existing) {
          existing.count += 1;
        } else {
          acc.push({ date, count: 1 });
        }
        return acc;
      }, []);
      setGroupedData(grouped);
    } catch (error) {
      console.error('Error fetching Attendance:', error);
    } finally {
      setInitialLoading(false);
    }
  };
  

  const navigate = useNavigate();

  const handleRowClick = (date: string, count: number) => {
    navigate(`/admin/hr/attendance-approve/attendance-list?date=${date}`, {
      state: { count, date },
    });
  };
  

  const handleSubmit = async (data) => {
    try {
      let response;
      if (editingAttendance) {
        response = await axiosInstance.patch(
          `/hr/attendance/${editingAttendance?._id}`,
          data
        );
      } else {
        response = await axiosInstance.post(`/hr/attendance/clock-in`, data);
      }

      if (response.data?.success) {
        toast({
          title: response.data.message || 'Record updated successfully',
          className: 'bg-supperagent border-none text-white'
        });
      } else {
        throw new Error('Unexpected response');
      }

      fetchData(currentPage, entriesPerPage);
      setEditingAttendance(undefined);
    } catch (error) {
      toast({
        title: 'An error occurred. Please try again.',
        className: 'bg-red-500 border-none text-white'
      });
    }
  };

 ;

  useEffect(() => {
    fetchData(currentPage, entriesPerPage);
  }, [currentPage, entriesPerPage]);

  const handleSearch = () => {
    if (selectedMonth && selectedYear) {
      fetchData(currentPage, entriesPerPage, searchTerm, selectedMonth, selectedYear);
    }
  };
  
  const currentYear = new Date().getFullYear();

  return (
    <div className="space-y-3">
       <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Pending Attendance List</h1>
      </div>

      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="h-8 w-[140px] rounded-md border border-gray-300 px-2 focus:outline-none focus:ring-2 focus:ring-supperagent">
              <SelectValue placeholder="Select Month" />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 12 }, (_, i) => (
                <SelectItem key={i} value={String(i + 1)}>
                  {new Date(0, i).toLocaleString('default', { month: 'long' })}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Year Select Dropdown */}
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="h-8 w-[120px] rounded-md border border-gray-300 px-2 focus:outline-none focus:ring-2 focus:ring-supperagent">
              <SelectValue placeholder="Select Year" />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 50 }, (_, i) => {
                const year = currentYear - 5 + i;
                return (
                  <SelectItem key={year} value={String(year)}>
                    {year}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        <Button
          onClick={handleSearch}
          size="sm"
          className="min-w-[100px] border-none bg-supperagent text-white hover:bg-supperagent/90"
          disabled={!selectedMonth || !selectedYear}
        >
          Search
        </Button>
      </div>

      <div className="rounded-md bg-white p-4 shadow-2xl">
        {initialLoading ? (
          <div className="flex justify-center py-6">
            <BlinkingDots size="large" color="bg-supperagent" />
          </div>
        ) : groupedData.length === 0 ? (
          <div className="flex justify-center py-6 text-gray-500">
            No records found.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Attendance Count</TableHead>
                <TableHead className="w-32 text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {groupedData.map(({ date, count }) => (
                <TableRow key={date} onClick={() => handleRowClick(date,count)} className='cursor-pointer'>
                  <TableCell>{moment(date).format('MMMM Do YYYY')}</TableCell>
                  <TableCell>{count}</TableCell>
                  <TableCell className="text-center">
                    <Button
                      variant="ghost"
                      className="border-none bg-supperagent text-white hover:bg-supperagent/90"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation(); // prevent row click
                        handleRowClick(date,count);
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        <DynamicPagination
          pageSize={entriesPerPage}
          setPageSize={setEntriesPerPage}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>

      
    </div>
  );
}
