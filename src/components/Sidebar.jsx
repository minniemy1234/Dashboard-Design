import { Layout, Menu } from "antd";
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
  IdcardOutlined
} from "@ant-design/icons";

const { Sider } = Layout;

function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <Sider
      width={240}
      style={{
        background: "#142549",
        minHeight: "100vh",
      }}
    >
      <div
        style={{
          color: "white",
          padding: 20,
          fontSize: 22,
          fontWeight: "bold",
          textAlign: "center",
          borderBottom: "1px solid rgba(255,255,255,0.1)",
          marginBottom: 10
        }}
      >
        University
      </div>

      <Menu
        mode="inline"
        theme="dark"
        style={{
          background: "#142549",
          borderRight: "none",
        }}
        selectedKeys={[location.pathname]}
        onClick={({ key }) => navigate(key)}
        items={[
          {
            key: "/",
            icon: <DashboardOutlined />,
            label: "Dashboard หลัก",
          },
          {
            key: "/employment",
            icon: <GlobalOutlined />,
            label: "ภาวะการมีงานทำ",
          },
          {
            key: "/upload",
            icon: <UploadOutlined />,
            label: "Admin Upload",
          },
          {
            key: "/students",
            icon: <TeamOutlined />,
            label: "ข้อมูลนิสิต",
          },
          {
            key: "/faculty",
            icon: <UserOutlined />,
            label: "ข้อมูลอาจารย์",
          },
          {
            key: "/summary",
            icon: <BarChartOutlined />,
            label: "รายงานสรุป",
          },
          {
            key: "/student-status",
            icon: <UsergroupDeleteOutlined />,
            label: "ข้อมูลสถานะนิสิต",
          },
         
          {
            key: "/evaluation",
            icon: <LikeOutlined style={{ color: "#52c41a" }} />,
            label: "ผลการประเมินหลักสูตร",
          },
          {
            key: "/graduate-quality",
            icon: <IdcardOutlined style={{ color: "#13c2c2" }} />, // สีฟ้าครามพรีเมียม
            label: "ผลประเมินคุณภาพบัณฑิต",
          },
        ]}
      />
    </Sider>
  );
}

export default Sidebar;
