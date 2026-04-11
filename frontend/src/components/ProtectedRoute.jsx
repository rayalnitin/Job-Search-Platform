import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }) {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  if (!token) {
    return <Navigate to="/" />;
  }

  // 🔥 REDIRECT BASED ON ROLE (ON REFRESH)
  if (window.location.pathname === "/dashboard" && role === "recruiter") {
    return <Navigate to="/recruiter/dashboard" />;
  }

  return children;
}