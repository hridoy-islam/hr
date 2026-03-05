import React, { useEffect, useMemo, useState } from 'react';
import axiosInstance from '@/lib/axios';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import Select from 'react-select';
import { Trash } from 'lucide-react';
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

const daysOfWeek = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday'
];

function EmployeeForm() {
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const userId = location.state?.user?._id || '';
  const { id } = useParams();

  // --- State: General ---
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  // --- State: Step 1 & 2 (Arrays for Multi-selection) ---
  const [designations, setDesignations] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedDepartments, setSelectedDepartments] = useState([]); // Changed to array []
  const [selectedDesignations, setSelectedDesignations] = useState([]); // Changed to array []

  // --- State: Step 3 (Rates) ---
  const [shifts, setShifts] = useState([]);
  const [selectedShifts, setSelectedShifts] = useState([]);
  const [employeeRates, setEmployeeRates] = useState({});
  const [savingRates, setSavingRates] = useState({});
  const [shiftToRemove, setShiftToRemove] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const fetchData = async () => {
    try {
      const [designationRes, departmentRes, shiftsRes, ratesRes] =
        await Promise.all([
          axiosInstance(`/hr/designation?companyId=${id}&limit=all`),
          axiosInstance(`/hr/department?companyId=${id}&limit=all`),
          axiosInstance(`/hr/shift?companyId=${id}&limit=all`),
          axiosInstance(`/hr/employeeRate?companyId=${id}&limit=all`)
        ]);

      setDesignations(
        designationRes.data.data.result.map((item) => ({
          value: item._id,
          label: item.title
        }))
      );
setDepartments(departmentRes.data.data.result || []);
      const allShifts = shiftsRes.data.data?.result || [];
      setShifts(allShifts);

      const ratesData = ratesRes.data.data?.result || [];
      const ratesMap = {};
      const preSelectedShifts = [];

      ratesData.forEach((rate) => {
        const shiftObj = rate.shiftId[0];
        const shiftId = shiftObj?._id || shiftObj;
        const fullShift = allShifts.find((s) => s._id === shiftId);

        if (fullShift && shiftId) {
          ratesMap[shiftId] = { id: rate._id, rates: rate.rates };
          preSelectedShifts.push(fullShift);
        }
      });

      setEmployeeRates(ratesMap);
      setSelectedShifts(preSelectedShifts);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };


 const departmentOptions = useMemo(() => {
   const options = [];
   const selectedIds = selectedDepartments.map((d) => d.value);

   // 1. Identify Root Departments
   const roots = departments.filter((d) => !d.parentDepartmentId);

   roots.forEach((root) => {
     const allChildrenOfThisRoot = departments.filter(
       (child) =>
         (child.parentDepartmentId?._id || child.parentDepartmentId) ===
         root._id
     );

     // Filter out children that are already selected
     const availableChildren = allChildrenOfThisRoot.filter(
       (child) => !selectedIds.includes(child._id)
     );

     const isParentAlreadySelected = selectedIds.includes(root._id);

     // Only show the parent if it's unselected OR it has unselected children
     if (!isParentAlreadySelected || availableChildren.length > 0) {
       options.push({
         value: root._id,
         label: root.departmentName,
         isChild: false,
         isDisabled: isParentAlreadySelected, // Disables it if already added
         isHeader: isParentAlreadySelected // Custom flag for styling
       });

       // Add the unselected children under it
       availableChildren.forEach((child) => {
         options.push({
           value: child._id,
           label: child.departmentName,
           isChild: true
         });
       });
     }
   });

   return options;
 }, [departments, selectedDepartments]);

  useEffect(() => {
    fetchData();
  }, []);

  const handleFinish = () => {
    toast({
      title: 'Employee Created Successfully',
      className: 'bg-theme text-white border-none'
    });
    navigate(`/company/${id}/employee`);
  };

  // --- Handlers: Step 1 & 2 (Updated for Arrays) ---
  const handleUpdateUser = async () => {
    try {
      setSubmitting(true);
      const payload: any = {};

      // Map array of objects back to array of IDs for the backend
      if (selectedDepartments.length > 0) {
        payload.departmentId = selectedDepartments.map((d) => d.value);
      }
      if (selectedDesignations.length > 0) {
        payload.designationId = selectedDesignations.map((d) => d.value);
      }

      if (Object.keys(payload).length > 0) {
        await axiosInstance.patch(`/users/${userId}`, payload);
      }
      setStep(3);
    } catch (error: any) {
      toast({
        title: error?.response?.data?.message || 'Failed to update user',
        variant: 'destructive'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSkipStep = () => {
    if (step < 3) setStep(step + 1);
    else handleFinish();
  };

  // --- Handlers: Step 3 (Unchanged) ---
  const handleAddShift = async (shift) => {
    if (selectedShifts.some((s) => s._id === shift._id)) return;
    try {
      setSavingRates((prev) => ({ ...prev, [shift._id]: true }));
      const defaultRates = daysOfWeek.reduce((acc, day) => {
        acc[day] = { rate: 0 };
        return acc;
      }, {});
      const response = await axiosInstance.post('/hr/employeeRate', {
        shiftId: [shift._id],
        employeeId: userId,
        rates: defaultRates
      });
      setEmployeeRates((prev) => ({
        ...prev,
        [shift._id]: { id: response.data.data._id, rates: defaultRates }
      }));
      setSelectedShifts((prev) => [...prev, shift]);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to add shift',
        variant: 'destructive'
      });
    } finally {
      setSavingRates((prev) => ({ ...prev, [shift._id]: false }));
    }
  };

  const handleShiftSelectChange = async (selectedOptions) => {
    const newSelected = selectedOptions || [];
    const currentIds = selectedShifts.map((s) => s._id);
    const toAdd = newSelected.filter((s) => !currentIds.includes(s.value));
    for (const option of toAdd) {
      const fullShift = shifts.find((s) => s._id === option.value);
      if (fullShift) await handleAddShift(fullShift);
    }
  };

  const confirmRemoveShift = async () => {
    if (!shiftToRemove) return;
    const rateId = employeeRates[shiftToRemove]?.id;
    if (!rateId) return;
    try {
      await axiosInstance.delete(`/hr/employeeRate/${rateId}`);
      setSelectedShifts((prev) => prev.filter((s) => s._id !== shiftToRemove));
      setEmployeeRates((prev) => {
        const newRates = { ...prev };
        delete newRates[shiftToRemove];
        return newRates;
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to remove shift',
        variant: 'destructive'
      });
    } finally {
      setShiftToRemove(null);
      setShowDeleteDialog(false);
    }
  };

  const handleRateInputChange = (shiftId, day, value) => {
    setEmployeeRates((prev) => ({
      ...prev,
      [shiftId]: {
        ...prev[shiftId],
        rates: { ...prev[shiftId]?.rates, [day]: { rate: value } }
      }
    }));
  };

  const saveIndividualRate = async (shiftId) => {
    const rateData = employeeRates[shiftId];
    if (!rateData) return;
    try {
      await axiosInstance.patch(`/hr/employeeRate/${rateData.id}`, {
        shiftId: [shiftId],
        employeeId: userId,
        rates: rateData.rates
      });
    } catch (error) {
      console.error('Error saving rates:', error);
    }
  };

  const copyMondayRateToAll = (shiftId) => {
    const mondayRate = employeeRates[shiftId]?.rates['Monday']?.rate || 0;
    const updatedRates = { ...employeeRates };
    daysOfWeek.forEach((day) => {
      if (day !== 'Monday')
        updatedRates[shiftId].rates[day] = { rate: mondayRate };
    });
    setEmployeeRates(updatedRates);
    saveIndividualRate(shiftId);
  };

  const customStyles = {
    control: (provided, state) => ({
      ...provided,
      minHeight: '60px',
      fontSize: '1.1rem',
      borderRadius: '0.5rem',
      borderColor: state.isFocused ? '#000' : '#e2e8f0',
      boxShadow: state.isFocused ? '0 0 0 1px #000' : 'none',
      paddingLeft: '10px'
    }),
    multiValue: (provided) => ({
      ...provided,
      backgroundColor: '#f1f5f9',
      borderRadius: '4px'
    }),
    multiValueLabel: (provided) => ({
      ...provided,
      color: '#1e293b',
      fontWeight: '500'
    })
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-10">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold text-gray-900">
                Department Assignment
              </h2>
              <p className="text-lg ">
                Which departments does this employee belong to?
              </p>
            </div>
            <div className="py-4">
              <Select
                isMulti
                options={departmentOptions}
                value={selectedDepartments}
                onChange={setSelectedDepartments}
                placeholder="Select Departments..."
                // FIX: Prevent react-select from hiding the parent automatically!
                hideSelectedOptions={false}
                isOptionDisabled={(option) => option.isDisabled}
                styles={{
                  ...customStyles,
                  option: (base, state) => ({
                    ...base,
                    backgroundColor: state.isDisabled
                      ? 'transparent'
                      : base.backgroundColor,
                    cursor: state.isDisabled ? 'default' : 'pointer'
                  })
                }}
                className="w-full"
                formatOptionLabel={(option) => {
                  if (option.isChild) {
                    return (
                      <div className="ml-6 flex items-center gap-2 ">
                        <span className="">└─</span>
                        <span>{option.label}</span>
                      </div>
                    );
                  }
                  // Style for the Parent Header
                  return (
                    <div
                      className={` ${
                        option.isHeader
                          ? 'text-xs uppercase tracking-wider '
                          : 'text-gray-900'
                      }`}
                    >
                      {option.label} {option.isHeader && '(Already Added)'}
                    </div>
                  );
                }}
              />
            </div>
            <div className="flex justify-end gap-4 pt-4">
              <Button variant="outline" onClick={handleSkipStep} size="lg">
                Skip
              </Button>
              <Button onClick={() => setStep(2)} size="lg">
                Next Step
              </Button>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-10">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold text-gray-900">
                Job Designation
              </h2>
              <p className="text-lg ">
                What are the employee's specific roles?
              </p>
            </div>
            <div className="py-4">
              <Select
                isMulti // Added Multi support
                options={designations}
                value={selectedDesignations}
                onChange={setSelectedDesignations}
                placeholder="Select Designations..."
                styles={customStyles}
                className="w-full"
              />
            </div>
            <div className="flex justify-end gap-4 pt-4">
              <Button variant="outline" onClick={handleSkipStep} size="lg">
                Skip
              </Button>
              <Button
                onClick={handleUpdateUser}
                disabled={submitting}
                size="lg"
              >
                {submitting ? 'Saving...' : 'Next Step'}
              </Button>
            </div>
          </div>
        );

      case 3:
        return (
          /* ... Rate logic remains the same ... */
          <div className="space-y-8">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold text-gray-900">Pay Rates</h2>
              <p className="text-lg ">Select shifts and assign hourly rates.</p>
            </div>
            <div className="space-y-2">
              <Label className="text-md font-semibold">Add Shifts</Label>
              <Select
                isMulti
                options={shifts.map((s) => ({
                  value: s._id,
                  label: `${s.name} (${s.startTime} - ${s.endTime})`,
                  ...s
                }))}
                value={selectedShifts.map((s) => ({
                  value: s._id,
                  label: `${s.name} (${s.startTime} - ${s.endTime})`,
                  ...s
                }))}
                onChange={handleShiftSelectChange}
                placeholder="Select shifts to add..."
                styles={{
                  ...customStyles,
                  control: (provided, state) => ({
                    ...customStyles.control(provided, state),
                    minHeight: '50px',
                    fontSize: '1rem'
                  })
                }}
                className="w-full"
                components={{ MultiValue: () => null }}
              />
            </div>
            <div className="grid grid-cols-1 gap-6">
              {selectedShifts.map((shift) => (
                <Card key={shift._id} className="border-gray-200 shadow-sm">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-xl">{shift.name}</CardTitle>
                        <CardDescription>
                          {shift.startTime} - {shift.endTime}
                        </CardDescription>
                      </div>
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => {
                          setShiftToRemove(shift._id);
                          setShowDeleteDialog(true);
                        }}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                      {daysOfWeek.map((day) => {
                        const rate =
                          employeeRates[shift._id]?.rates[day]?.rate || 0;
                        return (
                          <div key={day} className="flex flex-col gap-1.5">
                            <div className="flex items-center justify-between">
                              <Label className="text-sm font-medium text-gray-600">
                                {day}
                              </Label>
                              {day === 'Monday' && (
                                <span
                                  onClick={() => copyMondayRateToAll(shift._id)}
                                  className="cursor-pointer text-[10px] text-blue-600 hover:underline"
                                >
                                  Copy All
                                </span>
                              )}
                            </div>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                                £
                              </span>
                              <Input
                                type="number"
                                className="h-10 pl-7"
                                value={rate === 0 ? '' : rate}
                                onChange={(e) =>
                                  handleRateInputChange(
                                    shift._id,
                                    day,
                                    parseFloat(e.target.value) || 0
                                  )
                                }
                                onBlur={() => saveIndividualRate(shift._id)}
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
            <div className="flex justify-end gap-4 pt-4">
              <Button variant="outline" onClick={handleSkipStep} size="lg">
                Skip
              </Button>
              <Button onClick={handleFinish} size="lg">
                Finish Setup
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-100px)] w-full flex-col items-center justify-center bg-gray-50/50 px-4 py-8">
      <Card
        className={`w-full ${step === 3 ? 'max-w-5xl' : 'max-w-3xl'} rounded-xl border border-gray-100 bg-white p-10 shadow-xl transition-all duration-300`}
      >
        {renderStep()}
        <div className="mt-8 flex justify-center gap-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className={`h-2 w-2 rounded-full transition-all ${step === i ? 'w-8 bg-black' : 'bg-gray-300'}`}
            />
          ))}
        </div>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Shift?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the shift and all associated pay rates.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRemoveShift}
              className="bg-destructive hover:bg-destructive/90"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default EmployeeForm;
