import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axiosInstance from '@/lib/axios';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Loader2,
  ArrowLeft,
  CheckCircle2,
  Trash2,
  CalendarDays,
  FileText,
  FileSignature,
  Clock,
  User2,
  ChevronRight,
  ExternalLink,
  Check,
  UserCheck
} from 'lucide-react';
import moment from '@/lib/moment-setup';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { BlinkingDots } from '@/components/shared/blinking-dots';
import { SaveToProfile } from './components/SaveToProfile';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Designation {
  _id: string;
  title: string;
}

interface User {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  designationId?: Designation[];
}

interface Approver {
  _id: string;
  index: number;
  userId: User;
  createdAt: string;
  updatedAt: string;
}

interface SignedBy {
  _id: string;
  userId: User;
  createdAt: string;
  updatedAt: string;
}

interface SignatureDocDetail {
  _id: string;
  content: string;
  document: string;
  employeeId: User;
  envelopeId?: string | null;
  approverIds: Approver[];
  companyId: string;
  status: string;
  signedBy: SignedBy[];
  createdAt: string;
  updatedAt: string;
  signedDocument?: string;
  submittedAt?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getDesignations(user: User): string {
  if (!user.designationId || user.designationId.length === 0) return '';
  return user.designationId.map((d) => d.title).join(', ');
}

function fullName(user: User) {
  return `${user.firstName} ${user.lastName}`;
}

/** Returns true if `document` field is a real URL (not a template placeholder) */
function isRealDocumentUrl(document: string): boolean {
  return (
    !!document &&
    document !== 'docusign-template-used' &&
    (document.startsWith('http://') || document.startsWith('https://'))
  );
}

/** Build a unified ordered signer list for a single doc */
function buildSigners(doc: SignatureDocDetail) {
  const signedMap = new Map<string, string>();
  doc.signedBy?.forEach((s) => signedMap.set(s.userId._id, s.createdAt));

  const list: {
    id: string;
    name: string;
    email: string;
    designation: string;
    role: 'employee' | 'approver';
    isSigned: boolean;
    signedAt?: string;
    dotColor: string;
  }[] = [];

  if (doc.employeeId) {
    list.push({
      id: doc.employeeId._id,
      name: fullName(doc.employeeId),
      email: doc.employeeId.email,
      designation: getDesignations(doc.employeeId),
      role: 'employee',
      isSigned: signedMap.has(doc.employeeId._id),
      signedAt: signedMap.get(doc.employeeId._id),
      dotColor: 'bg-theme'
    });
  }

  const sorted = [...(doc.approverIds ?? [])].sort((a, b) => a.index - b.index);
  sorted.forEach((app) => {
    list.push({
      id: app.userId._id,
      name: fullName(app.userId),
      email: app.userId.email,
      designation: getDesignations(app.userId),
      role: 'approver',
      isSigned: signedMap.has(app.userId._id),
      signedAt: signedMap.get(app.userId._id),
      dotColor: 'bg-theme'
    });
  });

  return list;
}

// ─── Sub-component: Employee Detail Dialog ────────────────────────────────────

function EmployeeDocDialog({
  doc,
  open,
  onClose
}: {
  doc: SignatureDocDetail;
  open: boolean;
  onClose: () => void;
}) {
  const signers = buildSigners(doc);
  const hasOriginalDoc = isRealDocumentUrl(doc.document);
  const hasSubmittedDoc = !!doc.signedDocument;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-h-[80vh] max-w-lg overflow-y-auto border-none">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">
            {doc.content || 'Document Details'}
          </DialogTitle>
          <DialogDescription className="flex items-center gap-1.5 text-sm font-medium text-black">
            Send Date:
            <CalendarDays className="h-3.5 w-3.5" />
            {moment(doc.createdAt).format('DD MMM YYYY')}
          </DialogDescription>
        </DialogHeader>

        {/* Employee info */}
        <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
          <p className="mb-0.5 text-xs font-semibold uppercase tracking-wide text-theme">
            Employee
          </p>
          <p className="text-sm font-bold text-gray-900">
            {fullName(doc.employeeId)}
          </p>
          {getDesignations(doc.employeeId) && (
            <p className="text-xs font-medium text-theme">
              {getDesignations(doc.employeeId)}
            </p>
          )}
        </div>

        {/* Signer list as a Timeline Workflow */}
        <div className="mt-4 flex flex-col gap-0">
          <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-gray-800">
            Signing Progress
          </p>

          <div className="relative flex flex-col gap-0 px-2">
            {signers.map((s, i) => {
              const isLast = i === signers.length - 1;
              return (
                <div
                  key={s.id}
                  className="relative flex items-start gap-4 pb-6"
                >
                  {/* Vertical connector line */}
                  {!isLast && (
                    <div className="absolute bottom-0 left-[9px] top-[24px] w-[2px] bg-gray-200" />
                  )}

                  {/* Dot (Hollow or Filled with Tick) */}
                  <div className="relative z-10 mt-0.5 shrink-0">
                    {s.isSigned ? (
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-theme ring-[3px] ring-white">
                        <Check className="h-3 w-3 text-white" strokeWidth={3} />
                      </div>
                    ) : (
                      <div className="h-5 w-5 rounded-full border-[2px] border-theme bg-white ring-[3px] ring-white" />
                    )}
                  </div>

                  {/* Info Content */}
                  <div className="flex flex-1 flex-col justify-between gap-2 sm:flex-row sm:items-start">
                    <div>
                      <p className="text-sm font-semibold text-gray-800">
                        {i + 1}. {s.name}
                      </p>
                      {s.designation && (
                        <p className="text-xs font-medium text-theme">
                          {s.designation}
                        </p>
                      )}
                      <p className="text-xs text-gray-400">{s.email}</p>
                    </div>
                    <div className="text-left sm:text-right">
                      {s.isSigned ? (
                        <div>
                          <p className="text-xs font-semibold text-emerald-600">
                            Signed
                          </p>
                          <p className="text-xs text-gray-400">
                            {moment(s.signedAt).format('DD MMM YYYY, hh:mm A')}
                          </p>
                        </div>
                      ) : (
                        <span className="text-xs font-medium text-gray-400">
                          Pending
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Document links: Original + Submitted ── */}
        {(hasOriginalDoc || hasSubmittedDoc) && (
          <div className="mt-1 flex gap-2">
            {hasOriginalDoc && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(doc.document, '_blank')}
              >
                <FileText className="mr-1.5 h-3.5 w-3.5 text-theme" />
                Original Document
                <ExternalLink className="ml-1.5 h-3 w-3 text-gray-400" />
              </Button>
            )}
            {hasSubmittedDoc && (
              <Button
                size="sm"
                onClick={() => window.open(doc.signedDocument, '_blank')}
              >
                <FileSignature className="mr-1.5 h-3.5 w-3.5" />
                Submitted Document
                <ExternalLink className="ml-1.5 h-3 w-3 opacity-70" />
              </Button>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

function SignatureDocumentDetail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const docIds = searchParams.get('ids')?.split(',').filter(Boolean) || [];
  const contentTitle = searchParams.get('content') || 'Group Details';

  const [documents, setDocuments] = useState<SignatureDocDetail[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDoc, setSelectedDoc] = useState<SignatureDocDetail | null>(
    null
  );
const [docToSaveToProfile, setDocToSaveToProfile] = useState<SignatureDocDetail | null>(null);
  // ── Fetch all docs in parallel ─────────────────────────────────────────────
  useEffect(() => {
    const fetchAll = async () => {
      if (!docIds.length) {
        setIsLoading(false);
        return;
      }
      try {
        const results = await Promise.all(
          docIds.map((id) =>
            axiosInstance
              .get(`/signature-documents/${id}`)
              .then((res) =>
                Array.isArray(res.data?.data?.result)
                  ? res.data.data.result[0]
                  : res.data?.data
              )
          )
        );
        setDocuments(results.filter(Boolean));
      } catch (error) {
        console.error('Error fetching documents:', error);
        toast({
          title: 'Error',
          description: 'Failed to load document details.',
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchAll();
  }, []);

  // ── Derived shared metadata ────────────────────────────────────────────────
  const sharedRequestDate =
    documents.length > 0
      ? moment(documents[0].createdAt).format('DD MMM YYYY')
      : null;

  const allSameDate = documents.every(
    (d) =>
      moment(d.createdAt).format('DD-MM-YYYY') ===
      moment(documents[0]?.createdAt).format('DD-MM-YYYY')
  );

  // ── Global timeline (based on first doc's approver structure) ──────────────
  const templateDoc = documents[0];
  const globalTimeline: {
    label: string;
    role: string;
    designation?: string;
    dotColor: string;
  }[] = [];

  if (templateDoc) {
    globalTimeline.push({
      label: 'Staff (Employee)',
      role: 'Initiator',
      designation: '', // Explicitly blank so Staff doesn't show designation in Sequence
      dotColor: 'bg-theme'
    });
    const sorted = [...(templateDoc.approverIds ?? [])].sort(
      (a, b) => a.index - b.index
    );
    sorted.forEach((app, i) => {
      globalTimeline.push({
        label: fullName(app.userId),
        role: `Approver ${i + 1}`,
        designation: getDesignations(app.userId),
        dotColor: 'bg-theme'
      });
    });
  }

  // ── Calculate Pending Analytics (Timeline-style) ──────────────────────────
  const analyticsTimeline = globalTimeline.map((step) => ({
    ...step,
    pendingCount: 0
  }));
  let totalCompleted = 0;

  documents.forEach((doc) => {
    const signers = buildSigners(doc);
    // Find the exact stage the document is currently stuck/pending at
    const nextSignerIndex = signers.findIndex((s) => !s.isSigned);

    if (nextSignerIndex !== -1 && analyticsTimeline[nextSignerIndex]) {
      analyticsTimeline[nextSignerIndex].pendingCount += 1;
    } else if (nextSignerIndex === -1) {
      totalCompleted += 1; // Document has been signed by everyone
    }
  });

  // ─────────────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex h-64 w-full items-center justify-center">
        <BlinkingDots size="large" color="bg-theme" />
      </div>
    );
  }

  if (!documents.length) {
    return (
      <div className="p-6 text-center text-gray-800">No documents found.</div>
    );
  }

  return (
    <div className="mx-auto min-h-screen rounded-sm bg-white p-6 shadow-sm">
      {/* ── Header ── */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-bold text-gray-900">{contentTitle}</h1>
          {allSameDate && sharedRequestDate && (
            <div className="flex items-center gap-1.5 text-sm font-medium text-gray-800">
              <CalendarDays className="h-4 w-4" />
              Send Date: {sharedRequestDate}
            </div>
          )}
        </div>
        <Button onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
      </div>

      {/* ── Two-column layout: Table + Sidebar ── */}
      <div className="mt-8 flex flex-col gap-6 lg:flex-row lg:items-start">
        {/* ── LEFT: Employee Table ── */}
        <div className="flex-1 overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b text-left text-xs font-bold uppercase tracking-wide">
                <th className="pb-3 pr-6">Recipients</th>
                <th className="pb-3 pr-6">Status</th>
                <th className="pb-3 pr-6">Signed Document</th>
                <th className="pb-3 pr-6"></th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc) => {
                const signersList = buildSigners(doc);
                // Find the first person in the sequence who has NOT signed yet
                const nextSigner = signersList.find((s) => !s.isSigned);

                const hasSubmittedDoc = !!doc.signedDocument;

                return (
                  <tr
                    key={doc._id}
                    className="group cursor-pointer border-b border-gray-100 transition-colors hover:bg-gray-50"
                    onClick={() => setSelectedDoc(doc)}
                  >
                    {/* ── Employee name + designation ── */}
                    <td className="py-3.5 pr-6 font-medium text-gray-900">
                      <div className="flex items-center gap-2">
                        <div>
                          <p className="font-semibold leading-tight text-gray-900">
                            {fullName(doc.employeeId)}
                          </p>
                          {getDesignations(doc.employeeId) && (
                            <p className="text-xs font-medium text-theme">
                              {getDesignations(doc.employeeId)}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* ── Status: Who is going to sign now ── */}
                    <td className="py-3.5 pr-6">
                      {nextSigner ? (
                        <div>
                          <p className="font-semibold text-gray-800">
                            {nextSigner.name}
                          </p>
                          {nextSigner.designation && (
                            <p className="text-xs font-medium text-theme">
                              {nextSigner.designation}
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-600">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Completed
                        </span>
                      )}
                    </td>

                    {/* ── Submitted Document — opens in new window ── */}
                    <td className="py-3.5" onClick={(e) => e.stopPropagation()}>
                      {hasSubmittedDoc ? (
                        <Button
                          size="sm"
                          onClick={() =>
                            window.open(doc.signedDocument, '_blank')
                          }
                        >
                          <FileSignature className="mr-1.5 h-3.5 w-3.5" />
                          View Document
                          <ExternalLink className="ml-1.5 h-3 w-3 opacity-70" />
                        </Button>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                    <td className="py-3.5" onClick={(e) => e.stopPropagation()}>
                      {!nextSigner && (
                        <Button size="sm" onClick={() => setDocToSaveToProfile(doc)}>
                          <UserCheck className="mr-1.5 h-3.5 w-3.5" />
                          Save To Profile
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* ── RIGHT: Sidebar (Timeline & Overview) ── */}
        <div className="flex w-full flex-col gap-6 lg:w-72 lg:shrink-0">
          {/* Global Timeline Card */}
          <Card className="border border-gray-200 shadow-sm">
            <CardHeader className="p-4 pb-3 pt-4">
              <CardTitle className="text-sm font-bold text-gray-700">
                Signing Sequence
              </CardTitle>
              <p className="text-xs text-gray-600">
                Order in which signatures are collected
              </p>
            </CardHeader>
            <CardContent className="px-4 pb-5">
              <div className="relative flex flex-col gap-0">
                {globalTimeline.map((step, i) => {
                  const isLast = i === globalTimeline.length - 1;
                  return (
                    <div
                      key={i}
                      className="relative flex items-start gap-3 pb-5"
                    >
                      {/* Vertical connector line */}
                      {!isLast && (
                        <div className="absolute bottom-0 left-[7px] top-[18px] w-[2px] bg-gray-200" />
                      )}
                      {/* Dot */}
                      <div
                        className={cn(
                          'z-10 mt-0.5 h-3.5 w-3.5 shrink-0 rounded-full ring-[3px] ring-white',
                          step.dotColor
                        )}
                      />
                      {/* Text */}
                      <div>
                        <p className="text-sm font-medium text-gray-800">
                          {step.label}
                        </p>
                        {step.designation && (
                          <p className="text-xs font-medium text-theme">
                            {step.designation}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {analyticsTimeline.length > 0 && (
            <Card className="border border-gray-200 shadow-sm">
              <CardHeader className="p-4 pb-3 pt-4">
                <CardTitle className="text-sm font-bold text-gray-700">
                  Analytics
                </CardTitle>
                <p className="text-xs text-gray-600">
                  Documents currently waiting at each stage
                </p>
              </CardHeader>
              <CardContent className="px-4 pb-5">
                <div className="relative flex flex-col gap-0">
                  {analyticsTimeline.map((step, i) => {
                    const isLast = i === analyticsTimeline.length - 1;
                    return (
                      <div
                        key={i}
                        className="relative flex items-start gap-3 pb-5"
                      >
                        {/* Vertical connector line */}
                        {!isLast && (
                          <div className="absolute bottom-0 left-[7px] top-[18px] w-[2px] bg-gray-200" />
                        )}
                        {/* Dot */}
                        <div
                          className={cn(
                            'z-10 mt-0.5 h-3.5 w-3.5 shrink-0 rounded-full ring-[3px] ring-white',
                            step.dotColor
                          )}
                        />
                        {/* Content */}
                        <div className="flex flex-1 items-center justify-between gap-2">
                          <div>
                            <p className="text-sm font-medium text-gray-800">
                              {step.label}
                            </p>
                            {step.designation && (
                              <p className="text-xs font-medium text-theme">
                                {step.designation}
                              </p>
                            )}
                          </div>
                          {/* Pending Badge */}
                          <div className="shrink-0">
                            <span className="inline-flex items-center justify-center rounded-full border border-orange-200 bg-orange-50 px-2.5 py-0.5 text-xs font-semibold text-orange-600">
                              {step.pendingCount}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* ── Employee Detail Dialog ── */}
      {selectedDoc && (
        <EmployeeDocDialog
          doc={selectedDoc}
          open={!!selectedDoc}
          onClose={() => setSelectedDoc(null)}
        />
      )}


      <SaveToProfile
        isOpen={!!docToSaveToProfile}
        document={docToSaveToProfile}
        onClose={() => setDocToSaveToProfile(null)}
        employeeId={docToSaveToProfile?.employeeId?._id}
      />
    </div>
  );
}

export default SignatureDocumentDetail;
