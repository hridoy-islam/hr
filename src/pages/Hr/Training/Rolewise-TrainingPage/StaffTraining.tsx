import React, { useState, useEffect } from 'react';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Pencil } from 'lucide-react';
import axiosInstance from '@/lib/axios';
import { useSelector } from 'react-redux';
import { DynamicPagination } from '@/components/shared/DynamicPagination';

interface Training {
  _id: string;
  trainingId: {
    _id: string;
    name: string;
  };
  status: 'completed' | 'in-progress' | 'expired';
  assignedDate: string;
  expireDate: string;
  completedAt?: string | null;
  certificate?: File | null;
}

const StaffTraining: React.FC = () => {
  const [localTrainings, setLocalTrainings] = useState<
    Array<{
      id: string;
      trainingName: string;
      status: string;
      assignedDate: string;
      completedAt: string | null;
      expireDate: string;
      certificate: File | null;
    }>
  >([]);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const user = useSelector((state: any) => state.auth?.user) || null;

  useEffect(() => {
    const fetchTrainings = async () => {
      try {
        const res = await axiosInstance.get(`/users/${user._id}`);
        const userData = res.data.data;

        const formattedTrainings = userData.training.map((t: Training) => ({
          id: t._id,
          trainingName: t.trainingId.name,
          status: t.status,
          assignedDate: new Date(t.assignedDate).toLocaleDateString(),
          completedAt: t.completedAt
            ? new Date(t.completedAt).toLocaleDateString()
            : null,
          expireDate: new Date(t.expireDate).toLocaleDateString(),
          certificate: null // Certificates not included in current data; assume uploaded later
        }));

        setLocalTrainings(formattedTrainings);
        setTotalPages(res.data.data.meta?.totalPage || 1);
      } catch (error) {
        console.error('Failed to fetch trainings:', error);
      }
    };

    if (user?._id) {
      fetchTrainings();
    }
  }, [user?._id, currentPage, entriesPerPage]);

 
  return (
    <div className="rounded-lg bg-white p-6 shadow">
      <h2 className="mb-4 text-2xl font-semibold">Training Records</h2>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Training</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Assigned Date</TableHead>
            <TableHead>Completed At</TableHead>
            <TableHead>Expiry Date</TableHead>
            <TableHead>Certificate</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {localTrainings.length > 0 ? (
            localTrainings.map((t, index) => (
              <TableRow key={t.id}>
                <TableCell className="font-medium">{t.trainingName}</TableCell>
                <TableCell>
                  <span
                    className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                      t.status === 'completed'
                        ? 'bg-green-100 text-green-800'
                        : t.status === 'expired'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {t.status.charAt(0).toUpperCase() + t.status.slice(1)}
                  </span>
                </TableCell>
                <TableCell>{t.assignedDate}</TableCell>
                <TableCell>{t.completedAt || '-'}</TableCell>
                <TableCell>{t.expireDate}</TableCell>
                <TableCell>
                  {t.certificate ? (
                    <a
                      href={URL.createObjectURL(t.certificate)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 underline hover:text-blue-800"
                    >
                      View
                    </a>
                  ) : (
                    '-'
                  )}
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={7} className="py-4 text-center text-gray-500">
                No training records found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <DynamicPagination
        pageSize={entriesPerPage}
        setPageSize={setEntriesPerPage}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />
    </div>
  );
};

export default StaffTraining;
