import { useEffect, useState } from 'react';
import moment from '@/lib/moment-setup';
import {
  Calendar,
  AlertCircle,
  Bell,
  FileText,
  ChevronRight
} from 'lucide-react';
import axiosInstance from '@/lib/axios';
import { BlinkingDots } from '@/components/shared/blinking-dots';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { DynamicPagination } from '@/components/shared/DynamicPagination';
import { Badge } from '@/components/ui/badge';
import { useParams } from 'react-router-dom';

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
  department: string[];
  designation: string[];
  users: string[];
  documents?: string[];
}

export default function StaffNoticeBoard() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { companyId, eid } = useParams();
  const [entriesPerPage, setEntriesPerPage] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

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
  }, [entriesPerPage, currentPage]);

  const getNoticeTypeStyle = (type: string) => {
    const normalized = type.toLowerCase();
    if (normalized.includes('urgent'))
      return 'bg-red-100 text-red-700 border-red-200';
    if (normalized.includes('reminder'))
      return 'bg-amber-100 text-amber-700 border-amber-200';
    if (normalized.includes('event'))
      return 'bg-violet-100 text-violet-700 border-violet-200';
    if (normalized.includes('general'))
      return 'bg-blue-100 text-theme/90 border-blue-200';
    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Professional header */}
      <div className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-theme to-theme/80 shadow-lg shadow-theme/20">
              <Bell className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">
                Notice Board
              </h1>
              <p className="text-sm text-slate-500">
                Announcements &amp; updates tailored for you
              </p>
            </div>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-6 py-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32">
            <BlinkingDots size="large" color="bg-theme" />
          </div>
        ) : notices.length === 0 ? (
          <Card className="border-dashed border-slate-200 bg-slate-50/50 py-20 text-center shadow-none">
            <CardContent className="flex flex-col items-center gap-4">
              <div className="rounded-full bg-slate-100 p-4">
                <AlertCircle className="h-8 w-8 text-slate-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">
                  No notices yet
                </h3>
                <p className="mt-1 max-w-md text-sm text-slate-500">
                  When important updates are posted for your role or department,
                  they'll appear here.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {notices.map((notice) => (
              <Card
                key={notice._id}
                className="group border border-slate-200 bg-white transition-all duration-200 hover:border-slate-300 hover:shadow-md"
              >
                <CardContent className="p-5">
                  {/* Header row: Badge + Date */}
                  <div className="mb-4 flex items-start justify-between gap-4">
                    <Badge
                      variant="outline"
                      className={`border px-3 py-0.5 text-xs font-semibold capitalize ${getNoticeTypeStyle(notice.noticeType)}`}
                    >
                      {notice.noticeType}
                    </Badge>
                    <div className="flex shrink-0 items-center gap-1.5 text-xs text-slate-500">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>
                        {moment(notice.noticeDate).format('MMM D, YYYY [at] h:mm A')}
                      </span>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="mb-4 text-sm leading-relaxed text-slate-700">
                    {notice.noticeDescription}
                  </p>

                  {/* ---------- ATTACHMENTS – FIXED WIDTH ---------- */}
                  {notice.documents && notice.documents.length > 0 && (
                    <div className="mb-1 flex flex-col w-fit items-start gap-2 rounded-lg border border-slate-100 bg-slate-50/80 p-2">
                      <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                        <FileText className="h-3.5 w-3.5" />
                        Attachments
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {notice.documents.length === 1 ? (
                          <a
                            href={notice.documents[0]}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 rounded-md bg-white px-2.5 py-1 text-xs font-medium text-theme shadow-sm transition hover:bg-theme/5 hover:text-theme/90"
                          >
                            <FileText className="h-3 w-3" />
                            Document
                            <ChevronRight className="h-3 w-3" />
                          </a>
                        ) : (
                          notice.documents.map((docUrl, idx) => (
                            <a
                              key={idx}
                              href={docUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 rounded-md bg-white px-2.5 py-1 text-xs font-medium text-theme shadow-sm transition hover:bg-theme/5 hover:text-theme/90"
                            >
                              <FileText className="h-3 w-3" />
                              Document {idx + 1}
                              <ChevronRight className="h-3 w-3" />
                            </a>
                          ))
                        )}
                      </div>
                    </div>
                  )}

                  {/* Footer: gentle timestamp */}
                  <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-400">
                    <Calendar className="h-3 w-3" />
                    <span>
                      {moment(notice.noticeDate).format('MMM D, YYYY [at] h:mm A')}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}

            {notices.length > 16 && (
              <div className="mt-8 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
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
      </main>
    </div>
  );
}