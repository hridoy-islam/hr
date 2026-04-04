import type React from 'react';
import { useEffect, useState } from 'react';
import {
  FileText,
  Eye,
  FileSignature,
  CheckCircle2,
  Clock,
  Loader2
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

// ✅ FIX: Added envelopeId to the interface
interface SignatureDoc {
  _id: string;
  content: string;
  document: string;
  employeeId: string;
  companyId: string;
  envelopeId?: string | null;   // <-- added
  signedDocument?: string;
  status: 'pending' | 'submitted';
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
        params: { employeeId: eid, companyId: id, page, limit }
      });
      const result = res.data?.data?.result || res.data || [];
      setDocuments(result);
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

  // 1. Initial fetch
  useEffect(() => {
    fetchDocuments(currentPage, entriesPerPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eid, id, currentPage, entriesPerPage]);

  // 2. Detect DocuSign redirect
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    if (searchParams.get('event') === 'signing_complete') {
      setIsProcessingSignature(true);
      setPollAttempts(0);
      searchParams.delete('event');
      const newSearch = searchParams.toString();
      const newUrl = newSearch
        ? `${location.pathname}?${newSearch}`
        : location.pathname;
      navigate(newUrl, { replace: true });
    }
  }, [location, navigate]);

  // 3. Polling mechanism
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

  // 4. Stop polling when done
  useEffect(() => {
    if (!isProcessingSignature || documents.length === 0) return;
    const justSignedDoc = documents.find((doc) => {
      if (doc.status !== 'submitted') return false;
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
        description:
          'DocuSign is taking a little longer than usual. Please refresh in a few minutes.'
      });
    }
  }, [documents, isProcessingSignature, pollAttempts, toast]);

  // ✅ FIX: Renamed from handleSignNow to handleSignDocument (was causing a crash)
  const handleSignDocument = async (signatureDocId: string) => {
    setSigningDocId(signatureDocId);
    try {
      const response = await axiosInstance.post(
        `/signature-documents/initiate-signing/${signatureDocId}`,
       
      );
      const signingUrl =
        response.data?.data?.signingUrl || response.data?.signingUrl;
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
          Signature Requests
        </h2>
      </div>

      {/* Processing Banner */}
      {isProcessingSignature && (
        <div className="mb-6 flex items-center justify-center gap-3 rounded-md border border-blue-200 bg-blue-50 p-4 text-blue-800">
          <Loader2 className="h-5 w-5 animate-spin text-theme" />
          <div>
            <p className="font-medium">Finalizing your signature...</p>
            <p className="text-sm text-theme/80">
              Waiting for DocuSign to seal the document. This usually takes
              about 15–30 seconds.
            </p>
          </div>
        </div>
      )}

      <div className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Document Details</TableHead>
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
              documents.map((doc) => (
                <TableRow key={doc._id} className="hover:bg-gray-50">
                  {/* Document Info */}
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium text-gray-900">
                        {doc.content || 'Document Request'}
                      </span>
                      {/* ✅ Only show "View Document" link if it's not a template */}
                      {doc.document && doc.document !== 'docusign-template-used' && (
                        <a
                          href={doc.document}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-1 flex items-center gap-1 text-xs text-theme hover:underline"
                        >
                          <Eye className="h-3 w-3" /> View Document
                        </a>
                      )}
                    </div>
                  </TableCell>

                  {/* Date Requested */}
                  <TableCell>
                    <span className="text-sm text-gray-600">
                      {moment(doc.createdAt).format('DD MMM YYYY')}
                    </span>
                  </TableCell>

                  {/* Status */}
                  <TableCell>
                    <Badge
                      className={cn(
                        'px-2.5 py-0.5 text-xs font-medium',
                        doc.status === 'submitted'
                          ? 'bg-green-100 text-green-800 hover:bg-green-100'
                          : 'bg-amber-100 text-amber-800 hover:bg-amber-100'
                      )}
                    >
                      {doc.status === 'submitted' ? (
                        <span className="flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" /> Submitted
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" /> Pending
                        </span>
                      )}
                    </Badge>
                  </TableCell>

                  {/* Actions */}
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {doc.status === 'pending' ? (
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
                          ) : doc.envelopeId ? (
                            // ✅ Has envelopeId → ready to sign via DocuSign
                            <span className="flex items-center gap-2">
                              <FileSignature className="h-4 w-4" /> Submit Document
                            </span>
                          ) : (
                            // ✅ No envelopeId yet → still being processed
                            <span className="flex items-center gap-2">
                              <FileSignature className="h-4 w-4" /> Sign Document
                            </span>
                          )}
                        </Button>
                      ) : (
                        doc.signedDocument && (
                          <Button
                            onClick={() => window.open(doc.signedDocument, '_blank')}
                            size="sm"
                            variant="outline"
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View Submitted Doc
                          </Button>
                        )
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
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