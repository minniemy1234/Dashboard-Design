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
  BarChartOutlined,
  FileTextOutlined, // เพิ่มไอคอนสำหรับส่วนประเมินคุณภาพ
} from "@ant-design/icons";

const { Header, Content } = Layout;

function UploadPage() {
  
  const [fileName, setFileName] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [sheetNames, setSheetNames] = useState([]);
  const [tempResult, setTempResult] = useState(null);

  
  const [graphFileName, setGraphFileName] = useState("");
  const [selectedGraphFile, setSelectedGraphFile] = useState(null);
  const [tempGraphResult, setTempGraphResult] = useState(null);

  // 🌟 State เพิ่มเติม: สำหรับจัดการไฟล์กราฟประเมินคุณภาพรายองค์ประกอบโดยเฉพาะ
  const [evalFileName, setEvalFileName] = useState("");
  const [selectedEvalFile, setSelectedEvalFile] = useState(null);
  const [tempEvalResult, setTempEvalResult] = useState(null);

  const [existingCategories, setExistingCategories] = useState([]);

  useEffect(() => {
    refreshExistingCategories();
  }, []);

  const refreshExistingCategories = () => {
    const stored = localStorage.getItem("dashboardData");
    if (stored) {
      const data = JSON.parse(stored);
      setExistingCategories(Object.keys(data));
    }
  };

  // จัดการไฟล์ข้อมูลทั่วไป
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

  // จัดการไฟล์กราฟสาขา (เดิม)
  const handleGraphFileChange = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setSelectedGraphFile(file);
    setGraphFileName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      const data = e.target.result;
      const workbook = XLSX.read(data, { type: "binary" });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonOutput = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

      setTempGraphResult({
        "กราาฟสาขา(in)": jsonOutput
      });
    };
    reader.readAsBinaryString(file);
  };

  // 🌟 ฟังก์ชันจัดการเลือกไฟล์สำหรับกราฟประเมินคุณภาพรายองค์ประกอบ (เพิ่มใหม่)
  const handleEvalFileChange = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setSelectedEvalFile(file);
    setEvalFileName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      const data = e.target.result;
      const workbook = XLSX.read(data, { type: "binary" });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonOutput = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

      // แมปหัวคอลัมน์ให้อยู่ในรูปแบบที่หน้ากราฟ EvaluationPage ต้องการเอาไปแสดงผลต่อได้ง่ายๆ
      const formattedData = jsonOutput.map((item) => ({
        name: item["องค์ประกอบ"] || item["ชื่อองค์ประกอบ"] || item["หัวข้อ"] || item["Component"] || "-",
        score: Number(item["คะแนน"] || item["ผลการประเมิน"] || item["คะแนนปีนี้"] || item["Score"] || 0),
        target: Number(item["เป้าหมาย"] || item["คะแนนปีที่แล้ว"] || item["Target"] || 0),
      }));

      // บันทึกแยกคีย์เก็บข้อมูลลงใน "ข้อมูลประเมินคุณภาพ"
      setTempEvalResult({
        "ข้อมูลประเมินคุณภาพ": formattedData
      });
    };
    reader.readAsBinaryString(file);
  };


  const handleUpload = () => {
    if (!selectedFile || !tempResult) return;
    Modal.confirm({
      title: "ยืนยันการนำเข้าข้อมูลทั่วไป?",
      content: "ต้องการเพิ่มข้อมูลจากไฟล์นี้เข้าสู่ระบบใช่หรือไม่?",
      okText: "ยืนยัน",
      cancelText: "ยกเลิก",
      onOk() {
        saveToLocalStorage(tempResult);
        setSelectedFile(null);
        setFileName("");
        setTempResult(null);
        message.success("นำเข้าข้อมูลทั่วไปสำเร็จ");
      }
    });
  };

  // บันทึกไฟล์กราฟแยกต่างหาก (เดิม)
  const handleGraphUpload = () => {
    if (!selectedGraphFile || !tempGraphResult) return;
    Modal.confirm({
      title: "ยืนยันการนำเข้าไฟล์กราฟสาขา?",
      content: "ต้องการอัปเดตข้อมูล Top 5 สาขาด้วยไฟล์นี้ใช่หรือไม่?",
      okText: "ยืนยันนำเข้ากราฟ",
      cancelText: "ยกเลิก",
      onOk() {
        saveToLocalStorage(tempGraphResult);
        setSelectedGraphFile(null);
        setGraphFileName("");
        setTempGraphResult(null);
        message.success("อัปเดตข้อมูลกราฟสาขาเรียบร้อยแล้ว");
      }
    });
  };

  // 🌟 ฟังก์ชันกดยืนยันอัปโหลดไฟล์สถิติกราฟประเมินคุณภาพ (เพิ่มใหม่)
  const handleEvalUpload = () => {
    if (!selectedEvalFile || !tempEvalResult) return;
    Modal.confirm({
      title: "ยืนยันการนำเข้าไฟล์กราฟประเมินคุณภาพ?",
      content: "ต้องการนำเข้าไฟล์เปรียบเทียบผลการประเมินคุณภาพรายองค์ประกอบใช่หรือไม่? (กราฟจะแสดงผลอัตโนมัติที่หน้า Evaluation)",
      okText: "ยืนยันนำเข้า",
      cancelText: "ยกเลิก",
      onOk() {
        saveToLocalStorage(tempEvalResult);
        setSelectedEvalFile(null);
        setEvalFileName("");
        setTempEvalResult(null);
        message.success("อัปเดตข้อมูลกราฟประเมินคุณภาพรายองค์ประกอบเรียบร้อยแล้ว");
      }
    });
  };

  const saveToLocalStorage = (newData) => {
    const stored = localStorage.getItem("dashboardData");
    let finalData = stored ? JSON.parse(stored) : {};
    finalData = { ...finalData, ...newData };
    setDashboardData(finalData);
    localStorage.setItem("dashboardData", JSON.stringify(finalData));
    refreshExistingCategories();
  };

  const handleDeleteCategory = (categoryName) => {
    Modal.confirm({
      title: "ต้องการลบข้อมูลกลุ่มนี้ใช่หรือไม่?",
      content: `ข้อมูลในหมวด "${categoryName}" จะถูกลบออกจากระบบถาวร`,
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
          refreshExistingCategories();
          message.success(`ลบข้อมูลหมวด "${categoryName}" เรียบร้อยแล้ว`);
        }
      },
    });
  };

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sidebar />
      <Layout>
        <Header style={{ background: "white", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 20px", height: "auto", lineHeight: "normal" }}>
          <div style={{ paddingTop: 10 }}>
            <h2 style={{ margin: 0 }}>Data Management</h2>
            <div style={{ color: "#888", fontSize: 13, marginTop: 2 }}>จัดการข้อมูล อัปโหลด และลบไฟล์แยกตามประเภทคลังข้อมูล</div>
          </div>
        </Header>

        <Content style={{ padding: "16px 32px 32px 32px", background: "#f5f5f5" }}>
          <div style={{ display: "grid", gridTemplateColumns: "55% 45%", gap: 20, alignItems: "start" }}>
            
            {/* ฝั่งซ้าย: รวมกล่องอัปโหลดแบบแยกประเภท */}
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              
              {/* ส่วนที่ 1: อัปโหลดข้อมูลทั่วไป (คงเดิม) */}
              <Card title="1. อัปโหลดข้อมูลมหาวิทยาลัยทั่วไป (TCAS / นิสิตลงทะเบียน / คงอยู่)" style={{ borderRadius: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }} bodyStyle={{ padding: 20 }}>
                <div style={{ border: "2px dashed #d9d9d9", padding: "20px 16px", borderRadius: 12, textAlign: "center", background: "#fafafa", marginBottom: 16 }}>
                  <UploadOutlined style={{ fontSize: 24, color: "#888", marginBottom: 8 }} />
                  <div>
                    <label htmlFor="file-upload" style={{ cursor: "pointer", color: "#3b82f6", fontWeight: 600 }}>คลิกเลือกไฟล์ข้อมูลหลัก</label>
                    <input id="file-upload" type="file" accept=".xlsx,.xls,.csv" onChange={handleFileChange} style={{ display: "none" }} />
                  </div>
                </div>
                {fileName && (
                  <div style={{ background: "#f9fafb", padding: 12, borderRadius: 10, border: "1px solid #e5e7eb", marginBottom: 16, fontSize: 13 }}>
                    <FileExcelOutlined style={{ color: "#10b981", marginRight: 6 }} /> <b>ไฟล์ที่เลือก:</b> {fileName}
                  </div>
                )}
                <Button type="primary" icon={<CheckCircleOutlined />} disabled={!selectedFile} onClick={handleUpload} style={{ width: "100%", height: 40, borderRadius: 8 }}>
                  นำเข้าข้อมูลทั่วไป
                </Button>
              </Card>

              {/* ส่วนที่ 2: ช่องเฉพาะอัปโหลดไฟล์กราฟสาขา (คงเดิม) */}
              <Card title="2. ช่องเฉพาะอัปโหลดไฟล์กราฟสาขา" style={{ borderRadius: 16, border: "1px solid #bae7ff", boxShadow: "0 2px 8px rgba(59,130,246,0.05)" }} bodyStyle={{ padding: 20 }}>
                <p style={{ color: "#666", fontSize: 13, marginBottom: 12 }}>ช่องนี้สำหรับใส่ไฟล์สถิติกราฟแท่งสาขาทั้งหมด</p>
                <div style={{ border: "2px dashed #3b82f6", padding: "24px 16px", borderRadius: 12, textAlign: "center", background: "#f0f7ff", marginBottom: 16 }}>
                  <BarChartOutlined style={{ fontSize: 28, color: "#3b82f6", marginBottom: 8 }} />
                  <div>
                    <label htmlFor="graph-upload" style={{ cursor: "pointer", color: "#3b82f6", fontWeight: 600 }}>
                      คลิกเลือกไฟล์สถิติกราฟสาขา
                    </label>
                    <input id="graph-upload" type="file" accept=".csv,.xlsx,.xls" onChange={handleGraphFileChange} style={{ display: "none" }} />
                  </div>
                </div>
                {graphFileName && (
                  <div style={{ background: "#eff6ff", padding: 12, borderRadius: 10, border: "1px solid #bfdbfe", marginBottom: 16, fontSize: 13 }}>
                    <BarChartOutlined style={{ color: "#3b82f6", marginRight: 6 }} /> <b>ไฟล์กราฟที่เลือก:</b> {graphFileName} (จะถูกนำเข้าสู่ระบบกราฟทันที)
                  </div>
                )}
                <Button type="primary" style={{ backgroundColor: "#3b82f6", borderColor: "#3b82f6", width: "100%", height: 40, borderRadius: 8 }} icon={<CheckCircleOutlined />} disabled={!selectedGraphFile} onClick={handleGraphUpload}>
                  ยืนยันอัปเดตไฟล์กราฟแยกเฉพาะ
                </Button>
              </Card>

              {/* 🌟 🛠️ เพิ่มใหม่ ส่วนที่ 3: ช่องอัปโหลดไฟล์สำหรับกราฟประเมินคุณภาพรายองค์ประกอบ (Evaluation) */}
              <Card title="3. ช่องเฉพาะอัปโหลดกราฟประเมินคุณภาพรายองค์ประกอบ" style={{ borderRadius: 16, border: "1px solid #ffe7ba", boxShadow: "0 2px 8px rgba(245,158,11,0.05)" }} bodyStyle={{ padding: 20 }}>
                <p style={{ color: "#666", fontSize: 13, marginBottom: 12 }}>ช่องนี้สำหรับอัปโหลดข้อมูลกราฟหน้า ผลการประเมินหลักสูตร</p>
                <div style={{ border: "2px dashed #f59e0b", padding: "24px 16px", borderRadius: 12, textAlign: "center", background: "#fffbeb", marginBottom: 16 }}>
                  <FileTextOutlined style={{ fontSize: 28, color: "#f59e0b", marginBottom: 8 }} />
                  <div>
                    <label htmlFor="eval-upload" style={{ cursor: "pointer", color: "#f59e0b", fontWeight: 600 }}>
                      คลิกเลือกไฟล์ประเมินคุณภาพรายองค์ประกอบ
                    </label>
                    <input id="eval-upload" type="file" accept=".csv,.xlsx,.xls" onChange={handleEvalFileChange} style={{ display: "none" }} />
                  </div>
                </div>
                {evalFileName && (
                  <div style={{ background: "#fffbeb", padding: 12, borderRadius: 10, border: "1px solid #fde68a", marginBottom: 16, fontSize: 13 }}>
                    <FileTextOutlined style={{ color: "#f59e0b", marginRight: 6 }} /> <b>ไฟล์ที่เลือก:</b> {evalFileName}
                  </div>
                )}
                <Button type="primary" style={{ backgroundColor: "#f59e0b", borderColor: "#f59e0b", width: "100%", height: 40, borderRadius: 8 }} icon={<CheckCircleOutlined />} disabled={!selectedEvalFile} onClick={handleEvalUpload}>
                  ยืนยันนำเข้ากราฟประเมินคุณภาพ
                </Button>
              </Card>

            </div>

            {/* ฝั่งขวา: แสดงรายการไฟล์ค้างในคลังและลบออก (รองรับคีย์ตัวใหม่ด้วยอัตโนมัติ) */}
            <Card title="คลังข้อมูลปัจจุบันที่มีอยู่ในระบบ" style={{ borderRadius: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }} bodyStyle={{ padding: 20 }}>
              <p style={{ color: "#666", fontSize: 13, marginBottom: 16 }}>คุณสามารถกดลบข้อมูลแต่ละหมวดออกจากระบบแยกกันตรงนี้ได้ทันที</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {existingCategories.map((category) => {
                  // ตั้งค่าสีไฮไลต์และป้ายชื่อเฉพาะสำหรับข้อมูลแต่ละชนิด
                  const isGraphSaKha = category === "กราาฟสาขา(in)";
                  const isEvalGraph = category === "ข้อมูลประเมินคุณภาพ";
                  
                  let bgColor = "#fff";
                  let dotColor = "#52c41a";
                  
                  if (isGraphSaKha) { bgColor = "#f0f7ff"; dotColor = "#3b82f6"; }
                  if (isEvalGraph) { bgColor = "#fffbeb"; dotColor = "#f59e0b"; }

                  return (
                    <div key={category} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: bgColor, border: "1px solid #e5e7eb", borderRadius: 10 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 6, height: 6, borderRadius: "50%", background: dotColor }}></div>
                        <span style={{ fontWeight: 500, fontSize: 14 }}>{category}</span>
                        {isGraphSaKha && <span style={{ fontSize: 11, color: "#3b82f6", background: "#e6f7ff", padding: "2px 6px", borderRadius: 4 }}>ข้อมูลกราฟสาขา</span>}
                        {isEvalGraph && <span style={{ fontSize: 11, color: "#f59e0b", background: "#fef3c7", padding: "2px 6px", borderRadius: 4 }}>ข้อมูลกราฟประเมิน</span>}
                      </div>
                      <Button type="text" danger icon={<DeleteOutlined />} onClick={() => handleDeleteCategory(category)} style={{ borderRadius: 6, height: 32, padding: "0 8px" }}>
                        ลบออก
                      </Button>
                    </div>
                  );
                })}
                {existingCategories.length === 0 && <Empty description="ไม่มีข้อมูลค้างอยู่ในคลังระบบ" style={{ padding: "20px 0" }} />}
              </div>
            </Card>

          </div>
        </Content>
      </Layout>
    </Layout>
  );
}

export default UploadPage;
