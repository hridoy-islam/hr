import React, { useEffect, useState } from 'react';
import axiosInstance from '@/lib/axios';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useLocation, useNavigate } from 'react-router-dom';
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
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
];

function EmployeeForm() {
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const userId = location.state?.user?._id || '';

  // --- State: General ---
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  // --- State: Step 1 & 2 (Dept/Designation) ---
  const [designations, setDesignations] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [selectedDesignation, setSelectedDesignation] = useState(null);

  // --- State: Step 3 (Rates) ---
  const [shifts, setShifts] = useState([]);
  const [selectedShifts, setSelectedShifts] = useState([]);
  const [employeeRates, setEmployeeRates] = useState({});
  const [savingRates, setSavingRates] = useState({});
  const [shiftToRemove, setShiftToRemove] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // --- Fetch All Initial Data ---
  const fetchData = async () => {
    try {
      const [designationRes, departmentRes, shiftsRes, ratesRes] = await Promise.all([
        axiosInstance('/hr/designation'),
        axiosInstance('/hr/department'),
        axiosInstance('/hr/shift'),
        axiosInstance(`/hr/employeeRate?employeeId=${userId}`)
      ]);

      // 1. Setup Designations & Departments for React Select
      setDesignations(designationRes.data.data.result.map(item => ({ value: item._id, label: item.title })));
      setDepartments(departmentRes.data.data.result.map(item => ({ value: item._id, label: item.departmentName })));

      // 2. Setup Shifts
      const allShifts = shiftsRes.data.data?.result || [];
      setShifts(allShifts);

      // 3. Setup Existing Rates (if any)
      const ratesData = ratesRes.data.data?.result || [];
      const ratesMap = {};
      const preSelectedShifts = [];

      ratesData.forEach((rate) => {
        const shiftObj = rate.shiftId[0]; // Assuming populated or array
        const shiftId = shiftObj?._id || shiftObj; // Handle population variation
        const fullShift = allShifts.find(s => s._id === shiftId);

        if (fullShift && shiftId) {
          ratesMap[shiftId] = {
            id: rate._id,
            rates: rate.rates
          };
          preSelectedShifts.push(fullShift);
        }
      });

      setEmployeeRates(ratesMap);
      setSelectedShifts(preSelectedShifts);

    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- FINALIZATION HANDLER ---
  const handleFinish = () => {
    toast({ 
      title: 'Employee Created Successfully',
      className: 'bg-supperagent text-white border-none' // Optional styling
    });
    navigate('/company/employee');
  };

  // --- Handlers: Step 1 & 2 ---
  const handleUpdateUser = async () => {
    try {
      setSubmitting(true);
      const payload = {};
      if (selectedDepartment) payload.departmentId = selectedDepartment.value;
      if (selectedDesignation) payload.designationId = selectedDesignation.value;

      if (Object.keys(payload).length > 0) {
        await axiosInstance.patch(`/users/${userId}`, payload);
        // toast({ title: 'User details updated successfully' });
      }
      // Move to next step instead of navigating away immediately
      setStep(3);
    } catch (error) {
      console.error('Failed to update user:', error);
      toast({ title: error?.response?.data?.message || 'Failed to update user', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSkipStep = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      // If skipping the last step, we finish the process
      handleFinish();
    }
  };

  // --- Handlers: Step 3 (Rates) ---

  const handleAddShift = async (shift) => {
    if (selectedShifts.some((s) => s._id === shift._id)) return;

    try {
      setSavingRates((prev) => ({ ...prev, [shift._id]: true }));

      // Default empty rates
      const defaultRates = daysOfWeek.reduce((acc, day) => {
        acc[day] = { rate: 0 };
        return acc;
      }, {});

      // Create new rate entry in DB immediately
      const response = await axiosInstance.post('/hr/employeeRate', {
        shiftId: [shift._id],
        employeeId: userId,
        rates: defaultRates
      });

      setEmployeeRates((prev) => ({
        ...prev,
        [shift._id]: {
          id: response.data.data._id,
          rates: defaultRates
        }
      }));
      setSelectedShifts((prev) => [...prev, shift]);

      // toast({ title: 'Success', description: `Added ${shift.name} shift` });
    } catch (error) {
      console.error('Error adding shift:', error);
      toast({ title: 'Error', description: 'Failed to add shift', variant: 'destructive' });
    } finally {
      setSavingRates((prev) => ({ ...prev, [shift._id]: false }));
    }
  };

  const handleShiftSelectChange = async (selectedOptions) => {
    const newSelected = selectedOptions || [];
    const currentIds = selectedShifts.map((s) => s._id);
    
    // Determine which ones are new additions
    const toAdd = newSelected.filter((s) => !currentIds.includes(s.value)); 

    for (const option of toAdd) {
       const fullShift = shifts.find(s => s._id === option.value);
       if(fullShift) await handleAddShift(fullShift);
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
      // toast({ title: 'Success', description: 'Shift removed' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to remove shift', variant: 'destructive' });
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
        rates: {
          ...prev[shiftId]?.rates,
          [day]: { rate: value }
        }
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
      if (day !== 'Monday') {
        updatedRates[shiftId].rates[day] = { rate: mondayRate };
      }
    });
    setEmployeeRates(updatedRates);
    saveIndividualRate(shiftId);
  };

  // --- Styles ---
  const customStyles = {
    control: (provided, state) => ({
      ...provided,
      minHeight: '60px',
      fontSize: '1.25rem',
      borderRadius: '0.5rem',
      borderColor: state.isFocused ? '#000' : '#e2e8f0',
      boxShadow: state.isFocused ? '0 0 0 1px #000' : 'none',
      paddingLeft: '10px'
    }),
    menu: (provided) => ({ ...provided, fontSize: '1.1rem' }),
    option: (provided) => ({ ...provided, padding: '15px 20px' }),
    placeholder: (provided) => ({ ...provided, fontSize: '1.25rem', color: '#94a3b8' }),
    singleValue: (provided) => ({ ...provided, fontSize: '1.25rem', fontWeight: '500' })
  };

  // --- Render Steps ---
  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-10">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold text-gray-900">Department Assignment</h2>
              <p className="text-lg text-gray-500">Which department does this employee belong to?</p>
            </div>
            <div className="py-4">
              <Select
                options={departments}
                value={selectedDepartment}
                onChange={setSelectedDepartment}
                placeholder="Select Department..."
                styles={customStyles}
                className="w-full"
                isClearable
              />
            </div>
            <div className="flex justify-end gap-4 pt-4">
              <Button variant="outline" onClick={handleSkipStep} size="lg" className="text-lg px-8 py-6">Skip</Button>
              <Button onClick={() => setStep(2)} size="lg" className="text-lg px-8 py-6">Next Step</Button>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-10">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold text-gray-900">Job Designation</h2>
              <p className="text-lg text-gray-500">What is the employee's specific role?</p>
            </div>
            <div className="py-4">
              <Select
                options={designations}
                value={selectedDesignation}
                onChange={setSelectedDesignation}
                placeholder="Select Designation..."
                styles={customStyles}
                className="w-full"
                isClearable
              />
            </div>
            <div className="flex justify-end gap-4 pt-4">
              <Button variant="outline" onClick={handleSkipStep} size="lg" className="text-lg px-8 py-6">Skip</Button>
              <Button onClick={handleUpdateUser} disabled={submitting} size="lg" className="text-lg px-8 py-6">
                {submitting ? 'Saving...' : 'Next Step'}
              </Button>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-8">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold text-gray-900">Pay Rates</h2>
              <p className="text-lg text-gray-500">Select shifts and assign hourly rates.</p>
            </div>

            {/* Shift Selection */}
            <div className="space-y-2">
              <Label className="text-md font-semibold">Add Shifts</Label>
              <Select
                isMulti
                options={shifts.map((s) => ({ value: s._id, label: `${s.name} (${s.startTime} - ${s.endTime})`, ...s }))}
                value={selectedShifts.map((s) => ({ value: s._id, label: `${s.name} (${s.startTime} - ${s.endTime})`, ...s }))}
                onChange={handleShiftSelectChange}
                placeholder="Select shifts to add..."
                styles={{...customStyles, control: (provided, state) => ({...customStyles.control(provided, state), minHeight: '50px', fontSize: '1rem'})}}
                className="w-full"
                closeMenuOnSelect={true}
                hideSelectedOptions={true}
                components={{ MultiValue: () => null }}
              />
            </div>

            {/* Shift Cards */}
            <div className="grid grid-cols-1 gap-6">
              {selectedShifts.map((shift) => (
                <Card key={shift._id} className="border-gray-200 shadow-sm">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-xl">{shift.name}</CardTitle>
                        <CardDescription>{shift.startTime} - {shift.endTime}</CardDescription>
                      </div>
                      <Button variant="destructive" size="icon" onClick={() => { setShiftToRemove(shift._id); setShowDeleteDialog(true); }}>
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                      {daysOfWeek.map((day) => {
                        const rate = employeeRates[shift._id]?.rates[day]?.rate || 0;
                        return (
                          <div key={day} className="flex flex-col gap-1.5">
                            <div className="flex items-center justify-between">
                                <Label htmlFor={`${shift._id}-${day}`} className="text-sm font-medium text-gray-600">{day}</Label>
                                {day === 'Monday' && (
                                    <span onClick={() => copyMondayRateToAll(shift._id)} className="text-[10px] text-blue-600 cursor-pointer hover:underline">Copy All</span>
                                )}
                            </div>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">£</span>
                              <Input
                                id={`${shift._id}-${day}`}
                                type="number"
                                step="0.01"
                                className="pl-7 h-10"
                                value={rate === 0 ? '' : rate}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  if (val === "" || /^\d*\.?\d{0,2}$/.test(val)) {
                                    handleRateInputChange(shift._id, day, parseFloat(val) || 0);
                                  }
                                }}
                                onFocus={(e) => { if (parseFloat(e.target.value) === 0) e.target.value = ""; }}
                                onBlur={() => saveIndividualRate(shift._id)}
                                onKeyDown={(e) => e.key === 'Enter' && saveIndividualRate(shift._id)}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              ))}
              {selectedShifts.length === 0 && (
                <div className="text-center py-8 text-gray-500 border-2 border-dashed rounded-lg">
                  No shifts selected. Use the dropdown above to add shifts.
                </div>
              )}
            </div>

            <div className="flex justify-end gap-4 pt-4">
              <Button variant="outline" onClick={handleSkipStep} size="lg" className="text-lg px-8 py-6">Skip</Button>
              <Button onClick={handleFinish} size="lg" className="text-lg px-8 py-6">Finish Setup</Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-100px)] w-full flex-col items-center justify-center bg-gray-50/50 px-4 py-8">
      {/* Increased max-width for Step 3 cards */}
      <Card className={`w-full ${step === 3 ? 'max-w-5xl' : 'max-w-3xl'} rounded-xl bg-white p-10 shadow-xl border border-gray-100 transition-all duration-300`}>
        
        {renderStep()}

        {/* Step Indicator */}
        <div className="mt-8 flex justify-center gap-2">
          {[1, 2, 3].map((i) => (
             <div key={i} className={`h-2 w-2 rounded-full transition-all ${step === i ? 'bg-black w-8' : 'bg-gray-300'}`} />
          ))}
        </div>
      </Card>

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Shift?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the shift and all associated pay rates for this employee.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRemoveShift} className="bg-destructive hover:bg-destructive/90">Remove</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default EmployeeForm;