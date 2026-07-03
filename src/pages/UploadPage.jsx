import Sidebar from "../components/Sidebar";
import { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import { setDashboardData } from "../data/dashboardData";
import {
  UploadOutlined,
  DeleteOutlined,
  FileExcelOutlined,
  CheckCircleOutlined,
  BarChartOutlined,
  FileTextOutlined,
  DatabaseOutlined,
} from "@ant-design/icons";
import { Layout as AntLayout, Card as AntCard, Button as AntButton, Modal as AntModal, Empty as AntEmpty, Input as AntInput, message } from "antd";

const { Header, Content } = AntLayout;

function UploadPage() {
  
  // ช่องที่ 1: ระบบอัปโหลดอัจฉริยะจำแนกอัตโนมัติ
  const [fileName, setFileName] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [detectedCategory, setDetectedCategory] = useState(""); 
  const [tempResult, setTempResult] = useState(null);

  // ช่องเฉพาะ 2, 3, 4
  const [surveyFileName, setSurveyFileName] = useState("");
  const [selectedSurveyFile, setSelectedSurveyFile] = useState(null);
  const [tempSurveyRawData, setTempSurveyRawData] = useState(null);

  const [admitFileName, setAdmitFileName] = useState("");
  const [selectedAdmitFile, setSelectedAdmitFile] = useState(null);
  const [tempAdmitRawData, setTempAdmitRawData] = useState(null);

  const [evalFileName, setEvalFileName] = useState("");
  const [selectedEvalFile, setSelectedEvalFile] = useState(null);
  const [tempEvalResult, setTempEvalResult] = useState(null);

  // ช่องเฉพาะ 5: ข้อมูลกราฟแท่งภาวะการมีงานทำ
  const [empChartFileName, setEmpChartFileName] = useState("");
  const [selectedEmpChartFile, setSelectedEmpChartFile] = useState(null);
  const [tempEmpChartRawData, setTempEmpChartRawData] = useState(null);

  const [existingCategories, setExistingCategories] = useState([]);
  const [surveyYearsList, setSurveyYearsList] = useState([]);
  const [admitYearsList, setAdmitYearsList] = useState([]);

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

      if (data["student_retain_admit_group"]) {
        setAdmitYearsList(Object.keys(data["student_retain_admit_group"]).sort());
      } else {
        setAdmitYearsList([]);
      }
    }
  };

  const cleanString = (str) => {
    if (!str) return "";
    return String(str).replace(/\s+/g, '').replace(/['"]+/g, '').trim();
  };

  // ช่องที่ 1: ระบบตรวจจับอัตโนมัติ
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
      const finalPayload = {};

      const isCourseEvaluation = columnHeaders.some(h => h.includes("คะแนนรวม") || h.includes("คะแนนเฉลี่ยรวม") || h.includes("องค์ที่"));
      const isGraduateEvaluation = columnHeaders.some(h => h.includes("ค่าเฉลี่ยความพึงพอใจ") || h.includes("หัวข้อ"));
      const isEmploymentChart = file.name.includes("กราฟงานทำ") || file.name.includes("chart_employment") || file.name.includes("employment_chart") || columnHeaders.some(h => h.includes("สัดส่วน") || h.includes("กราฟ"));
      const isEmployment = columnHeaders.some(h => h.includes("ผู้สำเร็จการศึกษา") || h.includes("มีงานทำเดิม") || h.includes("สถานภาพของบัณฑิต"));
      const isAdmitGroup = columnHeaders.some(h => h.includes("Sumofจำนวน") || h.includes("ปีศึกษาที่รับเข้า")) || file.name.includes("รับเข้า");
      const isSurveyGroup = file.name.includes("สำรวจ") || file.name.includes("survey");

      if (isCourseEvaluation) {
        finalCategoryKey = "ผลการประเมินคุณภาพหลักสูตร";
      } 
      else if (isGraduateEvaluation) {
        finalCategoryKey = "ผลการประเมินคุณภาพบัณฑิต";
      }
      else if (isEmploymentChart) {
        finalCategoryKey = "employment_chart_data";
      }
      else if (isEmployment) {
        finalCategoryKey = "ภาวะการมีงานทำ";
      } 
      else if (isAdmitGroup) {
        finalCategoryKey = "student_retain_admit_group";
      } 
      else if (isSurveyGroup) {
        finalCategoryKey = "student_retain_survey_group";
      } 

      finalPayload[finalCategoryKey] = jsonOutput;
      setDetectedCategory(finalCategoryKey);
      setTempResult(finalPayload);
    };
    reader.readAsBinaryString(file);
  };

  const handleSurveyFileChange = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    setSelectedSurveyFile(file);
    setSurveyFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = e.target.result;
      const workbook = XLSX.read(data, { type: "binary" });
      const jsonOutput = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { defval: "" });
      setTempSurveyRawData(jsonOutput);
    };
    reader.readAsBinaryString(file);
  };

  const handleAdmitFileChange = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    setSelectedAdmitFile(file);
    setAdmitFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = e.target.result;
      const workbook = XLSX.read(data, { type: "binary" });
      const jsonOutput = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { defval: "" });
      setTempAdmitRawData(jsonOutput);
    };
    reader.readAsBinaryString(file);
  };

  const handleFileChangeEval = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    setSelectedEvalFile(file);
    setEvalFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = e.target.result;
      const workbook = XLSX.read(data, { type: "binary" });
      const jsonOutput = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { defval: "" });
      setTempEvalResult(jsonOutput); 
    };
    reader.readAsBinaryString(file);
  };

  const handleEmpChartFileChange = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    setSelectedEmpChartFile(file);
    setEmpChartFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = e.target.result;
      const workbook = XLSX.read(data, { type: "binary" });
      const jsonOutput = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { defval: "" });
      setTempEmpChartRawData(jsonOutput);
    };
    reader.readAsBinaryString(file);
  };

  const handleUpload = () => {
    if (!selectedFile || !tempResult) return;

    if (detectedCategory === "student_retain_survey_group" || detectedCategory === "student_retain_admit_group") {
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
          message.success("นำเข้าไฟล์รายปีเรียบร้อยค่ะ");
        }
      });
    } else {
      AntModal.confirm({
        title: "ยืนยันนำเข้าคลังข้อมูล",
        content: `ระบบจะจัดเก็บไฟล์นี้เข้าสู่คลังหลักกลุ่ม [ ${detectedCategory} ]`,
        onOk() {
          saveToLocalStorage(tempResult);
          clearMainUpload();
          message.success(`อัปเดตข้อมูลหมวด ${detectedCategory} สำเร็จแล้วค่ะ`);
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

  const handleSurveyUpload = () => {
    if (!selectedSurveyFile || !tempSurveyRawData) return;
    let inputYear = surveyFileName.match(/\d{4}/) ? surveyFileName.match(/\d{4}/)[0] : "";
    AntModal.confirm({
      title: "ระบุปีการศึกษา",
      content: <AntInput defaultValue={inputYear} onChange={(e) => { inputYear = e.target.value; }} style={{ borderRadius: 8, marginTop: 10 }} />,
      onOk() {
        if (!inputYear.trim()) return Promise.reject();
        const stored = localStorage.getItem("dashboardData");
        let current = stored ? JSON.parse(stored) : {};
        current["student_retain_survey_group"] = { ...(current["student_retain_survey_group"] || {}), [inputYear.trim()]: tempSurveyRawData };
        localStorage.setItem("dashboardData", JSON.stringify(current));
        setDashboardData(current);
        setSelectedSurveyFile(null); setSurveyFileName(""); setTempSurveyRawData(null);
        refreshExistingCategories();
        message.success("บันทึกสำเร็จ");
      }
    });
  };

  const handleAdmitUpload = () => {
    if (!selectedAdmitFile || !tempAdmitRawData) return;
    let inputYear = admitFileName.match(/\d{4}/) ? admitFileName.match(/\d{4}/)[0] : "";
    AntModal.confirm({
      title: "ระบุปีศึกษาที่รับเข้า",
      content: <AntInput defaultValue={inputYear} onChange={(e) => { inputYear = e.target.value; }} style={{ borderRadius: 8, marginTop: 10 }} />,
      onOk() {
        if (!inputYear.trim()) return Promise.reject();
        const stored = localStorage.getItem("dashboardData");
        let current = stored ? JSON.parse(stored) : {};
        current["student_retain_admit_group"] = { ...(current["student_retain_admit_group"] || {}), [inputYear.trim()]: tempAdmitRawData };
        localStorage.setItem("dashboardData", JSON.stringify(current));
        setDashboardData(current);
        setSelectedAdmitFile(null); setAdmitFileName(""); setTempAdmitRawData(null);
        refreshExistingCategories();
        message.success("บันทึกสำเร็จ");
      }
    });
  };

  const handleEvalUpload = () => {
    if (!selectedEvalFile || !tempEvalResult) return;
    saveToLocalStorage({ "ข้อมูลประเมินคุณภาพ": tempEvalResult });
    setSelectedEvalFile(null); setEvalFileName(""); setTempEvalResult(null);
    message.success("บันทึกข้อมูลประเมินคุณภาพเรียบร้อย");
  };

  const handleEmpChartUpload = () => {
    if (!selectedEmpChartFile || !tempEmpChartRawData) return;
    const payload = { "employment_chart_data": tempEmpChartRawData };
    saveToLocalStorage(payload);
    setSelectedEmpChartFile(null); 
    setEmpChartFileName(""); 
    setTempEmpChartRawData(null);
    message.success("ล้างข้อมูลเก่าและบันทึกเนื้อหาไฟล์ใหม่ของแผนภูมิแท่งเรียบร้อยค่ะ");
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
    AntModal.confirm({
      title: "ต้องการลบข้อมูลกลุ่มนี้ใช่หรือไม่?",
      content: `หมวด "${categoryName}" จะถูกลบถาวร`,
      okButtonProps: { danger: true },
      onOk() {
        const stored = localStorage.getItem("dashboardData");
        if (stored) {
          const data = JSON.parse(stored);
          delete data[categoryName];
          setDashboardData(data);
          localStorage.setItem("dashboardData", JSON.stringify(data));
          refreshExistingCategories();
          message.success("ลบสำเร็จ");
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
      setDashboardData(data); refreshExistingCategories();
    }
  };

  const handleDeleteAdmitYear = (year) => {
    const stored = localStorage.getItem("dashboardData");
    if (stored) {
      const data = JSON.parse(stored);
      delete data["student_retain_admit_group"][year];
      localStorage.setItem("dashboardData", JSON.stringify(data));
      setDashboardData(data); refreshExistingCategories();
    }
  };

  // สไตล์ร่วมสำหรับช่องอัปโหลดทุกช่อง
  const commonUploadBoxStyle = {
    border: "2px dashed #00b4d8",
    padding: "24px 16px",
    borderRadius: 12,
    textAlign: "center",
    background: "#f0faff",
    transition: "all 0.3s ease",
    marginBottom: 16
  };

  const commonCardStyle = {
    borderRadius: 16, 
    border: "1px solid #e5e7eb", 
    boxShadow: "0 2px 8px rgba(0,0,0,0.02)"
  };

  const commonButtonStyle = {
    width: "100%", 
    height: 40, 
    borderRadius: 10, 
    background: "#00b4d8", 
    borderColor: "#00b4d8", 
    fontWeight: 600
  };

  return (
    <AntLayout style={{ minHeight: "100vh" }}>
      <Sidebar />
      <AntLayout>
        <Header style={{ background: "white", padding: "16px 24px", height: "auto", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #f0f0f0" }}>
          <div>
            <h2 style={{ margin: "0 0 4px 0", fontSize: "20px", fontWeight: "600", color: "#1f1f1f" }}>Data Management</h2>
            <div style={{ color: "#8c8c8c", fontSize: "13px" }}>ช่องทางอัปโหลดไฟล์ส่วนขยายระบบและคลังฐานข้อมูลสารสนเทศทั้งหมดภายในคณะ</div>
          </div>
        </Header>

        <Content style={{ padding: "24px 32px 32px 32px", background: "#f5f5f5" }}>
          {/* ปรับสัดส่วนเป็น 50:50 สมมาตร สะอาดตา */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, alignItems: "start" }}>
            
            {/* ฝั่งซ้าย: รวมช่องอัปโหลด */}
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              
              {/* ช่องที่ 1 */}
              <AntCard title="🚀 1. ช่องอัปโหลดอัจฉริยะ (จำแนกคลังอัตโนมัติ)" style={{ ...commonCardStyle, borderTop: "4px solid #0050b3" }}>
                <p style={{ color: "#64748b", fontSize: 13, marginBottom: 16 }}>
                  <b>ระบบวิเคราะห์คอลัมน์:</b> วางไฟล์ข้อมูลดิบชุดใดก็ได้ ระบบจะทำการตรวจสอบและนำเข้าสู่คลังหลักให้ทันทีค่ะ
                </p>
                <div style={{ ...commonUploadBoxStyle, border: "2px dashed #0050b3", background: "#f0f5ff" }}>
                  <UploadOutlined style={{ fontSize: 26, color: "#0050b3", marginBottom: 8 }} />
                  <div>
                    <label htmlFor="file-upload" style={{ cursor: "pointer", color: "#0050b3", fontWeight: 700 }}>คลิกเลือกไฟล์ชุดข้อมูลหลัก (.csv, .xlsx)</label>
                    <input id="file-upload" type="file" accept=".xlsx,.xls,.csv" onChange={handleFileChange} style={{ display: "none" }} />
                  </div>
                </div>
                {fileName && (
                  <div style={{ background: "#f0fdf4", padding: 12, borderRadius: 10, border: "1px solid #bbf7d0", marginBottom: 16, fontSize: 13 }}>
                    <FileExcelOutlined style={{ color: "#16a34a", marginRight: 6 }} /> <b>ไฟล์ที่เลือก:</b> {fileName}
                    {detectedCategory && (
                      <div style={{ marginTop: 6, color: "#166534" }}>
                        🔎 ตรวจพบข้อมูลประเภท: <b style={{ background: "#dcfce7", padding: "2px 6px", borderRadius: 4 }}>{detectedCategory}</b>
                      </div>
                    )}
                  </div>
                )}
                <AntButton type="primary" icon={<CheckCircleOutlined />} disabled={!selectedFile} onClick={handleUpload} style={{ ...commonButtonStyle, background: "#0050b3", borderColor: "#0050b3" }}>
                  วิเคราะห์และนำเข้าฐานข้อมูล
                </AntButton>
              </AntCard>

              {/* ช่องเฉพาะ 5 */}
              <AntCard title="📊 2. ช่องเฉพาะอัปโหลดแผนภูมิสัดส่วน (ภาวะการมีงานทำ)" style={{ ...commonCardStyle, borderTop: "4px solid #00b4d8" }}>
                <p style={{ color: "#64748b", fontSize: 13, marginBottom: 16 }}>
                  อัปโหลดไฟล์สถิติแยก เพื่อเปิดระบบการวาดแผนภูมิแท่งแนวนอนวิเคราะห์ประเภทหน่วยงานแบบละเอียด
                </p>
                <div style={commonUploadBoxStyle}>
                  <UploadOutlined style={{ fontSize: 26, color: "#00b4d8", marginBottom: 8 }} />
                  <div>
                    <label htmlFor="emp-chart-upload" style={{ cursor: "pointer", color: "#00b4d8", fontWeight: 700 }}>เลือกไฟล์ประมวลสัดส่วนกราฟแท่ง</label>
                    <input id="emp-chart-upload" type="file" accept=".csv,.xlsx,.xls" onChange={handleEmpChartFileChange} style={{ display: "none" }} />
                  </div>
                </div>
                {empChartFileName && (
                  <div style={{ background: "#f0fdf4", padding: 12, borderRadius: 10, border: "1px solid #bbf7d0", marginBottom: 16, fontSize: 13 }}>
                    <FileTextOutlined style={{ color: "#00b4d8", marginRight: 6 }} /> <b>ไฟล์สัดส่วนงานทำ:</b> {empChartFileName}
                  </div>
                )}
                <AntButton type="primary" disabled={!selectedEmpChartFile} onClick={handleEmpChartUpload} style={commonButtonStyle}>
                  อัปเดตไฟล์เนื้อหาเข้าแผนภูมิแท่งแนวนอน
                </AntButton>
              </AntCard>

              {/* ช่องเฉพาะ 2 */}
              <AntCard title="📋 3. ช่องเฉพาะนิสิตคงอยู่ (ปีที่สำรวจ) - ภาคปลาย" style={commonCardStyle}>
                <div style={commonUploadBoxStyle}>
                  <UploadOutlined style={{ fontSize: 24, color: "#00b4d8", marginBottom: 6 }} />
                  <div>
                    <label htmlFor="survey-upload" style={{ cursor: "pointer", color: "#00b4d8", fontWeight: 600 }}>เลือกไฟล์สถิตินิสิต (ปีที่สำรวจ)</label>
                    <input id="survey-upload" type="file" accept=".csv,.xlsx,.xls" onChange={handleSurveyFileChange} style={{ display: "none" }} />
                  </div>
                </div>
                {surveyFileName && <div style={{ marginBottom: 12, fontSize: 12, color: "#64748b" }}><FileTextOutlined /> {surveyFileName}</div>}
                <AntButton type="primary" disabled={!selectedSurveyFile} onClick={handleSurveyUpload} style={commonButtonStyle}>ยืนยันนำเข้าข้อมูลปีที่สำรวจ</AntButton>
              </AntCard>

              {/* ช่องเฉพาะ 3 */}
              <AntCard title="📬 4. ช่องเฉพาะนิสิตคงอยู่ (ปีศึกษาที่รับเข้า) - ภาคต้น" style={commonCardStyle}>
                <div style={commonUploadBoxStyle}>
                  <UploadOutlined style={{ fontSize: 24, color: "#00b4d8", marginBottom: 6 }} />
                  <div>
                    <label htmlFor="admit-upload" style={{ cursor: "pointer", color: "#00b4d8", fontWeight: 600 }}>เลือกไฟล์สถิตินิสิต (ปีศึกษาที่รับเข้า)</label>
                    <input id="admit-upload" type="file" accept=".csv,.xlsx,.xls" onChange={handleAdmitFileChange} style={{ display: "none" }} />
                  </div>
                </div>
                {admitFileName && <div style={{ marginBottom: 12, fontSize: 12, color: "#64748b" }}><FileTextOutlined /> {admitFileName}</div>}
                <AntButton type="primary" disabled={!selectedAdmitFile} onClick={handleAdmitUpload} style={commonButtonStyle}>ยืนยันนำเข้าข้อมูลปีรับเข้า</AntButton>
              </AntCard>

              {/* ช่องเฉพาะ 4 */}
              <AntCard title="⭐ 5. ช่องเฉพาะประเมินคุณภาพหลักสูตรรายองค์ประกอบ" style={commonCardStyle}>
                <div style={commonUploadBoxStyle}>
                  <UploadOutlined style={{ fontSize: 24, color: "#00b4d8", marginBottom: 6 }} />
                  <div>
                    <label htmlFor="eval-upload" style={{ cursor: "pointer", color: "#00b4d8", fontWeight: 600 }}>เลือกไฟล์ประเมินคุณภาพรายองค์ประกอบ</label>
                    <input id="eval-upload" type="file" accept=".csv,.xlsx,.xls" onChange={handleFileChangeEval} style={{ display: "none" }} />
                  </div>
                </div>
                {evalFileName && <div style={{ marginBottom: 12, fontSize: 12, color: "#64748b" }}><FileTextOutlined /> {evalFileName}</div>}
                <AntButton type="primary" disabled={!selectedEvalFile} onClick={handleEvalUpload} style={commonButtonStyle}>ยืนยันนำเข้ากราฟประเมิน</AntButton>
              </AntCard>

            </div>

            {/* ฝั่งขวา: คลังข้อมูลปัจจุบันดีไซน์แบบคลีน */}
            <AntCard title={<span><DatabaseOutlined style={{ marginRight: 8, color: "#0077b6" }} /> คลังข้อมูลระบบปัจจุบัน</span>} style={{ ...commonCardStyle, position: "sticky", top: 24 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {existingCategories.map((category) => {
                  const isSurveyGroup = category === "student_retain_survey_group";
                  const isAdmitGroup = category === "student_retain_admit_group";
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

                      {isAdmitGroup && admitYearsList.map(year => (
                        <div key={year} style={{ display: "flex", justifyContent: "space-between", marginTop: 8, background: "#fff", padding: "6px 12px", borderRadius: 8, fontSize: 12, border: "1px solid #f1f5f9" }}>
                          <span style={{ color: "#475569" }}>📆 ปีรับเข้า: {year}</span>
                          <span style={{ color: "#ef4444", cursor: "pointer", fontWeight: 500 }} onClick={() => handleDeleteAdmitYear(year)}>ลบ</span>
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
