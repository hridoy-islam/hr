import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Select from 'react-select';
import moment from '@/lib/moment-setup'; // Adjust the import path as needed
import { ArrowLeft, Loader2, Save } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';

import axiosInstance from '@/lib/axios';
import { BlinkingDots } from '@/components/shared/blinking-dots';

// --- Helpers ---
const getCurrentHolidayYear = () => {
  const year = moment().year();
  return `${year}-${year + 1}`;
};

const generateHolidayYears = (backward = 20, forward = 50) => {
  const currentYear = moment().year();
  const years: string[] = [];
  for (let i = backward; i > 0; i--) {
    const start = currentYear - i;
    years.push(`${start}-${start + 1}`);
  }
  years.push(`${currentYear}-${currentYear + 1}`);
  for (let i = 1; i <= forward; i++) {
    const start = currentYear + i;
    years.push(`${start}-${start + 1}`);
  }
  return years;
};

// --- Types ---
interface RowState {
  holidayId: string;
  userId: string;
  firstName: string;
  lastName: string;
  carryForward: number | string;
  maxCarryForward: number;
  holidayEntitlement: number | string;
}

const ManageHolidayPage = () => {
  const { id: companyId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const holidayYears = useMemo(() => generateHolidayYears(5, 10), []);
  const yearOptions = useMemo(
    () => holidayYears.map((y) => ({ value: y, label: y })),
    [holidayYears]
  );

  const [selectedYear, setSelectedYear] = useState(
    yearOptions.find((o) => o.value === getCurrentHolidayYear()) ||
      yearOptions[0]
  );

  const [rows, setRows] = useState<RowState[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // --- Data Fetching ---
  const fetchHolidays = async () => {
    if (!companyId || !selectedYear) return;

    setIsLoading(true);
    try {
      const currentYearStr = selectedYear.value;
      const [startYear] = currentYearStr.split('-');

      // Calculate previous year to fetch remaining hours limit
      const prevYearStr = `${Number(startYear) - 1}-${Number(startYear)}`;

      // Fetch both years simultaneously
      const [currentRes, prevRes] = await Promise.all([
        axiosInstance.get(
          `/hr/holidays?companyId=${companyId}&year=${currentYearStr}&limit=all`
        ),
        axiosInstance.get(
          `/hr/holidays?companyId=${companyId}&year=${prevYearStr}&limit=all`
        )
      ]);

      const currentData = currentRes.data?.data?.result || [];
      const prevData = prevRes.data?.data?.result || [];

      // Map previous year's remaining hours for easy lookup
      const prevYearRemainingMap: Record<string, number> = {};
      prevData.forEach((item: any) => {
        const uId = item.userId?._id || item.userId;
        // If remaining hours is negative, set it to 0
        prevYearRemainingMap[uId] = Math.max(0, item.remainingHours || 0);
      });

      // Build the local row state for the UI
      // Build the local row state for the UI
      const mappedRows: RowState[] = currentData.map((item: any) => {
        const uId = item.userId?._id || item.userId;
        const maxCF = prevYearRemainingMap[uId] || 0;

        const initialCarryForward = item.carryForward || maxCF;

        return {
          holidayId: item._id,
          userId: uId,
          firstName: item.userId?.firstName || '--',
          lastName: item.userId?.lastName || '',
          carryForward: initialCarryForward, // <-- Set it here
          maxCarryForward: maxCF,
          holidayEntitlement: item.holidayEntitlement || 210
        };
      });

      setRows(mappedRows);
    } catch (error) {
      console.error('Failed to fetch holidays:', error);
      toast({ title: 'Failed to load holiday data', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHolidays();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedYear, companyId]);

  // --- Event Handlers ---
  const handleInputChange = (
    index: number,
    field: 'carryForward' | 'holidayEntitlement',
    value: string
  ) => {
    setRows((prev) => {
      const updated = [...prev];
      const row = updated[index];
      let numValue = value === '' ? '' : Number(value);

      // Validation: Carry forward cannot be < 0 or > maxCarryForward
      if (field === 'carryForward' && typeof numValue === 'number') {
        if (numValue < 0) {
          numValue = 0; // Auto-correct to minimum limit
          toast({
            title: `Carry forward cannot be less than 0.`,
            variant: 'destructive'
          });
        } 
        
        // else if (numValue > row.maxCarryForward) {
        //   // numValue = row.maxCarryForward;
        //   // toast({
        //   //   title: `Maximum carry forward for ${row.firstName} is ${row.maxCarryForward} hours.`,
        //   //   variant: 'destructive'
        //   // });
        // }
      }

      updated[index] = { ...row, [field]: numValue };
      return updated;
    });
  };

  const handleUpdate = async () => {
    setIsSaving(true);
    try {
      // Loop through all rows and patch the edited ones to the database
      // Assuming your API route is PATCH /hr/holidays/:holidayId
      const updatePromises = rows.map((row) =>
        axiosInstance.patch(`/hr/holidays/${row.holidayId}`, {
          carryForward: Number(row.carryForward) || 0,
          holidayEntitlement: Number(row.holidayEntitlement) || 0
        })
      );

      await Promise.all(updatePromises);

      toast({ title: 'Holidays updated successfully!' });
      fetchHolidays(); // Refresh data to sync any derived fields like holidayAllowance
    } catch (error) {
      console.error('Failed to update holidays:', error);
      toast({ title: 'Failed to update holidays', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4 rounded-md bg-white  p-4 shadow-md">
      {/* Top Bar matching Wireframe */}
      <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
        <div className='flex flex-row items-center gap-4'>

        <h2 className="text-2xl font-bold tracking-tight text-gray-800">
          Manage Holiday
        </h2>

        <div className="flex items-center gap-4">
          <label className="text-sm font-semibold text-gray-700">
            Select Year
          </label>
          <div className="w-[180px]">
            <Select
              options={yearOptions}
              value={selectedYear}
              onChange={(opt) => opt && setSelectedYear(opt)}
              isClearable={false}
              className="text-sm"
              />
          </div>
        </div>
              </div>

        <Button  onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      </div>

      <Card className="shadow-none">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex h-64 items-center justify-center">
              <BlinkingDots size='large'/>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader className="">
                  <TableRow>
                    <TableHead className="w-1/3  text-sm font-bold text-gray-900">
                      Employee
                    </TableHead>
                    <TableHead className="text-center text-sm font-bold text-gray-900">
                      Carry Forward from last year
                    </TableHead>
                    <TableHead className="text-center text-sm font-bold text-gray-900">
                     Present Year Holiday Entitlement
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.length > 0 ? (
                    rows.map((row, index) => (
                      <TableRow key={row.holidayId}>
                        <TableCell className=" font-medium">
                          {row.firstName} {row.lastName}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex flex-col items-center gap-1">
                            <Input
                              type="number"
                              min="0"
                              value={row.carryForward ?? ''}
                              onChange={(e) =>
                                handleInputChange(
                                  index,
                                  'carryForward',
                                  e.target.value
                                )
                              }
                              className="w-28 text-center"
                            />
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex justify-center">
                            <Input
                              type="number"
                              min="0"
                              value={row.holidayEntitlement ?? ''}
                              onChange={(e) =>
                                handleInputChange(
                                  index,
                                  'holidayEntitlement',
                                  e.target.value
                                )
                              }
                              className="w-28 text-center"
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={3}
                        className="py-8 text-center text-gray-500"
                      >
                        No employees found for this year.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>

              {/* Bottom Update Button */}
              {rows.length > 0 && (
                <div className="flex justify-end  p-4">
                  <Button
                    onClick={handleUpdate}
                    disabled={isSaving}
                    className="w-[120px]"
                  >
                    {isSaving ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    Update
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ManageHolidayPage;
