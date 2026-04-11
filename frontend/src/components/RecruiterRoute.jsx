import { Navigate } from "react-router-dom";

export default function RecruiterRoute({ children }) {
  const role = localStorage.getItem("role");

  if (role !== "recruiter") {
    return <Navigate to="/dashboard" />;
  }

  return children;
}