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
  PictureOutlined,
  FolderOpenOutlined,
  UserOutlined
} from "@ant-design/icons";
import { 
  Layout as AntLayout, 
  Card as AntCard, 
  Button as AntButton, 
  Modal as AntModal, 
  Empty as AntEmpty, 
  Input as AntInput, 
  Select as AntSelect,
  message,
  Upload as AntUpload,
  Tabs as AntTabs
} from "antd";

const { Header, Content } = AntLayout;

function UploadPage() {
  
  // STATES
  const [fileName, setFileName] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [detectedCategory, setDetectedCategory] = useState(""); 
  const [tempResult, setTempResult] = useState(null);

  const [existingCategories, setExistingCategories] = useState([]);
  const [surveyYearsList, setSurveyYearsList] = useState([]);

  // States สำหรับระบบอัปโหลดรูปภาพอาจารย์
  const [facultyList, setFacultyList] = useState([]);
  const [facultyStorageKey, setFacultyStorageKey] = useState("ข้อมูลอาจารย์"); 
  const [batchImageFiles, setBatchImageFiles] = useState([]);
  const [selectedTeacherIndex, setSelectedTeacherIndex] = useState(null);

  useEffect(() => {
    refreshExistingCategories();
  }, []);

  // 🧹 ฟังก์ชันสำหรับ Clean และกรองขยะออก ให้เหลือเฉพาะอาจารย์จริง
  const cleanFacultyList = (list) => {
    if (!Array.isArray(list)) return [];
    
    // 1. กรองเฉพาะแถวที่มีชื่ออาจารย์จริงๆ (รองรับชื่อคอลัมน์หลายรูปแบบ)
    const validRows = list.filter(item => {
      const name = item["ชื่อ นามสกุล"] || item["ชื่อ-นามสกุล"] || item["ชื่ออาจารย์"] || item["ชื่อ"] || item["ชื่อผู้สอน"] || item["Name"] || "";
      const cleanName = String(name).trim();
      
      // เช็กว่าเป็นชื่อจริงๆ ไม่ใช่แถวว่าง หรือแถวสรุปผลส่วนเกิน
      const isInvalid = 
        cleanName === "" || 
        cleanName === "-" || 
        cleanName.startsWith("รวม") || 
        cleanName.startsWith("จำนวน") || 
        cleanName.includes("รวมทั้งสิ้น");

      return !isInvalid;
    });

    // 2. ลบรายชื่อซ้ำ (Deduplicate)
    const uniqueMap = new Map();
    validRows.forEach(item => {
      const name = item["ชื่อ นามสกุล"] || item["ชื่อ-นามสกุล"] || item["ชื่ออาจารย์"] || item["ชื่อ"] || item["ชื่อผู้สอน"] || item["Name"] || "";
      const key = String(name).replace(/\s+/g, '').trim();
      if (key && !uniqueMap.has(key)) {
        uniqueMap.set(key, item);
      }
    });

    return Array.from(uniqueMap.values());
  };

  // 🔍 ระบบตรวจค้นหาคลังข้อมูลอาจารย์ใน localStorage
  const refreshExistingCategories = () => {
    const stored = localStorage.getItem("dashboardData");
    if (stored) {
      const data = JSON.parse(stored);
      const keys = Object.keys(data);
      setExistingCategories(keys);
      
      if (data["student_retain_survey_group"]) {
        setSurveyYearsList(Object.keys(data["student_retain_survey_group"]).sort());
      } else {
        setSurveyYearsList([]);
      }

      let foundTeachers = [];
      let matchedKey = "ข้อมูลอาจารย์";

      // 🎯 Prioritize: เช็กหา Key "ข้อมูลอาจารย์" หรือ "อาจารย์" โดยตรงก่อนเลย
      if (Array.isArray(data["ข้อมูลอาจารย์"]) && data["ข้อมูลอาจารย์"].length > 0) {
        foundTeachers = data["ข้อมูลอาจารย์"];
        matchedKey = "ข้อมูลอาจารย์";
      } else if (Array.isArray(data["อาจารย์"]) && data["อาจารย์"].length > 0) {
        foundTeachers = data["อาจารย์"];
        matchedKey = "อาจารย์";
      } else {
        // ถ้าไม่เจอค่อยใช้วิธีวนลูปสแกนหา
        for (let key of keys) {
          const val = data[key];
          if (Array.isArray(val) && val.length > 0 && key.includes("อาจารย์")) {
            foundTeachers = val;
            matchedKey = key;
            break;
          }
        }
      }

      const cleanedTeachers = cleanFacultyList(foundTeachers);
      setFacultyList(cleanedTeachers);
      setFacultyStorageKey(matchedKey);
    }
  };

  const cleanString = (str) => {
    if (!str) return "";
    return String(str).replace(/\s+/g, '').replace(/['"]+/g, '').trim();
  };

  const normalizeTeacherName = (str) => {
    if (!str) return "";
    return String(str)
      .replace(/(นาย|นาง|นางสาว|ดร\.|ผศ\.|รศ\.|ศ\.|อาจารย์|อ\.|ดร|ผศ|รศ|ศ)/g, "")
      .replace(/\s+/g, "")
      .replace(/[^a-zA-Z0-9ก-๙]/g, "")
      .toLowerCase();
  };

  const convertFileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  // -------------------------------------------------------------
  // 📊 LOGIC การจัดการไฟล์ EXCEL (รองรับไฟล์หลาย Sheet เช่น ข้อมูลอาจารย์_2.xlsx)
  // -------------------------------------------------------------
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setSelectedFile(file);
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      const data = e.target.result;
      const workbook = XLSX.read(data, { type: "binary" });

      let finalPayload = {};
      let detectedCategoriesList = [];

      // สแกนอ่านข้อมูลจากทุก Sheet ในไฟล์ Excel
      workbook.SheetNames.forEach((sheetName) => {
        const worksheet = workbook.Sheets[sheetName];
        const jsonOutput = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

        if (!jsonOutput || jsonOutput.length === 0) return;

        const rawHeaders = Object.keys(jsonOutput[0] || {});
        const columnHeadersClean = rawHeaders.map(k => cleanString(k));

        // ตรวจสอบข้อมูล Sheet อาจารย์
        if (
          sheetName.includes("อาจารย์") || 
          columnHeadersClean.some(h => h.includes("ตำแหน่งทางวิชาการ") || h.includes("คุณวุฒิ") || h.includes("ชื่ออาจารย์"))
        ) {
          const cleaned = cleanFacultyList(jsonOutput);
          finalPayload["ข้อมูลอาจารย์"] = cleaned;
          detectedCategoriesList.push("ข้อมูลอาจารย์");
        } 
        // ตรวจสอบข้อมูล Sheet ภาวะการมีงานทำ
        else if (
          sheetName.includes("งานทำ") || 
          columnHeadersClean.some(h => h.includes("ผู้สำเร็จการศึกษา") || h.includes("มีงานทำเดิม") || h.includes("สถานภาพของบัณฑิต"))
        ) {
          finalPayload["ภาวะการมีงานทำ"] = jsonOutput;
          finalPayload["employment_chart_data"] = jsonOutput;
          detectedCategoriesList.push("ภาวะการมีงานทำ");
        } 
        // ตรวจสอบข้อมูล Sheet วิจัย
        else if (
          sheetName.includes("วิจัย") || 
          columnHeadersClean.some(h => h.includes("ผลงานวิจัย") || h.includes("Scopus"))
        ) {
          finalPayload["ข้อมูลวิจัย"] = jsonOutput;
          detectedCategoriesList.push("ข้อมูลวิจัย");
        } 
        // ตรวจสอบ Sheet ผลการประเมิน
        else if (columnHeadersClean.some(h => h.includes("คะแนนรวม") || h.includes("องค์ที่"))) {
          finalPayload["ผลการประเมินคุณภาพหลักสูตร"] = jsonOutput;
          detectedCategoriesList.push("ผลการประเมินคุณภาพหลักสูตร");
        } 
        else {
          finalPayload[sheetName] = jsonOutput;
          detectedCategoriesList.push(sheetName);
        }
      });

      // ถ้าค้นหาแบบสแกน Sheet ไม่พบ ให้ fallback ไปใช้ Sheet แรก
      if (Object.keys(finalPayload).length === 0) {
        const targetSheetKey = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[targetSheetKey];
        const jsonOutput = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

        if (jsonOutput.length === 0) {
          message.error("ไฟล์นี้ไม่มีข้อมูลในแถว!");
          return;
        }

        let finalCategoryKey = file.name.includes("สำรวจ") ? "student_retain_survey_group" : "ข้อมูลทั่วไป";
        finalPayload[finalCategoryKey] = jsonOutput;
        detectedCategoriesList.push(finalCategoryKey);
      }

      const categorySummary = detectedCategoriesList.join(", ");
      setDetectedCategory(categorySummary);
      setTempResult(finalPayload);
    };
    reader.readAsBinaryString(file);
  };

  const handleUpload = () => {
    if (!selectedFile || !tempResult) return;

    if (detectedCategory.includes("student_retain_survey_group")) {
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
          let targetStore = currentDashboard["student_retain_survey_group"] || {};
          
          targetStore[finalYear] = tempResult["student_retain_survey_group"];
          currentDashboard["student_retain_survey_group"] = targetStore;
          
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

  // -------------------------------------------------------------
  // 📸 LOGIC การจัดการรูปภาพอาจารย์
  // -------------------------------------------------------------
  const handleSaveBatchTeacherImages = async () => {
    if (batchImageFiles.length === 0) {
      message.warning("กรุณาเลือกรูปภาพหรือโฟลเดอร์รูปภาพก่อนครับ");
      return;
    }

    const stored = localStorage.getItem("dashboardData");
    const dashboard = stored ? JSON.parse(stored) : {};
    let teachersList = cleanFacultyList(dashboard[facultyStorageKey] || facultyList);

    if (teachersList.length === 0) {
      message.error("ไม่พบข้อมูลอาจารย์ในระบบ กรุณาอัปโหลดไฟล์ Excel ข้อมูลอาจารย์ก่อนครับ");
      return;
    }

    let updatedList = [...teachersList];
    let matchedCount = 0;

    for (let file of batchImageFiles) {
      const base64Image = await convertFileToBase64(file);
      const fileNameWithoutExt = file.name.substring(0, file.name.lastIndexOf('.'));
      const cleanFileName = normalizeTeacherName(fileNameWithoutExt);

      if (!cleanFileName) continue;

      updatedList = updatedList.map(teacher => {
        const teacherName = teacher["ชื่อ นามสกุล"] || teacher["ชื่อ-นามสกุล"] || teacher["ชื่ออาจารย์"] || teacher["ชื่อ"] || "";
        const cleanTeacherName = normalizeTeacherName(teacherName);

        if (cleanTeacherName && (cleanFileName.includes(cleanTeacherName) || cleanTeacherName.includes(cleanFileName))) {
          matchedCount++;
          return { ...teacher, รูปภาพ: base64Image, avatar: base64Image, image: base64Image };
        }
        return teacher;
      });
    }

    if (matchedCount > 0) {
      dashboard[facultyStorageKey] = updatedList;
      dashboard["ข้อมูลอาจารย์"] = updatedList;

      setDashboardData(dashboard);
      localStorage.setItem("dashboardData", JSON.stringify(dashboard));
      window.dispatchEvent(new Event("storage"));

      message.success(`จับคู่และอัปเดตรูปภาพอาจารย์สำเร็จ ${matchedCount} คนเรียบร้อยแล้ว!`);
      setBatchImageFiles([]);
      refreshExistingCategories();
    } else {
      message.error("ไม่พบชื่ออาจารย์ที่ตรงกับชื่อไฟล์รูปภาพเลย กรุณาตรวจสอบว่าชื่อไฟล์ตรงกับชื่ออาจารย์ในตารางหรือไม่");
    }
  };

  const saveToLocalStorage = (newData) => {
    const stored = localStorage.getItem("dashboardData");
    let finalData = stored ? JSON.parse(stored) : {};
    finalData = { ...finalData, ...newData };
    setDashboardData(finalData);
    localStorage.setItem("dashboardData", JSON.stringify(finalData));
    
    window.dispatchEvent(new Event("storage"));
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
          window.dispatchEvent(new Event("storage"));
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
      window.dispatchEvent(new Event("storage"));
      refreshExistingCategories();
    }
  };

  const commonCardStyle = {
    borderRadius: 16, 
    border: "1px solid #e5e7eb", 
    boxShadow: "0 2px 8px rgba(0,0,0,0.02)"
  };

  const activeSelectedTeacher = selectedTeacherIndex !== null ? facultyList[selectedTeacherIndex] : null;

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
              ระบบศูนย์กลางอัปโหลดไฟล์สารสนเทศ รูปภาพบุคลากร และประมวลผลกราฟสถิติต่างๆ ภายในคณะ
            </div>
          </div>
        </Header>

        <Content style={{ padding: "24px 32px 32px 32px", background: "#f5f5f5" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: 24, alignItems: "start" }}>
            
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              
              {/* 1. ช่องอัปโหลดไฟล์ Excel */}
              <AntCard title="ช่องอัปโหลดไฟล์หลัก" style={{ ...commonCardStyle, borderTop: "4px solid #0050b3" }}>
                <p style={{ color: "#64748b", fontSize: 13, marginBottom: 16 }}>
                  <b>ระบบวิเคราะห์ประเภทข้อมูลอัตโนมัติ:</b> วางไฟล์ข้อมูลดิบชุดใดก็ได้ ระบบจะทำการวิเคราะห์ความสอดคล้องของตาราง บันทึกเข้าคลัง และเตรียมประมวลผลขึ้นกราฟแสดงสัดส่วนให้อัตโนมัติทันที
                </p>
                <div style={{ border: "2px dashed #0050b3", padding: "30px 16px", borderRadius: 12, textAlign: "center", background: "#f0f5ff", transition: "all 0.3s ease", marginBottom: 16 }}>
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

              {/* 📸 2. ช่องอัปโหลดรูปภาพประจำตัวอาจารย์ */}
              <AntCard title={<span><PictureOutlined style={{ marginRight: 8, color: "#722ed1" }} /> ช่องอัปโหลดรูปภาพโปรไฟล์อาจารย์</span>} style={{ ...commonCardStyle, borderTop: "4px solid #722ed1" }}>
                <p style={{ color: "#64748b", fontSize: 13, marginBottom: 16 }}>
                  อัปโหลดภาพถ่ายอาจารย์เพื่อไปแสดงผลการ์ดโปรไฟล์ในหน้า <b>FacultyPage</b>
                </p>

                {/* กล่องแสดงสถานะจำนวนอาจารย์ */}
                <div style={{ marginBottom: 14, padding: "8px 12px", borderRadius: 8, fontSize: 12, background: facultyList.length > 0 ? "#f6ffed" : "#fff2f0", border: `1px solid ${facultyList.length > 0 ? "#b7eb8f" : "#ffccc7"}`, color: facultyList.length > 0 ? "#389e0d" : "#cf1322" }}>
                  {facultyList.length > 0 
                    ? `✅ ตรวจพบอาจารย์ในระบบทั้งหมด ${facultyList.length} ท่าน `
                    : `⚠️ ยังไม่พบรายชื่ออาจารย์ในระบบ กรุณาอัปโหลดไฟล์ตารางอาจารย์ (Excel) ในช่องด้านบนก่อนครับ`}
                </div>

                <AntTabs
                  defaultActiveKey="single"
                  items={[
                    {
                      key: "single",
                      label: "👤 เลือกรายชื่ออัปโหลดรายบุคคล",
                      children: (
                        <div style={{ display: "flex", flexDirection: "column", gap: 16, paddingTop: 8 }}>
                          <div style={{ fontSize: 12, color: "#595959", background: "#f6ffed", padding: 10, borderRadius: 8, border: "1px solid #b7eb8f" }}>
                            💡 <b>วิธีใช้งาน:</b> เลือกรายชื่ออาจารย์จาก Dropdown ด้านล่าง หรือค้นหาด้วยชื่อ แล้วกดเลือกรูปภาพเพื่อเปลี่ยนรูป
                          </div>

                          <div>
                            <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 6, color: "#262626" }}>
                               เลือกรายชื่ออาจารย์ ({facultyList.length} ท่าน):
                            </div>
                            <AntSelect
                              showSearch
                              placeholder="-- คลิกเพื่อเลือกรายชื่ออาจารย์ --"
                              style={{ width: "100%", height: 42 }}
                              value={selectedTeacherIndex}
                              onChange={(val) => setSelectedTeacherIndex(val)}
                              filterOption={(input, option) =>
                                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                              }
                              options={facultyList.map((t, idx) => {
                                const name = t["ชื่อ นามสกุล"] || t["ชื่อ-นามสกุล"] || t["ชื่ออาจารย์"] || t["ชื่อ"] || `อาจารย์ท่านที่ ${idx + 1}`;
                                const hasImg = t.รูปภาพ || t.avatar || t.image;
                                return {
                                  value: idx,
                                  label: `${idx + 1}. ${name} ${hasImg ? "🟢 (มีรูปแล้ว)" : "⚪ (ยังไม่มีรูป)"}`
                                };
                              })}
                            />
                          </div>

                          {activeSelectedTeacher ? (
                            <div style={{ background: "#fafafa", border: "1px solid #e8e8e8", borderRadius: 12, padding: 16, textAlign: "center" }}>
                              <div style={{ marginBottom: 12 }}>
                                {activeSelectedTeacher.รูปภาพ || activeSelectedTeacher.avatar ? (
                                  <img 
                                    src={activeSelectedTeacher.รูปภาพ || activeSelectedTeacher.avatar} 
                                    alt="Avatar" 
                                    style={{ width: 90, height: 90, borderRadius: "50%", objectFit: "cover", border: "3px solid #722ed1" }} 
                                  />
                                ) : (
                                  <div style={{ width: 90, height: 90, borderRadius: "50%", background: "#f0f0f0", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "#bfbfbf", border: "2px dashed #d9d9d9" }}>
                                    <UserOutlined style={{ fontSize: 40 }} />
                                  </div>
                                )}
                              </div>

                              <div style={{ fontWeight: 700, fontSize: 15, color: "#1f1f1f" }}>
                                {activeSelectedTeacher["ชื่อ นามสกุล"] || activeSelectedTeacher["ชื่อ-นามสกุล"] || activeSelectedTeacher["ชื่ออาจารย์"] || activeSelectedTeacher["ชื่อ"]}
                              </div>
                              <div style={{ fontSize: 12, color: "#8c8c8c", marginBottom: 16 }}>
                                {activeSelectedTeacher["ชื่อสาขา"] || activeSelectedTeacher["สาขาวิชา"] || activeSelectedTeacher["สาขา"] || "สังกัดคณะ"}
                              </div>

                              <label htmlFor="single-teacher-file-input">
                                <AntButton 
                                  type="primary" 
                                  icon={<UploadOutlined />} 
                                  style={{ background: "#722ed1", borderColor: "#722ed1", borderRadius: 8, height: 38 }}
                                  onClick={() => document.getElementById("single-teacher-file-input").click()}
                                >
                                  {(activeSelectedTeacher.รูปภาพ || activeSelectedTeacher.avatar) ? "เปลี่ยนรูปภาพโปรไฟล์ใหม่" : "อัปโหลดรูปภาพประจำตัว"}
                                </AntButton>
                              </label>

                              <input
                                id="single-teacher-file-input"
                                type="file"
                                accept="image/*"
                                style={{ display: "none" }}
                                onChange={async (e) => {
                                  const file = e.target.files[0];
                                  if (!file) return;

                                  try {
                                    const base64Image = await convertFileToBase64(file);
                                    const stored = localStorage.getItem("dashboardData");
                                    if (!stored) return;

                                    const dashboard = JSON.parse(stored);
                                    let teachersList = cleanFacultyList(dashboard[facultyStorageKey] || facultyList);

                                    const selectedName = activeSelectedTeacher["ชื่อ นามสกุล"] || activeSelectedTeacher["ชื่อ-นามสกุล"] || activeSelectedTeacher["ชื่ออาจารย์"] || activeSelectedTeacher["ชื่อ"];

                                    const updatedList = teachersList.map((item) => {
                                      const name = item["ชื่อ นามสกุล"] || item["ชื่อ-นามสกุล"] || item["ชื่ออาจารย์"] || item["ชื่อ"] || "";
                                      if (cleanString(name) === cleanString(selectedName)) {
                                        return { ...item, รูปภาพ: base64Image, avatar: base64Image, image: base64Image };
                                      }
                                      return item;
                                    });

                                    dashboard[facultyStorageKey] = updatedList;
                                    dashboard["ข้อมูลอาจารย์"] = updatedList;

                                    setDashboardData(dashboard);
                                    localStorage.setItem("dashboardData", JSON.stringify(dashboard));
                                    window.dispatchEvent(new Event("storage"));

                                    message.success(`บันทึกรูปภาพของ ${selectedName} เรียบร้อยแล้ว`);
                                    refreshExistingCategories();
                                  } catch (err) {
                                    message.error("เกิดข้อผิดพลาดในการบันทึกรูปภาพ");
                                  }
                                }}
                              />
                            </div>
                          ) : (
                            <div style={{ padding: "20px", border: "1px dashed #d9d9d9", borderRadius: 12, textAlign: "center", color: "#8c8c8c", fontSize: 13 }}>
                              คลิกเลือกรายชื่ออาจารย์จาก Dropdown ด้านบนเพื่อเริ่มอัปโหลดรูปภาพ
                            </div>
                          )}
                        </div>
                      )
                    },
                    {
                      key: "batch",
                      label: "📁 อัปโหลดทั้งโฟลเดอร์ (Auto-Match)",
                      children: (
                        <div style={{ display: "flex", flexDirection: "column", gap: 14, paddingTop: 8 }}>
                          <div style={{ fontSize: 12, color: "#595959", background: "#f9f0ff", padding: 12, borderRadius: 8, border: "1px solid #d3adf7", lineHeight: "1.6" }}>
                            💡 <b>วิธีใช้งานระบบอ่านรูปภาพอัตโนมัติ:</b>
                            <br />1. ตั้งชื่อไฟล์รูปภาพให้มีชื่ออาจารย์ เช่น <code>สมชาย_ใจดี.jpg</code> หรือ <code>ดร.สมชาย.png</code>
                            <br />2. ลากรูปภาพทั้งหมดจากโฟลเดอร์มาวางลงในช่องด้านล่าง แล้วกดบันทึก
                          </div>

                          <AntUpload.Dragger
                            multiple
                            accept="image/*"
                            beforeUpload={(file) => {
                              setBatchImageFiles(prev => [...prev, file]);
                              return false;
                            }}
                            onRemove={(file) => {
                              setBatchImageFiles(prev => prev.filter(f => f.uid !== file.uid));
                            }}
                            fileList={batchImageFiles}
                          >
                            <p className="ant-upload-drag-icon">
                              <FolderOpenOutlined style={{ color: "#722ed1", fontSize: 36 }} />
                            </p>
                            <p style={{ fontWeight: 600, color: "#262626", margin: "4px 0" }}>ลากไฟล์รูปภาพทั้งหมดในโฟลเดอร์มาวางที่นี่ หรือคลิกเพื่อเลือก</p>
                            <p style={{ fontSize: 12, color: "#8c8c8c" }}>ระบบจะจับคู่ชื่อไฟล์กับรายชื่ออาจารย์ให้อัตโนมัติ</p>
                          </AntUpload.Dragger>

                          <AntButton
                            type="primary"
                            icon={<CheckCircleOutlined />}
                            onClick={handleSaveBatchTeacherImages}
                            disabled={batchImageFiles.length === 0}
                            style={{ height: 42, borderRadius: 8, background: "#722ed1", borderColor: "#722ed1", fontWeight: 600 }}
                          >
                            ประมวลผลจับคู่และบันทึกรูปภาพ ({batchImageFiles.length} รูป)
                          </AntButton>
                        </div>
                      )
                    }
                  ]}
                />
              </AntCard>

            </div>

            {/* ฝั่งขวา: แสดงคลังข้อมูลในระบบปัจจุบัน */}
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
