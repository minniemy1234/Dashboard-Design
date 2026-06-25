import Sidebar from "../components/Sidebar";
import { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import { setDashboardData } from "../data/dashboardData";
import {
  Layout,
  Card,
  Button,
  Modal,
  message,
  Empty,
} from "antd";
import {
  UploadOutlined,
  DeleteOutlined,
  FileExcelOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";

const { Header, Content } = Layout;

function UploadPage() {
  const [fileName, setFileName] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [sheetNames, setSheetNames] = useState([]);
  const [tempResult, setTempResult] = useState(null);
  const [existingCategories, setExistingCategories] = useState([]);

  // ดึงข้อมูลที่เคยค้างในระบบขึ้นมาแสดงผลทันที
  useEffect(() => {
    const stored = localStorage.getItem("dashboardData");
    if (stored) {
      const data = JSON.parse(stored);
      setExistingCategories(Object.keys(data));
    }
  }, []);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setSelectedFile(file);
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      const data = e.target.result;
      const workbook = XLSX.read(data, { type: "binary" });

      const result = {};
      setSheetNames(workbook.SheetNames);

      workbook.SheetNames.forEach((sheetName) => {
        const worksheet = workbook.Sheets[sheetName];
        result[sheetName] = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
      });

      if (file.name.endsWith(".csv") && result["Sheet1"]) {
        result["จำนวนนิสิตคงอยู่"] = result["Sheet1"];
        delete result["Sheet1"];
        setSheetNames(["จำนวนนิสิตคงอยู่"]);
      }

      setTempResult(result);
    };
    reader.readAsBinaryString(file);
  };

  const handleUpload = () => {
    if (!selectedFile || !tempResult) {
      message.warning("กรุณาเลือกไฟล์ก่อนทำการอัปโหลด");
      return;
    }

    Modal.confirm({
      title: "ยืนยันการนำเข้าข้อมูล?",
      content: "ต้องการเพิ่มข้อมูลจากไฟล์นี้เข้าสู่ระบบใช่หรือไม่? หากมีข้อมูลในกลุ่มเดิมค้างอยู่ระบบจะทำการอัปเดตแทนที่ทันที",
      okText: "ยืนยันนำเข้า",
      cancelText: "ยกเลิก",
      onOk() {
        const existingDataStr = localStorage.getItem("dashboardData");
        let finalData = existingDataStr ? JSON.parse(existingDataStr) : {};

        finalData = {
          ...finalData,
          ...tempResult
        };

        setDashboardData(finalData);
        localStorage.setItem("dashboardData", JSON.stringify(finalData));
        setExistingCategories(Object.keys(finalData));

        setSelectedFile(null);
        setFileName("");
        setTempResult(null);
        setSheetNames([]);

        message.success("นำเข้าข้อมูลและเชื่อมโยงระบบ Dashboard สำเร็จ");
      },
    });
  };

  const handleDeleteCategory = (categoryName) => {
    Modal.confirm({
      title: "ต้องการลบข้อมูลกลุ่มนี้ใช่หรือไม่?",
      content: `ข้อมูลในหมวด "${categoryName}" ทั้งหมดจะถูกลบออกและจะไม่แสดงผลบนหน้าแรกอีกต่อไป`,
      okText: "ลบข้อมูล",
      cancelText: "ยกเลิก",
      okButtonProps: { danger: true },
      onOk() {
        const stored = localStorage.getItem("dashboardData");
        if (stored) {
          const data = JSON.parse(stored);
          delete data[categoryName];

          setDashboardData(data);
          localStorage.setItem("dashboardData", JSON.stringify(data));
          setExistingCategories(Object.keys(data));
          message.success(`ลบข้อมูลหมวด "${categoryName}" เรียบร้อยแล้ว`);
        }
      },
    });
  };

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sidebar />
      <Layout>
        {/* 🔥 ปรับปรุงส่วน Header ให้ชิดกระชับเหมือนหน้าแรก บรรทัดไม่ห่างกันแล้ว */}
        <Header
          style={{
            background: "white",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "20px 20px",
            height: "auto",
            lineHeight: "normal",
          }}
        >
          <div style={{ paddingTop: 10 }}>
            <h2 style={{ margin: 0 }}>Data Management</h2>
            <div style={{ color: "#888", fontSize: 13, marginTop: 2 }}>จัดการข้อมูล อัปโหลด และลบไฟล์ค้างในระบบ</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div>Admin</div>
            <div style={{ color: "#888", fontSize: 12 }}>{new Date().toLocaleDateString()}</div>
          </div>
        </Header>

        {/* ปรับลด Padding ของ Content ลงเล็กน้อยให้สมดุล */}
        <Content style={{ padding: "16px 32px 32px 32px", marginTop: 0, background: "#f5f5f5" }}>
          <div style={{ display: "grid", gridTemplateColumns: "55% 45%", gap: 20, alignItems: "start" }}>
            
            {/* ฝั่งซ้าย: กล่องอัปโหลดไฟล์ */}
            <Card 
              title="1. เลือกและนำเข้าไฟล์ใหม่" 
              style={{ borderRadius: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}
              bodyStyle={{ padding: "20px" }}
            >
              <p style={{ color: "#666", margin: "0 0 16px 0", fontSize: 14, lineHeight: "1.4" }}>
                คุณสามารถเลือกไฟล์ Excel (.xlsx, .xls) หรือไฟล์ CSV เพื่อเพิ่มหรืออัปเดตระบบวิเคราะห์ข้อมูลได้
              </p>
              
              <div 
                style={{ 
                  border: "2px dashed #3b82f6", 
                  padding: "24px 16px", 
                  borderRadius: 12, 
                  textAlign: "center",
                  background: "#f0f7ff",
                  marginBottom: 16,
                }}
              >
                <UploadOutlined style={{ fontSize: 28, color: "#3b82f6", marginBottom: 8 }} />
                <div>
                  <label htmlFor="file-upload" style={{ cursor: "pointer", color: "#3b82f6", fontWeight: 600, fontSize: 14 }}>
                    คลิกเพื่อเลือกไฟล์จากคอมพิวเตอร์
                  </label>
                  <input
                    id="file-upload"
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileChange}
                    style={{ display: "none" }}
                  />
                </div>
                <div style={{ color: "#888", fontSize: 12, marginTop: 4 }}>รองรับไฟล์ขนาดไม่เกิน 20MB</div>
              </div>

              {fileName && (
                <div style={{ background: "#f9fafb", padding: "12px 16px", borderRadius: 10, border: "1px solid #e5e7eb", marginBottom: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <FileExcelOutlined style={{ fontSize: 20, color: "#10b981" }} />
                    <div style={{ flexGrow: 1, lineHeight: "1.3" }}>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{fileName}</div>
                      <div style={{ fontSize: 12, color: "#666", marginTop: 2 }}>ตรวจพบกลุ่มข้อมูล: {sheetNames.join(", ")}</div>
                    </div>
                  </div>
                </div>
              )}

              <Button 
                type="primary" 
                size="large" 
                icon={<CheckCircleOutlined />} 
                disabled={!selectedFile}
                onClick={handleUpload}
                style={{ width: "100%", height: 44, borderRadius: 10, fontSize: 15 }}
              >
                ยืนยันนำเข้าข้อมูลเข้า Dashboard
              </Button>
            </Card>

            {/* ฝั่งขวา: กล่องแสดงข้อมูลค้างในระบบและปุ่มลบออก */}
            <Card 
              title="2. ข้อมูลปัจจุบันที่มีอยู่ในคลังระบบ" 
              style={{ borderRadius: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}
              bodyStyle={{ padding: "20px" }}
            >
              <p style={{ color: "#666", margin: "0 0 16px 0", fontSize: 14, lineHeight: "1.4" }}>
                รายการข้อมูลกลุ่มต่าง ๆ ที่ค้างอยู่ในฐานข้อมูลตอนนี้ คุณสามารถสั่งลบเพื่อรีเซ็ตหน้าแสดงผลได้ทันที
              </p>
              
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {existingCategories.map((category) => (
                  <div 
                    key={category}
                    style={{ 
                      display: "flex", 
                      justifyContent: "space-between", 
                      alignItems: "center", 
                      padding: "10px 14px", 
                      background: "#fff", 
                      border: "1px solid #e5e7eb", 
                      borderRadius: 10,
                      boxShadow: "0 1px 2px rgba(0,0,0,0.01)"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#3b82f6" }}></div>
                      <span style={{ fontWeight: 500, fontSize: 14 }}>{category}</span>
                    </div>
                    <Button 
                      type="text" 
                      danger 
                      icon={<DeleteOutlined />} 
                      onClick={() => handleDeleteCategory(category)}
                      style={{ borderRadius: 6, height: 32, padding: "0 8px" }}
                    >
                      ลบข้อมูลออก
                    </Button>
                  </div>
                ))}

                {existingCategories.length === 0 && (
                  <Empty description="ไม่มีข้อมูลค้างอยู่ในระบบ" style={{ padding: "20px 0" }} />
                )}
              </div>
            </Card>

          </div>
        </Content>
      </Layout>
    </Layout>
  );
}

export default UploadPage;