import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { z } from 'zod';
import { ArrowLeft, DoorOpen, ListChecks, Pencil, Plus, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { apiError, CleaningArea, CleaningElement } from '../shared';
import { TypeBadge } from '../components/CleaningLogList';

const elementSchema = z.object({
  element: z.string().trim().min(2, { message: 'Element is required' }),
  performanceParameter: z
    .string()
    .trim()
    .min(2, { message: 'Performance parameter is required' })
});

export default function AreaElementsPage() {
  const { id, aid } = useParams(); // companyId, areaId
  const navigate = useNavigate();
  const { toast } = useToast();

  const [area, setArea] = useState<CleaningArea | null>(null);
  const [elements, setElements] = useState<CleaningElement[]>([]);
  const [loading, setLoading] = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CleaningElement | null>(null);
  const [element, setElement] = useState('');
  const [performanceParameter, setPerformanceParameter] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toDelete, setToDelete] = useState<CleaningElement | null>(null);

  const fetchElements = async () => {
    try {
      const response = await axiosInstance.get('/cleaning-element', {
        params: { areaId: aid, limit: 'all' }
      });
      setElements(response.data?.data?.result || []);
    } catch (error) {
      console.error('Error fetching elements:', error);
    }
  };

  useEffect(() => {
    Promise.all([
      axiosInstance
        .get(`/cleaning-area/${aid}`)
        .then((res) => setArea(res.data?.data))
        .catch(() => setArea(null)),
      fetchElements()
    ]).finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aid]);

  const openDialog = (row?: CleaningElement) => {
    setEditing(row || null);
    setElement(row?.element || '');
    setPerformanceParameter(row?.performanceParameter || '');
    setFormErrors({});
    setDialogOpen(true);
  };

  const handleSave = async (addAnother = false) => {
    const validation = elementSchema.safeParse({ element, performanceParameter });
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
      if (editing) {
        await axiosInstance.patch(`/cleaning-element/${editing._id}`, validation.data);
      } else {
        await axiosInstance.post('/cleaning-element', {
          ...validation.data,
          areaId: aid,
          companyId: id
        });
      }
      toast({
        title: editing ? 'Element updated successfully' : 'Element added successfully',
        className: 'bg-theme border-none text-white'
      });
      fetchElements();

      // Long checklists are typed in one after another
      if (addAnother && !editing) {
        setElement('');
        setPerformanceParameter('');
      } else {
        setDialogOpen(false);
      }
    } catch (error) {
      toast({
        title: apiError(error, 'Failed to save element'),
        className: 'bg-red-500 border-none text-white'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    try {
      await axiosInstance.delete(`/cleaning-element/${toDelete._id}`);
      toast({
        title: 'Element deleted successfully',
        className: 'bg-theme border-none text-white'
      });
      setToDelete(null);
      fetchElements();
    } catch (error) {
      toast({
        title: apiError(error, 'Failed to delete element'),
        className: 'bg-red-500 border-none text-white'
      });
    }
  };

  const renderActions = (row: CleaningElement) => (
    <div className="flex items-center justify-end gap-1.5">
      <Button size="sm" variant="outline" onClick={() => openDialog(row)}>
        <Pencil className="mr-1 h-3.5 w-3.5" /> Edit
      </Button>
      <Button size="sm" variant="destructive" onClick={() => setToDelete(row)}>
        <Trash2 className="h-3.5 w-3.5" />
        <span className="sr-only">Delete</span>
      </Button>
    </div>
  );

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <BlinkingDots size="large" color="bg-theme" />
      </div>
    );
  }

  return (
    <div className="min-h-[97vh] space-y-4 rounded-md bg-white p-3 shadow-sm max-md:mt-8 sm:p-4 lg:space-y-5 lg:p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <h2 className="flex flex-wrap items-center gap-2 break-words text-xl font-bold text-black lg:text-2xl">
            <ListChecks className="h-5 w-5 shrink-0 lg:h-6 lg:w-6" />
            {area?.areaName || 'Area'}
            {area && <TypeBadge type={area.type} />}
          </h2>
          <p className="mt-1 flex flex-wrap items-center gap-x-3 text-xs text-black sm:text-sm">
            {area?.roomNumber && (
              <span className="inline-flex items-center gap-1">
                <DoorOpen className="h-3.5 w-3.5" /> Room {area.roomNumber}
              </span>
            )}
            <span>
              {elements.length} {elements.length === 1 ? 'element' : 'elements'}
            </span>
          </p>
        </div>

        <div className="flex w-full flex-wrap gap-2 lg:w-auto">
          <Button
            size="sm"
            className="flex-1 sm:flex-none"
            onClick={() => navigate(`/company/${id}/cleaning-log/areas`)}
          >
            <ArrowLeft className="mr-1.5 h-4 w-4" /> Back
          </Button>
          <Button
            size="sm"
            className="flex-1 bg-theme text-white hover:bg-theme/90 sm:flex-none"
            onClick={() => openDialog()}
          >
            <Plus className="mr-1.5 h-4 w-4" /> Add Element
          </Button>
        </div>
      </div>

      {elements.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-gray-200 py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-theme/10">
            <ListChecks className="h-6 w-6 text-theme" />
          </div>
          <p className="text-sm font-semibold text-black">No element yet</p>
          <p className="max-w-md text-xs text-black">
            Add each element to clean along with the performance parameter it
            must meet. Employees tick these off when they submit a log.
          </p>
        </div>
      ) : (
        <>
          <div className="hidden overflow-hidden rounded-xl border border-gray-200 md:block">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 hover:bg-gray-50">
                  <TableHead className="w-12 font-semibold text-black">#</TableHead>
                  <TableHead className="w-[30%] font-semibold text-black">Element</TableHead>
                  <TableHead className="font-semibold text-black">
                    Performance Parameter
                  </TableHead>
                  <TableHead className="w-44 text-right font-semibold text-black">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {elements.map((row, index) => (
                  <TableRow key={row._id} className="align-top">
                    <TableCell className="text-black">{index + 1}</TableCell>
                    <TableCell className="font-medium text-black">{row.element}</TableCell>
                    <TableCell className="whitespace-pre-wrap text-sm leading-relaxed text-black">
                      {row.performanceParameter}
                    </TableCell>
                    <TableCell>{renderActions(row)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <ul className="space-y-3 md:hidden">
            {elements.map((row, index) => (
              <li
                key={row._id}
                className="space-y-2 rounded-xl border border-gray-200 p-4 shadow-sm"
              >
                <p className="text-sm font-semibold text-black">
                  <span className="mr-1.5 text-black">{index + 1}.</span>
                  {row.element}
                </p>
                <p className="whitespace-pre-wrap text-xs leading-relaxed text-black">
                  {row.performanceParameter}
                </p>
                {renderActions(row)}
              </li>
            ))}
          </ul>
        </>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] w-[95vw] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Element' : 'Add Element'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="font-semibold text-black">Element*</Label>
              <Input
                value={element}
                onChange={(e) => {
                  setElement(e.target.value);
                  setFormErrors((prev) => ({ ...prev, element: '' }));
                }}
                placeholder="e.g. Sinks and taps"
                className={cn(formErrors.element && 'border-red-500')}
              />
              {formErrors.element && (
                <p className="text-xs font-medium text-red-500">{formErrors.element}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="font-semibold text-black">Performance Parameter*</Label>
              <Textarea
                value={performanceParameter}
                onChange={(e) => {
                  setPerformanceParameter(e.target.value);
                  setFormErrors((prev) => ({ ...prev, performanceParameter: '' }));
                }}
                placeholder="e.g. Sinks and taps should be visibly clean with no blood and body fluids, dust, dirt, debris, lime scale, stains or spillages..."
                className={cn(
                  'min-h-[140px] resize-y',
                  formErrors.performanceParameter && 'border-red-500'
                )}
              />
              {formErrors.performanceParameter && (
                <p className="text-xs font-medium text-red-500">
                  {formErrors.performanceParameter}
                </p>
              )}
            </div>
          </div>

          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            {!editing && (
              <Button
                variant="outline"
                disabled={isSubmitting}
                onClick={() => handleSave(true)}
              >
                Save & Add Another
              </Button>
            )}
            <Button
              className="bg-theme text-white hover:bg-theme/90"
              disabled={isSubmitting}
              onClick={() => handleSave()}
            >
              {isSubmitting ? 'Saving...' : editing ? 'Update Element' : 'Save Element'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!toDelete} onOpenChange={(open) => !open && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Element</AlertDialogTitle>
            <AlertDialogDescription className="text-black">
              <span className="font-semibold">{toDelete?.element}</span> will be
              removed from this area's checklist. Logs already submitted are kept.
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
