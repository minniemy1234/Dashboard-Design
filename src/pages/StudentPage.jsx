import { Layout, Table, Card, Row, Col, Empty, Alert, Statistic, Select, Button, Space } from "antd";
import Sidebar from "../components/Sidebar";
import { useMemo, useState, useEffect } from "react";
import { 
  TeamOutlined, 
  UserAddOutlined, 
  TrophyOutlined, 
  FilterOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined,
  DashboardOutlined,
  ReadOutlined,
  CrownOutlined,
  PercentageOutlined
} from "@ant-design/icons";

import { 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  ResponsiveContainer, 
  Sector,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend
} from "recharts";

const { Header, Content } = Layout;

// 🔹 รายการสาขาวิชาเพิ่มเติม
const EXTRA_MAJORS = [
  "วท.ม.วิทยาศาสตร์และเทคโนโลยีผลิตภัณฑ์ธรรมชาติ",
  "วท.ม.เทคโนโลยีเคมีประยุกต์"
];

// ❌ รายการสาขาวิชาที่ต้องการตัดออกจากฟิลเตอร์และกราฟ
const EXCLUDED_MAJORS = [
  "เทคโนโลยีสารสนเทศ",
  "เทคโนโลยีสารสนเทศภาคพิเศษ",
  "เคมี"
];

const renderActiveShape = (props) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius - 2}
        outerRadius={outerRadius + 6}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        style={{ filter: "drop-shadow(0px 4px 8px rgba(0,0,0,0.15))", cursor: "pointer" }}
      />
    </g>
  );
};

const renderBarValueLabel = (props) => {
  const { x, y, width, height, value } = props;
  if (value === undefined || value === null || value === 0) return null;
  return (
    <text
      x={(x || 0) + (width || 0) + 6}
      y={(y || 0) + (height || 0) / 2 + 4}
      fill="#334155"
      fontSize={12}
      fontWeight="600"
      textAnchor="start"
    >
      {value.toLocaleString()}
    </text>
  );
};

