import React from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet
} from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";

import LoginPage from "./pages/LoginPage";
import EmploymentPage from "./pages/EmploymentPage";
import Dashboard from "./pages/Dashboard";
import UploadPage from "./pages/UploadPage";
import StudentPage from "./pages/StudentPage";
import FacultyPage from "./pages/FacultyPage";
import SummaryPage from "./pages/SummaryPage";
import StudentStatus from "./pages/StudentStatus";
import EvaluationPage from "./pages/EvaluationPage";
import GraduateQualityPage from "./pages/GraduateQualityPage";
import CoursePage from "./pages/CoursePage";
import AdminManagementPage from "./pages/AdminManagementPage";

const GOOGLE_CLIENT_ID = "279564406031-jmit17s4jtcvrnbdolg8glqhdp9divj5.apps.googleusercontent.com";

// ตัวเช็กสำหรับผู้ใช้งานทั่วไป + Admin (ต้องล็อกอินก่อนถึงจะเข้าได้)
const ProtectedRoutes = () => {
  const isAuthenticated = localStorage.getItem("isLoggedIn") === "true";
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

// ตัวเช็คเฉพาะ Admin (เช็กทั้ง Role และ Email เพื่อความชัวร์)
const AdminRoute = () => {
  const isAuthenticated = localStorage.getItem("isLoggedIn") === "true";
  const role = localStorage.getItem("role");
  const email = (localStorage.getItem("email") || "").toLowerCase();

  const isAdmin = role === "admin" || email === "naramon.si@ku.th";

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/" replace />; // ถ้าไม่ใช่ Admin ให้เด้งกลับหน้าหลัก

  return <Outlet />;
};

function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <BrowserRouter>
        <Routes>
          {/* หน้า Login */}
          <Route path="/login" element={<LoginPage />} />

          {/* หน้าสำหรับผู้ใช้งานทุกคนที่ล็อกอินแล้ว */}
          <Route element={<ProtectedRoutes />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/employment" element={<EmploymentPage />} />
            <Route path="/students" element={<StudentPage />} />
            <Route path="/faculty" element={<FacultyPage />} />
            <Route path="/summary" element={<SummaryPage />} />
            <Route path="/student-status" element={<StudentStatus />} />
            <Route path="/evaluation" element={<EvaluationPage />} />
            <Route path="/graduate-quality" element={<GraduateQualityPage />} />
            <Route path="/courses" element={<CoursePage />} />
          </Route>

          {/* ล็อกเฉพาะ Admin เข้าได้ */}
          <Route element={<AdminRoute />}>
            <Route path="/upload" element={<UploadPage />} />
            <Route path="/admin-management" element={<AdminManagementPage />} />
          </Route>

          {/* ถ้าเข้า URL มั่ว ให้เด้งกลับหน้าหลัก */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </GoogleOAuthProvider>
  );
}

export default App;
