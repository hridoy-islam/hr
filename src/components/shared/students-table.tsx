import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Eye, Trash2Icon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';

export function StudentsTable({ students, handleStatusChange }) {
  const { user } = useSelector((state: any) => state.auth);
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Reference No</TableHead>
          <TableHead>Student Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Phone</TableHead>
          {/* <TableHead>Type</TableHead> */}
          {/* <TableHead>Status</TableHead> */}
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {students.length > 0 &&
          students?.map((student, index) => (
            <TableRow key={student._id}>
              <TableCell>
                <Link to={`${student._id}`}>{student.refId}</Link>
              </TableCell>
              <TableCell>
                <Link to={`${student._id}`}>
                  {student.firstName} {student.lastName}
                </Link>
              </TableCell>
              <TableCell>
                <Link to={`${student._id}`}>{student.email}</Link>
              </TableCell>
              <TableCell>
                <Link to={`${student._id}`}>{student.phone}</Link>
              </TableCell>
              {/* <TableCell>
                <Switch
                  checked={student.status == 1}
                  onCheckedChange={(checked) =>
                    handleStatusChange(student.id, checked)
                  }
                  className="mx-auto"
                />
              </TableCell> */}
              <TableCell className="text-right">
                <div className="flex justify-end space-x-2">
                  <Link to={`${student._id}`}>
                    <Button variant="outline" size="icon">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </Link>
                  {user.role === 'admin' && (
                    <Button variant="destructive" size="icon">
                      <Trash2Icon className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
      </TableBody>
    </Table>
  );
}
