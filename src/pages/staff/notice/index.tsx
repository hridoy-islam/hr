import { useEffect, useState } from 'react';
import moment from 'moment';
import { Calendar, AlertCircle, UserIcon, Bell, Pin } from 'lucide-react';
import axiosInstance from '@/lib/axios';
import { BlinkingDots } from '@/components/shared/blinking-dots';
import { Card } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { DynamicPagination } from '@/components/shared/DynamicPagination';
import { Badge } from '@/components/ui/badge';
import { useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';

// Extend Notice type to include new fields
interface Notice {
  _id: string;
  noticeType: string;
  noticeDescription: string;
  noticeDate: string;
  noticeBy?: {
    firstName: string;
    lastName: string;
  };
  status: string;
  noticeSetting: 'all' | 'department' | 'designation' | 'individual';
  department: string[]; // ObjectId array
  designation: string[]; // ObjectId array
  users: string[]; // ObjectId array
}

export default function StaffNoticeBoard() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [filteredNotices, setFilteredNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { id: companyId, eid } = useParams();
  const [entriesPerPage, setEntriesPerPage] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Fetch notices
  const fetchNotices = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get(`/hr/notice`, {
        params: {
          page: currentPage,
          limit: entriesPerPage,
          userId: eid
        }
      });

      const fetchedNotices = res.data.data.result || [];
      setNotices(fetchedNotices);
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
  }, [entriesPerPage,currentPage]);

  const getNoticeTypeStyle = (type: string) => {
    const normalizedType = type.toLowerCase();

    // Urgent: High priority (Red)
    if (normalizedType.includes('urgent')) {
      return 'bg-red-500 text-white hover:bg-red-600';
    }

    // Reminder: Attention needed, but not critical (Amber/Yellow)
    if (normalizedType.includes('reminder')) {
      return 'bg-amber-500 text-white hover:bg-amber-600';
    }

    // Event: Special occurrences (Purple/Violet)
    if (normalizedType.includes('event')) {
      return 'bg-violet-500 text-white hover:bg-violet-600';
    }

    // General: Standard information (Blue)
    if (normalizedType.includes('general')) {
      return 'bg-blue-500 text-white hover:bg-blue-600';
    }

    // Other / Default: Neutral fallback (Slate/Gray)
    return 'bg-slate-500 text-white hover:bg-slate-600';
  };

  return (
    <div className="min-h-screen rounded-md  bg-white shadow-lg">
      <div className="flex flex-col  items-start justify-between gap-4 rounded-md border-b border-slate-200 bg-gradient-to-r from-theme/5 to-transparent p-5 md:flex-row md:items-center">
        {/* Left Side: Icon & Title */}
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-theme shadow-lg">
            <Bell className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-black">Notice Board</h1>
            <p className="text-sm text-black">
              View important announcements and updates
            </p>
          </div>
        </div>
      </div>
      <div className="p-5">
        {/* Header */}

        {/* Content */}
        <div className="space-y-3">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24">
              <BlinkingDots size="large" color="bg-theme" />
            </div>
          ) : notices.length === 0 ? (
            <Card className="border border-slate-200 bg-white py-16 text-center shadow-sm">
              <div className="flex flex-col items-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                  <AlertCircle className="h-8 w-8 text-slate-400" />
                </div>
                <h3 className="mb-2 text-xl font-semibold text-slate-900">
                  No notices for you
                </h3>
                <p className="max-w-md text-slate-600">
                  There are no notices targeted to you based on your role or
                  department. Check back later.
                </p>
              </div>
            </Card>
          ) : (
            <>
              {notices.map((notice) => (
                <Card
                  key={notice._id}
                  className="group overflow-hidden border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:border-slate-300 hover:shadow-md"
                >
                  <div className="p-5">
                    {/* Top row: Badge and Date */}
                    <div className="mb-3 flex items-start justify-between gap-4">
                      <div className="flex items-center gap-2">
                        <Badge
                          className={`px-3 py-1 text-xs font-semibold uppercase tracking-wide ${getNoticeTypeStyle(notice.noticeType)}`}
                        >
                          {notice.noticeType}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>
                          {moment(notice.noticeDate).format('DD MMM YYYY')} at{' '}
                          {moment(notice.noticeDate).format('h:mm A')}
                        </span>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="mb-3 text-sm leading-relaxed ">
                      {notice.noticeDescription}
                    </p>

                    {/* Posted by */}
                    {notice.noticeBy && (
                      <div className="flex items-center gap-1.5 text-xs">
                        <UserIcon className="h-3.5 w-3.5 text-slate-400" />
                        <span className="font-semibold text-theme">
                          {notice.noticeBy?.firstName ||
                          notice.noticeBy?.lastName
                            ? `${notice.noticeBy?.firstName ?? ''} ${notice.noticeBy?.lastName ?? ''}`.trim()
                            : notice.noticeBy?.name}
                        </span>
                      </div>
                    )}
                  </div>
                </Card>
              ))}

              {/* Pagination */}
              {notices.length > 16 && (
                <div className="mt-8 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                  <DynamicPagination
                    pageSize={entriesPerPage}
                    setPageSize={setEntriesPerPage}
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
