import { useEffect, useState } from 'react';
import moment from 'moment';
import { Calendar, AlertCircle, User, Bell, Pin } from 'lucide-react';
import axiosInstance from '@/lib/axios';
import { BlinkingDots } from '@/components/shared/blinking-dots';
import { Card } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { DynamicPagination } from '@/components/shared/DynamicPagination';
import { Badge } from '@/components/ui/badge';
import { useSelector } from 'react-redux';

// Extend Notice type to include new fields
interface Notice {
  _id: string;
  noticeType: string;
  noticeDescription: string;
  noticeDate: string;
  noticeBy?: string;
  status: string;
  noticeSetting: 'all' | 'department' | 'designation' | 'individual';
  department: string[]; // ObjectId array
  designation: string[]; // ObjectId array
  users: string[]; // ObjectId array
}

// User type
interface User {
  _id: string;
  department: string;
  designation: string;
}

export default function StaffNoticeBoard() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [filteredNotices, setFilteredNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const { toast } = useToast();
  const userId = useSelector((state: any) => state.auth?.user) || null;

  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Fetch current user
  const fetchCurrentUser = async () => {
    try {
      const res = await axiosInstance.get(`/users/${userId._id}`); // assuming this returns current user
      setUser(res.data.data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch user data',
        variant: 'destructive'
      });
      throw error;
    }
  };

  // Fetch notices
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

      const fetchedNotices = res.data.data.result || [];
      setNotices(fetchedNotices);
      setTotalPages(res.data.data.totalPages || 1);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch notices',
        variant: 'destructive'
      });
    }
  };

  useEffect(() => {
    if (!user || notices.length === 0) return;

    const filtered = notices.filter((notice) => {
      switch (notice.noticeSetting) {
        case 'all':
          return true;

        case 'department':
          return notice.department.some((d: any) => d._id === user.department);

        case 'designation':
          return notice.designation.some(
            (des: any) => des._id === user.designation
          );

        case 'individual':
          return notice.users.some((u: any) => u._id === user._id);

        default:
          return false;
      }
    });

    setFilteredNotices(filtered);
  }, [notices, user]);

  // Fetch data
  useEffect(() => {
    const loadData = async () => {
      try {
        await fetchCurrentUser();
        await fetchNotices();
      } catch (error) {
        // Error already handled
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [currentPage, entriesPerPage]);

  const getNoticeTypeStyle = (type: string) => {
    const normalizedType = type.toLowerCase();
    if (
      normalizedType.includes('urgent') ||
      normalizedType.includes('important')
    ) {
      return 'bg-red-50 text-red-700 border-red-200';
    }
    if (normalizedType.includes('announcement')) {
      return 'bg-blue-50 text-blue-700 border-blue-200';
    }
    if (normalizedType.includes('reminder')) {
      return 'bg-amber-50 text-amber-700 border-amber-200';
    }
    return 'bg-slate-50 text-slate-700 border-slate-200';
  };

  return (
    <div className="min-h-screen bg-slate-50/50">
      <div className="rounded-lg border-b border-slate-200 bg-white px-6 py-4">
        <div className="mb-2 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600">
            <Bell className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              Notice Board
            </h1>
          </div>
        </div>
      </div>

      <div className="mt-5">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <BlinkingDots size="large" color="bg-supperagent" />
          </div>
        ) : filteredNotices.length === 0 ? (
          <Card className="border-0 bg-white py-16 text-center shadow-sm">
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
          <div className="space-y-4">
            {filteredNotices.map((notice) => (
              <Card
                key={notice._id}
                className="overflow-hidden border-0 bg-white shadow-sm transition-all duration-200 hover:shadow-md"
              >
                <div className="border-b border-slate-100 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge
                        variant="default"
                        className={`font-medium ${getNoticeTypeStyle(notice.noticeType)}`}
                      >
                        {notice.noticeType.charAt(0).toUpperCase() +
                          notice.noticeType.slice(1)}
                      </Badge>
                      {notice.noticeSetting !== 'all' && (
                        <Badge variant="secondary" className="text-xs ">
                          <Pin className="mr-1 h-3 w-3" />
                          {notice.noticeSetting}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <Calendar className="h-4 w-4" />
                      <span className="font-medium">
                        {moment(notice.noticeDate).format('MMM D, YYYY')}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="px-6 py-5">
                  <p className="text-base leading-relaxed text-slate-700">
                    {notice.noticeDescription}
                  </p>
                </div>

                {notice.noticeBy && (
                  <div className="border-t border-slate-100 bg-supperagent/20 px-6 py-3">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <User className="h-4 w-4 text-slate-400" />
                      <span>Posted by</span>
                      <span className="font-medium text-slate-900">
                        {notice.noticeBy?.firstName} {notice.noticeBy?.lastName }
                      </span>
                    </div>
                  </div>
                )}
              </Card>
            ))}

            {filteredNotices.length > 6 && (
              <div className="mt-8 border-t border-slate-200 pt-6">
                <DynamicPagination
                  pageSize={entriesPerPage}
                  setPageSize={setEntriesPerPage}
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
