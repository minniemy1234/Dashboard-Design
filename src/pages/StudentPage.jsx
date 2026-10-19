import { Layout, Table, Card, Row, Col, Empty, Alert, Statistic, Select, Button } from "antd";
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
  BarChartOutlined
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

const renderCustomBarLabel = (props) => {
  const { x, y, width, value } = props;
  if (!value || value === 0) return null;
  return (
    <text 
      x={x + width + 6} 
      y={y + 10} 
      fill="#475569" 
      fontSize={11} 
      fontWeight={600}
    >
      {value}
    </text>
  );
};

function StudentPage() {
  const [selectedMajors, setSelectedMajors] = useState([]);
  const [selectedYears, setSelectedYears] = useState([]);
  const [tableSelectedYear, setTableSelectedYear] = useState(null); // Mini Filter สำหรับตาราง
  const [dashboardData, setDashboardData] = useState(null);
  const [activeIndex, setActiveIndex] = useState(null);

  // States สำหรับฟิลเตอร์ควบคุมกราฟ
  const [graphEntryYear, setGraphEntryYear] = useState(null);
  const [graphSurveyYear, setGraphSurveyYear] = useState([]);
  // [เพิ่มส่วนนี้] State สำหรับกรองสาขาวิชาในกราฟโดยเฉพาะ
  const [graphSelectedMajors, setGraphSelectedMajors] = useState([]);

  useEffect(() => {
    const stored = localStorage.getItem("dashboardData");
    if (stored) {
      setDashboardData(JSON.parse(stored));
    }
  }, []);

  const cleanMajorName = (majorStr) => {
    if (!majorStr) return "";
    let name = String(majorStr).replace(/\n/g, ' ').trim();
    if (name.startsWith("สาขาวิชา")) {
      name = name.replace("สาขาวิชา", "").trim();
    } else if (name.startsWith("สาขา")) {
      name = name.replace("สาขา", "").trim();
    }
    return name;
  };

  const extractYear = (yearStr) => {
    if (!yearStr) return "";
    const match = String(yearStr).match(/\d+/);
    return match ? match[0] : String(yearStr).trim();
  };

  const cleanString = (str) => {
    if (!str) return "";
    return String(str).replace(/\s+/g, '').replace(/['"]+/g, '').trim();
  };

  const retainData = dashboardData?.["นิสิตคงอยู่"] || dashboardData?.["ข้อมูลนิสิตคงอยู่"] || dashboardData?.["จำนวนนิสิตคงอยู่"] || [];

  const majorsList = useMemo(() => {
    const list = retainData.map(item => cleanMajorName(item["ชื่อสาขา"] || item["สาขาวิชา"] || item["สาขา"]));
    return [...new Set(list)].filter(Boolean).sort();
  }, [retainData]);

  const yearsList = useMemo(() => {
    const list = retainData.map(item => extractYear(item["ปีที่สำรวจ"] || item["ปีการศึกษาที่รับเข้า"] || item["ปีการศึกษา"]));
    return [...new Set(list)].filter(Boolean).sort();
  }, [retainData]);

  // รายการปีการศึกษาที่รับเข้า และ ปีที่สำรวจ สำหรับ Graph Controller
  const entryYears = useMemo(() => {
    const list = retainData.map(item => extractYear(item["ปีการศึกษาที่รับเข้า"] || item["ปีการศึกษา"]));
    return [...new Set(list)].filter(Boolean).sort();
  }, [retainData]);

  const surveyYears = useMemo(() => {
    const list = retainData.map(item => extractYear(item["ปีที่สำรวจ"] || item["ปีการศึกษา"]));
    return [...new Set(list)].filter(Boolean).sort();
  }, [retainData]);

  // ตั้งค่า default ปีของกราฟเมื่อดึงข้อมูลได้
  useEffect(() => {
    if (entryYears.length > 0 && !graphEntryYear) {
      setGraphEntryYear(entryYears[entryYears.length - 1]);
    }
    if (surveyYears.length > 0 && graphSurveyYear.length === 0) {
      setGraphSurveyYear([surveyYears[surveyYears.length - 1]]);
    }
  }, [entryYears, surveyYears, graphEntryYear, graphSurveyYear]);

  // LOGIC ปุ่มเลือกทั้งหมด/ยกเลิกทั้งหมด (สำหรับ Global Filter)
  const handleSelectAllMajors = (shouldSelectAll) => {
    setSelectedMajors(shouldSelectAll ? majorsList : []);
  };

  const handleSelectAllYears = (shouldSelectAll) => {
    setSelectedYears(shouldSelectAll ? yearsList : []);
  };

  // กรองข้อมูลในตาราง
  const filteredRetainTable = useMemo(() => {
    return retainData.filter(item => {
      const itemMajor = cleanMajorName(item["ชื่อสาขา"] || item["สาขาวิชา"] || item["สาขา"]);
      const itemYear = extractYear(item["ปีที่สำรวจ"] || item["ปีการศึกษาที่รับเข้า"] || item["ปีการศึกษา"]);
      const itemTerm = String(item["ภาคเรียน"] || item["ภาคการศึกษา"] || "").trim();
      
      const majorMatch = selectedMajors.length === 0 || selectedMajors.includes(itemMajor);
      const yearMatch = selectedYears.length === 0 || selectedYears.includes(itemYear);
      const termMatch = itemTerm === "ปลาย"; 
      const tableYearMatch = !tableSelectedYear || itemYear === tableSelectedYear;

      return majorMatch && yearMatch && termMatch && tableYearMatch;
    });
  }, [retainData, selectedMajors, selectedYears, tableSelectedYear]);

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
      const itemYear = extractYear(item["ปีที่สำรวจ"] || item["ปีการศึกษาที่รับเข้า"] || item["ปีการศึกษา"]);
      const itemTerm = String(item["ภาคเรียน"] || item["ภาคการศึกษา"] || "").trim();
      const amt = Number(item["จำนวน"] || item["รวม"] || 0);
      const code = String(item["รหัสสาขา"] || "").trim().toUpperCase();

      const majorMatch = selectedMajors.length === 0 || cleanedSelectedMajors.includes(cleanString(itemMajor));
      const yearMatch = selectedYears.length === 0 || selectedYears.includes(itemYear);

      if (majorMatch && yearMatch) {
        const isMaster = code.startsWith("X");

        if (itemTerm === "ต้น") {
          totalAdmitted += amt;
          if (isMaster) masterAdmitted += amt;
          else bachelorAdmitted += amt;
        }
        if (itemTerm === "ปลาย") {
          totalRetained += amt;
          if (isMaster) masterRetained += amt;
          else bachelorRetained += amt;
        }
      }
    });

    const gradsByYear = 0;
    const gradsByCriteria = 0;

    const totalLost = totalAdmitted > totalRetained ? totalAdmitted - totalRetained : 0;
    const dropRate = totalAdmitted > 0 ? ((totalLost / totalAdmitted) * 100).toFixed(2) : "0.00";
    const retentionRate = totalAdmitted > 0 ? ((totalRetained / totalAdmitted) * 100).toFixed(2) : "0.00";
    const gradCriteriaRate = "0.00";

    return {
      admitted: totalAdmitted,
      retained: totalRetained,
      lost: totalLost,
      dropRate: dropRate,
      bachelorAdmitted,
      bachelorRetained,
      masterAdmitted,
      masterRetained,
      graduatesYear: gradsByYear,
      graduatesCriteria: gradsByCriteria,
      retentionRate: retentionRate,
      gradCriteriaRate: gradCriteriaRate
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

  // [ปรับแก้] คำนวณข้อมูลกราฟแท่ง ปริญญาตรี (เช็ก graphSelectedMajors เป็นหลัก ถ้าไม่มีให้ดู selectedMajors ด้านบน)
  const bachelorGraphData = useMemo(() => {
    if (!graphEntryYear) return [];
    
    // กำหนดว่าถ้า graphSelectedMajors มีการเลือกให้ใช้ของกราฟโดยเฉพาะ หากไม่เลือกเลยให้ใช้ฟิลเตอร์ภาพรวม
    const activeMajorFilter = graphSelectedMajors.length > 0 ? graphSelectedMajors : selectedMajors;

    const map = {};
    retainData.forEach(item => {
      const code = String(item["รหัสสาขา"] || "").trim().toUpperCase();
      const isMaster = code.startsWith("X");
      if (isMaster) return;

      const major = cleanMajorName(item["ชื่อสาขา"] || item["สาขาวิชา"] || item["สาขา"]);
      const entryYr = extractYear(item["ปีการศึกษาที่รับเข้า"] || item["ปีการศึกษา"]);
      const surveyYr = extractYear(item["ปีที่สำรวจ"] || item["ปีการศึกษา"]);
      const term = String(item["ภาคเรียน"] || item["ภาคการศึกษา"] || "").trim();
      const amt = Number(item["จำนวน"] || item["รวม"] || 0);

      const majorMatch = activeMajorFilter.length === 0 || activeMajorFilter.includes(major);
      const surveyMatch = graphSurveyYear.length === 0 || graphSurveyYear.includes(surveyYr);

      if (majorMatch && entryYr === graphEntryYear && surveyMatch) {
        if (!map[major]) {
          map[major] = { name: major, earlyTerm: 0, lateTerm: 0 };
        }
        if (term === "ต้น") map[major].earlyTerm += amt;
        if (term === "ปลาย") map[major].lateTerm += amt;
      }
    });

    return Object.values(map).sort((a, b) => a.name.localeCompare(b.name, 'th'));
  }, [retainData, selectedMajors, graphSelectedMajors, graphEntryYear, graphSurveyYear]);

  // [ปรับแก้] คำนวณข้อมูลกราฟแท่ง ปริญญาโท (เช็ก graphSelectedMajors เป็นหลัก)
  const masterGraphData = useMemo(() => {
    if (!graphEntryYear) return [];

    const activeMajorFilter = graphSelectedMajors.length > 0 ? graphSelectedMajors : selectedMajors;

    const map = {};
    retainData.forEach(item => {
      const code = String(item["รหัสสาขา"] || "").trim().toUpperCase();
      const isMaster = code.startsWith("X");
      if (!isMaster) return;

      const major = cleanMajorName(item["ชื่อสาขา"] || item["สาขาวิชา"] || item["สาขา"]);
      const entryYr = extractYear(item["ปีการศึกษาที่รับเข้า"] || item["ปีการศึกษา"]);
      const surveyYr = extractYear(item["ปีที่สำรวจ"] || item["ปีการศึกษา"]);
      const term = String(item["ภาคเรียน"] || item["ภาคการศึกษา"] || "").trim();
      const amt = Number(item["จำนวน"] || item["รวม"] || 0);

      const majorMatch = activeMajorFilter.length === 0 || activeMajorFilter.includes(major);
      const surveyMatch = graphSurveyYear.length === 0 || graphSurveyYear.includes(surveyYr);

      if (majorMatch && entryYr === graphEntryYear && surveyMatch) {
        if (!map[major]) {
          map[major] = { name: major, earlyTerm: 0, lateTerm: 0 };
        }
        if (term === "ต้น") map[major].earlyTerm += amt;
        if (term === "ปลาย") map[major].lateTerm += amt;
      }
    });

    return Object.values(map).sort((a, b) => a.name.localeCompare(b.name, 'th'));
  }, [retainData, selectedMajors, graphSelectedMajors, graphEntryYear, graphSurveyYear]);

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
              ข้อมูลสถิตินิสิตประจำคณะ
            </h2>
            <div style={{ color: "#64748b", fontSize: "13px", lineHeight: "1.4", margin: 0 }}>
              รายงานวิเคราะห์ยอดรับเข้า ยอดคงอยู่ การสำเร็จการศึกษา และการติดตามอัตราการพ้นสภาพ
            </div>
          </div>
        </Header>

        <Content style={{ padding: "24px 32px" }}>
          
          {/* MULTI-SELECT FILTER SECTION (ตัวกรองใหญ่ของหน้ารายงาน) */}
          <div style={{ background: "#ffffff", padding: 20, borderRadius: 16, marginBottom: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.02)", border: "1px solid #e2e8f0" }}>
            <Row gutter={[16, 16]} align="bottom">
              
              {/* ตัวกรองสาขาวิชาภาพรวม */}
              <Col xs={24} md={12}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <span style={{ fontWeight: 600, fontSize: 13, color: "#334155" }}>สาขาวิชา 

                  </span>
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
                  {majorsList.map(m => (
                    <Select.Option key={m} value={m}>{m}</Select.Option>
                  ))}
                </Select>
              </Col>

              {/* ตัวกรองปีการศึกษาภาพรวม */}
              <Col xs={24} md={12}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <span style={{ fontWeight: 600, fontSize: 13, color: "#334155" }}>ปีการศึกษา (ภาพรวมระบบ)</span>
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
                      <div style={{ color: "#bae6fd", fontSize: 11, fontWeight: 600 }}>ภาคต้น </div>
                      <h4 style={{ margin: "4px 0", fontSize: 14, color: "#f0f9ff", fontWeight: 500 }}>นิสิตรับเข้าศึกษา</h4>
                      <h2 style={{ margin: 0, fontSize: 28, fontWeight: "800", color: "#ffffff" }}>
                        {studentStats.admitted.toLocaleString()} <span style={{ fontSize: 13, fontWeight: "400", color: "#e0f2fe" }}>คน</span>
                      </h2>
                      <UserAddOutlined style={{ fontSize: 36, color: "#ffffff", position: "absolute", right: 20, bottom: 20, opacity: 0.25 }} />
                    </div>
                  </Col>

                  {/* KPI 2: นิสิตคงอยู่ */}
                  <Col xs={24} sm={12} md={6}>
                    <div style={{ background: "linear-gradient(135deg, #059669 0%, #047857 100%)", padding: "20px", borderRadius: 16, color: "#ffffff", boxShadow: "0 4px 14px rgba(5, 150, 105, 0.25)", position: "relative", minHeight: 130 }}>
                      <div style={{ color: "#a7f3d0", fontSize: 11, fontWeight: 600 }}>ภาคปลาย </div>
                      <h4 style={{ margin: "4px 0", fontSize: 14, color: "#ecfdf5", fontWeight: 500 }}>นิสิตคงอยู่ปัจจุบัน</h4>
                      <h2 style={{ margin: 0, fontSize: 28, fontWeight: "800", color: "#ffffff" }}>
                        {studentStats.retained.toLocaleString()} <span style={{ fontSize: 13, fontWeight: "400", color: "#d1fae5" }}>คน</span>
                      </h2>
                      <TeamOutlined style={{ fontSize: 36, color: "#ffffff", position: "absolute", right: 20, bottom: 20, opacity: 0.25 }} />
                    </div>
                  </Col>

                  {/* KPI 3: สำเร็จการศึกษา (ตามปี) */}
                  <Col xs={24} sm={12} md={6}>
                    <div style={{ background: "linear-gradient(135deg, #8fbc1d 0%, #8fbc1d 100%)", padding: "20px", borderRadius: 16, color: "#ffffff", boxShadow: "0 4px 14px rgba(217, 119, 6, 0.25)", position: "relative", minHeight: 130 }}>
                      <div style={{ color: "#fef3c7", fontSize: 11, fontWeight: 600 }}>ภาวะการมีงานทำประจำปี</div>
                      <h4 style={{ margin: "4px 0", fontSize: 14, color: "#fffbeb", fontWeight: 500 }}>สำเร็จการศึกษา (ตามปี)</h4>
                      <h2 style={{ margin: 0, fontSize: 28, fontWeight: "800", color: "#ffffff" }}>
                        0 <span style={{ fontSize: 13, fontWeight: "400", color: "#fef3c7" }}>คน</span>
                      </h2>
                      <TrophyOutlined style={{ fontSize: 36, color: "#ffffff", position: "absolute", right: 20, bottom: 20, opacity: 0.25 }} />
                    </div>
                  </Col>

                  {/* KPI 4: สำเร็จการศึกษา (ตามเกณฑ์) */}
                  <Col xs={24} sm={12} md={6}>
                    <div style={{ background: "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)", padding: "20px", borderRadius: 16, color: "#ffffff", boxShadow: "0 4px 14px rgba(124, 58, 237, 0.25)", position: "relative", minHeight: 130 }}>
                      <div style={{ color: "#ddd6fe", fontSize: 11, fontWeight: 600 }}>ภาวะการมีงานทำประจำปี</div>
                      <h4 style={{ margin: "4px 0", fontSize: 14, color: "#f5f3ff", fontWeight: 500 }}>สำเร็จการศึกษา (ตามเกณฑ์)</h4>
                      <h2 style={{ margin: 0, fontSize: 28, fontWeight: "800", color: "#ffffff" }}>
                        0 <span style={{ fontSize: 13, fontWeight: "400", color: "#ddd6fe" }}>คน</span>
                      </h2>
                      <CheckCircleOutlined style={{ fontSize: 36, color: "#ffffff", position: "absolute", right: 20, bottom: 20, opacity: 0.25 }} />
                    </div>
                  </Col>
                </Row>
              </div>

              {/* EXECUTIVE SUMMARY & ANALYSIS ZONE */}
              <div style={{ marginBottom: 24 }}>
                <Row gutter={[16, 16]}>
                  <Col xs={24} md={12}>
                    <Card bordered={false} style={{ borderRadius: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.03)", background: "#ffffff", border: "1px solid #e2e8f0" }}>
                      <Statistic 
                        title={<span style={{ color: "#475569", fontWeight: 600 }}>อัตราการคงอยู่เฉลี่ย (Retention Rate)</span>} 
                        value={studentStats.retentionRate} 
                        precision={2}
                        valueStyle={{ color: '#0284c7', fontWeight: 800, fontSize: 28 }}
                        suffix="%" 
                      />
                    </Card>
                  </Col>

                </Row>

                {/* ALERT ANALYSIS */}
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

              {/* DEGREE LEVEL BREAKDOWN: BACHELOR VS MASTER */}
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

                <Col xs={24} md={12}>
                  <div style={{ background: "#ffffff", padding: 20, borderRadius: 16, border: "1px solid #e2e8f0", boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <CrownOutlined style={{ fontSize: 22, color: "#7c3aed" }} />
                        <div>
                          <h4 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#6d28d9" }}>นิสิตระดับปริญญาโท</h4>
                          <span style={{ fontSize: 11, color: "#64748b" }}>รหัสสาขาขึ้นต้นด้วย X (เช่น XS01)</span>
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

              {/* VISUAL ZONE: PIE CHART & TABLE SIDE-BY-SIDE */}
              <Row gutter={[20, 20]} style={{ marginBottom: 24 }}>

                {/* PIE CHART AREA */}
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

                {/* DATA TABLE AREA */}
                <Col xs={24} lg={15}>
                  <div style={{ background: "white", padding: 24, borderRadius: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.03)", border: "1px solid #e2e8f0" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
                      <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#0f172a" }}>ตารางแจกแจงจำนวนนิสิตคงอยู่ประจำปี</h3>

                      {/* MINI FILTER เลือกปีการศึกษาสำหรับตาราง */}
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

              {/* 🎓 GLOBAL GRAPH CONTROLLER (โซนควบคุมตัวกรองของกราฟโดยเฉพาะ) */}
              <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 16, marginBottom: 16, background: "#fff", padding: "12px 20px", borderRadius: 12, border: "1px solid #e2e8f0", flexWrap: "wrap" }}>
                
                {/* [เพิ่มส่วนนี้] ตัวกรองสาขาวิชาตรงกราฟ */}
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 13, color: "#475569", fontWeight: 600 }}>สาขาวิชา:</span>
                  <Select
                    mode="multiple"
                    allowClear
                    placeholder="แสดงทุกสาขาวิชา"
                    value={graphSelectedMajors}
                    onChange={(val) => setGraphSelectedMajors(val)}
                    style={{ minWidth: 200, maxWidth: 350 }}
                    maxTagCount="responsive"
                    size="middle"
                  >
                    {majorsList.map((m) => (
                      <Select.Option key={m} value={m}>
                        {m}
                      </Select.Option>
                    ))}
                  </Select>
                </div>

                {/* ตัวกรองปีการศึกษาที่รับเข้า */}
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

                {/* ตัวกรองปีที่สำรวจ */}
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 13, color: "#475569", fontWeight: 600 }}>ปีที่สำรวจ:</span>
                  <Select
                    mode="multiple"
                    allowClear
                    placeholder="ทั้งหมด"
                    value={graphSurveyYear}
                    onChange={(val) => setGraphSurveyYear(val)}
                    style={{ minWidth: 150, maxWidth: 280 }}
                    maxTagCount="responsive"
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
                    <div style={{ fontSize: 12, color: "#64748b" }}>
                      จำแนกตามสาขาวิชา (ปีการศึกษา {graphEntryYear} / ปีที่สำรวจ {graphSurveyYear.length > 0 ? graphSurveyYear.join(", ") : "ทั้งหมด"})
                    </div>
                  </div>
                </div>

                {bachelorGraphData.length === 0 ? (
                  <div style={{ padding: "30px 0", textAlign: "center" }}>
                    <Empty description="ไม่พบข้อมูลสถิตินิสิตปริญญาตรีตามเงื่อนไขที่เลือก" />
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

                        <Bar
                          dataKey="earlyTerm"
                          name="นิสิตรับเข้า (ภาคต้น)"
                          fill="#52b2bf"
                          radius={[0, 4, 4, 0]}
                          barSize={12}
                          label={renderCustomBarLabel}
                        />

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
                    <div style={{ fontSize: 12, color: "#64748b" }}>
                      จำแนกตามสาขาวิชา (ปีการศึกษา {graphEntryYear} / ปีที่สำรวจ {graphSurveyYear.length > 0 ? graphSurveyYear.join(", ") : "ทั้งหมด"})
                    </div>
                  </div>
                </div>

                {masterGraphData.length === 0 ? (
                  <div style={{ padding: "30px 0", textAlign: "center" }}>
                    <Empty description="ไม่พบข้อมูลสถิตินิสิตปริญญาโทตามเงื่อนไขที่เลือก" />
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

                        <Bar
                          dataKey="earlyTerm"
                          name="นิสิตรับเข้า (ภาคต้น)"
                          fill="#38bdf8"
                          radius={[0, 4, 4, 0]}
                          barSize={14}
                          label={renderCustomBarLabel}
                        />

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

export default StudentPage;
