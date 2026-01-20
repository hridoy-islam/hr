import ProtectedRoute from '@/components/shared/ProtectedRoute';
import ForgotPassword from '@/pages/auth/forget-password';
import SignUpPage from '@/pages/auth/sign-up';

import { Children, Suspense, lazy } from 'react';
import { Navigate, Outlet, useRoutes } from 'react-router-dom';
import Otp from '@/pages/auth/otp';
import AdminLayout from '@/components/layout/admin-layout';
import ErrorPage from '@/pages/ErrorPage/';
import NewPassword from '@/pages/auth/NewPassword';
import HrPage from '@/pages/Hr';
import Vacancy from '@/pages/company/Vacancy';
import Profile from '@/pages/Hr/Profile';
import Holiday from '@/pages/Hr/Holidays';
import MyStaff from '@/pages/Hr/MyStaff';
import Employee from '@/pages/company/Employee';
import Attendance from '@/pages/Hr/Attendance';
import PayRoll from '@/pages/Hr/Payroll';
import Recruitment from '@/pages/company/Recruitment';
import Settings from '@/pages/Hr/Settings';
import HrLayout from '@/components/layout/hr-layout';
import Department from '@/pages/company/Department';
import Shift from '@/pages/company/Shift';
import Designation from '@/pages/company/Designation';
import Training from '@/pages/company/Training';
import AttendanceReport from '@/pages/Hr/Attendance/Attendance-Report';
import CompanyDetails from '@/pages/company/Company-Details';
import EmailSetup from '@/pages/company/Email-Setup';
import CreateVacancy from '@/pages/company/Vacancy/CreateVacancy';
import EditVacancy from '@/pages/company/Vacancy/EditVacancy';
import AddApplicant from '@/pages/company/Vacancy/AddApplicant';
import ViewApplicant from '@/pages/company/Vacancy/ViewApplicants';
import RecruitApplicantForm from '@/pages/company/Recruitment/RecruitApplicantForm';
import AddDesignation from '@/pages/company/Designation/CreateDesignation';
import EditDesignation from '@/pages/company/Designation/EditDesignation';
import EmployeeForm from '@/pages/company/Recruitment/employeeForm';
import EditEmployee from '@/pages/company/Employee/editEmployee';
import CreateShift from '@/pages/company/Shift/CreateShift';
import EditShift from '@/pages/company/Shift/EditShift';
import EmployeeRate from '@/pages/company/Employee/employeeRate';
import AttendanceList from '@/pages/Hr/Attendance/attendaceList';
import AttendanceApprovalPage from '@/pages/Hr/Attendance/Attendance-Approve';
import AttendanceApproveList from '@/pages/Hr/Attendance/Attendance-Approve/attendance-list';
import EntryAttendance from '@/pages/Hr/Attendance/entry-attendance';
import ApplicantDetailPage from '@/pages/company/Vacancy/viewApplicant';
import LeaveApprovalPage from '@/pages/Hr/LeaveApproval';

import TrainingExpiryPage from '@/pages/Hr/Dashboard/components/trainingExprity';
import RightToWorkExpiryPage from '@/pages/Hr/Dashboard/components/rightToWork';
import PassportExpiryPage from '@/pages/company/ExpiryPage/passportExpiray';
import RtwPage from '@/pages/company/Employee/rightToWorkEmployee';
import RightToWorkStatusPage from '@/pages/Hr/Dashboard/components/rightToWorkStatus';
import BankHolidayPage from '@/pages/Hr/Bank-Holiday';
import RequestDocumentPage from '@/pages/Hr/Request-Documents';
import StaffAttendancePage from '@/pages/Hr/StaffAttendance';
import AdminDashboardPage from '@/pages/Dashboard/AdminDashboard';
import { CompanyPage } from '@/pages/admin/companyPage';
import CompanyDashboardPage from '@/pages/Dashboard/CompanyDashboard';
import SubscriptionPlanPage from '@/pages/admin/subscriptionPage';
import { CompanyDetailsPage } from '@/pages/admin/companyPage/companyDetails';
import AdminNoticeBoard from '@/pages/admin/noticePage';
import ReportPage from '@/pages/admin/reportPage';
import CompanyTrainingPage from '@/pages/company/TrainingPage';
import CreateTraining from '@/pages/company/TrainingPage/CreateTraining';
import EditTraining from '@/pages/company/TrainingPage/EditTraining';
import CompanyScheduleCheckPage from '@/pages/company/ScheduleCheckPage';
import CompanyNoticeBoard from '@/pages/company/NoticePage';
import DbsExpiryPage from '@/pages/company/ExpiryPage/dbsExpiryPage';
import VisaExpiryPage from '@/pages/company/ExpiryPage/visaExpiryPage';
import RtwExpiryPage from '@/pages/company/ExpiryPage/rtwExpiryPage';
import ImmigrationExpiryPage from '@/pages/company/ExpiryPage/immigrationExpiryPage';
import AppraisalExpiryPage from '@/pages/company/ExpiryPage/appraisalExpiryPage';
import TrainingDetailsPage from '@/pages/company/Employee/employeeTraining/employeeTrainingDetails';

