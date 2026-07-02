import { Layout, Table, Button } from "antd";
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
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

import {
  TeamOutlined,
  UserOutlined,
  TrophyOutlined,
  SearchOutlined,
  CalendarOutlined,
  RiseOutlined,
} from "@ant-design/icons";

const { Header, Content } = Layout;

function Dashboard() {
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedMajor, setSelectedMajor] = useState("");
  const [selectedTerm, setSelectedTerm] = useState(""); 
  const [searchText, setSearchText] = useState("");

  const [appliedFilters, setAppliedFilters] = useState({
    year: "",
    major: "",
    term: "",
    search: ""
  });

  const [graphSelectedYear, setGraphSelectedYear] = useState("");
  const [dashboardData, setDashboardData] = useState(null);

  // โหลดข้อมูลจาก localStorage
  const loadDashboardData = () => {
    const stored = localStorage.getItem("dashboardData");
    if (stored) {
      setDashboardData(JSON.parse(stored));
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const cleanString = (str) => {
    if (!str) return "";
    return String(str).replace(/\s+/g, '').replace(/['"]+/g, '').trim();
  };

  const extractYear = (yearStr) => {
    if (!yearStr) return "";
    const match = String(yearStr).match(/\d+/);
    return match ? match[0] : String(yearStr).trim();
  };

  // ดึงไฟล์ข้อมูลต่างๆ ออกมาจาก Dashboard Data
  const tcas = dashboardData?.["TCAS64-67"] || [];
  const retain = dashboardData?.["จำนวนนิสิตคงอยู่"] || [];
  const branchChartFile = dashboardData?.["กราาฟสาขา(in)"] || [];

  const years = useMemo(() => {
    const tcasYears = tcas.map((item) => extractYear(item["ปีการศึกษา"] || item["ปี"]));
    const retainYears = retain.map((item) => extractYear(item["ปีที่สำรวจ"] || item["ปีการศึกษาที่รับเข้า"]));
    return [...new Set([...tcasYears, ...retainYears])].filter(Boolean).sort();
  }, [tcas, retain]);

  const graphYears = useMemo(() => {
    const yearsFromFile = branchChartFile.map((item) => extractYear(item["ปีการศึกษา"] || item["ปี"] || item["ปีที่สำรวจ"]));
    const cleanYears = [...new Set(yearsFromFile)].filter(Boolean).sort();
    return cleanYears.length > 0 ? cleanYears : years;
  }, [branchChartFile, years]);

  const majors = useMemo(() => {
    const rawMajors = tcas.map(item => String(item["ชื่อสาขา"] || "").replace(/\n/g, ' ').trim());
    return [...new Set(rawMajors)].filter(Boolean).sort();
  }, [tcas]);

  const terms = useMemo(() => {
    const tcasTerms = tcas.map((item) => String(item["ภาคการศึกษา"] || "").trim());
    const retainTerms = retain.map((item) => String(item["ภาคเรียน"] || "").trim());
    return [...new Set([...tcasTerms, ...retainTerms])].filter(Boolean).sort();
  }, [tcas, retain]);

  const handleApplyFilters = () => {
    setAppliedFilters({
      year: selectedYear,
      major: selectedMajor,
      term: selectedTerm,
      search: searchText
    });
  };

  const filteredTCAS = useMemo(() => {
    return tcas.filter((item) => {
      const itemMajorClean = cleanString(item["ชื่อสาขา"]);
      const itemYearClean = extractYear(item["ปีการศึกษา"] || item["ปี"]);
      const itemTermStr = String(item["ภาคการศึกษา"] || "").trim();

      const searchMatch = !appliedFilters.search || JSON.stringify(item).toLowerCase().includes(appliedFilters.search.toLowerCase());
      const yearMatch = !appliedFilters.year || itemYearClean === appliedFilters.year;
      const termMatch = !appliedFilters.term || itemTermStr === appliedFilters.term;
      const majorMatch = !appliedFilters.major || itemMajorClean === cleanString(appliedFilters.major);

      return searchMatch && yearMatch && termMatch && majorMatch;
    });
  }, [tcas, appliedFilters]);

  const chartData = useMemo(() => {
    const groupedData = {};
    filteredTCAS.forEach((item) => {
      const rawName = String(item["ชื่อสาขา"] || "-").replace(/\n/g, ' ').trim();
      const majorKey = cleanString(item["ชื่อสาขา"]);
      if (!groupedData[majorKey]) {
        groupedData[majorKey] = { name: rawName, admitted: 0 };
      }
      groupedData[majorKey].admitted += Number(item["จำนวนรับ"] || 0);
    });
    return Object.values(groupedData).sort((a, b) => b.admitted - a.admitted);
  }, [filteredTCAS]);

  const allMajorsData = useMemo(() => {
    if (branchChartFile && branchChartFile.length > 0) {
      const filteredBranch = branchChartFile.filter(item => {
        const itemYear = extractYear(item["ปีการศึกษา"] || item["ปี"] || item["ปีที่สำรวจ"]);
        return !graphSelectedYear || itemYear === String(graphSelectedYear);
      });

      const sumMap = {};
      filteredBranch.forEach(item => {
        const rawName = String(item["ชื่อสาขา"] || "-").replace(/\n/g, ' ').trim();
        const majorKey = cleanString(item["ชื่อสาขา"]);
        const amt = Number(item["Sum of จำนวน"] || item["จำนวน"] || 0);
        if (!sumMap[majorKey]) sumMap[majorKey] = { name: rawName, count: 0 };
        sumMap[majorKey].count += amt;
      });
      return Object.values(sumMap).sort((a, b) => b.count - a.count);
    } else {
      const fallbackData = {};
      tcas.forEach(item => {
        const itemYear = extractYear(item["ปีการศึกษา"] || item["ปี"]);
        if (!graphSelectedYear || itemYear === String(graphSelectedYear)) {
          const rawName = String(item["ชื่อสาขา"] || "-").replace(/\n/g, ' ').trim();
          const majorKey = cleanString(item["ชื่อสาขา"]);
          if (!fallbackData[majorKey]) fallbackData[majorKey] = { name: rawName, count: 0 };
          fallbackData[majorKey].count += Number(item["จำนวนผู้สมัคร"] || item["จำนวน"] || 0);
        }
      });
      return Object.values(fallbackData).sort((a, b) => b.count - a.count);
    }
  }, [branchChartFile, tcas, graphSelectedYear]);

  const dynamicChartHeight = useMemo(() => {
    return Math.max(320, allMajorsData.length * 38);
  }, [allMajorsData]);

  let admitted = 0; let enrolled = 0; let retained = 0; let lecturers = 0; let graduates = 0; let totalStudents = 0;

  if (dashboardData) {
    const register = dashboardData["จำนวนนิสิตลงทะเบียน"] || [];
    const teacher = dashboardData["อาจารย์สาขา"] || [];
    const employment = dashboardData["ภาวะการมีงานทำ"] || [];

    const filteredRegister = register.filter((item) => {
      const yearMatch = !appliedFilters.year || extractYear(item["ปีการศึกษา"]) === appliedFilters.year;
      const majorMatch = !appliedFilters.major || cleanString(item["ชื่อสาขา"]) === cleanString(appliedFilters.major);
      return yearMatch && majorMatch;
    });

    totalStudents = filteredRegister.reduce((sum, item) => sum +
        Number(item["ชั้นปีที่ 1"] || 0) + Number(item["ชั้นปีที่ 2"] || 0) +
        Number(item["ชั้นปีที่ 3"] || 0) + Number(item["ชั้นปีที่ 4"] || 0) +
        Number(item["ชั้นปีที่ 5"] || 0) + Number(item["ชั้นปีที่ 6"] || 0), 0
    );

    const filteredEmployment = employment.filter((item) => {
      const yearMatch = !appliedFilters.year || extractYear(item["ปีการศึกษา"]) === appliedFilters.year;
      const majorMatch = !appliedFilters.major || cleanString(item["ชื่อสาขา"]) === cleanString(appliedFilters.major);
      return yearMatch && majorMatch;
    });
    graduates = filteredEmployment.reduce((sum, item) => sum + Number(item["ผู้สำเร็จการศึกษา"] || 0), 0);

    // 🔥 คำนวณจำนวนนิสิตคงอยู่แบบเป็นอิสระ ป้องกันค่ารวนหรือหายเมื่ออัปโหลดไฟล์อื่นผสม
    retained = retain.reduce((sum, item) => {
      const retMajor = String(item["ชื่อสาขา"] || "").replace(/\s+/g, '').trim();
      const filterMajor = appliedFilters.major ? String(appliedFilters.major).replace(/\s+/g, '').trim() : "";
      const retYear = extractYear(item["ปีที่สำรวจ"] || item["ปีการศึกษาที่รับเข้า"] || item["ปีการศึกษา"]);

      // 1. ตรวจสอบเงื่อนไขสาขาวิชา (ใช้วิธีจับคู่แบบยืดหยุ่น ป้องกันสระ/ช่องว่างคลาดเคลื่อน)
      const majorMatch = !filterMajor || retMajor.includes(filterMajor) || filterMajor.includes(retMajor);
      
      // 2. ตรวจสอบเงื่อนไขปีการศึกษา
      const yearMatch = !appliedFilters.year || retYear === appliedFilters.year;

      if (majorMatch && yearMatch) {
        let rowSum = 0;
        let hasColumnValue = false;

        // ดึงค่าจากคอลัมน์ภาคเรียนล่าสุดในตารางที่มีตัวเลข
        Object.keys(item).forEach(key => {
          if (key.includes("จำนวนนิสิตคงอยู่") && item[key] !== undefined && item[key] !== "") {
            const val = Number(item[key] || 0);
            if (val > 0) {
              rowSum = val; 
              hasColumnValue = true;
            }
          }
        });

        // หากไม่เจอหัวคอลัมน์ลักษณะข้างต้น ให้ใช้คอลัมน์มาตรฐานแบบสุทธิแทน
        if (!hasColumnValue) {
          rowSum = Number(item["จำนวน"] || item["รวม"] || item["รวมทั้งสิ้น"] || 0);
        }

        return sum + rowSum;
      }
      return sum;
    }, 0); 
    
    lecturers = teacher.filter(item => !appliedFilters.major || cleanString(item["ชื่อสาขา"]) === cleanString(appliedFilters.major)).length;
    admitted = filteredTCAS.reduce((sum, item) => sum + Number(item["จำนวนรับ"] || 0), 0);
    enrolled = filteredTCAS.reduce((sum, item) => sum + Number(item["จำนวนผู้สมัคร"] || 0), 0);
  }

  const columns = [
    { title: "ปีการศึกษา", dataIndex: "ปีการศึกษา", key: "year" },
    { title: "ภาคการศึกษา", dataIndex: "ภาคการศึกษา", key: "term" },
    { title: "สาขา", dataIndex: "ชื่อสาขา", key: "major", render: (text) => String(text || "").replace(/\n/g, ' ').trim() },
    { title: "ผู้สมัคร", dataIndex: "จำนวนผู้สมัคร", key: "applicants", render: (val) => Number(val || 0).toLocaleString() },
    { title: "จำนวนรับ", dataIndex: "จำนวนรับ", key: "admitted", render: (val) => Number(val || 0).toLocaleString() },
  ];

  const pieData = [{ name: "จำนวนรับเข้าศึกษา", value: admitted }, { name: "ผู้สมัครรวมทั้งหมด", value: enrolled }];
  const admissionRate = enrolled > 0 ? ((admitted / enrolled) * 100).toFixed(2) : 0;
  const retentionRate = totalStudents > 0 ? ((retained / totalStudents) * 100).toFixed(2) : 0;
  const graduationRate = totalStudents > 0 ? ((graduates / totalStudents) * 100).toFixed(2) : 0;

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sidebar />
      <Layout>
        <Header style={{ background: "white", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 20px", height: "auto", lineHeight: "normal" }}>
          <div style={{ paddingTop: 10 }}>
            <h2 style={{ margin: 0 }}>University Dashboard</h2>
            <div style={{ color: "#888", fontSize: 13 }}>ระบบวิเคราะห์ข้อมูลมหาวิทยาลัยรวมทุกแผ่นงาน</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div>Admin Dashboard</div>
            <div style={{ color: "#888", fontSize: 12 }}>{new Date().toLocaleDateString()}</div>
          </div>
        </Header>

        <Content style={{ padding: "16px 32px 32px 32px", background: "#f5f5f5" }}>
          
          {/* FILTER ZONE PRINCIPAL */}
          <div style={{ background: "#fff", padding: 24, borderRadius: 20, marginBottom: 24, boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
            <input
              type="text"
              placeholder="ค้นหาด่วนเจาะลึกข้อมูลในตารางรายละเอียด..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: "100%", padding: 14, borderRadius: 12, border: "1px solid #d9d9d9", marginBottom: 20, fontSize: 16 }}
            />

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20, marginBottom: 20 }}>
              <div>
                <div style={{ marginBottom: 8, fontWeight: 600 }}>ปีการศึกษา</div>
                <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} style={{ width: "100%", padding: 12, borderRadius: 10, border: "1px solid #d9d9d9" }}>
                  <option value="">ทั้งหมด (รวมทุกปี)</option>
                  {years.map((year) => <option key={year} value={year}>{year}</option>)}
                </select>
              </div>

              <div>
                <div style={{ marginBottom: 8, fontWeight: 600 }}>ภาคการศึกษา</div>
                <select value={selectedTerm} onChange={(e) => setSelectedTerm(e.target.value)} style={{ width: "100%", padding: 12, borderRadius: 10, border: "1px solid #d9d9d9" }}>
                  <option value="">ทั้งหมด</option>
                  {terms.map((term) => <option key={term} value={term}>{term}</option>)}
                </select>
              </div>

              <div>
                <div style={{ marginBottom: 8, fontWeight: 600 }}>สาขาวิชา</div>
                <select value={selectedMajor} onChange={(e) => setSelectedMajor(e.target.value)} style={{ width: "100%", padding: 12, borderRadius: 10, border: "1px solid #d9d9d9" }}>
                  <option value="">ทั้งหมด</option>
                  {majors.map((major) => <option key={major} value={major}>{major}</option>)}
                </select>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <Button type="primary" size="large" icon={<SearchOutlined />} onClick={handleApplyFilters} style={{ height: 45, borderRadius: 10, padding: "0 32px", fontSize: 15, fontWeight: 500 }}>
                ยืนยันและค้นหาข้อมูล
              </Button>
            </div>
          </div>

          {/* KPI ZONE */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 20, marginTop: 20 }}>
            <div style={{ background: "#e6f7ff", borderRadius: 16, padding: 24, height: 160, boxShadow: "0 2px 8px rgba(0,0,0,0.04)", border: "1px solid #91d5ff" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div>
                  <h3 style={{ color: "#0050b3", margin: "0 0 12px 0" }}>นิสิตรับเข้า (ปี {appliedFilters.year || "ทั้งหมด"})</h3>
                  <h1 style={{ color: "#0050b3", fontSize: 36, fontWeight: 700, margin: 0 }}>{admitted.toLocaleString()}</h1>
                  <p style={{ marginTop: 8, color: "#8c8c8c", fontSize: 13 }}>คน</p>
                </div>
                <RiseOutlined style={{ fontSize: 50, color: "#69c0ff", marginTop: 5 }} />
              </div>
            </div>

            <div style={{ background: "#f6ffed", borderRadius: 16, padding: 24, height: 160, boxShadow: "0 2px 8px rgba(0,0,0,0.04)", border: "1px solid #b7eb8f" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div>
                  <h3 style={{ color: "#389e0d", margin: "0 0 12px 0" }}>นิสิตคงอยู่</h3>
                  <h1 style={{ color: "#389e0d", fontSize: 36, fontWeight: 700, margin: 0 }}>{retained.toLocaleString()}</h1>
                  <p style={{ marginTop: 8, color: "#8c8c8c", fontSize: 13 }}>คน {retain.length === 0 ? "(ไม่พบไฟล์ข้อมูล)" : "(เชื่อมต่อข้อมูลแล้ว)"}</p>
                </div>
                <TeamOutlined style={{ fontSize: 50, color: "#95de64", marginTop: 5 }} />
              </div>
            </div>

            <div style={{ background: "#f9f0ff", borderRadius: 16, padding: 24, height: 160, boxShadow: "0 2px 8px rgba(0,0,0,0.04)", border: "1px solid #d3adf7" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div>
                  <h3 style={{ color: "#531dab", margin: "0 0 12px 0" }}>นิสิตจบการศึกษา</h3>
                  <h1 style={{ color: "#531dab", fontSize: 36, fontWeight: 700, margin: 0 }}>{graduates.toLocaleString()}</h1>
                  <p style={{ marginTop: 8, color: "#8c8c8c", fontSize: 13 }}>คน (จากภาวะการมีงานทำ)</p>
                </div>
                <TrophyOutlined style={{ fontSize: 50, color: "#b37feb", marginTop: 5 }} />
              </div>
            </div>

            <div style={{ background: "#fff7e6", borderRadius: 16, padding: 24, height: 160, boxShadow: "0 2px 8px rgba(0,0,0,0.04)", border: "1px solid #ffd591" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div>
                  <h3 style={{ color: "#d46b08", margin: "0 0 12px 0" }}>อาจารย์ทั้งหมด</h3>
                  <h1 style={{ color: "#d46b08", fontSize: 36, fontWeight: 700, margin: 0 }}>{lecturers.toLocaleString()}</h1>
                  <p style={{ marginTop: 8, color: "#8c8c8c", fontSize: 13 }}>คน (ตามเงื่อนไขสาขาที่เลือก)</p>
                </div>
                <UserOutlined style={{ fontSize: 50, color: "#ffb74d", marginTop: 5 }} />
              </div>
            </div>
          </div>

          {/* BOX GRAPH & SUMMARY LIST */}
          <div style={{ background: "white", borderRadius: 16, padding: 24, marginTop: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
              <h2 style={{ margin: 0 }}>สถิติจำนวนนิสิตรวมสะสมแยกตามสาขาวิชาทั้งหมด</h2>
              <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#f9fafb", padding: "6px 12px", borderRadius: 10, border: "1px solid #e5e7eb" }}>
                <CalendarOutlined style={{ color: "#3b82f6" }} />
                <span style={{ fontSize: 13, fontWeight: 500, color: "#4b5563" }}>ปีการศึกษา:</span>
                <select value={graphSelectedYear} onChange={(e) => setGraphSelectedYear(e.target.value)} style={{ background: "transparent", border: "none", fontSize: 13, fontWeight: 600, color: "#1f2937", cursor: "pointer", outline: "none" }}>
                  <option value="">ทั้งหมด (สรุปรวมทุกปี)</option>
                  {graphYears.map((year) => <option key={year} value={year}>{year}</option>)}
                </select>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "65% 35%", gap: 24, alignItems: "start" }}>
              <div style={{ minHeight: dynamicChartHeight }}>
                <ResponsiveContainer width="100%" height={dynamicChartHeight}>
                  <BarChart data={allMajorsData} layout="vertical" margin={{ left: 50, right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                    <XAxis type="number" axisLine={false} tickLine={false} />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={150} style={{ fontSize: 11 }} />
                    <Tooltip contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }} />
                    <Bar dataKey="count" name="จำนวนนิสิต" fill="#3b82f6" radius={[0, 8, 8, 0]} barSize={16} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div style={{ borderLeft: "1px solid #f0f0f0", paddingLeft: 24, paddingRight: 18, maxHeight: dynamicChartHeight, overflowY: "auto" }}>
                {allMajorsData.map((item, index) => (
                  <div key={item.name} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: index !== allMajorsData.length - 1 ? "1px solid #f5f5f5" : "none" }}>
                    <span style={{ fontSize: 13, color: "#555", paddingRight: 8 }}>{index + 1}. {item.name}</span>
                    <strong style={{ color: "#3b82f6", whiteSpace: "nowrap" }}>{item.count.toLocaleString()} คน</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* สรุปภาพรวมสัดส่วนมหาวิทยาลัย */}
          <div style={{ background: "white", borderRadius: 16, padding: 24, marginTop: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
            <h2 style={{ marginBottom: 20 }}>สรุปภาพรวมสัดส่วนมหาวิทยาลัย</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 20 }}>
              <div style={{ background: "#fafafa", padding: 16, borderRadius: 12, border: "1px solid #f0f0f0" }}><h4 style={{ color: "#22c55e", margin: 0 }}>อัตราการคงอยู่ของนิสิต</h4><h2 style={{ margin: "8px 0 0 0" }}>{retentionRate}%</h2></div>
              <div style={{ background: "#fafafa", padding: 16, borderRadius: 12, border: "1px solid #f0f0f0" }}><h4 style={{ color: "#3b82f6", margin: 0 }}>อัตราสำเร็จการศึกษา</h4><h2 style={{ margin: "8px 0 0 0" }}>{graduationRate}%</h2></div>
              <div style={{ background: "#fafafa", padding: 16, borderRadius: 12, border: "1px solid #f0f0f0" }}><h4 style={{ color: "#f59e0b", margin: 0 }}>นิสิตสำเร็จการศึกษาทั้งหมด</h4><h2 style={{ margin: "8px 0 0 0" }}>{graduates.toLocaleString()} คน</h2></div>
              <div style={{ background: "#fafafa", padding: 16, borderRadius: 12, border: "1px solid #f0f0f0" }}><h4 style={{ color: "#ef4444", margin: 0 }}>อัตราการแข่งขันเข้าศึกษา</h4><h2 style={{ margin: "8px 0 0 0" }}>{admissionRate}%</h2></div>
            </div>
          </div>

          {/* สัดส่วนภาพรวมอื่นๆ */}
          <div style={{ display: "grid", gridTemplateColumns: "40% 60%", gap: 20, marginTop: 24 }}>
            {/* 🛠️ จุดที่ปรับแต่ง: ดีไซน์บล็อกสัดส่วนผู้สมัครและจำนวนรับใหม่ ให้ดูสวยงาม นุ่มนวล และอ่านง่ายขึ้น */}
            <div style={{ background: "white", padding: 24, borderRadius: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.05)", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div>
                <h2 style={{ margin: "0 0 4px 0" }}>สัดส่วนผู้สมัครและจำนวนรับ</h2>
                <div style={{ fontSize: 13, color: "#64748b", marginBottom: 10 }}>การเปรียบเทียบแผนการรับและปริมาณผู้สนใจเข้าศึกษา</div>
              </div>
              
              <div style={{ height: 240, position: "relative" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie 
                      data={pieData} 
                      dataKey="value" 
                      nameKey="name" 
                      innerRadius={68} 
                      outerRadius={90} 
                      paddingAngle={5}
                      cx="50%"
                      cy="50%"
                    >
                      <Cell fill="#3b82f6" style={{ outline: "none" }} />
                      <Cell fill="#10b981" style={{ outline: "none" }} />
                    </Pie>
                    <Tooltip 
                      contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 16px rgba(0,0,0,0.08)" }} 
                      formatter={(value) => [`${Number(value).toLocaleString()} คน`, ""]} 
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* เพิ่มตัวเลขอัตราส่วนไว้ตรงกลางของ Donut Chart เพื่อความพรีเมียม */}
                <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", textAlign: "center", pointerEvents: "none" }}>
                  <div style={{ fontSize: 12, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5 }}>สัดส่วนรับเข้า</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: "#1e293b", marginTop: 2 }}>{admissionRate}%</div>
                </div>
              </div>

              {/* ปรับปรุงดีไซน์ Legend ด้านล่างกราฟให้เป็นระเบียบ เป็นสัดส่วน และอ่านง่ายขึ้นชัดเจน */}
              <div style={{ display: "flex", justifyContent: "space-around", borderTop: "1px solid #f1f5f9", paddingTop: 16, marginTop: 10 }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontSize: 13, color: "#475569" }}>
                    <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#3b82f6", display: "inline-block" }}></span>
                    จำนวนรับเข้าศึกษา
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: "#1e293b", marginTop: 4 }}>{admitted.toLocaleString()} <span style={{ fontSize: 12, fontWeight: 400, color: "#64748b" }}>คน</span></div>
                </div>
                <div style={{ style: "solid", borderLeft: "1px solid #e2e8f0" }}></div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontSize: 13, color: "#475569" }}>
                    <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#10b981", display: "inline-block" }}></span>
                    ผู้สมัครรวมทั้งหมด
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: "#1e293b", marginTop: 4 }}>{enrolled.toLocaleString()} <span style={{ fontSize: 12, fontWeight: 400, color: "#64748b" }}>คน</span></div>
                </div>
              </div>
            </div>

            <div style={{ background: "white", padding: 24, borderRadius: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
              <h2>แนวโน้มการรับนิสิตตามสาขา (TCAS)</h2>
              <div style={{ height: 300, marginTop: 15 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} style={{ fontSize: 10, fill: "#64748b" }} angle={-15} textAnchor="end" interval={0} />
                    <YAxis axisLine={false} tickLine={false} style={{ fontSize: 11, fill: "#64748b" }} />
                    <Tooltip contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }} />
                    <Bar dataKey="admitted" name="จำนวนรับ" fill="#6366f1" radius={[6, 6, 0, 0]} barSize={24} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div style={{ background: "white", padding: 24, borderRadius: 16, marginTop: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
            <h2>รายละเอียดข้อมูลแผนการรับรายรอบ (TCAS)</h2>
            <Table columns={columns} dataSource={filteredTCAS} rowKey={(record, index) => index} pagination={{ pageSize: 10 }} scroll={{ x: true }} />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
}

export default Dashboard;
