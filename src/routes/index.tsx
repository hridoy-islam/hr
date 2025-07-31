import ProtectedRoute from '@/components/shared/ProtectedRoute';
import ForgotPassword from '@/pages/auth/forget-password';
import SignUpPage from '@/pages/auth/sign-up';

import { Children, Suspense, lazy } from 'react';
import { Navigate, Outlet, useRoutes } from 'react-router-dom';
import Otp from '@/pages/auth/otp';
import AdminLayout from '@/components/layout/admin-layout';
import { DashboardPage } from '@/pages/Dashboard';
import ErrorPage from '@/pages/ErrorPage/';
import NewPassword from '@/pages/auth/NewPassword';
import HrPage from '@/pages/Hr';
import NoticeBoard from '@/pages/Hr/NoticeBoard';
import Vacancy from '@/pages/Hr/Vacancy';
import Profile from '@/pages/Hr/Profile';
import Holiday from '@/pages/Hr/Holidays';
import MyStuff from '@/pages/Hr/MyStuff';
import Employee from '@/pages/Hr/Employee';
import Attendance from '@/pages/Hr/Attendance';
import PayRoll from '@/pages/Hr/Payroll';
import Recruitment from '@/pages/Hr/Recruitment';
import Settings from '@/pages/Hr/Settings';
import HrLayout from '@/components/layout/hr-layout';
import Department from '@/pages/Hr/Department';
import Shift from '@/pages/Hr/Shift';
import Designation from '@/pages/Hr/Designation';
import Training from '@/pages/Hr/Training';
import AttendanceReport from '@/pages/Hr/Attendance/Attendance-Report';
import CompanyDetails from '@/pages/Hr/Company-Details';
import EmailSetup from '@/pages/Hr/Email-Setup';
import CreateVacancy from '@/pages/Hr/Vacancy/CreateVacancy';
import EditVacancy from '@/pages/Hr/Vacancy/EditVacancy';
import AddApplicant from '@/pages/Hr/Vacancy/AddApplicant';
import ViewApplicant from '@/pages/Hr/Vacancy/ViewApplicants';
import RecruitApplicantForm from '@/pages/Hr/Recruitment/RecruitApplicantForm';
import CreateTraining from '@/pages/Hr/Training/CreateTraining';
import AddDesignation from '@/pages/Hr/Designation/CreateDesignation';
import EditDesignation from '@/pages/Hr/Designation/EditDesignation';
import EditTraining from '@/pages/Hr/Training/EditTraining';
import EmployeeForm from '@/pages/Hr/Recruitment/employeeForm';
import EditEmployee from '@/pages/Hr/Employee/editEmployee';
import CreateShift from '@/pages/Hr/Shift/CreateShift';
import EditShift from '@/pages/Hr/Shift/EditShift';
import EmployeeRate from '@/pages/Hr/Employee/employeeRate';
import AttendanceList from '@/pages/Hr/Attendance/attendaceList';
import AttendanceApprovalPage from '@/pages/Hr/Attendance/Attendance-Approve';
import AttendanceApproveList from '@/pages/Hr/Attendance/Attendance-Approve/attendance-list';
import EntryAttendance from '@/pages/Hr/Attendance/entry-attendance';
import ApplicantDetailPage from '@/pages/Hr/Vacancy/viewApplicant';
import LeaveApprovalPage from '@/pages/Hr/LeaveManagement/LeaveApproval';
import PassportExpiryPage from '@/pages/Hr/Dashboard/components/PassportExpiray';
import TrainingExpiryPage from '@/pages/Hr/Dashboard/components/trainingExprity';
import RightToWorkExpiryPage from '@/pages/Hr/Dashboard/components/RightToWork';


const SignInPage = lazy(() => import('@/pages/auth/signin'));

// ----------------------------------------------------------------------

