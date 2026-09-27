import { useEffect, useRef, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { Clock, Eraser, Loader2, PenLine, RotateCcw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import axiosInstance from '@/lib/axios';
import { formatDateTime } from '../shared';

interface SignaturePadProps {
  entityId: string;
  signatureUrl: string;
  signedAt: string | null;
  onChange: (signatureUrl: string, signedAt: string | null) => void;
  error?: string;
}

const CANVAS_HEIGHT = 160;

export function SignaturePad({
  entityId,
  signatureUrl,
  signedAt,
  onChange,
  error
}: SignaturePadProps) {
  const { toast } = useToast();
  const signatureRef = useRef<SignatureCanvas>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [isEditing, setIsEditing] = useState(!signatureUrl);
  const [isSaving, setIsSaving] = useState(false);
  const [canvasWidth, setCanvasWidth] = useState(0);

  // The canvas is sized in real pixels to its box - scaling it with CSS
  // would put the ink away from the finger on phones
  useEffect(() => {
    if (!isEditing) return;
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const measure = () => setCanvasWidth(Math.floor(wrapper.clientWidth));
    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(wrapper);
    return () => observer.disconnect();
  }, [isEditing]);

  const handleSave = async () => {
    const pad = signatureRef.current;
    if (!pad || pad.isEmpty()) {
      toast({
        title: 'Please sign inside the box first',
        className: 'bg-red-500 border-none text-white'
      });
      return;
    }

    // The moment the person signed, not the moment the upload finished
    const signedMoment = new Date().toISOString();

    try {
      setIsSaving(true);
      const blob = await (await fetch(pad.toDataURL('image/png'))).blob();
      const formData = new FormData();
      formData.append('entityId', entityId);
      formData.append('file_type', 'document');
      formData.append(
        'file',
        new File([blob], `cleaning-signature-${Date.now()}.png`, {
          type: 'image/png'
        })
      );

      const response = await axiosInstance.post('/documents', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const url = response.data?.data?.fileUrl;
      if (!url) throw new Error('No file url returned');

      onChange(url, signedMoment);
      setIsEditing(false);
    } catch (err) {
      toast({
        title: 'Failed to save the signature. Please try again.',
        className: 'bg-red-500 border-none text-white'
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (signatureUrl && !isEditing) {
    return (
      <div className="space-y-3 rounded-xl border border-emerald-200 bg-emerald-50/50 p-4">
        <div className="flex items-center justify-center rounded-lg border border-gray-200 bg-white p-2">
          <img
            src={signatureUrl}
            alt="Signature"
            className="h-24 w-full object-contain"
          />
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-center gap-1.5 text-xs font-medium text-emerald-800 sm:text-sm">
            <Clock className="h-4 w-4" />
            Signed at {formatDateTime(signedAt || undefined)}
          </p>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setIsEditing(true)}
          >
            <RotateCcw className="mr-1.5 h-4 w-4" /> Sign again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div
        ref={wrapperRef}
        className={`relative overflow-hidden rounded-xl border-2 border-dashed bg-white ${
          error ? 'border-red-400' : 'border-gray-300'
        }`}
        style={{ height: CANVAS_HEIGHT }}
      >
        {canvasWidth > 0 && (
          <SignatureCanvas
            ref={signatureRef}
            penColor="black"
            canvasProps={{
              width: canvasWidth,
              height: CANVAS_HEIGHT,
              className: 'touch-none'
            }}
          />
        )}
        <span className="pointer-events-none absolute bottom-2 left-3 flex items-center gap-1 text-[11px] text-black">
          <PenLine className="h-3 w-3" /> Sign here
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isSaving}
          onClick={() => signatureRef.current?.clear()}
        >
          <Eraser className="mr-1.5 h-4 w-4" /> Clear
        </Button>
        {signatureUrl && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={isSaving}
            onClick={() => setIsEditing(false)}
          >
            Keep previous
          </Button>
        )}
        <Button
          type="button"
          size="sm"
          disabled={isSaving}
          className="bg-theme text-white hover:bg-theme/90"
          onClick={handleSave}
        >
          {isSaving ? (
            <>
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Saving...
            </>
          ) : (
            'Save Signature'
          )}
        </Button>
      </div>

      {error && <p className="text-xs font-medium text-red-500">{error}</p>}
    </div>
  );
}
