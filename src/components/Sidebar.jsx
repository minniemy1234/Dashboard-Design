import React, { useState, useEffect } from "react";
import { Layout, Menu, Button, message, Avatar } from "antd";
import { useNavigate, useLocation } from "react-router-dom";
import {
  DashboardOutlined,
  GlobalOutlined,
  UploadOutlined,
  TeamOutlined,
  UserOutlined,
  BarChartOutlined,
  UsergroupDeleteOutlined,
  LikeOutlined,
  IdcardOutlined,
  BookOutlined,
  LogoutOutlined,
  SafetyCertificateOutlined
} from "@ant-design/icons";
import { db } from "../firebase";
import { doc, onSnapshot } from "firebase/firestore";

const { Sider } = Layout;

function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const userEmail = (localStorage.getItem("email") || "").toLowerCase();
  const userName = localStorage.getItem("user") || "ผู้ใช้งาน";
  const userPicture = localStorage.getItem("picture");

  const [adminList, setAdminList] = useState(["naramon.si@ku.th"]);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "system_config", "admins"), (docSnap) => {
      if (docSnap.exists() && Array.isArray(docSnap.data().list)) {
        setAdminList(docSnap.data().list.map(e => e.toLowerCase()));
      }
    });
    return () => unsub();
  }, []);

  const isAdmin = adminList.includes(userEmail);
  const isSuperAdmin = userEmail === "naramon.si@ku.th";

 
  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("role");
    localStorage.removeItem("email");
    localStorage.removeItem("user");
    localStorage.removeItem("picture");
    localStorage.removeItem("token");
    
    message.info("ออกจากระบบเรียบร้อยแล้ว");
    navigate("/login");
  };

  const menuItems = [
    { key: "/", icon: <DashboardOutlined />, label: "Dashboard หลัก" },
    { key: "/employment", icon: <GlobalOutlined />, label: "ภาวะการมีงานทำ" },
  ];

  if (isAdmin) {
    menuItems.push({ key: "/upload", icon: <UploadOutlined />, label: "Admin Upload" });
  }

  if (isSuperAdmin) {
    menuItems.push({
      key: "/admin-management",
      icon: <SafetyCertificateOutlined style={{ color: "#ff4d4f" }} />,
      label: "จัดการผู้ดูแลระบบ",
    });
  }

  menuItems.push(
    { key: "/students", icon: <TeamOutlined />, label: "ข้อมูลนิสิต" },
    { key: "/faculty", icon: <UserOutlined />, label: "ข้อมูลอาจารย์" },
    { key: "/summary", icon: <BarChartOutlined />, label: "รายงานสรุป" },
    { key: "/student-status", icon: <UsergroupDeleteOutlined />, label: "ข้อมูลสถานะนิสิต" },
    { key: "/evaluation", icon: <LikeOutlined style={{ color: "#52c41a" }} />, label: "ผลการประเมินหลักสูตร" },
    { key: "/graduate-quality", icon: <IdcardOutlined style={{ color: "#13c2c2" }} />, label: "ผลประเมินคุณภาพบัณฑิต" },
    { key: "/courses", icon: <BookOutlined style={{ color: "#f5b731" }} />, label: "ข้อมูลรายวิชา" }
  );

  return (
    <Sider width={240} style={{ background: "#142549", minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
      <div>
        <div style={{ color: "white", padding: "20px 16px", fontSize: 20, fontWeight: "bold", textAlign: "center", borderBottom: "1px solid rgba(255, 255, 255, 0.1)", marginBottom: 10 }}>
          University
        </div>
        <div style={{ padding: "0 16px 16px 16px", display: "flex", alignItems: "center", gap: 10, borderBottom: "1px solid rgba(255, 255, 255, 0.05)", marginBottom: 10 }}>
          <Avatar src={userPicture} icon={<UserOutlined />} style={{ backgroundColor: "#00b4d8" }} />
          <div style={{ overflow: "hidden" }}>
            <div style={{ color: "#fff", fontSize: 13, fontWeight: 600, textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
              {userName}
            </div>
            <div style={{ color: "#94a3b8", fontSize: 11 }}>
              {isAdmin ? "🔑 Admin" : "👤 User"}
            </div>
          </div>
        </div>
        <Menu mode="inline" theme="dark" style={{ background: "#142549", borderRight: "none" }} selectedKeys={[location.pathname]} onClick={({ key }) => navigate(key)} items={menuItems} />
      </div>
      <div style={{ padding: "16px 20px", borderTop: "1px solid rgba(255, 255, 255, 0.1)" }}>
        <Button danger type="primary" block icon={<LogoutOutlined />} onClick={handleLogout} style={{ borderRadius: 8, fontWeight: 500, background: "#ef4444", borderColor: "#ef4444" }}>
          ออกจากระบบ
        </Button>
      </div>
    </Sider>
  );
}

export default Sidebar;
