import Sidebar from "../components/Sidebar";
import { useState, useEffect, useCallback } from "react";
import { setDashboardData } from "../data/dashboardData";
import * as XLSX from "xlsx";
import Cropper from "react-easy-crop";
import {
  UploadOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  DatabaseOutlined,
  PictureOutlined,
  UserOutlined,
  LockOutlined,
  EyeOutlined,
  ExclamationCircleOutlined,
  FileExcelOutlined,
  ScissorOutlined
} from "@ant-design/icons";
import { 
  Layout as AntLayout, 
  Card as AntCard, 
  Button as AntButton, 
  Modal as AntModal, 
  Input as AntInput, 
  Select as AntSelect,
  message,
  Upload as AntUpload,
  Tabs as AntTabs,
  Alert as AntAlert,
  Table as AntTable,
  Space,
  Tag,
  Slider
} from "antd";

const { Header, Content } = AntLayout;

function UploadPage() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [targetTableName, setTargetTableName] = useState("");
  const [previewData, setPreviewData] = useState(null);
  const [parsedSheetsData, setParsedSheetsData] = useState(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [loadingConfirm, setLoadingConfirm] = useState(false);

  const [dbTables, setDbTables] = useState([]);
  const [selectedTableData, setSelectedTableData] = useState(null);
  const [viewModalVisible, setViewModalVisible] = useState(false);

  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [tableToDelete, setTableToDelete] = useState("");
  const [deleteConfirmInput, setDeleteConfirmInput] = useState("");

  const [facultyList, setFacultyList] = useState([]);
  const [facultyStorageKey, setFacultyStorageKey] = useState("ข้อมูลอาจารย์"); 
  const [selectedTeacherIndex, setSelectedTeacherIndex] = useState(null);

  const [isAdmin, setIsAdmin] = useState(false);

  // State สำหรับระบบ Crop รูปภาพ
  const [cropModalVisible, setCropModalVisible] = useState(false);
  const [tempImageSrc, setTempImageSrc] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const guessTableFromFilename = (filename) => {
    if (!filename) return "";
    const name = filename.toLowerCase();

    if (name.includes("อาจารย์") || name.includes("faculty") || name.includes("teacher")) {
      return "ข้อมูลอาจารย์";
    }
    if (name.includes("สถานภาพ") || name.includes("status") || name.includes("baseสถานภาพ")) {
      return "ข้อมูลสถานภาพนิสิต"; 
    }
    if (name.includes("งานทำ") || name.includes("employment") || name.includes("ภาวะการมีงานทำ")) {
      return "ข้อมูลภาวะการมีงานทำ";
    }
    if (name.includes("คงอยู่") || name.includes("retain") || name.includes("นิสิต")) {
      return "จำนวนนิสิตคงอยู่"; 
    }
    if (name.includes("วิจัย") || name.includes("research")) {
      return "ข้อมูลวิจัย";
    }
    if (name.includes("ประเมินคุณภาพหลักสูตร") || name.includes("ประเมินหลักสูตร")) {
      return "ข้อมูลผลการประเมินคุณภาพหลักสูตร";
    }
    if (name.includes("ประเมินคุณภาพบัณฑิต") || name.includes("ประเมินบัณฑิต") || name.includes("eval")) {
      return "ข้อมูลผลการประเมินคุณภาพบัณฑิต";
    }
    return name.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9_]/g, "_");
  };

  const fetchDbTablesFromLocal = useCallback(() => {
    const stored = localStorage.getItem("dashboardData");
    if (stored) {
      try {
        const data = JSON.parse(stored);
        if (data && typeof data === "object") {
          const list = Object.keys(data).map(key => ({
            tableName: key,
            rowCount: Array.isArray(data[key]) ? data[key].length : 0
          }));
          setDbTables(list);
          return;
        }
      } catch (err) {
        console.error("Error reading localStorage:", err);
      }
    }
    setDbTables([]);
  }, []);

  const cleanFacultyList = useCallback((list) => {
    if (!Array.isArray(list)) return [];
    
    const validRows = list.filter(item => {
      if (!item) return false;
      const name = item["ชื่อ นามสกุล"] || item["ชื่อ-นามสกุล"] || item["ชื่ออาจารย์"] || item["ชื่อ"] || item["ชื่อผู้สอน"] || item["Name"] || "";
      const cleanName = String(name).trim();
      
      const isInvalid = 
        cleanName === "" || 
        cleanName === "-" || 
        cleanName.startsWith("รวม") || 
        cleanName.startsWith("จำนวน") || 
        cleanName.includes("รวมทั้งสิ้น");

      return !isInvalid;
    });

    const uniqueMap = new Map();
    validRows.forEach(item => {
      const name = item["ชื่อ นามสกุล"] || item["ชื่อ-นามสกุล"] || item["ชื่ออาจารย์"] || item["ชื่อ"] || item["ชื่อผู้สอน"] || item["Name"] || "";
      const key = String(name).replace(/\s+/g, '').trim();
      if (key && !uniqueMap.has(key)) {
        uniqueMap.set(key, item);
      }
    });

    return Array.from(uniqueMap.values());
  }, []);

  const refreshExistingCategories = useCallback(() => {
    const stored = localStorage.getItem("dashboardData");
    if (stored) {
      try {
        const data = JSON.parse(stored);
        if (data && typeof data === "object") {
          let foundTeachers = [];
          let matchedKey = "ข้อมูลอาจารย์";

          if (Array.isArray(data["ข้อมูลอาจารย์"]) && data["ข้อมูลอาจารย์"].length > 0) {
            foundTeachers = data["ข้อมูลอาจารย์"];
            matchedKey = "ข้อมูลอาจารย์";
          } else if (Array.isArray(data["อาจารย์สาขา"]) && data["อาจารย์สาขา"].length > 0) {
            foundTeachers = data["อาจารย์สาขา"];
            matchedKey = "อาจารย์สาขา";
          } else if (Array.isArray(data["อาจารย์"]) && data["อาจารย์"].length > 0) {
            foundTeachers = data["อาจารย์"];
            matchedKey = "อาจารย์";
          }

          const cleanedTeachers = cleanFacultyList(foundTeachers);
          setFacultyList(cleanedTeachers);
          setFacultyStorageKey(matchedKey);
        }
      } catch (error) {
        console.error("Error parsing dashboardData:", error);
      }
    } else {
      setFacultyList([]);
    }
  }, [cleanFacultyList]);

  useEffect(() => {
    const currentRole = localStorage.getItem("role");
    const currentEmail = (localStorage.getItem("email") || "").toLowerCase();

    const checkAdminStatus = currentRole === "admin" || currentEmail === "naramon.si@ku.th";
    setIsAdmin(checkAdminStatus);

    fetchDbTablesFromLocal();
    refreshExistingCategories();
  }, [fetchDbTablesFromLocal, refreshExistingCategories]);

  const cleanString = (str) => {
    if (!str) return "";
    return String(str).replace(/\s+/g, '').replace(/['"]+/g, '').trim();
  };

  const convertFileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  // Helper Functions สำหรับ Crop รูปภาพ
  const createImage = (url) =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener("load", () => resolve(image));
      image.addEventListener("error", (error) => reject(error));
      image.setAttribute("crossOrigin", "anonymous");
      image.src = url;
    });

  const getCroppedImg = async (imageSrc, pixelCrop) => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height
    );

    return canvas.toDataURL("image/jpeg");
  };

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleSelectFile = (file) => {
    if (!isAdmin) {
      message.error("คุณไม่มีสิทธิ์ในการอัปโหลดไฟล์ (สิทธิ์สำหรับผู้ดูแลระบบเท่านั้น)");
      return false;
    }
    setSelectedFile(file);
    setTargetTableName(guessTableFromFilename(file.name));
    setPreviewData(null);
    setParsedSheetsData(null);
    return false;
  };

  const parseCSVLine = (line) => {
    const result = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') {
        inQuotes = !inQuotes;
      } else if (c === ',' && !inQuotes) {
        result.push(cur.trim().replace(/^"|"$/g, ''));
        cur = '';
      } else {
        cur += c;
      }
    }
    result.push(cur.trim().replace(/^"|"$/g, ''));
    return result;
  };

  const handlePreviewUpload = () => {
    if (!selectedFile) {
      message.warning("กรุณาเลือกไฟล์ก่อนทำรายการ");
      return;
    }

    setLoadingPreview(true);
    const fileName = selectedFile.name.toLowerCase();

    if (fileName.endsWith(".xlsx") || fileName.endsWith(".xls")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: "array" });

          const sheetsResult = {};
          let primaryPreview = null;

          workbook.SheetNames.forEach((sheetName) => {
            const worksheet = workbook.Sheets[sheetName];
            const jsonRows = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

            const cleanedRows = jsonRows.map((row) => {
              const newRow = {};
              Object.keys(row).forEach((k) => {
                newRow[k.trim()] = String(row[k]).trim();
              });
              return newRow;
            });

            sheetsResult[sheetName.trim()] = cleanedRows;

            if (!primaryPreview && cleanedRows.length > 0) {
              primaryPreview = cleanedRows;
            }
          });

          setParsedSheetsData(sheetsResult);
          setPreviewData({
            totalRows: primaryPreview ? primaryPreview.length : 0,
            previewRows: primaryPreview || []
          });

          message.success(`อ่านไฟล์ Excel สำเร็จ พบทั้งหมด ${workbook.SheetNames.length} Sheet`);
        } catch (err) {
          message.error("เกิดข้อผิดพลาดในการอ่านไฟล์ Excel");
        } finally {
          setLoadingPreview(false);
        }
      };
      reader.readAsArrayBuffer(selectedFile);
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target.result;
          const lines = text.split(/\r\n|\n/).filter((line) => line.trim() !== "");

          if (lines.length > 0) {
            let headerIndex = 0;
            for (let i = 0; i < Math.min(lines.length, 10); i++) {
              const parsed = parseCSVLine(lines[i]);
              if (parsed.filter((x) => x !== "").length >= 2) {
                headerIndex = i;
                break;
              }
            }

            const headers = parseCSVLine(lines[headerIndex]).map((h) => h.trim());

            const parsedRows = lines.slice(headerIndex + 1).map((line) => {
              const values = parseCSVLine(line);
              const rowObj = {};
              let hasData = false;
              headers.forEach((header, idx) => {
                const hName = header || `col_${idx}`;
                const val = values[idx] ? values[idx].trim() : "";
                rowObj[hName] = val;
                if (val !== "") hasData = true;
              });
              return hasData ? rowObj : null;
            }).filter(Boolean);

            setPreviewData({
              totalRows: parsedRows.length,
              previewRows: parsedRows
            });
            message.success(`อ่านไฟล์ CSV สำเร็จ ${parsedRows.length} แถว`);
          }
        } catch (err) {
          message.error("ไม่สามารถอ่านไฟล์ CSV ได้");
        } finally {
          setLoadingPreview(false);
        }
      };
      reader.readAsText(selectedFile, "UTF-8");
    }
  };

  const handleConfirmUpload = () => {
    if (!previewData || !targetTableName) return;

    setLoadingConfirm(true);
    setTimeout(() => {
      try {
        const stored = localStorage.getItem("dashboardData");
        const dashboard = stored ? JSON.parse(stored) : {};

        if (parsedSheetsData) {
          Object.keys(parsedSheetsData).forEach((sheetName) => {
            const rows = parsedSheetsData[sheetName];
            const sName = sheetName.trim();

            dashboard[sName] = rows;

            if (sName.includes("อาจารย์") || sName.includes("faculty")) {
              dashboard["ข้อมูลอาจารย์"] = rows;
              dashboard["อาจารย์"] = rows;
              dashboard["อาจารย์สาขา"] = rows;
            } else if (sName.includes("งานทำ") || sName.includes("ภาวะการมีงานทำ")) {
              dashboard["ข้อมูลภาวะการมีงานทำ"] = rows;
              dashboard["ภาวะการมีงานทำ"] = rows;
            } else if (sName.includes("วิจัย") || sName.includes("research")) {
              dashboard["ข้อมูลวิจัย"] = rows;
              dashboard["วิจัย"] = rows;
            } else if (sName.includes("ประเมินคุณภาพหลักสูตร") || sName.includes("ประเมินหลักสูตร")) {
              dashboard["ข้อมูลผลการประเมินคุณภาพหลักสูตร"] = rows;
              dashboard["ผลการประเมินคุณภาพหลักสูตร"] = rows;
            } else if (sName.includes("ประเมินคุณภาพบัณฑิต") || sName.includes("ประเมินบัณฑิต")) {
              dashboard["ข้อมูลผลการประเมินคุณภาพบัณฑิต"] = rows;
              dashboard["ผลการประเมินคุณภาพบัณฑิต"] = rows;
            }
          });
        } else {
          const keyName = targetTableName.trim();
          const cleanedRows = previewData.previewRows.map((row) => {
            const newRow = {};
            Object.keys(row).forEach((k) => {
              newRow[k.trim()] = row[k];
            });
            return newRow;
          });

          dashboard[keyName] = cleanedRows;

          if (keyName.includes("อาจารย์") || keyName.includes("faculty")) {
            dashboard["ข้อมูลอาจารย์"] = cleanedRows;
            dashboard["อาจารย์"] = cleanedRows;
            dashboard["อาจารย์สาขา"] = cleanedRows;
          } else if (keyName.includes("งานทำ") || keyName.includes("ภาวะการมีงานทำ")) {
            dashboard["ข้อมูลภาวะการมีงานทำ"] = cleanedRows;
            dashboard["ภาวะการมีงานทำ"] = cleanedRows;
          } else if (keyName.includes("สถานภาพ") || keyName.includes("student_status")) {
            dashboard["ข้อมูลสถานภาพนิสิต"] = cleanedRows;
            dashboard["สถานภาพนิสิต"] = cleanedRows;
          } else if (keyName.includes("คงอยู่") || keyName.includes("student_retain")) {
            dashboard["จำนวนนิสิตคงอยู่"] = cleanedRows;
            dashboard["ข้อมูลนิสิตคงอยู่"] = cleanedRows;
          } else if (keyName.includes("ประเมินคุณภาพหลักสูตร") || keyName.includes("ประเมินหลักสูตร")) {
            dashboard["ข้อมูลผลการประเมินคุณภาพหลักสูตร"] = cleanedRows;
            dashboard["ผลการประเมินคุณภาพหลักสูตร"] = cleanedRows;
          } else if (keyName.includes("ประเมินคุณภาพบัณฑิต") || keyName.includes("ประเมินบัณฑิต")) {
            dashboard["ข้อมูลผลการประเมินคุณภาพบัณฑิต"] = cleanedRows;
            dashboard["ผลการประเมินคุณภาพบัณฑิต"] = cleanedRows;
          }
        }

        setDashboardData(dashboard);
        localStorage.setItem("dashboardData", JSON.stringify(dashboard));
        window.dispatchEvent(new Event("storage"));

        message.success("นำเข้าและอัปเดตชุดข้อมูลเข้าสู่ระบบเรียบร้อยแล้ว!");
        clearMainUpload();
        fetchDbTablesFromLocal();
        refreshExistingCategories();
      } catch (err) {
        message.error("เกิดข้อผิดพลาดในการบันทึกข้อมูลลง Local Storage");
      } finally {
        setLoadingConfirm(false);
      }
    }, 300);
  };

  const clearMainUpload = () => {
    setSelectedFile(null);
    setTargetTableName("");
    setPreviewData(null);
    setParsedSheetsData(null);
  };

  const handleViewTableData = (tableName) => {
    const stored = localStorage.getItem("dashboardData");
    if (stored) {
      try {
        const data = JSON.parse(stored);
        const rows = data[tableName] || [];
        setSelectedTableData({
          name: tableName,
          rows: Array.isArray(rows) ? rows : []
        });
        setViewModalVisible(true);
        return;
      } catch (e) {
        console.error(e);
      }
    }
    setSelectedTableData({ name: tableName, rows: [] });
    setViewModalVisible(true);
  };

  const openDeleteModal = (tableName) => {
    if (!isAdmin) {
      message.error("เฉพาะผู้ดูแลระบบเท่านั้นที่สามารถลบข้อมูลได้");
      return;
    }
    setTableToDelete(tableName);
    setDeleteConfirmInput("");
    setDeleteModalVisible(true);
  };

  const handleConfirmDeleteTable = () => {
    if (deleteConfirmInput !== tableToDelete) {
      message.error("ชื่อหมวดหมู่ที่พิมพ์ยืนยันไม่ถูกต้อง");
      return;
    }

    const stored = localStorage.getItem("dashboardData");
    if (stored) {
      try {
        const dashboard = JSON.parse(stored);
        delete dashboard[tableToDelete];

        setDashboardData(dashboard);
        localStorage.setItem("dashboardData", JSON.stringify(dashboard));
        window.dispatchEvent(new Event("storage"));

        message.success(`ลบข้อมูล "${tableToDelete}" เรียบร้อยแล้ว`);
        setDeleteModalVisible(false);
        fetchDbTablesFromLocal();
        refreshExistingCategories();
      } catch (err) {
        message.error("เกิดข้อผิดพลาดในการลบข้อมูล");
      }
    }
  };

  const commonCardStyle = {
    borderRadius: 16, 
    border: "1px solid #e5e7eb", 
    boxShadow: "0 2px 8px rgba(0,0,0,0.02)"
  };

  const activeSelectedTeacher = (selectedTeacherIndex !== null && facultyList[selectedTeacherIndex]) ? facultyList[selectedTeacherIndex] : null;

  const generateColumnsFromRows = (rows) => {
    if (!Array.isArray(rows) || rows.length === 0 || !rows[0] || typeof rows[0] !== "object") return [];
    return Object.keys(rows[0]).map(key => ({
      title: key,
      dataIndex: key,
      key: key,
      render: text => String(text ?? '')
    }));
  };

  const previewRowsList = previewData?.previewRows || [];
  const selectedTableRowsList = selectedTableData?.rows || [];

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
              ระบบศูนย์กลางอัปโหลดไฟล์สารสนเทศดิบ (.xlsx, .csv) และจัดการข้อมูลภายในคณะ
            </div>
          </div>
        </Header>

        <Content style={{ padding: "24px 32px 32px 32px", background: "#f5f5f5" }}>

          {!isAdmin && (
            <AntAlert
              message="โหมดอ่านอย่างเดียว (Read Only)"
              description="คุณกำลังเข้าใช้งานในสิทธิ์ผู้ใช้ทั่วไป (User) บัญชีของคุณไม่มีสิทธิ์แก้ไข หรืออัปโหลดข้อมูล"
              type="warning"
              showIcon
              icon={<LockOutlined />}
              style={{ marginBottom: 20, borderRadius: 12, border: "1px solid #ffe58f" }}
            />
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: 24, alignItems: "start" }}>
            
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              
              <AntCard title="ช่องอัปโหลดและประมวลผลไฟล์ดิบ (.xlsx / .csv)" style={{ ...commonCardStyle, borderTop: "4px solid #0050b3" }}>
                <p style={{ color: "#64748b", fontSize: 13, marginBottom: 16 }}>
                  <b>ขั้นตอนอัปโหลด:</b> เลือกไฟล์ข้อมูล (.xlsx หรือ .csv) &rarr; ระบบจะตรวจสอบและวิเคราะห์ Sheet ย่อยให้อัตโนมัติ &rarr; ยืนยันบันทึก
                </p>

                <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 16 }}>
                  <AntUpload
                    beforeUpload={handleSelectFile}
                    fileList={selectedFile ? [selectedFile] : []}
                    onRemove={() => clearMainUpload()}
                    disabled={!isAdmin}
                    maxCount={1}
                    accept=".csv, .xlsx, .xls"
                  >
                    <AntButton icon={<FileExcelOutlined />} disabled={!isAdmin}>
                      เลือกไฟล์ชุดข้อมูล (.xlsx / .csv)
                    </AntButton>
                  </AntUpload>

                  {selectedFile && (
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#262626", marginBottom: 6 }}>
                        หมวดหมู่ข้อมูลหลักที่ตรวจพบ:
                      </div>
                      <AntInput 
                        value={targetTableName} 
                        onChange={(e) => setTargetTableName(e.target.value)} 
                        placeholder="ระบุชื่อหมวดหมู่ เช่น ข้อมูลอาจารย์ หรือ ข้อมูลผลการประเมินคุณภาพหลักสูตร"
                        disabled={!isAdmin}
                        style={{ borderRadius: 8 }}
                      />
                    </div>
                  )}

                  <Space size="middle">
                    <AntButton
                      type="primary"
                      onClick={handlePreviewUpload}
                      loading={loadingPreview}
                      disabled={!selectedFile || !isAdmin}
                      style={{ borderRadius: 8, background: isAdmin ? "#0050b3" : "#d9d9d9", borderColor: isAdmin ? "#0050b3" : "#d9d9d9" }}
                    >
                      ตรวจสอบ & Preview ไฟล์ดิบ
                    </AntButton>

                    {previewData && (
                      <AntButton
                        type="primary"
                        icon={<CheckCircleOutlined />}
                        onClick={handleConfirmUpload}
                        loading={loadingConfirm}
                        disabled={!isAdmin}
                        style={{ borderRadius: 8, background: "#52c41a", borderColor: "#52c41a" }}
                      >
                        ยืนยันบันทึกข้อมูล
                      </AntButton>
                    )}
                  </Space>
                </div>

                {previewData && (
                  <div style={{ marginTop: 16, padding: 16, background: "#f8fafc", borderRadius: 12, border: "1px solid #e2e8f0" }}>
                    <div style={{ fontWeight: 600, fontSize: 14, color: "#1e293b", marginBottom: 8, display: "flex", justifyContent: "space-between" }}>
                      <span>📋 ตัวอย่างข้อมูลดิบ (Preview)</span>
                      <Tag color="blue">พบทั้งหมด {previewRowsList.length} แถว</Tag>
                    </div>

                    <div style={{ overflowX: "auto", maxHeight: 250 }}>
                      <AntTable
                        dataSource={previewRowsList}
                        columns={generateColumnsFromRows(previewRowsList)}
                        pagination={{ pageSize: 5 }}
                        size="small"
                        rowKey={(_, idx) => idx}
                      />
                    </div>
                  </div>
                )}
              </AntCard>

              {/* ช่องอัปโหลดรูปภาพโปรไฟล์อาจารย์ */}
              <AntCard title={<span><PictureOutlined style={{ marginRight: 8, color: "#722ed1" }} /> ช่องอัปโหลดรูปภาพโปรไฟล์อาจารย์</span>} style={{ ...commonCardStyle, borderTop: "4px solid #722ed1" }}>
                <p style={{ color: "#64748b", fontSize: 13, marginBottom: 16 }}>
                  เลือกรายชื่ออาจารย์เพื่อเปลี่ยน หรือปรับแต่งแก้ไขภาพถ่ายประจำตัว
                </p>

                <AntTabs
                  defaultActiveKey="single"
                  items={[
                    {
                      key: "single",
                      label: "👤 เลือกรายชื่ออัปโหลดรายบุคคล",
                      children: (
                        <div style={{ display: "flex", flexDirection: "column", gap: 16, paddingTop: 8 }}>
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
                              options={facultyList.map((t, idx) => ({
                                value: idx,
                                label: `${idx + 1}. ${t["ชื่อ นามสกุล"] || t["ชื่อ-นามสกุล"] || t["ชื่ออาจารย์"] || t["ชื่อ"] || `อาจารย์ท่านที่ ${idx + 1}`}`
                              }))}
                            />
                          </div>

                          {activeSelectedTeacher ? (
                            <div style={{ background: "#fafafa", border: "1px solid #e8e8e8", borderRadius: 12, padding: 16, textAlign: "center" }}>
                              <div style={{ marginBottom: 12 }}>
                                {activeSelectedTeacher.รูปภาพ || activeSelectedTeacher.avatar || activeSelectedTeacher.image ? (
                                  <img 
                                    src={activeSelectedTeacher.รูปภาพ || activeSelectedTeacher.avatar || activeSelectedTeacher.image} 
                                    alt="Avatar" 
                                    style={{ width: 90, height: 90, borderRadius: "50%", objectFit: "cover", border: "3px solid #722ed1" }} 
                                  />
                                ) : (
                                  <div style={{ width: 90, height: 90, borderRadius: "50%", background: "#f0f0f0", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "#bfbfbf", border: "2px dashed #d9d9d9" }}>
                                    <UserOutlined style={{ fontSize: 40 }} />
                                  </div>
                                )}
                              </div>

                              <div style={{ fontWeight: 700, fontSize: 15, color: "#1f1f1f", marginBottom: 12 }}>
                                {activeSelectedTeacher["ชื่อ นามสกุล"] || activeSelectedTeacher["ชื่อ-นามสกุล"] || activeSelectedTeacher["ชื่ออาจารย์"] || activeSelectedTeacher["ชื่อ"]}
                              </div>

                              <Space wrap style={{ justifyContent: "center" }}>
                                {/* ปุ่มเลือกไฟล์ใหม่ */}
                                <AntButton 
                                  type="primary" 
                                  icon={<UploadOutlined />} 
                                  disabled={!isAdmin}
                                  style={{ background: isAdmin ? "#722ed1" : "#d9d9d9", borderColor: isAdmin ? "#722ed1" : "#d9d9d9", borderRadius: 8, height: 38 }}
                                  onClick={() => {
                                    const fileInput = document.getElementById("single-teacher-file-input");
                                    if (fileInput) fileInput.click();
                                  }}
                                >
                                  อัปโหลดรูปใหม่
                                </AntButton>

                                {/* ปุ่มปรับแต่ง/ตัดรูปเดิม */}
                                <AntButton 
                                  icon={<ScissorOutlined />} 
                                  disabled={!isAdmin || !(activeSelectedTeacher.รูปภาพ || activeSelectedTeacher.avatar || activeSelectedTeacher.image)}
                                  style={{ borderRadius: 8, height: 38 }}
                                  onClick={() => {
                                    const currentImg = activeSelectedTeacher.รูปภาพ || activeSelectedTeacher.avatar || activeSelectedTeacher.image;
                                    if (currentImg) {
                                      setTempImageSrc(currentImg);
                                      setZoom(1);
                                      setCrop({ x: 0, y: 0 });
                                      setCropModalVisible(true);
                                    } else {
                                      message.warning("อาจารย์ท่านนี้ยังไม่มีรูปภาพ ให้ทำการอัปโหลดรูปใหม่ก่อนครับ");
                                    }
                                  }}
                                >
                                  ปรับแต่งรูป
                                </AntButton>
                              </Space>

                              <input
                                id="single-teacher-file-input"
                                type="file"
                                accept="image/*"
                                style={{ display: "none" }}
                                onChange={async (e) => {
                                  if (!isAdmin) return;
                                  const file = e.target.files?.[0];
                                  if (!file) return;

                                  try {
                                    const base64Image = await convertFileToBase64(file);
                                    setTempImageSrc(base64Image);
                                    setZoom(1);
                                    setCrop({ x: 0, y: 0 });
                                    setCropModalVisible(true);
                                    e.target.value = "";
                                  } catch (err) {
                                    message.error("เกิดข้อผิดพลาดในการโหลดรูปภาพ");
                                  }
                                }}
                              />
                            </div>
                          ) : null}
                        </div>
                      )
                    }
                  ]}
                />
              </AntCard>

            </div>

            {/* คลังข้อมูลหมวดหมู่ในระบบ */}
            <AntCard 
              title={
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span><DatabaseOutlined style={{ marginRight: 8, color: "#0077b6" }} /> คลังข้อมูลหมวดหมู่ในระบบ</span>
                  <AntButton size="small" onClick={fetchDbTablesFromLocal}>รีเฟรช</AntButton>
                </div>
              } 
              style={{ ...commonCardStyle, position: "sticky", top: 24 }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {dbTables.length === 0 ? (
                  <div style={{ textAlign: "center", color: "#8c8c8c", padding: "40px 0" }}>
                    ยังไม่มีชุดข้อมูลในระบบ
                  </div>
                ) : (
                  dbTables.map((tbl, index) => {
                    const tableName = tbl.tableName;
                    const rowCount = tbl.rowCount;

                    return (
                      <div key={tableName + index} style={{ padding: "14px 16px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <DatabaseOutlined style={{ color: "#0077b6", fontSize: 16 }} />
                            <span style={{ fontWeight: 600, color: "#1e293b", fontSize: 14 }}>
                              {tableName}
                            </span>
                          </div>
                          <span style={{ fontSize: 12, color: "#64748b", paddingLeft: 24 }}>
                            จำนวน {rowCount} รายการ
                          </span>
                        </div>

                        <Space>
                          <AntButton
                            type="text"
                            icon={<EyeOutlined style={{ color: "#0077b6" }} />}
                            onClick={() => handleViewTableData(tableName)}
                          />
                          {isAdmin && (
                            <AntButton
                              type="text"
                              danger
                              icon={<DeleteOutlined />}
                              onClick={() => openDeleteModal(tableName)}
                            />
                          )}
                        </Space>
                      </div>
                    );
                  })
                )}
              </div>
            </AntCard>

          </div>
        </Content>
      </AntLayout>

      {/* Modal ดูข้อมูล */}
      <AntModal
        title={`หมวดหมู่ข้อมูล: ${selectedTableData?.name || ''}`}
        open={viewModalVisible}
        onCancel={() => setViewModalVisible(false)}
        footer={[
          <AntButton key="close" onClick={() => setViewModalVisible(false)}>
            ปิดหน้าต่าง
          </AntButton>
        ]}
        width={850}
      >
        <div style={{ maxHeight: 400, overflow: "auto", marginTop: 16 }}>
          <AntTable
            dataSource={selectedTableRowsList}
            columns={generateColumnsFromRows(selectedTableRowsList)}
            pagination={{ pageSize: 5 }}
            size="small"
            rowKey={(_, idx) => idx}
          />
        </div>
      </AntModal>

      {/* Modal ลบข้อมูล */}
      <AntModal
        title={
          <span style={{ color: "#ff4d4f" }}>
            <ExclamationCircleOutlined style={{ marginRight: 8 }} />
            ยืนยันการลบชุดข้อมูล
          </span>
        }
        open={deleteModalVisible}
        onOk={handleConfirmDeleteTable}
        onCancel={() => setDeleteModalVisible(false)}
        okText="ยืนยันลบข้อมูล"
        okButtonProps={{ danger: true, disabled: deleteConfirmInput !== tableToDelete }}
        cancelText="ยกเลิก"
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 12 }}>
          <div>
            หมวดหมู่ <b>{tableToDelete}</b> จะถูกลบออกจากระบบ
          </div>
          <div style={{ fontSize: 13, color: "#8c8c8c" }}>
            พิมพ์ <b>{tableToDelete}</b> ด้านล่างเพื่อยืนยัน:
          </div>
          <AntInput
            value={deleteConfirmInput}
            onChange={(e) => setDeleteConfirmInput(e.target.value)}
            placeholder={`พิมพ์ "${tableToDelete}" ที่นี่`}
            style={{ borderRadius: 8 }}
          />
        </div>
      </AntModal>

      {/* Modal สำหรับตัด/ปรับขนาดรูปภาพอาจารย์ */}
      <AntModal
        title={<span><ScissorOutlined style={{ marginRight: 8, color: "#722ed1" }} /> ปรับขนาดและตัดรูปภาพโปรไฟล์</span>}
        open={cropModalVisible}
        onCancel={() => {
          setCropModalVisible(false);
          setTempImageSrc(null);
        }}
        onOk={async () => {
          try {
            const croppedBase64 = await getCroppedImg(tempImageSrc, croppedAreaPixels);
            
            const stored = localStorage.getItem("dashboardData");
            if (!stored) return;

            const dashboard = JSON.parse(stored);
            let teachersList = cleanFacultyList(dashboard[facultyStorageKey] || facultyList);

            const selectedName = activeSelectedTeacher["ชื่อ นามสกุล"] || activeSelectedTeacher["ชื่อ-นามสกุล"] || activeSelectedTeacher["ชื่ออาจารย์"] || activeSelectedTeacher["ชื่อ"];

            const updatedList = teachersList.map((item) => {
              const name = item["ชื่อ นามสกุล"] || item["ชื่อ-นามสกุล"] || item["ชื่ออาจารย์"] || item["ชื่อ"] || "";
              if (cleanString(name) === cleanString(selectedName)) {
                return { ...item, รูปภาพ: croppedBase64, avatar: croppedBase64, image: croppedBase64 };
              }
              return item;
            });

            dashboard[facultyStorageKey] = updatedList;
            dashboard["ข้อมูลอาจารย์"] = updatedList;

            setDashboardData(dashboard);
            localStorage.setItem("dashboardData", JSON.stringify(dashboard));
            window.dispatchEvent(new Event("storage"));

            message.success(`บันทึกรูปภาพของ ${selectedName} เรียบร้อยแล้ว`);
            setCropModalVisible(false);
            setTempImageSrc(null);
            refreshExistingCategories();
          } catch (e) {
            console.error(e);
            message.error("เกิดข้อผิดพลาดในการบันทึกรูปภาพที่ตัด");
          }
        }}
        okText="ตัดรูปและบันทึก"
        cancelText="ยกเลิก"
        destroyOnClose
      >
        <div style={{ position: "relative", width: "100%", height: 300, background: "#333", borderRadius: 8, overflow: "hidden" }}>
          {tempImageSrc && (
            <Cropper
              image={tempImageSrc}
              crop={crop}
              zoom={zoom}
              aspect={1}
              cropShape="round"
              showGrid={false}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />
          )}
        </div>
        
        <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 13, color: "#64748b" }}>ซูมรูปภาพ:</span>
          <Slider
            min={1}
            max={3}
            step={0.1}
            value={zoom}
            onChange={(z) => setZoom(z)}
            style={{ flex: 1 }}
          />
        </div>
      </AntModal>

    </AntLayout>
  );
}

export default UploadPage;
