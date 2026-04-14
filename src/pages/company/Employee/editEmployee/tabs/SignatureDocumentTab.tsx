import type React from 'react';
import { useEffect, useState } from 'react';
import {
  FileText,
  Eye,
  FileSignature,
  CheckCircle2,
  Clock,
  Loader2,
  Mail
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import axiosInstance from '@/lib/axios';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import moment from '@/lib/moment-setup';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { BlinkingDots } from '@/components/shared/blinking-dots';
import { DynamicPagination } from '@/components/shared/DynamicPagination';

interface SignatureDoc {
  _id: string;
  content: string;
  document: string;
  employeeId: any; 
  companyId: string;
  approverIds?: any[]; 
  signedBy?: any[]; 
  envelopeId?: string | null;
  signedDocument?: string;
  status: 'pending' | 'submitted' | 'forwarded' | 'completed' | 'rejected';
  submittedAt?: string;
  createdAt: string;
  updatedAt: string;
}

function SignatureDocumentTab() {
  const { id, eid } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(50);
  const [documents, setDocuments] = useState<SignatureDoc[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [signingDocId, setSigningDocId] = useState<string | null>(null);
  const [isProcessingSignature, setIsProcessingSignature] = useState(false);
  const [pollAttempts, setPollAttempts] = useState(0);

  const fetchDocuments = async (page: number, limit: number) => {
    if (!eid) return;
    try {
      const res = await axiosInstance.get(`/signature-documents`, {
        params: { employeeId: eid, approverIds: eid, companyId: id, page, limit }
      });

      const docs = res.data?.data?.result || res.data || [];

      docs.sort((a: SignatureDoc, b: SignatureDoc) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      setDocuments(docs);
      setTotalPages(res?.data?.data?.meta?.totalPage || 1);
    } catch (err) {
      console.error('Error fetching signature documents:', err);
      if (!isProcessingSignature) {
        toast({
          title: 'Failed to load documents.',
          className: 'bg-destructive text-white'
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments(currentPage, entriesPerPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eid, id, currentPage, entriesPerPage]);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    if (searchParams.get('event') === 'signing_complete') {
      setIsProcessingSignature(true);
      setPollAttempts(0);
      searchParams.delete('event');
      const newSearch = searchParams.toString();
      const newUrl = newSearch ? `${location.pathname}?${newSearch}` : location.pathname;
      navigate(newUrl, { replace: true });
    }
  }, [location, navigate]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isProcessingSignature) {
      interval = setInterval(() => {
        fetchDocuments(currentPage, entriesPerPage);
        setPollAttempts((prev) => prev + 1);
      }, 5000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isProcessingSignature]);

  useEffect(() => {
    if (!isProcessingSignature || documents.length === 0) return;
    const justSignedDoc = documents.find((doc) => {
      if (doc.status !== 'submitted' && doc.status !== 'completed') return false;
      const updatedTime = moment(doc.submittedAt || doc.updatedAt);
      return moment().diff(updatedTime, 'seconds') < 120;
    });
    
    if (justSignedDoc) {
      setIsProcessingSignature(false);
      toast({
        title: 'Signature Complete!',
        description: 'Your document has been successfully processed and saved.'
      });
    } else if (pollAttempts >= 12) {
      setIsProcessingSignature(false);
      toast({
        title: 'Still Processing',
        description: 'DocuSign is taking a little longer than usual. Please refresh in a few minutes.'
      });
    }
  }, [documents, isProcessingSignature, pollAttempts, toast]);

  const handleSignDocument = async (signatureDocId: string) => {
    setSigningDocId(signatureDocId);
    try {
      const response = await axiosInstance.post(
        `/signature-documents/initiate-signing/${signatureDocId}`,
        { signerId: eid, layout: 'adminLayout' } 
      );
      const signingUrl = response.data?.data?.signingUrl || response.data?.signingUrl;
      if (signingUrl) {
        window.location.href = signingUrl;
      } else {
        throw new Error('No signing URL returned');
      }
    } catch (error) {
      console.error('Error initiating signing:', error);
      toast({
        title: 'Failed to initiate signing process.',
        description: 'Please try again later.',
        className: 'bg-destructive text-white'
      });
      setSigningDocId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 w-full items-center justify-center">
        <BlinkingDots size="large" color="bg-theme" />
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-xl font-semibold text-gray-900">
          <FileSignature className="h-6 w-6 text-theme" />
          Document Requests
        </h2>
      </div>

      {isProcessingSignature && (
        <div className="mb-6 flex items-center justify-center gap-3 rounded-md border border-blue-200 bg-blue-50 p-4 text-blue-800">
          <Loader2 className="h-5 w-5 animate-spin text-theme" />
          <div>
            <p className="font-medium">Finalizing your signature...</p>
            <p className="text-sm text-theme/80">
              Waiting for DocuSign to seal the document. This usually takes about 15–30 seconds.
            </p>
          </div>
        </div>
      )}

      <div className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Document Details</TableHead>
              <TableHead>Recipient</TableHead>
              <TableHead>Date Requested</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {documents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="py-12 text-center text-gray-500">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <FileText className="h-8 w-8 text-gray-300" />
                    <p>No signature documents found.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              documents.map((doc) => {
                // 1. Identify the Employee ID
                const empIdStr = typeof doc.employeeId === 'string' 
                  ? doc.employeeId 
                  : doc.employeeId?._id;
                
                const isEmployee = empIdStr === eid;

                // 2. Identify who has already signed
                const signedUserIds = doc.signedBy?.map((s: any) => 
                  typeof s.userId === 'string' ? s.userId : s.userId?._id
                ) || [];

                const hasAlreadySigned = signedUserIds.includes(eid);
                const employeeHasSigned = signedUserIds.includes(empIdStr);

                // 3. Identify if current user is an approver
                const approverMatch = doc.approverIds?.find((app: any) => {
                  const appIdStr = typeof app.userId === 'string' ? app.userId : app.userId?._id;
                  return appIdStr === eid;
                });

                // 4. LOGIC: Is it my turn to sign?
                let isMyTurn = false;

                if (!hasAlreadySigned && doc.status !== 'completed') {
                  if (isEmployee) {
                    // Employee goes first
                    isMyTurn = true;
                  } else if (approverMatch) {
                    // Approver logic
                    if (employeeHasSigned) {
                      // Check if any approvers with a lower index HAVEN'T signed yet
                      const waitingOnPrevious = doc.approverIds?.some((app: any) => {
                        const previousAppIdStr = typeof app.userId === 'string' ? app.userId : app.userId?._id;
                        return app.index < approverMatch.index && !signedUserIds.includes(previousAppIdStr);
                      });

                      if (!waitingOnPrevious) {
                        isMyTurn = true; // Employee signed, and all previous approvers signed
                      }
                    }
                  }
                }

                // 🚀 NEW UI Logic for displayed Status
                let displayStatus = doc.status;

                if (doc.status === 'completed') {
                  displayStatus = 'completed'; // If it's completely done, show completed
                } else if (!hasAlreadySigned) {
                  displayStatus = 'pending'; // If the current user hasn't signed it yet, show pending
                }

                return (
                  <TableRow key={doc._id} className="hover:bg-gray-50">
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-900">
                          {doc.content || 'Document Request'}
                        </span>
                        {doc.document && doc.document !== 'docusign-template-used' && (
                          <a
                            href={doc.document}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-1 flex items-center gap-1 text-xs text-theme hover:underline"
                          >
                            <Eye className="h-3 w-3" /> View Original
                          </a>
                        )}
                      </div>
                    </TableCell>

                    <TableCell>
                      {doc?.employeeId?.firstName} {doc?.employeeId?.lastName}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-600">
                        {moment(doc.createdAt).format('DD MMM YYYY')}
                      </span>
                    </TableCell>

                    <TableCell>
                      <Badge
                        className={cn(
                          'px-2.5 py-0.5 text-xs font-medium',
                          displayStatus === 'completed' ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100' :
                          displayStatus === 'submitted' ? 'bg-green-100 text-green-800 hover:bg-green-100' :
                          displayStatus === 'forwarded' ? 'bg-orange-100 text-orange-800 hover:bg-orange-100' :
                          'bg-amber-100 text-amber-800 hover:bg-amber-100'
                        )}
                      >
                        {displayStatus === 'completed' && <CheckCircle2 className="mr-1 h-3 w-3 inline" />}
                        {displayStatus === 'submitted' && <CheckCircle2 className="mr-1 h-3 w-3 inline" />}
                        {displayStatus === 'forwarded' && <Clock className="mr-1 h-3 w-3 inline" />}
                        {displayStatus === 'pending' && <Clock className="mr-1 h-3 w-3 inline" />}
                        
                        <span className="capitalize">{displayStatus}</span>
                      </Badge>
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex justify-end items-center gap-2">
                        
                        {/* 🚀 Render Button ONLY if it is the user's explicit turn */}
                        {isMyTurn && (
                          <Button
                            onClick={() => handleSignDocument(doc._id)}
                            disabled={signingDocId === doc._id}
                            size="sm"
                            className="bg-theme text-white hover:bg-theme/90"
                          >
                            {signingDocId === doc._id ? (
                              <span className="flex items-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Preparing...
                              </span>
                            ) : (
                              <span className="flex items-center gap-2">
                                <FileSignature className="h-4 w-4" /> Submit Document
                              </span>
                            )}
                          </Button>
                        )}

                        {/* Always show signed/completed document if it exists */}
                        {doc.signedDocument && hasAlreadySigned && (
                          <Button
                            onClick={() => window.open(doc.signedDocument, '_blank')}
                            size="sm"
                            variant="outline"
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View Submitted Doc
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>

        {documents.length > 30 && (
          <DynamicPagination
            pageSize={entriesPerPage}
            setPageSize={setEntriesPerPage}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        )}
      </div>
    </div>
  );
}

export default SignatureDocumentTab;