export default function AppRouter() {
  const adminRoutes = [
    {
      path: '/admin',
      element: (
        <AdminLayout>
          <ProtectedRoute>
            <Suspense>
              <Outlet />
            </Suspense>
          </ProtectedRoute>
        </AdminLayout>
      ),
      children: [
        {
          element: <DashboardPage />,
          index: true
        },
        {
          path: 'hr',
          element: <HrLayout />,
          children: [
            {
              element: <HrPage />,
              index: true
            },
            {
              path: 'expiry/passport',
              element: <PassportExpiryPage />
            },
            {
              path: 'expiry/training',
              element: <TrainingExpiryPage />
            },
            {
              path: 'expiry/rightToWork',
              element: <RightToWorkExpiryPage />
            },
            {
              path: 'profile',
              element: <Profile />
            },
            {
              path: 'holiday',
              element: <Holiday />
            },
            {
              path: 'my-stuff',
              element: <MyStuff />
            },
            {
              path: 'employee',
              element: <Employee />
            },
            {
              path: 'employee/:id',
              element: <EditEmployee />
            },

            {
              path: 'employee/:id/employee-rate',
              element: <EmployeeRate />
            },

            {
              path: 'department',
              element: <Department />
            },
            {
              path: 'shift',
              element: <Shift />
            },
            {
              path: 'create-shift',
              element: <CreateShift />
            },
            {
              path: 'edit-shift/:id',
              element: <EditShift />
            },
            {
              path: 'designation',
              element: <Designation />
            },
            {
              path: 'designation/create',
              element: <AddDesignation />
            },
            {
              path: 'designation/edit/:id',
              element: <EditDesignation />
            },
            {
              path: 'training',
              element: <Training />
            },
            {
              path: 'create-training',
              element: <CreateTraining />
            },
            {
              path: 'edit-training/:id',
              element: <EditTraining />
            },
            {
              path: 'attendance',
              element: <Attendance />
            },
            {
              path: 'attendance/attendance-list',
              element: <AttendanceList />
            },
            {
              path: 'attendance/attendance-entry',
              element: <EntryAttendance />
            },
            {
              path: 'attendance-approve',
              element: <AttendanceApprovalPage />
            },
            {
              path: 'attendance-approve/attendance-list',
              element: <AttendanceApproveList />
            },
            {
              path: 'attendance-report',
              element: <AttendanceReport />
            },
            {
              path: 'payroll',
              element: <PayRoll />
            },
            {
              path: 'leave-approve',
              element: <LeaveApprovalPage />
            },

            {
              path: 'notice',
              element: <NoticeBoard />
            },
            {
              path: 'vacancy',
              element: <Vacancy />
            },
            {
              path: 'create-vacancy',
              element: <CreateVacancy />
            },
            {
              path: 'edit-vacancy/:id',
              element: <EditVacancy />
            },
            {
              path: 'add-applicant/:id',
              element: <AddApplicant />
            },
            {
              path: 'view-applicants/:id',
              element: <ViewApplicant />
            },
            {
              path: 'view-applicant/:id',
              element: <ApplicantDetailPage />
            },
            {
              path: 'recruit-applicant/:id',
              element: <RecruitApplicantForm />
            },
            {
              path: 'recruit-applicant/employee',
              element: <EmployeeForm />
            },

            {
              path: 'recruitment',
              element: <Recruitment />
            },
            {
              path: 'candidate-list',
              element: <Recruitment />
            },
            {
              path: 'settings',
              element: <Settings />
            },
            {
              path: 'company-details',
              element: <CompanyDetails />
            },
            {
              path: 'email-setup',
              element: <EmailSetup />
            }
          ]
        },
    
      ]
    }
  ];

  const publicRoutes = [
    {
      path: '/',
      element: <SignInPage />,
      index: true
    },
    {
      path: '/signup',
      element: <SignUpPage />,
      index: true
    },
    {
      path: '/forgot-password',
      element: <ForgotPassword />,
      index: true
    },
    {
      path: '/otp',
      element: <Otp />,
      index: true
    },

    {
      path: '/new-password',
      element: <NewPassword />,
      index: true
    },
    {
      path: '/404',
      element: <ErrorPage />
    },
    {
      path: '*',
      element: <Navigate to="/404" replace />
    }
  ];

  const routes = useRoutes([...publicRoutes, ...adminRoutes]);

  return routes;
}
