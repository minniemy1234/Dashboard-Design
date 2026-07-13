import { Layout, Table, Button, Card, Empty, Input } from "antd";
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
  TableOutlined,
} from "@ant-design/icons";

const { Header, Content } = Layout;

function Dashboard() {
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedMajor, setSelectedMajor] = useState("");
  const [searchText, setSearchText] = useState("");

  // 🌟 ฟิลเตอร์หลักของแผนภูมิแท่ง (มีทั้งปีการศึกษา และ ปีที่สำรวจ)
  const [graphEntryYear, setGraphEntryYear] = useState(""); // คุมปีการศึกษาที่รับเข้า (แผนภูมิ)
  const [graphSurveyYear, setGraphSurveyYear] = useState(""); // คุมปีที่สำรวจ (แผนภูมิ)
  
  // ฟิลเตอร์ของตารางสรุปข้อมูลด้านล่าง
  const [tableYear, setTableYear] = useState(""); 

  const [appliedFilters, setAppliedFilters] = useState({
    year: "",
    major: "",
    search: ""
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

  // 💡 ตัวแปรดึงข้อมูลนิสิตคงอยู่จากไฟล์หลักตัวเดียว
  const retain = useMemo(() => {
    if (!dashboardData) return [];
    return dashboardData["นิสิตคงอยู่"] || dashboardData["ข้อมูลนิสิตคงอยู่"] || dashboardData["จำนวนนิสิตคงอยู่"] || [];
  }, [dashboardData]);

  // รายการ "ปีการศึกษาที่รับเข้า" ทั้งหมดจากไฟล์ดิบ
  const entryYears = useMemo(() => {
    const list = retain.map(item => extractYear(item["ปีการศึกษาที่รับเข้า"] || item["ปีการศึกษา"]));
    return [...new Set(list)].filter(Boolean).sort().reverse();
  }, [retain]);

  // รายการ "ปีที่สำรวจ" ทั้งหมดจากไฟล์ดิบ
  const surveyYears = useMemo(() => {
    const list = retain.map(item => extractYear(item["ปีที่สำรวจ"]));
    return [...new Set(list)].filter(Boolean).sort().reverse();
  }, [retain]);

  // ตั้งค่า Default เลือกปีล่าสุดให้ทุกฟิลเตอร์เมื่อโหลดหน้าแรก
  useEffect(() => {
    if (entryYears.length > 0) {
      if (!graphEntryYear) setGraphEntryYear(entryYears[0]);
      if (!tableYear) setTableYear(entryYears[0]);
    }
    if (surveyYears.length > 0) {
      if (!graphSurveyYear) setGraphSurveyYear(surveyYears[0]);
    }
  }, [entryYears, surveyYears, graphEntryYear, graphSurveyYear, tableYear]);

  const years = useMemo(() => {
    const retainYears = retain.map((item) => extractYear(item["ปีที่สำรวจ"] || item["ปีการศึกษาที่รับเข้า"]));
    return [...new Set(retainYears)].filter(Boolean).sort();
  }, [retain]);

  const majors = useMemo(() => {
    const rawMajors = retain.map(item => cleanMajorName(item["ชื่อสาขา"] || item["สาขาวิชา"] || item["สาขา"]));
    return [...new Set(rawMajors)].filter(Boolean).sort();
  }, [retain]);

  const handleApplyFilters = () => {
    setAppliedFilters({ year: selectedYear, major: selectedMajor, search: searchText });
  };

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
      const retYear = extractYear(item["ปีที่สำรวจ"] || item["ปีการศึกษาที่รับเข้า"]);
      const retTerm = String(item["ภาคเรียน"] || item["ภาคการศึกษา"] || "").trim();
      const amt = Number(item["จำนวน"] || item["รวม"] || 0);

      const majorMatch = !appliedFilters.major || cleanString(retMajorClean) === cleanString(appliedFilters.major);
      const yearMatch = !appliedFilters.year || retYear === appliedFilters.year;

      if (majorMatch && yearMatch) {
        if (retTerm === "ต้น" || retTerm === "ภาคต้น") admitted += amt;
        if (retTerm === "ปลาย" || retTerm === "ภาคปลาย") retained += amt;
      }
    });
    lecturers = teacher.filter(item => !appliedFilters.major || cleanString(cleanMajorName(item["ชื่อสาขา"])) === cleanString(appliedFilters.major)).length;
  }

  // 📊 กรองแผนภูมิด้วยเงื่อนไข "ปีการศึกษาที่รับเข้า" ร่วมกับ "ปีที่สำรวจ" พร้อมกันตามข้อมูลไฟล์หลักตัวเดียว
  const pairedGraphData = useMemo(() => {
    if (retain.length === 0 || !graphEntryYear || !graphSurveyYear) return [];
    const grouped = {};
    retain.forEach(item => {
      const itemEntryYear = extractYear(item["ปีการศึกษาที่รับเข้า"] || item["ปีการศึกษา"]);
      const itemSurveyYear = extractYear(item["ปีที่สำรวจ"]);
      
      // กรองเงื่อนไขปีการศึกษาและปีสำรวจจากชุดไฟล์เดียว
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

  // 📋 กรองตารางสรุปด้านล่างด้วยปีการศึกษาจากชุดไฟล์เดียวเช่นกัน
  const pairedTableData = useMemo(() => {
    if (retain.length === 0 || !tableYear) return [];
    const grouped = {};
    retain.forEach(item => {
      const itemEntryYear = extractYear(item["ปีการศึกษาที่รับเข้า"] || item["ปีการศึกษา"]);
      if (itemEntryYear !== tableYear) return;

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
  }, [retain, tableYear]);

  const columns = [
    { title: "สาขาวิชา", dataIndex: "name", key: "name", render: (text) => <strong>{text}</strong> },
    { title: "นิสิตรับเข้า (ภาคต้น)", dataIndex: "earlyTerm", key: "earlyTerm", align: "center", render: (v) => <span style={{ color: "#0050b3", fontWeight: 600 }}>{v.toLocaleString()} คน</span> },
    { title: "นิสิตคงอยู่ (ภาคปลาย)", dataIndex: "lateTerm", key: "lateTerm", align: "center", render: (v) => <span style={{ color: "#389e0d", fontWeight: 600 }}>{v.toLocaleString()} คน</span> }
  ];

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
            <div style={{ marginBottom: 6, fontWeight: 600 }}>ค้นหาข้อมูล</div>
            <Input 
              placeholder="พิมพ์คำค้นหาที่ต้องการตรวจสอบข้อมูลด่วน..." 
              prefix={<SearchOutlined style={{ color: "#bfbfbf" }} />}
              value={searchText} 
              onChange={(e) => setSearchText(e.target.value)} 
              style={{ height: 42, borderRadius: 10, marginBottom: 20 }}
              allowClear
            />
            
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
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 20, marginBottom: 24 }}>
            <div style={{ background: "#e6f7ff", borderRadius: 16, padding: 24, border: "1px solid #91d5ff" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h4 style={{ color: "#0050b3", margin: 0, fontWeight: 500 }}>นิสิตรับเข้า (ภาคต้น)</h4>
                <UserAddOutlined style={{ fontSize: 20, color: "#0050b3" }} />
              </div>
              <h1 style={{ color: "#0050b3", fontSize: 28, margin: "8px 0 0 0", fontWeight: 700 }}>{admitted.toLocaleString()} <span style={{ fontSize: 14, fontWeight: "normal", color: "#8c8c8c" }}>คน</span></h1>
            </div>

            <div style={{ background: "#f6ffed", borderRadius: 16, padding: 24, border: "1px solid #b7eb8f" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h4 style={{ color: "#389e0d", margin: 0, fontWeight: 500 }}>นิสิตคงอยู่ (ภาคปลาย)</h4>
                <TeamOutlined style={{ fontSize: 20, color: "#389e0d" }} />
              </div>
              <h1 style={{ color: "#389e0d", fontSize: 28, margin: "8px 0 0 0", fontWeight: 700 }}>{retained.toLocaleString()} <span style={{ fontSize: 14, fontWeight: "normal", color: "#8c8c8c" }}>คน</span></h1>
            </div>

            <div style={{ background: "#fff7e6", borderRadius: 16, padding: 24, border: "1px solid #ffd591" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h4 style={{ color: "#d46b08", margin: 0, fontWeight: 500 }}>อาจารย์ประจำสาขา</h4>
                <UserOutlined style={{ fontSize: 20, color: "#d46b08" }} />
              </div>
              <h1 style={{ color: "#d46b08", fontSize: 28, margin: "8px 0 0 0", fontWeight: 700 }}>{lecturers.toLocaleString()} <span style={{ fontSize: 14, fontWeight: "normal", color: "#8c8c8c" }}>ท่าน</span></h1>
            </div>

            <div style={{ background: "#f9f0ff", borderRadius: 16, padding: 24, border: "1px solid #d3adf7" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h4 style={{ color: "#531dab", margin: 0, fontWeight: 500 }}>ผู้สำเร็จการศึกษา</h4>
                <TrophyOutlined style={{ fontSize: 20, color: "#531dab" }} />
              </div>
              <h1 style={{ color: "#531dab", fontSize: 28, margin: "8px 0 0 0", fontWeight: 700 }}>{graduates.toLocaleString()} <span style={{ fontSize: 14, fontWeight: "normal", color: "#8c8c8c" }}>คน</span></h1>
            </div>
          </div>

          {/* แผนภูมิแท่งเปรียบเทียบจำนวนนิสิต (ฟิลเตอร์คู่: ปีการศึกษา และ ปีที่สำรวจ) */}
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

          {/* ตารางสรุปรายละเอียดคุมด้วยปีการศึกษาด้านล่าง */}
          <div style={{ background: "white", borderRadius: 16, padding: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <TableOutlined style={{ fontSize: 18, color: "#722ed1" }} />
                <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>ตารางสรุปข้อมูลนิสิต จำแนกตามสาขาวิชา</h2>
              </div>
              
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontWeight: 500, color: "#666" }}>ปีการศึกษา:</span>
                <select value={tableYear} onChange={(e) => setTableYear(e.target.value)} style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid #d9d9d9", fontWeight: 600, color: "#722ed1", cursor: "pointer", outline: "none" }}>
                  {entryYears.map(year => <option key={year} value={year}>ปีการศึกษา {year}</option>)}
                </select>
              </div>
            </div>
            
            <Table 
              columns={columns} 
              dataSource={pairedTableData} 
              rowKey="name" 
              pagination={{ pageSize: 10, showTotal: (total) => `รวมทั้งหมด ${total} สาขาวิชา` }} 
              bordered 
              size="middle" 
              scroll={{ x: true }}
            />
          </div>

        </Content>
      </Layout>
    </Layout>
  );
}

export default Dashboard;
