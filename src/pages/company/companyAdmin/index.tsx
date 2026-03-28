import React, { useEffect, useState } from 'react';
import { Users, Pen, Plus } from 'lucide-react';
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
import { Input } from '@/components/ui/input';
import { DynamicPagination } from '@/components/shared/DynamicPagination';
import { CompanyAdminDialog } from './components/CompanyAdminDialog';
import { useNavigate, useParams } from 'react-router-dom';

export default function CompanyAdminPage() {
  const [attendees, setAttendees] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>();
  const [initialLoading, setInitialLoading] = useState(true);
  const { toast } = useToast();
  const {id:companyId} = useParams()
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(30);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate()
  const fetchData = async (page: number, limit: number, search = '') => {
    try {
      if (initialLoading) setInitialLoading(true);
      const response = await axiosInstance.get(`/users`, {
        params: {
          page,
          limit,
          role: 'companyAdmin',
          company:companyId,
          ...(search ? { searchTerm: search } : {})
        }
      });
      setAttendees(response.data.data.result);
      setTotalPages(response.data.data.meta.totalPage);
    } catch (error) {
      console.error('Error fetching attendance users:', error);
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

  const handleEdit = (user: any) => {
    setEditingUser(user);
    setDialogOpen(true);
  };
  const handleAccess = (user: any) => {
  navigate(`${user?._id}/access-control`)
  };

  return (
    <div className="space-y-3 rounded-md bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex flex-row items-center gap-4">
          <h2 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
            <Users className="h-6 w-6" />
            Company Admin Accounts
          </h2>
          <div className="flex items-center space-x-4">
            <Input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by Name or Email"
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
          onClick={() => setDialogOpen(true)}
        >
          <Plus className="mr-2 h-4 w-4" />
          New Account
        </Button>
      </div>

      <div>
        {initialLoading ? (
          <div className="flex justify-center py-6">
            <BlinkingDots size="large" color="bg-theme" />
          </div>
        ) : attendees.length === 0 ? (
          <div className="flex justify-center py-6 text-gray-500">
            No records found.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {attendees.map((user) => (
                <TableRow key={user._id}>
                  <TableCell className="font-medium text-gray-900">
                    {user.name}
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell className="text-right flex flex-row justify-end">
                    <div className='flex flex-row gap-2'>

                    <Button
                      size="sm"
                      onClick={() => handleAccess(user)}
                      >
                      Manage Access Control
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleEdit(user)}
                      >
                      <Pen className="h-4 w-4 mr-2" /> Edit
                    </Button>
                      </div>
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

      <CompanyAdminDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditingUser(undefined);
        }}
        initialData={editingUser}
        onSuccess={() => fetchData(currentPage, entriesPerPage)}
      />
    </div>
  );
}
