import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Save, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import axiosInstance from '@/lib/axios';

// 1. Define the Zod Validation Schema
const docusignSchema = z.object({
  clientId: z.string().trim().min(1, 'Client ID (Integration Key) is required'),
  userId: z.string().trim().min(1, 'User ID is required'),
  accountId: z.string().trim().min(1, 'Account ID is required'),
  rsaPrivateKey: z
    .string()
    .trim()
    .min(1, 'RSA Private Key is required')
    .includes('-----BEGIN RSA PRIVATE KEY-----', {
      message: 'Must contain a valid RSA Private Key format',
    }),
});

// Infer the TypeScript type from the Zod schema
type DocusignFormValues = z.infer<typeof docusignSchema>;

export default function CompanyDocusignDetailsPage() {
  const { id } = useParams(); // id = companyId
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);

  // Track whether existing data was loaded from the server
  const [hasExistingData, setHasExistingData] = useState(false);
  const [docusignId, setDocusignId] = useState<string | null>(null);

  // 2. Initialize React Hook Form
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<DocusignFormValues>({
    resolver: zodResolver(docusignSchema),
    defaultValues: {
      clientId: '',
      userId: '',
      accountId: '',
      rsaPrivateKey: '',
    },
  });

  // 3. Fetch Existing Details on Mount
  useEffect(() => {
    const fetchDocusignDetails = async () => {
      if (!id) return;
      try {
        setIsLoading(true);
        const res = await axiosInstance.get(`/docusign-details?companyId=${id}`);
        const docusignDetails = res.data?.data.result[0];

        // If data exists, populate the form and mark as existing
        if (docusignDetails) {
          reset({
            clientId: docusignDetails.clientId || '',
            userId: docusignDetails.userId || '',
            accountId: docusignDetails.accountId || '',
            rsaPrivateKey: docusignDetails.rsaPrivateKey || '',
          });
          setDocusignId(docusignDetails._id);
          setHasExistingData(true);
        }
      } catch (error: any) {
        // If it's a 404, it just means they haven't set it up yet, which is fine.
        if (error.response?.status !== 404) {
          toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Failed to fetch DocuSign details.',
          });
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchDocusignDetails();
  }, [id, reset, toast]);

  // 4. Handle Form Submission
  // - POST when no existing data (first-time save)
  // - PATCH when existing data has been changed (update)
  const onSubmit = async (data: DocusignFormValues) => {
    try {
      if (hasExistingData) {
        // Update existing credentials via PATCH
        await axiosInstance.patch(`/docusign-details/${docusignId}`, {
          ...data,
          companyId: id,
        });
        toast({
          title: 'Success',
          description: 'DocuSign credentials updated successfully.',
        });
      } else {
        // Create new credentials via POST
        await axiosInstance.post('/docusign-details', {
          ...data,
          companyId: id,
        });
        toast({
          title: 'Success',
          description: 'DocuSign credentials saved successfully.',
        });
      }

      // After a successful save/update, reset the dirty state
      // so the button reverts back correctly
      reset(data);

      // Mark as existing data after first successful save
      if (!hasExistingData) {
        setHasExistingData(true);
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: `Error ${hasExistingData ? 'updating' : 'saving'} details`,
        description: error.response?.data?.message || 'Something went wrong.',
      });
    }
  };

  // Determine button state:
  // - No existing data → always show "Save Credentials"
  // - Existing data + no changes → show disabled "Update Credentials"
  // - Existing data + has changes (isDirty) → show active "Update Credentials"
  const isUpdateMode = hasExistingData;
  const isButtonDisabled = isSubmitting || (isUpdateMode && !isDirty);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="relative space-y-6 mx-auto bg-white p-4 shadow-md rounded-md">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">
          DocuSign Integration
        </h2>
        <p className="text-sm mt-1">
          Configure your DocuSign API credentials to enable template creation and digital signatures.
        </p>
      </div>

      <div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Client ID */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">
                Integration Key (Client ID)
              </label>
              <Input
                {...register('clientId')}
                placeholder="e.g. 0e0d84cb-0c65-444b..."
                className={errors.clientId ? 'border-red-500' : ''}
              />
              {errors.clientId && (
                <p className="text-xs text-red-500">{errors.clientId.message}</p>
              )}
            </div>

            {/* User ID */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">
                User ID
              </label>
              <Input
                {...register('userId')}
                placeholder="e.g. e6755682-1321-4339..."
                className={errors.userId ? 'border-red-500' : ''}
              />
              {errors.userId && (
                <p className="text-xs text-red-500">{errors.userId.message}</p>
              )}
            </div>
          </div>

          {/* Account ID */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">
              Account ID
            </label>
            <Input
              {...register('accountId')}
              placeholder="e.g. 0654b91c-db1a-42ed..."
              className={errors.accountId ? 'border-red-500' : ''}
            />
            {errors.accountId && (
              <p className="text-xs text-red-500">{errors.accountId.message}</p>
            )}
          </div>

          {/* RSA Private Key */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">
              RSA Private Key
            </label>
            <Textarea
              {...register('rsaPrivateKey')}
              placeholder="-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----"
              className={`font-mono text-xs min-h-[250px] resize-y ${
                errors.rsaPrivateKey ? 'border-red-500' : ''
              }`}
            />
            {errors.rsaPrivateKey && (
              <p className="text-xs text-red-500">
                {errors.rsaPrivateKey.message}
              </p>
            )}
            <p className="text-xs text-gray-500">
              Paste the entire RSA Private key exactly as generated by DocuSign, including the BEGIN and END lines.
            </p>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={isButtonDisabled}
              className="bg-theme text-white hover:bg-theme/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isUpdateMode ? 'Updating...' : 'Saving...'}
                </>
              ) : isUpdateMode ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" /> Update Credentials
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" /> Save Credentials
                </>
              )}
            </Button>
          </div>

        </form>
      </div>
    </div>
  );
}