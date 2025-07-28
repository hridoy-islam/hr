import React, { useState, useMemo } from 'react';
import Select from 'react-select';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Eye, Search } from 'lucide-react';
import { DynamicPagination } from '@/components/shared/DynamicPagination';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';

// Mock Data
const mockServiceUsers = [
  {
    _id: '1',
    title: 'Mr.',
    firstName: 'John',
    initial: 'D',
    lastName: 'Doe',
    address: '123 Main St',
    city: 'Springfield',
    mobilePhone: '555-1234',
    status: 'active',
    type: 'Inpatient',
    area: 'North Wing',
  },
  {
    _id: '2',
    title: 'Ms.',
    firstName: 'Jane',
    initial: '',
    lastName: 'Smith',
    address: '456 Elm St',
    city: 'Shelbyville',
    mobilePhone: '555-5678',
    status: 'block',
    type: 'Outpatient',
    area: 'South Wing',
  },
  {
    _id: '3',
    title: 'Dr.',
    firstName: 'Alice',
    initial: 'M',
    lastName: 'Johnson',
    address: '789 Oak St',
    city: 'Ogdenville',
    mobilePhone: '555-9012',
    status: 'active',
    type: 'Inpatient',
    area: 'East Wing',
  },
  // Add more mock users here to test pagination
  // ...
];

// React Select options
const typeOptions = [
  { value: 'all', label: 'All Types' },
  { value: 'Inpatient', label: 'Inpatient' },
  { value: 'Outpatient', label: 'Outpatient' },
];

const statusOptions = [
  { value: 'all', label: 'All Statuses' },
  { value: 'active', label: 'Active' },
  { value: 'block', label: 'Blocked' },
];

const areaOptions = [
  { value: 'all', label: 'All Areas' },
  { value: 'North Wing', label: 'North Wing' },
  { value: 'South Wing', label: 'South Wing' },
  { value: 'East Wing', label: 'East Wing' },
];

export default function ServiceUserList() {
  const [users, setUsers] = useState(mockServiceUsers);

  // Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState(typeOptions[0]);
  const [statusFilter, setStatusFilter] = useState(statusOptions[0]);
  const [areaFilter, setAreaFilter] = useState(areaOptions[0]);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(5);

  // Handle status toggle
  const handleStatusChange = (id: string, checked: boolean) => {
    setUsers((prev) =>
      prev.map((user) =>
        user._id === id ? { ...user, status: checked ? 'active' : 'block' } : user
      )
    );
  };


  const navigate = useNavigate()

  // Handle view action
  const handleView = (id: string) => {
   navigate(`/admin/people-planner/service-user/${id}`);
  };

  // Filtering logic
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const fullName = [user.title, user.firstName, user.initial, user.lastName]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      const phone = user.mobilePhone.toLowerCase();
      const search = searchTerm.toLowerCase();

      if (search && !fullName.includes(search) && !phone.includes(search)) {
        return false;
      }
      if (typeFilter.value !== 'all' && user.type !== typeFilter.value) {
        return false;
      }
      if (statusFilter.value !== 'all' && user.status !== statusFilter.value) {
        return false;
      }
      if (areaFilter.value !== 'all' && user.area !== areaFilter.value) {
        return false;
      }
      return true;
    });
  }, [users, searchTerm, typeFilter, statusFilter, areaFilter]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredUsers.length / entriesPerPage);
  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * entriesPerPage;
    return filteredUsers.slice(startIndex, startIndex + entriesPerPage);
  }, [filteredUsers, currentPage, entriesPerPage]);

  // Reset currentPage if filteredUsers shrink below current page
  React.useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  return (
    <div className="p-6 bg-white rounded-md shadow-md space-y-6">
      <h1 className="text-2xl font-semibold">Service Users</h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-4 items-center">
        <div className='flex items-center gap-2'>

        <Input
          type="text"
          className="border rounded px-3 py-1 min-w-[300px]"
          placeholder="Search by Name or Phone"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          />
<Button className='bg-supperagent hover:bg-supperagent/90 text-white'><Search className='w-4 h-4'></Search>Search</Button>
          </div>
        <div className="w-48">
          <Select
            options={typeOptions}
            value={typeFilter}
            onChange={(option) => option && setTypeFilter(option)}
            isSearchable={false}
          />
        </div>

        <div className="w-48">
          <Select
            options={statusOptions}
            value={statusFilter}
            onChange={(option) => option && setStatusFilter(option)}
            isSearchable={false}
          />
        </div>

        <div className="w-48">
          <Select
            options={areaOptions}
            value={areaFilter}
            onChange={(option) => option && setAreaFilter(option)}
            isSearchable={false}
          />
        </div>
      </div>

      {/* Table */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Address</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {paginatedUsers.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-gray-500 py-4">
                No matching records found.
              </TableCell>
            </TableRow>
          ) : (
            paginatedUsers.map((user) => (
              <TableRow key={user._id}>
                <TableCell>
                  {[user.title, user.firstName, user.initial, user.lastName]
                    .filter(Boolean)
                    .join(' ')}
                </TableCell>

                <TableCell>
                  {[user.address, user.city].filter(Boolean).join(', ')}
                </TableCell>

                <TableCell>{user.mobilePhone}</TableCell>

                <TableCell>
                  <Switch
                    checked={user.status === 'active'}
                    onCheckedChange={(checked) =>
                      handleStatusChange(user._id, checked)
                    }
                  />
                </TableCell>

                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleView(user._id)}
                    className="text-white hover:bg-supperagent/90 bg-supperagent"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {/* Pagination */}
      <DynamicPagination
        pageSize={entriesPerPage}
        setPageSize={setEntriesPerPage}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />
    </div>
  );
}
