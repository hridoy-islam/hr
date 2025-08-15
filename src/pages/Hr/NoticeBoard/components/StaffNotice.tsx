import { useEffect, useState } from 'react';
import moment from 'moment';
import { Calendar, AlertCircle, User } from 'lucide-react';
import axiosInstance from '@/lib/axios';
import { BlinkingDots } from '@/components/shared/blinking-dots';
import { Card } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { DynamicPagination } from '@/components/shared/DynamicPagination';

interface Notice {
  _id: string;
  noticeType: string;
  noticeDescription: string;
  noticeDate: string;
  noticeBy?: string;
  status: string;
}

export default function StaffNoticeBoard() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // ✅ Added pagination state
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchNotices = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get('/hr/notice', {
        params: {
          status: 'active',
          sort: '-noticeDate',
          page: currentPage,
          limit: entriesPerPage
        }
      });

      setNotices(res.data.data.result || []);
      setTotalPages(res.data.data.totalPages || 1);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch notices',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotices();
  }, [currentPage, entriesPerPage]);

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Staff Notice Board</h1>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <BlinkingDots size="large" color="bg-supperagent" />
        </div>
      ) : notices.length === 0 ? (
        <Card className="py-12 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">
            No notices available
          </h3>
          <p className="mt-2 text-gray-500">
            There are currently no active notices to display.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {notices.map((notice) => (
            <div
              key={notice._id}
              className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-shadow duration-200 hover:shadow-md"
            >
              {/* Description */}
              <div className="px-4 py-3">
                <p className="text-sm leading-relaxed text-gray-700">
                  {notice.noticeDescription}
                </p>
              </div>

              {/* Footer: Date and Author */}
              <div className="flex items-center justify-between border-t border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-500">
                <div className="flex items-center space-x-1">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span>{moment(notice.noticeDate).format('MMM D, YYYY')}</span>
                </div>
                {notice.noticeBy && (
                  <div className="flex items-center space-x-1">
                    <User className="h-4 w-4 text-gray-400" />
                    <span>{notice.noticeBy}</span>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* ✅ Pagination */}
          <div className="mt-6">
            <DynamicPagination
              pageSize={entriesPerPage}
              setPageSize={setEntriesPerPage}
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        </div>
      )}
    </div>
  );
}
