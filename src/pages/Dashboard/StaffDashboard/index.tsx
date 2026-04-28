import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import axiosInstance from '@/lib/axios';
import { useSelector } from 'react-redux';
import { BlinkingDots } from '@/components/shared/blinking-dots';
import moment from '@/lib/moment-setup';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import {
  Calendar,
  AlertCircle,
  UserIcon,
  Bell,
  Download,
  QrCode,
  FileSignature,
  Loader2,
  FileText,
  Eye,
  Clock,
  CheckCircle2,
  ChevronRight
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

// --- Types ---
interface Notice {
  _id: string;
  noticeType: string;
  noticeDescription: string;
  noticeDate: string;
  noticeBy?: {
    firstName: string;
    lastName: string;
    name?: string;
  };
  status: string;
  documents:string[];
}

interface SignatureDoc {
  _id: string;
  content: string;
  document: string;
  employeeId: any;
  companyId: string;
  approverIds?: any[];
  signedBy?: any[];
  envelopeId?: string | null;
  signedDocument?: string;
  status: 'pending' | 'submitted' | 'forwarded' | 'completed' | 'rejected';
  submittedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// --- Helpers ---
const groupShiftsByMonth = (shifts: any[]) => {
  return shifts.reduce(
    (groups, shift) => {
      const dateObj = new Date(shift.startDate);
      const monthYear = dateObj.toLocaleString('default', {
        month: 'long',
        year: 'numeric'
      });

      if (!groups[monthYear]) {
        groups[monthYear] = [];
      }
      groups[monthYear].push(shift);
      return groups;
    },
    {} as Record<string, any[]>
  );
};

const getDayName = (dateStr: string) =>
  moment(dateStr).format('ddd').toUpperCase();
const getDateNumber = (dateStr: string) => moment(dateStr).format('DD');

const calculateDuration = (startTime: string, endTime: string) => {
  if (!startTime || !endTime) return '-';

  const start = moment(startTime, 'HH:mm');
  const end = moment(endTime, 'HH:mm');

  if (end.isBefore(start)) {
    end.add(1, 'day');
  }

  const duration = moment.duration(end.diff(start));
  const hours = Math.floor(duration.asHours());
  const minutes = duration.minutes();

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

const getNoticeTypeStyle = (type: string) => {
  const normalizedType = type?.toLowerCase() || '';
  if (normalizedType.includes('urgent'))
    return 'bg-red-500 text-white hover:bg-red-600';
  if (normalizedType.includes('reminder'))
    return 'bg-amber-500 text-white hover:bg-amber-600';
  if (normalizedType.includes('event'))
    return 'bg-violet-500 text-white hover:bg-violet-600';
  if (normalizedType.includes('general'))
    return 'bg-theme/90 text-white hover:bg-theme';
  return 'bg-slate-500 text-white hover:bg-slate-500';
};

const StaffDashboardPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const user = useSelector((state: any) => state.auth.user);
  const { id, eid } = useParams();

  const [userData, setUserData] = useState<any>(null);
  const [shifts, setShifts] = useState<any[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);

  // --- Signature Documents State ---
  const [pendingDocuments, setPendingDocuments] = useState<SignatureDoc[]>([]);
  const [signingDocId, setSigningDocId] = useState<string | null>(null);
  const [isProcessingSignature, setIsProcessingSignature] = useState(false);
  const [pollAttempts, setPollAttempts] = useState(0);

  // --- Document Fetch Logic ---
  const fetchPendingDocuments = async () => {
    if (!eid || !id) return;
    try {
      const res = await axiosInstance.get(`/signature-documents`, {
        params: {
          employeeId: eid,
          approverIds: eid,
          companyId: id,
          page: 1,
          limit: 5
        }
      });

      const docs = res.data?.data?.result || res.data || [];

      // Filter to ONLY show documents where the status is effectively "pending" for the user
      const pendingDocs = docs.filter((doc: SignatureDoc) => {
        const empIdStr =
          typeof doc.employeeId === 'string'
            ? doc.employeeId
            : doc.employeeId?._id;

        const isEmployee = empIdStr === eid;

        const signedUserIds =
          doc.signedBy?.map((s: any) =>
            typeof s.userId === 'string' ? s.userId : s.userId?._id
          ) || [];

        const hasAlreadySigned = signedUserIds.includes(eid);
        const employeeHasSigned = signedUserIds.includes(empIdStr);

        // If the user has already signed it or the doc is fully completed, it's not pending for them
        if (hasAlreadySigned || doc.status === 'completed') return false;

        const approverMatch = doc.approverIds?.find((app: any) => {
          const appIdStr =
            typeof app.userId === 'string' ? app.userId : app.userId?._id;
          return appIdStr === eid;
        });

        let isMyTurn = false;

        if (isEmployee) {
          isMyTurn = true; // Employee goes first
        } else if (approverMatch) {
          if (employeeHasSigned) {
            // Check if any previous approvers haven't signed yet
            const waitingOnPrevious = doc.approverIds?.some((app: any) => {
              const previousAppIdStr =
                typeof app.userId === 'string' ? app.userId : app.userId?._id;
              return (
                app.index < approverMatch.index &&
                !signedUserIds.includes(previousAppIdStr)
              );
            });

            if (!waitingOnPrevious) {
              isMyTurn = true;
            }
          }
        }

        // Only return if it's explicitly their turn (i.e. truly pending for this user)
        return isMyTurn;
      });

      pendingDocs.sort(
        (a: SignatureDoc, b: SignatureDoc) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      setPendingDocuments(pendingDocs);
    } catch (err) {
      console.error('Error fetching signature documents:', err);
    }
  };

  const handleSignDocument = async (signatureDocId: string) => {
    setSigningDocId(signatureDocId);
    try {
      const response = await axiosInstance.post(
        `/signature-documents/initiate-signing/${signatureDocId}`,
        { signerId: eid, layout: 'staffLayout' }
      );
      const signingUrl =
        response.data?.data?.signingUrl || response.data?.signingUrl;
      if (signingUrl) {
        window.location.href = signingUrl;
      } else {
        throw new Error('No signing URL returned');
      }
    } catch (error) {
      console.error('Error initiating signing:', error);
      toast({
        title: 'Failed to initiate signing process.',
        description: 'Please try again later.',
        className: 'bg-destructive text-white'
      });
      setSigningDocId(null);
    }
  };

  // --- Silent background fetch for Rota Data ---
  const fetchRotaData = async () => {
    if (!eid) return;
    try {
      const rotaRes = await axiosInstance.get(
        `/rota/upcoming-rota?employeeId=${eid}`
      );
      setShifts(rotaRes.data?.data?.result || []);
    } catch (error) {
      console.error('Error fetching background rota data:', error);
    }
  };

  // --- Intervals & Signature Completion Watcher ---
  useEffect(() => {
    const fetchInterval = setInterval(
      () => {
        fetchRotaData();
      },
      5 * 60 * 1000
    ); // 5 minutes in milliseconds

    return () => clearInterval(fetchInterval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eid]);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    if (searchParams.get('event') === 'signing_complete') {
      setIsProcessingSignature(true);
      setPollAttempts(0);
      searchParams.delete('event');
      const newSearch = searchParams.toString();
      const newUrl = newSearch
        ? `${location.pathname}?${newSearch}`
        : location.pathname;
      navigate(newUrl, { replace: true });
    }
  }, [location, navigate]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isProcessingSignature) {
      interval = setInterval(() => {
        fetchPendingDocuments();
        setPollAttempts((prev) => prev + 1);
      }, 5000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isProcessingSignature]);

  useEffect(() => {
    if (isProcessingSignature && pollAttempts >= 2) {
      setIsProcessingSignature(false);
      toast({
        title: 'Signature Processed',
        description: 'If you completed the document, it will update shortly.'
      });
    }
  }, [pollAttempts, isProcessingSignature, toast]);

  // Initial Data Fetch
  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!eid) return;

      try {
        setLoading(true);
        const [userRes, rotaRes, noticeRes] = await Promise.all([
          axiosInstance.get(`/users/${eid}`),
          axiosInstance.get(`/rota/upcoming-rota?employeeId=${eid}`),
          axiosInstance.get(`/hr/notice`, {
            params: { page: 1, limit: 3, userId: eid }
          })
        ]);

        setUserData(userRes.data?.data);
        setShifts(rotaRes.data?.data?.result || []);
        setNotices(noticeRes.data?.data?.result || []);

        // Fetch pending documents on load
        await fetchPendingDocuments();
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eid, id]);

  const groupedShifts = useMemo(() => {
    const seen = new Set<string>();

    const uniqueShifts = shifts.filter((shift) => {
      let key = '';

      if (shift.leaveType) {
        key = `leave_${shift.startDate}_${shift.leaveType}`;
      } else {
        key = `work_${shift.startDate}_${shift.startTime}_${shift.endTime}_${shift.shiftName}`;
      }

      if (seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    });

    return groupShiftsByMonth(uniqueShifts);
  }, [shifts]);

  // --- Download QR Code Logic ---
  const downloadQRCode = () => {
    const svgElement = document.getElementById('employee-qr-code');
    if (!svgElement) return;

    const svgData = new XMLSerializer().serializeToString(svgElement);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width + 40;
      canvas.height = img.height + 40;
      if (ctx) {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 20, 20);

        const pngFile = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.download = `Attendance_QR_${eid}.png`;
        downloadLink.href = pngFile;
        downloadLink.click();
      }
    };

    img.src =
      'data:image/svg+xml;base64,' +
      btoa(unescape(encodeURIComponent(svgData)));
  };

  if (loading) {
    return (
      <div className="flex h-[50vh] w-full items-center justify-center">
        <BlinkingDots size="large" color="bg-theme" />
      </div>
    );
  }

  return (
    <div className="min-h-screen rounded-md bg-white p-6 shadow-sm">
      {/* Header Section */}
      <div className="mb-10 flex flex-col gap-4 border-b border-slate-100 pb-2 sm:flex-row sm:items-end sm:justify-between">
        <h1 className="text-xl font-extrabold tracking-tight md:text-3xl">
          Welcome Back{userData?.firstName ? `, ${userData.firstName}` : '!'}
        </h1>

        {/* Company Name */}
        {userData?.company?.name && (
          <div className="text-left sm:text-right">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wider ">
              Organization
            </span>
            <span className="text-lg font-bold text-slate-800 sm:text-xl">
              {userData.company.name}
            </span>
          </div>
        )}
      </div>

      {/* NEW LAYOUT GRID - Solves the Desktop alignment and Mobile ordering issue */}
      <div className="-mt-5 flex flex-col gap-y-8 lg:grid lg:grid-cols-3 lg:items-start lg:gap-x-8 lg:gap-y-0">
        {/* ========================================= */}
        {/* LEFT COLUMN: Documents & Shifts           */}
        {/* ========================================= */}
        <div className="contents lg:col-span-2 lg:flex lg:flex-col lg:gap-y-10">
          {/* === 1. PENDING SIGNATURE DOCUMENTS === */}
          {pendingDocuments.length > 0 && (
            <div className="order-2 lg:order-none">
              <div className="mb-6 flex flex-row items-center justify-between">
                <div className="flex items-center gap-3">
                  <div>
                    <h2 className="text-2xl font-extrabold tracking-tight text-black">
                      Request Documents
                    </h2>
                  </div>
                </div>
                <Button
                  variant={'link'}
                  className="font-semibold text-theme"
                  onClick={() => navigate('document-request')}
                >
                  View All Documents
                </Button>
              </div>

              {isProcessingSignature && (
                <div className="mb-6 flex items-center justify-center gap-3 rounded-md border border-blue-200 bg-blue-50 p-4 text-blue-800">
                  <Loader2 className="h-5 w-5 animate-spin text-theme" />
                  <div>
                    <p className="font-medium">Finalizing your signature...</p>
                    <p className="text-sm text-theme/80">
                      Waiting for DocuSign to seal the document. This usually
                      takes about 15–30 seconds.
                    </p>
                  </div>
                </div>
              )}

              <div className="overflow-hidden rounded-xl bg-white">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-semibold text-slate-600">
                        Document Details
                      </TableHead>
                      <TableHead className="font-semibold text-slate-600">
                        Recipient
                      </TableHead>
                      <TableHead className="font-semibold text-slate-600">
                        Date Requested
                      </TableHead>
                      <TableHead className="font-semibold text-slate-600">
                        Status
                      </TableHead>
                      <TableHead className="text-right font-semibold text-slate-600">
                        Action
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingDocuments.map((doc) => {
                      return (
                        <TableRow
                          key={doc._id}
                          className="hover:bg-slate-50/80"
                        >
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium text-slate-900">
                                {doc.content || 'Document Request'}
                              </span>
                              {doc.document &&
                                doc.document !== 'docusign-template-used' && (
                                  <a
                                    href={doc.document}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="mt-1 flex items-center gap-1 text-xs text-theme hover:underline"
                                  >
                                    <Eye className="h-3 w-3" /> View Original
                                  </a>
                                )}
                            </div>
                          </TableCell>

                          <TableCell>
                            <span className="text-sm text-slate-700">
                              {doc?.employeeId?.firstName}{' '}
                              {doc?.employeeId?.lastName}
                            </span>
                          </TableCell>

                          <TableCell>
                            <span className="text-sm text-slate-600">
                              {moment(doc.createdAt).format('DD MMM YYYY')}
                            </span>
                          </TableCell>

                          <TableCell>
                            <Badge className="bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800 hover:bg-amber-100">
                              <Clock className="mr-1 inline h-3 w-3" />
                              <span className="capitalize">Pending</span>
                            </Badge>
                          </TableCell>

                          <TableCell className="text-right">
                            <Button
                              onClick={() => handleSignDocument(doc._id)}
                              disabled={signingDocId === doc._id}
                              size="sm"
                              className="bg-theme text-white hover:bg-theme/90"
                            >
                              {signingDocId === doc._id ? (
                                <span className="flex items-center gap-2">
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                  Preparing...
                                </span>
                              ) : (
                                <span className="flex items-center gap-2">
                                  <FileSignature className="h-4 w-4" /> Sign
                                  Document
                                </span>
                              )}
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {/* === 2. UPCOMING SHIFTS === */}
          <div className="order-3 lg:order-none">
            <div className="mb-5 flex flex-row items-center justify-between">
              <h2 className="text-2xl font-extrabold tracking-tight">
                Upcoming Shifts
              </h2>
              <Button
                variant={'link'}
                className="font-semibold text-theme"
                onClick={() => navigate('upcoming-shifts')}
              >
                View All
              </Button>
            </div>

            <div className="space-y-10">
              {Object.keys(groupedShifts).length === 0 ? (
                <div className="rounded-2xl border border-slate-200/60 bg-slate-50 py-16 text-center shadow-sm">
                  <div className="mx-auto mb-4 h-12 w-12">
                    <svg
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-sm font-semibold">No shifts scheduled</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    You currently have no upcoming shifts assigned.
                  </p>
                </div>
              ) : (
                Object.entries(groupedShifts).map(
                  ([monthYear, monthShifts]) => (
                    <div key={monthYear} className="relative">
                      <div className="z-10 py-3">
                        <h2 className="text-lg font-bold tracking-tight">
                          {monthYear}
                        </h2>
                      </div>

                      <div className="flex flex-col gap-3">
                        {monthShifts.map((shift, index) => {
                          const isLeave = !shift.startTime && !shift.endTime;

                          return (
                            <div
                              key={shift._id || index}
                              className="group flex flex-col items-start overflow-hidden rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-200 hover:border-theme/50 hover:shadow-md sm:flex-row sm:items-center sm:p-5"
                            >
                              <div className="mb-4 flex w-full shrink-0 items-center justify-between sm:mb-0 sm:mr-6 sm:w-auto sm:justify-start sm:gap-4">
                                <div className="flex h-[4.5rem] w-[4.5rem] flex-col items-center justify-center rounded-xl border border-theme/10 bg-theme/10 text-theme">
                                  <span className="mb-0.5 text-[11px] font-bold uppercase tracking-widest">
                                    {getDayName(shift.startDate)}
                                  </span>
                                  <span className="text-2xl font-black leading-none">
                                    {getDateNumber(shift.startDate)}
                                  </span>
                                </div>
                              </div>

                              <div className="w-full flex-1">
                                {isLeave ? (
                                  <div className="grid grid-cols-2 items-center gap-4 lg:grid-cols-8 lg:gap-6">
                                    <div className="col-span-1 lg:col-span-2">
                                      <span className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-slate-500">
                                        Shift Name
                                      </span>
                                      <span className="inline-flex items-center rounded-md bg-theme/10 px-3 py-1 text-xs font-semibold text-theme">
                                        {shift.shiftName || 'Standard'}
                                      </span>
                                    </div>

                                    <div className="col-span-1 lg:col-span-2">
                                      <span className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-slate-500">
                                        Department
                                      </span>
                                      <span className="inline-flex items-center rounded-md bg-theme/10 px-3 py-1 text-xs font-semibold text-theme">
                                        {shift?.departmentId?.departmentName ||
                                          'General'}
                                      </span>
                                    </div>

                                    <div className="col-span-2 flex h-full items-center pt-2 lg:col-span-4 lg:pl-6 lg:pt-0">
                                      <span className="inline-flex items-center rounded-full border border-amber-200/60 bg-amber-50 px-3 py-1 text-sm font-medium text-amber-700">
                                        Leave / Day Off
                                      </span>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="grid grid-cols-2 items-center gap-4 lg:grid-cols-8 lg:gap-6">
                                    <div className="col-span-1 lg:col-span-2">
                                      <span className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-slate-500">
                                        Shift Name
                                      </span>
                                      <span className="inline-flex items-center rounded-md bg-theme/10 px-3 py-1 text-xs font-semibold text-theme">
                                        {shift.shiftName || 'Standard'}
                                      </span>
                                    </div>

                                    <div className="col-span-1 lg:col-span-2">
                                      <span className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-slate-500">
                                        Department
                                      </span>
                                      <span className="inline-flex items-center rounded-md bg-theme/10 px-3 py-1 text-xs font-semibold text-theme">
                                        {shift?.departmentId?.departmentName ||
                                          'General'}
                                      </span>
                                    </div>

                                    <div className="col-span-1 lg:col-span-1">
                                      <span className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-slate-500">
                                        Start
                                      </span>
                                      <span className="text-sm font-bold text-black">
                                        {shift.startTime}
                                      </span>
                                    </div>

                                    <div className="col-span-1 lg:col-span-1">
                                      <span className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-slate-500">
                                        End
                                      </span>
                                      <span className="text-sm font-bold text-black">
                                        {shift.endTime}
                                      </span>
                                    </div>

                                    <div className="col-span-2 lg:col-span-2">
                                      <span className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-slate-500">
                                        Duration
                                      </span>
                                      <span className="text-sm font-bold text-black">
                                        {calculateDuration(
                                          shift.startTime,
                                          shift.endTime
                                        )}{' '}
                                        h
                                      </span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )
                )
              )}
            </div>
          </div>
        </div>

        {/* ========================================= */}
        {/* RIGHT COLUMN: QR Code & Notices           */}
        {/* ========================================= */}
        <div className="contents lg:col-span-1 lg:flex lg:flex-col lg:gap-y-10 lg:border-l lg:border-slate-100 lg:pl-8">
          {/* === 3. QR CODE PREVIEW === */}
          <div className="order-1 flex flex-col gap-4 lg:order-none">
            <div className="mb-1 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-theme/10 text-theme">
                <QrCode className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold tracking-tight text-black">
                  Scan to clock in/out
                </h2>
              </div>
            </div>

            <Card className="flex flex-col items-center justify-center border-slate-200 bg-slate-200 p-6 shadow-sm">
              <div className="rounded-xl bg-white p-4 shadow-sm">
                {eid ? (
                  <QRCodeSVG
                    id="employee-qr-code"
                    value={eid}
                    size={200}
                    level="H"
                    includeMargin={false}
                  />
                ) : (
                  <div className="flex h-[160px] w-[160px] items-center justify-center bg-slate-100 text-sm text-slate-400">
                    No ID Found
                  </div>
                )}
              </div>
              <Button
                onClick={downloadQRCode}
                className="mt-6 w-full bg-theme text-white hover:bg-blue-700"
                disabled={!eid}
              >
                <Download className="mr-2 h-4 w-4" />
                Download QR Code
              </Button>
            </Card>
          </div>

          {/* === 4. NOTICE BOARD === */}
          <div className="order-4 flex flex-col gap-4 lg:order-none">
            <div className="mb-1 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-theme/10 text-theme">
                <Bell className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold tracking-tight text-black">
                  Notice
                </h2>
                <p className="text-xs text-slate-500">Latest announcements</p>
              </div>
            </div>

            <div className="mt-2 flex flex-col gap-3">
              {notices.length === 0 ? (
                <Card className="border border-slate-200 bg-slate-50 py-10 text-center shadow-none">
                  <div className="flex flex-col items-center">
                    <AlertCircle className="mb-3 h-8 w-8 text-slate-500" />
                    <h3 className="text-sm font-semibold text-black">
                      No recent notices
                    </h3>
                  </div>
                </Card>
              ) : (
                notices.map((notice) => (
                  <Card
                    key={notice._id}
                    className="group overflow-hidden border border-slate-200 bg-white p-4 shadow-sm transition-all duration-200 hover:border-slate-300 hover:shadow-md"
                  >
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <Badge
                        className={`px-2 py-0.5 text-xs font-semibold uppercase tracking-wide ${getNoticeTypeStyle(notice.noticeType)}`}
                      >
                        {notice.noticeType}
                      </Badge>
                    </div>

                    <p className="mb-3 line-clamp-3 text-xs font-medium leading-relaxed text-slate-800">
                      {notice.noticeDescription}
                    </p>

                    {/* ---------- NEW: Attachments (same style as previous) ---------- */}
                    {notice.documents && notice.documents.length > 0 && (
                      <div className="mb-2 flex w-fit flex-col items-start gap-2 rounded-lg border border-slate-100 bg-slate-50/80 p-2">
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

                    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-50 pt-3">
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>
                          {moment(notice.noticeDate).format('DD MMM, YYYY')}
                        </span>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>

            {notices.length > 1 && (
              <Button
                className="mt-2 w-full text-xs"
                onClick={() => navigate('notice')}
              >
                View All Notices
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffDashboardPage;
