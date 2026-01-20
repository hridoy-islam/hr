import { useEffect, useState } from 'react';
import { BookUser, Pen, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
// import { InstitutionDialog } from './components/institution-dialog';
import axiosInstance from '@/lib/axios';
import { useToast } from '@/components/ui/use-toast';
import { BlinkingDots } from '@/components/shared/blinking-dots';
// import { DataTablePagination } from '../students/view/components/data-table-pagination';
import { Input } from '@/components/ui/input';
import moment from 'moment';
import { DynamicPagination } from '@/components/shared/DynamicPagination';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

export default function CompanyTrainingPage() {
  const [training, setTraining] = useState<any>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTraining, setEditingTraining] = useState<any>();
  const [initialLoading, setInitialLoading] = useState(true); // New state for initial loading
  const { toast } = useToast();
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const user = useSelector((state: any) => state.auth.user);

  const fetchData = async (page, entriesPerPage, searchTerm = '') => {
    try {
      if (initialLoading) setInitialLoading(true);
      const response = await axiosInstance.get(`/hr/training`, {
        params: {
          page,
          limit: entriesPerPage,
          companyId: user?._id,
          ...(searchTerm ? { searchTerm } : {})
        }
      });
      setTraining(response.data.data.result);
      setTotalPages(response.data.data.meta.totalPage);
    } catch (error) {
      console.error('Error fetching Training:', error);
    } finally {
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    fetchData(currentPage, entriesPerPage);
  }, [currentPage, entriesPerPage]);

  const handleSearch = () => {
    fetchData(currentPage, entriesPerPage, searchTerm);
  };

  const navigate = useNavigate();

  return (
    <div className="space-y-3 rounded-md bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex flex-row items-center gap-4">
          <h2 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
            <BookUser className="h-6 w-6" />
            All Training
          </h2>{' '}
          <div className="flex items-center space-x-4">
            <Input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by Training Type"
              className="h-8 max-w-[400px]"
            />
            <Button
              onClick={handleSearch}
              size="sm"
              className="bg-theme hover:bg-theme/90 min-w-[100px] border-none text-white"
            >
              Search
            </Button>
          </div>
        </div>
        <Button
          className="bg-theme hover:bg-theme/90 text-white"
          size={'sm'}
          onClick={() => {
            navigate(`/company/create-training`);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          New Training
        </Button>
      </div>

      <div className="">
        {initialLoading ? (
          <div className="flex justify-center py-6">
            <BlinkingDots size="large" color="bg-theme" />
          </div>
        ) : training.length === 0 ? (
          <div className="flex justify-center py-6 text-gray-500">
            No records found.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Training Name</TableHead>
                <TableHead>Training Description</TableHead>
                <TableHead>Validity Days</TableHead>
                <TableHead>Expiry Days</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {training.map((training) => (
                <TableRow key={training._id}>
                  <TableCell>{training.name}</TableCell>
                  <TableCell>{training.description}</TableCell>

                  <TableCell>{training.validityDays}</TableCell>
                  <TableCell>{training.reminderBeforeDays}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      className="bg-theme hover:bg-theme/90 border-none text-white"
                      size="icon"
                      onClick={() => {
                        navigate(`/company/edit-training/${training._id}`);
                      }}
                    >
                      <Pen className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {training.length > 50 && (
          <>
            <DynamicPagination
              pageSize={entriesPerPage}
              setPageSize={setEntriesPerPage}
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </>
        )}
      </div>
    </div>
  );
}
