import { useState } from 'react';
import { FileText } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface DocumentRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (request: any) => void;
}

const documentTypes = [
  'Employment Certificate',
  'Payslip',
  'Tax Certificate',
  'Reference Letter',
  'Salary Certificate',
  'Experience Letter',
  'Increment Letter',
  'Promotion Letter'
];

export const DocumentRequestModal = ({ isOpen, onClose, onSubmit }: DocumentRequestModalProps) => {
  const [documentType, setDocumentType] = useState('');
  const [customDocumentType, setCustomDocumentType] = useState('');
  const [reason, setReason] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');

  const handleSubmit = () => {
    const finalDocumentType = documentType === 'custom' ? customDocumentType : documentType;
    
    if (!finalDocumentType || !reason.trim()) return;

    const newRequest = {
      id: `DOC${Date.now()}`,
      staffId: 'STAFF001',
      staffName: 'Current User',
      staffEmail: 'current.user@company.com',
      department: 'Current Department',
      documentType: finalDocumentType,
      requestDate: new Date().toISOString().split('T')[0],
      status: 'pending' as const,
      reason: reason.trim(),
      priority
    };

    onSubmit(newRequest);
    
    // Reset form
    setDocumentType('');
    setCustomDocumentType('');
    setReason('');
    setPriority('medium');
    
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-green-600" />
            Request Document
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="documentType">Document Type *</Label>
            <Select value={documentType} onValueChange={setDocumentType}>
              <SelectTrigger>
                <SelectValue placeholder="Select document type" />
              </SelectTrigger>
              <SelectContent>
                {documentTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
                <SelectItem value="custom">Other (specify below)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {documentType === 'custom' && (
            <div className="space-y-2">
              <Label htmlFor="customDocumentType">Custom Document Type *</Label>
              <Input
                id="customDocumentType"
                value={customDocumentType}
                onChange={(e) => setCustomDocumentType(e.target.value)}
                placeholder="Enter document type"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="priority">Priority</Label>
            <Select value={priority} onValueChange={(value: any) => setPriority(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low Priority</SelectItem>
                <SelectItem value="medium">Medium Priority</SelectItem>
                <SelectItem value="high">High Priority</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Purpose/Reason *</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Please explain why you need this document..."
              className="min-h-[80px]"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={
              (!documentType || (documentType === 'custom' && !customDocumentType.trim()) || !reason.trim())
            }
            className="bg-supperagent hover:bg-supperagent/90 text-white"
          >
            Submit Request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};