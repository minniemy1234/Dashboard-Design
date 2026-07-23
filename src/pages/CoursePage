import React, { useState, useEffect, useMemo } from "react";
import { Layout, Button, Empty, Card, Row, Col, Typography, Tag } from "antd";
import {
  BookOutlined,
  SearchOutlined,
  ReadOutlined,
  CrownOutlined,
  AppstoreOutlined,
} from "@ant-design/icons";
import Sidebar from "../components/Sidebar";

const { Header, Content } = Layout;
const { Text } = Typography;

function CoursePage() {
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedTerm, setSelectedTerm] = useState("");
  const [selectedMajor, setSelectedMajor] = useState("");

  const [appliedFilters, setAppliedFilters] = useState({
    year: "",
    term: "",
    major: "",
  });

  const [dashboardData, setDashboardData] = useState(null);

  // 📦 โหลดข้อมูลจาก LocalStorage
  useEffect(() => {
    const stored = localStorage.getItem("dashboardData");
    if (stored) {
      try {
        setDashboardData(JSON.parse(stored));
      } catch (e) {
        console.error("Error parsing dashboard data", e);
      }
    }
  }, []);

  const cleanString = (str) => {
    if (!str) return "";
    return String(str).replace(/\s+/g, "").replace(/['"]+/g, "").trim();
  };

  const cleanMajorName = (majorStr) => {
    if (!majorStr) return "";
    let name = String(majorStr).replace(/\n/g, " ").trim();
    if (name.startsWith("สาขาวิชา")) name = name.replace("สาขาวิชา", "").trim();
    else if (name.startsWith("สาขา")) name = name.replace("สาขา", "").trim();
    return name;
  };

  const extractYear = (yearStr) => {
    if (!yearStr) return "";
    const match = String(yearStr).match(/\d+/);
    return match ? match[0] : String(yearStr).trim();
  };

  // 🔍 ดึง Array ข้อมูลรายวิชาจาก dashboardData
  const rawCourses = useMemo(() => {
    if (!dashboardData) return [];
    const targetKey = Object.keys(dashboardData).find(
      (k) => k.includes("รายวิชา") || k.includes("วิชา") || k.includes("Course")
    );
    return targetKey ? dashboardData[targetKey] : [];
  }, [dashboardData]);

  // 📌 ตัวเลือกสำหรับ Dropdown Filters
  const years = useMemo(() => {
    const list = rawCourses.map((item) => extractYear(item["ปีการศึกษา"] || item["ปี"]));
    return [...new Set(list)].filter(Boolean).sort().reverse();
  }, [rawCourses]);

  const terms = useMemo(() => {
    const list = rawCourses.map((item) => String(item["ภาคเรียน"] || item["ภาคการศึกษา"] || "").trim());
    return [...new Set(list)].filter(Boolean).sort();
  }, [rawCourses]);

  const majors = useMemo(() => {
    const list = rawCourses.map((item) => cleanMajorName(item["ชื่อสาขา"] || item["สาขาวิชา"] || item["สาขา"]));
    return [...new Set(list)].filter(Boolean).sort();
  }, [rawCourses]);

  // 🎯 กรองรายการวิชาตาม Filters
  const filteredCourses = useMemo(() => {
    return rawCourses.filter((item) => {
      const year = extractYear(item["ปีการศึกษา"] || item["ปี"]);
      const term = String(item["ภาคเรียน"] || item["ภาคการศึกษา"] || "").trim();
      const major = cleanString(cleanMajorName(item["ชื่อสาขา"] || item["สาขาวิชา"] || item["สาขา"]));

      if (appliedFilters.year && year !== appliedFilters.year) return false;
      if (appliedFilters.term && term !== appliedFilters.term) return false;
      if (appliedFilters.major && major !== cleanString(appliedFilters.major)) return false;

      return true;
    });
  }, [rawCourses, appliedFilters]);

  // 📊 คำนวณสรุปยอดรายวิชา (แยก ป.ตรี / ป.โท จากรหัสที่ขึ้นต้นด้วย 'X')
  const courseStats = useMemo(() => {
    let bachelor = 0;
    let master = 0;

    filteredCourses.forEach((item) => {
      const code = String(item["รหัสวิชา"] || item["รหัส"] || item["รหัสสาขา"] || "").trim().toUpperCase();
      if (code.startsWith("X")) {
        master++;
      } else {
        bachelor++;
      }
    });

    return {
      total: filteredCourses.length,
      bachelor,
      master,
    };
  }, [filteredCourses]);

  const handleApplyFilters = () => {
    setAppliedFilters({
      year: selectedYear,
      term: selectedTerm,
      major: selectedMajor,
    });
  };

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sidebar />
      <Layout>
        {/* HEADER SECTION - สไตล์เดียวกับ Dashboard */}
        <Header style={{ background: "white", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 24px", height: "auto", borderBottom: "1px solid #f0f0f0" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <h2 style={{ margin: 0, fontSize: "20px", fontWeight: "600", color: "#1f1f1f", lineHeight: "1.2" }}>
              ข้อมูลรายวิชา (Course Management)
            </h2>
            <div style={{ color: "#8c8c8c", fontSize: "13px", lineHeight: "1.4", margin: 0 }}>
              ระบบค้นหาและเรียกดูข้อมูลหลักสูตรรายวิชา จำแนกตามระดับการศึกษา
            </div>
          </div>
        </Header>

        {/* CONTENT SECTION */}
        <Content style={{ padding: "24px 32px 32px 32px", background: "#f5f5f5" }}>
          
          {/* FILTER ZONE Main - ดีไซน์การ์ดขาวขอบโค้งพร้อมเงาแบบ Dashboard */}
          <div style={{ background: "#fff", padding: 24, borderRadius: 20, marginBottom: 24, boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20, marginBottom: 20 }}>
              <div>
                <div style={{ marginBottom: 8, fontWeight: 600 }}>ปีการศึกษา</div>
                <select 
                  value={selectedYear} 
                  onChange={(e) => setSelectedYear(e.target.value)} 
                  style={{ width: "100%", padding: 12, borderRadius: 10, border: "1px solid #d9d9d9", outline: "none" }}
                >
                  <option value="">ทั้งหมด</option>
                  {years.map((year) => <option key={year} value={year}>ปี {year}</option>)}
                </select>
              </div>

              <div>
                <div style={{ marginBottom: 8, fontWeight: 600 }}>ภาคการศึกษา</div>
                <select 
                  value={selectedTerm} 
                  onChange={(e) => setSelectedTerm(e.target.value)} 
                  style={{ width: "100%", padding: 12, borderRadius: 10, border: "1px solid #d9d9d9", outline: "none" }}
                >
                  <option value="">ทั้งหมด</option>
                  {terms.map((term) => <option key={term} value={term}>{term}</option>)}
                </select>
              </div>

              <div>
                <div style={{ marginBottom: 8, fontWeight: 600 }}>สาขาวิชา</div>
                <select 
                  value={selectedMajor} 
                  onChange={(e) => setSelectedMajor(e.target.value)} 
                  style={{ width: "100%", padding: 12, borderRadius: 10, border: "1px solid #d9d9d9", outline: "none" }}
                >
                  <option value="">ทั้งหมด</option>
                  {majors.map((major) => <option key={major} value={major}>{major}</option>)}
                </select>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <Button 
                type="primary" 
                size="large" 
                icon={<SearchOutlined />} 
                onClick={handleApplyFilters} 
                style={{ height: 42, borderRadius: 10 }}
              >
                ยืนยันและประมวลผล
              </Button>
            </div>
          </div>

          {/* KPI ZONE - ดีไซน์การ์ดหลากสีสไตล์สถิติหลัก */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 20, marginBottom: 24 }}>
            
            {/* สรุปรายวิชาทั้งหมด */}
            <div style={{ background: "#fff7e6", borderRadius: 16, padding: 24, border: "1px solid #ffd591" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h4 style={{ color: "#d46b08", margin: 0, fontWeight: 500 }}>รายวิชาทั้งหมด</h4>
                <AppstoreOutlined style={{ fontSize: 22, color: "#d46b08" }} />
              </div>
              <h1 style={{ color: "#d46b08", fontSize: 28, margin: "8px 0 0 0", fontWeight: 700 }}>
                {courseStats.total.toLocaleString()} <span style={{ fontSize: 14, fontWeight: "normal", color: "#8c8c8c" }}>รายวิชา</span>
              </h1>
            </div>

            {/* รายวิชาระดับปริญญาตรี */}
            <div style={{ background: "#e6f7ff", borderRadius: 16, padding: 24, border: "1px solid #91d5ff" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h4 style={{ color: "#0050b3", margin: 0, fontWeight: 500 }}>รายวิชาระดับปริญญาตรี</h4>
                <ReadOutlined style={{ fontSize: 22, color: "#0050b3" }} />
              </div>
              <h1 style={{ color: "#0050b3", fontSize: 28, margin: "8px 0 0 0", fontWeight: 700 }}>
                {courseStats.bachelor.toLocaleString()} <span style={{ fontSize: 14, fontWeight: "normal", color: "#8c8c8c" }}>รายวิชา</span>
              </h1>
            </div>

            {/* รายวิชาระดับปริญญาโท */}
            <div style={{ background: "#f9f0ff", borderRadius: 16, padding: 24, border: "1px solid #d3adf7" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h4 style={{ color: "#531dab", margin: 0, fontWeight: 500 }}>รายวิชาระดับปริญญาโท</h4>
                <CrownOutlined style={{ fontSize: 22, color: "#531dab" }} />
              </div>
              <h1 style={{ color: "#531dab", fontSize: 28, margin: "8px 0 0 0", fontWeight: 700 }}>
                {courseStats.master.toLocaleString()} <span style={{ fontSize: 14, fontWeight: "normal", color: "#8c8c8c" }}>รายวิชา</span>
              </h1>
            </div>

          </div>

          {/* LIST CARD ZONE - การ์ดรายการแบบคลีน ตารางอ่านง่าย มี Tag แยกระดับ */}
          <div style={{ background: "white", borderRadius: 16, padding: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
              <BookOutlined style={{ fontSize: 18, color: "#1890ff" }} />
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>รายการวิชาที่เปิดสอน</h3>
            </div>

            {filteredCourses.length === 0 ? (
              <Empty description="ไม่พบข้อมูลรายวิชาตามเงื่อนไขที่กรอง" style={{ margin: "40px 0" }} />
            ) : (
              <div style={{ maxHeight: "500px", overflowY: "auto", paddingRight: 8 }}>
                {filteredCourses.map((item, index) => {
                  const code = String(item["รหัสวิชา"] || item["รหัส"] || item["รหัสสาขา"] || "03XXXXXX").trim();
                  const name = item["ชื่อวิชา"] || item["ชื่อรายวิชา"] || "วิชา XXXXXXX";
                  const isMaster = code.toUpperCase().startsWith("X");

                  return (
                    <div
                      key={index}
                      style={{
                        display: "flex",
                        justify: "space-between",
                        alignItems: "center",
                        padding: "16px 20px",
                        marginBottom: 12,
                        background: "#fafafa",
                        borderRadius: 12,
                        border: "1px solid #f0f0f0",
                        transition: "all 0.2s ease",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                        <span 
                          style={{ 
                            fontSize: "15px", 
                            fontWeight: "700", 
                            color: "#1890ff",
                            background: "#e6f7ff",
                            padding: "4px 12px",
                            borderRadius: 6,
                            border: "1px solid #91d5ff"
                          }}
                        >
                          {code}
                        </span>
                        <Text style={{ fontSize: "15px", fontWeight: "500", color: "#262626" }}>
                          {name}
                        </Text>
                      </div>

                      <Tag color={isMaster ? "purple" : "blue"} style={{ borderRadius: 12, padding: "2px 10px", fontSize: 12 }}>
                        {isMaster ? "ปริญญาโท" : "ปริญญาตรี"}
                      </Tag>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </Content>
      </Layout>
    </Layout>
  );
}

export default CoursePage;
