import { Layout, Table, Button, Card, Row, Col, Empty, Input, Avatar, Tag, Modal, Segmented } from "antd";
import Sidebar from "../components/Sidebar";
import { useMemo, useState, useEffect } from "react";
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
  const [selectedMajor, setSelectedMajor] = useState("");
  const [selectedType, setSelectedType] = useState(""); 
  const [searchText, setSearchText] = useState("");
  const [rawData, setRawData] = useState([]);
  const [tableMajorFilter, setTableMajorFilter] = useState("");
  
  const [viewType, setViewType] = useState("cards");

  const [activeTeacher, setActiveTeacher] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 🧹 ฟังก์ชันสำหรับ Clean และกรองรายชื่ออาจารย์
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
        const parsed = JSON.parse(stored);
        const facultyData = parsed["ข้อมูลอาจารย์"] || parsed["อาจารย์"] || parsed["อาจารย์สาขา"] || [];
        const cleaned = cleanFacultyData(facultyData);
        setRawData(cleaned);
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

  // Helper อ่านประเภทบุคลากร
  const getTeacherType = (item) => {
    return item["ประเภทบุคลากร"] || item["ประเภทอาจารย์"] || item["กลุ่มอาจารย์"] || item["ประเภท"] || item["หน้าที่"] || "สายวิชาการ";
  };

  // 3. กรองข้อมูลสำหรับภาพรวม (Cards View)
  const mainFilteredData = useMemo(() => {
    return rawData.filter(item => {
      const majorClean = cleanString(item["สาขาวิชา"] || item["ชื่อสาขา"] || item["สาขา"]);
      const teacherName = item["ชื่อ นามสกุล"] || item["ชื่อ-นามสกุล"] || item["ชื่ออาจารย์"] || item["ชื่อ"] || "";
      const teacherType = getTeacherType(item);
      const nameClean = String(teacherName).toLowerCase();
      
      if (selectedMajor && majorClean !== cleanString(selectedMajor)) return false;
      if (selectedType && !String(teacherType).includes(selectedType)) return false;
      if (searchText && !nameClean.includes(searchText.toLowerCase())) return false;
      
      return true;
    });
  }, [rawData, selectedMajor, selectedType, searchText]);

  // 4. กรองข้อมูลสำหรับตาราง (Table View)
  const tableData = useMemo(() => {
    return rawData.filter(item => {
      const majorClean = cleanString(item["สาขาวิชา"] || item["ชื่อสาขา"] || item["สาขา"]);
      const teacherName = item["ชื่อ นามสกุล"] || item["ชื่อ-นามสกุล"] || item["ชื่ออาจารย์"] || item["ชื่อ"] || "";
      const teacherType = getTeacherType(item);
      const nameClean = String(teacherName).toLowerCase();

      const activeMajorFilter = tableMajorFilter || selectedMajor;
      if (activeMajorFilter && majorClean !== cleanString(activeMajorFilter)) return false;
      if (selectedType && !String(teacherType).includes(selectedType)) return false;
      if (searchText && !nameClean.includes(searchText.toLowerCase())) return false;

      return true;
    });
  }, [rawData, selectedMajor, tableMajorFilter, selectedType, searchText]);

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
      { name: "อาจารย์ผู้รับผิดชอบหลักสูตร", value: resp, color: "#003a8c" },
      { name: "อาจารย์ประจำสาขา/หลักสูตร", value: regular, color: "#0091ff" },
      { name: "อาจารย์ผู้สอน/อื่นๆ", value: instructor, color: "#bae7ff" },
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
      { name: "ปริญญาเอก", value: phd, color: "#003a8c" },
      { name: "ปริญญาโท", value: master, color: "#0091ff" },
      { name: "ปริญญาตรี / อื่นๆ", value: bachelor, color: "#bae7ff" },
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
      { name: "ศาสตราจารย์ (ศ.)", จำนวน: prof, color: "#722ed1" },
      { name: "รองศาสตราจารย์ (รศ.)", จำนวน: assocProf, color: "#2f54eb" },
      { name: "ผู้ช่วยศาสตราจารย์ (ผศ.)", จำนวน: asstProf, color: "#13c2c2" },
      { name: "อาจารย์ / อื่นๆ", จำนวน: lecturer, color: "#fa8c16" },
    ];
  }, [mainFilteredData]);

  const getAvatarUrl = (item) => {
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
    if (pos.includes("รองศาสตราจารย์") || pos.includes("รศ")) return <Tag color="blue">รศ.</Tag>;
    if (pos.includes("ผู้ช่วยศาสตราจารย์") || pos.includes("ผศ")) return <Tag color="cyan">ผศ.</Tag>;
    if (pos.includes("ศาสตราจารย์") || pos.includes("ศ.")) return <Tag color="purple">ศ.</Tag>;
    return <Tag color="orange">อาจารย์</Tag>;
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
      render: (text, record, index) => index + 1 
    },
    {
      title: "รูปโปรไฟล์",
      key: "avatar",
      align: "center",
      width: 90,
      render: (text, record) => (
        <Avatar src={getAvatarUrl(record)} size={40} style={{ border: "2px solid #1890ff" }} />
      )
    },
    { 
      title: "ชื่อ นามสกุล", 
      key: "name",
      render: (text, record) => {
        const name = record["ชื่อ นามสกุล"] || record["ชื่อ-นามสกุล"] || record["ชื่ออาจารย์"] || record["ชื่อ"] || record["อาจารย์"] || "-";
        return <strong style={{ color: "#1f1f1f" }}>{name}</strong>;
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
        return <Tag color="geekblue">{type}</Tag>;
      }
    },
    { 
      title: "คุณวุฒิ / การศึกษาสูงสุด", 
      key: "degree",
      render: (text, record) => {
        return record["คุณวุฒิ"] || record["วุฒิการศึกษา"] || record["การศึกษา"] || "-";
      }
    },
    { 
      title: "สาขาวิชาที่สังกัด", 
      key: "major",
      render: (text, record) => {
        return record["สาขาวิชา"] || record["สาขา"] || record["ชื่อสาขา"] || "-";
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
          style={{ borderRadius: 6 }}
          onClick={() => handleOpenDetail(record)}
        >
          ดูประวัติ
        </Button>
      )
    }
  ];

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sidebar />
      <Layout>
        <Header style={{ background: "white", padding: "16px 24px", height: "auto", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #f0f0f0" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <h2 style={{ margin: 0, fontSize: "20px", fontWeight: "600", color: "#1f1f1f", lineHeight: "1.2" }}>
              ข้อมูลอาจารย์ประจำสาขาวิชา
            </h2>
            <div style={{ color: "#8c8c8c", fontSize: "13px", lineHeight: "1.4", margin: 0 }}>
              บริหารจัดการข้อมูล คุณวุฒิการศึกษา และตำแหน่งทางวิชาการของบุคลากรสายวิชาการ
            </div>
          </div>
        </Header>

        <Content style={{ padding: "24px 32px", background: "#f5f5f5" }}>
          
          {/* FILTER & SEARCH SECTION */}
          <div style={{ background: "#fff", padding: 20, borderRadius: 16, marginBottom: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
            <Row gutter={[16, 16]} align="bottom">
              
              <Col xs={24} md={8}>
                <div style={{ marginBottom: 6, fontWeight: 600, fontSize: 13, color: "#262626" }}>สาขาวิชา</div>
                <select 
                  value={selectedMajor} 
                  onChange={(e) => {
                    setSelectedMajor(e.target.value);
                    setTableMajorFilter("");
                  }} 
                  style={{ width: "100%", padding: "10px", borderRadius: 8, border: "1px solid #d9d9d9", outline: "none", background: "#fff" }}
                >
                  <option value="">ทั้งหมด</option>
                  {majors.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </Col>

              <Col xs={24} md={8}>
                <div style={{ marginBottom: 6, fontWeight: 600, fontSize: 13, color: "#262626" }}>ประเภทบุคลากร / หน้าที่</div>
                <select 
                  value={selectedType} 
                  onChange={(e) => setSelectedType(e.target.value)} 
                  style={{ width: "100%", padding: "10px", borderRadius: 8, border: "1px solid #d9d9d9", outline: "none", background: "#fff" }}
                >
                  <option value="">ทั้งหมดทุกประเภท</option>
                  <option value="สายวิชาการ">สายวิชาการ</option>
                  <option value="อาจารย์ผู้รับผิดชอบหลักสูตร">อาจารย์ผู้รับผิดชอบหลักสูตร</option>
                  <option value="อาจารย์ประจำหลักสูตร">อาจารย์ประจำหลักสูตร</option>
                  <option value="อาจารย์ผู้สอน">อาจารย์ผู้สอน</option>
                </select>
              </Col>

              <Col xs={24} md={8}>
                <div style={{ marginBottom: 6, fontWeight: 600, fontSize: 13, color: "#262626" }}>ค้นหารายชื่ออาจารย์</div>
                <Input 
                  placeholder="พิมพ์ชื่อหรือนามสกุล..." 
                  prefix={<SearchOutlined style={{ color: "#bfbfbf" }} />} 
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  style={{ height: 42, borderRadius: 8 }}
                  allowClear
                />
              </Col>

            </Row>
          </div>

          {rawData.length === 0 ? (
            <Card style={{ borderRadius: 16, padding: "40px 0", textAlign: "center" }}>
              <Empty 
                description={
                  <span>
                    ยังไม่มีข้อมูลอาจารย์ในระบบคลังข้อมูล <br />
                    <span style={{ fontSize: 12, color: "#bfbfbf" }}>กรุณาอัปโหลดไฟล์ Excel ที่มีแผ่นงานอาจารย์ที่หน้าจัดการข้อมูลก่อน</span>
                  </span>
                } 
              />
            </Card>
          ) : (
            <>
              {/* KPI CARDS ZONE */}
              <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col xs={24} sm={8} md={6}>
                  <div style={{ background: "#e6f7ff", padding: 20, borderRadius: 15, border: "1px solid #91d5ff", position: "relative" }}>
                    <div style={{ color: "#8c8c8c", fontSize: 12 }}>บุคลากรสายวิชาการ</div>
                    <h4 style={{ margin: "5px 0", fontSize: 14, color: "#0050b3" }}>อาจารย์ทั้งหมด</h4>
                    <h2 style={{ margin: 0, fontSize: 28, fontWeight: "bold", color: "#0050b3" }}>{stats.total.toLocaleString()} <span style={{ fontSize: 14, fontWeight: "normal", color: "#8c8c8c" }}>ท่าน</span></h2>
                    <UserOutlined style={{ fontSize: 28, color: "#1890ff", position: "absolute", right: 20, bottom: 20, opacity: 0.3 }} />
                  </div>
                </Col>
                <Col xs={24} sm={8} md={6}>
                  <div style={{ background: "#f6ffed", padding: 20, borderRadius: 15, border: "1px solid #b7eb8f", position: "relative" }}>
                    <div style={{ color: "#8c8c8c", fontSize: 12 }}>ระดับคุณวุฒิ</div>
                    <h4 style={{ margin: "5px 0", fontSize: 14, color: "#237804" }}>จบการศึกษาปริญญาเอก</h4>
                    <h2 style={{ margin: 0, fontSize: 28, fontWeight: "bold", color: "#237804" }}>{stats.phdCount.toLocaleString()} <span style={{ fontSize: 14, fontWeight: "normal", color: "#8c8c8c" }}>ท่าน</span></h2>
                    <BookOutlined style={{ fontSize: 28, color: "#52c41a", position: "absolute", right: 20, bottom: 20, opacity: 0.3 }} />
                  </div>
                </Col>
                <Col xs={24} sm={8} md={6}>
                  <div style={{ background: "#fffbe6", padding: 20, borderRadius: 15, border: "1px solid #ffe58f", position: "relative" }}>
                    <div style={{ color: "#8c8c8c", fontSize: 12 }}>ระดับคุณวุฒิ</div>
                    <h4 style={{ margin: "5px 0", fontSize: 14, color: "#ad6800" }}>จบการศึกษาปริญญาโท</h4>
                    <h2 style={{ margin: 0, fontSize: 28, fontWeight: "bold", color: "#ad6800" }}>{stats.masterCount.toLocaleString()} <span style={{ fontSize: 14, fontWeight: "normal", color: "#8c8c8c" }}>ท่าน</span></h2>
                    <BookOutlined style={{ fontSize: 28, color: "#faad14", position: "absolute", right: 20, bottom: 20, opacity: 0.3 }} />
                  </div>
                </Col>
                <Col xs={24} sm={24} md={6}>
                  <div style={{ background: "#f9f0ff", padding: 20, borderRadius: 15, border: "1px solid #d3adf7", position: "relative" }}>
                    <div style={{ color: "#8c8c8c", fontSize: 12 }}>ตำแหน่งวิชาการ</div>
                    <h4 style={{ margin: "5px 0", fontSize: 14, color: "#531dab" }}>ดำรงตำแหน่ง ผศ./รศ./ศ.</h4>
                    <h2 style={{ margin: 0, fontSize: 28, fontWeight: "bold", color: "#531dab" }}>{stats.academicPositionCount.toLocaleString()} <span style={{ fontSize: 14, fontWeight: "normal", color: "#8c8c8c" }}>ท่าน</span></h2>
                    <SolutionOutlined style={{ fontSize: 28, color: "#722ed1", position: "absolute", right: 20, bottom: 20, opacity: 0.3 }} />
                  </div>
                </Col>
              </Row>

              {/* DONUT CHARTS ZONE */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 20, marginBottom: 24 }}>
                
                <div style={{ background: "white", borderRadius: 16, padding: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
                  <h3 style={{ margin: "0 0 16px 0", fontSize: 16, fontWeight: 600, color: "#1f1f1f" }}>
                    สัดส่วนประเภทอาจารย์
                  </h3>
                  <div style={{ height: 260 }}>
                    {teacherTypeChartData.length === 0 ? (
                      <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#bfbfbf" }}>
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
                            outerRadius={90}
                            paddingAngle={2}
                            label={({ value, percent }) => `${value} (${(percent * 100).toFixed(1)}%)`}
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
                            wrapperStyle={{ fontSize: 13, paddingLeft: 10 }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>

                <div style={{ background: "white", borderRadius: 16, padding: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
                  <h3 style={{ margin: "0 0 16px 0", fontSize: 16, fontWeight: 600, color: "#1f1f1f" }}>
                    สัดส่วนระดับคุณวุฒิการศึกษา
                  </h3>
                  <div style={{ height: 260 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={degreeChartData}
                          dataKey="value"
                          nameKey="name"
                          cx="40%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={90}
                          paddingAngle={2}
                          label={({ value, percent }) => `${value} (${(percent * 100).toFixed(1)}%)`}
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
                          wrapperStyle={{ fontSize: 13, paddingLeft: 10 }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

              </div>

              {/* BAR GRAPH ZONE */}
              <div style={{ background: "white", padding: 24, borderRadius: 16, marginBottom: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
                <h3 style={{ marginBottom: 20, fontWeight: 600, fontSize: 15 }}>📊 แผนภูมิแสดงจำนวนอาจารย์แยกตามตำแหน่งทางวิชาการ</h3>
                <div style={{ height: 350 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} style={{ fontSize: 12, fontWeight: 500 }} />
                      <YAxis axisLine={false} tickLine={false} allowDecimals={false} style={{ fontSize: 12 }} />
                      <Tooltip cursor={{ fill: '#f8fafc' }} formatter={(value) => [`${value} ท่าน`, 'จำนวนอาจารย์']} />
                      <Bar dataKey="จำนวน" radius={[6, 6, 0, 0]} barSize={45}>
                        <LabelList dataKey="จำนวน" position="top" style={{ fill: '#475569', fontSize: 13, fontWeight: 'bold' }} formatter={(v) => v > 0 ? `${v} ท่าน` : ''} />
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* MAIN AREA */}
              <div style={{ background: "white", padding: 24, borderRadius: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.04)", marginBottom: 24 }}>
                
                {/* HEADER ROW - ล็อกตำแหน่ง Segmented ให้อยู่ทางขวาเสมอ ไม่ขยับตามส่วนอื่น */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
                  <div>
                    <h3 style={{ margin: "0 0 4px 0", fontWeight: 600, fontSize: 16 }}>
                      บุคลากรสายวิชาการ ({viewType === "cards" ? mainFilteredData.length : tableData.length} ท่าน)
                    </h3>
                    <div style={{ fontSize: 12, color: "#8c8c8c" }}>
                      เลือกสลับดูแบบรายนามบุคคลพร้อมรูป หรือในมุมมองตารางสรุป
                    </div>
                  </div>

                  {/* ปุ่ม Segmented จะถูกตรึงตำแหน่งไว้มุมขวาบนตรงนี้ตลอดเวลา */}
                  <Segmented
                    options={[
                      { label: "การ์ดภาพโปรไฟล์", value: "cards", icon: <AppstoreOutlined /> },
                      { label: "ตารางข้อมูล", value: "table", icon: <BarsOutlined /> }
                    ]}
                    value={viewType}
                    onChange={(value) => setViewType(value)}
                    style={{ background: "#f0f2f5", padding: "3px", borderRadius: 8 }}
                  />
                </div>

                {/* --- 🗂️ 1. Cards View --- */}
                {viewType === "cards" && (
                  <div>
                    <div style={{ marginBottom: 24, background: "#fafafa", padding: "16px", borderRadius: "12px", border: "1px solid #f0f0f0" }}>
                      <div style={{ fontSize: "13px", fontWeight: 600, color: "#595959", marginBottom: 12 }}>
                        <FilterOutlined style={{ color: "#6174ff", marginRight: 6 }} />
                        เลือกดูเฉพาะสาขาวิชา:
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                        <Button
                          type={!selectedMajor ? "primary" : "default"}
                          shape="round"
                          onClick={() => {
                            setSelectedMajor("");
                            setTableMajorFilter("");
                          }}
                          style={{ fontSize: "13px", height: "34px" }}
                        >
                          ทั้งหมด ({rawData.length})
                        </Button>
                        {majors.map((m) => {
                          const count = rawData.filter(item => cleanString(item["สาขาวิชา"] || item["ชื่อสาขา"] || item["สาขา"]) === cleanString(m)).length;
                          return (
                            <Button
                              key={m}
                              type={selectedMajor === m ? "primary" : "default"}
                              shape="round"
                              onClick={() => {
                                setSelectedMajor(m);
                                setTableMajorFilter("");
                              }}
                              style={{ fontSize: "13px", height: "34px" }}
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
                                  border: "1px solid #f0f0f0",
                                  boxShadow: "0 4px 12px rgba(0,0,0,0.01)"
                                }}
                                bodyStyle={{ padding: "24px 16px" }}
                              >
                                <Avatar 
                                  src={getAvatarUrl(teacher)} 
                                  size={90} 
                                  style={{ 
                                    border: "3px solid #1890ff", 
                                    boxShadow: "0 4px 12px rgba(24, 144, 255, 0.15)",
                                    marginBottom: 16 
                                  }} 
                                />
                                <div style={{ minHeight: 140 }}>
                                  <div style={{ marginBottom: 6, display: "flex", justifyContent: "center", gap: 4, flexWrap: "wrap" }}>
                                    {getPositionTag(pos)}
                                    <Tag color="geekblue">{type}</Tag>
                                  </div>
                                  <h4 style={{ margin: "0 0 6px 0", fontSize: 16, fontWeight: 700, color: "#1f1f1f" }}>{name}</h4>
                                  <div style={{ fontSize: 12, color: "#8c8c8c", marginBottom: 4 }}>{getShortDegree(degree)}</div>
                                  <div style={{ fontSize: 12, fontWeight: 500, color: "#595959" }}>{major}</div>
                                </div>
                                
                                <div style={{ borderTop: "1px solid #f0f0f0", paddingTop: 16, marginTop: 12 }}>
                                  <Button 
                                    type="primary" 
                                    block
                                    icon={<EyeOutlined />}
                                    onClick={() => handleOpenDetail(teacher)}
                                    style={{ borderRadius: 8 }}
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

                {/* --- 📋 2. Table View --- */}
                {viewType === "table" && (
                  <div>
                    {/* แถบตัวกรองเฉพาะของตาราง ย้ายมาไว้อย่างเรียบร้อยตรงนี้ ไม่รบกวนปุ่มสลับมุมมอง */}
                    <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
                      <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#f9fafb", padding: "6px 14px", borderRadius: 10, border: "1px solid #e5e7eb" }}>
                        <FilterOutlined style={{ color: "#1890ff" }} />
                        <span style={{ fontSize: 13, fontWeight: 500, color: "#4b5563" }}>กรองเฉพาะในตาราง:</span>
                        <select 
                          value={tableMajorFilter} 
                          onChange={(e) => setTableMajorFilter(e.target.value)} 
                          style={{ background: "transparent", border: "none", fontSize: 13, fontWeight: 600, color: "#1890ff", cursor: "pointer", outline: "none" }}
                        >
                          <option value="">{selectedMajor ? `ตามตัวกรองหลัก (${selectedMajor})` : "ทุกสาขาวิชา"}</option>
                          {majors.map((m) => <option key={m} value={m}>{m}</option>)}
                        </select>
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
            <Button key="close" type="primary" onClick={() => setIsModalOpen(false)} style={{ borderRadius: 8 }}>
              ปิดหน้าต่าง
            </Button>
          ]}
          width={600}
          centered
          bodyStyle={{ padding: "24px" }}
          style={{ borderRadius: 20, overflow: "hidden" }}
        >
          {activeTeacher && (
            <div style={{ textAlign: "center" }}>
              <div style={{ 
                background: "linear-gradient(135deg, #1890ff 0%, #722ed1 100%)", 
                height: 100, 
                borderRadius: "12px 12px 0 0", 
                margin: "-24px -24px 40px -24px",
                position: "relative"
              }}>
                <Avatar 
                  src={getAvatarUrl(activeTeacher)} 
                  size={100} 
                  style={{ 
                    border: "4px solid white", 
                    boxShadow: "0 6px 16px rgba(0,0,0,0.15)",
                    position: "absolute",
                    bottom: "-50px",
                    left: "calc(50% - 50px)"
                  }} 
                />
              </div>

              <h3 style={{ margin: "16px 0 4px 0", fontSize: 22, fontWeight: 700, color: "#1f1f1f" }}>
                {activeTeacher["ชื่อ นามสกุล"] || activeTeacher["ชื่อ-นามสกุล"] || activeTeacher["ชื่ออาจารย์"] || activeTeacher["ชื่อ"] || "-"}
              </h3>
              <div style={{ marginBottom: 16, display: "flex", justifyContent: "center", gap: 6 }}>
                {getPositionTag(activeTeacher["ตำแหน่งทางวิชาการ"] || activeTeacher["ตำแหน่งวิชาการ"] || activeTeacher["ตำแหน่ง"])}
                <Tag color="geekblue">{getTeacherType(activeTeacher)}</Tag>
              </div>

              <div style={{ textAlign: "left", background: "#f8fafc", padding: 20, borderRadius: 12, border: "1px solid #f0f0f0", marginTop: 20 }}>
                <Row gutter={[16, 12]}>
                  <Col span={24}>
                    <div style={{ fontSize: 11, color: "#8c8c8c", textTransform: "uppercase", fontWeight: 600 }}>สาขาวิชาที่สังกัด</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#262626" }}>
                      {activeTeacher["สาขาวิชา"] || activeTeacher["สาขา"] || activeTeacher["ชื่อสาขา"] || "-"}
                    </div>
                  </Col>
                  
                  <Col span={24} style={{ borderTop: "1px dashed #e8e8e8", paddingTop: 10 }}>
                    <div style={{ fontSize: 11, color: "#8c8c8c", textTransform: "uppercase", fontWeight: 600 }}>คุณวุฒิ / ประวัติการศึกษา</div>
                    <div style={{ fontSize: 14, fontWeight: 500, color: "#262626", marginTop: 4, lineHeight: "1.6" }}>
                      {activeTeacher["คุณวุฒิ"] || activeTeacher["วุฒิการศึกษา"] || activeTeacher["การศึกษา"] || "-"}
                    </div>
                  </Col>

                  <Col span={24} style={{ borderTop: "1px dashed #e8e8e8", paddingTop: 10 }}>
                    <div style={{ fontSize: 11, color: "#8c8c8c", textTransform: "uppercase", fontWeight: 600 }}>ผลงานทางวิชาการ / ผลงานตีพิมพ์</div>
                    <div style={{ marginTop: 8 }}>
                      {(() => {
                        const workLink = activeTeacher["ลิงก์ผลงาน"] || activeTeacher["ผลงาน"] || activeTeacher["ผลงานวิชาการ"] || activeTeacher["portfolio"] || activeTeacher["link"] || activeTeacher["url"];
                        
                        if (!workLink) {
                          return <span style={{ fontSize: 13, color: "#bfbfbf" }}>ยังไม่มีข้อมูลผลงานทางวิชาการ</span>;
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
                              color: "#1890ff", 
                              fontWeight: 600, 
                              fontSize: 13,
                              background: "#e6f7ff",
                              padding: "6px 12px",
                              borderRadius: 8,
                              border: "1px solid #91d5ff"
                            }}
                          >
                            <BookOutlined /> ดูลิงก์ผลงานทางวิชาการ ↗
                          </a>
                        ) : (
                          <div style={{ fontSize: 13, color: "#434343", lineHeight: "1.6", whiteSpace: "pre-line" }}>
                            {workLink}
                          </div>
                        );
                      })()}
                    </div>
                  </Col>

                  <Col span={24} style={{ borderTop: "1px dashed #e8e8e8", paddingTop: 10 }}>
                    <div style={{ fontSize: 11, color: "#8c8c8c", textTransform: "uppercase", fontWeight: 600 }}>ช่องทางการติดต่อ</div>
                    <Row gutter={[8, 8]} style={{ marginTop: 8 }}>
                      <Col span={12} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#595959" }}>
                        <MailOutlined style={{ color: "#1890ff" }} />
                        <span>{activeTeacher["อีเมล"] || activeTeacher["email"] || "ยังไม่ได้ระบุอีเมล"}</span>
                      </Col>
                      <Col span={12} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#595959" }}>
                        <PhoneOutlined style={{ color: "#52c41a" }} />
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
