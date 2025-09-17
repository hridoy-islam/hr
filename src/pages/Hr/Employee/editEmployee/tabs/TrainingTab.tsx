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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Trash2, Pencil } from 'lucide-react';
import axiosInstance from '@/lib/axios';
import moment from 'moment';
import ReactSelect from 'react-select';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

// Types
type TrainingOption = {
  value: string;
  label: string;
  validityDays?: number;
};

type LocalTraining = {
  _id?: string;
  trainingId: string;
  trainingName: string;
  assignedDate: string; // YYYY-MM-DD
  expireDate?: string | null;
  status: 'inProgress' | 'completed' | 'expired';
  completedAt?: string; // optional date
  certificate?: File | null;
};

const TrainingTab = ({ formData, onUpdate, isFieldSaving }) => {
  const [trainings, setTrainings] = useState<
    Array<{ _id: string; name: string; validityDays?: number }>
  >([]);
  const [localTrainings, setLocalTrainings] = useState<LocalTraining[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [dialogData, setDialogData] = useState<Partial<LocalTraining>>({
    trainingId: '',
    assignedDate: '',
    status: 'inProgress',
    certificate: null
  });

  // Fetch available trainings
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axiosInstance('/hr/training');
        setTrainings(res.data.data.result || []);
      } catch (error) {
        console.error('Error fetching trainings:', error);
      }
    };
    fetchData();
  }, []);

  // Map formData.training to localTrainings
  useEffect(() => {
    if (formData.training && Array.isArray(formData.training)) {
      const mapped = formData.training.map((t) => {
        const trainingInfo = trainings.find(
          (tr) => tr._id === (t.trainingId?._id || t.trainingId)
        );
        const validityDays = trainingInfo?.validityDays || 90;

        const assignedDate = t.assignedDate
          ? moment(t.assignedDate).format('YYYY-MM-DD')
          : '';
        const expireDate = assignedDate
          ? moment(assignedDate).add(validityDays, 'days').format('YYYY-MM-DD')
          : '';

        let status: 'inProgress' | 'completed' | 'expired' =
          t.status || 'inProgress';
        if (
          expireDate &&
          moment().isAfter(expireDate) &&
          status !== 'completed'
        ) {
          status = 'expired';
        }

        return {
          _id: t._id,
          trainingId: t.trainingId?._id || t.trainingId,
          trainingName: t.trainingId?.name || trainingInfo?.name || '-',
          assignedDate,
          expireDate,
          status,
          completedAt: t.completedAt
            ? moment(t.completedAt).format('YYYY-MM-DD')
            : undefined,
          certificate: t.certificate || null
        };
      });
      setLocalTrainings(mapped);
    }
  }, [formData.training, trainings]);

  // React Select options
  const trainingOptions: TrainingOption[] = trainings.map((t) => ({
    value: t._id,
    label: t.name,
    validityDays: t.validityDays
  }));

  const selectedTrainingOption = trainingOptions.find(
    (t) => t.value === dialogData.trainingId
  );

  // Auto-calc expireDate
  useEffect(() => {
    if (dialogData.assignedDate && selectedTrainingOption?.validityDays) {
      const expiry = moment(dialogData.assignedDate)
        .add(selectedTrainingOption.validityDays, 'days')
        .format('YYYY-MM-DD');
      setDialogData((prev) => ({ ...prev, expireDate: expiry }));
    }
  }, [dialogData.assignedDate, selectedTrainingOption]);

  // Open dialog
  const openDialog = (index: number | null = null) => {
    if (index !== null) {
      const training = localTrainings[index];
      setEditingIndex(index);
      setDialogData({ ...training });
    } else {
      setEditingIndex(null);
      setDialogData({
        trainingId: '',
        assignedDate: '',
        status: 'inProgress',
        certificate: null,
        expireDate: '',
        completedAt: ''
      });
    }
    setIsDialogOpen(true);
  };

  const handleDialogChange = (field: string, value: any) => {
    setDialogData((prev) => ({ ...prev, [field]: value }));
  };

  // Save training
  const handleSave = () => {
    if (!dialogData.trainingId || !dialogData.assignedDate) {
      alert('Please select a training and assigned date.');
      return;
    }

    const trainingInfo = trainings.find(
      (t) => t._id === dialogData.trainingId
    )!;

    let status: 'inProgress' | 'completed' | 'expired' =
      dialogData.status as any;

    // Only auto-expire if status is not manually completed
    if (
      dialogData.expireDate &&
      moment().isAfter(dialogData.expireDate) &&
      status !== 'completed'
    ) {
      status = 'expired';
    }

    // Completed At logic
    let completedAt = dialogData.completedAt;
    if (status === 'completed' && !completedAt) {
      completedAt = moment().format('YYYY-MM-DD');
    }

    const newTraining: LocalTraining = {
      _id: dialogData._id,

      trainingId: dialogData.trainingId,
      assignedDate: dialogData.assignedDate,
      expireDate: dialogData.expireDate || '',
      status,
      completedAt,
      certificate: dialogData.certificate || null
    };

    if (editingIndex !== null) {
      const updated = localTrainings.map((t, i) =>
        i === editingIndex ? newTraining : t
      );
      setLocalTrainings(updated);
      onUpdate('training', updated);
    } else {
      const updated = [...localTrainings, newTraining];
      setLocalTrainings(updated);
      onUpdate('training', updated);
    }

    setIsDialogOpen(false);
    setEditingIndex(null);
    setDialogData({});
  };

  const handleRemove = (index: number) => {
    const updated = localTrainings.filter((_, i) => i !== index);
    setLocalTrainings(updated);
    onUpdate('training', updated);
  };

    const [isAssignedDateOpen, setIsAssignedDateOpen] = useState(false);
  const [isCompletedAtOpen, setIsCompletedAtOpen] = useState(false);
  const [isExpireDateOpen, setIsExpireDateOpen] = useState(false);


  return (
    <Card>
      <CardContent className="pt-6">
        {/* Add Training */}
        <div className="mb-4 flex justify-end">
          <Button
            type="button"
            size="sm"
            onClick={() => openDialog(null)}
            disabled={isFieldSaving['training']}
            className="bg-supperagent text-white hover:bg-supperagent/90"
          >
            + Add Training
          </Button>
        </div>

        {/* Training Table */}
        {localTrainings.length > 0 ? (
          <div className="overflow-hidden  rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Training</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Assigned Date</TableHead>
                  <TableHead>Completed At</TableHead>
                  <TableHead>Expiry Date</TableHead>
                  <TableHead>Certificate</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {localTrainings.map((t, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">
                      {t.trainingName}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`rounded-full px-2 py-1 text-xs ${
                          t.status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : t.status === 'expired'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {t.status.charAt(0).toUpperCase() + t.status.slice(1)}
                      </span>
                    </TableCell>
                    <TableCell>
  {t.assignedDate ? moment(t.assignedDate).format('DD/MM/YYYY') : '-'}
</TableCell>
<TableCell>
  {t.completedAt ? moment(t.completedAt).format('DD/MM/YYYY') : '-'}
</TableCell>
<TableCell>
  {t.expireDate ? moment(t.expireDate).format('DD/MM/YYYY') : '-'}
</TableCell>
                    <TableCell>
                      {t.certificate ? (
                        <a
                          href={URL.createObjectURL(t.certificate)}
                          target="_blank"
                          className="text-sm text-blue-600 underline"
                        >
                          View
                        </a>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="default"
                          size="icon"
                          onClick={() => openDialog(index)}
                          className="bg-supperagent text-white hover:bg-supperagent/90"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <p className="text-sm italic text-gray-500">
            No trainings assigned yet.
          </p>
        )}

        {/* Dialog */}
 <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogContent className="sm:max-w-md bg-white">
        <DialogHeader>
          <DialogTitle>
            {editingIndex !== null ? 'Edit Training' : 'Add Training'}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Training Select */}
          <div className="grid gap-2">
            <Label htmlFor="training">Training</Label>
            <ReactSelect
              id="training"
              options={trainingOptions}
              value={
                trainingOptions.find(
                  (t) => t.value === dialogData.trainingId
                ) || null
              }
              onChange={(selected) =>
                handleDialogChange('trainingId', selected?.value)
              }
              placeholder="Select Training"
            />
          </div>

          {/* Assigned Date */}
          <div className="grid gap-2">
            <Label>Assigned Date (dd/mm/yyyy)</Label>
            <DatePicker
              selected={
                dialogData.assignedDate
                  ? moment(dialogData.assignedDate).toDate()
                  : null
              }
              onChange={(date: Date | null) => {
                handleDialogChange(
                  'assignedDate',
                  date ? moment(date).format('YYYY-MM-DD') : ''
                );
                setIsAssignedDateOpen(false); // 👈 Close on select
              }}
              dateFormat="dd/MM/yyyy" // 👈 Display: 25 Apr 2025
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              placeholderText="Select assigned date"
              isClearable
              shouldCloseOnSelect={true}
              open={isAssignedDateOpen} // 👈 Controlled
              onInputClick={() => setIsAssignedDateOpen(true)} // 👈 Open on click
              onClickOutside={() => setIsAssignedDateOpen(false)} // 👈 Close on outside click
            />
          </div>

          {/* Status */}
          <div className="grid gap-2">
            <Label>Status</Label>
            <Select
              value={dialogData.status}
              onValueChange={(value) => handleDialogChange('status', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="inProgress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Completed At */}
          <div className="grid gap-2">
            <Label>Completed At (dd/mm/yyyy)</Label>
            <DatePicker
              selected={
                dialogData.completedAt
                  ? moment(dialogData.completedAt).toDate()
                  : null
              }
              onChange={(date: Date | null) => {
                handleDialogChange(
                  'completedAt',
                  date ? moment(date).format('YYYY-MM-DD') : ''
                );
                setIsCompletedAtOpen(false); // 👈 Close on select
              }}
              dateFormat="dd/MM/yyyy"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              placeholderText="Select completed date"
              isClearable
              shouldCloseOnSelect={true}
              open={isCompletedAtOpen}
              onInputClick={() => setIsCompletedAtOpen(true)}
              onClickOutside={() => setIsCompletedAtOpen(false)}
            />
          </div>

          {/* Expiry Date */}
          <div className="grid gap-2">
            <Label>Expiry Date (dd/mm/yyyy)</Label>
            <DatePicker
              selected={
                dialogData.expireDate
                  ? moment(dialogData.expireDate).toDate()
                  : null
              }
              onChange={(date: Date | null) => {
                handleDialogChange(
                  'expireDate',
                  date ? moment(date).format('YYYY-MM-DD') : ''
                );
                setIsExpireDateOpen(false); // 👈 Close on select
              }}
              dateFormat="dd/MM/yyyy"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              placeholderText="Select expiry date"
              isClearable
              shouldCloseOnSelect={true}
              open={isExpireDateOpen}
              onInputClick={() => setIsExpireDateOpen(true)}
              onClickOutside={() => setIsExpireDateOpen(false)}
            />
          </div>

          {/* Certificate Upload */}
          <div className="grid gap-2">
            <Label>Certificate (Optional)</Label>
            <Input
              type="file"
              accept=".pdf,.jpg,.png"
              onChange={(e) => {
                const file = e.target.files?.[0] || null;
                handleDialogChange('certificate', file);
              }}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsDialogOpen(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            className="bg-supperagent text-white hover:bg-supperagent/90"
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

      </CardContent>
    </Card>
  );
};

export default TrainingTab;
