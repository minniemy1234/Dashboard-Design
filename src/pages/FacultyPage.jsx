import React, { useMemo, useState, useEffect } from "react";
import { Layout, Table, Button, Card, Row, Col, Empty, Input, Avatar, Tag, Modal, Segmented, Select } from "antd";
import Sidebar from "../components/Sidebar";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
  PieChart,
  Pie,
  Legend
} from "recharts";
import { 
  UserOutlined, 
  BookOutlined, 
  SearchOutlined,
  SolutionOutlined,
  FilterOutlined,
  EyeOutlined,
  AppstoreOutlined,
  BarsOutlined,
  MailOutlined,
  PhoneOutlined
} from "@ant-design/icons";

const { Header, Content } = Layout;

function FacultyPage() {
  // เปลี่ยน State ฟิลเตอร์หลักให้เป็นแบบ Array (Multi-Select)
  const [selectedMajors, setSelectedMajors] = useState([]);
  const [selectedTypes, setSelectedTypes] = useState([]); 
  const [searchText, setSearchText] = useState("");
  const [rawData, setRawData] = useState([]);
  const [tableMajorFilters, setTableMajorFilters] = useState([]);
  
  const [viewType, setViewType] = useState("cards");

  const [activeTeacher, setActiveTeacher] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Clean และกรองรายชื่ออาจารย์
  const cleanFacultyData = (list) => {
    if (!Array.isArray(list)) return [];
    
    const validRows = list.filter(item => {
      const name = item["ชื่อ นามสกุล"] || item["ชื่อ-นามสกุล"] || item["ชื่ออาจารย์"] || item["ชื่อ"] || "";
      const cleanName = String(name).trim();
      return cleanName !== "" && cleanName !== "-" && !cleanName.includes("รวม") && !cleanName.includes("จำนวน");
    });

    const uniqueMap = new Map();
    validRows.forEach(item => {
      const name = item["ชื่อ นามสกุล"] || item["ชื่อ-นามสกุล"] || item["ชื่ออาจารย์"] || item["ชื่อ"] || "";
      const key = String(name).replace(/\s+/g, '').trim();
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, item);
      }
    });

    return Array.from(uniqueMap.values());
  };

  // 1. โหลดข้อมูลอาจารย์จาก localStorage แบบ Real-time
  useEffect(() => {
    const loadFacultyData = () => {
      const stored = localStorage.getItem("dashboardData");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          const facultyData = parsed["ข้อมูลอาจารย์"] || parsed["อาจารย์"] || parsed["อาจารย์สาขา"] || [];
          const cleaned = cleanFacultyData(facultyData);
          setRawData(cleaned);
        } catch (error) {
          console.error("Error parsing dashboardData from localStorage:", error);
        }
      }
    };

    loadFacultyData();
    window.addEventListener("storage", loadFacultyData);
    return () => window.removeEventListener("storage", loadFacultyData);
  }, []);

  const cleanString = (str) => {
    if (!str) return "";
    return String(str).replace(/\s+/g, '').replace(/['"]+/g, '').trim();
  };

  // 2. ดึงรายชื่อสาขาวิชาทั้งหมด
  const majors = useMemo(() => {
    const list = rawData.map(item => String(item["สาขาวิชา"] || item["ชื่อสาขา"] || item["สาขา"] || "").trim());
    return [...new Set(list)].filter(Boolean).sort();
  }, [rawData]);

  // รายการประเภทบุคลากรทั้งหมด
  const availableTypes = useMemo(() => [
    "สายวิชาการ",
    "อาจารย์ผู้รับผิดชอบหลักสูตร",
    "อาจารย์ประจำหลักสูตร",
    "อาจารย์ผู้สอน"
  ], []);

  // Helper อ่านประเภทบุคลากร
  const getTeacherType = (item) => {
    if (!item) return "สายวิชาการ";
    return item["ประเภทบุคลากร"] || item["ประเภทอาจารย์"] || item["กลุ่มอาจารย์"] || item["ประเภท"] || item["หน้าที่"] || "สายวิชาการ";
  };

  // 3. กรองข้อมูลสำหรับภาพรวม (Cards View & KPIs & Charts)
  const mainFilteredData = useMemo(() => {
    return rawData.filter(item => {
      const majorClean = cleanString(item["สาขาวิชา"] || item["ชื่อสาขา"] || item["สาขา"]);
      const teacherName = item["ชื่อ นามสกุล"] || item["ชื่อ-นามสกุล"] || item["ชื่ออาจารย์"] || item["ชื่อ"] || "";
      const teacherType = String(getTeacherType(item));
      const nameClean = String(teacherName).toLowerCase();
      
      // Multi-select Major
      if (selectedMajors.length > 0) {
        const matchesMajor = selectedMajors.some(m => cleanString(m) === majorClean);
        if (!matchesMajor) return false;
      }

      // Multi-select Type
      if (selectedTypes.length > 0) {
        const matchesType = selectedTypes.some(t => teacherType.includes(t));
        if (!matchesType) return false;
      }

      // Search Text
      if (searchText && !nameClean.includes(searchText.toLowerCase())) return false;
      
      return true;
    });
  }, [rawData, selectedMajors, selectedTypes, searchText]);

  // 4. กรองข้อมูลสำหรับตาราง (Table View)
  const tableData = useMemo(() => {
    return rawData.filter(item => {
      const majorClean = cleanString(item["สาขาวิชา"] || item["ชื่อสาขา"] || item["สาขา"]);
      const teacherName = item["ชื่อ นามสกุล"] || item["ชื่อ-นามสกุล"] || item["ชื่ออาจารย์"] || item["ชื่อ"] || "";
      const teacherType = String(getTeacherType(item));
      const nameClean = String(teacherName).toLowerCase();

      // เช็คตัวกรองตารางเฉพาะกิจ หรือตัวกรองหลัก
      const activeMajorFilters = tableMajorFilters.length > 0 ? tableMajorFilters : selectedMajors;
      if (activeMajorFilters.length > 0) {
        const matchesMajor = activeMajorFilters.some(m => cleanString(m) === majorClean);
        if (!matchesMajor) return false;
      }

      if (selectedTypes.length > 0) {
        const matchesType = selectedTypes.some(t => teacherType.includes(t));
        if (!matchesType) return false;
      }

      if (searchText && !nameClean.includes(searchText.toLowerCase())) return false;

      return true;
    });
  }, [rawData, selectedMajors, tableMajorFilters, selectedTypes, searchText]);

  // Handlers สำหรับเลือกทั้งหมด (Select All)
  const handleSelectAllMajors = (checked) => {
    if (checked) {
      setSelectedMajors(majors);
    } else {
      setSelectedMajors([]);
    }
  };

  const handleSelectAllTypes = (checked) => {
    if (checked) {
      setSelectedTypes(availableTypes);
    } else {
      setSelectedTypes([]);
    }
  };

  // 5. คำนวณสถิติภาพรวม (KPI)
  const stats = useMemo(() => {
    const total = mainFilteredData.length;
    let phdCount = 0;
    let masterCount = 0;
    let academicPositionCount = 0;

    mainFilteredData.forEach(item => {
      const degree = String(item["คุณวุฒิ"] || item["วุฒิการศึกษา"] || item["การศึกษา"] || "").trim();
      const position = String(item["ตำแหน่งทางวิชาการ"] || item["ตำแหน่งวิชาการ"] || item["ตำแหน่ง"] || "").trim();
      const name = String(item["ชื่อ นามสกุล"] || item["ชื่อ-นามสกุล"] || item["ชื่ออาจารย์"] || item["ชื่อ"] || "");

      if (
        degree.includes("ปริญญาเอก") || 
        degree.toLowerCase().includes("ph.d") || 
        degree.includes("ดร.") ||
        name.includes("ดร.")
      ) {
        phdCount++;
      } else if (
        degree.includes("ปริญญาโท") || 
        degree.toLowerCase().includes("master") || 
        degree.toLowerCase().includes("m.sc") || 
        degree.toLowerCase().includes("m.a.")
      ) {
        masterCount++;
      }

      if (
        position.includes("รองศาสตราจารย์") || position.includes("รศ") || name.includes("รศ") ||
        position.includes("ผู้ช่วยศาสตราจารย์") || position.includes("ผศ") || name.includes("ผศ") ||
        position.includes("ศาสตราจารย์") || (position.includes("ศ.") && !position.includes("ผศ") && !position.includes("รศ")) || name.includes("ศ.")
      ) {
        academicPositionCount++;
      }
    });

    return { total, phdCount, masterCount, academicPositionCount };
  }, [mainFilteredData]);

  // 6. กราฟโดนัทประเภทอาจารย์
  const teacherTypeChartData = useMemo(() => {
    let resp = 0;
    let regular = 0;
    let instructor = 0;

    mainFilteredData.forEach(item => {
      const type = String(getTeacherType(item)).trim();
      if (type.includes("ผู้รับผิดชอบ")) {
        resp++;
      } else if (type.includes("ประจำ") || type.includes("สายวิชาการ")) {
        regular++;
      } else {
        instructor++;
      }
    });

    return [
      { name: "ผู้รับผิดชอบหลักสูตร", value: resp, color: "#0284c7" },
      { name: "อาจารย์ประจำสาขา", value: regular, color: "#0ea5e9" },
      { name: "อาจารย์ผู้สอน/อื่นๆ", value: instructor, color: "#38bdf8" },
    ].filter(item => item.value > 0);
  }, [mainFilteredData]);

  // 7. กราฟโดนัทระดับคุณวุฒิ
  const degreeChartData = useMemo(() => {
    let phd = 0;
    let master = 0;
    let bachelor = 0;

    mainFilteredData.forEach(item => {
      const degree = String(item["คุณวุฒิ"] || item["วุฒิการศึกษา"] || item["การศึกษา"] || "").trim();
      const name = String(item["ชื่อ นามสกุล"] || item["ชื่อ-นามสกุล"] || item["ชื่ออาจารย์"] || item["ชื่อ"] || "");

      if (degree.includes("ปริญญาเอก") || degree.toLowerCase().includes("ph.d") || degree.includes("ดร.") || name.includes("ดร.")) {
        phd++;
      } else if (degree.includes("ปริญญาโท") || degree.toLowerCase().includes("master")) {
        master++;
      } else {
        bachelor++;
      }
    });

    return [
      { name: "ปริญญาเอก", value: phd, color: "#0284c7" },
      { name: "ปริญญาโท", value: master, color: "#059669" },
      { name: "ปริญญาตรี / อื่นๆ", value: bachelor, color: "#cbd5e1" },
    ].filter(item => item.value > 0);
  }, [mainFilteredData]);

  // 8. กราฟแท่งตำแหน่งทางวิชาการ
  const chartData = useMemo(() => {
    if (mainFilteredData.length === 0) return [];
    
    let prof = 0, assocProf = 0, asstProf = 0, lecturer = 0;
    
    mainFilteredData.forEach(item => {
      const pos = String(item["ตำแหน่งทางวิชาการ"] || item["ตำแหน่งวิชาการ"] || item["ตำแหน่ง"] || "").trim();
      const name = String(item["ชื่อ นามสกุล"] || item["ชื่อ-นามสกุล"] || item["ชื่ออาจารย์"] || item["ชื่อ"] || "");

      if (pos.includes("รองศาสตราจารย์") || pos.includes("รศ") || name.includes("รศ")) {
        assocProf++;
      } else if (pos.includes("ผู้ช่วยศาสตราจารย์") || pos.includes("ผศ") || name.includes("ผศ")) {
        asstProf++;
      } else if (pos.includes("ศาสตราจารย์") || pos.includes("ศ.") || name.startsWith("ศ.")) {
        prof++;
      } else {
        lecturer++;
      }
    });

    return [
      { name: "ศาสตราจารย์ (ศ.)", จำนวน: prof, color: "#7c3aed" },
      { name: "รองศาสตราจารย์ (รศ.)", จำนวน: assocProf, color: "#0284c7" },
      { name: "ผู้ช่วยศาสตราจารย์ (ผศ.)", จำนวน: asstProf, color: "#059669" },
      { name: "อาจารย์ / อื่นๆ", จำนวน: lecturer, color: "#c28d07" },
    ];
  }, [mainFilteredData]);

  const getAvatarUrl = (item) => {
    if (!item) return `https://api.dicebear.com/7.x/adventurer/svg?seed=default`;
    const name = String(item["ชื่อ นามสกุล"] || item["ชื่อ-นามสกุล"] || item["ชื่ออาจารย์"] || item["ชื่อ"] || "");
    const cleanName = encodeURIComponent(name);
    
    if (item["รูปภาพ"] || item["รูป"] || item["avatar"]) {
      return item["รูปภาพ"] || item["รูป"] || item["avatar"];
    }
    
    if (name.includes("นาง") || name.includes("น.ส.") || name.includes("อาจารย์หญิง") || name.includes("ดร.หญิง")) {
      return `https://api.dicebear.com/7.x/adventurer/svg?seed=${cleanName}&hair=long`;
    }
    return `https://api.dicebear.com/7.x/adventurer/svg?seed=${cleanName}&hair=short`;
  };

  const getPositionTag = (posStr) => {
    const pos = String(posStr || "").trim();
    if (pos.includes("รองศาสตราจารย์") || pos.includes("รศ")) return <Tag color="blue" style={{ borderRadius: 6 }}>รศ.</Tag>;
    if (pos.includes("ผู้ช่วยศาสตราจารย์") || pos.includes("ผศ")) return <Tag color="cyan" style={{ borderRadius: 6 }}>ผศ.</Tag>;
    if (pos.includes("ศาสตราจารย์") || pos.includes("ศ.")) return <Tag color="purple" style={{ borderRadius: 6 }}>ศ.</Tag>;
    return <Tag color="gold" style={{ borderRadius: 6 }}>อาจารย์</Tag>;
  };

  const getShortDegree = (degreeStr) => {
    const deg = String(degreeStr || "").trim();
    if (deg.includes("ปริญญาเอก") || deg.toLowerCase().includes("ph.d") || deg.includes("ดร.")) return "ปริญญาเอก (Ph.D.)";
    if (deg.includes("ปริญญาโท") || deg.toLowerCase().includes("master")) return "ปริญญาโท (Master)";
    return "ปริญญาตรี (Bachelor)";
  };

  const handleOpenDetail = (teacher) => {
    setActiveTeacher(teacher);
    setIsModalOpen(true);
  };

  const columns = [
    { 
      title: "ลำดับ", 
      key: "index", 
      width: 70, 
      align: "center", 
      render: (text, record, index) => <span style={{ color: "#64748b" }}>{index + 1}</span>
    },
    {
      title: "รูปโปรไฟล์",
      key: "avatar",
      align: "center",
      width: 90,
      render: (text, record) => (
        <Avatar src={getAvatarUrl(record)} size={42} style={{ border: "2px solid #0284c7", boxShadow: "0 2px 6px rgba(2, 132, 199, 0.15)" }} />
      )
    },
    { 
      title: "ชื่อ นามสกุล", 
      key: "name",
      render: (text, record) => {
        const name = record["ชื่อ นามสกุล"] || record["ชื่อ-นามสกุล"] || record["ชื่ออาจารย์"] || record["ชื่อ"] || record["อาจารย์"] || "-";
        return <strong style={{ color: "#0f172a", fontSize: 14 }}>{name}</strong>;
      }
    },
    { 
      title: "ตำแหน่งทางวิชาการ", 
      key: "position",
      align: "center",
      render: (text, record) => {
        const pos = record["ตำแหน่งทางวิชาการ"] || record["ตำแหน่งวิชาการ"] || record["ตำแหน่ง"] || "อาจารย์";
        return getPositionTag(pos);
      }
    },
    { 
      title: "ประเภทบุคลากร", 
      key: "type",
      align: "center",
      render: (text, record) => {
        const type = getTeacherType(record);
        return <Tag color="geekblue" style={{ borderRadius: 6 }}>{type}</Tag>;
      }
    },
    { 
      title: "คุณวุฒิ / การศึกษาสูงสุด", 
      key: "degree",
      render: (text, record) => {
        return <span style={{ color: "#334155" }}>{record["คุณวุฒิ"] || record["วุฒิการศึกษา"] || record["การศึกษา"] || "-"}</span>;
      }
    },
    { 
      title: "สาขาวิชาที่สังกัด", 
      key: "major",
      render: (text, record) => {
        return <span style={{ color: "#475569", fontWeight: 500 }}>{record["สาขาวิชา"] || record["สาขา"] || record["ชื่อสาขา"] || "-"}</span>;
      }
    },
    {
      title: "จัดการ",
      key: "actions",
      align: "center",
      render: (text, record) => (
        <Button 
          type="primary" 
          ghost 
          icon={<EyeOutlined />} 
          size="small" 
          style={{ borderRadius: 8, borderColor: "#0284c7", color: "#0284c7" }}
          onClick={() => handleOpenDetail(record)}
        >
          ดูประวัติ
        </Button>
      )
    }
  ];

  return (
    <Layout style={{ minHeight: "100vh", background: "#f8fafc" }}>
      <Sidebar />
      <Layout style={{ background: "#f8fafc" }}>
        <Header style={{ background: "#ffffff", padding: "16px 28px", height: "auto", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #e2e8f0" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <h2 style={{ margin: 0, fontSize: "20px", fontWeight: "700", color: "#0f172a", lineHeight: "1.2" }}>
              ข้อมูลอาจารย์ประจำสาขาวิชา
            </h2>
            <div style={{ color: "#64748b", fontSize: "13px", lineHeight: "1.4", margin: 0 }}>
              บริหารจัดการข้อมูล คุณวุฒิการศึกษา และตำแหน่งทางวิชาการของบุคลากรสายวิชาการ
            </div>
          </div>
        </Header>

        <Content style={{ padding: "24px 28px", background: "#f8fafc" }}>
          
          {/* MULTI-SELECT FILTER & SEARCH SECTION */}
          <div style={{ background: "#ffffff", padding: 20, borderRadius: 16, marginBottom: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.02)", border: "1px solid #e2e8f0" }}>
            <Row gutter={[16, 16]} align="bottom">
              
              <Col xs={24} md={8}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <span style={{ fontWeight: 600, fontSize: 13, color: "#334155" }}>สาขาวิชา (เลือกได้หลายรายการ)</span>
                  <Button 
                    type="link" 
                    size="small" 
                    onClick={() => handleSelectAllMajors(selectedMajors.length !== majors.length)}
                    style={{ padding: 0, height: "auto", fontSize: 12, color: "#0284c7" }}
                  >
                    {selectedMajors.length === majors.length ? "ยกเลิกทั้งหมด" : "เลือกทั้งหมด"}
                  </Button>
                </div>
                <Select
                  mode="multiple"
                  allowClear
                  style={{ width: '100%' }}
                  placeholder="เลือกทั้งหมด (แสดงทุกสาขาวิชา)"
                  value={selectedMajors}
                  onChange={(val) => {
                    setSelectedMajors(val);
                    setTableMajorFilters([]);
                  }}
                  maxTagCount="responsive"
                  size="large"
                >
                  {majors.map(m => (
                    <Select.Option key={m} value={m}>{m}</Select.Option>
                  ))}
                </Select>
              </Col>

              <Col xs={24} md={8}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <span style={{ fontWeight: 600, fontSize: 13, color: "#334155" }}>ประเภทบุคลากร / หน้าที่</span>
                  <Button 
                    type="link" 
                    size="small" 
                    onClick={() => handleSelectAllTypes(selectedTypes.length !== availableTypes.length)}
                    style={{ padding: 0, height: "auto", fontSize: 12, color: "#0284c7" }}
                  >
                    {selectedTypes.length === availableTypes.length ? "ยกเลิกทั้งหมด" : "เลือกทั้งหมด"}
                  </Button>
                </div>
                <Select
                  mode="multiple"
                  allowClear
                  style={{ width: '100%' }}
                  placeholder="เลือกทั้งหมดทุกประเภท"
                  value={selectedTypes}
                  onChange={(val) => setSelectedTypes(val)}
                  maxTagCount="responsive"
                  size="large"
                >
                  {availableTypes.map(type => (
                    <Select.Option key={type} value={type}>{type}</Select.Option>
                  ))}
                </Select>
              </Col>

              <Col xs={24} md={8}>
                <div style={{ marginBottom: 6, fontWeight: 600, fontSize: 13, color: "#334155" }}>ค้นหารายชื่ออาจารย์</div>
                <Input 
                  placeholder="พิมพ์ชื่อหรือนามสกุล..." 
                  prefix={<SearchOutlined style={{ color: "#94a3b8" }} />} 
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  style={{ height: 40, borderRadius: 8, borderColor: "#cbd5e1" }}
                  allowClear
                />
              </Col>

            </Row>
          </div>

          {rawData.length === 0 ? (
            <Card style={{ borderRadius: 16, padding: "40px 0", textAlign: "center", border: "1px solid #e2e8f0" }}>
              <Empty 
                description={
                  <span>
                    ยังไม่มีข้อมูลอาจารย์ในระบบคลังข้อมูล <br />
                    <span style={{ fontSize: 12, color: "#94a3b8" }}>กรุณาอัปโหลดไฟล์ Excel ที่มีแผ่นงานอาจารย์ที่หน้าจัดการข้อมูลก่อน</span>
                  </span>
                } 
              />
            </Card>
          ) : (
            <>
              {/* KPI CARDS ZONE */}
              <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col xs={24} sm={12} md={6}>
                  <div style={{ background: "linear-gradient(135deg, #0284c7, #0369a1)", padding: 20, borderRadius: 16, color: "white", position: "relative", boxShadow: "0 4px 12px rgba(2, 132, 199, 0.15)" }}>
                    <div style={{ opacity: 0.85, fontSize: 12, fontWeight: 500 }}>บุคลากรสายวิชาการ</div>
                    <div style={{ margin: "4px 0", fontSize: 14, fontWeight: 600 }}>อาจารย์ทั้งหมด</div>
                    <div style={{ margin: "10px 0 0 0", fontSize: 28, fontWeight: "bold" }}>{stats.total.toLocaleString()} <span style={{ fontSize: 14, fontWeight: "normal", opacity: 0.85 }}>ท่าน</span></div>
                    <UserOutlined style={{ fontSize: 36, color: "white", position: "absolute", right: 20, bottom: 20, opacity: 0.25 }} />
                  </div>
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <div style={{ background: "linear-gradient(135deg, #059669, #047857)", padding: 20, borderRadius: 16, color: "white", position: "relative", boxShadow: "0 4px 12px rgba(5, 150, 105, 0.15)" }}>
                    <div style={{ opacity: 0.85, fontSize: 12, fontWeight: 500 }}>ระดับคุณวุฒิ</div>
                    <div style={{ margin: "4px 0", fontSize: 14, fontWeight: 600 }}>จบการศึกษาปริญญาเอก</div>
                    <div style={{ margin: "10px 0 0 0", fontSize: 28, fontWeight: "bold" }}>{stats.phdCount.toLocaleString()} <span style={{ fontSize: 14, fontWeight: "normal", opacity: 0.85 }}>ท่าน</span></div>
                    <BookOutlined style={{ fontSize: 36, color: "white", position: "absolute", right: 20, bottom: 20, opacity: 0.25 }} />
                  </div>
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <div style={{ background: "linear-gradient(135deg, #c28d07, #b27d00)", padding: 20, borderRadius: 16, color: "white", position: "relative", boxShadow: "0 4px 12px rgba(194, 141, 7, 0.15)" }}>
                    <div style={{ opacity: 0.85, fontSize: 12, fontWeight: 500 }}>ระดับคุณวุฒิ</div>
                    <div style={{ margin: "4px 0", fontSize: 14, fontWeight: 600 }}>จบการศึกษาปริญญาโท</div>
                    <div style={{ margin: "10px 0 0 0", fontSize: 28, fontWeight: "bold" }}>{stats.masterCount.toLocaleString()} <span style={{ fontSize: 14, fontWeight: "normal", opacity: 0.85 }}>ท่าน</span></div>
                    <BookOutlined style={{ fontSize: 36, color: "white", position: "absolute", right: 20, bottom: 20, opacity: 0.25 }} />
                  </div>
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <div style={{ background: "linear-gradient(135deg, #7c3aed, #6d28d9)", padding: 20, borderRadius: 16, color: "white", position: "relative", boxShadow: "0 4px 12px rgba(124, 58, 237, 0.15)" }}>
                    <div style={{ opacity: 0.85, fontSize: 12, fontWeight: 500 }}>ตำแหน่งวิชาการ</div>
                    <div style={{ margin: "4px 0", fontSize: 14, fontWeight: 600 }}>ดำรงตำแหน่ง ผศ./รศ./ศ.</div>
                    <div style={{ margin: "10px 0 0 0", fontSize: 28, fontWeight: "bold" }}>{stats.academicPositionCount.toLocaleString()} <span style={{ fontSize: 14, fontWeight: "normal", opacity: 0.85 }}>ท่าน</span></div>
                    <SolutionOutlined style={{ fontSize: 36, color: "white", position: "absolute", right: 20, bottom: 20, opacity: 0.25 }} />
                  </div>
                </Col>
              </Row>

              {/* DONUT CHARTS ZONE */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 20, marginBottom: 24 }}>
                
                <div style={{ background: "white", borderRadius: 16, padding: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.02)", border: "1px solid #e2e8f0" }}>
                  <h3 style={{ margin: "0 0 16px 0", fontSize: 16, fontWeight: 600, color: "#0f172a" }}>
                    สัดส่วนประเภทอาจารย์
                  </h3>
                  <div style={{ height: 260 }}>
                    {teacherTypeChartData.length === 0 ? (
                      <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8" }}>
                        ไม่มีข้อมูลประเภทอาจารย์
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={teacherTypeChartData}
                            dataKey="value"
                            nameKey="name"
                            cx="40%"
                            cy="50%"
                            innerRadius={55}
                            outerRadius={88}
                            paddingAngle={3}
                          >
                            {teacherTypeChartData.map((entry, index) => (
                              <Cell key={`cell-type-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => [`${value} ท่าน`, 'จำนวน']} />
                          <Legend 
                            layout="vertical" 
                            verticalAlign="middle" 
                            align="right"
                            iconType="circle"
                            wrapperStyle={{ fontSize: 13, paddingLeft: 10, color: "#334155" }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>

                <div style={{ background: "white", borderRadius: 16, padding: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.02)", border: "1px solid #e2e8f0" }}>
                  <h3 style={{ margin: "0 0 16px 0", fontSize: 16, fontWeight: 600, color: "#0f172a" }}>
                    สัดส่วนระดับคุณวุฒิการศึกษา
                  </h3>
                  <div style={{ height: 260 }}>
                    {degreeChartData.length === 0 ? (
                      <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8" }}>
                        ไม่มีข้อมูลคุณวุฒิการศึกษา
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={degreeChartData}
                            dataKey="value"
                            nameKey="name"
                            cx="40%"
                            cy="50%"
                            innerRadius={55}
                            outerRadius={88}
                            paddingAngle={3}
                          >
                            {degreeChartData.map((entry, index) => (
                              <Cell key={`cell-deg-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => [`${value} ท่าน`, 'จำนวน']} />
                          <Legend 
                            layout="vertical" 
                            verticalAlign="middle" 
                            align="right"
                            iconType="circle"
                            wrapperStyle={{ fontSize: 13, paddingLeft: 10, color: "#334155" }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>

              </div>

              {/* BAR GRAPH ZONE */}
              <div style={{ background: "white", padding: 24, borderRadius: 16, marginBottom: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.02)", border: "1px solid #e2e8f0" }}>
                <h3 style={{ marginBottom: 20, fontWeight: 600, fontSize: 16, color: "#0f172a" }}>
                  📊 แผนภูมิแสดงจำนวนอาจารย์แยกตามตำแหน่งทางวิชาการ
                </h3>
                <div style={{ height: 350 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} style={{ fontSize: 12, fontWeight: 500, fill: "#475569" }} />
                      <YAxis axisLine={false} tickLine={false} allowDecimals={false} style={{ fontSize: 12, fill: "#475569" }} />
                      <Tooltip cursor={{ fill: '#f8fafc' }} formatter={(value) => [`${value} ท่าน`, 'จำนวนอาจารย์']} />
                      <Bar dataKey="จำนวน" radius={[8, 8, 0, 0]} barSize={42}>
                        <LabelList dataKey="จำนวน" position="top" style={{ fill: '#334155', fontSize: 13, fontWeight: 'bold' }} formatter={(v) => v > 0 ? `${v} ท่าน` : ''} />
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* MAIN AREA */}
              <div style={{ background: "white", padding: 24, borderRadius: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.02)", border: "1px solid #e2e8f0", marginBottom: 24 }}>
                
                {/* HEADER ROW */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
                  <div>
                    <h3 style={{ margin: "0 0 4px 0", fontWeight: 600, fontSize: 16, color: "#0f172a" }}>
                      บุคลากรสายวิชาการ ({viewType === "cards" ? mainFilteredData.length : tableData.length} ท่าน)
                    </h3>
                    <div style={{ fontSize: 13, color: "#64748b" }}>
                      เลือกสลับดูแบบรายนามบุคคลพร้อมรูป หรือในมุมมองตารางสรุป
                    </div>
                  </div>

                  <Segmented
                    options={[
                      { label: "การ์ดภาพโปรไฟล์", value: "cards", icon: <AppstoreOutlined /> },
                      { label: "ตารางข้อมูล", value: "table", icon: <BarsOutlined /> }
                    ]}
                    value={viewType}
                    onChange={(value) => setViewType(value)}
                    style={{ background: "#f1f5f9", padding: "4px", borderRadius: 10 }}
                  />
                </div>

                {/* 1. Cards View */}
                {viewType === "cards" && (
                  <div>
                    <div style={{ marginBottom: 24, background: "#f8fafc", padding: "16px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                        <div style={{ fontSize: "13px", fontWeight: 600, color: "#334155" }}>
                          <FilterOutlined style={{ color: "#0284c7", marginRight: 6 }} />
                          กรองสาขาวิชาอย่างรวดเร็ว:
                        </div>
                        <Button 
                          type="link" 
                          size="small" 
                          onClick={() => handleSelectAllMajors(selectedMajors.length !== majors.length)}
                          style={{ fontSize: 12, color: "#0284c7" }}
                        >
                          {selectedMajors.length === majors.length ? "ยกเลิกทั้งหมด" : "เลือกทั้งหมด"}
                        </Button>
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                        <Button
                          type={selectedMajors.length === 0 ? "primary" : "default"}
                          shape="round"
                          onClick={() => {
                            setSelectedMajors([]);
                            setTableMajorFilters([]);
                          }}
                          style={{ fontSize: "13px", height: "34px", backgroundColor: selectedMajors.length === 0 ? "#0284c7" : undefined, borderColor: selectedMajors.length === 0 ? "#0284c7" : undefined }}
                        >
                          ทั้งหมด ({rawData.length})
                        </Button>
                        {majors.map((m) => {
                          const count = rawData.filter(item => cleanString(item["สาขาวิชา"] || item["ชื่อสาขา"] || item["สาขา"]) === cleanString(m)).length;
                          const isSelected = selectedMajors.includes(m);
                          return (
                            <Button
                              key={m}
                              type={isSelected ? "primary" : "default"}
                              shape="round"
                              onClick={() => {
                                if (isSelected) {
                                  setSelectedMajors(selectedMajors.filter(item => item !== m));
                                } else {
                                  setSelectedMajors([...selectedMajors, m]);
                                }
                                setTableMajorFilters([]);
                              }}
                              style={{ fontSize: "13px", height: "34px", backgroundColor: isSelected ? "#0284c7" : undefined, borderColor: isSelected ? "#0284c7" : undefined }}
                            >
                              {m} ({count})
                            </Button>
                          );
                        })}
                      </div>
                    </div>

                    {mainFilteredData.length === 0 ? (
                      <Empty description="ไม่พบคณาจารย์ที่ตรงกับตัวกรองที่เลือก" />
                    ) : (
                      <Row gutter={[16, 16]}>
                        {mainFilteredData.map((teacher, index) => {
                          const name = teacher["ชื่อ นามสกุล"] || teacher["ชื่อ-นามสกุล"] || teacher["ชื่ออาจารย์"] || teacher["ชื่อ"] || "-";
                          const major = teacher["สาขาวิชา"] || teacher["สาขา"] || teacher["ชื่อสาขา"] || "-";
                          const pos = teacher["ตำแหน่งทางวิชาการ"] || teacher["ตำแหน่งวิชาการ"] || teacher["ตำแหน่ง"] || "อาจารย์";
                          const degree = teacher["คุณวุฒิ"] || teacher["วุฒิการศึกษา"] || teacher["การศึกษา"] || "-";
                          const type = getTeacherType(teacher);

                          return (
                            <Col xs={24} sm={12} md={8} lg={6} key={`teacher-card-${index}`}>
                              <Card 
                                hoverable
                                style={{ 
                                  borderRadius: 16, 
                                  overflow: "hidden", 
                                  textAlign: "center", 
                                  border: "1px solid #e2e8f0",
                                  boxShadow: "0 2px 8px rgba(0,0,0,0.02)"
                                }}
                                bodyStyle={{ padding: "24px 16px" }}
                              >
                                <Avatar 
                                  src={getAvatarUrl(teacher)} 
                                  size={88} 
                                  style={{ 
                                    border: "3px solid #0284c7", 
                                    boxShadow: "0 4px 12px rgba(2, 132, 199, 0.15)",
                                    marginBottom: 16 
                                  }} 
                                />
                                <div style={{ minHeight: 135 }}>
                                  <div style={{ marginBottom: 8, display: "flex", justifyContent: "center", gap: 4, flexWrap: "wrap" }}>
                                    {getPositionTag(pos)}
                                    <Tag color="geekblue" style={{ borderRadius: 6 }}>{type}</Tag>
                                  </div>
                                  <h4 style={{ margin: "0 0 6px 0", fontSize: 16, fontWeight: 700, color: "#0f172a" }}>{name}</h4>
                                  <div style={{ fontSize: 12, color: "#64748b", marginBottom: 4 }}>{getShortDegree(degree)}</div>
                                  
                                  <div style={{ fontSize: 12, fontWeight: 500, color: "#0284c7" }}>
                                    สังกัดสาขาวิชา: {major}
                                  </div>
                                </div>
                                
                                <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: 16, marginTop: 12 }}>
                                  <Button 
                                    type="primary" 
                                    block
                                    icon={<EyeOutlined />}
                                    onClick={() => handleOpenDetail(teacher)}
                                    style={{ borderRadius: 8, backgroundColor: "#0284c7", borderColor: "#0284c7" }}
                                  >
                                    ดูประวัติเพิ่มเติม
                                  </Button>
                                </div>
                              </Card>
                            </Col>
                          );
                        })}
                      </Row>
                    )}
                  </div>
                )}

                {/* 2. Table View */}
                {viewType === "table" && (
                  <div>
                    <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
                      <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#f8fafc", padding: "6px 14px", borderRadius: 10, border: "1px solid #e2e8f0", minWidth: 280 }}>
                        <FilterOutlined style={{ color: "#0284c7" }} />
                        <span style={{ fontSize: 13, fontWeight: 500, color: "#475569", whiteSpace: "nowrap" }}>กรองเฉพาะในตาราง:</span>
                        <Select
                          mode="multiple"
                          allowClear
                          style={{ flex: 1 }}
                          placeholder={selectedMajors.length > 0 ? `ตามตัวกรองหลัก (${selectedMajors.length} สาขา)` : "ทุกสาขาวิชา"}
                          value={tableMajorFilters}
                          onChange={(val) => setTableMajorFilters(val)}
                          maxTagCount="responsive"
                          size="small"
                        >
                          {majors.map((m) => <Select.Option key={m} value={m}>{m}</Select.Option>)}
                        </Select>
                      </div>
                    </div>

                    <Table 
                      columns={columns} 
                      dataSource={tableData} 
                      rowKey={(record, idx) => `faculty-${idx}`}
                      pagination={{ pageSize: 10, showTotal: (total) => `รวมทั้งหมด ${total} รายการ` }}
                      bordered
                      scroll={{ x: true }}
                    />
                  </div>
                )}
              </div>
            </>
          )}

          {/* 👤 POPUP MODAL */}
          <Modal
            open={isModalOpen}
            onCancel={() => setIsModalOpen(false)}
            footer={[
              <Button key="close" type="primary" onClick={() => setIsModalOpen(false)} style={{ borderRadius: 8, backgroundColor: "#0284c7", borderColor: "#0284c7" }}>
                ปิดหน้าต่าง
              </Button>
            ]}
            width={580}
            centered
            bodyStyle={{ padding: "24px" }}
            style={{ borderRadius: 20, overflow: "hidden" }}
          >
            {activeTeacher && (
              <div style={{ textAlign: "center" }}>
                <div style={{ 
                  background: "linear-gradient(135deg, #0284c7 0%, #7c3aed 100%)", 
                  height: 105, 
                  borderRadius: "14px 14px 0 0", 
                  margin: "-24px -24px 44px -24px",
                  position: "relative"
                }}>
                  <Avatar 
                    src={getAvatarUrl(activeTeacher)} 
                    size={96} 
                    style={{ 
                      border: "4px solid #ffffff", 
                      boxShadow: "0 6px 16px rgba(0,0,0,0.12)",
                      position: "absolute",
                      bottom: "-48px",
                      left: "calc(50% - 48px)"
                    }} 
                  />
                </div>

                <h3 style={{ margin: "16px 0 6px 0", fontSize: 20, fontWeight: 700, color: "#0f172a" }}>
                  {activeTeacher["ชื่อ นามสกุล"] || activeTeacher["ชื่อ-นามสกุล"] || activeTeacher["ชื่ออาจารย์"] || activeTeacher["ชื่อ"] || "-"}
                </h3>
                <div style={{ marginBottom: 16, display: "flex", justifyContent: "center", gap: 6 }}>
                  {getPositionTag(activeTeacher["ตำแหน่งทางวิชาการ"] || activeTeacher["ตำแหน่งวิชาการ"] || activeTeacher["ตำแหน่ง"])}
                  <Tag color="geekblue" style={{ borderRadius: 6 }}>{getTeacherType(activeTeacher)}</Tag>
                </div>

                <div style={{ textAlign: "left", background: "#f8fafc", padding: 20, borderRadius: 12, border: "1px solid #e2e8f0", marginTop: 20 }}>
                  <Row gutter={[16, 12]}>
                    <Col span={24}>
                      <div style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", fontWeight: 600 }}>สาขาวิชาที่สังกัด</div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "#0f172a", marginTop: 2 }}>
                        {activeTeacher["สาขาวิชา"] || activeTeacher["สาขา"] || activeTeacher["ชื่อสาขา"] || "-"}
                      </div>
                    </Col>
                    
                    <Col span={24} style={{ borderTop: "1px dashed #e2e8f0", paddingTop: 10 }}>
                      <div style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", fontWeight: 600 }}>คุณวุฒิ / ประวัติการศึกษา</div>
                      <div style={{ fontSize: 14, fontWeight: 500, color: "#334155", marginTop: 4, lineHeight: "1.6" }}>
                        {activeTeacher["คุณวุฒิ"] || activeTeacher["วุฒิการศึกษา"] || activeTeacher["การศึกษา"] || "-"}
                      </div>
                    </Col>

                    <Col span={24} style={{ borderTop: "1px dashed #e2e8f0", paddingTop: 10 }}>
                      <div style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", fontWeight: 600 }}>ผลงานทางวิชาการ / ผลงานตีพิมพ์</div>
                      <div style={{ marginTop: 8 }}>
                        {(() => {
                          const workLink = activeTeacher["ลิงก์ผลงาน"] || activeTeacher["ผลงาน"] || activeTeacher["ผลงานวิชาการ"] || activeTeacher["portfolio"] || activeTeacher["link"] || activeTeacher["url"];
                          
                          if (!workLink) {
                            return <span style={{ fontSize: 13, color: "#94a3b8" }}>ยังไม่มีข้อมูลผลงานทางวิชาการ</span>;
                          }

                          const isUrl = String(workLink).startsWith("http://") || String(workLink).startsWith("https://");

                          return isUrl ? (
                            <a 
                              href={workLink} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              style={{ 
                                display: "inline-flex", 
                                alignItems: "center", 
                                gap: 6, 
                                color: "#0284c7", 
                                fontWeight: 600, 
                                fontSize: 13,
                                background: "#f0f9ff",
                                padding: "6px 12px",
                                borderRadius: 8,
                                border: "1px solid #bae6fd"
                              }}
                            >
                              <BookOutlined /> ดูลิงก์ผลงานทางวิชาการ ↗
                            </a>
                          ) : (
                            <div style={{ fontSize: 13, color: "#334155", lineHeight: "1.6", whiteSpace: "pre-line" }}>
                              {workLink}
                            </div>
                          );
                        })()}
                      </div>
                    </Col>

                    <Col span={24} style={{ borderTop: "1px dashed #e2e8f0", paddingTop: 10 }}>
                      <div style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", fontWeight: 600 }}>ช่องทางการติดต่อ</div>
                      <Row gutter={[8, 8]} style={{ marginTop: 8 }}>
                        <Col span={12} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#475569" }}>
                          <MailOutlined style={{ color: "#0284c7" }} />
                          <span>{activeTeacher["อีเมล"] || activeTeacher["email"] || "ยังไม่ได้ระบุอีเมล"}</span>
                        </Col>
                        <Col span={12} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#475569" }}>
                          <PhoneOutlined style={{ color: "#059669" }} />
                          <span>{activeTeacher["เบอร์โทร"] || activeTeacher["เบอร์โทรศัพท์"] || "ยังไม่ได้ระบุเบอร์ติดต่อ"}</span>
                        </Col>
                      </Row>
                    </Col>
                  </Row>
                </div>
              </div>
            )}
          </Modal>

        </Content>
      </Layout>
    </Layout>
  );
}

export default FacultyPage;
