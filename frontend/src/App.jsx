import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import AuditLogPage from "./pages/admin/AuditLogPage.jsx";
import UserManagementPage from "./pages/admin/UserManagementPage.jsx";
import LoginPage from "./pages/auth/LoginPage.jsx";
import SignupPage from "./pages/auth/SignupPage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import AvailableExamsPage from "./pages/exams/AvailableExamsPage.jsx";
import ExamAnalyticsPage from "./pages/exams/ExamAnalyticsPage.jsx";
import ExamCreatePage from "./pages/exams/ExamCreatePage.jsx";
import ExamDetailPage from "./pages/exams/ExamDetailPage.jsx";
import ExamSubmissionConfirmationPage from "./pages/exams/ExamSubmissionConfirmationPage.jsx";
import ExamTakingPage from "./pages/exams/ExamTakingPage.jsx";
import LecturerExamResultsPage from "./pages/exams/LecturerExamResultsPage.jsx";
import ResultDetailPage from "./pages/exams/ResultDetailPage.jsx";
import StudentReportCardPage from "./pages/exams/StudentReportCardPage.jsx";
import HomePage from "./pages/HomePage.jsx";
import NotFoundPage from "./pages/NotFoundPage.jsx";
import ProfileManagementPage from "./pages/profile/ProfileManagementPage.jsx";
import QuestionBankPage from "./pages/questions/QuestionBankPage.jsx";
import QuestionFormPage from "./pages/questions/QuestionFormPage.jsx";
import UnauthorizedPage from "./pages/UnauthorizedPage.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import GlobalApiErrorToast from "./components/GlobalApiErrorToast.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import ThemeToggle from "./components/ThemeToggle.jsx";
import AppShell from "./components/AppShell.jsx";
import { clearAuthSession } from "./services/authStorage.js";

function protectedElement(roles, element) {
  return <ProtectedRoute roles={roles}>{element}</ProtectedRoute>;
}

function shellElement(role, element) {
  return protectedElement([role], <AppShell role={role}>{element}</AppShell>);
}

function commonShellElement(roles, element) {
  return protectedElement(roles, <AppShell>{element}</AppShell>);
}

export default function App() {
  const location = useLocation();

  return (
    <ErrorBoundary resetKey={`${location.pathname}${location.search}`}>
      <ThemeToggle />
      <GlobalApiErrorToast />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />
        <Route path="/profile" element={commonShellElement(["student", "lecturer", "admin"], <ProfileManagementPage />)} />

        <Route path="/student-dashboard" element={shellElement("student", <DashboardPage role="student" />)} />
        <Route path="/student/exams" element={shellElement("student", <AvailableExamsPage />)} />
        <Route path="/student/report-card" element={shellElement("student", <StudentReportCardPage />)} />
        <Route path="/student/exams/:examId/take" element={protectedElement(["student"], <ExamTakingPage />)} />
        <Route path="/student/attempts/:attemptId/submitted" element={shellElement("student", <ExamSubmissionConfirmationPage />)} />
        <Route path="/student/results/:resultId" element={shellElement("student", <ResultDetailPage />)} />

        <Route path="/lecturer-dashboard" element={shellElement("lecturer", <DashboardPage role="lecturer" />)} />
        <Route path="/lecturer/exams/new" element={shellElement("lecturer", <ExamCreatePage />)} />
        <Route path="/lecturer/question-bank" element={shellElement("lecturer", <QuestionBankPage />)} />
        <Route path="/lecturer/analytics" element={shellElement("lecturer", <ExamAnalyticsPage />)} />
        <Route path="/lecturer/exams/:id" element={shellElement("lecturer", <ExamDetailPage />)} />
        <Route path="/lecturer/exams/:id/analytics" element={shellElement("lecturer", <ExamAnalyticsPage />)} />
        <Route path="/lecturer/exams/:id/results" element={shellElement("lecturer", <LecturerExamResultsPage />)} />
        <Route path="/lecturer/exams/:examId/question-bank" element={shellElement("lecturer", <QuestionBankPage />)} />
        <Route path="/lecturer/exams/:examId/questions/new" element={shellElement("lecturer", <QuestionFormPage />)} />
        <Route path="/lecturer/exams/:examId/questions/:questionId/edit" element={shellElement("lecturer", <QuestionFormPage />)} />

        <Route path="/admin-dashboard" element={shellElement("admin", <DashboardPage role="admin" />)} />
        <Route path="/admin/users" element={shellElement("admin", <UserManagementPage />)} />
        <Route path="/admin/audit" element={shellElement("admin", <AuditLogPage />)} />

        <Route path="/logout" element={<LogoutRedirect />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </ErrorBoundary>
  );
}

function LogoutRedirect() {
  clearAuthSession();
  return <Navigate to="/" replace />;
}