const SignInPage = lazy(() => import('@/pages/auth/signin'));

// ----------------------------------------------------------------------

export default function AppRouter() {
  const adminRoutes = [
    {
      path: '/admin',
      element: (
        <ProtectedRoute>
          <HrLayout />
        </ProtectedRoute>
      ),
      children: [
        {
          index: true,
          element: (
            <Suspense>
              <AdminDashboardPage />
            </Suspense>
          )
        },
        { path: 'company', element: <CompanyPage /> },
        { path: 'company/:id', element: <CompanyDetailsPage /> },
        { path: 'subscription-plan', element: <SubscriptionPlanPage /> },
        { path: 'notice', element: <AdminNoticeBoard /> },
        { path: 'report', element: <ReportPage /> }
      ]
    }
  ];

  const companyRoutes = [
    {
      path: '/company',
      element: (
        <ProtectedRoute>
          <HrLayout />
        </ProtectedRoute>
      ),
      children: [
        {
          index: true,
          element: (
            <Suspense>
              <CompanyDashboardPage />
            </Suspense>
          )
        },
    

        { path: 'expiry/passport', element: <PassportExpiryPage /> },
        { path: 'expiry/dbs', element: <DbsExpiryPage /> },
        { path: 'expiry/visa', element: <VisaExpiryPage /> },
        { path: 'expiry/appraisal', element: <AppraisalExpiryPage /> },
        { path: 'expiry/immigration', element: <ImmigrationExpiryPage /> },
        {
          path: 'expiry/rtw',
          element: <RtwExpiryPage />
        },

        { path: 'profile', element: <Profile /> },
        { path: 'holiday', element: <Holiday /> },
        { path: 'my-staff', element: <MyStaff /> },

        { path: 'employee', element: <Employee /> },
        { path: 'employee/:id', element: <EditEmployee /> },
        { path: 'employee/:id/training-details/:tid', element: <TrainingDetailsPage /> },
        { path: 'employee/:id/employee-rate', element: <EmployeeRate /> },
        { path: 'employee/:id/rtw', element: <RtwPage /> },

        { path: 'department', element: <Department /> },

        { path: 'shift', element: <Shift /> },
        { path: 'create-shift', element: <CreateShift /> },
        { path: 'edit-shift/:id', element: <EditShift /> },

        { path: 'designation', element: <Designation /> },
        { path: 'designation/create', element: <AddDesignation /> },
        { path: 'designation/edit/:id', element: <EditDesignation /> },

        { path: 'training', element: <CompanyTrainingPage /> },
        { path: 'create-training', element: <CreateTraining /> },
        { path: 'edit-training/:id', element: <EditTraining /> },

        { path: 'attendance', element: <Attendance /> },
        { path: 'attendance/attendance-list', element: <AttendanceList /> },
        { path: 'attendance/attendance-entry', element: <EntryAttendance /> },

        { path: 'attendance-approve', element: <AttendanceApprovalPage /> },
        {
          path: 'attendance-approve/attendance-list',
          element: <AttendanceApproveList />
        },

        { path: 'staff-attendance', element: <StaffAttendancePage /> },
        { path: 'attendance-report', element: <AttendanceReport /> },

        { path: 'payroll', element: <PayRoll /> },

        { path: 'leave-approve', element: <LeaveApprovalPage /> },

        { path: 'notice', element: <CompanyNoticeBoard /> },

        { path: 'vacancy', element: <Vacancy /> },
        { path: 'vacancy/create-vacancy', element: <CreateVacancy /> },
        { path: 'vacancy/edit-vacancy/:id', element: <EditVacancy /> },

        { path: 'vacancy/add-applicant/:id', element: <AddApplicant /> },
        { path: 'vacancy/view-applicants/:id', element: <ViewApplicant /> },
        { path: 'vacancy/view-applicant/:id', element: <ApplicantDetailPage /> },

        { path: 'vacancy/recruit-applicant/:id', element: <RecruitApplicantForm /> },
        { path: 'vacancy/recruit-applicant/employee', element: <EmployeeForm /> },

        { path: 'recruitment', element: <Recruitment /> },
        { path: 'candidate-list', element: <Recruitment /> },

        { path: 'settings', element: <Settings /> },
        { path: 'company-details', element: <CompanyDetails /> },

        { path: 'documents', element: <ReportPage /> },
        { path: 'document-request', element: <RequestDocumentPage /> },

        { path: 'email-setup', element: <EmailSetup /> },
        { path: 'bank-holiday', element: <BankHolidayPage /> },
        { path: 'schedule-check', element: <CompanyScheduleCheckPage /> }
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

  const routes = useRoutes([...publicRoutes, ...adminRoutes, ...companyRoutes]);

  return routes;
}
