import React, { useState } from "react";
import { Card, Input, Button, Form, message, Divider } from "antd";
import { UserOutlined, LockOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";
import { db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";

const LoginPage = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // ฟังก์ชันบันทึก Session และแจ้งเตือนทั้งระบบ
  const saveSessionAndRedirect = (userData) => {
    localStorage.setItem("isLoggedIn", "true");
    localStorage.setItem("user", userData.name || userData.username);
    localStorage.setItem("email", userData.email || "");
    localStorage.setItem("picture", userData.picture || "");
    localStorage.setItem("role", userData.role);

    // ⚡ แจ้ง Event ให้ Component อื่นๆ (เช่น Navbar, Sidebar) รู้ว่ามีการ Login
    window.dispatchEvent(new Event("storage"));

    message.success(`ยินดีต้อนรับคุณ ${userData.name || userData.username}!`);
    navigate("/");
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const decoded = jwtDecode(credentialResponse.credential);
      const userEmail = decoded.email ? decoded.email.toLowerCase() : "";

      // 🔍 เช็กรายชื่อแอดมินบน Firebase
      let adminList = ["naramon.si@ku.th"];
      try {
        const docSnap = await getDoc(doc(db, "system_config", "admins"));
        if (docSnap.exists() && Array.isArray(docSnap.data().list)) {
          adminList = docSnap.data().list.map(e => String(e).toLowerCase());
        }
      } catch (e) {
        console.error("Firebase admin check error:", e);
      }

      const isAdmin = adminList.includes(userEmail);
      const userRole = isAdmin ? "admin" : "user";

      saveSessionAndRedirect({
        name: decoded.name,
        email: userEmail,
        picture: decoded.picture || "",
        role: userRole
      });
    } catch (error) {
      console.error("Google Auth Error:", error);
      message.error("เกิดข้อผิดพลาดในการเข้าสู่ระบบด้วย Google");
    }
  };

  const handleGoogleError = () => {
    message.error("การเข้าสู่ระบบด้วย Google ล้มเหลว");
  };

  const handleFinish = (values) => {
    setLoading(true);
    setTimeout(() => {
      // ⚠️ Mock-up Auth สำหรับ Dev Phase
      if (values.username === "admin" && values.password === "123456") {
        saveSessionAndRedirect({
          username: values.username,
          email: "naramon.si@ku.th",
          role: "admin"
        });
      } else {
        message.error("ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง!");
      }
      setLoading(false);
    }, 600);
  };

  return (
    <div style={{ height: "100vh", display: "flex", justifyContent: "center", alignItems: "center", background: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)" }}>
      <Card style={{ width: 380, borderRadius: 20, boxShadow: "0 10px 25px rgba(0, 0, 0, 0.05)", border: "1px solid #cbd5e1", padding: "12px 8px" }}>
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#00b4d8", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px auto", fontSize: 28 }}>
            🎓
          </div>
          <h2 style={{ margin: 0, color: "#1e293b", fontSize: 22, fontWeight: 700 }}>เข้าสู่ระบบ</h2>
          <p style={{ margin: "4px 0 0 0", color: "#64748b", fontSize: 13 }}>ระบบวิเคราะห์ภาวะการมีงานทำของบัณฑิต</p>
        </div>

        <Form layout="vertical" onFinish={handleFinish} requiredMark={false}>
          <Form.Item name="username" rules={[{ required: true, message: "กรุณากรอกชื่อผู้ใช้งาน" }]} style={{ marginBottom: 12 }}>
            <Input prefix={<UserOutlined style={{ color: "#94a3b8" }} />} placeholder="ชื่อผู้ใช้งาน (admin)" size="large" style={{ borderRadius: 10 }} />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true, message: "กรุณากรอกรหัสผ่าน" }]} style={{ marginBottom: 16 }}>
            <Input.Password prefix={<LockOutlined style={{ color: "#94a3b8" }} />} placeholder="รหัสผ่าน (123456)" size="large" style={{ borderRadius: 10 }} />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0 }}>
            <Button type="primary" htmlType="submit" size="large" block loading={loading} style={{ borderRadius: 10, background: "#00b4d8", borderColor: "#00b4d8", fontWeight: 600, height: 45 }}>
              เข้าสู่ระบบ
            </Button>
          </Form.Item>
        </Form>

        <Divider style={{ margin: "20px 0 16px 0", color: "#94a3b8", fontSize: 12 }}>หรือเข้าสู่ระบบด้วย</Divider>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}>
          <GoogleLogin onSuccess={handleGoogleSuccess} onError={handleGoogleError} useOneTap shape="pill" text="signin_with" locale="th" />
        </div>
      </Card>
    </div>
  );
};

export default LoginPage;
