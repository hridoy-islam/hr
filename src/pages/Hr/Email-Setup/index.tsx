import { useEffect, useState } from 'react';
import { Pen, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';

import { useToast } from '@/components/ui/use-toast';
import axiosInstance from '@/lib/axios';
import { BlinkingDots } from '@/components/shared/blinking-dots';

import { Input } from '@/components/ui/input';
import { DynamicPagination } from '@/components/shared/DynamicPagination';
import { EmailConfigDialog } from './Components/emailConfigDialog';

export default function EmailSetup() {
  const [emailConfigs, setEmailConfigs] = useState<any>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEmailConfig, setEditingEmailConfig] = useState<any>();
  const { toast } = useToast();
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchData = async (page, entriesPerPage, searchTerm = '') => {
    try {
      if (initialLoading) setInitialLoading(true);
      const response = await axiosInstance.get(`/hr/email-setup`, {
        params: {
          page,
          limit: entriesPerPage,
          ...(searchTerm ? { searchTerm } : {})
        }
      });
      setEmailConfigs(response.data.data.result);
      setTotalPages(response.data.data.meta.totalPage);
    } catch (error) {
      console.error('Error fetching email configurations:', error);
    } finally {
      setInitialLoading(false);
    }
  };

  // const handleSubmit = async (data) => {
  //   if (editingEmailConfig) {
  //     await axiosInstance.put(`/email-configs/${editingEmailConfig?.id}`, data);
  //     toast({
  //       title: 'Email configuration updated successfully',
  //       className: 'bg-supperagent border-none text-white'
  //     });
  //     fetchData(currentPage, entriesPerPage);
  //     setEditingEmailConfig(undefined);
  //   } else {
  //     await axiosInstance.post(`/email-configs`, data);
  //     toast({
  //       title: 'Email configuration created successfully',
  //       className: 'bg-supperagent border-none text-white'
  //     });
  //     fetchData(currentPage, entriesPerPage);
  //   }
  // };

  const handleSubmit = async (data) => {
    try {
      let response;

      if (editingEmailConfig) {
        // Update email configuration
        response = await axiosInstance.patch(
          `/hr/email-setup/${editingEmailConfig?._id}`,
          data
        );
      } else {
        // Create new email configuration
        response = await axiosInstance.post(`/hr/email-setup`, data);
      }

      // Check if the API response indicates success
      if (response.data && response.data.success === true) {
        toast({
          title: 'Email configuration updated successfully',
          className: 'bg-supperagent border-none text-white'
        });
      } else if (response.data && response.data.success === false) {
        toast({
          title: 'Operation failed',
          className: 'bg-red-500 border-none text-white'
        });
      } else {
        toast({
          title: 'Unexpected response. Please try again.',
          className: 'bg-red-500 border-none text-white'
        });
      }

      // Refresh data
      fetchData(currentPage, entriesPerPage);
    } catch (error) {
      toast({
        title: 'An error occurred. Please try again.',
        className: 'bg-red-500 border-none text-white'
      });
    } finally {
      setEditingEmailConfig(undefined); // Reset editing state
    }
  };

  // const handleStatusChange = async (id, status) => {
  //   try {
  //     const updatedStatus = status ? '1' : '0';
  //     await axiosInstance.patch(`/email-configs/${id}`, {
  //       status: updatedStatus
  //     });
  //     toast({
  //       title: 'Email configuration updated successfully',
  //       className: 'bg-supperagent border-none text-white'
  //     });
  //     fetchData();
  //   } catch (error) {
  //     console.error('Error updating status:', error);
  //   }
  // };

  const handleEdit = (emailConfig) => {
    setEditingEmailConfig(emailConfig);
    setDialogOpen(true);
  };

  useEffect(() => {
    fetchData(currentPage, entriesPerPage);
  }, [currentPage, entriesPerPage]);

  const handleSearch = () => {
    fetchData(currentPage, entriesPerPage, searchTerm);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">All Email Configurations</h1>
        <Button
          className="bg-supperagent text-white hover:bg-supperagent/90"
          size={'sm'}
          onClick={() => setDialogOpen(true)}
        >
          <Plus className="mr-2 h-4 w-4" />
          New Email Configuration
        </Button>
      </div>
      <div className="flex items-center space-x-4">
        <Input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by Email"
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
      <div className="rounded-md bg-white p-4 shadow-lg">
        {initialLoading ? (
          <div className="flex justify-center py-6">
            <BlinkingDots size="large" color="bg-supperagent" />
          </div>
        ) : emailConfigs.length === 0 ? (
          <div className="flex justify-center py-6 text-gray-500">
            No records found.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Host</TableHead>
                <TableHead>Port</TableHead>
                <TableHead>Encryption</TableHead>
                <TableHead>Authentication</TableHead>

                <TableHead className="w-32 text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {emailConfigs.map((config) => (
                <TableRow key={config._id}>
                  <TableCell>{config.email}</TableCell>
                  <TableCell>{config.host}</TableCell>
                  <TableCell>{config.port}</TableCell>
                  <TableCell>{config.encryption}</TableCell>
                  <TableCell>
                    {config.authentication ? 'True' : 'False'}
                  </TableCell>

                  <TableCell className="text-center">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="bg-supperagent text-white hover:bg-supperagent/90"
                      onClick={() => handleEdit(config)}
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
      <EmailConfigDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditingEmailConfig(undefined);
        }}
        onSubmit={handleSubmit}
        initialData={editingEmailConfig}
      />
    </div>
  );
}
