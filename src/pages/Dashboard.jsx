import { Layout, Button, Empty, Progress, Card, Row, Col } from "antd"; 
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
  Legend,
  LabelList,
} from "recharts";

import {
  TeamOutlined,
  UserOutlined,
  TrophyOutlined,
  SearchOutlined,
  UserAddOutlined,
  BarChartOutlined,
  ReadOutlined,
  CrownOutlined,
} from "@ant-design/icons";

const { Header, Content } = Layout;

function Dashboard() {
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedMajor, setSelectedMajor] = useState("");

  // 📊 ฟิลเตอร์สำหรับแผนภูมิแท่ง
  const [graphEntryYear, setGraphEntryYear] = useState(""); 
  const [graphSurveyYear, setGraphSurveyYear] = useState(""); 

  // ปรับเหลือเฉพาะ Filter ปี และ สาขา
  const [appliedFilters, setAppliedFilters] = useState({
    year: "",
    major: ""
  });

  const [dashboardData, setDashboardData] = useState(null);

  const loadDashboardData = () => {
    const stored = localStorage.getItem("dashboardData");
    if (stored) {
      try {
        setDashboardData(JSON.parse(stored));
      } catch (e) {
        console.error("Error parsing dashboard data", e);
      }
    }
  };

  useEffect(() => {
    loadDashboardData();
    window.addEventListener("storage", loadDashboardData);
    return () => window.removeEventListener("storage", loadDashboardData);
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
    return name;
  };

  const extractYear = (yearStr) => {
    if (!yearStr) return "";
    const match = String(yearStr).match(/\d+/);
    return match ? match[0] : String(yearStr).trim();
  };

  const retain = useMemo(() => {
    if (!dashboardData) return [];
    return dashboardData["นิสิตคงอยู่"] || dashboardData["ข้อมูลนิสิตคงอยู่"] || dashboardData["จำนวนนิสิตคงอยู่"] || [];
  }, [dashboardData]);

  const entryYears = useMemo(() => {
    const list = retain.map(item => extractYear(item["ปีการศึกษาที่รับเข้า"] || item["ปีการศึกษา"]));
    return [...new Set(list)].filter(Boolean).sort().reverse();
  }, [retain]);

  const surveyYears = useMemo(() => {
    const list = retain.map(item => extractYear(item["ปีที่สำรวจ"]));
    return [...new Set(list)].filter(Boolean).sort().reverse();
  }, [retain]);

  // ตั้งค่า Default เลือกปีล่าสุดให้ฟิลเตอร์แผนภูมิเมื่อโหลดหน้าแรก
  useEffect(() => {
    if (entryYears.length > 0 && !graphEntryYear) {
      setGraphEntryYear(entryYears[0]);
    }
    if (surveyYears.length > 0 && !graphSurveyYear) {
      setGraphSurveyYear(surveyYears[0]);
    }
  }, [entryYears, surveyYears, graphEntryYear, graphSurveyYear]);

  const years = useMemo(() => {
    const retainYears = retain.map((item) => extractYear(item["ปีที่สำรวจ"] || item["ปีการศึกษาที่รับเข้า"]));
    return [...new Set(retainYears)].filter(Boolean).sort();
  }, [retain]);

  const majors = useMemo(() => {
    const rawMajors = retain.map(item => cleanMajorName(item["ชื่อสาขา"] || item["สาขาวิชา"] || item["สาขา"]));
    return [...new Set(rawMajors)].filter(Boolean).sort();
  }, [retain]);

  const handleApplyFilters = () => {
    setAppliedFilters({ year: selectedYear, major: selectedMajor });
  };

  // ==========================================
  // 🎯 LOGIC คำนวณอัตราภาวะการมีงานทำ (ปรับปรุงสูตรใหม่ตาม DAX)
  // ==========================================
  const employmentTotals = useMemo(() => {
    if (!dashboardData) return { rate: 0, employmentPerRespondentsRate: 0 };

    const targetKey = Object.keys(dashboardData).find(key => 
      key.includes("งานทำ") || key.includes("Employment")
    );
    const empData = targetKey ? dashboardData[targetKey] : [];

    const processed = empData
      .filter(item => {
        const majorName = String(item["ชื่อสาขา"] || "");
        return majorName && !majorName.includes("ทั้งหมด");
      })
      .map(item => {
        const year = extractYear(item["ปีการศึกษา"] || item["ปี"]);
        const majorRaw = String(item["ชื่อสาขา"] || item["สาขาวิชา"] || "").replace(/\n/g, ' ').trim();
        const majorClean = cleanString(cleanMajorName(majorRaw));

        const getVal = (exactKey) => {
          const foundKey = Object.keys(item).find(k => cleanString(k) === cleanString(exactKey));
          return foundKey ? Number(item[foundKey] || 0) : 0;
        };

        const respondents = getVal("ผู้บันทึกข้อมูลจำนวน") || getVal("ผู้สำเร็จการศึกษา"); 
        const gov = getVal("ทำงานในหน่วยงานรัฐ จำนวน");
        const state = getVal("ทำงานในหน่วยงานรัฐวิสาหกิจ จำนวน");
        const privateOrg = getVal("ทำงานในหน่วยงานเอกชน จำนวน");
        const inter = getVal("ทำงานในองค์การต่างประเทศ/ระหว่างประเทศ จำนวน");
        const otherOrg = getVal("ทำงานในองค์กรอื่นๆ จำนวน");
        
        const employedStaff = gov + state + privateOrg + inter + otherOrg;
        const selfEmployed = getVal("ทำงาน ธุรกิจส่วนตัว/อิสระ จำนวน");

        const hasJobBefore = getVal("มีงานทำเดิม");
        const studyMore = getVal("ศึกษาต่อ");
        const ordain = getVal("บัณฑิตบวช");
        const military = getVal("บัณฑิตเกณฑ์ทหาร");
        const excluded = hasJobBefore + studyMore + ordain + military;

        const employedStaffAndSelf = employedStaff + selfEmployed;

        return {
          year,
          majorClean,
          respondents,
          employedStaff,
          employedStaffAndSelf,
          excluded
        };
      })
      .filter(item => {
        if (appliedFilters.year && item.year !== appliedFilters.year) return false;
        if (appliedFilters.major && item.majorClean !== cleanString(appliedFilters.major)) return false;
        return true;
      });

    let totalRespondents = 0;
    let totalEmployedStaff = 0;
    let totalEmployedStaffAndSelf = 0;
    let totalExcluded = 0;

    processed.forEach(item => {
      totalRespondents += item.respondents;
      totalEmployedStaff += item.employedStaff;
      totalEmployedStaffAndSelf += item.employedStaffAndSelf;
      totalExcluded += item.excluded;
    });

    const totalDivisor = totalRespondents - totalExcluded;
    const finalRate = totalDivisor > 0 ? (totalEmployedStaffAndSelf / totalDivisor) * 100 : 0;
    const employmentPerRespondentsRate = totalRespondents > 0 ? (totalEmployedStaff / totalRespondents) * 100 : 0;

    return {
      rate: Number(finalRate.toFixed(2)),
      employmentPerRespondentsRate: Number(employmentPerRespondentsRate.toFixed(2))
    };
  }, [dashboardData, appliedFilters]);

  // 📊 คำนวณสถิติต่างๆ รวมทั้งแยก ปริญญาตรี และ ปริญญาโท
  const studentBreakdown = useMemo(() => {
    let admitted = 0;
    let retained = 0;
    let bachelorAdmitted = 0;
    let bachelorRetained = 0;
    let masterAdmitted = 0;
    let masterRetained = 0;
    let lecturers = 0;
    let graduates = 0;

    if (dashboardData) {
      // ดึงข้อมูลอาจารย์ครอบคลุมทุก Key
      const teacher = 
        dashboardData["ข้อมูลอาจารย์"] || 
        dashboardData["อาจารย์สาขา"] || 
        dashboardData["อาจารย์"] || 
        [];

      const employment = dashboardData["ภาวะการมีงานทำ"] || [];
      
      const filteredEmployment = employment.filter((item) => {
        const yearMatch = !appliedFilters.year || extractYear(item["ปีการศึกษา"]) === appliedFilters.year;
        const majorMatch = !appliedFilters.major || cleanString(cleanMajorName(item["ชื่อสาขา"])) === cleanString(appliedFilters.major);
        return yearMatch && majorMatch;
      });
      graduates = filteredEmployment.reduce((sum, item) => sum + Number(item["ผู้สำเร็จการศึกษา"] || 0), 0);

      retain.forEach((item) => {
        const retMajorClean = cleanMajorName(item["ชื่อสาขา"] || item["สาขาวิชา"] || item["สาขา"]);
        const retYear = extractYear(item["ปีที่สำรวจ"] || item["ปีการศึกษาที่รับเข้า"]);
        const retTerm = String(item["ภาคเรียน"] || item["ภาคการศึกษา"] || "").trim();
        const amt = Number(item["จำนวน"] || item["รวม"] || 0);
        const code = String(item["รหัสสาขา"] || "").trim().toUpperCase();

        const majorMatch = !appliedFilters.major || cleanString(retMajorClean) === cleanString(appliedFilters.major);
        const yearMatch = !appliedFilters.year || retYear === appliedFilters.year;

        if (majorMatch && yearMatch) {
          const isMaster = code.startsWith("X");

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

      // คำนวณจำนวนอาจารย์ประจำสาขา
      const validTeachers = teacher.filter(item => {
        const teacherMajor = cleanMajorName(item["ชื่อสาขา"] || item["สาขาวิชา"] || item["สาขา"]);
        const name = item["ชื่อ นามสกุล"] || item["ชื่อ-นามสกุล"] || item["ชื่ออาจารย์"] || item["ชื่อ"] || "";
        const cleanName = String(name).trim();

        const majorMatch = !appliedFilters.major || cleanString(teacherMajor) === cleanString(appliedFilters.major);
        if (!majorMatch) return false;

        const isValid = cleanName !== "" && cleanName !== "-" && !cleanName.includes("รวม") && !cleanName.includes("จำนวน");
        return isValid;
      });

      const uniqueTeacherNames = new Set(
        validTeachers.map(item => {
          const name = item["ชื่อ นามสกุล"] || item["ชื่อ-นามสกุล"] || item["ชื่ออาจารย์"] || item["ชื่อ"] || "";
          return String(name).replace(/\s+/g, '').trim();
        })
      );

      lecturers = uniqueTeacherNames.size;
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
  }, [dashboardData, retain, appliedFilters]);

  const pairedGraphData = useMemo(() => {
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
    return Object.values(grouped).sort((a, b) => b.earlyTerm - a.earlyTerm);
  }, [retain, graphEntryYear, graphSurveyYear]);

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sidebar />
      <Layout>
        <Header style={{ background: "white", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 24px", height: "auto", borderBottom: "1px solid #f0f0f0" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <h2 style={{ margin: 0, fontSize: "20px", fontWeight: "600", color: "#1f1f1f", lineHeight: "1.2" }}>
              University Dashboard
            </h2>
            <div style={{ color: "#8c8c8c", fontSize: "13px", lineHeight: "1.4", margin: 0 }}>
              ระบบวิเคราะห์สถิตินิสิตประจำปี เปรียบเทียบข้อมูลภาคเรียนแบบเรียลไทม์
            </div>
          </div>
        </Header>

        <Content style={{ padding: "24px 32px 32px 32px", background: "#f5f5f5" }}>
          
          {/* FILTER ZONE Main */}
          <div style={{ background: "#fff", padding: 24, borderRadius: 20, marginBottom: 24, boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
              <div>
                <div style={{ marginBottom: 8, fontWeight: 600 }}>ปีการศึกษา</div>
                <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} style={{ width: "100%", padding: 12, borderRadius: 10, border: "1px solid #d9d9d9", outline: "none" }}>
                  <option value="">ทั้งหมด</option>
                  {years.map((year) => <option key={year} value={year}>ปี {year}</option>)}
                </select>
              </div>
              <div>
                <div style={{ marginBottom: 8, fontWeight: 600 }}>สาขาวิชา</div>
                <select value={selectedMajor} onChange={(e) => setSelectedMajor(e.target.value)} style={{ width: "100%", padding: 12, borderRadius: 10, border: "1px solid #d9d9d9", outline: "none" }}>
                  <option value="">ทั้งหมด</option>
                  {majors.map((major) => <option key={major} value={major}>{major}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <Button type="primary" size="large" icon={<SearchOutlined />} onClick={handleApplyFilters} style={{ height: 42, borderRadius: 10 }}>ยืนยันและประมวลผลสถิติ</Button>
            </div>
          </div>

          {/* KPI ZONE */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 20, marginBottom: 16 }}>
            <div style={{ background: "#e6f7ff", borderRadius: 16, padding: 24, border: "1px solid #91d5ff" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h4 style={{ color: "#0050b3", margin: 0, fontWeight: 500 }}>นิสิตรับเข้า (ภาคต้น)</h4>
                <UserAddOutlined style={{ fontSize: 20, color: "#0050b3" }} />
              </div>
              <h1 style={{ color: "#0050b3", fontSize: 28, margin: "8px 0 0 0", fontWeight: 700 }}>{studentBreakdown.admitted.toLocaleString()} <span style={{ fontSize: 14, fontWeight: "normal", color: "#8c8c8c" }}>คน</span></h1>
            </div>

            <div style={{ background: "#f6ffed", borderRadius: 16, padding: 24, border: "1px solid #b7eb8f" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h4 style={{ color: "#389e0d", margin: 0, fontWeight: 500 }}>นิสิตคงอยู่ (ภาคปลาย)</h4>
                <TeamOutlined style={{ fontSize: 20, color: "#389e0d" }} />
              </div>
              <h1 style={{ color: "#389e0d", fontSize: 28, margin: "8px 0 0 0", fontWeight: 700 }}>{studentBreakdown.retained.toLocaleString()} <span style={{ fontSize: 14, fontWeight: "normal", color: "#8c8c8c" }}>คน</span></h1>
            </div>

            <div style={{ background: "#fff7e6", borderRadius: 16, padding: 24, border: "1px solid #ffd591" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h4 style={{ color: "#d46b08", margin: 0, fontWeight: 500 }}>อาจารย์ประจำสาขา</h4>
                <UserOutlined style={{ fontSize: 20, color: "#d46b08" }} />
              </div>
              <h1 style={{ color: "#d46b08", fontSize: 28, margin: "8px 0 0 0", fontWeight: 700 }}>{studentBreakdown.lecturers.toLocaleString()} <span style={{ fontSize: 14, fontWeight: "normal", color: "#8c8c8c" }}>ท่าน</span></h1>
            </div>

            <div style={{ background: "#f9f0ff", borderRadius: 16, padding: 24, border: "1px solid #d3adf7" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h4 style={{ color: "#531dab", margin: 0, fontWeight: 500 }}>ผู้สำเร็จการศึกษา</h4>
                <TrophyOutlined style={{ fontSize: 20, color: "#531dab" }} />
              </div>
              <h1 style={{ color: "#531dab", fontSize: 28, margin: "8px 0 0 0", fontWeight: 700 }}>{studentBreakdown.graduates.toLocaleString()} <span style={{ fontSize: 14, fontWeight: "normal", color: "#8c8c8c" }}>คน</span></h1>
            </div>
          </div>

          {/* 🎓 จำแนกระดับการศึกษา */}
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24} md={12}>
              <div style={{ background: "#ffffff", padding: 20, borderRadius: 16, border: "1px solid #0284c7", boxShadow: "0 2px 8px rgba(2, 132, 199, 0.08)", position: "relative" }}>
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
                    <div style={{ background: "#f0f9ff", padding: 12, borderRadius: 10, border: "1px solid #bae6fd" }}>
                      <div style={{ fontSize: 11, color: "#0369a1" }}>ภาคต้น (รับเข้า)</div>
                      <div style={{ fontSize: 22, fontWeight: "bold", color: "#0284c7" }}>
                        {studentBreakdown.bachelorAdmitted.toLocaleString()} <span style={{ fontSize: 12, fontWeight: "normal" }}>คน</span>
                      </div>
                    </div>
                  </Col>
                  <Col span={12}>
                    <div style={{ background: "#f0fdf4", padding: 12, borderRadius: 10, border: "1px solid #bbf7d0" }}>
                      <div style={{ fontSize: 11, color: "#15803d" }}>ภาคปลาย (คงอยู่)</div>
                      <div style={{ fontSize: 22, fontWeight: "bold", color: "#16a34a" }}>
                        {studentBreakdown.bachelorRetained.toLocaleString()} <span style={{ fontSize: 12, fontWeight: "normal" }}>คน</span>
                      </div>
                    </div>
                  </Col>
                </Row>
              </div>
            </Col>

            <Col xs={24} md={12}>
              <div style={{ background: "#ffffff", padding: 20, borderRadius: 16, border: "1px solid #7c3aed", boxShadow: "0 2px 8px rgba(124, 58, 237, 0.08)", position: "relative" }}>
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
                    <div style={{ background: "#f5f3ff", padding: 12, borderRadius: 10, border: "1px solid #ddd6fe" }}>
                      <div style={{ fontSize: 11, color: "#6d28d9" }}>ภาคต้น (รับเข้า)</div>
                      <div style={{ fontSize: 22, fontWeight: "bold", color: "#7c3aed" }}>
                        {studentBreakdown.masterAdmitted.toLocaleString()} <span style={{ fontSize: 12, fontWeight: "normal" }}>คน</span>
                      </div>
                    </div>
                  </Col>
                  <Col span={12}>
                    <div style={{ background: "#fdf4ff", padding: 12, borderRadius: 10, border: "1px solid #f5d0fe" }}>
                      <div style={{ fontSize: 11, color: "#a21caf" }}>ภาคปลาย (คงอยู่)</div>
                      <div style={{ fontSize: 22, fontWeight: "bold", color: "#c026d3" }}>
                        {studentBreakdown.masterRetained.toLocaleString()} <span style={{ fontSize: 12, fontWeight: "normal" }}>คน</span>
                      </div>
                    </div>
                  </Col>
                </Row>
              </div>
            </Col>
          </Row>

          {/* 📊 PROGRESS CIRCLES ZONE */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
            <Card style={{ borderRadius: 16, textAlign: "center", border: "1px solid #bae6fd", boxShadow: "0 4px 15px rgba(2, 132, 199, 0.03)" }}>
              <h4 style={{ color: "#0284c7", fontSize: 14, fontWeight: 700, margin: "0 0 4px 0" }}>อัตราการมีงานทำรวม (DAX)</h4>
              <div style={{ color: "#64748b", fontSize: 12, marginBottom: 16 }}>รวมงานอิสระ / หักลบกลุ่มเรียนต่อ/เกณฑ์ทหาร/อุปสมบท</div>
              <Progress 
                type="circle" 
                percent={employmentTotals.rate} 
                strokeColor="#0284c7"
                size={120}
                strokeWidth={9}
              />
              <div style={{ marginTop: 12, color: "#475569", fontSize: 13, fontWeight: 500 }}>วิธีคำนวณ บัณฑิตที่ได้งานทำ + ประกอบอาชีพอิสระ ÷ ผู้ตอบแบบสำรวจ (ไม่รวมผู้มีงานทำเดิม ศึกษาต่อ อุปสมบท เกณฑ์ทหาร)</div>
            </Card>

            <Card style={{ borderRadius: 16, textAlign: "center", border: "1px solid #a7f3d0", boxShadow: "0 4px 15px rgba(16, 185, 129, 0.03)" }}>
              <h4 style={{ color: "#059669", fontSize: 14, fontWeight: 700, margin: "0 0 4px 0" }}>บัณฑิตระดับปริญญาตรีที่ได้งานทำ</h4>
              <div style={{ color: "#64748b", fontSize: 12, marginBottom: 16 }}>ภายใน 1 ปีหลังสำเร็จการศึกษา</div>
              <Progress 
                type="circle" 
                percent={employmentTotals.employmentPerRespondentsRate} 
                strokeColor="#10b981"
                size={120}
                strokeWidth={9}
              />
              <div style={{ marginTop: 12, color: "#475569", fontSize: 13, fontWeight: 500 }}>วิธีคำนวณ คำนวณจากบัณฑิตที่ได้งานทำ ÷ บัณฑิตที่ตอบแบบสำรวจทั้งหมด(ไม่หักกลุ่มใดออก)</div>
            </Card>
          </div>

          {/* แผนภูมิแท่งเปรียบเทียบจำนวนนิสิต */}
          <div style={{ background: "white", borderRadius: 16, padding: 24, marginBottom: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <BarChartOutlined style={{ fontSize: 18, color: "#1890ff" }} />
                <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>กราฟเปรียบเทียบจำนวนนิสิต จำแนกตามสาขาวิชา</h2>
              </div>
              
              <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontWeight: 500, color: "#666", fontSize: 13 }}>ปีการศึกษา:</span>
                  <select value={graphEntryYear} onChange={(e) => setGraphEntryYear(e.target.value)} style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid #d9d9d9", fontWeight: 600, color: "#1890ff", cursor: "pointer", outline: "none" }}>
                    {entryYears.map(year => <option key={year} value={year}>{year}</option>)}
                  </select>
                </div>
                
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontWeight: 500, color: "#666", fontSize: 13 }}>ปีที่สำรวจ:</span>
                  <select value={graphSurveyYear} onChange={(e) => setGraphSurveyYear(e.target.value)} style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid #d9d9d9", fontWeight: 600, color: "#1890ff", cursor: "pointer", outline: "none" }}>
                    {surveyYears.map(year => <option key={year} value={year}>{year}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {pairedGraphData.length === 0 ? <Empty description="ไม่พบข้อมูลนิสิตที่ตรงกับเงื่อนไขปีการศึกษาและปีที่สำรวจที่เลือก" /> : (
              <div style={{ height: 500 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={pairedGraphData} layout="vertical" margin={{ left: 40, right: 60, top: 10, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                    <XAxis type="number" axisLine={false} tickLine={false} />
                    <YAxis dataKey="name" type="category" width={180} axisLine={false} tickLine={false} style={{ fontSize: 12, fontWeight: 500 }} />
                    <Tooltip formatter={(value) => [`${value.toLocaleString()} คน`, 'จำนวนนิสิต']} cursor={{ fill: '#f8fafc' }} />
                    <Legend verticalAlign="top" height={36} />
                    
                    <Bar dataKey="earlyTerm" name="นิสิตรับเข้า (ภาคต้น)" fill="#74c0c6" radius={[0, 4, 4, 0]} barSize={14}>
                      <LabelList dataKey="earlyTerm" position="right" style={{ fontSize: 11, fontWeight: 'bold', fill: '#475569' }} dx={5} formatter={(v) => v > 0 ? v.toLocaleString() : ''} />
                    </Bar>
                    
                    <Bar dataKey="lateTerm" name="นิสิตคงอยู่ (ภาคปลาย)" fill="#5a8bba" radius={[0, 4, 4, 0]} barSize={14}>
                      <LabelList dataKey="lateTerm" position="right" style={{ fontSize: 11, fontWeight: 'bold', fill: '#475569' }} dx={5} formatter={(v) => v > 0 ? v.toLocaleString() : ''} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

        </Content>
      </Layout>
    </Layout>
  );
}

export default Dashboard;
