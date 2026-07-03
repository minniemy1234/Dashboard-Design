import { Layout, Table, Button, Card, Empty } from "antd";
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
  LabelList,
} from "recharts";

import {
  TeamOutlined,
  UserOutlined,
  TrophyOutlined,
  SearchOutlined,
  UserAddOutlined,
  BarChartOutlined,
} from "@ant-design/icons";

const { Header, Content } = Layout;

function Dashboard() {
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedMajor, setSelectedMajor] = useState("");
  const [searchText, setSearchText] = useState("");

  // ฟิลเตอร์ปีของกราฟย่อยทั้งสองตัว (ทำงานอิสระเลือกเองที่ตัวกราฟ)
  const [graphSurveyYear, setGraphSurveyYear] = useState("");
  const [graphAdmitYear, setGraphAdmitYear] = useState(""); 

  const [appliedFilters, setAppliedFilters] = useState({
    year: "",
    major: "",
    search: ""
  });

  const [dashboardData, setDashboardData] = useState(null);

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

  // ข้อมูลสถิติทั่วไป
  const retain = dashboardData?.["นิสิตคงอยู่"] || dashboardData?.["ข้อมูลนิสิตคงอยู่"] || dashboardData?.["จำนวนนิสิตคงอยู่"] || [];

  // ดึงกรุ๊ปข้อมูลของทั้งสองกราฟ
  const surveyGroup = dashboardData?.["student_retain_survey_group"] || {};
  const admitGroup = dashboardData?.["student_retain_admit_group"] || {};

  // หารายการปีทั้งหมดของกราฟที่ 1
  const availableSurveyYears = useMemo(() => {
    return Object.keys(surveyGroup).sort().reverse();
  }, [surveyGroup]);

  // หารายการปีทั้งหมดของกราฟที่ 2
  const availableAdmitYears = useMemo(() => {
    return Object.keys(admitGroup).sort().reverse();
  }, [admitGroup]);

  // ตั้งค่า Default ยามข้อมูลโหลดเสร็จ
  useEffect(() => {
    if (availableSurveyYears.length > 0 && !graphSurveyYear) {
      setGraphSurveyYear(availableSurveyYears[0]);
    }
  }, [availableSurveyYears, graphSurveyYear]);

  useEffect(() => {
    if (availableAdmitYears.length > 0 && !graphAdmitYear) {
      setGraphAdmitYear(availableAdmitYears[0]);
    }
  }, [availableAdmitYears, graphAdmitYear]);

  // ปีและสาขาสำหรับฟิลเตอร์หลักด้านบน (ใช้คุม KPI บล็อกด้านบน)
  const years = useMemo(() => {
    const retainYears = retain.map((item) => extractYear(item["ปีที่สำรวจ"] || item["ปีการศึกษาที่รับเข้า"] || item["ปีการศึกษา"]));
    return [...new Set(retainYears)].filter(Boolean).sort();
  }, [retain]);

  const majors = useMemo(() => {
    const rawMajors = retain.map(item => cleanMajorName(item["ชื่อสาขา"] || item["สาขาวิชา"] || item["สาขา"]));
    return [...new Set(rawMajors)].filter(Boolean).sort();
  }, [retain]);

  const handleApplyFilters = () => {
    setAppliedFilters({ year: selectedYear, major: selectedMajor, search: searchText });
  };

  // คำนวณบล็อกสถิติ KPI การ์ดสี่เหลี่ยมด้านบนทั้ง 4 กล่อง (ยังคงเชื่อมฟิลเตอร์หลักด้านบนอยู่)
  let admitted = 0; let retained = 0; let lecturers = 0; let graduates = 0;
  if (dashboardData) {
    const teacher = dashboardData["อาจารย์สาขา"] || [];
    const employment = dashboardData["ภาวะการมีงานทำ"] || [];
    
    const filteredEmployment = employment.filter((item) => {
      const yearMatch = !appliedFilters.year || extractYear(item["ปีการศึกษา"]) === appliedFilters.year;
      const majorMatch = !appliedFilters.major || cleanString(cleanMajorName(item["ชื่อสาขา"])) === cleanString(appliedFilters.major);
      return yearMatch && majorMatch;
    });
    graduates = filteredEmployment.reduce((sum, item) => sum + Number(item["ผู้สำเร็จการศึกษา"] || 0), 0);

    retain.forEach((item) => {
      const retMajorClean = cleanMajorName(item["ชื่อสาขา"] || item["สาขาวิชา"] || item["สาขา"]);
      const retYear = extractYear(item["ปีที่สำรวจ"] || item["ปีการศึกษาที่รับเข้า"] || item["ปีการศึกษา"]);
      const retTerm = String(item["ภาคเรียน"] || item["ภาคการศึกษา"] || "").trim();
      const amt = Number(item["จำนวน"] || item["รวม"] || item["รวมทั้งสิ้น"] || 0);

      const majorMatch = !appliedFilters.major || cleanString(retMajorClean) === cleanString(appliedFilters.major);
      const yearMatch = !appliedFilters.year || retYear === appliedFilters.year;

      if (majorMatch && yearMatch) {
        if (retTerm === "ต้น" || retTerm === "ภาคต้น") admitted += amt;
        if (retTerm === "ปลาย" || retTerm === "ภาคปลาย") retained += amt;
      }
    });
    lecturers = teacher.filter(item => !appliedFilters.major || cleanString(cleanMajorName(item["ชื่อสาขา"])) === cleanString(appliedFilters.major)).length;
  }

  // 🌟 [แก้ไขให้เป็นอิสระ] คำนวณกราฟที่ 1: ดึงทุกสาขาตามปีที่เลือกที่กราฟ โดยไม่สนใจฟิลเตอร์ด้านบน
  const processedSurveyData = useMemo(() => {
    const activeFile = surveyGroup[graphSurveyYear] || [];
    if (activeFile.length === 0) return [];
    const grouped = {};
    activeFile.forEach(item => {
      const rawName = cleanMajorName(item["ชื่อสาขา"] || item["สาขาวิชา"] || item["สาขา"]);
      if (!rawName) return;
      const majorKey = cleanString(rawName);
      
      // เอาเงื่อนไข appliedFilters.major ออก เพื่อไม่ให้ล็อกสาขาตามด้านบน
      if (!grouped[majorKey]) grouped[majorKey] = { name: rawName, count: 0 };
      const amt = Number(item["Sum of จำนวน"] || item["จำนวน"] || item["รวม"] || 0);
      grouped[majorKey].count += amt;
    });
    return Object.values(grouped).sort((a, b) => b.count - a.count);
  }, [surveyGroup, graphSurveyYear]); // ถอด appliedFilters.major ออกจาก Dependency

  // 🌟 [แก้ไขให้เป็นอิสระ] คำนวณกราฟที่ 2: ดึงทุกสาขาตามปีที่เลือกที่กราฟ โดยไม่สนใจฟิลเตอร์ด้านบน
  const processedAdmitData = useMemo(() => {
    const activeFile = admitGroup[graphAdmitYear] || [];
    if (activeFile.length === 0) return [];
    const grouped = {};
    activeFile.forEach(item => {
      const rawName = cleanMajorName(item["ชื่อสาขา"] || item["สาขาวิชา"] || item["สาขา"]);
      if (!rawName) return;
      const majorKey = cleanString(rawName);
      
      // เอาเงื่อนไข appliedFilters.major ออก เพื่อไม่ให้ล็อกสาขาตามด้านบนเช่นกัน
      if (!grouped[majorKey]) grouped[majorKey] = { name: rawName, count: 0 };
      const amt = Number(item["Sum of จำนวน"] || item["จำนวน"] || item["รวม"] || 0);
      grouped[majorKey].count += amt;
    });
    return Object.values(grouped).sort((a, b) => b.count - a.count);
  }, [admitGroup, graphAdmitYear]); // ถอด appliedFilters.major ออกจาก Dependency

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sidebar />
      <Layout>
        <Header style={{ background: "white", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 20px", height: "auto", lineHeight: "normal", borderBottom: "1px solid #f0f0f0" }}>
          <div style={{ paddingTop: 10 }}>
            <h2 style={{ margin: 0, fontWeight: 600 }}>University Dashboard</h2>
            <div style={{ color: "#888", fontSize: 13 }}>ระบบวิเคราะห์ข้อมูลสถิตินิสิตประจำปีแบบแยกฟิลเตอร์อิสระรายกราฟ</div>
          </div>
        </Header>

        <Content style={{ padding: "16px 32px 32px 32px", background: "#f5f5f5" }}>
          
          {/* FILTER ZONE (ตอนนี้คุมเฉพาะกล่องสี่เหลี่ยม KPI) */}
          <div style={{ background: "#fff", padding: 24, borderRadius: 20, marginBottom: 24, boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
            <input type="text" placeholder="ค้นหาข้อมูลด่วน..." value={searchText} onChange={(e) => setSearchText(e.target.value)} style={{ width: "100%", padding: 12, borderRadius: 10, border: "1px solid #d9d9d9", marginBottom: 20, fontSize: 15 }} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
              <div>
                <div style={{ marginBottom: 8, fontWeight: 600 }}>ปีการศึกษาหลัก</div>
                <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} style={{ width: "100%", padding: 12, borderRadius: 10, border: "1px solid #d9d9d9" }}>
                  <option value="">ทั้งหมด</option>
                  {years.map((year) => <option key={year} value={year}>ปี {year}</option>)}
                </select>
              </div>
              <div>
                <div style={{ marginBottom: 8, fontWeight: 600 }}>สาขาวิชาคัดกรอง</div>
                <select value={selectedMajor} onChange={(e) => setSelectedMajor(e.target.value)} style={{ width: "100%", padding: 12, borderRadius: 10, border: "1px solid #d9d9d9" }}>
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
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 20 }}>
            <div style={{ background: "#e6f7ff", borderRadius: 16, padding: 24, border: "1px solid #91d5ff", boxShadow: "0 2px 6px rgba(0,0,0,0.02)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h4 style={{ color: "#0050b3", margin: 0, fontWeight: 500 }}>นิสิตรับเข้า (ภาคต้น)</h4>
                <UserAddOutlined style={{ fontSize: 20, color: "#0050b3" }} />
              </div>
              <h1 style={{ color: "#0050b3", fontSize: 28, margin: "8px 0 0 0", fontWeight: 700 }}>{admitted.toLocaleString()} <span style={{ fontSize: 14, fontWeight: 400 }}>คน</span></h1>
            </div>

            <div style={{ background: "#f6ffed", borderRadius: 16, padding: 24, border: "1px solid #b7eb8f", boxShadow: "0 2px 6px rgba(0,0,0,0.02)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h4 style={{ color: "#389e0d", margin: 0, fontWeight: 500 }}>นิสิตคงอยู่ (ภาคปลาย)</h4>
                <TeamOutlined style={{ fontSize: 20, color: "#389e0d" }} />
              </div>
              <h1 style={{ color: "#389e0d", fontSize: 28, margin: "8px 0 0 0", fontWeight: 700 }}>{retained.toLocaleString()} <span style={{ fontSize: 14, fontWeight: 400 }}>คน</span></h1>
            </div>

            <div style={{ background: "#fff7e6", borderRadius: 16, padding: 24, border: "1px solid #ffd591", boxShadow: "0 2px 6px rgba(0,0,0,0.02)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h4 style={{ color: "#d46b08", margin: 0, fontWeight: 500 }}>อาจารย์ประจำสาขา</h4>
                <UserOutlined style={{ fontSize: 20, color: "#d46b08" }} />
              </div>
              <h1 style={{ color: "#d46b08", fontSize: 28, margin: "8px 0 0 0", fontWeight: 700 }}>{lecturers.toLocaleString()} <span style={{ fontSize: 14, fontWeight: 400 }}>ท่าน</span></h1>
            </div>

            <div style={{ background: "#f9f0ff", borderRadius: 16, padding: 24, border: "1px solid #d3adf7", boxShadow: "0 2px 6px rgba(0,0,0,0.02)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h4 style={{ color: "#531dab", margin: 0, fontWeight: 500 }}>ผู้สำเร็จการศึกษา</h4>
                <TrophyOutlined style={{ fontSize: 20, color: "#531dab" }} />
              </div>
              <h1 style={{ color: "#531dab", fontSize: 28, margin: "8px 0 0 0", fontWeight: 700 }}>{graduates.toLocaleString()} <span style={{ fontSize: 14, fontWeight: 400 }}>คน</span></h1>
            </div>
          </div>

          {/* กราฟที่ 1: แนวนอนสีเขียว (อิสระเต็มตัว) */}
          <div style={{ background: "white", borderRadius: 16, padding: 24, marginTop: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <BarChartOutlined style={{ fontSize: 18, color: "#52c41a" }} />
                <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>นิสิตคงอยู่ (ปีที่สำรวจ) - จำแนกตามสาขาวิชา (ภาคปลาย)</h2>
              </div>
              {availableSurveyYears.length > 0 && (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontWeight: 500, color: "#666" }}>ปีที่สำรวจ:</span>
                  <select value={graphSurveyYear} onChange={(e) => setGraphSurveyYear(e.target.value)} style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid #d9d9d9", fontWeight: 600 }}>
                    {availableSurveyYears.map(year => <option key={year} value={year}>ปีการศึกษา {year}</option>)}
                  </select>
                </div>
              )}
            </div>
            {availableSurveyYears.length === 0 ? <Empty description="ยังไม่มีข้อมูลกราฟชุดที่ 1" /> : (
              <div style={{ height: 400 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={processedSurveyData} layout="vertical" margin={{ left: 50, right: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={180} />
                    <Tooltip formatter={(value) => `${value.toLocaleString()} คน`} />
                    <Bar dataKey="count" fill="#52c41a" radius={[0, 4, 4, 0]} barSize={18}>
                      <LabelList dataKey="count" position="right" style={{ fontSize: 12, fontWeight: 600 }} dx={8} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* กราฟที่ 2: แนวนอนสีฟ้า (อิสระเต็มตัว) */}
          <div style={{ background: "white", borderRadius: 16, padding: 24, marginTop: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <BarChartOutlined style={{ fontSize: 18, color: "#13c2c2" }} />
                <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>นิสิตคงอยู่ (ปีศึกษาที่รับเข้า) - จำแนกตามสาขาวิชา (ภาคต้น)</h2>
              </div>
              {availableAdmitYears.length > 0 && (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontWeight: 500, color: "#666" }}>ปีรับเข้าศึกษา:</span>
                  <select value={graphAdmitYear} onChange={(e) => setGraphAdmitYear(e.target.value)} style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid #d9d9d9", fontWeight: 600, color: "#006d75" }}>
                    {availableAdmitYears.map(year => <option key={year} value={year}>ปีการศึกษา {year}</option>)}
                  </select>
                </div>
              )}
            </div>
            {availableAdmitYears.length === 0 ? <Empty description="ยังไม่มีข้อมูลกราฟชุดที่ 2" /> : (
              <div style={{ height: 400 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={processedAdmitData} layout="vertical" margin={{ left: 50, right: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={180} />
                    <Tooltip formatter={(value) => `${value.toLocaleString()} คน`} />
                    <Bar dataKey="count" fill="#13c2c2" radius={[0, 4, 4, 0]} barSize={18}>
                      <LabelList dataKey="count" position="right" style={{ fontSize: 12, fontWeight: 600 }} dx={8} />
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
