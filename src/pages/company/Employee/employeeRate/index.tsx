

import { useEffect, useState } from 'react';
import Select from 'react-select';
import axiosInstance from '@/lib/axios';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';
import { BlinkingDots } from '@/components/shared/blinking-dots';
import { MoveLeft, Trash } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';

interface Shift {
  _id: string;
  name: string;
  startTime: string;
  endTime: string;
  description?: string;
}

interface Rate {
  rate: number;
}

interface EmployeeRate {
  _id: string;
  shiftId: string[];
  employeeId: string;
  rates: Record<string, Rate>;
  createdAt: string;
  updatedAt: string;
}

// Reordered days with Monday first
const daysOfWeek = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday'
];

export default function EmployeeRate() {
  const { id: employeeId } = useParams();
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [selectedShifts, setSelectedShifts] = useState<Shift[]>([]);
  const [employeeRates, setEmployeeRates] = useState<
    Record<
      string,
      {
        id: string;
        rates: Record<string, Rate>;
      }
    >
  >({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [shiftToRemove, setShiftToRemove] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const employee = location.state || {};

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch shifts
        const shiftsResponse = await axiosInstance.get('/hr/shift');
        setShifts(shiftsResponse.data.data?.result || []);

        // Fetch employee rates if employeeId exists
        if (employeeId) {
          const ratesResponse = await axiosInstance.get(
            `/hr/employeeRate?employeeId=${employeeId}`
          );
          const ratesData = ratesResponse.data.data?.result || [];

          const ratesMap: Record<
            string,
            {
              id: string;
              rates: Record<string, Rate>;
            }
          > = {};
          const selected: Shift[] = [];

          ratesData.forEach((rate: EmployeeRate) => {
            const shiftObj = rate.shiftId[0]; // assuming this is the object with `_id`
            const shiftId = shiftObj?._id; // get actual string ID
            const shift = shiftsResponse.data.data?.result.find(
              (s: Shift) => s._id === shiftId
            );

            if (shift && shiftId) {
              ratesMap[shiftId] = {
                id: rate._id,
                rates: rate.rates
              };
              selected.push(shift);
            }
          });

          setEmployeeRates(ratesMap);
          setSelectedShifts(selected);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load data',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [employeeId]);



  const handleAddShift = async (shift: Shift) => {
    if (selectedShifts.some((s) => s._id === shift._id)) return;

    try {
      setSaving((prev) => ({ ...prev, [shift._id]: true }));

      // Create default rates object
      const defaultRates = daysOfWeek.reduce(
        (acc, day) => {
          acc[day] = { rate: 0 };
          return acc;
        },
        {} as Record<string, Rate>
      );

      // Create new employee rate
      const response = await axiosInstance.post('/hr/employeeRate', {
        shiftId: [shift._id],
        employeeId,
        rates: defaultRates
      });

      // Update state
      setEmployeeRates((prev) => ({
        ...prev,
        [shift._id]: {
          id: response.data.data._id,
          rates: defaultRates
        }
      }));
      setSelectedShifts((prev) => [...prev, shift]);

      toast({
        title: 'Success',
        description: `Added ${shift.name} shift`
      });
    } catch (error) {
      console.error('Error adding shift:', error);
      toast({
        title: 'Error',
        description: 'Failed to add shift',
        variant: 'destructive'
      });
    } finally {
      setSaving((prev) => ({ ...prev, [shift._id]: false }));
    }
  };

  const handleRemoveShift = async (shiftId: string) => {
    setShiftToRemove(shiftId);
    setShowDeleteDialog(true);
  };

  const confirmRemoveShift = async () => {
    if (!shiftToRemove) return;

    const rateId = employeeRates[shiftToRemove]?.id;
    if (!rateId) return;

    try {
      setSaving((prev) => ({ ...prev, [shiftToRemove]: true }));

      // Delete employee rate
      await axiosInstance.delete(`/hr/employeeRate/${rateId}`);

      // Update state
      setSelectedShifts((prev) => prev.filter((s) => s._id !== shiftToRemove));
      setEmployeeRates((prev) => {
        const newRates = { ...prev };
        delete newRates[shiftToRemove];
        return newRates;
      });

      toast({
        title: 'Success',
        description: 'Shift removed successfully'
      });
    } catch (error) {
      console.error('Error removing shift:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove shift',
        variant: 'destructive'
      });
    } finally {
      setSaving((prev) => ({ ...prev, [shiftToRemove]: false }));
      setShiftToRemove(null);
      setShowDeleteDialog(false);
    }
  };

  const handleRateChange = (shiftId: string, day: string, value: number) => {
    setEmployeeRates((prev) => ({
      ...prev,
      [shiftId]: {
        ...prev[shiftId],
        rates: {
          ...prev[shiftId]?.rates,
          [day]: { rate: value }
        }
      }
    }));
  };

  const saveRates = async (shiftId: string) => {
    const rateData = employeeRates[shiftId];
    if (!rateData) return;

    try {
      setSaving((prev) => ({ ...prev, [shiftId]: true }));

      // Update employee rate
      await axiosInstance.patch(`/hr/employeeRate/${rateData.id}`, {
        shiftId: [shiftId],
        employeeId,
        rates: rateData.rates
      });

      toast({
        title: 'Success',
        description: 'Data saved successfully'
      });
    } catch (error) {
      console.error('Error saving rates:', error);
      toast({
        title: 'Error',
        description: 'Failed to save rates',
        variant: 'destructive'
      });
    } finally {
      setSaving((prev) => ({ ...prev, [shiftId]: false }));
    }
  };

  const handleShiftChange = async (selectedOptions: any[]) => {
    const newSelected = selectedOptions || [];
    const currentIds = selectedShifts.map((s) => s._id);
    const newIds = newSelected.map((s: any) => s._id);

    // Find shifts to add
    const toAdd = newSelected.filter((s: any) => !currentIds.includes(s._id));

    for (const shift of toAdd) {
      await handleAddShift(shift);
    }

    setSelectedShifts(newSelected);
  };

  const copyMondayRateToAll = (shiftId: string) => {
    const mondayRate = employeeRates[shiftId]?.rates['Monday']?.rate || 0;

    const updatedRates = { ...employeeRates };
    daysOfWeek.forEach((day) => {
      if (day !== 'Monday') {
        updatedRates[shiftId].rates[day] = { rate: mondayRate };
      }
    });

    setEmployeeRates(updatedRates);
    saveRates(shiftId);
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <BlinkingDots size="large" color="bg-supperagent" />
      </div>
    );
  }

  const customOnKeyDown = (e: React.KeyboardEvent) => {
    if (['Backspace', 'Delete', 'Enter'].includes(e.key)) {
      e.preventDefault();
    }
  };

  return (
    <div className="mx-auto space-y-3">
      <div className="flex w-full flex-row items-center justify-between">
        {/* <h1 className="text-2xl font-bold">Employee Rate Management</h1> */}
      </div>
      <Card className="-mt-3 w-full rounded-lg bg-white p-4 shadow-md">
        <div className="flex flex-col items-start justify-between text-sm text-gray-700">
          <div className="flex w-full flex-row items-center justify-between gap-2">
            <h2 className="truncate text-lg font-semibold text-gray-800">
              Employee Name:{' '}
              <span className="font-normal">{`${employee.title} ${employee.firstName} ${employee.initial} ${employee.lastName}`}</span>
            </h2>
            <Button
              className="h-8 bg-supperagent text-white hover:bg-supperagent/90"
              onClick={() => navigate(-1)}
            >
              <MoveLeft />
              Back
            </Button>
          </div>

          <div className="mt-4 flex w-full flex-row flex-wrap items-start justify-between gap-4">
            <div className="flex min-w-[250px] flex-col items-start gap-2">
              <span className="font-medium">Email:</span>
              <span>{employee.email}</span>
            </div>

            <div className="flex min-w-[250px] flex-col items-start gap-2">
              <span className="font-medium">Gender:</span>
              <span>{employee.gender}</span>
            </div>

            <div className="flex min-w-[250px] flex-col items-start gap-2">
              <span className="font-medium">Mobile Phone:</span>
              <span>{employee.mobilePhone}</span>
            </div>

            <div className="flex min-w-[250px] flex-col items-start gap-2">
              <span className="font-medium">Designation:</span>
              <span>{employee.designationId?.title || ''}</span>
            </div>
            <div className="flex min-w-[250px] flex-col items-start gap-2">
              <span className="font-medium">Department:</span>
              <span>{employee.departmentId?.departmentName || ''}</span>
            </div>
          </div>
        </div>
      </Card>

      <div className="space-y-2">
        <Label htmlFor="shift-select">
          Please select the employee's working shift from the options below
        </Label>
        <Select
          id="shift-select"
          isMulti
          options={shifts.map((shift) => ({
            value: shift._id,
            label: `${shift.name} (Start Time ${shift.startTime} - end Time ${shift.endTime})`,
            ...shift
          }))}
          value={selectedShifts.map((shift) => ({
            value: shift._id,
            label: `${shift.name} (Start Time ${shift.startTime} - end Time ${shift.endTime})`,
            ...shift
          }))}
          onChange={handleShiftChange}
          placeholder="Select shifts..."
          className="react-select-container"
          classNamePrefix="react-select"
          closeMenuOnSelect={true}
          hideSelectedOptions={true}
          isClearable={false}
          components={{
            MultiValue: () => null,
            MultiValueRemove: () => null,
            IndicatorSeparator: () => null
          }}
          onKeyDown={(e) => {
            // Prevent Enter from selecting an option
            if (e.key === 'Enter') {
              e.preventDefault();
            }

            // Prevent Backspace from deleting last selected item
            if (
              e.key === 'Backspace' &&
              e.target instanceof HTMLInputElement &&
              e.target.selectionStart === 0 &&
              e.target.selectionEnd === e.target.value.length
            ) {
              e.preventDefault();
            }
          }}
        />
      </div>

      {selectedShifts.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {selectedShifts.map((shift) => (
            <Card key={shift._id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="mb-2 flex flex-col gap-2">
                      <h1>{shift.name}</h1>
                      <h2 className="text-md font-medium">
                        Start Time: {shift.startTime} - End Time:{' '}
                        {shift.endTime}
                      </h2>
                    </CardTitle>
                    <CardDescription>Daily rates</CardDescription>
                  </div>
                  <div
                    className="cursor-pointer rounded-sm bg-destructive p-1 text-destructive-foreground hover:bg-destructive/90"
                    onClick={() => handleRemoveShift(shift._id)}
                  >
                    <Trash />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {daysOfWeek.map((day) => {
                    const rate =
                      employeeRates[shift._id]?.rates[day]?.rate || 0;
                    return (
                      <div
                        key={day}
                        className="flex flex-row items-center justify-between gap-4"
                      >
                        <Label htmlFor={`${shift._id}-${day}`}>{day}</Label>
                        <div className="flex items-center gap-2">
                          {day === 'Monday' && (
                            <Button
                              size="sm"
                              onClick={() => copyMondayRateToAll(shift._id)}
                              className="bg-supperagent text-white hover:bg-supperagent/90"
                            >
                              Copy To All
                            </Button>
                          )}
                          <span>£</span>
                          <Input
                            id={`${shift._id}-${day}`}
                            type="number"
                            step="0.01"
                            inputMode="decimal"
                            value={rate === 0 ? '' : rate}
                            onChange={(e) => {
                                const value = e.target.value;
                                // Allow empty input or numbers with up to 2 decimal places
                                if (value === "" || /^\d*\.?\d{0,2}$/.test(value)) {
                                  handleRateChange(
                                    shift._id,
                                    day,
                                    parseFloat(value) || 0
                                  );
                                }
                              }}
                              onFocus={(e) => {
                                if (parseFloat(e.target.value) === 0) {
                                  e.target.value = "";
                                }
                              }}
                            onBlur={() => saveRates(shift._id)}
                            onKeyDown={(e) =>
                              e.key === 'Enter' && saveRates(shift._id)
                            }
                            className="w-32"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">
              Please select at least one shift to manage rates
            </p>
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="shadow-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will remove the shift and all its associated rates.
              This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRemoveShift}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove Shift
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
