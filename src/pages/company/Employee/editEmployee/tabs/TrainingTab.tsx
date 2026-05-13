import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  Eye,
  Plus,
  CheckCircle,
  Clock,
  AlertCircle,
  AlertTriangle,
  Info
} from 'lucide-react';
import axiosInstance from '@/lib/axios';
import moment from '@/lib/moment-setup';
import ReactSelect from 'react-select';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { useSelector } from 'react-redux';
import { BlinkingDots } from '@/components/shared/blinking-dots';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';

// --- Types ---

type TrainingOption = {
  value: string;
  label: string;
  validityDays?: number;
};

type CompletionHistoryRecord = {
  _id: string;
  assignedDate?: string;
  expireDate?: string;
  completedAt?: string;
  certificate?: string[] | string;
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
    reminderBeforeDays?: number;
  };
  assignedDate: string | null;
  expireDate: string | null;
  status: 'pending' | 'in-progress' | 'completed' | 'expired';
  certificate?: string[] | string;
  completionHistory?: CompletionHistoryRecord[];
  isOptional?: boolean;
};

type FormDataState = {
  trainingId: string;
  assignedDate: string;
  expireDate: string;
  status: string;
  isOptional: boolean;
};

const TrainingTab: React.FC = () => {
  const navigate = useNavigate();
  const { id, eid: employeeId } = useParams();
  const { user } = useSelector((state: any) => state.auth);

  // State
  const [availableTrainings, setAvailableTrainings] = useState<
    TrainingOption[]
  >([]);
  const [employeeTrainings, setEmployeeTrainings] = useState<
    EmployeeTrainingRecord[]
  >([]);
  const [loading, setLoading] = useState(false);

  // Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Form State
  const [formData, setFormData] = useState<FormDataState>({
    trainingId: '',
    assignedDate: '',
    expireDate: '',
    status: 'pending',
    isOptional: false
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
          `/hr/training?companyId=${id}&limit=all`
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
  }, [id]);

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

  // Auto-calculate expiry date based on selection (only if not optional)
  useEffect(() => {
    if (formData.assignedDate && formData.trainingId && !formData.isOptional) {
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
    } else if (formData.isOptional) {
      // Clear expiry date when optional is checked
      setFormData((prev) => ({ ...prev, expireDate: '' }));
    }
  }, [
    formData.assignedDate,
    formData.trainingId,
    formData.isOptional,
    availableTrainings
  ]);

  const openDialog = () => {
    setFormData({
      trainingId: '',
      assignedDate: '',
      expireDate: '',
      status: 'pending',
      isOptional: false
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.trainingId || !formData.assignedDate) {
      toast.error('Training and Assigned Date are required');
      return;
    }

    try {
      const payload: any = {
        employeeId: employeeId,
        trainingId: formData.trainingId,
        assignedDate: formData.assignedDate,
        status: 'pending',
        updatedBy: user?._id,
        isOptional: formData.isOptional
      };

      // Only include expireDate if training is not optional
      if (!formData.isOptional && formData.expireDate) {
        payload.expireDate = formData.expireDate;
      }

      await axiosInstance.post('/employee-training', payload);
      toast.success('Training assigned successfully');

      setIsDialogOpen(false);
      fetchEmployeeData();
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Failed to save training');
    }
  };

  // --- 4. Helper: Get the latest completion history log ---
  // --- 6. Helper: Get display dates for records with null assignedDate/expireDate ---
  const getLatestCompletionLog = (record: EmployeeTrainingRecord) => {
    if (!record.completionHistory || record.completionHistory.length === 0) {
      return null;
    }

    return record.completionHistory[record.completionHistory.length - 1];
  };

  const getStatusDetails = (record: EmployeeTrainingRecord) => {
    const { status, expireDate, trainingId, assignedDate, isOptional } = record;

    // If assignedDate and expireDate are null, check completion history
    if (!assignedDate && !expireDate) {
      const latestLog = getLatestCompletionLog(record);
      if (latestLog) {
        return {
          label: 'Completed',
          className: 'bg-green-100 text-green-800 border-green-200',
          icon: <CheckCircle className="h-3 w-3" />
        };
      }
      // If no completion history, show as Pending
      return {
        label: 'Pending',
        className: 'bg-blue-100 text-blue-800 border-blue-200',
        icon: <Clock className="h-3 w-3" />
      };
    }

    // 1. Completed
    if (status === 'completed') {
      return {
        label: 'Completed',
        className: 'bg-green-100 text-green-800 border-green-200',
        icon: <CheckCircle className="h-3 w-3" />
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
        className: 'bg-red-100 text-red-800 border-red-200',
        icon: <AlertCircle className="h-3 w-3" />
      };
    }

    // 4. Expiring Soon (Between reminder date and expiry date)
    if (today.isSameOrAfter(reminderDate, 'day')) {
      return {
        label: 'Expiring Soon',
        className: 'bg-orange-100 text-orange-800 border-orange-200',
        icon: <AlertTriangle className="h-3 w-3" />
      };
    }

    // 5. In Progress
    return {
      label: 'In Progress',
      className: 'bg-blue-100 text-blue-800 border-blue-200',
      icon: <Clock className="h-3 w-3" />
    };
  };

  const getDisplayDates = (record: EmployeeTrainingRecord) => {
    if (!record.assignedDate && !record.expireDate) {
      const latestLog = getLatestCompletionLog(record);
      if (latestLog) {
        return {
          assignedDate: latestLog.assignedDate || null,
          expireDate: latestLog.expireDate || null
        };
      }
    }
    return {
      assignedDate: record.assignedDate,
      expireDate: record.expireDate
    };
  };

  // --- 7. Sort training records - Active/In Progress first, then Completed at bottom ---
  const sortedTrainings = [...employeeTrainings].sort((a, b) => {
    const statusInfoA = getStatusDetails(a);
    const statusInfoB = getStatusDetails(b);

    // Completed records go to the bottom
    if (statusInfoA.label === 'Completed' && statusInfoB.label !== 'Completed')
      return 1;
    if (statusInfoA.label !== 'Completed' && statusInfoB.label === 'Completed')
      return -1;

    // For non-completed records, sort by expireDate (ascending - closest expiry first)
    if (
      statusInfoA.label !== 'Completed' &&
      statusInfoB.label !== 'Completed'
    ) {
      const datesA = getDisplayDates(a);
      const datesB = getDisplayDates(b);

      if (datesA.expireDate && datesB.expireDate) {
        return (
          new Date(datesA.expireDate).getTime() -
          new Date(datesB.expireDate).getTime()
        );
      }
      if (datesA.expireDate) return -1;
      if (datesB.expireDate) return 1;
    }

    // For completed records, sort by completion date (most recent first)
    if (
      statusInfoA.label === 'Completed' &&
      statusInfoB.label === 'Completed'
    ) {
      const logA = getLatestCompletionLog(a);
      const logB = getLatestCompletionLog(b);
      const dateA = logA?.completedAt
        ? new Date(logA.completedAt).getTime()
        : 0;
      const dateB = logB?.completedAt
        ? new Date(logB.completedAt).getTime()
        : 0;
      return dateB - dateA;
    }

    return 0;
  });

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
            className="flex items-center gap-2 bg-theme text-white hover:bg-theme/90"
          >
            <Plus className="h-4 w-4" /> Assign Training
          </Button>
        </div>

        {/* Data Table */}
        <div className="overflow-hidden">
          <Table>
            <TableHeader>
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
              ) : sortedTrainings.length > 0 ? (
                sortedTrainings.map((t) => {
                  // Calculate status for this row
                  const statusInfo = getStatusDetails(t);
                  const displayDates = getDisplayDates(t);

                  return (
                    <TableRow key={t._id} className="hover:bg-gray-50/50">
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {t.trainingId?.name || 'Unknown Training'}
                        </div>
                      </TableCell>
                      <TableCell>
                        {displayDates.assignedDate
                          ? moment(displayDates.assignedDate).format(
                              'DD MMM YYYY'
                            )
                          : '-'}
                      </TableCell>
                      <TableCell>
                        {displayDates.expireDate
                          ? moment(displayDates.expireDate).format(
                              'DD MMM YYYY'
                            )
                          : '-'}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusInfo.className}`}
                        >
                          {statusInfo.icon}
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
                  <Label>Expiry Date</Label>
                  <Input
                    disabled
                    value={
                      formData.isOptional
                        ? 'Not Applicable'
                        : formData.expireDate
                          ? moment(formData.expireDate).format('DD/MM/YYYY')
                          : ''
                    }
                    placeholder={
                      formData.isOptional
                        ? 'No expiry required'
                        : 'Auto-calculated'
                    }
                    className={`h-10 ${formData.isOptional ? 'bg-gray-50 text-gray-400' : 'bg-gray-100 text-gray-800'}`}
                  />
                </div>
              </div>

              {/* Optional Training Checkbox */}
              <div className="flex items-start space-x-3 rounded-lg border border-gray-200 bg-gray-50/50 p-4">
                <Checkbox
                  id="isOptional"
                  checked={formData.isOptional}
                  onCheckedChange={(checked) => {
                    setFormData((prev) => ({
                      ...prev,
                      isOptional: checked === true,
                      expireDate: checked === true ? '' : prev.expireDate
                    }));
                  }}
                  className="mt-1"
                />
                <div className="grid gap-1.5 leading-none">
                  <div className="flex items-center gap-2">
                    <Label
                      htmlFor="isOptional"
                      className="cursor-pointer text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Expiry Date Is Optional
                    </Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-4 w-4 cursor-help text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs">
                            Enable this option if the training does not require
                            an expiration date. The expiry field will be
                            excluded from the assignment.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <p className="text-xs text-gray-500">
                    When enabled, this training will not have an expiration
                    date.
                  </p>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={!formData.assignedDate}
                className="bg-theme text-white hover:bg-theme/90"
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
