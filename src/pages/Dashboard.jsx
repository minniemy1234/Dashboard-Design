import { Layout, Button, Empty, Progress, Card, Row, Col, Select, Tag } from "antd"; 
import Sidebar from "../components/Sidebar";
import { useMemo, useState, useEffect, useCallback } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

import {
  TeamOutlined,
  UserOutlined,
  TrophyOutlined,
  SearchOutlined,
  UserAddOutlined,
  ReadOutlined,
  CrownOutlined,
  DashboardOutlined,
  FilterOutlined,
  BarChartOutlined,
} from "@ant-design/icons";

import { db } from "../firebase";
import { doc, onSnapshot } from "firebase/firestore";

const { Header, Content } = Layout;

// รายการสาขาวิชาเพิ่มเติม
const EXTRA_MAJORS = [
  "วท.ม.วิทยาศาสตร์และเทคโนโลยีผลิตภัณฑ์ธรรมชาติ",
  "วท.ม.เทคโนโลยีเคมีประยุกต์",
  "วท.ม.ปัญญาประดิษฐ์และเทคโนโลยีดิจิทัล"
];

function Dashboard() {
  // State ของ Main Filter
  const [selectedYears, setSelectedYears] = useState([]);
  const [selectedMajors, setSelectedMajors] = useState([]);

  const [graphEntryYear, setGraphEntryYear] = useState(""); 
  const [graphSurveyYear, setGraphSurveyYear] = useState(""); 

  const [appliedFilters, setAppliedFilters] = useState({
    years: [],
    majors: []
  });

  const [dashboardData, setDashboardData] = useState({});

  // โหลดข้อมูลจาก localStorage
  const loadDashboardData = useCallback(() => {
    const localData = localStorage.getItem("dashboardData");
    if (localData) {
      try {
        const parsed = JSON.parse(localData);
        if (parsed && typeof parsed === "object" && Object.keys(parsed).length > 0) {
          setDashboardData(parsed);
          return;
        }
      } catch (err) {
        console.error("Error parsing local dashboardData:", err);
      }
    }
    setDashboardData({});
  }, []);

  useEffect(() => {
    loadDashboardData();

    const handleStorageChange = () => {
      loadDashboardData();
    };
    window.addEventListener("storage", handleStorageChange);

    let unsubscribe = () => {};
    if (db) {
      const docRef = doc(db, "dashboardData", "main");
      unsubscribe = onSnapshot(
        docRef,
        (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            const localData = localStorage.getItem("dashboardData");
            if (localData && Object.keys(JSON.parse(localData)).length > 0) {
              setDashboardData(prev => ({ ...data, ...prev }));
            }
          }
        },
        (error) => {
          console.error("Firebase Dashboard Listener Error:", error);
        }
      );
    }

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      unsubscribe();
    };
  }, [loadDashboardData]);

  const cleanString = (str) => {
    if (!str) return "";
    return String(str).replace(/\s+/g, '').replace(/['"]+/g, '').trim();
  };

  const cleanMajorName = (majorStr) => {
    if (!majorStr) return "";
    let name = String(majorStr).replace(/\n/g, ' ').trim();
    if (name.startsWith("สาขาวิชา")) name = name.replace("สาขาวิชา", "").trim();
    else if (name.startsWith("สาขา")) name = name.replace("สาขา", "").trim();
    else if (name.startsWith("หลักสูตร")) name = name.replace("หลักสูตร", "").trim();
    return name;
  };

  const extractYear = (yearStr) => {
    if (!yearStr) return "";
    const match = String(yearStr).match(/\d+/);
    if (!match) return "";
    let year = match[0];
    if (year.length === 2) {
      year = "25" + year;
    }
    return year;
  };

  const isMasterOrXMajor = (majorName) => {
    if (!majorName) return false;
    const clean = String(majorName).trim();
    return clean.startsWith("วท.ม.") || clean.startsWith("X") || clean.startsWith("x");
  };

  const retain = useMemo(() => {
    if (!dashboardData || Object.keys(dashboardData).length === 0) return [];
    return dashboardData["student_retain"] || dashboardData["นิสิตคงอยู่"] || dashboardData["ข้อมูลนิสิตคงอยู่"] || dashboardData["จำนวนนิสิตคงอยู่"] || dashboardData["student_retain_data"] || [];
  }, [dashboardData]);

  const entryYears = useMemo(() => {
    const list = retain.map(item => extractYear(item["ปีการศึกษาที่รับเข้า"] || item["ปีการศึกษา"]));
    return [...new Set(list)].filter(Boolean).sort().reverse();
  }, [retain]);

  const surveyYears = useMemo(() => {
    const list = retain.map(item => extractYear(item["ปีที่สำรวจ"]));
    return [...new Set(list)].filter(Boolean).sort().reverse();
  }, [retain]);

  useEffect(() => {
    if (entryYears.length > 0 && !graphEntryYear) {
      setGraphEntryYear(entryYears[0]);
    }
    if (surveyYears.length > 0 && !graphSurveyYear) {
      setGraphSurveyYear(surveyYears[0]);
    }
  }, [entryYears, surveyYears, graphEntryYear, graphSurveyYear]);

  const yearsOptions = useMemo(() => {
    const retainYears = retain.map((item) => extractYear(item["ปีที่สำรวจ"] || item["ปีการศึกษาที่รับเข้า"]));
    return [...new Set(retainYears)].filter(Boolean).sort();
  }, [retain]);

  const majorsOptions = useMemo(() => {
    if (retain.length === 0) return [];
    const rawMajors = retain.map(item => cleanMajorName(item["ชื่อสาขา"] || item["สาขาวิชา"] || item["สาขา"]));
    const combined = [...new Set([...rawMajors, ...EXTRA_MAJORS])].filter(Boolean);

    const bachelorMajors = combined.filter(m => !isMasterOrXMajor(m)).sort();
    const masterMajors = combined.filter(m => isMasterOrXMajor(m)).sort();

    return [...bachelorMajors, ...masterMajors];
  }, [retain]);

  const handleSelectAllYears = (shouldSelectAll) => {
    setSelectedYears(shouldSelectAll ? yearsOptions : []);
  };

  const handleSelectAllMajors = (shouldSelectAll) => {
    setSelectedMajors(shouldSelectAll ? majorsOptions : []);
  };

  const handleApplyFilters = () => {
    setAppliedFilters({ years: selectedYears, majors: selectedMajors });
  };

  // ข้อมูลพื้นฐานสำหรับสร้างกราฟ
  const rawGraphData = useMemo(() => {
    if (retain.length === 0 || !graphEntryYear || !graphSurveyYear) return [];
    const grouped = {};
    retain.forEach(item => {
      const itemEntryYear = extractYear(item["ปีการศึกษาที่รับเข้า"] || item["ปีการศึกษา"]);
      const itemSurveyYear = extractYear(item["ปีที่สำรวจ"]);

      if (itemEntryYear !== graphEntryYear || itemSurveyYear !== graphSurveyYear) return;

      const rawName = cleanMajorName(item["ชื่อสาขา"] || item["สาขาวิชา"] || item["สาขา"]);
      if (!rawName) return;
      const majorKey = cleanString(rawName);
      const term = String(item["ภาคเรียน"] || item["ภาคการศึกษา"] || "").trim();
      const amt = Number(item["จำนวน"] || item["รวม"] || 0);

      if (!grouped[majorKey]) {
        grouped[majorKey] = { name: rawName, earlyTerm: 0, lateTerm: 0 };
      }

      if (term === "ต้น" || term === "ภาคต้น") grouped[majorKey].earlyTerm += amt;
      else if (term === "ปลาย" || term === "ภาคปลาย") grouped[majorKey].lateTerm += amt;
    });

    return Object.values(grouped);
  }, [retain, graphEntryYear, graphSurveyYear]);

  // แยกชุดข้อมูลกราฟ ป.ตรี
  const bachelorGraphData = useMemo(() => {
    return rawGraphData
      .filter(item => !isMasterOrXMajor(item.name))
      .sort((a, b) => b.earlyTerm - a.earlyTerm);
  }, [rawGraphData]);

  // แยกชุดข้อมูลกราฟ ป.โท
  const masterGraphData = useMemo(() => {
    return rawGraphData
      .filter(item => isMasterOrXMajor(item.name))
      .sort((a, b) => b.earlyTerm - a.earlyTerm);
  }, [rawGraphData]);

  const employmentTotals = useMemo(() => {
    if (!dashboardData || Object.keys(dashboardData).length === 0) return { rate: 0, employmentPerRespondentsRate: 0 };

    const targetKey = Object.keys(dashboardData).find(key => 
      key.includes("งานทำ") || key.includes("Employment") || key.includes("employment")
    );
    const empData = targetKey ? dashboardData[targetKey] : [];

    if (!Array.isArray(empData) || empData.length === 0) {
      return { rate: 0, employmentPerRespondentsRate: 0 };
    }

    let totalRespondents = 0;          
    let totalEmployedStaff = 0;        
    let totalSelfEmployed = 0;         
    let totalExcluded = 0;             

    const isAllYearsSelected = appliedFilters.years.length === 0 || appliedFilters.years.length === yearsOptions.length;
    const isAllMajorsSelected = appliedFilters.majors.length === 0 || appliedFilters.majors.length === majorsOptions.length;

    empData.forEach(item => {
      const majorRaw = String(item["ชื่อสาขา"] || item["สาขาวิชา"] || item["สาขา"] || "").replace(/\n/g, ' ').trim();
      const itemYear = extractYear(item["ปีการศึกษา"] || item["ปี"] || item["ปีที่สำรวจ"]);
      const majorClean = cleanMajorName(majorRaw);

      if (majorRaw.includes("ทั้งหมด") || majorRaw.includes("รวม")) return;

      const yearMatch = isAllYearsSelected || appliedFilters.years.includes(itemYear);
      const majorMatch = isAllMajorsSelected || appliedFilters.majors.includes(majorClean);

      if (!yearMatch || !majorMatch) return;

      const getVal = (exactKey) => {
        const foundKey = Object.keys(item).find(k => cleanString(k) === cleanString(exactKey));
        return foundKey ? Number(item[foundKey] || 0) : 0;
      };

      const respondents = getVal("ผู้บันทึกข้อมูลจำนวน") || getVal("ผู้ตอบแบบสำรวจ") || getVal("จำนวนผู้ตอบ") || 0;

      const gov = getVal("ทำงานในหน่วยงานรัฐ จำนวน");
      const state = getVal("ทำงานในหน่วยงานรัฐวิสาหกิจ จำนวน");
      const privateOrg = getVal("ทำงานในหน่วยงานเอกชน จำนวน");
      const inter = getVal("ทำงานในองค์การต่างประเทศ/ระหว่างประเทศ จำนวน");
      const otherOrg = getVal("ทำงานในองค์กรอื่นๆ จำนวน");
      const empStaff = gov + state + privateOrg + inter + otherOrg;

      const selfEmp = getVal("ทำงาน ธุรกิจส่วนตัว/อิสระ จำนวน");

      const hasJobBefore = getVal("มีงานทำเดิม");
      const studyMore = getVal("ศึกษาต่อ");
      const ordain = getVal("บัณฑิตบวช");
      const military = getVal("บัณฑิตเกณฑ์ทหาร");
      const excluded = hasJobBefore + studyMore + ordain + military;

      totalRespondents += respondents;
      totalEmployedStaff += empStaff;
      totalSelfEmployed += selfEmp;
      totalExcluded += excluded;
    });

    const divisorDAX = totalRespondents - totalExcluded;
    const totalEmployedStaffAndSelf = totalEmployedStaff + totalSelfEmployed;
    const daxRate = divisorDAX > 0 ? (totalEmployedStaffAndSelf / divisorDAX) * 100 : 0;

    const normalRate = totalRespondents > 0 ? (totalEmployedStaff / totalRespondents) * 100 : 0;

    return {
      rate: Number(daxRate.toFixed(2)),
      employmentPerRespondentsRate: Number(normalRate.toFixed(2))
    };
  }, [dashboardData, appliedFilters, yearsOptions, majorsOptions]);

  const studentBreakdown = useMemo(() => {
    let admitted = 0;
    let retained = 0;
    let bachelorAdmitted = 0;
    let bachelorRetained = 0;
    let masterAdmitted = 0;
    let masterRetained = 0;
    let lecturers = 0;
    let graduates = 0;

    if (dashboardData && Object.keys(dashboardData).length > 0) {
      const teacher = 
        dashboardData["ข้อมูลอาจารย์"] || 
        dashboardData["อาจารย์สาขา"] || 
        dashboardData["อาจารย์"] || 
        dashboardData["อาจารย์ประจำสาขา"] ||
        [];

      const isAllYearsSelected = appliedFilters.years.length === 0 || appliedFilters.years.length === yearsOptions.length;
      const isAllMajorsSelected = appliedFilters.majors.length === 0 || appliedFilters.majors.length === majorsOptions.length;

      retain.forEach((item) => {
        const retMajorClean = cleanMajorName(item["ชื่อสาขา"] || item["สาขาวิชา"] || item["สาขา"]);
        const retYear = extractYear(item["ปีที่สำรวจ"] || item["ปีการศึกษาที่รับเข้า"]);
        const retTerm = String(item["ภาคเรียน"] || item["ภาคการศึกษา"] || "").trim();
        const amt = Number(item["จำนวน"] || item["รวม"] || 0);
        const code = String(item["รหัสสาขา"] || "").trim().toUpperCase();

        const yearMatch = isAllYearsSelected || appliedFilters.years.includes(retYear);
        const majorMatch = isAllMajorsSelected || appliedFilters.majors.includes(retMajorClean);

        if (majorMatch && yearMatch) {
          const isMaster = code.startsWith("X") || isMasterOrXMajor(retMajorClean);

          if (retTerm === "ต้น" || retTerm === "ภาคต้น") {
            admitted += amt;
            if (isMaster) masterAdmitted += amt;
            else bachelorAdmitted += amt;
          }
          if (retTerm === "ปลาย" || retTerm === "ภาคปลาย") {
            retained += amt;
            if (isMaster) masterRetained += amt;
            else bachelorRetained += amt;
          }
        }
      });

      if (Array.isArray(teacher)) {
        const stripProgramType = (str) => {
          if (!str) return "";
          return str
            .replace(/\(ภาคปกติ\)/g, "")
            .replace(/\(ภาคพิเศษ\)/g, "")
            .replace(/ภาคปกติ/g, "")
            .replace(/ภาคพิเศษ/g, "")
            .trim();
        };

        const selectedBaseMajors = new Set(
          appliedFilters.majors.map(m => stripProgramType(m))
        );

        const validTeachers = teacher.filter(item => {
          const rawTeacherMajor = cleanMajorName(item["ชื่อสาขา"] || item["สาขาวิชา"] || item["สาขา"]);
          const cleanTeacherMajor = stripProgramType(rawTeacherMajor);

          const name = item["ชื่อ นามสกุล"] || item["ชื่อ-นามสกุล"] || item["ชื่ออาจารย์"] || item["ชื่อ"] || "";
          const cleanName = String(name).trim();

          const majorMatch = isAllMajorsSelected || selectedBaseMajors.has(cleanTeacherMajor);
          if (!majorMatch) return false;

          return cleanName !== "" && cleanName !== "-" && !cleanName.includes("รวม") && !cleanName.includes("จำนวน");
        });

        const uniqueTeacherNames = new Set(
          validTeachers.map(item => {
            const name = item["ชื่อ นามสกุล"] || item["ชื่อ-นามสกุล"] || item["ชื่ออาจารย์"] || item["ชื่อ"] || "";
            return String(name).replace(/\s+/g, '').trim();
          })
        );

        lecturers = uniqueTeacherNames.size;
      }
    }

    return {
      admitted,
      retained,
      bachelorAdmitted,
      bachelorRetained,
      masterAdmitted,
      masterRetained,
      lecturers,
      graduates
    };
  }, [dashboardData, retain, appliedFilters, yearsOptions, majorsOptions]);

  const renderMajorTag = (props) => {
    const { label, value, closable, onClose } = props;
    const isMaster = isMasterOrXMajor(value);

    return (
      <Tag
        closable={closable}
        onClose={onClose}
        style={{
          marginRight: 4,
          borderRadius: 4,
          fontWeight: isMaster ? 600 : 400,
          backgroundColor: isMaster ? "#e0f2fe" : "#f1f5f9",
          color: isMaster ? "#0369a1" : "#334155",
          borderColor: isMaster ? "#bae6fd" : "#cbd5e1"
        }}
      >
        {label}
      </Tag>
    );
  };

  const isDataEmpty = !dashboardData || Object.keys(dashboardData).length === 0;

  // Custom Label Renderer สำหรับปลายแถบ Bar
  const renderCustomBarLabel = (props) => {
    const { x, y, width, height, value } = props;
    if (!value) return null;
    return (
      <text
        x={x + width + 8}
        y={y + height / 2 + 4}
        fill="#334155"
        fontSize={12}
        fontWeight="bold"
        textAnchor="start"
      >
        {value}
      </text>
    );
  };

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sidebar />
      <Layout style={{ background: "#f8fafc" }}>

        {/* HEADER */}
        <Header style={{ background: "white", padding: "16px 24px", height: "auto", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #e2e8f0" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <h2 style={{ margin: 0, fontSize: "20px", fontWeight: "700", color: "#0f172a", lineHeight: "1.2" }}>
              Dashboard Faculty of Science at Sriracha
            </h2>
            <div style={{ color: "#64748b", fontSize: "13px", lineHeight: "1.4", margin: 0 }}>
              ระบบวิเคราะห์สถิตินิสิตประจำปี เปรียบเทียบข้อมูลภาคเรียนแบบเรียลไทม์
            </div>
          </div>
        </Header>

        <Content style={{ padding: "24px 32px" }}>

          {/* FILTER ZONE MAIN */}
          <div style={{ background: "#fff", padding: 20, borderRadius: 16, marginBottom: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.05)", border: "1px solid #f1f5f9" }}>
            <Row gutter={[16, 16]} align="bottom">

              {/* ปีการศึกษา Filter */}
              <Col xs={24} md={10}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <span style={{ fontWeight: 600, color: "#334155", fontSize: 13 }}>
                    <FilterOutlined style={{ marginRight: 4 }} /> ปีการศึกษา
                  </span>
                  <Button 
                    type="link" 
                    size="small" 
                    onClick={() => handleSelectAllYears(selectedYears.length !== yearsOptions.length)}
                    style={{ padding: 0, height: "auto", fontSize: 12, color: "#0284c7" }}
                  >
                    {yearsOptions.length > 0 && selectedYears.length === yearsOptions.length ? "ยกเลิกทั้งหมด" : "เลือกทั้งหมด"}
                  </Button>
                </div>
                <Select
                  mode="multiple"
                  allowClear
                  style={{ width: "100%" }}
                  placeholder="เลือกทั้งหมด (แสดงทุกปี)"
                  value={selectedYears}
                  onChange={(val) => setSelectedYears(val)}
                  maxTagCount="responsive"
                  size="large"
                >
                  {yearsOptions.map((year) => (
                    <Select.Option key={year} value={year}>ปี {year}</Select.Option>
                  ))}
                </Select>
              </Col>

              {/* สาขาวิชา Filter */}
              <Col xs={24} md={10}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <span style={{ fontWeight: 600, color: "#334155", fontSize: 13 }}>
                    <FilterOutlined style={{ marginRight: 4 }} /> สาขาวิชา
                  </span>
                  <Button 
                    type="link" 
                    size="small" 
                    onClick={() => handleSelectAllMajors(selectedMajors.length !== majorsOptions.length)}
                    style={{ padding: 0, height: "auto", fontSize: 12, color: "#0284c7" }}
                  >
                    {majorsOptions.length > 0 && selectedMajors.length === majorsOptions.length ? "ยกเลิกทั้งหมด" : "เลือกทั้งหมด"}
                  </Button>
                </div>
                <Select
                  mode="multiple"
                  allowClear
                  style={{ width: "100%" }}
                  placeholder="เลือกทั้งหมด (แสดงทุกสาขา)"
                  value={selectedMajors}
                  onChange={(val) => setSelectedMajors(val)}
                  maxTagCount="responsive"
                  size="large"
                  tagRender={renderMajorTag}
                >
                  {majorsOptions.map((major) => {
                    const isMaster = isMasterOrXMajor(major);
                    return (
                      <Select.Option key={major} value={major}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
                          <span style={{ color: isMaster ? "#0284c7" : "#334155", fontWeight: isMaster ? 600 : 400 }}>
                            {major}
                          </span>
                          {isMaster && (
                            <span style={{ fontSize: 10, backgroundColor: "#e0f2fe", color: "#0369a1", padding: "1px 6px", borderRadius: 4, marginLeft: 8, border: "1px solid #bae6fd" }}>
                              ป.โท
                            </span>
                          )}
                        </div>
                      </Select.Option>
                    );
                  })}
                </Select>
              </Col>

              {/* ปุ่มประมวลผล */}
              <Col xs={24} md={4} style={{ textAlign: "right" }}>
                <Button type="primary" size="large" icon={<SearchOutlined />} onClick={handleApplyFilters} style={{ width: "100%", height: 40, borderRadius: 8, background: "#0284c7", borderColor: "#0284c7" }}>
                  ประมวลผล
                </Button>
              </Col>

            </Row>
          </div>

          {isDataEmpty ? (
            <Card style={{ borderRadius: 16, textAlign: "center", padding: "40px 0" }}>
              <Empty description="ยังไม่มีข้อมูลในระบบ หรือถูกลบออกแล้ว" />
            </Card>
          ) : (
            <>
              {/* 🏆 PROMINENT TOP KPI CARDS ZONE */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: "#0f172a", display: "flex", alignItems: "center", gap: 8 }}>
                    <DashboardOutlined style={{ color: "#0284c7" }} /> สถิติตัวชี้วัดสำคัญ (Key Performance Indicators)
                  </h3>
                </div>

                <Row gutter={[16, 16]}>
                  {/* KPI 1: นิสิตรับเข้า */}
                  <Col xs={24} sm={12} md={6}>
                    <div style={{ background: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)", padding: "20px", borderRadius: 16, color: "#ffffff", boxShadow: "0 4px 14px rgba(2, 132, 199, 0.25)", position: "relative", minHeight: 130 }}>
                      <div style={{ color: "#bae6fd", fontSize: 11, fontWeight: 600 }}>ภาคต้น</div>
                      <h4 style={{ margin: "4px 0", fontSize: 14, color: "#f0f9ff", fontWeight: 500 }}>นิสิตรับเข้าศึกษา</h4>
                      <h2 style={{ margin: 0, fontSize: 28, fontWeight: "800", color: "#ffffff" }}>
                        {studentBreakdown.admitted.toLocaleString()} <span style={{ fontSize: 13, fontWeight: "400", color: "#e0f2fe" }}>คน</span>
                      </h2>
                      <UserAddOutlined style={{ fontSize: 36, color: "#ffffff", position: "absolute", right: 20, bottom: 20, opacity: 0.25 }} />
                    </div>
                  </Col>

                  {/* KPI 2: นิสิตคงอยู่ */}
                  <Col xs={24} sm={12} md={6}>
                    <div style={{ background: "linear-gradient(135deg, #059669 0%, #047857 100%)", padding: "20px", borderRadius: 16, color: "#ffffff", boxShadow: "0 4px 14px rgba(5, 150, 105, 0.25)", position: "relative", minHeight: 130 }}>
                      <div style={{ color: "#a7f3d0", fontSize: 11, fontWeight: 600 }}>ภาคปลาย </div>
                      <h4 style={{ margin: "4px 0", fontSize: 14, color: "#ecfdf5", fontWeight: 500 }}>นิสิตคงอยู่</h4>
                      <h2 style={{ margin: 0, fontSize: 28, fontWeight: "800", color: "#ffffff" }}>
                        {studentBreakdown.retained.toLocaleString()} <span style={{ fontSize: 13, fontWeight: "400", color: "#d1fae5" }}>คน</span>
                      </h2>
                      <TeamOutlined style={{ fontSize: 36, color: "#ffffff", position: "absolute", right: 20, bottom: 20, opacity: 0.25 }} />
                    </div>
                  </Col>

                  {/* KPI 3: อาจารย์ประจำสาขา */}
                  <Col xs={24} sm={12} md={6}>
                    <div style={{ background: "linear-gradient(135deg, #c28d07 0%, #c28d07 100%)", padding: "20px", borderRadius: 16, color: "#ffffff", boxShadow: "0 4px 14px rgba(217, 119, 6, 0.25)", position: "relative", minHeight: 130 }}>
                      <div style={{ color: "#fef3c7", fontSize: 11, fontWeight: 600 }}>บุคลากรสายผู้สอน</div>
                      <h4 style={{ margin: "4px 0", fontSize: 14, color: "#fffbeb", fontWeight: 500 }}>อาจารย์ประจำสาขา</h4>
                      <h2 style={{ margin: 0, fontSize: 28, fontWeight: "800", color: "#ffffff" }}>
                        {studentBreakdown.lecturers.toLocaleString()} <span style={{ fontSize: 13, fontWeight: "400", color: "#fef3c7" }}>ท่าน</span>
                      </h2>
                      <UserOutlined style={{ fontSize: 36, color: "#ffffff", position: "absolute", right: 20, bottom: 20, opacity: 0.25 }} />
                    </div>
                  </Col>

                  {/* KPI 4: ผู้สำเร็จการศึกษา */}
                  <Col xs={24} sm={12} md={6}>
                    <div style={{ background: "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)", padding: "20px", borderRadius: 16, color: "#ffffff", boxShadow: "0 4px 14px rgba(124, 58, 237, 0.25)", position: "relative", minHeight: 130 }}>
                      <div style={{ color: "#ddd6fe", fontSize: 11, fontWeight: 600 }}>ภาวะการมีงานทำประจำปี</div>
                      <h4 style={{ margin: "4px 0", fontSize: 14, color: "#f5f3ff", fontWeight: 500 }}>ผู้สำเร็จการศึกษา</h4>
                      <h2 style={{ margin: 0, fontSize: 28, fontWeight: "800", color: "#ffffff" }}>
                        0 <span style={{ fontSize: 13, fontWeight: "400", color: "#ddd6fe" }}>คน</span>
                      </h2>
                      <TrophyOutlined style={{ fontSize: 36, color: "#ffffff", position: "absolute", right: 20, bottom: 20, opacity: 0.25 }} />
                    </div>
                  </Col>
                </Row>
              </div>

              {/* 🎓 จำแนกระดับการศึกษา */}
              <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col xs={24} md={12}>
                  <div style={{ background: "#ffffff", padding: 20, borderRadius: 16, border: "1px solid #e2e8f0", boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <ReadOutlined style={{ fontSize: 22, color: "#0284c7" }} />
                        <div>
                          <h4 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#0369a1" }}>นิสิตระดับปริญญาตรี</h4>
                          <span style={{ fontSize: 11, color: "#64748b" }}>รหัสสาขาปกติ</span>
                        </div>
                      </div>
                    </div>

                    <Row gutter={12}>
                      <Col span={12}>
                        <div style={{ background: "#f0f9ff", padding: 12, borderRadius: 12, border: "1px solid #bae6fd" }}>
                          <div style={{ fontSize: 11, color: "#0369a1" }}>ภาคต้น </div>
                          <div style={{ fontSize: 20, fontWeight: "bold", color: "#0284c7" }}>
                            {studentBreakdown.bachelorAdmitted.toLocaleString()} <span style={{ fontSize: 12, fontWeight: "normal" }}>คน</span>
                          </div>
                        </div>
                      </Col>
                      <Col span={12}>
                        <div style={{ background: "#f0fdf4", padding: 12, borderRadius: 12, border: "1px solid #bbf7d0" }}>
                          <div style={{ fontSize: 11, color: "#15803d" }}>ภาคปลาย </div>
                          <div style={{ fontSize: 20, fontWeight: "bold", color: "#16a34a" }}>
                            {studentBreakdown.bachelorRetained.toLocaleString()} <span style={{ fontSize: 12, fontWeight: "normal" }}>คน</span>
                          </div>
                        </div>
                      </Col>
                    </Row>
                  </div>
                </Col>

                <Col xs={24} md={12}>
                  <div style={{ background: "#ffffff", padding: 20, borderRadius: 16, border: "1px solid #e2e8f0", boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <CrownOutlined style={{ fontSize: 22, color: "#0284c7" }} />
                        <div>
                          <h4 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#0369a1" }}>นิสิตระดับปริญญาโท</h4>
                          <span style={{ fontSize: 11, color: "#64748b" }}>รหัสสาขาขึ้นต้นด้วย X หรือ ชื่อขึ้นต้นด้วย วท.ม.</span>
                        </div>
                      </div>
                    </div>

                    <Row gutter={12}>
                      <Col span={12}>
                        <div style={{ background: "#f0f9ff", padding: 12, borderRadius: 12, border: "1px solid #bae6fd" }}>
                          <div style={{ fontSize: 11, color: "#0369a1" }}>ภาคต้น</div>
                          <div style={{ fontSize: 20, fontWeight: "bold", color: "#0284c7" }}>
                            {studentBreakdown.masterAdmitted.toLocaleString()} <span style={{ fontSize: 12, fontWeight: "normal" }}>คน</span>
                          </div>
                        </div>
                      </Col>
                      <Col span={12}>
                        <div style={{ background: "#e0f2fe", padding: 12, borderRadius: 12, border: "1px solid #7dd3fc" }}>
                          <div style={{ fontSize: 11, color: "#0284c7" }}>ภาคปลาย </div>
                          <div style={{ fontSize: 20, fontWeight: "bold", color: "#0369a1" }}>
                            {studentBreakdown.masterRetained.toLocaleString()} <span style={{ fontSize: 12, fontWeight: "normal" }}>คน</span>
                          </div>
                        </div>
                      </Col>
                    </Row>
                  </div>
                </Col>
              </Row>

              {/* 📊 PROGRESS CIRCLES ZONE */}
              <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col xs={24} md={12}>
                  <Card bordered={false} style={{ borderRadius: 16, textAlign: "center", border: "1px solid #e2e8f0", boxShadow: "0 2px 8px rgba(0,0,0,0.02)", background: "#ffffff", height: "100%" }}>
                    <h4 style={{ color: "#0284c7", fontSize: 15, fontWeight: 700, margin: "0 0 4px 0" }}>อัตราการมีงานทำรวม (DAX)</h4>
                    <div style={{ color: "#64748b", fontSize: 12, marginBottom: 16 }}>รวมงานอิสระ / หักลบกลุ่มเรียนต่อ/เกณฑ์ทหาร/อุปสมบท</div>
                    <Progress 
                      type="circle" 
                      percent={employmentTotals.rate} 
                      strokeColor="#0284c7"
                      size={120}
                      strokeWidth={9}
                    />
                    <div style={{ marginTop: 16, color: "#475569", fontSize: 12, fontWeight: 500, lineHeight: "1.5" }}>
                      วิธีคำนวณ: บัณฑิตที่ได้งานทำ + ประกอบอาชีพอิสระ ÷ ผู้ตอบแบบสำรวจ (ไม่รวมผู้มีงานทำเดิม ศึกษาต่อ อุปสมบท เกณฑ์ทหาร)
                    </div>
                  </Card>
                </Col>

                <Col xs={24} md={12}>
                  <Card bordered={false} style={{ borderRadius: 16, textAlign: "center", border: "1px solid #e2e8f0", boxShadow: "0 2px 8px rgba(0,0,0,0.02)", background: "#ffffff", height: "100%" }}>
                    <h4 style={{ color: "#059669", fontSize: 15, fontWeight: 700, margin: "0 0 4px 0" }}>บัณฑิตระดับปริญญาตรีที่ได้งานทำ</h4>
                    <div style={{ color: "#64748b", fontSize: 12, marginBottom: 16 }}>ภายใน 1 ปีหลังสำเร็จการศึกษา</div>
                    <Progress 
                      type="circle" 
                      percent={employmentTotals.employmentPerRespondentsRate} 
                      strokeColor="#059669"
                      size={120}
                      strokeWidth={9}
                    />
                    <div style={{ marginTop: 16, color: "#475569", fontSize: 12, fontWeight: 500, lineHeight: "1.5" }}>
                      วิธีคำนวณ: จำนวนผู้ตอบแบบสำรวจที่มีงานทำ ÷ ผู้ตอบแบบสำรวจทั้งหมด
                    </div>
                  </Card>
                </Col>
              </Row>

              {/* 🎓 GLOBAL GRAPH CONTROLLER */}
              <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 16, marginBottom: 16, background: "#fff", padding: "12px 20px", borderRadius: 12, border: "1px solid #e2e8f0" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 13, color: "#475569", fontWeight: 600 }}>ปีการศึกษาที่รับเข้า:</span>
                  <Select
                    value={graphEntryYear}
                    onChange={(val) => setGraphEntryYear(val)}
                    style={{ width: 110 }}
                    size="middle"
                  >
                    {entryYears.map((yr) => (
                      <Select.Option key={yr} value={yr}>
                        ปี {yr}
                      </Select.Option>
                    ))}
                  </Select>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 13, color: "#475569", fontWeight: 600 }}>ปีที่สำรวจ:</span>
                  <Select
                    value={graphSurveyYear}
                    onChange={(val) => setGraphSurveyYear(val)}
                    style={{ width: 110 }}
                    size="middle"
                  >
                    {surveyYears.map((yr) => (
                      <Select.Option key={yr} value={yr}>
                        ปี {yr}
                      </Select.Option>
                    ))}
                  </Select>
                </div>
              </div>

              {/* 📊 กราฟที่ 1: ปริญญาตรี */}
              <Card
                bordered={false}
                style={{
                  borderRadius: 16,
                  border: "1px solid #e2e8f0",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
                  background: "#ffffff",
                  marginBottom: 24,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
                  <BarChartOutlined style={{ color: "#0284c7", fontSize: 20 }} />
                  <div>
                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#0f172a" }}>
                      กราฟเปรียบเทียบจำนวนนิสิต ระดับปริญญาตรี
                    </h3>
                    <div style={{ fontSize: 12, color: "#64748b" }}>จำแนกตามสาขาวิชา (ปีการศึกษา {graphEntryYear} / ปีที่สำรวจ {graphSurveyYear})</div>
                  </div>
                </div>

                {bachelorGraphData.length === 0 ? (
                  <div style={{ padding: "30px 0", textAlign: "center" }}>
                    <Empty description="ไม่พบข้อมูลสถิตินิสิตปริญญาตรีตามช่วงปีที่เลือก" />
                  </div>
                ) : (
                  <div style={{ width: "100%", height: Math.max(350, bachelorGraphData.length * 55) }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        layout="vertical"
                        data={bachelorGraphData}
                        margin={{ top: 20, right: 50, left: 180, bottom: 20 }}
                        barCategoryGap="25%"
                        barGap={3}
                      >
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                        
                        <XAxis 
                          type="number" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fill: "#64748b", fontSize: 12 }} 
                        />
                        
                        <YAxis
                          type="category"
                          dataKey="name"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: "#1e293b", fontSize: 13, fontWeight: 500 }}
                          width={170}
                        />
                        
                        <Tooltip
                          contentStyle={{ backgroundColor: "#ffffff", borderRadius: 8, border: "1px solid #e2e8f0", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                          formatter={(val) => [`${val} คน`]}
                        />

                        {/* บังคับระบุ payload ล็อคให้รับเข้าขึ้นก่อนแน่นอน */}
                        <Legend
                          verticalAlign="top"
                          align="center"
                          wrapperStyle={{ paddingBottom: 20 }}
                          payload={[
                            { value: 'นิสิตรับเข้า (ภาคต้น)', type: 'square', color: '#52b2bf' },
                            { value: 'นิสิตคงอยู่ (ภาคปลาย)', type: 'square', color: '#4c84b4' }
                          ]}
                          formatter={(value) => <span style={{ color: "#334155", fontWeight: 500, fontSize: 13 }}>{value}</span>}
                        />

                        {/* 1. นิสิตรับเข้า (ภาคต้น) */}
                        <Bar
                          dataKey="earlyTerm"
                          name="นิสิตรับเข้า (ภาคต้น)"
                          fill="#52b2bf"
                          radius={[0, 4, 4, 0]}
                          barSize={12}
                          label={renderCustomBarLabel}
                        />

                        {/* 2. นิสิตคงอยู่ (ภาคปลาย) */}
                        <Bar
                          dataKey="lateTerm"
                          name="นิสิตคงอยู่ (ภาคปลาย)"
                          fill="#4c84b4"
                          radius={[0, 4, 4, 0]}
                          barSize={12}
                          label={renderCustomBarLabel}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </Card>

              {/* 👑 กราฟที่ 2: ปริญญาโท */}
              <Card
                bordered={false}
                style={{
                  borderRadius: 16,
                  border: "1px solid #e2e8f0",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
                  background: "#ffffff",
                  marginBottom: 24,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
                  <CrownOutlined style={{ color: "#0369a1", fontSize: 20 }} />
                  <div>
                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#0f172a" }}>
                      กราฟเปรียบเทียบจำนวนนิสิต ระดับปริญญาโท (บัณฑิตศึกษา)
                    </h3>
                    <div style={{ fontSize: 12, color: "#64748b" }}>จำแนกตามสาขาวิชา (ปีการศึกษา {graphEntryYear} / ปีที่สำรวจ {graphSurveyYear})</div>
                  </div>
                </div>

                {masterGraphData.length === 0 ? (
                  <div style={{ padding: "30px 0", textAlign: "center" }}>
                    <Empty description="ไม่พบข้อมูลสถิตินิสิตปริญญาโทตามช่วงปีที่เลือก" />
                  </div>
                ) : (
                  <div style={{ width: "100%", height: Math.max(250, masterGraphData.length * 60) }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        layout="vertical"
                        data={masterGraphData}
                        margin={{ top: 20, right: 50, left: 240, bottom: 20 }}
                        barCategoryGap="25%"
                        barGap={3}
                      >
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                        
                        <XAxis 
                          type="number" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fill: "#64748b", fontSize: 12 }} 
                        />
                        
                        <YAxis
                          type="category"
                          dataKey="name"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: "#0369a1", fontSize: 13, fontWeight: 600 }}
                          width={230}
                        />
                        
                        <Tooltip
                          contentStyle={{ backgroundColor: "#ffffff", borderRadius: 8, border: "1px solid #e2e8f0", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                          formatter={(val) => [`${val} คน`]}
                        />

                        {/* บังคับระบุ payload ล็อคให้รับเข้าขึ้นก่อนแน่นอน */}
                        <Legend
                          verticalAlign="top"
                          align="center"
                          wrapperStyle={{ paddingBottom: 20 }}
                          payload={[
                            { value: 'นิสิตรับเข้า (ภาคต้น)', type: 'square', color: '#38bdf8' },
                            { value: 'นิสิตคงอยู่ (ภาคปลาย)', type: 'square', color: '#0284c7' }
                          ]}
                          formatter={(value) => <span style={{ color: "#334155", fontWeight: 500, fontSize: 13 }}>{value}</span>}
                        />

                        {/* 1. นิสิตรับเข้า (ภาคต้น) */}
                        <Bar
                          dataKey="earlyTerm"
                          name="นิสิตรับเข้า (ภาคต้น)"
                          fill="#38bdf8"
                          radius={[0, 4, 4, 0]}
                          barSize={14}
                          label={renderCustomBarLabel}
                        />

                        {/* 2. นิสิตคงอยู่ (ภาคปลาย) */}
                        <Bar
                          dataKey="lateTerm"
                          name="นิสิตคงอยู่ (ภาคปลาย)"
                          fill="#0284c7"
                          radius={[0, 4, 4, 0]}
                          barSize={14}
                          label={renderCustomBarLabel}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </Card>
            </>
          )}

        </Content>
      </Layout>
    </Layout>
  );
}

export default Dashboard;
