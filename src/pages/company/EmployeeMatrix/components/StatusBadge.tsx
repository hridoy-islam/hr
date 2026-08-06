import { Badge } from '@/components/ui/badge';
import {
  CheckCircle,
  Clock,
  AlertTriangle,
  AlertCircle,
  UserX
} from 'lucide-react';

const STATUS_CONFIG: Record<
  string,
  { label: string; className: string; icon: React.ReactNode }
> = {
  completed: {
    label: 'Completed',
    className: 'border-green-200 bg-green-100 text-green-700 hover:bg-green-200',
    icon: <CheckCircle className="h-3 w-3" />
  },
  'in-progress': {
    label: 'In Progress',
    className: 'border-blue-200 bg-blue-100 text-blue-700 hover:bg-blue-200',
    icon: <Clock className="h-3 w-3" />
  },
  'expiring-soon': {
    label: 'Expiring Soon',
    className:
      'border-orange-200 bg-orange-100 text-orange-700 hover:bg-orange-200',
    icon: <AlertTriangle className="h-3 w-3" />
  },
  expired: {
    label: 'Expired',
    className: 'border-red-200 bg-red-100 text-red-700 hover:bg-red-200',
    icon: <AlertCircle className="h-3 w-3" />
  },
  missing: {
    label: 'Not Assigned',
    className: 'border-rose-200 bg-rose-100 text-rose-700 hover:bg-rose-200',
    icon: <UserX className="h-3 w-3" />
  },
  optional: {
    label: 'Optional',
    className: 'border-purple-200 bg-purple-100 text-purple-700 hover:bg-purple-200',
    icon: <Clock className="h-3 w-3" />
  }
};

export const StatusBadge = ({ status }: { status: string }) => {
  const config = STATUS_CONFIG[status] || {
    label: status,
    className: 'border-gray-200 bg-gray-100 text-gray-700 hover:bg-gray-200',
    icon: <Clock className="h-3 w-3" />
  };
  return (
    <Badge className={`gap-1 px-3 py-1 ${config.className}`}>
      {config.icon} {config.label}
    </Badge>
  );
};