function StudentPage() {
  const [selectedMajors, setSelectedMajors] = useState([]);
  const [selectedYears, setSelectedYears] = useState([]);
  const [tableSelectedYear, setTableSelectedYear] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [activeIndex, setActiveIndex] = useState(null);

  const [graphEntryYear, setGraphEntryYear] = useState(null);
  const [graphSurveyYear, setGraphSurveyYear] = useState(null);
  const [graphSelectedMajors, setGraphSelectedMajors] = useState([]);

  useEffect(() => {
    const stored = localStorage.getItem("dashboardData");
    if (stored) {
      try {
        setDashboardData(JSON.parse(stored));
      } catch (err) {
        console.error("Error parsing dashboardData:", err);
      }
    }
  }, []);

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

    name = name.replace(/\(ภาคปกติ\)/g, "").replace(/ภาคปกติ/g, "").trim();

    if (name.includes("วิทยาการคอมพิวเตอร์")) {
      name = "วิทยาการคอมพิวเตอร์";
    }

    if (name.includes("วิทยาการและเทคโนโลยีดิจิทัล")) {
      name = "วิทยาการและเทคโนโลยีดิจิทัล";
    }

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

  const retainData = useMemo(() => {
    if (!dashboardData) return [];
    return dashboardData["นิสิตคงอยู่"] || dashboardData["ข้อมูลนิสิตคงอยู่"] || dashboardData["จำนวนนิสิตคงอยู่"] || dashboardData["student_retain"] || [];
  }, [dashboardData]);

  const majorsList = useMemo(() => {
    if (retainData.length === 0) return [];
    const rawMajors = retainData.map(item => cleanMajorName(item["ชื่อสาขา"] || item["สาขาวิชา"] || item["สาขา"]));
    const combined = [...new Set([...rawMajors, ...EXTRA_MAJORS])].filter(Boolean);

    const filteredCombined = combined.filter(m => !EXCLUDED_MAJORS.includes(m));

    const bachelorMajors = filteredCombined.filter(m => !isMasterOrXMajor(m)).sort();
    const masterMajors = filteredCombined.filter(m => isMasterOrXMajor(m)).sort();

    return [...bachelorMajors, ...masterMajors];
  }, [retainData]);

  const yearsList = useMemo(() => {
    const list = retainData.map(item => extractYear(item["ปีที่สำรวจ"] || item["ปีการศึกษาที่รับเข้า"] || item["ปีการศึกษา"]));
    return [...new Set(list)].filter(Boolean).sort();
  }, [retainData]);

  const entryYears = useMemo(() => {
    const list = retainData.map(item => extractYear(item["ปีการศึกษาที่รับเข้า"] || item["ปีการศึกษา"]));
    return [...new Set(list)].filter(Boolean).sort().reverse();
  }, [retainData]);

  const surveyYears = useMemo(() => {
    const list = retainData.map(item => extractYear(item["ปีที่สำรวจ"] || item["ปีการศึกษา"]));
    return [...new Set(list)].filter(Boolean).sort().reverse();
  }, [retainData]);

  useEffect(() => {
    if (entryYears.length > 0 && !graphEntryYear) {
      setGraphEntryYear(entryYears[0]);
    }
    if (surveyYears.length > 0 && !graphSurveyYear) {
      setGraphSurveyYear(surveyYears[0]);
    }
  }, [entryYears, surveyYears, graphEntryYear, graphSurveyYear]);

  const handleSelectAllMajors = (shouldSelectAll) => {
    setSelectedMajors(shouldSelectAll ? majorsList : []);
  };

  const handleSelectAllYears = (shouldSelectAll) => {
    setSelectedYears(shouldSelectAll ? yearsList : []);
  };

  const filteredRetainTable = useMemo(() => {
    return retainData.filter(item => {
      const itemMajor = cleanMajorName(item["ชื่อสาขา"] || item["สาขาวิชา"] || item["สาขา"]);
      if (EXCLUDED_MAJORS.includes(itemMajor)) return false;

      const itemYear = extractYear(item["ปีที่สำรวจ"] || item["ปีการศึกษาที่รับเข้า"] || item["ปีการศึกษา"]);
      const itemTerm = String(item["ภาคเรียน"] || item["ภาคการศึกษา"] || "").trim();
      
      const majorMatch = selectedMajors.length === 0 || selectedMajors.includes(itemMajor);
      const yearMatch = selectedYears.length === 0 || selectedYears.includes(itemYear);
      const termMatch = itemTerm === "ปลาย" || itemTerm === "ภาคปลาย"; 
      const tableYearMatch = !tableSelectedYear || itemYear === tableSelectedYear;

      return majorMatch && yearMatch && termMatch && tableYearMatch;
    });
  }, [retainData, selectedMajors, selectedYears, tableSelectedYear]);

  // 🔹 คำนวณ KPI สถิติสำคัญ
  const studentStats = useMemo(() => {
    let totalAdmitted = 0;
    let totalRetained = 0;

    let bachelorAdmitted = 0;
    let bachelorRetained = 0;

    let masterAdmitted = 0;
    let masterRetained = 0;

    const cleanedSelectedMajors = selectedMajors.map(m => cleanString(m));

    retainData.forEach(item => {
      const itemMajor = cleanMajorName(item["ชื่อสาขา"] || item["สาขาวิชา"] || item["สาขา"]);
      if (EXCLUDED_MAJORS.includes(itemMajor)) return;

      const itemYear = extractYear(item["ปีที่สำรวจ"] || item["ปีการศึกษาที่รับเข้า"] || item["ปีการศึกษา"]);
      const itemTerm = String(item["ภาคเรียน"] || item["ภาคการศึกษา"] || "").trim();
      const amt = Number(item["จำนวน"] || item["รวม"] || 0);
      const code = String(item["รหัสสาขา"] || "").trim().toUpperCase();

      const majorMatch = selectedMajors.length === 0 || cleanedSelectedMajors.includes(cleanString(itemMajor));
      const yearMatch = selectedYears.length === 0 || selectedYears.includes(itemYear);

      if (majorMatch && yearMatch) {
        const isMaster = code.startsWith("X") || isMasterOrXMajor(itemMajor);

        if (itemTerm === "ต้น" || itemTerm === "ภาคต้น") {
          totalAdmitted += amt;
          if (isMaster) masterAdmitted += amt;
          else bachelorAdmitted += amt;
        }
        if (itemTerm === "ปลาย" || itemTerm === "ภาคปลาย") {
          totalRetained += amt;
          if (isMaster) masterRetained += amt;
          else bachelorRetained += amt;
        }
      }
    });

    const totalLost = totalAdmitted > totalRetained ? totalAdmitted - totalRetained : 0;
    const dropRate = totalAdmitted > 0 ? ((totalLost / totalAdmitted) * 100).toFixed(2) : "0.00";
    const retentionRate = totalAdmitted > 0 ? ((totalRetained / totalAdmitted) * 100).toFixed(2) : "0.00";

    return {
      admitted: totalAdmitted,
      retained: totalRetained,
      lost: totalLost,
      dropRate,
      bachelorAdmitted,
      bachelorRetained,
      masterAdmitted,
      masterRetained,
      retentionRate
    };
  }, [retainData, selectedMajors, selectedYears]);

  const retainedPercent = studentStats.admitted > 0 ? ((studentStats.retained / studentStats.admitted) * 100).toFixed(1) : "0";
  const lostPercent = studentStats.admitted > 0 ? ((studentStats.lost / studentStats.admitted) * 100).toFixed(1) : "0";

  const pieData = useMemo(() => {
    return [
      { name: "นิสิตคงอยู่จริง (ภาคปลาย)", value: studentStats.retained },
      { name: "จำนวนนิสิตที่ลดลง/หายไป", value: studentStats.lost }
    ];
  }, [studentStats.retained, studentStats.lost]);

  // 🔹 คำนวณข้อมูลกราฟเปรียบเทียบภาคต้น vs ภาคปลาย
  const rawGraphData = useMemo(() => {
    if (retainData.length === 0) return [];

    const activeMajorFilter = graphSelectedMajors.length > 0 ? graphSelectedMajors : selectedMajors;
    const grouped = {};

    majorsList.forEach(majorName => {
      const key = cleanString(majorName);
      if (key) {
        grouped[key] = { name: majorName, earlyTerm: 0, lateTerm: 0 };
      }
    });

    retainData.forEach(item => {
      const itemEntryYear = extractYear(item["ปีการศึกษาที่รับเข้า"] || item["ปีการศึกษา"]);
      const itemSurveyYear = extractYear(item["ปีที่สำรวจ"] || item["ปีการศึกษา"]);

      const surveyMatch = !graphSurveyYear || 
        (Array.isArray(graphSurveyYear) ? (graphSurveyYear.length === 0 || graphSurveyYear.includes(itemSurveyYear)) : itemSurveyYear === graphSurveyYear);
      
      if (itemEntryYear !== graphEntryYear || !surveyMatch) return;

      const rawName = cleanMajorName(item["ชื่อสาขา"] || item["สาขาวิชา"] || item["สาขา"]);
      if (!rawName || EXCLUDED_MAJORS.includes(rawName)) return;

      const activeMatch = activeMajorFilter.length === 0 || activeMajorFilter.includes(rawName);
      if (!activeMatch) return;

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
  }, [retainData, graphEntryYear, graphSurveyYear, majorsList, selectedMajors, graphSelectedMajors]);

  const bachelorGraphData = useMemo(() => {
    return rawGraphData
      .filter(item => !isMasterOrXMajor(item.name) && (item.earlyTerm + item.lateTerm) > 0)
      .sort((a, b) => (b.earlyTerm + b.lateTerm) - (a.earlyTerm + a.lateTerm));
  }, [rawGraphData]);

  const masterGraphData = useMemo(() => {
    return rawGraphData
      .filter(item => isMasterOrXMajor(item.name) && (item.earlyTerm + item.lateTerm) > 0)
      .sort((a, b) => (b.earlyTerm + b.lateTerm) - (a.earlyTerm + a.lateTerm));
  }, [rawGraphData]);

  const columns = [
    { title: "ลำดับ", key: "index", width: 65, align: "center", render: (t, r, idx) => idx + 1 },
    { title: "ปีที่สำรวจ", key: "year", align: "center", render: (text, record) => record["ปีที่สำรวจ"] || record["ปีการศึกษาที่รับเข้า"] || "-" },
    { title: "ภาคเรียน", key: "term", align: "center", render: () => "ปลาย" },
    { title: "สาขาวิชา", key: "major", render: (text, record) => cleanMajorName(record["ชื่อสาขา"] || record["สาขาวิชา"]) },
    { 
      title: "จำนวนนิสิตคงอยู่", 
      key: "amount",
      align: "right",
      render: (text, record) => <strong>{Number(record["จำนวน"] || 0).toLocaleString()} คน</strong>
    },
  ];

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sidebar />
      <Layout style={{ background: "#f8fafc" }}>
        
        <Header style={{ background: "white", padding: "16px 24px", height: "auto", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #e2e8f0" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <h2 style={{ margin: 0, fontSize: "20px", fontWeight: "700", color: "#0f172a", lineHeight: "1.2" }}>
              ข้อมูลสถิตินิสิต
            </h2>
            <div style={{ color: "#64748b", fontSize: "13px", lineHeight: "1.4", margin: 0 }}>
              รายงานวิเคราะห์ยอดรับเข้า ยอดคงอยู่ การสำเร็จการศึกษา และการติดตามอัตราการพ้นสภาพ
            </div>
          </div>
        </Header>

        <Content style={{ padding: "24px 32px" }}>
          
          {/* 🔹 ฟิลเตอร์หลักด้านบน */}
          <div style={{ background: "#ffffff", padding: 20, borderRadius: 16, marginBottom: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.02)", border: "1px solid #e2e8f0" }}>
            <Row gutter={[16, 16]} align="bottom">
              
              <Col xs={24} md={12}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <span style={{ fontWeight: 600, fontSize: 13, color: "#334155" }}>สาขาวิชา</span>
                  <Button 
                    type="link" 
                    size="small" 
                    onClick={() => handleSelectAllMajors(selectedMajors.length !== majorsList.length)}
                    style={{ padding: 0, height: "auto", fontSize: 12, color: "#0284c7" }}
                  >
                    {majorsList.length > 0 && selectedMajors.length === majorsList.length ? "ยกเลิกทั้งหมด" : "เลือกทั้งหมด"}
                  </Button>
                </div>
                <Select
                  mode="multiple"
                  allowClear
                  style={{ width: '100%' }}
                  placeholder="เลือกทั้งหมด (แสดงทุกสาขาวิชา)"
                  value={selectedMajors}
                  onChange={(val) => setSelectedMajors(val)}
                  maxTagCount="responsive"
                  size="large"
                >
                  {majorsList.map(m => {
                    const isMaster = isMasterOrXMajor(m);
                    return (
                      <Select.Option key={m} value={m}>
                        <div style={{ 
                          display: "flex", 
                          justify: "space-between", 
                          alignItems: "center",
                          backgroundColor: isMaster ? "#f0f9ff" : "transparent", 
                          padding: isMaster ? "2px 8px" : "0",
                          borderRadius: isMaster ? 6 : 0,
                          color: isMaster ? "#0284c7" : "inherit",
                          fontWeight: isMaster ? 600 : 400
                        }}>
                          <span>{m}</span>
                          {isMaster && (
                            <span style={{ fontSize: 10, background: "#bae6fd", color: "#0369a1", padding: "1px 6px", borderRadius: 4, marginLeft: 8 }}>
                              ป.โท
                            </span>
                          )}
                        </div>
                      </Select.Option>
                    );
                  })}
                </Select>
              </Col>

              <Col xs={24} md={12}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <span style={{ fontWeight: 600, fontSize: 13, color: "#334155" }}>ปีการศึกษา</span>
                  <Button 
                    type="link" 
                    size="small" 
                    onClick={() => handleSelectAllYears(selectedYears.length !== yearsList.length)}
                    style={{ padding: 0, height: "auto", fontSize: 12, color: "#0284c7" }}
                  >
                    {yearsList.length > 0 && selectedYears.length === yearsList.length ? "ยกเลิกทั้งหมด" : "เลือกทั้งหมด"}
                  </Button>
                </div>
                <Select
                  mode="multiple"
                  allowClear
                  style={{ width: '100%' }}
                  placeholder="เลือกทั้งหมด (แสดงทุกปี)"
                  value={selectedYears}
                  onChange={(val) => setSelectedYears(val)}
                  maxTagCount="responsive"
                  size="large"
                >
                  {yearsList.map(y => (
                    <Select.Option key={y} value={y}>ปี {y}</Select.Option>
                  ))}
                </Select>
              </Col>
            </Row>
          </div>

          {retainData.length === 0 ? (
            <Card style={{ borderRadius: 16, padding: "40px 0", textAlign: "center" }}>
              <Empty description="ไม่พบข้อมูลสถิตินิสิตคงอยู่ กรุณาเช็กไฟล์อัปโหลดในระบบคลัง" />
            </Card>
          ) : (
            <>
              {/* 🔹 สถิติตัวชี้วัดสำคัญ 5 รายการหลัก (KPI 5 การ์ด) */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: "#0f172a", display: "flex", alignItems: "center", gap: 8 }}>
                    <DashboardOutlined style={{ color: "#0284c7" }} /> สถิติตัวชี้วัดสำคัญ (Key Performance Indicators)
                  </h3>
                </div>

                <Row gutter={[16, 16]}>
                  {/* KPI 1 */}
                  <Col xs={24} sm={12} md={4.8} style={{ flex: "0 0 20%", maxWidth: "20%" }}>
                    <div style={{ background: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)", padding: "20px", borderRadius: 16, color: "#ffffff", boxShadow: "0 4px 14px rgba(2, 132, 199, 0.25)", position: "relative", minHeight: 130 }}>
                      <div style={{ color: "#bae6fd", fontSize: 11, fontWeight: 600 }}>ภาคต้น </div>
                      <h4 style={{ margin: "4px 0", fontSize: 13, color: "#f0f9ff", fontWeight: 500 }}>นิสิตรับเข้าศึกษา</h4>
                      <h2 style={{ margin: 0, fontSize: 26, fontWeight: "800", color: "#ffffff" }}>
                        {studentStats.admitted.toLocaleString()} <span style={{ fontSize: 12, fontWeight: "400", color: "#e0f2fe" }}>คน</span>
                      </h2>
                      <UserAddOutlined style={{ fontSize: 32, color: "#ffffff", position: "absolute", right: 16, bottom: 16, opacity: 0.25 }} />
                    </div>
                  </Col>

                  {/* KPI 2 */}
                  <Col xs={24} sm={12} md={4.8} style={{ flex: "0 0 20%", maxWidth: "20%" }}>
                    <div style={{ background: "linear-gradient(135deg, #059669 0%, #047857 100%)", padding: "20px", borderRadius: 16, color: "#ffffff", boxShadow: "0 4px 14px rgba(5, 150, 105, 0.25)", position: "relative", minHeight: 130 }}>
                      <div style={{ color: "#a7f3d0", fontSize: 11, fontWeight: 600 }}>ภาคปลาย </div>
                      <h4 style={{ margin: "4px 0", fontSize: 13, color: "#ecfdf5", fontWeight: 500 }}>นิสิตคงอยู่ปัจจุบัน</h4>
                      <h2 style={{ margin: 0, fontSize: 26, fontWeight: "800", color: "#ffffff" }}>
                        {studentStats.retained.toLocaleString()} <span style={{ fontSize: 12, fontWeight: "400", color: "#d1fae5" }}>คน</span>
                      </h2>
                      <TeamOutlined style={{ fontSize: 32, color: "#ffffff", position: "absolute", right: 16, bottom: 16, opacity: 0.25 }} />
                    </div>
                  </Col>

                  {/* KPI 3 */}
                  <Col xs={24} sm={12} md={4.8} style={{ flex: "0 0 20%", maxWidth: "20%" }}>
                    <div style={{ background: "linear-gradient(135deg, #8fbc1d 0%, #7ca818 100%)", padding: "20px", borderRadius: 16, color: "#ffffff", boxShadow: "0 4px 14px rgba(143, 188, 29, 0.25)", position: "relative", minHeight: 130 }}>
                      <div style={{ color: "#fef3c7", fontSize: 11, fontWeight: 600 }}>ภาวะการมีงานทำประจำปี</div>
                      <h4 style={{ margin: "4px 0", fontSize: 13, color: "#fffbeb", fontWeight: 500 }}>สำเร็จการศึกษา (ตามปี)</h4>
                      <h2 style={{ margin: 0, fontSize: 26, fontWeight: "800", color: "#ffffff" }}>
                        0 <span style={{ fontSize: 12, fontWeight: "400", color: "#fef3c7" }}>คน</span>
                      </h2>
                      <TrophyOutlined style={{ fontSize: 32, color: "#ffffff", position: "absolute", right: 16, bottom: 16, opacity: 0.25 }} />
                    </div>
                  </Col>

                  {/* KPI 4 */}
                  <Col xs={24} sm={12} md={4.8} style={{ flex: "0 0 20%", maxWidth: "20%" }}>
                    <div style={{ background: "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)", padding: "20px", borderRadius: 16, color: "#ffffff", boxShadow: "0 4px 14px rgba(124, 58, 237, 0.25)", position: "relative", minHeight: 130 }}>
                      <div style={{ color: "#ddd6fe", fontSize: 11, fontWeight: 600 }}>ภาวะการมีงานทำประจำปี</div>
                      <h4 style={{ margin: "4px 0", fontSize: 13, color: "#f5f3ff", fontWeight: 500 }}>สำเร็จการศึกษา (ตามเกณฑ์)</h4>
                      <h2 style={{ margin: 0, fontSize: 26, fontWeight: "800", color: "#ffffff" }}>
                        0 <span style={{ fontSize: 12, fontWeight: "400", color: "#ddd6fe" }}>คน</span>
                      </h2>
                      <CheckCircleOutlined style={{ fontSize: 32, color: "#ffffff", position: "absolute", right: 16, bottom: 16, opacity: 0.25 }} />
                    </div>
                  </Col>

                  {/* 🌟 KPI 5 (ปรับเปลี่ยนเป็้นโทนสีเหลืองทองตามคำขอ) */}
                  <Col xs={24} sm={12} md={4.8} style={{ flex: "0 0 20%", maxWidth: "20%" }}>
                    <div style={{ background: "linear-gradient(135deg, #d97706 0%, #b45309 100%)", padding: "20px", borderRadius: 16, color: "#ffffff", boxShadow: "0 4px 14px rgba(217, 119, 6, 0.25)", position: "relative", minHeight: 130 }}>
                      <div style={{ color: "#fef3c7", fontSize: 11, fontWeight: 600 }}>ภาพรวมระบบ</div>
                      <h4 style={{ margin: "4px 0", fontSize: 13, color: "#fffbeb", fontWeight: 500 }}>อัตราการคงอยู่เฉลี่ย</h4>
                      <h2 style={{ margin: 0, fontSize: 26, fontWeight: "800", color: "#ffffff" }}>
                        {studentStats.retentionRate} <span style={{ fontSize: 14, fontWeight: "600", color: "#fef3c7" }}>%</span>
                      </h2>
                      <PercentageOutlined style={{ fontSize: 32, color: "#ffffff", position: "absolute", right: 16, bottom: 16, opacity: 0.25 }} />
                    </div>
                  </Col>
                </Row>
              </div>

              {/* 🔹 แถวแสดงการ์ดสรุปยอด นิสิตระดับปริญญาตรี และ ปริญญาโท */}
              <div style={{ marginBottom: 24 }}>
                <Row gutter={[16, 16]}>
                  {/* 🎓 การ์ดนิสิตระดับปริญญาตรี */}
                  <Col xs={24} md={12}>
                    <div style={{ background: "#ffffff", padding: 20, borderRadius: 16, border: "1px solid #e2e8f0", boxShadow: "0 2px 8px rgba(0,0,0,0.02)", height: "100%" }}>
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
                            <div style={{ fontSize: 11, color: "#0369a1" }}>ภาคต้น (รับเข้า)</div>
                            <div style={{ fontSize: 20, fontWeight: "bold", color: "#0284c7" }}>
                              {studentStats.bachelorAdmitted.toLocaleString()} <span style={{ fontSize: 12, fontWeight: "normal" }}>คน</span>
                            </div>
                          </div>
                        </Col>
                        <Col span={12}>
                          <div style={{ background: "#f0fdf4", padding: 12, borderRadius: 12, border: "1px solid #bbf7d0" }}>
                            <div style={{ fontSize: 11, color: "#15803d" }}>ภาคปลาย (คงอยู่)</div>
                            <div style={{ fontSize: 20, fontWeight: "bold", color: "#16a34a" }}>
                              {studentStats.bachelorRetained.toLocaleString()} <span style={{ fontSize: 12, fontWeight: "normal" }}>คน</span>
                            </div>
                          </div>
                        </Col>
                      </Row>
                    </div>
                  </Col>

                  {/* 👑 การ์ดนิสิตระดับปริญญาโท */}
                  <Col xs={24} md={12}>
                    <div style={{ background: "#ffffff", padding: 20, borderRadius: 16, border: "1px solid #e2e8f0", boxShadow: "0 2px 8px rgba(0,0,0,0.02)", height: "100%" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <CrownOutlined style={{ fontSize: 22, color: "#7c3aed" }} />
                          <div>
                            <h4 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#6d28d9" }}>นิสิตระดับปริญญาโท</h4>
                            <span style={{ fontSize: 11, color: "#64748b" }}>รหัสสาขาขึ้นต้นด้วย X หรือ วท.ม.</span>
                          </div>
                        </div>
                      </div>

                      <Row gutter={12}>
                        <Col span={12}>
                          <div style={{ background: "#f5f3ff", padding: 12, borderRadius: 12, border: "1px solid #ddd6fe" }}>
                            <div style={{ fontSize: 11, color: "#6d28d9" }}>ภาคต้น (รับเข้า)</div>
                            <div style={{ fontSize: 20, fontWeight: "bold", color: "#7c3aed" }}>
                              {studentStats.masterAdmitted.toLocaleString()} <span style={{ fontSize: 12, fontWeight: "normal" }}>คน</span>
                            </div>
                          </div>
                        </Col>
                        <Col span={12}>
                          <div style={{ background: "#fdf4ff", padding: 12, borderRadius: 12, border: "1px solid #f5d0fe" }}>
                            <div style={{ fontSize: 11, color: "#a21caf" }}>ภาคปลาย (คงอยู่)</div>
                            <div style={{ fontSize: 20, fontWeight: "bold", color: "#c026d3" }}>
                              {studentStats.masterRetained.toLocaleString()} <span style={{ fontSize: 12, fontWeight: "normal" }}>คน</span>
                            </div>
                          </div>
                        </Col>
                      </Row>
                    </div>
                  </Col>
                </Row>

                <Alert
                  message={<b style={{ fontSize: "14px", color: "#0f172a" }}>บทวิเคราะห์สถิติและอัตราการสูญเสีย (Executive Retention Analysis)</b>}
                  description={
                    <div style={{ fontSize: "13px", color: "#334155", marginTop: 6, lineHeight: "1.6" }}>
                      จากการประมวลผลฐานข้อมูล {selectedYears.length > 0 ? `ปีการศึกษา ${selectedYears.join(", ")}` : "ทุกปีการศึกษา"} 
                      {selectedMajors.length > 0 ? ` สาขาวิชา${selectedMajors.join(", ")}` : " ทุกสาขาวิชา"} 
                      มียอดรับเข้าศึกษาภาคต้นรวม <b style={{ color: "#0284c7" }}>{studentStats.admitted.toLocaleString()} คน</b> และมียอดคงอยู่ภาคปลายรวม <b style={{ color: "#059669" }}>{studentStats.retained.toLocaleString()} คน</b> 
                      เมื่อคำนวณเปรียบเทียบหักลบพบนิสิตที่มีการลาออก / พ้นสภาพ / ถูกคัดชื่อ <b style={{ color: "#e11d48" }}>{studentStats.lost.toLocaleString()} คน</b> (คิดเป็นอัตราลดลงของจำนวนนิสิตเป็น <b style={{ color: "#e11d48" }}>{studentStats.dropRate}%</b>) 
                      ส่งผลให้อัตราการคงอยู่ในระบบภาพรวมคงอยู่ที่ <b style={{ color: "#0284c7" }}>{studentStats.retentionRate}%</b>
                    </div>
                  }
                  type="info"
                  showIcon
                  icon={<InfoCircleOutlined style={{ color: "#0284c7" }} />}
                  style={{ marginTop: 16, borderRadius: 16, border: "1px solid #bae6fd", backgroundColor: "#f0f9ff" }}
                />
              </div>

              <Row gutter={[20, 20]} style={{ marginBottom: 24 }}>
                <Col xs={24} lg={9}>
                  <div style={{ background: "white", padding: 24, borderRadius: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.03)", height: "100%", border: "1px solid #e2e8f0", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#0f172a" }}>สัดส่วนการคงอยู่</h3>
                      <div style={{ color: "#64748b", fontSize: 12, marginTop: 4 }}>เปรียบเทียบจากสถิตินิสิตรับเข้าศึกษาทั้งหมด</div>
                    </div>

                    <div style={{ height: 230, position: "relative", margin: "10px 0" }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie 
                            activeIndex={activeIndex}
                            activeShape={renderActiveShape}
                            data={pieData} 
                            dataKey="value" 
                            nameKey="name" 
                            innerRadius={65} 
                            outerRadius={88} 
                            paddingAngle={5} 
                            cx="50%" 
                            cy="50%"
                            onMouseEnter={(data, index) => setActiveIndex(index)}
                            onMouseLeave={() => setActiveIndex(null)}
                          >
                            <Cell fill="#059669" style={{ outline: "none" }} />
                            <Cell fill="#e11d48" style={{ outline: "none" }} />
                          </Pie>
                          <Tooltip 
                            contentStyle={{ borderRadius: 8, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }}
                            formatter={(value) => `${Number(value).toLocaleString()} คน`} 
                          />
                        </PieChart>
                      </ResponsiveContainer>

                      <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", textAlign: "center", pointerEvents: "none" }}>
                        <span style={{ fontSize: 11, color: "#64748b", display: "block", fontWeight: 500 }}>รับเข้าศึกษา (รวม)</span>
                        <h3 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#0f172a" }}>
                          {studentStats.admitted.toLocaleString()}
                        </h3>
                        <span style={{ fontSize: 10, color: "#94a3b8" }}>คน</span>
                      </div>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 10, borderTop: "1px solid #f1f5f9", paddingTop: 16, fontSize: 13 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 10px", borderRadius: 8, backgroundColor: activeIndex === 0 ? "#ecfdf5" : "transparent", transition: "all 0.2s" }}>
                        <div style={{ display: "flex", alignItems: "center" }}>
                          <span style={{ display: "inline-block", width: 10, height: 10, background: "#059669", borderRadius: "50%", marginRight: 8 }}></span>
                          <span style={{ color: "#334155" }}>จำนวนนิสิตคงอยู่</span>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <strong style={{ color: "#059669" }}>{studentStats.retained.toLocaleString()} คน</strong>
                          <span style={{ fontSize: 11, color: "#64748b", marginLeft: 6 }}>({retainedPercent}%)</span>
                        </div>
                      </div>

                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 10px", borderRadius: 8, backgroundColor: activeIndex === 1 ? "#fff1f2" : "transparent", transition: "all 0.2s" }}>
                        <div style={{ display: "flex", alignItems: "center" }}>
                          <span style={{ display: "inline-block", width: 10, height: 10, background: "#e11d48", borderRadius: "50%", marginRight: 8 }}></span>
                          <span style={{ color: "#334155" }}>จำนวนนิสิตที่ลดลง</span>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <strong style={{ color: "#e11d48" }}>{studentStats.lost.toLocaleString()} คน</strong>
                          <span style={{ fontSize: 11, color: "#64748b", marginLeft: 6 }}>({lostPercent}%)</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Col>

                <Col xs={24} lg={15}>
                  <div style={{ background: "white", padding: 24, borderRadius: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.03)", border: "1px solid #e2e8f0" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
                      <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#0f172a" }}>ตารางจำนวนนิสิตคงอยู่</h3>

                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <FilterOutlined style={{ color: "#0284c7", fontSize: 13 }} />
                        <span style={{ fontSize: 13, color: "#475569", fontWeight: 500 }}>ปีการศึกษา:</span>
                        <Select
                          allowClear
                          placeholder="ทั้งหมด"
                          value={tableSelectedYear}
                          onChange={(val) => setTableSelectedYear(val)}
                          style={{ width: 120 }}
                          size="small"
                        >
                          {yearsList.map(y => (
                            <Select.Option key={y} value={y}>ปี {y}</Select.Option>
                          ))}
                        </Select>
                      </div>
                    </div>

                    <Table 
                      columns={columns} 
                      dataSource={filteredRetainTable} 
                      rowKey={(record, idx) => `${record["รหัสสาขา"] || record["ชื่อสาขา"] || "row"}-${record["ปีที่สำรวจ"] || idx}`}
                      pagination={{ 
                        defaultPageSize: 5,
                        pageSizeOptions: ["5", "10", "20"],
                        showSizeChanger: true,
                        showTotal: (total) => `รวม ${total} รายการ` 
                      }}
                      bordered
                      scroll={{ x: true }}
                    />
                  </div>
                </Col>
              </Row>

              {/* 📊 GRAPH SECTION PANEL (ส่วนกราฟแท่งเปรียบเทียบ) */}
              <div style={{ marginTop: "32px" }}>
                <Card 
                  style={{ borderRadius: "16px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}
                  title={
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px", padding: "8px 0" }}>
                      <div>
                        <span style={{ fontSize: "16px", fontWeight: "700", color: "#0f172a" }}>
                          แผนภูมิเปรียบเทียบจำนวนนิสิตตามสาขาวิชา
                        </span>
                        <p style={{ margin: 0, fontSize: "12px", color: "#64748b", fontWeight: "normal" }}>
                          จำแนกตามรายสาขาวิชา 
                        </p>
                      </div>
                      <Space>
                        <span style={{ fontSize: "13px", fontWeight: "600", color: "#334155" }}>ปีที่รับเข้า:</span>
                        <Select 
                          value={graphEntryYear} 
                          onChange={setGraphEntryYear} 
                          size="small" 
                          style={{ width: 100 }}
                        >
                          {entryYears.map(y => <Select.Option key={y} value={y}>{y}</Select.Option>)}
                        </Select>
                        <span style={{ fontSize: "13px", fontWeight: "600", color: "#334155", marginLeft: "8px" }}>ปีที่สำรวจ:</span>
                        <Select 
                          value={graphSurveyYear} 
                          onChange={setGraphSurveyYear} 
                          size="small" 
                          style={{ width: 100 }}
                        >
                          {surveyYears.map(y => <Select.Option key={y} value={y}>{y}</Select.Option>)}
                        </Select>
                      </Space>
                    </div>
                  }
                >
                  {/* 🎓 กราฟระดับปริญญาตรี */}
                  <div style={{ marginBottom: "36px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "20px" }}>
                      <span style={{ display: "inline-block", width: "4px", height: "16px", backgroundColor: "#0ea5e9", borderRadius: "2px" }}></span>
                      <h4 style={{ color: "#0f172a", fontWeight: "700", margin: 0, fontSize: "15px" }}>
                        🎓 นิสิตระดับปริญญาตรี
                      </h4>
                    </div>

                    {bachelorGraphData.length > 0 ? (
                      <div style={{ width: "100%", height: Math.max(300, bachelorGraphData.length * 75) }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart 
                            data={bachelorGraphData} 
                            layout="vertical" 
                            margin={{ top: 10, right: 65, left: 20, bottom: 10 }}
                            barGap={6}
                            barCategoryGap="25%"
                          >
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                            <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
                            <YAxis 
                              dataKey="name" 
                              type="category" 
                              width={260} 
                              axisLine={false}
                              tickLine={false}
                              tick={{ fontSize: 13, fill: "#334155", fontWeight: 500 }}
                            />
                            <Tooltip 
                              cursor={{ fill: "rgba(241, 245, 249, 0.6)" }}
                              contentStyle={{ 
                                borderRadius: "12px", 
                                border: "1px solid #e2e8f0", 
                                boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                                padding: "12px 16px"
                              }} 
                            />
                            <Legend verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: "12px" }} />
                            <Bar 
                              dataKey="earlyTerm" 
                              name="ภาคต้น" 
                              fill="#3b8bda" 
                              radius={[0, 4, 4, 0]}
                              barSize={14}
                              label={renderBarValueLabel} 
                            />
                            <Bar 
                              dataKey="lateTerm" 
                              name="ภาคปลาย" 
                              fill="#34a8c8" 
                              radius={[0, 4, 4, 0]} 
                              barSize={14}
                              label={renderBarValueLabel} 
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="ไม่มีข้อมูลระดับปริญญาตรีสำหรับปีการศึกษาที่เลือก" />
                    )}
                  </div>

                  {/* 🎓 กราฟระดับปริญญาโท */}
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "20px" }}>
                      <span style={{ display: "inline-block", width: "4px", height: "16px", backgroundColor: "#8b5cf6", borderRadius: "2px" }}></span>
                      <h4 style={{ color: "#0f172a", fontWeight: "700", margin: 0, fontSize: "15px" }}>
                        🎓 นิสิตระดับปริญญาโท
                      </h4>
                    </div>

                    {masterGraphData.length > 0 ? (
                      <div style={{ width: "100%", height: Math.max(200, masterGraphData.length * 75) }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart 
                            data={masterGraphData} 
                            layout="vertical" 
                            margin={{ top: 10, right: 65, left: 20, bottom: 10 }}
                            barGap={6}
                            barCategoryGap="25%"
                          >
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                            <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
                            <YAxis 
                              dataKey="name" 
                              type="category" 
                              width={260} 
                              axisLine={false}
                              tickLine={false}
                              tick={{ fontSize: 13, fill: "#334155", fontWeight: 500 }}
                            />
                            <Tooltip 
                              cursor={{ fill: "rgba(241, 245, 249, 0.6)" }}
                              contentStyle={{ 
                                borderRadius: "12px", 
                                border: "1px solid #e2e8f0", 
                                boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                                padding: "12px 16px"
                              }} 
                            />
                            <Legend verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: "12px" }} />
                            <Bar 
                              dataKey="earlyTerm" 
                              name="ภาคต้น" 
                              fill="#8b5cf6" 
                              radius={[0, 4, 4, 0]}
                              barSize={14}
                              label={renderBarValueLabel} 
                            />
                            <Bar 
                              dataKey="lateTerm" 
                              name="ภาคปลาย" 
                              fill="#f97316" 
                              radius={[0, 4, 4, 0]} 
                              barSize={14}
                              label={renderBarValueLabel} 
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="ไม่มีข้อมูลระดับปริญญาโทสำหรับปีการศึกษาที่เลือก" />
                    )}
                  </div>
                </Card>
              </div>
            </>
          )}

        </Content>
      </Layout>
    </Layout>
  );
}

export default StudentPage;
