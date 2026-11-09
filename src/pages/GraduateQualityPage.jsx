import { Layout, Table, Button, Progress, Card, Empty } from "antd";
import Sidebar from "../components/Sidebar";
import { useMemo, useState, useEffect } from "react";
import {
  ComposedChart,
  Bar,
  XAxis,
  Line,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
  BarChart
} from "recharts";
import { 
  SearchOutlined, 
  SafetyCertificateOutlined, 
  TrophyOutlined, 
  VerifiedOutlined,
  ReadOutlined,
  TeamOutlined
} from "@ant-design/icons";

const { Header, Content } = Layout;

function GraduateQualityPage() {
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedMajor, setSelectedMajor] = useState("");
  const [appliedFilters, setAppliedFilters] = useState({ year: "", major: "" });
  const [rawData, setRawData] = useState([]);
  const [tableYearFilter, setTableYearFilter] = useState("");

  // สเตตสำหรับแบนเนอร์วิเคราะห์แนวโน้ม
  const [trendYear, setTrendYear] = useState("");
  const [trendMajor, setTrendMajor] = useState("");

  // 1. โหลดข้อมูลจริงจาก localStorage
  useEffect(() => {
    const stored = localStorage.getItem("dashboardData");
    if (stored) {
      const parsed = JSON.parse(stored);
      const evalData = parsed["ผลการประเมินคุณภาพบัณฑิต"] || [];
      setRawData(evalData);
    }
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

  // 2. ดึงรายการ ปีการศึกษา และ สาขาวิชา ทั้งหมดมาทำ Dropdown
  const years = useMemo(() => {
    const list = rawData.map(item => extractYear(item["ปีการศึกษา"]));
    return [...new Set(list)].filter(Boolean).sort().reverse();
  }, [rawData]);

  const majors = useMemo(() => {
    const list = rawData.map(item => String(item["ชื่อสาขา"] || "").replace(/\n/g, ' ').trim());
    return [...new Set(list)].filter(Boolean).sort();
  }, [rawData]);

  const handleApplyFilters = () => {
    setAppliedFilters({ year: selectedYear, major: selectedMajor });
  };

  // 3. จัดกลุ่มข้อมูลสำหรับคำนวณ KPI และ กราฟแท่ง
  const processedData = useMemo(() => {
    const groups = {};

    rawData.forEach(item => {
      const year = extractYear(item["ปีการศึกษา"]);
      const majorRaw = String(item["ชื่อสาขา"] || "").replace(/\n/g, ' ').trim();
      const majorClean = cleanString(item["ชื่อสาขา"]);
      const topic = item["หัวข้อ"] || "";
      const score = Number(item["ค่าเฉลี่ยความพึงพอใจ"] || 0);

      if (appliedFilters.year && year !== extractYear(appliedFilters.year)) return;
      if (appliedFilters.major && majorClean !== cleanString(appliedFilters.major)) return;

      const key = `${year}-${majorClean}`;
      if (!groups[key]) {
        groups[key] = { year, major: majorRaw, d1: 0, d2: 0, d3: 0, d4: 0, d5: 0, total: 0 };
      }

      if (topic.includes("คุณธรรม")) groups[key].d1 = score;
      else if (topic.includes("ความรู้")) groups[key].d2 = score;
      else if (topic.includes("ทักษะทางปัญญา")) groups[key].d3 = score;
      else if (topic.includes("ความสัมพันธ์")) groups[key].d4 = score;
      else if (topic.includes("วิเคราะห์เชิงตัวเลข")) groups[key].d5 = score;
      else if (topic.includes("รวม")) groups[key].total = score;
    });

    return Object.values(groups);
  }, [rawData, appliedFilters]);

  // 4. จัดกลุ่มข้อมูลสำหรับตารางด้านล่าง
  const tableData = useMemo(() => {
    const groups = {};

    rawData.forEach(item => {
      const year = extractYear(item["ปีการศึกษา"]);
      const majorRaw = String(item["ชื่อสาขา"] || "").replace(/\n/g, ' ').trim();
      const majorClean = cleanString(item["ชื่อสาขา"]);
      const topic = item["หัวข้อ"] || "";
      const score = Number(item["ค่าเฉลี่ยความพึงพอใจ"] || 0);

      if (tableYearFilter && year !== extractYear(tableYearFilter)) return;
      if (appliedFilters.major && majorClean !== cleanString(appliedFilters.major)) return;

      const key = `${year}-${majorClean}`;
      if (!groups[key]) {
        groups[key] = { year, major: majorRaw, d1: 0, d2: 0, d3: 0, d4: 0, d5: 0, total: 0 };
      }

      if (topic.includes("คุณธรรม")) groups[key].d1 = score;
      else if (topic.includes("ความรู้")) groups[key].d2 = score;
      else if (topic.includes("ทักษะทางปัญญา")) groups[key].d3 = score;
      else if (topic.includes("ความสัมพันธ์")) groups[key].d4 = score;
      else if (topic.includes("วิเคราะห์เชิงตัวเลข")) groups[key].d5 = score;
      else if (topic.includes("รวม")) groups[key].total = score;
    });

    return Object.values(groups);
  }, [rawData, tableYearFilter, appliedFilters.major]);

  // 5. คำนวณค่าเฉลี่ยรวมสรุป KPI
  const stats = useMemo(() => {
    if (processedData.length === 0) return { d1: "0.00", d2: "0.00", d3: "0.00", d4: "0.00", d5: "0.00", avg: "0.00" };
    
    let sumD1 = 0, sumD2 = 0, sumD3 = 0, sumD4 = 0, sumD5 = 0, sumTotal = 0;
    let countD1 = 0, countD2 = 0, countD3 = 0, countD4 = 0, countD5 = 0, countTotal = 0;

    processedData.forEach(item => {
      if (item.d1 > 0) { sumD1 += item.d1; countD1++; }
      if (item.d2 > 0) { sumD2 += item.d2; countD2++; }
      if (item.d3 > 0) { sumD3 += item.d3; countD3++; }
      if (item.d4 > 0) { sumD4 += item.d4; countD4++; }
      if (item.d5 > 0) { sumD5 += item.d5; countD5++; }
      if (item.total > 0) { sumTotal += item.total; countTotal++; }
    });

    return {
      d1: countD1 > 0 ? (sumD1 / countD1).toFixed(2) : "0.00",
      d2: countD2 > 0 ? (sumD2 / countD2).toFixed(2) : "0.00",
      d3: countD3 > 0 ? (sumD3 / countD3).toFixed(2) : "0.00",
      d4: countD4 > 0 ? (sumD4 / countD4).toFixed(2) : "0.00",
      d5: countD5 > 0 ? (sumD5 / countD5).toFixed(2) : "0.00",
      avg: countTotal > 0 ? (sumTotal / countTotal).toFixed(2) : "0.00"
    };
  }, [processedData]);

  const tqfColors = [
    "#0284c7", 
    "#10b981", 
    "#f59e0b", 
    "#8b5cf6", 
    "#ec4899"  
  ];

  const chartData = [
    { name: "คุณธรรม", score: Number(stats.d1) },
    { name: "ความรู้", score: Number(stats.d2) },
    { name: "ปัญญา", score: Number(stats.d3) },
    { name: "สัมพันธ์", score: Number(stats.d4) },
    { name: "ไอที/วิเคราะห์", score: Number(stats.d5) },
  ];

  // 6. ระบบประมวลผลข้อมูลแนวโน้ม
  const trendChartsData = useMemo(() => {
    let filtered = rawData;

    if (trendMajor) {
      filtered = filtered.filter(item => cleanString(item["ชื่อสาขา"]) === cleanString(trendMajor));
    }

    const yearMap = {};
    filtered.forEach(item => {
      const year = extractYear(item["ปีการศึกษา"] || item["ปี"]);
      if (!year) return;

      const topic = item["หัวข้อ"] || "";
      const score = Number(item["ค่าเฉลี่ยความพึงพอใจ"] || 0);
      if (score <= 0) return;

      if (!yearMap[year]) {
        yearMap[year] = {
          year: `ปีการศึกษา ${year}`,
          rawYear: Number(year),
          d1Sum: 0, d1Count: 0,
          d2Sum: 0, d2Count: 0,
          d3Sum: 0, d3Count: 0,
          d4Sum: 0, d4Count: 0,
          d5Sum: 0, d5Count: 0,
          totalSum: 0, totalCount: 0,
        };
      }

      if (topic.includes("คุณธรรม")) {
        yearMap[year].d1Sum += score;
        yearMap[year].d1Count++;
      } else if (topic.includes("ความรู้")) {
        yearMap[year].d2Sum += score;
        yearMap[year].d2Count++;
      } else if (topic.includes("ทักษะทางปัญญา")) {
        yearMap[year].d3Sum += score;
        yearMap[year].d3Count++;
      } else if (topic.includes("ความสัมพันธ์")) {
        yearMap[year].d4Sum += score;
        yearMap[year].d4Count++;
      } else if (topic.includes("วิเคราะห์เชิงตัวเลข")) {
        yearMap[year].d5Sum += score;
        yearMap[year].d5Count++;
      } else if (topic.includes("รวม")) {
        yearMap[year].totalSum += score;
        yearMap[year].totalCount++;
      }
    });

    let result = Object.values(yearMap).map(d => {
      return {
        year: d.year,
        rawYear: d.rawYear,
        d1: d.d1Count > 0 ? Number((d.d1Sum / d.d1Count).toFixed(2)) : 0,
        d2: d.d2Count > 0 ? Number((d.d2Sum / d.d2Count).toFixed(2)) : 0,
        d3: d.d3Count > 0 ? Number((d.d3Sum / d.d3Count).toFixed(2)) : 0,
        d4: d.d4Count > 0 ? Number((d.d4Sum / d.d4Count).toFixed(2)) : 0,
        d5: d.d5Count > 0 ? Number((d.d5Sum / d.d5Count).toFixed(2)) : 0,
        total: d.totalCount > 0 ? Number((d.totalSum / d.totalCount).toFixed(2)) : 0,
      };
    });

    result.sort((a, b) => a.rawYear - b.rawYear);

    if (trendYear) {
      result = result.filter(d => d.rawYear === Number(trendYear));
    }

    return result;
  }, [rawData, trendYear, trendMajor]);

  // ฟังก์ชันจัดรูปแบบการแสดงผลตัวเลขเป็น 2 ตำแหน่ง
  const formatScore = (val) => {
    if (val === undefined || val === null || val === "" || val === 0) return "-";
    const num = Number(val);
    return isNaN(num) ? "-" : num.toFixed(2);
  };

  const tableColumns = [
    { title: "ปีการศึกษา", dataIndex: "year", key: "year", width: 105, align: "center" },
    { title: "สาขาวิชา", dataIndex: "major", key: "major" },
    { title: "คุณธรรมจริยธรรม", dataIndex: "d1", key: "d1", align: "center", render: v => <strong>{formatScore(v)}</strong> },
    { title: "ด้านความรู้", dataIndex: "d2", key: "d2", align: "center", render: v => <strong>{formatScore(v)}</strong> },
    { title: "ทักษะทางปัญญา", dataIndex: "d3", key: "d3", align: "center", render: v => <strong>{formatScore(v)}</strong> },
    { title: "ทักษะความสัมพันธ์ฯ", dataIndex: "d4", key: "d4", align: "center", render: v => <strong>{formatScore(v)}</strong> },
    { title: "วิเคราะห์เชิงตัวเลข/ไอที/สื่อสาร", dataIndex: "d5", key: "d5", align: "center", render: v => <strong>{formatScore(v)}</strong> },
    { title: "คะแนนรวม", dataIndex: "total", key: "total", align: "center", render: v => <span style={{ color: "#0d9488", fontWeight: "bold" }}>{formatScore(v)}</span> },
  ];

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sidebar />
      <Layout>
        <Header style={{ background: "white", padding: "16px 24px", height: "auto", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #f0f0f0" }}>
          <div>
            <h2 style={{ margin: "0 0 4px 0", fontSize: "20px", fontWeight: "600", color: "#1f1f1f", lineHeight: "1.2" }}>ผลการประเมินคุณภาพบัณฑิต</h2>
            <div style={{ color: "#8c8c8c", fontSize: "13px", lineHeight: "1.4" }}>วิเคราะห์ระดับความพึงพอใจของผู้ใช้บัณฑิตตามกรอบมาตรฐาน 5 ด้าน</div>
          </div>
        </Header>

        <Content style={{ padding: "16px 32px 32px 32px", background: "#f8fafc" }}>
          
          {/* FILTER SECTION */}
          <div style={{ background: "#fff", padding: 24, borderRadius: 20, marginBottom: 24, boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              <div>
                <div style={{ marginBottom: 8, fontWeight: 600 }}>ปีการศึกษา </div>
                <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} style={{ width: "100%", padding: 12, borderRadius: 10, border: "1px solid #d9d9d9", outline: "none" }}>
                  <option value="">ทั้งหมด</option>
                  {years.map(y => <option key={y} value={y}>ปีการศึกษา {y}</option>)}
                </select>
              </div>
              <div>
                <div style={{ marginBottom: 8, fontWeight: 600 }}>สาขาวิชา</div>
                <select value={selectedMajor} onChange={(e) => setSelectedMajor(e.target.value)} style={{ width: "100%", padding: 12, borderRadius: 10, border: "1px solid #d9d9d9", outline: "none" }}>
                  <option value="">ทั้งหมด</option>
                  {majors.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
              <Button type="primary" size="large" icon={<SearchOutlined />} onClick={handleApplyFilters} style={{ borderRadius: 10, background: "#0d9488", borderColor: "#0d9488", fontWeight: 500 }}>
                ประมวลผล
              </Button>
            </div>
          </div>

          {/* KPI ZONE - ปรับแต่งสีและความโดดเด่นใหม่ */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 20, marginBottom: 24 }}>
            <Card style={{ borderRadius: 20, textAlign: "center", border: "none", boxShadow: "0 10px 25px -5px rgba(13, 148, 136, 0.15)", background: "linear-gradient(180deg, #ffffff 0%, #f0fdf4 100%)" }}>
              <h3 style={{ color: "#0f766e", marginBottom: 15, fontWeight: "700" }}>คะแนนเฉลี่ยรวมทุกด้าน</h3>
              <Progress 
                type="circle" 
                percent={(Number(stats.avg) / 5) * 100} 
                format={() => <span style={{ fontSize: 32, fontWeight: "bold", color: "#0f766e" }}>{stats.avg}</span>}
                strokeColor={{ '0%': '#14b8a6', '100%': '#0f766e' }}
                strokeWidth={10}
                size={140}
              />
              <div style={{ marginTop: 15, color: "#64748b", fontWeight: 500, fontSize: 13 }}>จากคะแนนเต็ม 5.00</div>
            </Card>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 15 }}>
              {/* ด้านที่ 1 */}
              <div style={{ background: "linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)", padding: 18, borderRadius: 16, border: "1px solid #93c5fd", boxShadow: "0 4px 6px -1px rgba(2, 132, 199, 0.1)", position: "relative", overflow: "hidden" }}>
                <div style={{ color: "#0369a1", fontSize: 11, fontWeight: "700", textTransform: "uppercase" }}>ด้านที่ 1</div>
                <h4 style={{ margin: "4px 0 10px 0", fontSize: 13, color: "#0f172a", fontWeight: "600" }}>คุณธรรมจริยธรรม</h4>
                <div style={{ fontSize: 26, fontWeight: "800", color: "#0284c7" }}>{stats.d1}</div>
                <SafetyCertificateOutlined style={{ fontSize: 36, color: "#0284c7", position: "absolute", right: 12, bottom: 12, opacity: 0.25 }} />
              </div>

              {/* ด้านที่ 2 */}
              <div style={{ background: "linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)", padding: 18, borderRadius: 16, border: "1px solid #6ee7b7", boxShadow: "0 4px 6px -1px rgba(16, 185, 129, 0.1)", position: "relative", overflow: "hidden" }}>
                <div style={{ color: "#047857", fontSize: 11, fontWeight: "700", textTransform: "uppercase" }}>ด้านที่ 2</div>
                <h4 style={{ margin: "4px 0 10px 0", fontSize: 13, color: "#0f172a", fontWeight: "600" }}>ด้านความรู้</h4>
                <div style={{ fontSize: 26, fontWeight: "800", color: "#059669" }}>{stats.d2}</div>
                <ReadOutlined style={{ fontSize: 36, color: "#059669", position: "absolute", right: 12, bottom: 12, opacity: 0.25 }} />
              </div>

              {/* ด้านที่ 3 */}
              <div style={{ background: "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)", padding: 18, borderRadius: 16, border: "1px solid #fcd34d", boxShadow: "0 4px 6px -1px rgba(245, 158, 11, 0.1)", position: "relative", overflow: "hidden" }}>
                <div style={{ color: "#b45309", fontSize: 11, fontWeight: "700", textTransform: "uppercase" }}>ด้านที่ 3</div>
                <h4 style={{ margin: "4px 0 10px 0", fontSize: 13, color: "#0f172a", fontWeight: "600" }}>ทักษะทางปัญญา</h4>
                <div style={{ fontSize: 26, fontWeight: "800", color: "#d97706" }}>{stats.d3}</div>
                <TrophyOutlined style={{ fontSize: 36, color: "#d97706", position: "absolute", right: 12, bottom: 12, opacity: 0.25 }} />
              </div>

              {/* ด้านที่ 4 */}
              <div style={{ background: "linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%)", padding: 18, borderRadius: 16, border: "1px solid #c4b5fd", boxShadow: "0 4px 6px -1px rgba(139, 92, 246, 0.1)", position: "relative", overflow: "hidden" }}>
                <div style={{ color: "#6d28d9", fontSize: 11, fontWeight: "700", textTransform: "uppercase" }}>ด้านที่ 4</div>
                <h4 style={{ margin: "4px 0 10px 0", fontSize: 13, color: "#0f172a", fontWeight: "600" }}>ทักษะสัมพันธ์ฯ</h4>
                <div style={{ fontSize: 26, fontWeight: "800", color: "#7c3aed" }}>{stats.d4}</div>
                <TeamOutlined style={{ fontSize: 36, color: "#7c3aed", position: "absolute", right: 12, bottom: 12, opacity: 0.25 }} />
              </div>

              {/* ด้านที่ 5 */}
              <div style={{ background: "linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%)", padding: 18, borderRadius: 16, border: "1px solid #f9a8d4", boxShadow: "0 4px 6px -1px rgba(236, 72, 153, 0.1)", gridColumn: "span 2", position: "relative", overflow: "hidden" }}>
                <div style={{ color: "#be185d", fontSize: 11, fontWeight: "700", textTransform: "uppercase" }}>ด้านที่ 5</div>
                <h4 style={{ margin: "4px 0 10px 0", fontSize: 13, color: "#0f172a", fontWeight: "600" }}>วิเคราะห์ตัวเลข/การสื่อสาร/ไอที</h4>
                <div style={{ fontSize: 26, fontWeight: "800", color: "#db2777" }}>{stats.d5}</div>
                <VerifiedOutlined style={{ fontSize: 36, color: "#db2777", position: "absolute", right: 16, bottom: 12, opacity: 0.25 }} />
              </div>
            </div>
          </div>

          {/* GRAPH - เปรียบเทียบค่าเฉลี่ยรายด้าน */}
          <div style={{ background: "white", padding: 24, borderRadius: 20, marginBottom: 24, boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
            <h3 style={{ marginBottom: 20, fontWeight: "600", color: "#1e293b" }}>แผนภูมิแสดงผลเปรียบเทียบค่าเฉลี่ยรายด้าน</h3>
            <div style={{ height: 350 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#64748b" }} />
                  <YAxis domain={[0, 5]} axisLine={false} tickLine={false} tick={{ fill: "#64748b" }} />
                  <Tooltip cursor={{ fill: '#f8fafc' }} />
                  <Bar dataKey="score" radius={[8, 8, 0, 0]} barSize={50}>
                    <LabelList 
                      dataKey="score" 
                      position="top" 
                      dy={-10} 
                      style={{ fill: '#334155', fontSize: 12, fontWeight: 'bold' }} 
                      formatter={(val) => Number(val).toFixed(2)}
                    />
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={tqfColors[index % tqfColors.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 7. แถบตัวกรองแนวโน้มคุณภาพบัณฑิต */}
          <div style={{
            background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
            padding: "24px 32px",
            borderRadius: 20,
            boxShadow: "0 10px 25px -5px rgba(15, 23, 42, 0.15), 0 8px 10px -6px rgba(15, 23, 42, 0.15)",
            marginBottom: 28,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 20
          }}>
            <div>
              <h3 style={{ color: "#ffffff", fontSize: "22px", fontWeight: "600", margin: 0, letterSpacing: "-0.5px" }}>
                วิเคราะห์แนวโน้มคุณภาพบัณฑิต
              </h3>
              <p style={{ color: "#94a3b8", fontSize: "13px", margin: "4px 0 0 0" }}>เปรียบเทียบสถิติและผลประเมินเพื่อวิเคราะห์คุณภาพอย่างต่อเนื่อง</p>
            </div>
            
            <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap", color: "#e2e8f0", fontSize: "13px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <span style={{ color: "#94a3b8", fontSize: "11px", textTransform: "uppercase", fontWeight: "600", letterSpacing: "0.5px" }}>ปีการศึกษา</span>
                <select value={trendYear} onChange={(e) => setTrendYear(e.target.value)} style={{ background: "rgba(255, 255, 255, 0.07)", border: "1px solid rgba(255, 255, 255, 0.15)", borderRadius: "8px", padding: "8px 14px", color: "#ffffff", outline: "none", cursor: "pointer", fontSize: "13px", minWidth: "120px", backdropFilter: "blur(4px)" }}>
                  <option value="" style={{ color: "#0f172a" }}>ทั้งหมด</option>
                  {years.map(y => <option key={y} value={y} style={{ color: "#0f172a" }}>ปีการศึกษา {y}</option>)}
                </select>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <span style={{ color: "#94a3b8", fontSize: "11px", textTransform: "uppercase", fontWeight: "600", letterSpacing: "0.5px" }}>สาขาวิชา</span>
                <select value={trendMajor} onChange={(e) => setTrendMajor(e.target.value)} style={{ background: "rgba(255, 255, 255, 0.07)", border: "1px solid rgba(255, 255, 255, 0.15)", borderRadius: "8px", padding: "8px 14px", color: "#ffffff", outline: "none", cursor: "pointer", maxWidth: "260px", fontSize: "13px", backdropFilter: "blur(4px)" }}>
                  <option value="" style={{ color: "#0f172a" }}>ทั้งหมด</option>
                  {majors.map(m => <option key={m} value={m} style={{ color: "#0f172a" }}>{m}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* 8. โซนแสดงกราฟแนวโน้ม 6 ด้านตามมาตรฐาน TQF */}
          {(() => {
            const yearlyColors = ["#0ea5e9", "#0284c7", "#0369a1", "#075985"];

            return (
              <div style={{ marginBottom: 32 }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }}>
                  
                  {/* กราฟที่ 1: คะแนนเฉลี่ยรวมทุกด้าน */}
                  <Card bodyStyle={{ padding: "20px" }} style={{ borderRadius: 16, boxShadow: "0 1px 3px rgba(0,0,0,0.05)", border: "1px solid #f1f5f9", background: "#ffffff" }}>
                    <div style={{ textAlign: "center", marginBottom: 16, minHeight: "44px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <h4 style={{ margin: 0, fontSize: "13px", fontWeight: "600", color: "#334155", lineHeight: "1.4" }}>
                        คะแนนเฉลี่ยรวมทุกด้านความพึงพอใจ
                      </h4>
                    </div>
                    <div style={{ height: 190, width: "100%" }}>
                      {trendChartsData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <ComposedChart data={trendChartsData} margin={{ top: 15, right: 5, left: -25, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f8fafc" />
                            <XAxis 
                              dataKey="year" 
                              tickFormatter={(v) => `ปี ${v.toString().replace("ปีการศึกษา ", "").trim()}`} 
                              tick={{ fontSize: 11, fill: "#94a3b8" }} 
                              axisLine={false} 
                              tickLine={false} 
                            />
                            <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} domain={[0, 5]} axisLine={false} tickLine={false} />
                            <Tooltip contentStyle={{ background: "#0f172a", borderRadius: 8, border: "none", color: "#fff", fontSize: 12 }} formatter={(value) => [`${value}`, 'คะแนนเฉลี่ยรวม']} />
                            <Bar dataKey="total" radius={[6, 6, 0, 0]} barSize={24}>
                              {trendChartsData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={yearlyColors[index % yearlyColors.length]} />
                              ))}
                              <LabelList dataKey="total" position="top" style={{ fill: '#475569', fontSize: 11, fontWeight: '600' }} formatter={(v) => Number(v).toFixed(2)} />
                            </Bar>
                            <Line type="linear" dataKey="total" stroke="#ef4444" strokeWidth={2.5} dot={{ r: 4, fill: "#ef4444" }} activeDot={{ r: 6 }} />
                          </ComposedChart>
                        </ResponsiveContainer>
                      ) : (
                        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}><Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="ไม่มีข้อมูล" /></div>
                      )}
                    </div>
                  </Card>

                  {/* กราฟที่ 2: คุณธรรม จริยธรรม */}
                  <Card bodyStyle={{ padding: "20px" }} style={{ borderRadius: 16, boxShadow: "0 1px 3px rgba(0,0,0,0.05)", border: "1px solid #f1f5f9", background: "#ffffff" }}>
                    <div style={{ textAlign: "center", marginBottom: 16, minHeight: "44px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <h4 style={{ margin: 0, fontSize: "13px", fontWeight: "600", color: "#334155", lineHeight: "1.4" }}>
                        คะแนนเฉลี่ยด้านคุณธรรม จริยธรรม
                      </h4>
                    </div>
                    <div style={{ height: 190, width: "100%" }}>
                      {trendChartsData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <ComposedChart data={trendChartsData} margin={{ top: 15, right: 5, left: -25, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f8fafc" />
                            <XAxis 
                              dataKey="year" 
                              tickFormatter={(v) => `ปี ${v.toString().replace("ปีการศึกษา ", "").trim()}`} 
                              tick={{ fontSize: 11, fill: "#94a3b8" }} 
                              axisLine={false} 
                              tickLine={false} 
                            />
                            <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} domain={[0, 5]} axisLine={false} tickLine={false} />
                            <Tooltip contentStyle={{ background: "#0f172a", borderRadius: 8, border: "none", color: "#fff", fontSize: 12 }} formatter={(value) => [`${value}`, 'คุณธรรม จริยธรรม']} />
                            <Bar dataKey="d1" radius={[6, 6, 0, 0]} barSize={24}>
                              {trendChartsData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={yearlyColors[index % yearlyColors.length]} />
                              ))}
                              <LabelList dataKey="d1" position="top" style={{ fill: '#475569', fontSize: 11, fontWeight: '600' }} formatter={(v) => Number(v).toFixed(2)} />
                            </Bar>
                            <Line type="linear" dataKey="d1" stroke="#ef4444" strokeWidth={2.5} dot={{ r: 4, fill: "#ef4444" }} activeDot={{ r: 6 }} />
                          </ComposedChart>
                        </ResponsiveContainer>
                      ) : (
                        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}><Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="ไม่มีข้อมูล" /></div>
                      )}
                    </div>
                  </Card>

                  {/* กราฟที่ 3: ด้านความรู้ */}
                  <Card bodyStyle={{ padding: "20px" }} style={{ borderRadius: 16, boxShadow: "0 1px 3px rgba(0,0,0,0.05)", border: "1px solid #f1f5f9", background: "#ffffff" }}>
                    <div style={{ textAlign: "center", marginBottom: 16, minHeight: "44px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <h4 style={{ margin: 0, fontSize: "13px", fontWeight: "600", color: "#334155", lineHeight: "1.4" }}>
                        คะแนนเฉลี่ยด้านความรู้
                      </h4>
                    </div>
                    <div style={{ height: 190, width: "100%" }}>
                      {trendChartsData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <ComposedChart data={trendChartsData} margin={{ top: 15, right: 5, left: -25, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f8fafc" />
                            <XAxis 
                              dataKey="year" 
                              tickFormatter={(v) => `ปี ${v.toString().replace("ปีการศึกษา ", "").trim()}`} 
                              tick={{ fontSize: 11, fill: "#94a3b8" }} 
                              axisLine={false} 
                              tickLine={false} 
                            />
                            <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} domain={[0, 5]} axisLine={false} tickLine={false} />
                            <Tooltip contentStyle={{ background: "#0f172a", borderRadius: 8, border: "none", color: "#fff", fontSize: 12 }} formatter={(value) => [`${value}`, 'ด้านความรู้']} />
                            <Bar dataKey="d2" radius={[6, 6, 0, 0]} barSize={24}>
                              {trendChartsData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={yearlyColors[index % yearlyColors.length]} />
                              ))}
                              <LabelList dataKey="d2" position="top" style={{ fill: '#475569', fontSize: 11, fontWeight: '600' }} formatter={(v) => Number(v).toFixed(2)} />
                            </Bar>
                            <Line type="linear" dataKey="d2" stroke="#ef4444" strokeWidth={2.5} dot={{ r: 4, fill: "#ef4444" }} activeDot={{ r: 6 }} />
                          </ComposedChart>
                        </ResponsiveContainer>
                      ) : (
                        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}><Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="ไม่มีข้อมูล" /></div>
                      )}
                    </div>
                  </Card>

                  {/* กราฟที่ 4: ทักษะทางปัญญา */}
                  <Card bodyStyle={{ padding: "20px" }} style={{ borderRadius: 16, boxShadow: "0 1px 3px rgba(0,0,0,0.05)", border: "1px solid #f1f5f9", background: "#ffffff" }}>
                    <div style={{ textAlign: "center", marginBottom: 16, minHeight: "44px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <h4 style={{ margin: 0, fontSize: "13px", fontWeight: "600", color: "#334155", lineHeight: "1.4" }}>
                        คะแนนเฉลี่ยด้านทักษะทางปัญญา
                      </h4>
                    </div>
                    <div style={{ height: 190, width: "100%" }}>
                      {trendChartsData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <ComposedChart data={trendChartsData} margin={{ top: 15, right: 5, left: -25, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f8fafc" />
                            <XAxis 
                              dataKey="year" 
                              tickFormatter={(v) => `ปี ${v.toString().replace("ปีการศึกษา ", "").trim()}`} 
                              tick={{ fontSize: 11, fill: "#94a3b8" }} 
                              axisLine={false} 
                              tickLine={false} 
                            />
                            <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} domain={[0, 5]} axisLine={false} tickLine={false} />
                            <Tooltip contentStyle={{ background: "#0f172a", borderRadius: 8, border: "none", color: "#fff", fontSize: 12 }} formatter={(value) => [`${value}`, 'ทักษะทางปัญญา']} />
                            <Bar dataKey="d3" radius={[6, 6, 0, 0]} barSize={24}>
                              {trendChartsData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={yearlyColors[index % yearlyColors.length]} />
                              ))}
                              <LabelList dataKey="d3" position="top" style={{ fill: '#475569', fontSize: 11, fontWeight: '600' }} formatter={(v) => Number(v).toFixed(2)} />
                            </Bar>
                            <Line type="linear" dataKey="d3" stroke="#ef4444" strokeWidth={2.5} dot={{ r: 4, fill: "#ef4444" }} activeDot={{ r: 6 }} />
                          </ComposedChart>
                        </ResponsiveContainer>
                      ) : (
                        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}><Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="ไม่มีข้อมูล" /></div>
                      )}
                    </div>
                  </Card>

                  {/* กราฟที่ 5: ทักษะความสัมพันธ์ระหว่างบุคคล */}
                  <Card bodyStyle={{ padding: "20px" }} style={{ borderRadius: 16, boxShadow: "0 1px 3px rgba(0,0,0,0.05)", border: "1px solid #f1f5f9", background: "#ffffff" }}>
                    <div style={{ textAlign: "center", marginBottom: 16, minHeight: "44px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <h4 style={{ margin: 0, fontSize: "11px", fontWeight: "600", color: "#334155", lineHeight: "1.4" }}>
                        คะแนนเฉลี่ยด้านทักษะความสัมพันธ์ระหว่างบุคคลและความรับผิดชอบ
                      </h4>
                    </div>
                    <div style={{ height: 190, width: "100%" }}>
                      {trendChartsData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <ComposedChart data={trendChartsData} margin={{ top: 15, right: 5, left: -25, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f8fafc" />
                            <XAxis 
                              dataKey="year" 
                              tickFormatter={(v) => `ปี ${v.toString().replace("ปีการศึกษา ", "").trim()}`} 
                              tick={{ fontSize: 11, fill: "#94a3b8" }} 
                              axisLine={false} 
                              tickLine={false} 
                            />
                            <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} domain={[0, 5]} axisLine={false} tickLine={false} />
                            <Tooltip contentStyle={{ background: "#0f172a", borderRadius: 8, border: "none", color: "#fff", fontSize: 12 }} formatter={(value) => [`${value}`, 'ทักษะความสัมพันธ์ฯ']} />
                            <Bar dataKey="d4" radius={[6, 6, 0, 0]} barSize={24}>
                              {trendChartsData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={yearlyColors[index % yearlyColors.length]} />
                              ))}
                              <LabelList dataKey="d4" position="top" style={{ fill: '#475569', fontSize: 11, fontWeight: '600' }} formatter={(v) => Number(v).toFixed(2)} />
                            </Bar>
                            <Line type="linear" dataKey="d4" stroke="#ef4444" strokeWidth={2.5} dot={{ r: 4, fill: "#ef4444" }} activeDot={{ r: 6 }} />
                          </ComposedChart>
                        </ResponsiveContainer>
                      ) : (
                        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}><Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="ไม่มีข้อมูล" /></div>
                      )}
                    </div>
                  </Card>

                  {/* กราฟที่ 6: ทักษะวิเคราะห์ตัวเลข/สื่อสาร/ไอที */}
                  <Card bodyStyle={{ padding: "20px" }} style={{ borderRadius: 16, boxShadow: "0 1px 3px rgba(0,0,0,0.05)", border: "1px solid #f1f5f9", background: "#ffffff" }}>
                    <div style={{ textAlign: "center", marginBottom: 16, minHeight: "44px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <h4 style={{ margin: 0, fontSize: "11px", fontWeight: "600", color: "#334155", lineHeight: "1.4" }}>
                        คะแนนเฉลี่ยด้านวิเคราะห์เชิงตัวเลข การสื่อสาร และไอที
                      </h4>
                    </div>
                    <div style={{ height: 190, width: "100%" }}>
                      {trendChartsData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <ComposedChart data={trendChartsData} margin={{ top: 15, right: 5, left: -25, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f8fafc" />
                            <XAxis 
                              dataKey="year" 
                              tickFormatter={(v) => `ปี ${v.toString().replace("ปีการศึกษา ", "").trim()}`} 
                              tick={{ fontSize: 11, fill: "#94a3b8" }} 
                              axisLine={false} 
                              tickLine={false} 
                            />
                            <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} domain={[0, 5]} axisLine={false} tickLine={false} />
                            <Tooltip contentStyle={{ background: "#0f172a", borderRadius: 8, border: "none", color: "#fff", fontSize: 12 }} formatter={(value) => [`${value}`, 'ทักษะวิเคราะห์เชิงตัวเลข/ไอที']} />
                            <Bar dataKey="d5" radius={[6, 6, 0, 0]} barSize={24}>
                              {trendChartsData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={yearlyColors[index % yearlyColors.length]} />
                              ))}
                              <LabelList dataKey="d5" position="top" style={{ fill: '#475569', fontSize: 11, fontWeight: '600' }} formatter={(v) => Number(v).toFixed(2)} />
                            </Bar>
                            <Line type="linear" dataKey="d5" stroke="#ef4444" strokeWidth={2.5} dot={{ r: 4, fill: "#ef4444" }} activeDot={{ r: 6 }} />
                          </ComposedChart>
                        </ResponsiveContainer>
                      ) : (
                        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}><Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="ไม่มีข้อมูล" /></div>
                      )}
                    </div>
                  </Card>

                </div>
              </div>
            );
          })()} 

          {/* TABLE ZONE */}
          <div style={{ background: "white", padding: 24, borderRadius: 20, boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
              <h3 style={{ margin: 0, fontWeight: "600", color: "#1e293b" }}>รายละเอียดคะแนนการประเมินแยกตามปีและสาขา</h3>
              
              <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#f8fafc", padding: "6px 14px", borderRadius: 10, border: "1px solid #e2e8f0" }}>
                <span style={{ fontSize: 13, fontWeight: 500, color: "#475569" }}>ปีการศึกษา:</span>
                <select 
                  value={tableYearFilter} 
                  onChange={(e) => setTableYearFilter(e.target.value)} 
                  style={{ background: "transparent", border: "none", fontSize: 13, fontWeight: 600, color: "#0d9488", cursor: "pointer", outline: "none" }}
                >
                  <option value="">แสดงทุกปี</option>
                  {years.map((year) => <option key={year} value={year}>ปีการศึกษา {year}</option>)}
                </select>
              </div>
            </div>

            <Table 
              columns={tableColumns} 
              dataSource={tableData} 
              rowKey={(r) => `${r.year}-${r.major}`} 
              pagination={{ pageSize: 10 }}
              scroll={{ x: true }}
              bordered
            />
          </div>

        </Content>
      </Layout>
    </Layout>
  );
}

export default GraduateQualityPage;
