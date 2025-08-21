/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import {
  PDFDownloadLink,
  Document,
  Page,
  Text,
  View,
  StyleSheet
} from '@react-pdf/renderer';
import 'react-datepicker/dist/react-datepicker.css';
import { useSelector } from 'react-redux';
import axiosInstance from '@/lib/axios'; // Make sure this is configured
import moment from 'moment';

// Define Attendance type based on your backend model
interface AttendanceRecord {
  _id: string;
  userId: string;
  clockIn: string | null;
  clockOut: string | null;
  eventType: 'clock_in' | 'clock_out' | 'manual';
  clockType: 'face' | 'qr' | 'pin' | 'manual';
  location?: {
    latitude: number;
    longitude: number;
    address: string;
  };
  source: 'accessControl' | 'desktopApp' | 'mobileApp';
  deviceId: string;
  approvalRequired: boolean;
  approvalStatus: 'pending' | 'approved' | 'rejected';
  approvedBy: string | null;
  approvedAt: string | null;
  notes: string;
  breakTimes: { breakStart: string; breakEnd: string }[];
  screenshots: { url: string; capturedAt: string }[];
  timestamp: string;
  createdAt: string;
  updatedAt: string;
}

const StaffAttendancePage = () => {
  const [startDate, setStartDate] = useState<Date>(
    moment().startOf('month').toDate()
  );
  const [endDate, setEndDate] = useState<Date>(
    moment().endOf('month').toDate()
  );
  const [downloadStartDate, setDownloadStartDate] = useState<Date>(
    moment().startOf('month').toDate()
  );
  const [downloadEndDate, setDownloadEndDate] = useState<Date>(
    moment().endOf('month').toDate()
  );
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([]);
  const [filteredData, setFilteredData] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const user = useSelector((state: any) => state.auth.user);
  const currentMonth = new Date().toLocaleString('default', { month: 'long' });
  const currentYear = new Date().getFullYear();

  // Fetch attendance data from API
  const fetchAttendance = async (start: Date, end: Date) => {
    if (!user?._id) return;

    setIsLoading(true);
    setError(null);
    try {
      const response = await axiosInstance.get('/hr/attendance', {
        params: {
          userId: user._id,
          fromDate: start.toISOString(),
          toDate: end.toISOString()
        }
      });

      if (Array.isArray(response.data.data.result)) {
        setAttendanceData(response.data.data.result);
        setFilteredData(response.data.data.result);
      } else {
        setAttendanceData([]);
        setFilteredData([]);
      }
    } catch (err: any) {
      console.error('Error fetching attendance:', err);
      setError(
        err.response?.data?.message || 'Failed to load attendance data.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance(startDate, endDate);
  }, [user?._id]);

  // Handle filter button click
  const handleFilter = () => {
    fetchAttendance(startDate, endDate);
  };

  // Reset filter
  const handleReset = () => {
    const today = new Date();
    setStartDate(today);
    setEndDate(today);
    fetchAttendance(today, today);
  };

  // Compute stats
  const presentDays = filteredData.filter((item) =>
    item.clockIn && !item.clockOut ? false : item.clockIn
  ).length;

  const absentDays = filteredData.filter((item) => !item.clockIn).length;

  const lateDays = filteredData.filter((item) => {
    if (!item.clockIn) return false;
    const clockInTime = new Date(item.clockIn).getHours();
    return clockInTime > 9; // Assuming late after 9:00 AM
  }).length;

  const totalWorkingDays = filteredData.length;

  const averageHours = (
    filteredData
      .map((item) => {
        if (!item.clockIn || !item.clockOut) return 0;
        const diff =
          new Date(item.clockOut).getTime() - new Date(item.clockIn).getTime();
        return diff / (1000 * 60 * 60); // hours
      })
      .reduce((a, b) => a + b, 0) / (presentDays || 1)
  ).toFixed(2);

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatTime = (dateString: string | null) => {
    if (!dateString) return '--';
    return new Date(dateString).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDuration = (
    clockIn: string | null,
    clockOut: string | null
  ): number => {
    if (!clockIn || !clockOut) return 0;
    const inTime = new Date(clockIn).getTime();
    const outTime = new Date(clockOut).getTime();
    return ((outTime - inTime) / (1000 * 60 * 60)).toFixed(2) as any;
  };

  // PDF Document
  const AttendancePDF = ({ data }: { data: AttendanceRecord[] }) => (
    <Document>
      <Page style={pdfStyles.page}>
        <View style={pdfStyles.header}>
          <Text style={pdfStyles.title}>Attendance Report</Text>
          <Text style={pdfStyles.subtitle}>
            {downloadStartDate.toDateString()} to{' '}
            {downloadEndDate.toDateString()}
          </Text>
        </View>
        <View style={pdfStyles.table}>
          <View style={pdfStyles.tableRow}>
            <Text style={[pdfStyles.tableCell, pdfStyles.tableHeader]}>
              Date
            </Text>
            <Text style={[pdfStyles.tableCell, pdfStyles.tableHeader]}>
              Status
            </Text>
            <Text style={[pdfStyles.tableCell, pdfStyles.tableHeader]}>
              Start Time
            </Text>
            <Text style={[pdfStyles.tableCell, pdfStyles.tableHeader]}>
              End Time
            </Text>
            <Text style={[pdfStyles.tableCell, pdfStyles.tableHeader]}>
              Duration (hrs)
            </Text>
          </View>
          {data.map((item, index) => {
            const duration = getDuration(item.clockIn, item.clockOut);
            const status = !item.clockIn
              ? 'Absent'
              : new Date(item.clockIn).getHours() > 9
                ? 'Late'
                : 'Present';

            return (
              <View style={pdfStyles.tableRow} key={index}>
                <Text style={pdfStyles.tableCell}>
                  {formatDate(item.timestamp || item.createdAt)}
                </Text>
                <Text style={pdfStyles.tableCell}>{status}</Text>
                <Text style={pdfStyles.tableCell}>
                  {formatTime(item.clockIn)}
                </Text>
                <Text style={pdfStyles.tableCell}>
                  {formatTime(item.clockOut)}
                </Text>
                <Text style={pdfStyles.tableCell}>{duration}</Text>
              </View>
            );
          })}
        </View>
        <View style={pdfStyles.footer}>
          <Text>Generated on: {new Date().toLocaleString()}</Text>
        </View>
      </Page>
    </Document>
  );

  // Filter data for PDF download
  const getFilteredDataForDownload = () => {
    return filteredData.filter((item) => {
      const itemDate = new Date(item.timestamp || item.createdAt);
      return itemDate >= downloadStartDate && itemDate <= downloadEndDate;
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <h1 className="mb-4 text-3xl font-bold text-gray-800">My Attendance</h1>

        {/* Overview Section */}
        <section className="mb-8 rounded-lg bg-white p-6 shadow">
          <h2 className="mb-6 text-2xl font-semibold text-gray-700">
            {currentMonth} {currentYear} Overview
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border border-blue-100 bg-blue-50 p-4 text-center">
              <h3 className="text-sm font-medium text-blue-600">
                Total Working Days
              </h3>
              <p className="text-2xl font-bold text-blue-800">
                {totalWorkingDays}
              </p>
            </div>
            <div className="rounded-lg border border-green-100 bg-green-50 p-4 text-center">
              <h3 className="text-sm font-medium text-green-600">
                Present Days
              </h3>
              <p className="text-2xl font-bold text-green-800">{presentDays}</p>
            </div>
            <div className="rounded-lg border border-red-100 bg-red-50 p-4 text-center">
              <h3 className="text-sm font-medium text-red-600">Absent Days</h3>
              <p className="text-2xl font-bold text-red-800">{absentDays}</p>
            </div>
            <div className="rounded-lg border border-yellow-100 bg-yellow-50 p-4 text-center">
              <h3 className="text-sm font-medium text-yellow-600">Late Days</h3>
              <p className="text-2xl font-bold text-yellow-800">{lateDays}</p>
            </div>
          </div>
        </section>

        {/* Attendance List */}
        <section className="rounded-lg bg-white p-6 shadow">
          <div className="mb-4 flex w-full flex-row items-center justify-between">
            <h2 className="text-2xl font-semibold text-gray-700">
              Attendance Records
            </h2>
            <button
              onClick={() => setIsModalOpen(true)}
              className="rounded-md bg-supperagent px-5 py-2 font-medium text-white transition hover:bg-supperagent/90"
            >
              Download PDF
            </button>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-end gap-4 pb-4">
            <div className="flex flex-col">
              <label className="mb-1 text-sm font-medium text-gray-600">
                From:
              </label>
              <DatePicker
                selected={startDate}
                onChange={setStartDate}
                selectsStart
                startDate={startDate}
                endDate={endDate}
                maxDate={new Date()}
                className="rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex flex-col">
              <label className="mb-1 text-sm font-medium text-gray-600">
                To:
              </label>
              <DatePicker
                selected={endDate}
                onChange={setEndDate}
                selectsEnd
                startDate={startDate}
                endDate={endDate}
                minDate={startDate}
                maxDate={new Date()}
                className="rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={handleFilter}
              className="rounded-md bg-supperagent px-5 py-2 font-medium text-white transition hover:bg-supperagent/90"
            >
              Apply Filter
            </button>
            <button
              onClick={handleReset}
              className="rounded-md bg-gray-500 px-5 py-2 font-medium text-white transition hover:bg-gray-600"
            >
              Reset
            </button>
          </div>

          {/* Error State */}
          {error && (
            <div className="py-10 text-center text-red-600">{error}</div>
          )}

          {/* Loading State */}
          {isLoading ? (
            <div className="py-10 text-center text-gray-500">
              Loading attendance data...
            </div>
          ) : filteredData.length === 0 ? (
            <div className="py-10 text-center text-gray-500">
              No records found for the selected period.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full rounded-lg border border-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="border-b px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      Date
                    </th>
                    <th className="border-b px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      Status
                    </th>
                    <th className="border-b px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      Start Time
                    </th>
                    <th className="border-b px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      End Time
                    </th>
                    <th className="border-b px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      Duration (hours)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((item, index) => {
                    const duration = getDuration(item.clockIn, item.clockOut);
                    const status = !item.clockIn
                      ? 'Absent'
                      : new Date(item.clockIn).getHours() > 9
                        ? 'Late'
                        : 'Present';

                    return (
                      <tr
                        key={item._id || index}
                        className="border-b last:border-b-0 hover:bg-gray-50"
                      >
                        <td className="px-4 py-3 text-sm text-gray-800">
                          {formatDate(item.timestamp || item.createdAt)}
                        </td>
                        <td
                          className={`px-4 py-3 text-sm font-medium ${
                            status === 'Present'
                              ? 'text-green-700'
                              : status === 'Absent'
                                ? 'text-red-700'
                                : 'text-yellow-700'
                          }`}
                        >
                          {status}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-800">
                          {formatTime(item.clockIn)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-800">
                          {formatTime(item.clockOut)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-800">
                          {duration}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Download Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
              <h3 className="mb-4 text-xl font-semibold">
                Download Attendance Report
              </h3>
              <p className="mb-4 text-gray-600">
                Select the date range for your PDF report.
              </p>

              <div className="mb-4 flex flex-col gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-600">
                    From:
                  </label>
                  <DatePicker
                    selected={downloadStartDate}
                    onChange={setDownloadStartDate}
                    selectsStart
                    startDate={downloadStartDate}
                    endDate={downloadEndDate}
                    maxDate={new Date()}
                    className="w-full rounded-md border border-gray-300 px-3 py-2"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-600">
                    To:
                  </label>
                  <DatePicker
                    selected={downloadEndDate}
                    onChange={setDownloadEndDate}
                    selectsEnd
                    startDate={downloadStartDate}
                    endDate={downloadEndDate}
                    minDate={downloadStartDate}
                    maxDate={new Date()}
                    className="w-full rounded-md border border-gray-300 px-3 py-2"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-md bg-gray-400 px-4 py-2 font-medium text-white hover:bg-gray-500"
                >
                  Cancel
                </button>
                <PDFDownloadLink
                  document={
                    <AttendancePDF data={getFilteredDataForDownload()} />
                  }
                  fileName={`attendance_${downloadStartDate.toISOString().split('T')[0]}_to_${downloadEndDate.toISOString().split('T')[0]}.pdf`}
                >
                  {({ loading }) => (
                    <button
                      type="button"
                      disabled={loading}
                      className={`rounded-md px-4 py-2 font-medium text-white ${
                        loading
                          ? 'bg-supperagent/80'
                          : 'bg-supperagent hover:bg-supperagent/90'
                      }`}
                    >
                      {loading ? 'Generating...' : 'Generate PDF'}
                    </button>
                  )}
                </PDFDownloadLink>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// PDF Styling
const pdfStyles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: 'Helvetica'
  },
  header: {
    marginBottom: 20,
    textAlign: 'center'
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5
  },
  subtitle: {
    fontSize: 14,
    color: '#666'
  },
  table: {
    width: '100%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#bfbfbf',
    marginBottom: 20
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#bfbfbf'
  },
  tableCell: {
    padding: 5,
    fontSize: 10,
    flex: 1,
    borderRightWidth: 1,
    borderRightColor: '#bfbfbf'
  },
  tableHeader: {
    backgroundColor: '#f0f0f0',
    fontWeight: 'bold'
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    fontSize: 10,
    textAlign: 'center',
    color: '#666'
  }
});

export default StaffAttendancePage;
