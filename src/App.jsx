import React, { useState, useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet
} from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { Spin } from "antd";
import { db } from "./firebase";
import { doc, onSnapshot } from "firebase/firestore";

import LoginPage from "./pages/LoginPage";
import EmploymentPage from "./pages/EmploymentPage";
import Dashboard from "./pages/Dashboard";
import UploadPage from "./pages/UploadPage";
import StudentPage from "./pages/StudentPage";
import FacultyPage from "./pages/FacultyPage";
import StudentStatus from "./pages/StudentStatus";
import EvaluationPage from "./pages/EvaluationPage";
import GraduateQualityPage from "./pages/GraduateQualityPage";
import CoursePage from "./pages/CoursePage";
import AdminManagementPage from "./pages/AdminManagementPage";
import ResearchPage from "./pages/ResearchPage";
import FinancePage from "./pages/FinancePage";
import StudentSatisfactionPage from "./pages/StudentSatisfactionPage";
import LearningSupportPage from "./pages/LearningSupportPage";
import UpskillPage from "./pages/UpskillPage";

const GOOGLE_CLIENT_ID = "279564406031-jmit17s4jtcvrnbdolg8glqhdp9divj5.apps.googleusercontent.com";
const DEFAULT_SUPER_ADMIN = "naramon.si@ku.th";

// Custom Hook สำหรับดึงสิทธิ์จาก Firestore แบบเรียลไทม์ (รองรับ Super Admin หลายคน)
const useUserRole = () => {
  const isAuthenticated = localStorage.getItem("isLoggedIn") === "true";
  const email = (localStorage.getItem("email") || "").toLowerCase().trim();

  const [loading, setLoading] = useState(true);
  const [roleInfo, setRoleInfo] = useState({
    isSuperAdmin: false,
    isAdmin: false,
  });

  useEffect(() => {
    if (!isAuthenticated || !email) {
      setLoading(false);
      return;
    }

    const unsub = onSnapshot(
      doc(db, "system_config", "admins"),
      (docSnap) => {
        let superAdmin = DEFAULT_SUPER_ADMIN;
        let list = [DEFAULT_SUPER_ADMIN];
        let roles = {};

        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.superAdmin) {
            superAdmin = String(data.superAdmin).toLowerCase().trim();
          }
          if (Array.isArray(data.list)) {
            list = data.list.map((e) => String(e).toLowerCase().trim());
          }
          if (data.roles && typeof data.roles === "object") {
            roles = data.roles;
          }
        }

        const userRoleFromDB = roles[email];
        const isSuper =
          userRoleFromDB === "Super Admin" ||
          email === superAdmin ||
          email === DEFAULT_SUPER_ADMIN;

        const isAdm =
          isSuper ||
          userRoleFromDB === "Admin (ผู้ดูแลระบบ)" ||
          (list.includes(email) && !userRoleFromDB);

        setRoleInfo({ isSuperAdmin: isSuper, isAdmin: isAdm });
        setLoading(false);
      },
      (error) => {
        console.error("Error checking user role:", error);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [isAuthenticated, email]);

  return { isAuthenticated, loading, ...roleInfo };
};

// 1. ตัวเช็กสำหรับผู้ใช้งานทั่วไป + Admin + Super Admin (ต้องล็อกอินก่อนถึงจะเข้าได้)
const ProtectedRoutes = () => {
  const isAuthenticated = localStorage.getItem("isLoggedIn") === "true";
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

// 2. ตัวเช็กเฉพาะ Admin และ Super Admin
const AdminRoute = () => {
  const { isAuthenticated, loading, isAdmin } = useUserRole();

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <Spin size="large" />
      </div>
    );
  }
  if (!isAdmin) return <Navigate to="/" replace />; // ถ้าไม่ใช่ Admin หรือ Super Admin ให้เด้งกลับหน้าหลัก

  return <Outlet />;
};

// 3. ตัวเช็กเฉพาะ Super Admin เท่านั้น
const SuperAdminRoute = () => {
  const { isAuthenticated, loading, isSuperAdmin } = useUserRole();

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <Spin size="large" />
      </div>
    );
  }
  if (!isSuperAdmin) return <Navigate to="/" replace />; // ถ้าไม่ใช่ Super Admin ให้เด้งกลับหน้าหลัก

  return <Outlet />;
};

function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <BrowserRouter>
        <Routes>
          {/* หน้า Login */}
          <Route path="/login" element={<LoginPage />} />

          {/* หน้าสำหรับผู้ใช้งานทุกคนที่ล็อกอินแล้ว (User, อาจารย์ผู้สอน, ผู้รับผิดชอบหลักสูตร, ประธานหลักสูตร, Admin, Super Admin) */}
          <Route element={<ProtectedRoutes />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/employment" element={<EmploymentPage />} />
            <Route path="/students" element={<StudentPage />} />
            <Route path="/faculty" element={<FacultyPage />} />
            <Route path="/student-status" element={<StudentStatus />} />
            <Route path="/evaluation" element={<EvaluationPage />} />
            <Route path="/graduate-quality" element={<GraduateQualityPage />} />
            <Route path="/courses" element={<CoursePage />} />
            <Route path="/student-satisfaction" element={<StudentSatisfactionPage />} />
            <Route path="/learning-support" element={<LearningSupportPage />} />
          </Route>

          {/* ล็อกเฉพาะ Admin และ Super Admin เข้าได้ (ตรงกับเมนูด้านล่างใน Sidebar) */}
          <Route element={<AdminRoute />}>
            <Route path="/upload" element={<UploadPage />} />
            <Route path="/research" element={<ResearchPage />} />
            <Route path="/upskill" element={<UpskillPage />} />
            <Route path="/finance" element={<FinancePage />} />
          </Route>

          {/* ล็อกเฉพาะ Super Admin เท่านั้น (เข้าได้ทุกคนที่ถูกตั้งบทบาทเป็น Super Admin) */}
          <Route element={<SuperAdminRoute />}>
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
