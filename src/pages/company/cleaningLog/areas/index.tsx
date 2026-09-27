import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { z } from 'zod';
import {
  ArrowLeft,
  CalendarDays,
  CalendarRange,
  ListChecks,
  MapPin,
  Pencil,
  Plus,
  Trash2
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
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
import { useToast } from '@/components/ui/use-toast';
import { BlinkingDots } from '@/components/shared/blinking-dots';
import axiosInstance from '@/lib/axios';
import { cn } from '@/lib/utils';
import { apiError, CLEANING_TYPE_LABEL, CleaningArea, CleaningType } from '../shared';

const areaSchema = z.object({
  areaName: z
    .string()
    .trim()
    .min(2, { message: 'Area name must be at least 2 characters long' }),
  type: z.enum(['daily', 'monthly'], {
    errorMap: () => ({ message: 'Please choose daily or monthly' })
  }),
  roomNumber: z.string().trim().optional()
});

export default function CleaningAreaPage() {
  const { id } = useParams(); // companyId
  const navigate = useNavigate();
  const { toast } = useToast();

  const [areas, setAreas] = useState<CleaningArea[]>([]);
  const [loading, setLoading] = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingArea, setEditingArea] = useState<CleaningArea | null>(null);
  const [areaName, setAreaName] = useState('');
  const [type, setType] = useState<CleaningType | ''>('');
  const [roomNumber, setRoomNumber] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [areaToDelete, setAreaToDelete] = useState<CleaningArea | null>(null);

  const fetchAreas = async () => {
    try {
      const response = await axiosInstance.get('/cleaning-area', {
        params: { companyId: id, limit: 'all', sort: 'areaName' }
      });
      setAreas(response.data?.data?.result || []);
    } catch (error) {
      console.error('Error fetching areas:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAreas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const openCreate = (presetType: CleaningType) => {
    setEditingArea(null);
    setAreaName('');
    setType(presetType);
    setRoomNumber('');
    setFormErrors({});
    setDialogOpen(true);
  };

  const openEdit = (area: CleaningArea) => {
    setEditingArea(area);
    setAreaName(area.areaName);
    setType(area.type);
    setRoomNumber(area.roomNumber || '');
    setFormErrors({});
    setDialogOpen(true);
  };

  const handleSave = async () => {
    const validation = areaSchema.safeParse({ areaName, type, roomNumber });
    if (!validation.success) {
      const errors: Record<string, string> = {};
      validation.error.issues.forEach((issue) => {
        const key = String(issue.path[0]);
        if (!errors[key]) errors[key] = issue.message;
      });
      setFormErrors(errors);
      return;
    }

    try {
      setIsSubmitting(true);
      if (editingArea) {
        await axiosInstance.patch(`/cleaning-area/${editingArea._id}`, {
          areaName: validation.data.areaName,
          roomNumber: validation.data.roomNumber
        });
      } else {
        await axiosInstance.post('/cleaning-area', {
          ...validation.data,
          companyId: id
        });
      }
      toast({
        title: editingArea ? 'Area updated successfully' : 'Area created successfully',
        className: 'bg-theme border-none text-white'
      });
      setDialogOpen(false);
      fetchAreas();
    } catch (error) {
      toast({
        title: apiError(error, 'Failed to save area'),
        className: 'bg-red-500 border-none text-white'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!areaToDelete) return;
    try {
      await axiosInstance.delete(`/cleaning-area/${areaToDelete._id}`);
      toast({
        title: 'Area deleted successfully',
        className: 'bg-theme border-none text-white'
      });
      setAreaToDelete(null);
      fetchAreas();
    } catch (error) {
      toast({
        title: apiError(error, 'Failed to delete area'),
        className: 'bg-red-500 border-none text-white'
      });
    }
  };

  const renderActions = (area: CleaningArea) => (
    <div className="flex flex-wrap items-center justify-end gap-1.5">
      <Button
        size="sm"
        className="bg-theme text-white hover:bg-theme/90"
        onClick={() => navigate(area._id)}
      >
        <ListChecks className="mr-1 h-4 w-4" /> Elements
      </Button>
      <Button size="sm" variant="outline" onClick={() => openEdit(area)}>
        <Pencil className="h-3.5 w-3.5" />
        <span className="sr-only">Edit</span>
      </Button>
      <Button size="sm" variant="destructive" onClick={() => setAreaToDelete(area)}>
        <Trash2 className="h-3.5 w-3.5" />
        <span className="sr-only">Delete</span>
      </Button>
    </div>
  );

  const renderSection = (sectionType: CleaningType) => {
    const list = areas.filter((area) => area.type === sectionType);
    const Icon = sectionType === 'daily' ? CalendarDays : CalendarRange;

    return (
      <section className="flex min-w-0 flex-col overflow-hidden rounded-xl border border-gray-200">
        <header className="flex items-center justify-between gap-2 border-b border-gray-200 bg-gray-50 px-4 py-3">
          <h3 className="flex items-center gap-2 text-sm font-bold text-black sm:text-base">
            <span
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-lg',
                sectionType === 'daily'
                  ? 'bg-sky-100 text-sky-700'
                  : 'bg-violet-100 text-violet-700'
              )}
            >
              <Icon className="h-4 w-4" />
            </span>
            {CLEANING_TYPE_LABEL[sectionType]} Areas
            <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-black ring-1 ring-gray-200">
              {list.length}
            </span>
          </h3>
          <Button size="sm" variant="outline" onClick={() => openCreate(sectionType)}>
            <Plus className="mr-1 h-4 w-4" /> Add
          </Button>
        </header>

        {list.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-4 py-12 text-center">
            <MapPin className="h-6 w-6 text-gray-300" />
            <p className="text-sm text-black">
              No {CLEANING_TYPE_LABEL[sectionType].toLowerCase()} area yet.
            </p>
          </div>
        ) : (
          <>
            {/* Table from md up */}
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="font-semibold text-black">Area Name</TableHead>
                    <TableHead className="font-semibold text-black">Room No.</TableHead>
                    <TableHead className="text-right font-semibold text-black">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {list.map((area) => (
                    <TableRow key={area._id}>
                      <TableCell className="font-medium text-black">
                        {area.areaName}
                      </TableCell>
                      <TableCell className="text-black">{area.roomNumber || '-'}</TableCell>
                      <TableCell>{renderActions(area)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Cards on phones */}
            <ul className="divide-y divide-gray-100 md:hidden">
              {list.map((area) => (
                <li key={area._id} className="space-y-2 p-4">
                  <div>
                    <p className="break-words text-sm font-semibold text-black">
                      {area.areaName}
                    </p>
                    {area.roomNumber && (
                      <p className="text-xs text-black">
                        Room {area.roomNumber}
                      </p>
                    )}
                  </div>
                  {renderActions(area)}
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
    );
  };

  return (
    <div className="min-h-[97vh] space-y-4 rounded-md bg-white p-3 shadow-sm max-md:mt-8 sm:p-4 lg:space-y-5 lg:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-bold text-black lg:text-2xl">
            <MapPin className="h-5 w-5 lg:h-6 lg:w-6" />
            Cleaning Areas
          </h2>
          <p className="mt-1 text-xs text-black sm:text-sm">
            Set up the areas to clean and the checklist for each one.
          </p>
        </div>
        <Button
          size="sm"
          className="w-full sm:w-auto"
          onClick={() => navigate(`/company/${id}/cleaning-log`)}
        >
          <ArrowLeft className="mr-1.5 h-4 w-4" /> Back
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <BlinkingDots size="large" color="bg-theme" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {renderSection('daily')}
          {renderSection('monthly')}
        </div>
      )}

      {/* Create / edit area */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="w-[95vw] max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {`${editingArea ? 'Edit' : 'Add'} ${
                type ? CLEANING_TYPE_LABEL[type] : ''
              } Area`}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="font-semibold text-black">Area Name*</Label>
              <Input
                value={areaName}
                onChange={(e) => {
                  setAreaName(e.target.value);
                  setFormErrors((prev) => ({ ...prev, areaName: '' }));
                }}
                placeholder="e.g. Medicine Room"
                className={cn(formErrors.areaName && 'border-red-500')}
              />
              {formErrors.areaName && (
                <p className="text-xs font-medium text-red-500">{formErrors.areaName}</p>
              )}
            </div>

            {/* The type comes from the table the area sits on, so it is
                never asked for here */}
            <div className="space-y-2">
              <Label className="font-semibold text-black">Room Number</Label>
              <Input
                value={roomNumber}
                onChange={(e) => setRoomNumber(e.target.value)}
                placeholder="Optional"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-theme text-white hover:bg-theme/90"
              disabled={isSubmitting}
              onClick={handleSave}
            >
              {isSubmitting ? 'Saving...' : editingArea ? 'Update Area' : 'Add Area'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!areaToDelete}
        onOpenChange={(open) => !open && setAreaToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Area</AlertDialogTitle>
            <AlertDialogDescription className="text-black">
              This will delete{' '}
              <span className="font-semibold">{areaToDelete?.areaName}</span> and
              all of its elements. Logs already submitted for it are kept.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 text-white hover:bg-red-600"
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
