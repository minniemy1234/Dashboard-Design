import Sidebar from "../components/Sidebar";
import { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import { setDashboardData } from "../data/dashboardData";
import {
  UploadOutlined,
  DeleteOutlined,
  FileExcelOutlined,
  CheckCircleOutlined,
  DatabaseOutlined,
} from "@ant-design/icons";
import { Layout as AntLayout, Card as AntCard, Button as AntButton, Modal as AntModal, Empty as AntEmpty, Input as AntInput, message } from "antd";

const { Header, Content } = AntLayout;

function UploadPage() {
  
  // ระบบอัปโหลดอัจฉริยะแบบ Single Hub
  const [fileName, setFileName] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [detectedCategory, setDetectedCategory] = useState(""); 
  const [tempResult, setTempResult] = useState(null);

  const [existingCategories, setExistingCategories] = useState([]);
  const [surveyYearsList, setSurveyYearsList] = useState([]);

  useEffect(() => {
    refreshExistingCategories();
  }, []);

  const refreshExistingCategories = () => {
    const stored = localStorage.getItem("dashboardData");
    if (stored) {
      const data = JSON.parse(stored);
      setExistingCategories(Object.keys(data));
      
      if (data["student_retain_survey_group"]) {
        setSurveyYearsList(Object.keys(data["student_retain_survey_group"]).sort());
      } else {
        setSurveyYearsList([]);
      }
    }
  };

  const cleanString = (str) => {
    if (!str) return "";
    return String(str).replace(/\s+/g, '').replace(/['"]+/g, '').trim();
  };

  // ปรับปรุงระบบตรวจจับอัจฉริยะแบบ Single-Upload
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setSelectedFile(file);
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      const data = e.target.result;
      const workbook = XLSX.read(data, { type: "binary" });
      
      const targetSheetKey = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[targetSheetKey];
      const jsonOutput = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

      if (jsonOutput.length === 0) {
        message.error("ไฟล์นี้ไม่มีข้อมูลในแถว!");
        return;
      }

      const columnHeaders = Object.keys(jsonOutput[0]).map(k => cleanString(k));
      let finalCategoryKey = "จำนวนนิสิตคงอยู่"; 
      let finalPayload = {};

      const isCourseEvaluation = columnHeaders.some(h => h.includes("คะแนนรวม") || h.includes("คะแนนเฉลี่ยรวม") || h.includes("องค์ที่"));
      const isGraduateEvaluation = columnHeaders.some(h => h.includes("ค่าเฉลี่ยความพึงพอใจ") || h.includes("หัวข้อ"));
      const isSurveyGroup = file.name.includes("สำรวจ") || file.name.includes("survey");
      
      // เงื่อนไขดักจับไฟล์ภาวะการมีงานทำ (เช็คชื่อคอลัมน์หลักหรือชื่อไฟล์)
      const isEmployment = columnHeaders.some(h => h.includes("ผู้สำเร็จการศึกษา") || h.includes("มีงานทำเดิม") || h.includes("สถานภาพของบัณฑิต") || h.includes("สถานภาพ")) || file.name.includes("งานทำ") || file.name.includes("employment");

      if (isCourseEvaluation) {
        finalCategoryKey = "ผลการประเมินคุณภาพหลักสูตร";
        finalPayload[finalCategoryKey] = jsonOutput;
      } 
      else if (isGraduateEvaluation) {
        finalCategoryKey = "ผลการประเมินคุณภาพบัณฑิต";
        finalPayload[finalCategoryKey] = jsonOutput;
      }
      else if (isEmployment) {
        // [🔥 จุดแก้ไขสำคัญ] บันทึกไฟล์ข้อมูลนี้กระจายลง 2 Key พร้อมกันเพื่อให้ทั้งตารางและกราฟแสดงผลได้ทันที
        finalCategoryKey = "ภาวะการมีงานทำ + แผนภูมิสัดส่วน";
        finalPayload["ภาวะการมีงานทำ"] = jsonOutput;
        finalPayload["employment_chart_data"] = jsonOutput;
      } 
      else if (isSurveyGroup) {
        finalCategoryKey = "student_retain_survey_group";
        finalPayload[finalCategoryKey] = jsonOutput;
      } else {
        finalPayload[finalCategoryKey] = jsonOutput;
      }

      setDetectedCategory(finalCategoryKey);
      setTempResult(finalPayload);
    };
    reader.readAsBinaryString(file);
  };

  const handleUpload = () => {
    if (!selectedFile || !tempResult) return;

    if (detectedCategory === "student_retain_survey_group") {
      let inputYear = "";
      const yearMatch = fileName.match(/\d{4}/);
      if (yearMatch) inputYear = yearMatch[0];

      AntModal.confirm({
        title: "ระบุปีการศึกษาของไฟล์สถิติ",
        content: <AntInput defaultValue={inputYear} onChange={(e) => { inputYear = e.target.value; }} style={{ borderRadius: 8, marginTop: 10 }} />,
        onOk() {
          const finalYear = inputYear.trim();
          if (!finalYear) return Promise.reject();
          const stored = localStorage.getItem("dashboardData");
          let currentDashboard = stored ? JSON.parse(stored) : {};
          let targetStore = currentDashboard[detectedCategory] || {};
          
          targetStore[finalYear] = tempResult[detectedCategory];
          currentDashboard[detectedCategory] = targetStore;
          
          setDashboardData(currentDashboard);
          localStorage.setItem("dashboardData", JSON.stringify(currentDashboard));
          clearMainUpload();
          message.success("นำเข้าไฟล์รายปีเข้าสู่ระบบเรียบร้อย");
        }
      });
    } else {
      AntModal.confirm({
        title: "ยืนยันนำเข้าคลังข้อมูลสารสนเทศ",
        content: `ระบบตรวจวิเคราะห์พบเนื้อหาประเภทกลุ่ม [ ${detectedCategory} ] ต้องการจัดเก็บไฟล์นี้ใช่หรือไม่?`,
        onOk() {
          saveToLocalStorage(tempResult);
          clearMainUpload();
          message.success("อัปเดตฐานข้อมูลสำเร็จเรียบร้อยแล้ว ระบบพร้อมดึงไปแสดงผลตารางและพล็อตกราฟทันที");
        }
      });
    }
  };

  const clearMainUpload = () => {
    setFileName("");
    setSelectedFile(null);
    setDetectedCategory("");
    setTempResult(null);
    refreshExistingCategories();
  };

  // ปรับการอัปเดตแบบฉีดเนื้อหาใหม่เข้าไปรวมกับของเดิม
  const saveToLocalStorage = (newData) => {
    const stored = localStorage.getItem("dashboardData");
    let finalData = stored ? JSON.parse(stored) : {};
    finalData = { ...finalData, ...newData };
    setDashboardData(finalData);
    localStorage.setItem("dashboardData", JSON.stringify(finalData));
    refreshExistingCategories();
  };

  const handleDeleteCategory = (categoryName) => {
    AntModal.confirm({
      title: "ต้องการลบข้อมูลกลุ่มนี้ใช่หรือไม่?",
      content: `หมวดข้อมูล "${categoryName}" จะถูกลบออกถาวร`,
      okButtonProps: { danger: true },
      onOk() {
        const stored = localStorage.getItem("dashboardData");
        if (stored) {
          const data = JSON.parse(stored);
          delete data[categoryName];
          setDashboardData(data);
          localStorage.setItem("dashboardData", JSON.stringify(data));
          refreshExistingCategories();
          message.success("ลบข้อมูลออกจากคลังสำเร็จ");
        }
      }
    });
  };

  const handleDeleteSurveyYear = (year) => {
    const stored = localStorage.getItem("dashboardData");
    if (stored) {
      const data = JSON.parse(stored);
      delete data["student_retain_survey_group"][year];
      localStorage.setItem("dashboardData", JSON.stringify(data));
      setDashboardData(data); 
      refreshExistingCategories();
    }
  };

  const commonCardStyle = {
    borderRadius: 16, 
    border: "1px solid #e5e7eb", 
    boxShadow: "0 2px 8px rgba(0,0,0,0.02)"
  };

  return (
    <AntLayout style={{ minHeight: "100vh" }}>
      <Sidebar />
      <AntLayout>
        
        <Header style={{ background: "white", padding: "16px 24px", height: "auto", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #f0f0f0" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <h2 style={{ margin: 0, fontSize: "20px", fontWeight: "600", color: "#1f1f1f", lineHeight: "1.2" }}>
              Data Management
            </h2>
            <div style={{ color: "#8c8c8c", fontSize: "13px", lineHeight: "1.4", margin: 0 }}>
              ระบบศูนย์กลางอัปโหลดไฟล์สารสนเทศและประมวลผลกราฟสถิติต่างๆ ภายในคณะ
            </div>
          </div>
        </Header>

        <Content style={{ padding: "24px 32px 32px 32px", background: "#f5f5f5" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, alignItems: "start" }}>
            
            {/* ฝั่งซ้าย: ศูนย์กลางอัปโหลดไฟล์อัจฉริยะ (ช่องเดียวจบ) */}
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              
              <AntCard title="🚀 ช่องอัปโหลดไฟล์ระบบสารสนเทศหลัก" style={{ ...commonCardStyle, borderTop: "4px solid #0050b3" }}>
                <p style={{ color: "#64748b", fontSize: 13, marginBottom: 16 }}>
                  <b>ระบบวิเคราะห์ประเภทข้อมูลอัตโนมัติ:</b> วางไฟล์ข้อมูลดิบชุดใดก็ได้ ระบบจะทำการวิเคราะห์ความสอดคล้องของตาราง บันทึกเข้าคลัง และเตรียมประมวลผลขึ้นกราฟแสดงสัดส่วนให้อัตโนมัติทันที
                </p>
                <div style={{ border: "2px dashed #0050b3", padding: "40px 16px", borderRadius: 12, textAlign: "center", background: "#f0f5ff", transition: "all 0.3s ease", marginBottom: 16 }}>
                  <UploadOutlined style={{ fontSize: 32, color: "#0050b3", marginBottom: 12 }} />
                  <div>
                    <label htmlFor="file-upload" style={{ cursor: "pointer", color: "#0050b3", fontWeight: 700, fontSize: 14 }}>คลิกเลือกไฟล์ชุดข้อมูล (.csv, .xlsx)</label>
                    <input id="file-upload" type="file" accept=".xlsx,.xls,.csv" onChange={handleFileChange} style={{ display: "none" }} />
                  </div>
                </div>
                {fileName && (
                  <div style={{ background: "#f0fdf4", padding: 12, borderRadius: 10, border: "1px solid #bbf7d0", marginBottom: 16, fontSize: 13 }}>
                    <FileExcelOutlined style={{ color: "#16a34a", marginRight: 6 }} /> <b>ไฟล์ที่เลือก:</b> {fileName}
                    {detectedCategory && (
                      <div style={{ marginTop: 6, color: "#166534" }}>
                        🔎 ระบบตรวจพบและจำแนกเป็น: <b style={{ background: "#dcfce7", padding: "2px 6px", borderRadius: 4 }}>
                          {detectedCategory}
                        </b>
                      </div>
                    )}
                  </div>
                )}
                <AntButton 
                  type="primary" 
                  icon={<CheckCircleOutlined />} 
                  disabled={!selectedFile} 
                  onClick={handleUpload} 
                  style={{ width: "100%", height: 42, borderRadius: 10, background: "#0050b3", borderColor: "#0050b3", fontWeight: 600, fontSize: 14 }}
                >
                  วิเคราะห์และบันทึกเข้าสู่ระบบ
                </AntButton>
              </AntCard>

            </div>

            {/* ฝั่งขวา: คลังข้อมูลปัจจุบันในระบบ */}
            <AntCard title={<span><DatabaseOutlined style={{ marginRight: 8, color: "#0077b6" }} /> คลังข้อมูลระบบปัจจุบัน</span>} style={{ ...commonCardStyle, position: "sticky", top: 24 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {existingCategories.map((category) => {
                  const isSurveyGroup = category === "student_retain_survey_group";
                  const isEmpChart = category === "employment_chart_data";
                  
                  return (
                    <div key={category} style={{ padding: "16px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 12 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#00b4d8" }}></div>
                          <span style={{ fontWeight: 600, fontSize: 14, color: "#1e293b" }}>
                            {isEmpChart ? "📊 ข้อมูลแผนภูมิสัดส่วน (ภาวะการมีงานทำ)" : category}
                          </span>
                        </div>
                        <AntButton type="text" danger size="small" icon={<DeleteOutlined />} onClick={() => handleDeleteCategory(category)}>ลบทั้งหมด</AntButton>
                      </div>

                      {isSurveyGroup && surveyYearsList.map(year => (
                        <div key={year} style={{ display: "flex", justifyContent: "space-between", marginTop: 8, background: "#fff", padding: "6px 12px", borderRadius: 8, fontSize: 12, border: "1px solid #f1f5f9" }}>
                          <span style={{ color: "#475569" }}>📆 ปีสำรวจ: {year}</span>
                          <span style={{ color: "#ef4444", cursor: "pointer", fontWeight: 500 }} onClick={() => handleDeleteSurveyYear(year)}>ลบ</span>
                        </div>
                      ))}
                    </div>
                  );
                })}
                {existingCategories.length === 0 && (
                  <AntEmpty image={AntEmpty.PRESENTED_IMAGE_SIMPLE} description="ยังไม่มีข้อมูลบันทึกในคลังระบบ" />
                )}
              </div>
            </AntCard>

          </div>
        </Content>
      </AntLayout>
    </AntLayout>
  );
}

export default UploadPage;
