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
  SafetyCertificateOutlined,
  ExperimentOutlined,
  DollarOutlined,
  SmileOutlined // 1. นำเข้า SmileOutlined Icon
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

  const topMenuItems = [
    // --- 1. หมวดภาพรวม & บริหาร (สีเขียว) ---
    { 
      key: "/", 
      icon: <DashboardOutlined style={{ color: "#10b981" }} />, 
      label: "หน้าแรก" 
    },

    { type: "divider", style: { borderColor: "rgba(255, 255, 255, 0.1)", margin: "8px 12px" } },

    // --- 2. หมวดข้อมูลนิสิต & บัณฑิต (สีฟ้า / น้ำเงิน) ---
    { 
      key: "/students", 
      icon: <TeamOutlined style={{ color: "#38bdf8" }} />, 
      label: "ข้อมูลนิสิต" 
    },
    { 
      key: "/student-status", 
      icon: <UsergroupDeleteOutlined style={{ color: "#0284c7" }} />, 
      label: "ข้อมูลสถานะนิสิต" 
    },
    { 
      key: "/employment", 
      icon: <GlobalOutlined style={{ color: "#0ea5e9" }} />, 
      label: "ภาวะการมีงานทำ" 
    },
    { 
      key: "/graduate-quality", 
      icon: <IdcardOutlined style={{ color: "#06b6d4" }} />, 
      label: "ผลประเมินคุณภาพบัณฑิต" 
    },
    // 2. เพิ่มเมนูความพึงพอใจนิสิตต่อจากผลประเมินคุณภาพบัณฑิต
    { 
      key: "/student-satisfaction", 
      icon: <SmileOutlined style={{ color: "#14b8a6" }} />, 
      label: "ความพึงพอใจนิสิต" 
    },

    { type: "divider", style: { borderColor: "rgba(255, 255, 255, 0.1)", margin: "8px 12px" } },

    // --- 3. หมวดข้อมูลอาจารย์ & การเรียนการสอน (สีส้ม / ทอง) ---
    { 
      key: "/faculty", 
      icon: <UserOutlined style={{ color: "#f59e0b" }} />, 
      label: "ข้อมูลอาจารย์" 
    },
    { 
      key: "/courses", 
      icon: <BookOutlined style={{ color: "#d97706" }} />, 
      label: "ข้อมูลรายวิชา" 
    },
    { 
      key: "/evaluation", 
      icon: <LikeOutlined style={{ color: "#eab308" }} />, 
      label: "ผลการประเมินหลักสูตร" 
    },
  ];

  // --- 4. หมวดสำหรับ Admin (สีม่วง / ชมพู / แดง) ---
  const bottomMenuItems = [];

  if (isAdmin) {
    bottomMenuItems.push({ 
      key: "/upload", 
      icon: <UploadOutlined style={{ color: "#c084fc" }} />, 
      label: "Admin Upload" 
    });
    bottomMenuItems.push({ 
      key: "/research", 
      icon: <ExperimentOutlined style={{ color: "#a855f7" }} />, 
      label: "ผลงานวิจัย" 
    });
    bottomMenuItems.push({ 
      key: "/finance", 
      icon: <DollarOutlined style={{ color: "#ec4899" }} />, 
      label: "ข้อมูลการเงิน" 
    });
  }

  if (isSuperAdmin) {
    bottomMenuItems.push({
      key: "/admin-management",
      icon: <SafetyCertificateOutlined style={{ color: "#ef4444" }} />,
      label: "จัดการผู้ดูแลระบบ",
    });
  }

  return (
    <Sider 
      width={240} 
      style={{ 
        background: "#142549", 
        height: "100vh",        
        position: "sticky",     
        top: 0,                 
        left: 0,                
        zIndex: 100,            
        display: "flex", 
        flexDirection: "column" 
      }}
    >
      <div 
        style={{ 
          display: "flex", 
          flexDirection: "column", 
          height: "100%", 
          justifyContent: "space-between", 
          flex: 1,
          overflowY: "auto"     
        }}
      >
        
        {/* โลโก้ + โปรไฟล์ + เมนูหน้าหลัก */}
        <div>
          {/* HEADER / LOGO */}
          <div style={{ color: "white", padding: "20px 16px", fontSize: 20, fontWeight: "bold", textAlign: "center", borderBottom: "1px solid rgba(255, 255, 255, 0.1)", marginBottom: 10 }}>
            Dashboard 
          </div>

          {/* USER PROFILE */}
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

          {/* TOP MENU */}
          <Menu 
            mode="inline" 
            theme="dark" 
            style={{ background: "#142549", borderRight: "none" }} 
            selectedKeys={[location.pathname]} 
            onClick={({ key }) => navigate(key)} 
            items={topMenuItems} 
          />
        </div>

        <div style={{ paddingBottom: 16 }}>
          
          {bottomMenuItems.length > 0 && (
            <>
              {/* แบ่งโซนแอดมิน */}
              <div 
                style={{ 
                  height: "1px", 
                  background: "rgba(255, 255, 255, 0.12)", 
                  margin: "12px 16px" 
                }} 
              />

              {/* BOTTOM MENU */}
              <Menu 
                mode="inline" 
                theme="dark" 
                style={{ background: "#142549", borderRight: "none" }} 
                selectedKeys={[location.pathname]} 
                onClick={({ key }) => navigate(key)} 
                items={bottomMenuItems} 
              />
            </>
          )}

          {/* LOGOUT BUTTON */}
          <div style={{ padding: "12px 16px 0 16px" }}>
            <Button 
              danger 
              type="primary" 
              block 
              icon={<LogoutOutlined />} 
              onClick={handleLogout} 
              style={{ borderRadius: 8, fontWeight: 500, background: "#ef4444", borderColor: "#ef4444" }}
            >
              ออกจากระบบ
            </Button>
          </div>

        </div>

      </div>
    </Sider>
  );
}

export default Sidebar;
