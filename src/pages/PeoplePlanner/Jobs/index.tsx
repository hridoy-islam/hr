import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, subDays, addDays } from 'date-fns';
import Select from 'react-select';
import { Calendar as CalendarIcon, Search, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  User,
  MapPin,
  Briefcase,
  FileText,
  CalendarDays,
  Clock,
  BadgeCheck
} from 'lucide-react';

type Job = {
  id: string;
  serviceUser: {
    id: string;
    name: string;
    address: string;
  };
  title: string;
  description: string;
  startTime: Date;
  endTime: Date;
  status: 'pending' | 'allocated' | 'completed' | 'cancelled';
};

type Employee = {
  id: string;
  name: string;
  position: string;
  skills: string[];
};

const fetchJobs = async (
  dateRange: { from: Date; to: Date },
  searchQuery: string
): Promise<Job[]> => {
  // Simulate API call
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Mock data
  const mockJobs: Job[] = [
    {
      id: '1',
      serviceUser: {
        id: 'su1',
        name: 'John Smith',
        address: '123 Main St, London'
      },
      title: 'Morning Visit',
      description: 'Assist with morning routine and medication',
      startTime: addDays(new Date(), 1),
      endTime: addDays(new Date(), 1),
      status: 'pending'
    },
    {
      id: '2',
      serviceUser: {
        id: 'su2',
        name: 'Mary Johnson',
        address: '456 Oak Ave, Manchester'
      },
      title: 'Afternoon Care',
      description: 'Prepare lunch and provide companionship',
      startTime: addDays(new Date(), 2),
      endTime: addDays(new Date(), 2),
      status: 'pending'
    },
    {
      id: '3',
      serviceUser: {
        id: 'su3',
        name: 'Robert Brown',
        address: '789 Pine Rd, Birmingham'
      },
      title: 'Evening Support',
      description: 'Assist with dinner and bedtime routine',
      startTime: addDays(new Date(), 3),
      endTime: addDays(new Date(), 3),
      status: 'allocated'
    }
  ];

  // Filter by date range
  const filteredByDate = mockJobs.filter((job) => {
    return job.startTime >= dateRange.from && job.startTime <= dateRange.to;
  });

  // Filter by search query if provided
  if (searchQuery) {
    return filteredByDate.filter(
      (job) =>
        job.serviceUser.name
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        job.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }

  return filteredByDate;
};

const fetchEmployees = async (): Promise<Employee[]> => {
  // Simulate API call
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Mock data
  return [
    {
      id: 'e1',
      name: 'Sarah Williams',
      position: 'Care Assistant',
      skills: ['Dementia', 'Mobility']
    },
    {
      id: 'e2',
      name: 'David Miller',
      position: 'Senior Carer',
      skills: ['Palliative', 'Diabetes']
    },
    {
      id: 'e3',
      name: 'Emma Davis',
      position: 'Support Worker',
      skills: ['Autism', 'Epilepsy']
    },
    {
      id: 'e4',
      name: 'James Wilson',
      position: 'Care Assistant',
      skills: ['Parkinsons', 'Stroke']
    }
  ];
};

export default function JobPage() {
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: subDays(new Date(), 7),
    to: addDays(new Date(), 7)
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(
    null
  );

  const { data: jobs, isLoading } = useQuery({
    queryKey: ['jobs', dateRange, searchQuery],
    queryFn: () => fetchJobs(dateRange, searchQuery),
    keepPreviousData: true
  });

  const { data: employees } = useQuery({
    queryKey: ['employees'],
    queryFn: fetchEmployees,
    enabled: isDialogOpen
  });

  const handleSearch = () => {
    setIsSearching(true);
    setTimeout(() => setIsSearching(false), 500); // Simulate search delay
  };

  const handleAllocate = (job: Job) => {
    setSelectedJob(job);
    setIsDialogOpen(true);
  };

  const handleConfirmAllocation = () => {
    // Here you would typically make an API call to save the allocation
    console.log(
      `Allocating job ${selectedJob?.id} to employee ${selectedEmployee?.id}`
    );
    setIsDialogOpen(false);
    setSelectedEmployee(null);
  };

  const getStatusBadge = (status: Job['status']) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'allocated':
        return (
          <Badge className="tecx bg-blue-500 text-white hover:bg-blue-600">
            Allocated
          </Badge>
        );
      case 'completed':
        return (
          <Badge className="bg-green-500 text-white hover:bg-green-600">
            Completed
          </Badge>
        );
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <div className=" ">
      <Card>
        <CardHeader>
          <CardTitle>Job Allocation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-6 flex flex-col gap-4 md:flex-row">
            <div className="flex flex-1 flex-col gap-2 md:flex-row">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start border-gray-300 bg-white text-left font-normal text-black md:w-[300px]"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange?.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, 'MMM dd, yyyy')} -{' '}
                          {format(dateRange.to, 'MMM dd, yyyy')}
                        </>
                      ) : (
                        format(dateRange.from, 'MMM dd, yyyy')
                      )
                    ) : (
                      <span>Pick a date range</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange?.from}
                    selected={dateRange}
                    onSelect={(range) => {
                      if (range?.from && range.to) {
                        setDateRange({ from: range.from, to: range.to });
                      }
                    }}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>

              <div className=" flex flex-row items-center gap-4">
                <Input
                  placeholder="Search by service user or job title..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button
                  size="icon"
                  className="w-[250px] bg-supperagent text-white  hover:bg-supperagent/90 "
                  onClick={handleSearch}
                  disabled={isSearching}
                >
                  {isSearching ? (
                    <div>
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  ) : (
                    <div className="flex flex-row items-center gap-4">
                      <Search className="h-4 w-4" />
                      Search
                    </div>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <div className="rounded-md ">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Service User</TableHead>
                    <TableHead>Job</TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jobs?.length ? (
                    jobs.map((job) => (
                      <TableRow key={job.id}>
                        <TableCell>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="cursor-help font-medium hover:underline">
                                  {job.serviceUser.name}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent className="max-w-sm rounded-md bg-white p-4 shadow-lg border-gray-300">
                                <dl className="space-y-3 text-sm text-slate-700">
                                  <div className="flex items-start gap-3">
                                    <User className="mt-0.5 h-4 w-4 text-slate-500" />
                                    <div>
                                      <dt className="font-semibold">
                                        Service User
                                      </dt>
                                      <dd>{job.serviceUser.name}</dd>
                                    </div>
                                  </div>

                                  <div className="flex items-start gap-3">
                                    <MapPin className="mt-0.5 h-4 w-4 text-slate-500" />
                                    <div>
                                      <dt className="font-semibold">Address</dt>
                                      <dd>{job.serviceUser.address}</dd>
                                    </div>
                                  </div>

                                  <div className="flex items-start gap-3">
                                    <Briefcase className="mt-0.5 h-4 w-4 text-slate-500" />
                                    <div>
                                      <dt className="font-semibold">
                                        Job Title
                                      </dt>
                                      <dd>{job.title}</dd>
                                    </div>
                                  </div>

                                  <div className="flex items-start gap-3">
                                    <FileText className="mt-0.5 h-4 w-4 text-slate-500" />
                                    <div>
                                      <dt className="font-semibold">
                                        Description
                                      </dt>
                                      <dd>{job.description}</dd>
                                    </div>
                                  </div>

                                  <div className="flex items-start gap-3">
                                    <CalendarDays className="mt-0.5 h-4 w-4 text-slate-500" />
                                    <div>
                                      <dt className="font-semibold">Date</dt>
                                      <dd>
                                        {format(job.startTime, 'MMM dd, yyyy')}
                                      </dd>
                                    </div>
                                  </div>

                                  <div className="flex items-start gap-3">
                                    <Clock className="mt-0.5 h-4 w-4 text-slate-500" />
                                    <div>
                                      <dt className="font-semibold">Time</dt>
                                      <dd>
                                        {format(job.startTime, 'hh:mm a')} –{' '}
                                        {format(job.endTime, 'hh:mm a')}
                                      </dd>
                                    </div>
                                  </div>

                                  <div className="flex items-start gap-3">
                                    <BadgeCheck className="mt-0.5 h-4 w-4 text-slate-500" />
                                    <div>
                                      <dt className="font-semibold">Status</dt>
                                      <dd>{job.status}</dd>
                                    </div>
                                  </div>
                                </dl>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </TableCell>
                        <TableCell>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="cursor-help hover:underline">
                                  {job.title}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                <div className="flex items-start gap-2">
                                  <User className="mt-1 h-4 w-4 text-slate-600" />
                                  <p>
                                    <strong>Service User:</strong>{' '}
                                    {job.serviceUser.name}
                                  </p>
                                </div>
                                <div className="flex items-start gap-2">
                                  <MapPin className="mt-1 h-4 w-4 text-slate-600" />
                                  <p>
                                    <strong>Address:</strong>{' '}
                                    {job.serviceUser.address}
                                  </p>
                                </div>
                                <div className="flex items-start gap-2">
                                  <Briefcase className="mt-1 h-4 w-4 text-slate-600" />
                                  <p>
                                    <strong>Job Title:</strong> {job.title}
                                  </p>
                                </div>
                                <div className="flex items-start gap-2">
                                  <FileText className="mt-1 h-4 w-4 text-slate-600" />
                                  <p>
                                    <strong>Description:</strong>{' '}
                                    {job.description}
                                  </p>
                                </div>
                                <div className="flex items-start gap-2">
                                  <CalendarDays className="mt-1 h-4 w-4 text-slate-600" />
                                  <p>
                                    <strong>Date:</strong>{' '}
                                    {format(job.startTime, 'MMM dd, yyyy')}
                                  </p>
                                </div>
                                <div className="flex items-start gap-2">
                                  <Clock className="mt-1 h-4 w-4 text-slate-600" />
                                  <p>
                                    <strong>Time:</strong>{' '}
                                    {format(job.startTime, 'hh:mm a')} -{' '}
                                    {format(job.endTime, 'hh:mm a')}
                                  </p>
                                </div>
                                <div className="flex items-start gap-2">
                                  <BadgeCheck className="mt-1 h-4 w-4 text-slate-600" />
                                  <p>
                                    <strong>Status:</strong> {job.status}
                                  </p>
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </TableCell>
                        <TableCell>
                          {format(job.startTime, 'MMM dd, yyyy')}
                          <br />
                          {format(job.startTime, 'hh:mm a')} -{' '}
                          {format(job.endTime, 'hh:mm a')}
                        </TableCell>
                        <TableCell>{getStatusBadge(job.status)}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            onClick={() => handleAllocate(job)}
                            disabled={job.status !== 'pending'}
                          >
                            Allocate
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">
                        No jobs found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Allocate Job</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium">{selectedJob?.title}</h4>
              <p className="text-sm text-muted-foreground">
                {selectedJob?.serviceUser.name} •{' '}
                {format(selectedJob?.startTime || new Date(), 'MMM dd, yyyy')}
              </p>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium">
                Select Employee
              </label>
              {employees ? (
                <Select
                  options={employees}
                  getOptionLabel={(option) =>
                    `${option.name} (${option.position})`
                  }
                  getOptionValue={(option) => option.id}
                  onChange={(selected) => setSelectedEmployee(selected)}
                  placeholder="Search employees..."
                  isClearable
                  className="react-select-container"
                  classNamePrefix="react-select"
                  noOptionsMessage={() => 'No employees found'}
                  formatOptionLabel={(employee) => (
                    <div className="flex flex-col">
                      <span className="font-medium">{employee.name}</span>
                      <span className="text-sm text-muted-foreground">
                        {employee.position} • Skills:{' '}
                        {employee.skills.join(', ')}
                      </span>
                    </div>
                  )}
                />
              ) : (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleConfirmAllocation}
                disabled={!selectedEmployee}
              >
                Confirm Allocation
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
