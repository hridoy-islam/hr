import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Eye, Plus } from 'lucide-react';
import axiosInstance from '@/lib/axios';
import moment from 'moment';
import ReactSelect from 'react-select';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { useSelector } from 'react-redux';
import { BlinkingDots } from '@/components/shared/blinking-dots';

// --- Types ---

type TrainingOption = {
  value: string;
  label: string;
  validityDays?: number;
};

type EmployeeTrainingRecord = {
  _id: string;
  employeeId: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  trainingId: {
    _id: string;
    name: string;
    description?: string;
    validityDays?: number;
    reminderBeforeDays?: number; // Added this field
  };
  assignedDate: string;
  expireDate: string;
  status: 'pending' | 'in-progress' | 'completed' | 'expired';
  certificate?: string;
};

const TrainingTab: React.FC = () => {
  const navigate = useNavigate();
  const { id: employeeId } = useParams();
  const { user } = useSelector((state: any) => state.auth);

  // State
  const [availableTrainings, setAvailableTrainings] = useState<TrainingOption[]>([]);
  const [employeeTrainings, setEmployeeTrainings] = useState<EmployeeTrainingRecord[]>([]);
  const [loading, setLoading] = useState(false);

  // Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    trainingId: '',
    assignedDate: '',
    expireDate: '',
    status: 'pending'
  });

  // DatePicker Open States
  const [dateOpenState, setDateOpenState] = useState({
    assigned: false
  });

  // --- 1. Fetch Data ---

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const res = await axiosInstance.get(
          `/hr/training?companyId=${user?._id}&limit=all`
        );
        const options = res.data.data.result.map((t: any) => ({
          value: t._id,
          label: t.name,
          validityDays: t.validityDays
        }));
        setAvailableTrainings(options);
      } catch (error) {
        console.error('Error fetching training options:', error);
      }
    };
    fetchOptions();
  }, [user?._id]);

  const fetchEmployeeData = async () => {
    if (!employeeId) return;
    setLoading(true);
    try {
      const res = await axiosInstance.get(
        `/employee-training?employeeId=${employeeId}&limit=all`
      );
      setEmployeeTrainings(res.data.data.result || []);
    } catch (error) {
      console.error('Error fetching employee training:', error);
      toast.error('Failed to load training records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployeeData();
  }, [employeeId]);

  // --- 2. Logic: Filter out already assigned trainings ---
  const unassignedTrainings = availableTrainings.filter((option) => {
    const isAssigned = employeeTrainings.some(
      (record) => record.trainingId._id === option.value
    );
    return !isAssigned;
  });

  // --- 3. Handlers ---

  // Auto-calculate expiry date based on selection
  useEffect(() => {
    if (formData.assignedDate && formData.trainingId) {
      const selectedTraining = availableTrainings.find(
        (t) => t.value === formData.trainingId
      );
      if (selectedTraining && selectedTraining.validityDays) {
        const expiry = moment(formData.assignedDate)
          .add(selectedTraining.validityDays, 'days')
          .format('YYYY-MM-DD');
        setFormData((prev) => ({ ...prev, expireDate: expiry }));
      } else {
        setFormData((prev) => ({ ...prev, expireDate: '' }));
      }
    }
  }, [formData.assignedDate, formData.trainingId, availableTrainings]);

  const openDialog = () => {
    setFormData({
      trainingId: '',
      assignedDate: '',
      expireDate: '',
      status: 'pending'
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.trainingId || !formData.assignedDate) {
      toast.error('Training and Assigned Date are required');
      return;
    }

    try {
      const payload = {
        employeeId: employeeId,
        trainingId: formData.trainingId,
        assignedDate: formData.assignedDate,
        expireDate: formData.expireDate,
        status: 'pending',
        updatedBy: user?._id
      };

      await axiosInstance.post('/employee-training', payload);
      toast.success('Training assigned successfully');

      setIsDialogOpen(false);
      fetchEmployeeData();
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Failed to save training');
    }
  };

  // --- 4. Helper: Calculate Status Badge Logic ---
  const getStatusDetails = (record: EmployeeTrainingRecord) => {
    const { status, expireDate, trainingId } = record;

    // 1. Completed
    if (status === 'completed') {
      return { 
        label: 'Completed', 
        className: 'bg-green-100 text-green-800 border-green-200' 
      };
    }

    // 2. Pending (No Expiry set yet or explicitly pending)
    if (!expireDate) {
      return { 
        label: 'Pending', 
        className: 'bg-blue-100 text-blue-800 border-blue-200' 
      };
    }

    const today = moment();
    const expiry = moment(expireDate);
    // Use training specific reminder days or default to 30
    const reminderDays = trainingId?.reminderBeforeDays || 30; 
    const reminderDate = moment(expireDate).subtract(reminderDays, 'days');

    // 3. Expired
    if (today.isAfter(expiry, 'day')) {
      return { 
        label: 'Expired', 
        className: 'bg-red-100 text-red-800 border-red-200' 
      };
    }

    // 4. Expiring Soon (Between reminder date and expiry date)
    if (today.isSameOrAfter(reminderDate, 'day')) {
      return { 
        label: 'Expiring Soon', 
        className: 'bg-orange-100 text-orange-800 border-orange-200' 
      };
    }

    // 5. Active
    return { 
      label: 'Active', 
      className: 'bg-blue-100 text-blue-800 border-blue-200' 
    };
  };

  return (
    <Card className="w-full shadow-sm">
      <CardContent className="pt-6">
        {/* Header Actions */}
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-700">
            Training Records
          </h3>
          <Button
            type="button"
            size="sm"
            onClick={openDialog}
            className="bg-theme hover:bg-theme/90 flex items-center gap-2 text-white"
          >
            <Plus className="h-4 w-4" /> Assign Training
          </Button>
        </div>

        {/* Data Table */}
        <div className="overflow-hidden ">
          <Table>
            <TableHeader className="">
              <TableRow>
                <TableHead>Training Name</TableHead>
                <TableHead>Assigned Date</TableHead>
                <TableHead>Expiry Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    <BlinkingDots size="large" color="bg-theme" />
                  </TableCell>
                </TableRow>
              ) : employeeTrainings.length > 0 ? (
                employeeTrainings.map((t) => {
                  // Calculate status for this row
                  const statusInfo = getStatusDetails(t);

                  return (
                    <TableRow key={t._id} className="hover:bg-gray-50/50">
                      <TableCell className="font-medium">
                        {t.trainingId?.name || 'Unknown Training'}
                      </TableCell>
                      <TableCell>
                        {t.assignedDate
                          ? moment(t.assignedDate).format('DD MMM YYYY')
                          : '-'}
                      </TableCell>
                      <TableCell>
                        {t.expireDate
                          ? moment(t.expireDate).format('DD MMM YYYY')
                          : '-'}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border ${statusInfo.className}`}
                        >
                          {statusInfo.label}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          onClick={() => navigate(`training-details/${t._id}`)}
                        >
                          <Eye className="mr-1 h-4 w-4" /> View
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="h-32 text-center italic text-gray-500"
                  >
                    No training records found for this employee.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* --- Assign Dialog --- */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="bg-white sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Assign New Training</DialogTitle>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              {/* Training Selector */}
              <div className="grid gap-2">
                <Label htmlFor="training">Select Training Course</Label>
                <ReactSelect
                  id="training"
                  options={unassignedTrainings}
                  value={
                    availableTrainings.find(
                      (op) => op.value === formData.trainingId
                    ) || null
                  }
                  onChange={(opt) =>
                    setFormData((prev) => ({
                      ...prev,
                      trainingId: opt?.value || ''
                    }))
                  }
                  placeholder="Search training..."
                  noOptionsMessage={() => 'No new trainings available'}
                  className="text-sm"
                />
              </div>

              {/* Assigned Date */}
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Assigned Date</Label>
                  <DatePicker
                    selected={
                      formData.assignedDate
                        ? moment(formData.assignedDate).toDate()
                        : null
                    }
                    onChange={(date) => {
                      setFormData((prev) => ({
                        ...prev,
                        assignedDate: date
                          ? moment(date).format('YYYY-MM-DD')
                          : ''
                      }));
                      setDateOpenState((p) => ({ ...p, assigned: false }));
                    }}
                    dateFormat="dd/MM/yyyy"
                    className="h-10 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-offset-2"
                    placeholderText="DD/MM/YYYY"
                    open={dateOpenState.assigned}
                    onInputClick={() =>
                      setDateOpenState((p) => ({ ...p, assigned: true }))
                    }
                    onClickOutside={() =>
                      setDateOpenState((p) => ({ ...p, assigned: false }))
                    }
                  />
                </div>

                {/* Expiry Date - Read Only / Auto Calculated */}
                <div className="grid gap-2">
                  <Label>Expiry/Due Date</Label>
                  <Input
                    disabled
                    value={
                      formData.expireDate
                        ? moment(formData.expireDate).format('DD/MM/YYYY')
                        : ''
                    }
                    placeholder="Auto-calculated"
                    className="h-10 bg-gray-100 text-gray-800"
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                className="bg-theme hover:bg-theme/90 text-white"
              >
                Assign Training
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default TrainingTab;