import { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  X,
  AlertCircle,
  Loader2,
  RefreshCcw,
  Clock,
  CheckCircle2,
  Download
} from 'lucide-react';
import Papa from 'papaparse';
import axiosInstance from '@/lib/axios';
import { useSelector } from 'react-redux';
import { useToast } from '@/components/ui/use-toast';
import moment from 'moment';
import { BlinkingDots } from '@/components/shared/blinking-dots';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

// --- Interfaces ---

interface AttendanceStagedItem {
  _id: string;
  userId?: string | null;
  name: string;
  email: string;
  phone: string;
  
  startDate: string; // YYYY-MM-DD
  
  // Split time state:
  startTime: string;       // "HH:mm" (User sees/edits this)
  startTimeSuffix: string; // ":ss:SSS" (Backend precision preserved here)
  
  endDate: string;   // YYYY-MM-DD
  
  endTime: string;       // "HH:mm"
  endTimeSuffix: string; // ":ss:SSS"
  
  duration: string;  // Display String
  numericDuration: number;
  note: string;
}

// --- Constants & Helpers ---

/**
 * Parses a time string into its components: { main: "HH:mm", suffix: ":ss:SSS" }
 * Ensures robust handling of "09:00", "9:00 AM", ISO strings, etc.
 */
const parseTimeComponents = (input: string | undefined | null) => {
  const defaultObj = { main: '00:00', suffix: ':00:000' };
  if (!input) return defaultObj;
  
  const clean = input.trim();
  let m = moment(clean);

  // Helper to format
  const format = (mom: moment.Moment) => ({
    main: mom.format('HH:mm'),
    suffix: `:${mom.format('ss')}:${mom.format('SSS')}` // Construct :ss:SSS
  });

  // 1. Try ISO/Standard first
  if (m.isValid()) return format(m);

  // 2. Try specific time formats
  const formats = [
    'HH:mm:ss:SSS', // Custom backend format
    'HH:mm:ss.SSS',
    'HH:mm:ss', 
    'HH:mm', 
    'H:mm', 
    'h:mm A', 
    'h:mm a',
    'h:mmA',
    'h:mma'
  ];
  
  // Special handling for the colon-based milliseconds if moment misses it
  if (/^\d{1,2}:\d{2}:\d{2}:\d{3}$/.test(clean)) {
    const parts = clean.split(':');
    m = moment(`${parts[0]}:${parts[1]}:${parts[2]}.${parts[3]}`, 'HH:mm:ss.SSS');
    if (m.isValid()) return format(m);
  }

  m = moment(clean, formats);
  if (m.isValid()) return format(m);

  return defaultObj;
};

/**
 * Calculates duration using the FULL reconstructed time strings (HH:mm + :ss:SSS)
 */
const getNumericDuration = (
  sDate: string,
  sTimeMain: string,
  sSuffix: string,
  eDate: string,
  eTimeMain: string,
  eSuffix: string
): number => {
  // Reconstruct full time strings
  const fullStart = `${sTimeMain}${sSuffix}`; // e.g., "09:00:03:324"
  const fullEnd = `${eTimeMain}${eSuffix}`;   // e.g., "18:00:05:100"

  const parseFull = (date: string, timeStr: string) => {
    // Custom parsing for HH:mm:ss:SSS
    const parts = timeStr.split(':');
    const h = parts[0] || '00';
    const m = parts[1] || '00';
    const s = parts[2] || '00';
    const ms = parts[3] || '000';
    return moment(`${date} ${h}:${m}:${s}.${ms}`, 'YYYY-MM-DD HH:mm:ss.SSS');
  };

  const start = parseFull(sDate, fullStart);
  const end = parseFull(eDate, fullEnd);

  if (start.isValid() && end.isValid()) {
    return moment.duration(end.diff(start)).asMinutes();
  }
  return 0;
};

const calculateDisplayDuration = (
  sDate: string,
  sTime: string,
  sSuffix: string,
  eDate: string,
  eTime: string,
  eSuffix: string
) => {
  const durVal = getNumericDuration(sDate, sTime, sSuffix, eDate, eTime, eSuffix);
  if (durVal <= 0) return '--';
  const duration = moment.duration(durVal, 'minutes');
  const hours = Math.floor(duration.asHours());
  const mins = duration.minutes();
  return `${hours}:${mins}`;
};

