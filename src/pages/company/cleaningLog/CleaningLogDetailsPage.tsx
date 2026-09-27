import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, History, Pencil, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
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
import { apiError, CleaningLogRecord, formatDateTime } from './shared';
import {
  CleaningLogDetailsBody,
  CleaningLogTitle
} from './components/CleaningLogDetailsDialog';

// Admin only: the full log on the left, its activity on the right
export default function CleaningLogDetailsPage() {
  const { id, lid } = useParams(); // companyId, logId
  const navigate = useNavigate();
  const { toast } = useToast();
  const listPath = `/company/${id}/cleaning-log`;

  const [log, setLog] = useState<CleaningLogRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    axiosInstance
      .get(`/cleaning-log/${lid}`)
      .then((res) => setLog(res.data?.data))
      .catch(() => setLog(null))
      .finally(() => setLoading(false));
  }, [lid]);

  const handleDelete = async () => {
    try {
      await axiosInstance.delete(`/cleaning-log/${lid}`);
      toast({
        title: 'Cleaning log deleted successfully',
        className: 'bg-theme border-none text-white'
      });
      navigate(listPath);
    } catch (error) {
      toast({
        title: apiError(error, 'Failed to delete cleaning log'),
        className: 'bg-red-500 border-none text-white'
      });
    }
  };

  // Newest entry first, without mutating what the API sent
  const history = [...(log?.logs || [])].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
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
      {/* Header */}
      <div className="flex flex-col gap-3 border-b border-gray-200 pb-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          {log ? (
            <CleaningLogTitle log={log} />
          ) : (
            <p className="text-lg font-bold text-black">Cleaning log not found</p>
          )}
        </div>

        <div className="flex w-full flex-wrap gap-2 lg:w-auto">
          <Button size="sm" className="flex-1 sm:flex-none" onClick={() => navigate(listPath)}>
            <ArrowLeft className="mr-1.5 h-4 w-4" /> Back
          </Button>
          {log && (
            <>
              <Button
                size="sm"
                variant="outline"
                className="flex-1 sm:flex-none"
                onClick={() => navigate(`${listPath}/${log._id}/edit`)}
              >
                <Pencil className="mr-1.5 h-3.5 w-3.5" /> Edit
              </Button>
              <Button
                size="sm"
                variant="destructive"
                className="flex-1 sm:flex-none"
                onClick={() => setConfirmDelete(true)}
              >
                <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Delete
              </Button>
            </>
          )}
        </div>
      </div>

      {log && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
          {/* Details */}
          <div className="min-w-0 lg:col-span-8">
            <CleaningLogDetailsBody log={log} />
          </div>

          {/* Activity */}
          <aside className="min-w-0 rounded-xl border border-gray-200 lg:col-span-4">
            <div className="flex items-center gap-2 border-b border-gray-200 px-4 py-3">
              <History className="h-4 w-4 text-theme" />
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-black">
                Activity ({history.length})
              </p>
            </div>

            <ScrollArea className="h-[320px] lg:h-[calc(100vh-230px)]">
              {history.length ? (
                <ol className="p-2">
                  {history.map((entry, index) => (
                    <li
                      key={entry._id || `${entry.date}-${index}`}
                      className="flex items-start gap-2.5 rounded-md border-b border-gray-100 px-2 py-2.5 transition-colors last:border-0 hover:bg-gray-50"
                    >
                      <span
                        className={cn(
                          'mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full',
                          entry.action === 'create' ? 'bg-emerald-500' : 'bg-sky-500'
                        )}
                      />
                      <span className="min-w-0 flex-1 break-words text-xs font-medium leading-relaxed text-black sm:text-sm">
                        {entry.title} at {formatDateTime(entry.date)}
                      </span>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="m-3 rounded-xl border border-dashed border-gray-200 px-4 py-3 text-xs italic text-black sm:text-sm">
                  No activity recorded yet.
                </p>
              )}
            </ScrollArea>
          </aside>
        </div>
      )}

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Cleaning Log</AlertDialogTitle>
            <AlertDialogDescription className="text-black">
              This will permanently delete the{' '}
              <span className="font-semibold">{log?.areaName}</span> log.
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
