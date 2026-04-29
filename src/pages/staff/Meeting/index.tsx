import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Users, Plus, Search, X, Calendar as CalendarIcon } from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { z } from 'zod';
import moment from 'moment'; // Added moment import

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { BlinkingDots } from '@/components/shared/blinking-dots';
import { DynamicPagination } from '@/components/shared/DynamicPagination';
import axiosInstance from '@/lib/axios';

// --- Zod Validation Schema ---
const createMeetingSchema = z.object({
  title: z
    .string({ required_error: 'Meeting title is required' })
    .min(3, { message: 'Meeting title must be at least 3 characters long' })
    .max(100, { message: 'Meeting title cannot exceed 100 characters' }),
  nextMeetingDate: z.date({
    required_error: 'Meeting date is required',
    invalid_type_error: 'Please select a valid date'
  }),
  employeeId: z
    .array(z.string())
    .min(1, { message: 'Please select at least one employee' }),
  companyId: z
    .string({ required_error: 'Company ID is missing' })
    .min(1, { message: 'Company ID cannot be empty' })
});

// Interfaces mapping to your Backend Schema
interface UserRecord {
  _id: string;
  firstName: string;
  lastName: string;
  name?: string;
  avatar?: string;
}

interface MeetingRecord {
  _id: string;
  title: string;
  employeeId: UserRecord[];
  nextMeetingDate: string;
}

export default function StaffMeetingPage() {
  const { id,eid } = useParams(); // companyId
  const navigate = useNavigate();
  const { toast } = useToast();

  // Data States
  const [meetings, setMeetings] = useState<MeetingRecord[]>([]);

  // Loading & Pagination States
  const [initialLoading, setInitialLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(50);
  const [searchTerm, setSearchTerm] = useState('');


  // Fetch Meetings List
  const fetchMeetings = async (page: number, limit: number, search = '') => {
    try {
      if (initialLoading) setInitialLoading(true);

      const response = await axiosInstance.get(`/company-meeting`, {
        params: {
          page,
          limit,
          companyId: id,
          employeeId:eid,
          ...(search ? { searchTerm: search } : {})
        }
      });

      setMeetings(response.data.data.result || response.data.data);
      setTotalPages(response.data.data.meta?.totalPage || 1);
    } catch (error) {
      console.error('Error fetching meetings:', error);
    } finally {
      setInitialLoading(false);
    }
  };


  useEffect(() => {
    fetchMeetings(currentPage, entriesPerPage);
  }, [currentPage, entriesPerPage]);



  const handleSearch = () => {
    fetchMeetings(currentPage, entriesPerPage, searchTerm);
  };



  return (
    <div className="space-y-3 rounded-md bg-white p-5 shadow-sm">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div className="flex flex-row items-center gap-4">
          <h2 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
            <Users className="h-6 w-6" />
            Office Meetings
          </h2>
          <div className="flex items-center space-x-4">
            <Input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search meeting title..."
              className="h-8 min-w-[250px]"
            />
            <Button
              onClick={handleSearch}
              size="sm"
              className="min-w-[100px] border-none bg-theme text-white hover:bg-theme/90"
            >
              Search
            </Button>
          </div>
        </div>
       
      </div>

      {/* Table Section */}
      <div>
        {initialLoading ? (
          <div className="flex justify-center py-6">
            <BlinkingDots size="large" color="bg-theme" />
          </div>
        ) : meetings.length === 0 ? (
          <div className="flex justify-center py-6 text-gray-500">
            No meetings found.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Meeting Title</TableHead>
                <TableHead>Employees</TableHead>
                <TableHead>Next Meeting Date</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {meetings.map((meeting) => (
                <TableRow key={meeting._id}>
                  <TableCell className="font-medium text-gray-900">
                    {meeting.title}
                  </TableCell>
                  <TableCell className="max-w-[300px] truncate">
                    {meeting.employeeId
                      ?.map(
                        (emp) => emp.name || `${emp.firstName}`
                      )
                      .join(', ') || 'N/A'}
                  </TableCell>
                  <TableCell>
                    {/* Implemented moment formatting here */}
                    {meeting.nextMeetingDate
                      ? moment(meeting.nextMeetingDate).format('DD MMM, YYYY')
                      : 'N/A'}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      onClick={() => navigate(`${meeting._id}`)}
                    >
                      View Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {totalPages > 1 && (
          <DynamicPagination
            pageSize={entriesPerPage}
            setPageSize={setEntriesPerPage}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        )}
      </div>

   
    </div>
  );
}
