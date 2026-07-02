import { Layout, Table, Button, Progress, Card } from "antd";
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
  Cell
} from "recharts";
import { 
  SearchOutlined, 
  SafetyCertificateOutlined, 
  TrophyOutlined, 
  VerifiedOutlined,
  ReadOutlined
} from "@ant-design/icons";

const { Header, Content } = Layout;

function GraduateQualityPage() {
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedMajor, setSelectedMajor] = useState("");
  const [appliedFilters, setAppliedFilters] = useState({ year: "", major: "" });
  const [rawData, setRawData] = useState([]);
  const [tableYearFilter, setTableYearFilter] = useState("");

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

      if (appliedFilters.year && year !== appliedFilters.year) return;
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

      if (tableYearFilter && year !== tableYearFilter) return;
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

  const chartData = [
    { name: "คุณธรรม", score: Number(stats.d1), color: "#13c2c2" },
    { name: "ความรู้", score: Number(stats.d2), color: "#13c2c2" },
    { name: "ปัญญา", score: Number(stats.d3), color: "#13c2c2" },
    { name: "สัมพันธ์", score: Number(stats.d4), color: "#13c2c2" },
    { name: "ไอที/วิเคราะห์", score: Number(stats.d5), color: "#13c2c2" },
  ];

  const tableColumns = [
    { title: "ปีการศึกษา", dataIndex: "year", key: "year", width: 105, align: "center" },
    { title: "สาขาวิชา", dataIndex: "major", key: "major" },
    { title: "คุณธรรมจริยธรรม", dataIndex: "d1", key: "d1", align: "center", render: v => <strong>{v || "-"}</strong> },
    { title: "ด้านความรู้", dataIndex: "d2", key: "d2", align: "center", render: v => <strong>{v || "-"}</strong> },
    { title: "ทักษะทางปัญญา", dataIndex: "d3", key: "d3", align: "center", render: v => <strong>{v || "-"}</strong> },
    { title: "ทักษะความสัมพันธ์ฯ", dataIndex: "d4", key: "d4", align: "center", render: v => <strong>{v || "-"}</strong> },
    { title: "วิเคราะห์เชิงตัวเลข/ไอที/สื่อสาร", dataIndex: "d5", key: "d5", align: "center", render: v => <strong>{v || "-"}</strong> },
    { title: "คะแนนรวม", dataIndex: "total", key: "total", align: "center", render: v => <span style={{ color: "#13c2c2", fontWeight: "bold" }}>{v || "-"}</span> },
  ];

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sidebar />
      <Layout>
        {/* 🛠️ ส่วนที่แก้ไข: ปรับปรุงโครงสร้าง CSS ของหัวข้อให้ขยับมาชิดกันขึ้นอย่างสวยงาม */}
        <Header style={{ background: "white", padding: "16px 24px", height: "auto", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #f0f0f0" }}>
          <div>
            <h2 style={{ margin: "0 0 4px 0", fontSize: "20px", fontWeight: "600", color: "#1f1f1f", lineHeight: "1.2" }}>ผลการประเมินคุณภาพบัณฑิต</h2>
            <div style={{ color: "#8c8c8c", fontSize: "13px", lineHeight: "1.4" }}>วิเคราะห์ระดับความพึงพอใจของผู้ใช้บัณฑิตตามกรอบมาตรฐาน TQF 5 ด้าน</div>
          </div>
        </Header>

        <Content style={{ padding: "16px 32px 32px 32px", background: "#f5f5f5" }}>
          
          {/* FILTER SECTION */}
          <div style={{ background: "#fff", padding: 24, borderRadius: 20, marginBottom: 24, boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              <div>
                <div style={{ marginBottom: 8, fontWeight: 600 }}>ปีการศึกษา (KPI & กราฟ)</div>
                <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} style={{ width: "100%", padding: 12, borderRadius: 10, border: "1px solid #d9d9d9", outline: "none" }}>
                  <option value="">ทั้งหมดทุกปี</option>
                  {years.map(y => <option key={y} value={y}>ปีการศึกษา {y}</option>)}
                </select>
              </div>
              <div>
                <div style={{ marginBottom: 8, fontWeight: 600 }}>สาขาวิชา</div>
                <select value={selectedMajor} onChange={(e) => setSelectedMajor(e.target.value)} style={{ width: "100%", padding: 12, borderRadius: 10, border: "1px solid #d9d9d9", outline: "none" }}>
                  <option value="">ทั้งหมดทุกสาขา</option>
                  {majors.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
              <Button type="primary" size="large" icon={<SearchOutlined />} onClick={handleApplyFilters} style={{ borderRadius: 10, background: "#13c2c2", borderColor: "#13c2c2" }}>
                ประมวลผลข้อมูลประเมิน
              </Button>
            </div>
          </div>

          {/* KPI ZONE */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 20, marginBottom: 24 }}>
            <Card style={{ borderRadius: 16, textAlign: "center", border: "1px solid #b5f5ec" }}>
              <h3 style={{ color: "#13c2c2", marginBottom: 15 }}>คะแนนเฉลี่ยรวมทุกด้าน</h3>
              <Progress 
                type="circle" 
                percent={(Number(stats.avg) / 5) * 100} 
                format={() => stats.avg}
                strokeColor="#13c2c2"
                size={140}
              />
              <div style={{ marginTop: 15, color: "#8c8c8c" }}>จากคะแนนเต็ม 5.00</div>
            </Card>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 15 }}>
              <div style={{ background: "#e6fffb", padding: 20, borderRadius: 15, border: "1px solid #b5f5ec" }}>
                <div style={{ color: "#8c8c8c", fontSize: 12 }}>ด้านที่ 1</div>
                <h4 style={{ margin: "5px 0", fontSize: 13 }}>คุณธรรมจริยธรรม</h4>
                <h2>{stats.d1}</h2>
                <SafetyCertificateOutlined style={{ fontSize: 24, color: "#13c2c2", float: "right", marginTop: -30, opacity: 0.5 }} />
              </div>
              <div style={{ background: "#e6fffb", padding: 20, borderRadius: 15, border: "1px solid #b5f5ec" }}>
                <div style={{ color: "#8c8c8c", fontSize: 12 }}>ด้านที่ 2</div>
                <h4 style={{ margin: "5px 0", fontSize: 13 }}>ด้านความรู้</h4>
                <h2>{stats.d2}</h2>
                <ReadOutlined style={{ fontSize: 24, color: "#13c2c2", float: "right", marginTop: -30, opacity: 0.5 }} />
              </div>
              <div style={{ background: "#e6fffb", padding: 20, borderRadius: 15, border: "1px solid #b5f5ec" }}>
                <div style={{ color: "#8c8c8c", fontSize: 12 }}>ด้านที่ 3</div>
                <h4 style={{ margin: "5px 0", fontSize: 13 }}>ทักษะทางปัญญา</h4>
                <h2>{stats.d3}</h2>
                <TrophyOutlined style={{ fontSize: 24, color: "#13c2c2", float: "right", marginTop: -30, opacity: 0.5 }} />
              </div>
              <div style={{ background: "#e6fffb", padding: 20, borderRadius: 15, border: "1px solid #b5f5ec" }}>
                <div style={{ color: "#8c8c8c", fontSize: 12 }}>ด้านที่ 4</div>
                <h4 style={{ margin: "5px 0", fontSize: 13 }}>ทักษะสัมพันธ์ฯ</h4>
                <h2>{stats.d4}</h2>
              </div>
              <div style={{ background: "#e6fffb", padding: 20, borderRadius: 15, border: "1px solid #b5f5ec", gridColumn: "span 2" }}>
                <div style={{ color: "#8c8c8c", fontSize: 12 }}>ด้านที่ 5</div>
                <h4 style={{ margin: "5px 0", fontSize: 13 }}>วิเคราะห์ตัวเลข/การสื่อสาร/ไอที</h4>
                <h2>{stats.d5}</h2>
                <VerifiedOutlined style={{ fontSize: 24, color: "#13c2c2", float: "right", marginTop: -30, opacity: 0.5 }} />
              </div>
            </div>
          </div>

          {/* GRAPH */}
          <div style={{ background: "white", padding: 24, borderRadius: 16, marginBottom: 24 }}>
            <h3 style={{ marginBottom: 20 }}>แผนภูมิเปรียบเทียบค่าเฉลี่ยรายด้าน (TQF)</h3>
            <div style={{ height: 350 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 5]} axisLine={false} tickLine={false} />
                  <Tooltip cursor={{fill: '#f0fdfa'}} />
                  <Bar dataKey="score" radius={[8, 8, 0, 0]} barSize={50}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* TABLE ZONE */}
          <div style={{ background: "white", padding: 24, borderRadius: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
              <h3 style={{ margin: 0 }}>รายละเอียดคะแนนการประเมินแยกตามปีและสาขา</h3>
              
              <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#f9fafb", padding: "6px 12px", borderRadius: 10, border: "1px solid #e5e7eb" }}>
                <span style={{ fontSize: 13, fontWeight: 500, color: "#4b5563" }}>เลือกปีดูในตาราง:</span>
                <select 
                  value={tableYearFilter} 
                  onChange={(e) => setTableYearFilter(e.target.value)} 
                  style={{ background: "transparent", border: "none", fontSize: 13, fontWeight: 600, color: "#13c2c2", cursor: "pointer", outline: "none" }}
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
