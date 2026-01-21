import { useEffect, useState } from 'react';
import { Award, Eye, Pen, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
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
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

type Permission = {
  canView?: boolean;
  canCreate?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
};

type Designation = {
  _id: string;
  title: string;
  description?: string;
  permissions: Permission;
};

export default function Designation() {
  const [designation, setDesignation] = useState<Designation[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const { toast } = useToast();
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
const user = useSelector((state: any) => state.auth.user);

  const fetchData = async (page: number, limit: number, search = '') => {
    try {
      setInitialLoading(true);
      const response = await axiosInstance.get(`/hr/designation`, {
        params: {
          page,
          limit,
           companyId:user?._id,
          ...(search ? { searchTerm: search } : {})
        }
      });
      setDesignation(response.data.data.result);
      setTotalPages(response.data.data.meta.totalPage);
    } catch (error) {
      console.error('Error fetching designations:', error);
    } finally {
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    fetchData(currentPage, entriesPerPage);
  }, [currentPage, entriesPerPage]);

  const handleSearch = () => {
    setCurrentPage(1);
    fetchData(1, entriesPerPage, searchTerm);
  };

  const navigate = useNavigate();

  const handleNewDesignationClick = () => {
    navigate('/company/designation/create');
  };

  const handleEdit = (item: Designation) => {
    navigate(`/company/designation/edit/${item._id}`);
  };

  return (
    <div className="space-y-3 rounded-md bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex flex-row items-center gap-4">
          <h2 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
            <Award className="h-6 w-6" />
            All Designations
          </h2>{' '}
          <div className="flex items-center space-x-4">
            <Input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by Designation Title"
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
        <Button
          className="bg-theme text-white hover:bg-theme/90"
          size="sm"
          onClick={handleNewDesignationClick}
        >
          <Plus className="mr-2 h-4 w-4" />
          New Designation
        </Button>
      </div>

      <div className="">
        {initialLoading ? (
          <div className="flex justify-center py-6">
            <BlinkingDots size="large" color="bg-theme" />
          </div>
        ) : designation.length === 0 ? (
          <div className="flex justify-center py-6 text-gray-500">
            No records found.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Description</TableHead>

                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {designation.map((d) => (
                <TableRow key={d._id}>
                  <TableCell>{d.title}</TableCell>
                  <TableCell>{d.description || '—'}</TableCell>

                  <TableCell className="text-right">
                    <Button
                      className="border-none bg-theme text-white hover:bg-theme/90"
                      size="sm"
                      onClick={() => handleEdit(d)}
                    >
                      Manage Access Control
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        {designation.length > 50 && (
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
