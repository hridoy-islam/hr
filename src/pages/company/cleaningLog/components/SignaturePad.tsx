import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState
} from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { Clock, Eraser, PenLine, RotateCcw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import axiosInstance from '@/lib/axios';
import { formatDateTime } from '../shared';

interface SignaturePadProps {
  entityId: string;
  // A signature already on the log (edit) - kept unless the person signs again
  signatureUrl: string;
  signedAt: string | null;
  disabled?: boolean;
  onDraw?: () => void;
  error?: string;
}

export interface SignatureResult {
  signatureUrl: string;
  signedAt: string;
}

export interface SignaturePadHandle {
  // True when there is neither a kept signature nor ink on the canvas
  isEmpty: () => boolean;
  // Uploads the drawn signature (or hands back the kept one); throws on failure
  save: () => Promise<SignatureResult>;
}

const CANVAS_HEIGHT = 160;

export const SignaturePad = forwardRef<SignaturePadHandle, SignaturePadProps>(
  function SignaturePad(
    { entityId, signatureUrl, signedAt, disabled, onDraw, error },
    ref
  ) {
    const signatureRef = useRef<SignatureCanvas>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);
    // The moment the person signed, not the moment the upload finished
    const signedMomentRef = useRef<string | null>(null);
    const [isEditing, setIsEditing] = useState(!signatureUrl);
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

    useImperativeHandle(ref, () => ({
      isEmpty: () => {
        if (!isEditing) return !signatureUrl;
        const pad = signatureRef.current;
        return !pad || pad.isEmpty();
      },
      save: async () => {
        if (!isEditing && signatureUrl) {
          return {
            signatureUrl,
            signedAt: signedAt || new Date().toISOString()
          };
        }

        const pad = signatureRef.current;
        if (!pad || pad.isEmpty()) throw new Error('Signature is empty');

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

        return {
          signatureUrl: url,
          signedAt: signedMomentRef.current || new Date().toISOString()
        };
      }
    }));

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
              disabled={disabled}
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
              onEnd={() => {
                signedMomentRef.current = new Date().toISOString();
                onDraw?.();
              }}
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
            disabled={disabled}
            onClick={() => {
              signatureRef.current?.clear();
              signedMomentRef.current = null;
            }}
          >
            <Eraser className="mr-1.5 h-4 w-4" /> Clear
          </Button>
          {signatureUrl && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={disabled}
              onClick={() => setIsEditing(false)}
            >
              Keep previous
            </Button>
          )}
        </div>

        {error && <p className="text-xs font-medium text-red-500">{error}</p>}
      </div>
    );
  }
);
