import { useEffect, useState } from 'react';
import { Pen } from 'lucide-react';
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
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';

export default function Recruitment() {
  const [recruitments, setRecruitments] = useState<any[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const { toast } = useToast();
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const fetchData = async (page: number, limit: number, search = '') => {
    try {
      setInitialLoading(true);
      const res = await axiosInstance.get(`/hr/recruitment`, {
        params: {
          page,
          limit,
          ...(search ? { searchTerm: search } : {})
        }
      });
      setRecruitments(res.data.data.result);
      setTotalPages(res.data.data.meta.totalPage);
    } catch (err) {
      console.error('Error fetching recruitment data:', err);
      toast({
        title: 'Error fetching data.',
        className: 'bg-red-500 text-white'
      });
    } finally {
      setInitialLoading(false);
    }
  };

  const handleSearch = () => {
    fetchData(currentPage, entriesPerPage, searchTerm);
  };

  const handleEdit = (recruitment) => {
    navigate(`/admin/hr/edit-recruitment/${recruitment._id}`);
  };

  useEffect(() => {
    fetchData(currentPage, entriesPerPage);
  }, [currentPage, entriesPerPage]);



  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">All Recruitments</h1>
      </div>

      <div className="flex items-center space-x-4">
        <Input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by name or title"
          className="h-8 max-w-[400px]"
        />
        <Button
          onClick={handleSearch}
          size="sm"
          className="min-w-[100px] border-none bg-supperagent text-white hover:bg-supperagent/90"
        >
          Search
        </Button>
      </div>

      <div className="rounded-md bg-white p-4 shadow-2xl">
        {initialLoading ? (
          <div className="flex justify-center py-6">
            <BlinkingDots size="large" color="bg-supperagent" />
          </div>
        ) : recruitments.length === 0 ? (
          <div className="flex justify-center py-6 text-gray-500">
            No records found.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Vacancy</TableHead>
                
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recruitments.map((rec) => (
                <TableRow key={rec._id}>
                 
                  <TableCell>{rec.applicantId?.title || ''} {rec.applicantId?.firstName || ''} {rec.applicantId?.initial || ''} {rec.applicantId?.lastName || ''}</TableCell>
                  <TableCell>{rec.applicantId?.vacancyId?.title || ''} </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      className="border-none bg-supperagent text-white hover:bg-supperagent/90"
                      size="icon"
                      onClick={() => handleEdit(rec)}
                    >
                      <Pen className="h-4 w-4" />
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
