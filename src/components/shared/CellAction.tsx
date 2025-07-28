import { AlertModal } from '@/components/shared/alert-modal';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Edit, MoreHorizontal, Trash } from 'lucide-react';
import { useState } from 'react';
import axiosInstance from '@/lib/axios'; // Adjust the import based on your file structure
import { useToast } from '@/components/ui/use-toast'; // Import your toast notification hook
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';

interface Field {
  name: string;
  type: string;
  placeholder: string;
}

interface CellActionProps {
  data: any; // Replace with a more specific type if available
  endpoint: string; // API endpoint for deletion
  entityName: string; // Name of the entity for confirmation message
  onDelete: () => void; // Callback to refetch data
  fields: Field[]; // Dynamic fields for the update form
}

export const CellAction: React.FC<CellActionProps> = ({
  data,
  endpoint,
  entityName,
  onDelete,
  fields
}) => {
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [openUpdate, setOpenUpdate] = useState(false);
  const [updatedData, setUpdatedData] = useState({ ...data }); // Store updated dat
  const { toast } = useToast();

  const onConfirm = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.delete(`${endpoint}/${data._id}`);
      if (response.data.success) {
        toast({ title: `${entityName} deleted successfully` });
        // Optionally trigger a refresh or state update
        onDelete();
      } else {
        toast({
          title: `Failed to delete ${entityName}`,
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: `An error occurred while deleting the ${entityName}`,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
      setOpen(false); // Close the modal after the operation
    }
  };

  const onUpdateConfirm = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.patch(
        `${endpoint}/${data._id}`,
        updatedData
      );
      if (response.data.success) {
        toast({ title: `${entityName} updated successfully` });
        onDelete(); // Call the refetch function
      } else {
        toast({
          title: `Failed to update ${entityName}`,
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: `An error occurred while updating the ${entityName}`,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
      setOpenUpdate(false); // Close the update modal
    }
  };

  return (
    <>
      <AlertModal
        isOpen={open}
        onClose={() => setOpen(false)}
        onConfirm={onConfirm}
        loading={loading}
        title={`Confirm Deletion`}
        description={`Are you sure you want to delete this ${entityName}?`}
      />
      {/* Update Modal */}
      <AlertModal
        isOpen={openUpdate}
        onClose={() => setOpenUpdate(false)}
        onConfirm={onUpdateConfirm}
        loading={loading}
        title={`Update ${entityName}`}
        description={`Edit the details of the ${entityName}.`}
      >
        <form>
          {fields.map((field) => {
            if (field.type === 'textarea') {
              return (
                <Textarea
                  key={field.name}
                  name={field.name}
                  value={updatedData[field.name] || ''}
                  onChange={(e) =>
                    setUpdatedData({
                      ...updatedData,
                      [field.name]: e.target.value
                    })
                  }
                  placeholder={field.placeholder}
                  className="mb-4" // Add margin for spacing
                  rows={4} // Specify number of rows for the textarea
                />
              );
            }

            return (
              <Input
                key={field.name}
                type={field.type}
                name={field.name}
                value={updatedData[field.name] || ''}
                onChange={(e) =>
                  setUpdatedData({
                    ...updatedData,
                    [field.name]: e.target.value
                  })
                }
                placeholder={field.placeholder}
                className="mb-4" // Add margin for spacing
              />
            );
          })}
        </form>
      </AlertModal>

      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>

          <DropdownMenuItem onClick={() => setOpenUpdate(true)}>
            <Edit className="mr-2 h-4 w-4" /> Update
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setOpen(true)}>
            <Trash className="mr-2 h-4 w-4" /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};
