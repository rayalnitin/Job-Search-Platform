import { BrowserRouter, Routes, Route } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import VerifyOTP from "./pages/auth/VerifyOTP";
import LoginOTP from "./pages/auth/LoginOTP";
import ForgotPassword from "./pages/auth/ForgotPassword";
import Dashboard from "./pages/user/Dashboard";
import Profile from "./pages/user/Profile";
import Resume from "./pages/user/Resume";
import AdminDashboard from "./pages/admin/AdminDashboard";
import Applications from "./pages/user/Applications";
import Messages from "./pages/user/Messages";
import AdminRoute from "./components/AdminRoute";
import Company from "./pages/user/Company";
import Networking from "./pages/user/Networking";
import ApplyJob from "./pages/user/ApplyJob";
import RecruiterDashboard from "./pages/recruiter/Dashboard";
import RecruiterRoute from "./components/RecruiterRoute";
import Applicants from "./pages/recruiter/Applicants";
import CompanyProfile from "./pages/recruiter/CompanyProfile";
import PostJob from "./pages/recruiter/PostJob";
import ManageJobs from "./pages/recruiter/ManageJobs";
import RecruiterProfile from "./pages/recruiter/RecruiterProfile";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify" element={<VerifyOTP />} />
        <Route path="/login-otp" element={<LoginOTP />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/profile/:id" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/resume" element={<ProtectedRoute><Resume /></ProtectedRoute>} />
        <Route path="/applications" element={<ProtectedRoute><Applications /></ProtectedRoute>} />
        <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
        <Route path="/company" element={<ProtectedRoute><Company /></ProtectedRoute>} />
        <Route path="/company/:id" element={<ProtectedRoute><Company /></ProtectedRoute>} />
        <Route path="/apply" element={<ProtectedRoute><ApplyJob /></ProtectedRoute>} />
        <Route path="/network" element={<ProtectedRoute><Networking /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute><AdminRoute><AdminDashboard /></AdminRoute></ProtectedRoute>} />
        <Route path="/recruiter/dashboard" element={<ProtectedRoute><RecruiterRoute><RecruiterDashboard /></RecruiterRoute></ProtectedRoute>} />
        <Route path="/recruiter/applicants" element={<ProtectedRoute><RecruiterRoute><Applicants /></RecruiterRoute></ProtectedRoute>} />
        <Route path="/recruiter/applicants/:jobId" element={<ProtectedRoute><RecruiterRoute><Applicants /></RecruiterRoute></ProtectedRoute>} />
        <Route path="/recruiter/post-job" element={<ProtectedRoute><RecruiterRoute><PostJob /></RecruiterRoute></ProtectedRoute>} />
        <Route path="/recruiter/company" element={<ProtectedRoute><RecruiterRoute><CompanyProfile /></RecruiterRoute></ProtectedRoute>} />
        <Route path="/recruiter/jobs" element={<ProtectedRoute><RecruiterRoute><ManageJobs /></RecruiterRoute></ProtectedRoute>} />
        <Route path="/recruiter/messages" element={<ProtectedRoute><RecruiterRoute><Messages /></RecruiterRoute></ProtectedRoute>} />
        <Route path="/recruiter/network" element={<ProtectedRoute><RecruiterRoute><Networking /></RecruiterRoute></ProtectedRoute>} />
        <Route path="/recruiter/profile" element={<ProtectedRoute><RecruiterRoute><RecruiterProfile /></RecruiterRoute></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
