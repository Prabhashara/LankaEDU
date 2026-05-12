import { Navigate, Route, Routes } from "react-router-dom";
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
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import ThemeToggle from "./components/ThemeToggle.jsx";
import { clearAuthSession } from "./services/authStorage.js";

function protectedElement(roles, element) {
  return <ProtectedRoute roles={roles}>{element}</ProtectedRoute>;
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeToggle />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />
        <Route path="/profile" element={protectedElement(["student", "lecturer", "admin"], <ProfileManagementPage />)} />

        <Route path="/student-dashboard" element={protectedElement(["student"], <DashboardPage role="student" />)} />
        <Route path="/student/exams" element={protectedElement(["student"], <AvailableExamsPage />)} />
        <Route path="/student/report-card" element={protectedElement(["student"], <StudentReportCardPage />)} />
        <Route path="/student/exams/:examId/take" element={protectedElement(["student"], <ExamTakingPage />)} />
        <Route path="/student/attempts/:attemptId/submitted" element={protectedElement(["student"], <ExamSubmissionConfirmationPage />)} />
        <Route path="/student/results/:resultId" element={protectedElement(["student"], <ResultDetailPage />)} />

        <Route path="/lecturer-dashboard" element={protectedElement(["lecturer"], <DashboardPage role="lecturer" />)} />
        <Route path="/lecturer/exams/new" element={protectedElement(["lecturer"], <ExamCreatePage />)} />
        <Route path="/lecturer/analytics" element={protectedElement(["lecturer"], <ExamAnalyticsPage />)} />
        <Route path="/lecturer/exams/:id" element={protectedElement(["lecturer"], <ExamDetailPage />)} />
        <Route path="/lecturer/exams/:id/analytics" element={protectedElement(["lecturer"], <ExamAnalyticsPage />)} />
        <Route path="/lecturer/exams/:id/results" element={protectedElement(["lecturer"], <LecturerExamResultsPage />)} />
        <Route path="/lecturer/exams/:examId/question-bank" element={protectedElement(["lecturer"], <QuestionBankPage />)} />
        <Route path="/lecturer/exams/:examId/questions/new" element={protectedElement(["lecturer"], <QuestionFormPage />)} />
        <Route path="/lecturer/exams/:examId/questions/:questionId/edit" element={protectedElement(["lecturer"], <QuestionFormPage />)} />

        <Route path="/admin-dashboard" element={protectedElement(["admin"], <DashboardPage role="admin" />)} />
        <Route path="/admin/users" element={protectedElement(["admin"], <UserManagementPage />)} />
        <Route path="/admin/audit" element={protectedElement(["admin"], <AuditLogPage />)} />

        <Route path="/logout" element={<LogoutRedirect />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </ErrorBoundary>
  );
}

function LogoutRedirect() {
  clearAuthSession();
  return <Navigate to="/login" replace />;
}