export default function BulkAttendancePage() {
  const [stagedData, setStagedData] = useState<AttendanceStagedItem[]>([]);
  const [parentCsvId, setParentCsvId] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  // NEW: Initial loading state
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [uploadError, setUploadError] = useState<string>('');
  const [processingId, setProcessingId] = useState<string | null>(null);

  const { user } = useSelector((state: any) => state.auth);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- API Interactions ---

  const fetchStagedData = async () => {
    try {
      setIsLoading(true);
      const response = await axiosInstance.get(`/csv?companyId=${user?._id}`);
      const result = response.data?.data?.result || [];

      if (result.length > 0) {
        const doc = result[0];
        setParentCsvId(doc._id);

        const mapped = (doc.attendances || []).map((item: any) => {
          const sDate = item.startDate ? moment(item.startDate).format('YYYY-MM-DD') : '';
          const eDate = item.endDate ? moment(item.endDate).format('YYYY-MM-DD') : '';

          // Parse Times
          const sComp = parseTimeComponents(item.startTime);
          const eComp = parseTimeComponents(item.endTime);

          const dispDuration = calculateDisplayDuration(
            sDate, sComp.main, sComp.suffix, 
            eDate, eComp.main, eComp.suffix
          );
          const numDuration = getNumericDuration(
            sDate, sComp.main, sComp.suffix,
            eDate, eComp.main, eComp.suffix
          );

          return {
            _id: item._id,
            userId: item.userId,
            name: item.name,
            email: item.email,
            phone: item.phone || '',
            startDate: sDate,
            startTime: sComp.main,
            startTimeSuffix: sComp.suffix,
            endDate: eDate,
            endTime: eComp.main,
            endTimeSuffix: eComp.suffix,
            duration: dispDuration,
            numericDuration: numDuration,
            note: item.note || ''
          };
        });

        setStagedData(mapped);
      } else {
        setParentCsvId('');
        setStagedData([]);
      }
    } catch (error) {
      console.error('Failed to fetch:', error);
      toast({ title: 'Failed to load data', variant: 'destructive' });
    } finally {
      setIsLoading(false);
      // NEW: Turn off initial loading after first check
      setIsInitialLoading(false);
    }
  };

  const saveToStaging = async (rows: AttendanceStagedItem[]) => {
    try {
      const payload = {
        companyId: user?._id,
        attendances: rows.map((r) => ({
          name: r.name,
          email: r.email,
          phone: r.phone,
          startDate: r.startDate,
          // Reconstruct full string for backend
          startTime: `${r.startTime}${r.startTimeSuffix}`, 
          endDate: r.endDate,
          endTime: `${r.endTime}${r.endTimeSuffix}`,
          duration: r.numericDuration,
          note: r.note
        }))
      };

      await axiosInstance.post('/csv', payload);
      toast({ title: 'File uploaded successfully' });
      fetchStagedData();
    } catch (error: any) {
      console.error('Save error:', error);
      const msg = error.response?.data?.message || 'Failed to save CSV data';
      setUploadError(msg);
    }
  };

  const removeRowFromStaging = async (itemId: string) => {
    try {
      await axiosInstance.patch(`/csv/${parentCsvId}`, {
        attendanceId: itemId
      });
      setStagedData((prev) => prev.filter((item) => item._id !== itemId));

      if (stagedData.length <= 1) {
        await axiosInstance.delete(`/csv/${parentCsvId}`);
        setParentCsvId('');
        setStagedData([]);
      }
    } catch (error) {
      toast({ title: 'Failed to remove entry', variant: 'destructive' });
    }
  };

  const approveAttendance = async (item: AttendanceStagedItem) => {
    if (!item.userId) return;

    try {
      setProcessingId(item._id);
      
      const numericDuration = getNumericDuration(
        item.startDate, item.startTime, item.startTimeSuffix,
        item.endDate, item.endTime, item.endTimeSuffix
      );

      await axiosInstance.post('/hr/attendance/clock-event', {
        userId: item.userId,
        startDate: item.startDate,
        startTime: `${item.startTime}${item.startTimeSuffix}`, 
        endDate: item.endDate,
        endTime: `${item.endTime}${item.endTimeSuffix}`,       
        duration: numericDuration,
        notes: item.note,
        eventType: 'manual',
        clockType: 'manual',
        approvalStatus: 'approved'
      });

      toast({ title: `Approved: ${item.name}` });
      await removeRowFromStaging(item._id);
    } catch (error: any) {
      toast({
        title: error.response?.data?.message || 'Failed to create',
        variant: 'destructive'
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleFileUpload = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      if (stagedData.length > 0) {
        setUploadError('Please clear current list first.');
        return;
      }

      setIsUploading(true);
      setUploadError('');

      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
          try {
            const csvRows = results.data as any[];
            if (csvRows.length === 0) throw new Error('CSV file is empty');

            const processedRows: AttendanceStagedItem[] = csvRows
              .map((row, index) => {
                const name = row['name'] || row['Employee'] || 'Unknown';
                const email = row['email'] || row['Email'] || '';
                const phone = row['phone'] || row['Phone'] || '';
                const note = row['note'] || row['Note'] || '';

                let sDate = row['start_date'] || moment().format('YYYY-MM-DD');
                let eDate = row['end_date'] || sDate;
                
                if (moment(sDate).isValid()) sDate = moment(sDate).format('YYYY-MM-DD');
                if (moment(eDate).isValid()) eDate = moment(eDate).format('YYYY-MM-DD');

                // Parse components
                const sComp = parseTimeComponents(row['start_time'] || '09:00');
                const eComp = parseTimeComponents(row['end_time'] || '18:00');

                const durStr = calculateDisplayDuration(
                  sDate, sComp.main, sComp.suffix,
                  eDate, eComp.main, eComp.suffix
                );
                const durNum = getNumericDuration(
                  sDate, sComp.main, sComp.suffix,
                  eDate, eComp.main, eComp.suffix
                );

                return {
                  _id: `temp_${index}`,
                  userId: null,
                  name,
                  email,
                  phone,
                  note,
                  startDate: sDate,
                  startTime: sComp.main,
                  startTimeSuffix: sComp.suffix,
                  endDate: eDate,
                  endTime: eComp.main,
                  endTimeSuffix: eComp.suffix,
                  duration: durStr,
                  numericDuration: durNum
                };
              })
              .filter((r) => r.email);

            await saveToStaging(processedRows);
          } catch (error: any) {
            setUploadError(error.message);
          } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
          }
        },
        error: (err) => {
          setUploadError(`CSV Parse Error: ${err.message}`);
          setIsUploading(false);
        }
      });
    },
    [stagedData.length]
  );

  const handleInputChange = (
    id: string,
    field: keyof AttendanceStagedItem,
    value: string
  ) => {
    setStagedData((prev) =>
      prev.map((item) => {
        if (item._id !== id) return item;

        let processedValue = value;

        // --- Time Field Logic ---
        if (field === 'startTime' || field === 'endTime') {
          // 1. Sanitize: Allow digits and colon only
          processedValue = processedValue.replace(/[^\d:]/g, '');

          // 2. Limit length to HH:mm (5 chars)
          if (processedValue.length > 5) {
            processedValue = processedValue.slice(0, 5);
          }

          // 3. Auto-insert colon if user is typing the 2nd digit
          const prevVal = item[field];
          // If length increased to 2 and previously was 1, add colon
          if (processedValue.length === 2 && prevVal.length === 1) {
            processedValue = processedValue + ':';
          }
        }

        const updated = { ...item, [field]: processedValue };
        
        // --- Recalculate Duration ---
        if (['startDate', 'startTime', 'endDate', 'endTime'].includes(field)) {
          updated.duration = calculateDisplayDuration(
            updated.startDate, updated.startTime, updated.startTimeSuffix,
            updated.endDate, updated.endTime, updated.endTimeSuffix
          );
          updated.numericDuration = getNumericDuration(
            updated.startDate, updated.startTime, updated.startTimeSuffix,
            updated.endDate, updated.endTime, updated.endTimeSuffix
          );
        }
        return updated;
      })
    );
  };

  const handleTimeBlur = (
    id: string,
    field: 'startTime' | 'endTime',
    value: string
  ) => {
    // Normalize user input to "HH:mm" on blur just in case
    let normalized = '00:00';
    if(value) {
        const m = moment(value, ['HH:mm', 'H:mm', 'HHmm', 'H:m']);
        if(m.isValid()) normalized = m.format('HH:mm');
    }
    
    setStagedData((prev) =>
      prev.map((item) => {
        if (item._id !== id) return item;
        const updated = { ...item, [field]: normalized };
        
        updated.duration = calculateDisplayDuration(
            updated.startDate, updated.startTime, updated.startTimeSuffix,
            updated.endDate, updated.endTime, updated.endTimeSuffix
          );
        updated.numericDuration = getNumericDuration(
            updated.startDate, updated.startTime, updated.startTimeSuffix,
            updated.endDate, updated.endTime, updated.endTimeSuffix
          );
          
        return updated;
      })
    );
  };

  useEffect(() => {
    fetchStagedData();
  }, []);

  // NEW: Render initial loading state
  if (isInitialLoading) {
    return (
      <div className="flex h-60 w-full items-center justify-center">
        <BlinkingDots size="large" color="bg-theme" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* UPLOAD CARD */}
      {stagedData.length === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Upload Attendance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              <div className="flex w-full max-w-md items-center gap-4">
                <Label htmlFor="csv" className="min-w-fit whitespace-nowrap">
                  CSV File
                </Label>
                <Input
                  ref={fileInputRef}
                  id="csv"
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                  className="flex-1 cursor-pointer"
                />
              </div>

              <div>
                <a
                  href="/demo_attendance.csv"
                  download
                  className="inline-flex h-9 items-center justify-center rounded-md bg-theme px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-theme/90"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download Sample
                </a>
              </div>

              {uploadError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{uploadError}</AlertDescription>
                </Alert>
              )}
              {isUploading && (
                <div className="flex items-center text-sm ">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing CSV...
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* DATA TABLE */}
      {stagedData.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Review Data</CardTitle>
              <CardDescription>
                Review and approve attendance records.
              </CardDescription>
            </div>
            <Button
              onClick={fetchStagedData}
              disabled={isLoading}
              size="sm"
            >
              <RefreshCcw
                className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`}
              />
              Refresh
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-10">
                <BlinkingDots size="large" color="bg-theme" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead className='max-w-[140px]'>Start Date</TableHead>
                      <TableHead>Start Time</TableHead>
                      <TableHead className='max-w-[140px]'>End Date</TableHead>
                      <TableHead>End Time</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stagedData.map((row) => {
                      const hasUser = !!row.userId;
                      const isProcessing = processingId === row._id;
                      const isDurationValid = row.numericDuration > 0;
                      const canApprove = hasUser && isDurationValid && !isProcessing;

                      return (
                        <TableRow
                          key={row._id}
                          className={!hasUser ? 'bg-red-50 hover:bg-red-100' : ''}
                        >
                          <TableCell>
                            <div className="flex flex-row items-center gap-1">
                              <span className="text-sm font-medium">{row.name}</span>
                              
  {!hasUser && (
    <span className="inline-flex items-center rounded-md border border-red-300 bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-600">
      Not Found
    </span>
  )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              <span className="text-sm ">{row.email}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              <span className="text-sm ">{row.phone}</span>
                            </div>
                          </TableCell>

                          <TableCell>
                            <div className="w-[130px]">
                              <DatePicker
                                selected={
                                  row.startDate
                                    ? moment(row.startDate, 'YYYY-MM-DD').toDate()
                                    : null
                                }
                                onChange={(date: Date | null) =>
                                  handleInputChange(
                                    row._id,
                                    'startDate',
                                    date ? moment(date).format('YYYY-MM-DD') : ''
                                  )
                                }
                                dateFormat="dd-MM-yyyy"
                                 className="flex h-8 w-full rounded-md border border-gray-300 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                placeholderText="DD-MM-YYYY"
                                portalId='root'
                                showMonthDropdown
                                showYearDropdown
                                dropdownMode='select'
                              />
                            </div>
                          </TableCell>

                          <TableCell>
                            <Input
                              value={row.startTime}
                              onChange={(e) =>
                                handleInputChange(
                                  row._id,
                                  'startTime',
                                  e.target.value
                                )
                              }
                              onBlur={(e) =>
                                handleTimeBlur(
                                  row._id,
                                  'startTime',
                                  e.target.value
                                )
                              }
                              placeholder="09:00"
                              className="h-8 w-20 font-mono text-sm"
                              maxLength={5}
                            />
                          </TableCell>

                          <TableCell>
                            <div className="w-[130px]">
                              <DatePicker
                                selected={
                                  row.endDate
                                    ? moment(row.endDate, 'YYYY-MM-DD').toDate()
                                    : null
                                }
                                onChange={(date: Date | null) =>
                                  handleInputChange(
                                    row._id,
                                    'endDate',
                                    date ? moment(date).format('YYYY-MM-DD') : ''
                                  )
                                }
                                dateFormat="dd-MM-yyyy"
                                className="flex h-8 w-full rounded-md border border-gray-300 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                placeholderText="DD-MM-YYYY"
                                portalId='root'
                                 showMonthDropdown
                                showYearDropdown
                                dropdownMode='select'
                              />
                            </div>
                          </TableCell>

                          <TableCell>
                            <Input
                              value={row.endTime}
                              onChange={(e) =>
                                handleInputChange(
                                  row._id,
                                  'endTime',
                                  e.target.value
                                )
                              }
                              onBlur={(e) =>
                                handleTimeBlur(
                                  row._id,
                                  'endTime',
                                  e.target.value
                                )
                              }
                              placeholder="18:00"
                              className="h-8 w-20 font-mono text-sm"
                              maxLength={5}
                            />
                          </TableCell>

                          <TableCell>
                            <div
                              className={`flex items-center gap-1 whitespace-nowrap font-mono text-sm ${!isDurationValid ? 'font-bold text-red-500' : 'text-gray-600'}`}
                            >
                              <span>{row.duration}</span>
                            </div>
                          </TableCell>

                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                className="h-8 w-8 bg-green-600 p-0 hover:bg-green-700"
                                disabled={!canApprove}
                                onClick={() => approveAttendance(row)}
                                title={!isDurationValid ? 'Duration Invalid' : 'Approve'}
                              >
                                {isProcessing ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <CheckCircle2 className="h-4 w-4" />
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                className="h-8 w-8 p-0"
                                disabled={isProcessing}
                                onClick={() => removeRowFromStaging(row._id)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}