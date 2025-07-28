import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';

type TAlertModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
  title?: string;
  description?: string;
  children?: React.ReactNode; // Allow children as a prop
};
export const AlertModal = ({
  isOpen,
  onClose,
  onConfirm,
  loading,
  title = 'Are you sure?',
  description = 'Are you sure you want to continue?',
  children
}: TAlertModalProps) => {
  return (
    <Modal
      title={title}
      description={description}
      isOpen={isOpen}
      onClose={onClose}
    >
      {children}
      <div className="flex w-full items-center justify-end space-x-2 pt-6">
        <Button disabled={loading} variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button disabled={loading}  className='bg-supperagent text-white hover:bg-supperagent' onClick={onConfirm}>
          Continue
        </Button>
      </div>
    </Modal>
  );
};
