import { Layout, Table, Button, Progress, Card, Empty } from "antd";
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
  LabelList
} from "recharts";
import { 
  SearchOutlined, 
  BookOutlined, 
  SlidersOutlined, 
  ExportOutlined,
  BarChartOutlined,
  HistoryOutlined
} from "@ant-design/icons";

const { Header, Content } = Layout;

// Palette สีเรียบหรูสไตล์ Dashboard สากล สำหรับแท่งกราฟเปรียบเทียบรายปี (รองรับได้สูงสุด 6 ปีเรียงกัน)
const CHART_COLORS = ["#722ed1", "#13c2c2", "#1890ff", "#fa8c16", "#eb2f96", "#2f54eb"];

function EvaluationPage() {
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedMajor, setSelectedMajor] = useState("");
  const [appliedFilters, setAppliedFilters] = useState({ year: "", major: "" });
  const [rawData, setRawData] = useState([]);
  const [tableYearFilter, setTableYearFilter] = useState("");

  // 1. โหลดข้อมูลจาก localStorage
  useEffect(() => {
    const stored = localStorage.getItem("dashboardData");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const evalData = parsed["ผลการประเมินคุณภาพหลักสูตร"] || [];
        setRawData(evalData);
        
        const list = evalData.map(item => {
          if (!item["ปีการศึกษา"]) return "";
          const match = String(item["ปีการศึกษา"]).match(/\d+/);
          return match ? match[0] : String(item["ปีการศึกษา"]).trim();
        }).filter(Boolean).sort().reverse();
        
        // ตั้งค่าเริ่มต้นให้ตารางข้อมูลด้านล่างสุดแสดงผลปีล่าสุดเป็นค่าเริ่มต้น
        if (list.length > 0) {
          setTableYearFilter(list[0]);
        }
      } catch (e) {
        console.error("Error parsing data", e);
      }
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

  // 2. ดึงข้อมูลทำ Dropdown ตัวเลือกหลัก
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

  // 3. กรองข้อมูลสำหรับภาพรวมหลัก (KPI Circle) และกราฟโซนที่ 1
  const filteredData = useMemo(() => {
    return rawData.filter(item => {
      const year = extractYear(item["ปีการศึกษา"]);
      const majorClean = cleanString(item["ชื่อสาขา"]);

      if (appliedFilters.year && year !== appliedFilters.year) return false;
      if (appliedFilters.major && majorClean !== cleanString(appliedFilters.major)) return false;
      return true;
    });
  }, [rawData, appliedFilters]);

  // 4. กรองข้อมูลสำหรับตารางรายละเอียดด้านล่างสุด
  const tableData = useMemo(() => {
    return rawData.filter(item => {
      const year = extractYear(item["ปีการศึกษา"]);
      const majorClean = cleanString(item["ชื่อสาขา"]);

      if (tableYearFilter && year !== tableYearFilter) return false;
      if (appliedFilters.major && majorClean !== cleanString(appliedFilters.major)) return false;
      return true;
    }).map(item => ({
      ...item,
      year: extractYear(item["ปีการศึกษา"]),
      major: String(item["ชื่อสาขา"] || "").replace(/\n/g, ' ').trim()
    }));
  }, [rawData, tableYearFilter, appliedFilters.major]);

  // 5. คำนวณค่าเฉลี่ยสรุปสำหรับการ์ด KPI วงกลมด้านบน
  const stats = useMemo(() => {
    if (filteredData.length === 0) {
      return { input: 0, process: 0, output: 0, comp2: 0, comp3: 0, comp4: 0, comp5: 0, comp6: 0, avg: 0 };
    }

    let sumInput = 0, sumProcess = 0, sumOutput = 0, sumAvg = 0;
    let sumC2 = 0, sumC3 = 0, sumC4 = 0, sumC5 = 0, sumC6 = 0;
    let cInput = 0, cProcess = 0, cOutput = 0, cAvg = 0;
    let cC2 = 0, cC3 = 0, cC4 = 0, cC5 = 0, cC6 = 0;

    filteredData.forEach(item => {
      const inp = Number(item["Input"] || 0);
      const prc = Number(item["Process"] || 0);
      const out = Number(item["Output"] || 0);
      const av = Number(item["คะแนนเฉลี่ยรวม"] || item["คะแนนรวม"] || 0);
      
      const c2 = Number(item["องค์ที่ 2 บัณฑิต"] || 0);
      const c3 = Number(item["องค์ที่ 3 นิสิต"] || 0);
      const c4 = Number(item["องค์ที่ 4อาจารย์"] || 0);
      const c5 = Number(item["องค์ที่ 5หลักสูตร การเรียนการสอน การประเมินผู้เรียน"] || 0);
      const c6 = Number(item["องค์ที่ 6 สิ่งสนับสนุนการเรียนรู้"] || 0);

      if (inp > 0) { sumInput += inp; cInput++; }
      if (prc > 0) { sumProcess += prc; cProcess++; }
      if (out > 0) { sumOutput += out; cOutput++; }
      if (av > 0) { sumAvg += av; cAvg++; }
      
      if (c2 > 0) { sumC2 += c2; cC2++; }
      if (c3 > 0) { sumC3 += c3; cC3++; }
      if (c4 > 0) { sumC4 += c4; cC4++; }
      if (c5 > 0) { sumC5 += c5; cC5++; }
      if (c6 > 0) { sumC6 += c6; cC6++; }
    });

    return {
      input: cInput > 0 ? Number((sumInput / cInput).toFixed(2)) : 0,
      process: cProcess > 0 ? Number((sumProcess / cProcess).toFixed(2)) : 0,
      output: cOutput > 0 ? Number((sumOutput / cOutput).toFixed(2)) : 0,
      comp2: cC2 > 0 ? Number((sumC2 / cC2).toFixed(2)) : 0,
      comp3: cC3 > 0 ? Number((sumC3 / cC3).toFixed(2)) : 0,
      comp4: cC4 > 0 ? Number((sumC4 / cC4).toFixed(2)) : 0,
      comp5: cC5 > 0 ? Number((sumC5 / cC5).toFixed(2)) : 0,
      comp6: cC6 > 0 ? Number((sumC6 / cC6).toFixed(2)) : 0,
      avg: cAvg > 0 ? Number((sumAvg / cAvg).toFixed(2)) : 0
    };
  }, [filteredData]);

  // 6. ลอจิกสร้างกราฟตัวที่ 1 (กราฟแท่งเดี่ยวตามผลการกรองค้นหา)
  const dynamicGraphData = useMemo(() => {
    if (filteredData.length === 0) return [];
    return [
      { name: "องค์ฯ 2 บัณฑิต", score: stats.comp2 },
      { name: "องค์ฯ 3 นิสิต", score: stats.comp3 },
      { name: "องค์ฯ 4 อาจารย์", score: stats.comp4 },
      { name: "องค์ฯ 5 หลักสูตร", score: stats.comp5 },
      { name: "องค์ฯ 6 สิ่งสนับสนุน", score: stats.comp6 },
      { name: "ด้าน Input", score: stats.input },
      { name: "ด้าน Process", score: stats.process },
      { name: "ด้าน Output", score: stats.output },
    ];
  }, [filteredData, stats]);

  // 7. 🌟 ลอจิกสร้างกราฟตัวที่ 2 ใหม่: กราฟแท่งกลุ่มแสดงเปรียบเทียบทุกปีพร้อมกัน (Multi-Bar Chart)
  const yearlyComparison = useMemo(() => {
    if (!rawData || rawData.length === 0) return { data: [], yearsList: [] };
    try {
      // กรองสาขาตามตัวค้นหาหลักด้านบน (ถ้าเลือก) เพื่อแยกดูรายสาขาแบบเปรียบเทียบรายปีได้
      const filteredByMajor = rawData.filter(item => {
        if (!appliedFilters.major) return true;
        return cleanString(item["ชื่อสาขา"]) === cleanString(appliedFilters.major);
      });

      // ดึงรายชื่อปีการศึกษาทั้งหมดเรียงจากอดีตไปปัจจุบันเพื่อสร้างลำดับแท่งกราฟจากซ้ายไปขวา
      const allYears = [...new Set(filteredByMajor.map(item => extractYear(item["ปีการศึกษา"])))].filter(Boolean).sort();

      const components = [
        { key: "องค์ที่ 2 บัณฑิต", name: "องค์ฯ 2 บัณฑิต" },
        { key: "องค์ที่ 3 นิสิต", name: "องค์ฯ 3 นิสิต" },
        { key: "องค์ที่ 4อาจารย์", name: "องค์ฯ 4 อาจารย์" },
        { key: "องค์ที่ 5หลักสูตร การเรียนการสอน การประเมินผู้เรียน", name: "องค์ฯ 5 หลักสูตร" },
        { key: "องค์ที่ 6 สิ่งสนับสนุนการเรียนรู้", name: "องค์ฯ 6 สิ่งสนับสนุน" },
        { key: "Input", name: "ด้าน Input" },
        { key: "Process", name: "ด้าน Process" },
        { key: "Output", name: "ด้าน Output" }
      ];

      // แมปจัดโครงสร้างข้อมูลให้อยู่ในแถวเดียวกันแต่แยกเป็นคีย์ของแต่ละปี
      const formattedGraphData = components.map(comp => {
        const row = { name: comp.name };
        allYears.forEach(year => {
          const matchYearData = filteredByMajor.filter(item => extractYear(item["ปีการศึกษา"]) === year);
          if (matchYearData.length > 0) {
            const totalScore = matchYearData.reduce((sum, item) => sum + Number(item[comp.key] || 0), 0);
            row[`year_${year}`] = Number((totalScore / matchYearData.length).toFixed(2)) || 0;
          } else {
            row[`year_${year}`] = 0; // หากปีนั้นไม่มีข้อมูลให้คะแนนเป็น 0
          }
        });
        return row;
      });

      return { data: formattedGraphData, yearsList: allYears };
    } catch (err) {
      console.error("Error calculating multi-year data:", err);
      return { data: [], yearsList: [] };
    }
  }, [rawData, appliedFilters.major]);

  const tableColumns = [
    { title: "ปีการศึกษา", dataIndex: "year", key: "year", width: 105, align: "center" },
    { title: "สาขาวิชา", dataIndex: "major", key: "major" },
    { title: "Input", dataIndex: "Input", key: "Input", align: "center", render: v => v || "-" },
    { title: "Process", dataIndex: "Process", key: "Process", align: "center", render: v => v || "-" },
    { title: "Output", dataIndex: "Output", key: "Output", align: "center", render: v => v || "-" },
    { title: "องค์ฯ 2 บัณฑิต", dataIndex: "องค์ที่ 2 บัณฑิต", key: "c2", align: "center", render: v => v || "-" },
    { title: "องค์ฯ 3 นิสิต", dataIndex: "องค์ที่ 3 นิสิต", key: "c3", align: "center", render: v => v || "-" },
    { title: "องค์ฯ 4 อาจารย์", dataIndex: "องค์ที่ 4อาจารย์", key: "c4", align: "center", render: v => v || "-" },
    { title: "องค์ฯ 5 หลักสูตร", dataIndex: "องค์ที่ 5หลักสูตร การเรียนการสอน การประเมินผู้เรียน", key: "c5", align: "center", render: v => v || "-" },
    { title: "องค์ฯ 6 สิ่งสนับสนุน", dataIndex: "องค์ที่ 6 สิ่งสนับสนุนการเรียนรู้", key: "c6", align: "center", render: v => v || "-" },
    { title: "คะแนนเฉลี่ยรวม", dataIndex: "คะแนนเฉลี่ยรวม", key: "total", align: "center", render: v => <span style={{ color: "#722ed1", fontWeight: "bold" }}>{v || "-"}</span> },
  ];

  const evalTableColumns = [
    { title: "องค์ประกอบ / ตัวบ่งชี้คุณภาพ", dataIndex: "name", key: "name" },
    { title: "คะแนนผลการดำเนินงาน (ตามฟิลเตอร์)", dataIndex: "score", key: "score", align: "center", render: (v) => <strong style={{ color: "#722ed1", fontSize: 15 }}>{Number(v || 0).toFixed(2)}</strong> },
  ];

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sidebar />
      <Layout>
        <Header style={{ background: "white", padding: "16px 24px", height: "auto", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #f0f0f0" }}>
          <div>
            <h2 style={{ margin: "0 0 4px 0", fontSize: "20px", fontWeight: "600", color: "#1f1f1f", lineHeight: "1.2" }}>ผลการประเมินคุณภาพหลักสูตร</h2>
            <div style={{ color: "#8c8c8c", fontSize: "13px", lineHeight: "1.4" }}>วิเคราะห์ผลการดำเนินงานของหลักสูตรและคะแนนการประเมินตามเกณฑ์มาตรฐาน AUN-QA / สป.อว.</div>
          </div>
        </Header>

        <Content style={{ padding: "16px 32px 32px 32px", background: "#f5f5f5" }}>
          
          {/* FILTER SECTION */}
          <div style={{ background: "#fff", padding: 24, borderRadius: 20, marginBottom: 24, boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              <div>
                <div style={{ marginBottom: 8, fontWeight: 600 }}>ปีการศึกษา</div>
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
              <Button type="primary" size="large" icon={<SearchOutlined />} onClick={handleApplyFilters} style={{ borderRadius: 10, background: "#722ed1", borderColor: "#722ed1" }}>
                ประมวลผลการประเมินหลักสูตร
              </Button>
            </div>
          </div>

          {/* MAIN KPI ZONE */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 20, marginBottom: 24 }}>
            <Card style={{ borderRadius: 16, textAlign: "center", border: "1px solid #d3adf7", boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}>
              <h3 style={{ color: "#722ed1", marginBottom: 15, fontSize: 15, fontWeight: 600 }}>คะแนนเฉลี่ยรวมหลักสูตร</h3>
              <Progress 
                type="circle" 
                percent={(stats.avg / 5) * 100} 
                format={() => stats.avg.toFixed(2)}
                strokeColor="#722ed1"
                size={140}
              />
              <div style={{ marginTop: 15, color: "#8c8c8c", fontSize: 13 }}>คะแนนเต็ม 5.00 คะแนน</div>
            </Card>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 15 }}>
              <div style={{ background: "#f9f0ff", padding: 20, borderRadius: 15, border: "1px solid #d3adf7" }}>
                <div style={{ color: "#8c8c8c", fontSize: 12 }}>ตัวบ่งชี้หลัก</div>
                <h4 style={{ margin: "5px 0", fontSize: 14 }}>ด้าน Input</h4>
                <h2>{stats.input.toFixed(2)}</h2>
                <BookOutlined style={{ fontSize: 24, color: "#722ed1", float: "right", marginTop: -30, opacity: 0.4 }} />
              </div>
              <div style={{ background: "#f9f0ff", padding: 20, borderRadius: 15, border: "1px solid #d3adf7" }}>
                <div style={{ color: "#8c8c8c", fontSize: 12 }}>ตัวบ่งชี้หลัก</div>
                <h4 style={{ margin: "5px 0", fontSize: 14 }}>ด้าน Process</h4>
                <h2>{stats.process.toFixed(2)}</h2>
                <SlidersOutlined style={{ fontSize: 24, color: "#722ed1", float: "right", marginTop: -30, opacity: 0.4 }} />
              </div>
              <div style={{ background: "#f9f0ff", padding: 20, borderRadius: 15, border: "1px solid #d3adf7" }}>
                <div style={{ color: "#8c8c8c", fontSize: 12 }}>ตัวบ่งชี้หลัก</div>
                <h4 style={{ margin: "5px 0", fontSize: 14 }}>ด้าน Output</h4>
                <h2>{stats.output.toFixed(2)}</h2>
                <ExportOutlined style={{ fontSize: 24, color: "#722ed1", float: "right", marginTop: -30, opacity: 0.4 }} />
              </div>
              <div style={{ background: "#fff", padding: 16, borderRadius: 12, border: "1px solid #e8e8e8", gridColumn: "span 3", display: "flex", justifyContent: "space-around", alignItems: "center", boxShadow: "0 2px 6px rgba(0,0,0,0.01)" }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 11, color: "#8c8c8c" }}>องค์ฯ 2 บัณฑิต</div>
                  <strong style={{ fontSize: 16, color: "#722ed1" }}>{stats.comp2.toFixed(2)}</strong>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 11, color: "#8c8c8c" }}>องค์ฯ 3 นิสิต</div>
                  <strong style={{ fontSize: 16, color: "#722ed1" }}>{stats.comp3.toFixed(2)}</strong>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 11, color: "#8c8c8c" }}>องค์ฯ 4 อาจารย์</div>
                  <strong style={{ fontSize: 16, color: "#722ed1" }}>{stats.comp4.toFixed(2)}</strong>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 11, color: "#8c8c8c" }}>องค์ฯ 5 หลักสูตร</div>
                  <strong style={{ fontSize: 16, color: "#722ed1" }}>{stats.comp5.toFixed(2)}</strong>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 11, color: "#8c8c8c" }}>องค์ฯ 6 สิ่งสนับสนุน</div>
                  <strong style={{ fontSize: 16, color: "#722ed1" }}>{stats.comp6.toFixed(2)}</strong>
                </div>
              </div>
            </div>
          </div>

          {/* CHART ZONE 1 */}
          <div style={{ background: "white", padding: 24, borderRadius: 16, marginBottom: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
              <BarChartOutlined style={{ fontSize: 20, color: "#722ed1" }} />
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>แผนภูมิแท่งผลการประเมินคุณภาพรายองค์ประกอบ</h3>
            </div>
            {dynamicGraphData.length === 0 ? <Empty description="ไม่พบข้อมูลสำหรับการวาดแผนภูมิประเมิน" /> : (
              <div style={{ height: 380 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dynamicGraphData} margin={{ top: 20, right: 30, left: 0, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} style={{ fontSize: 12, fill: "#64748b", fontWeight: 500 }} />
                    <YAxis axisLine={false} tickLine={false} domain={[0, 5]} style={{ fontSize: 12, fill: "#64748b" }} />
                    <Tooltip contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }} formatter={(value) => [`${Number(value).toFixed(2)} คะแนน`]} />
                    
                    <Bar dataKey="score" name="คะแนนผลการประเมินคุณภาพ" fill="#722ed1" radius={[6, 6, 0, 0]} barSize={35}>
                      <LabelList dataKey="score" position="top" style={{ fontSize: 11, fontWeight: 600, fill: "#722ed1" }} formatter={(v) => v > 0 ? Number(v).toFixed(2) : ''} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* TABLE ZONE สำหรับแสดงรายละเอียดกราฟ 1 */}
          {dynamicGraphData.length > 0 && (
            <div style={{ background: "white", padding: 24, borderRadius: 16, marginBottom: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
              <h3 style={{ marginBottom: 16, fontSize: 15, fontWeight: 600 }}>ตารางแสดงคะแนนประเมินคุณภาพ</h3>
              <Table columns={evalTableColumns} dataSource={dynamicGraphData} rowKey={(r, idx) => `eval-row-${idx}`} pagination={false} bordered size="small" />
            </div>
          )}

          {/* 🌟 CHART ZONE 2: ปรับโฉมเป็น "กราฟแท่งกลุ่มเปรียบเทียบทุกปีการศึกษาพร้อมกัน" 🌟 */}
          <div style={{ background: "white", padding: 24, borderRadius: 16, marginBottom: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <HistoryOutlined style={{ fontSize: 20, color: "#13c2c2" }} />
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>
                  แผนภูมิเปรียบเทียบผลการประเมินคุณภาพหลักสูตรรายปีการศึกษา {appliedFilters.major ? `(${appliedFilters.major})` : "(รวมทุกสาขาวิชา)"}
                </h3>
              </div>
            </div>

            {yearlyComparison.data.length === 0 ? <Empty description="ไม่พบสถิติรายปีสำหรับการเปรียบเทียบข้อมูล" /> : (
              <div style={{ height: 420 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={yearlyComparison.data} margin={{ top: 25, right: 20, left: 0, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} style={{ fontSize: 12, fill: "#64748b", fontWeight: 500 }} />
                    <YAxis axisLine={false} tickLine={false} domain={[0, 5]} style={{ fontSize: 12, fill: "#64748b" }} />
                    <Tooltip contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }} formatter={(value) => [`${Number(value).toFixed(2)} คะแนน`]} />
                    
                    {/* Legend ด้านบนจะแสดงรายชื่อปีการศึกษาคู่กับแถบสีที่ระบบแยกให้ */}
                    <Legend verticalAlign="top" height={45} iconType="circle" iconSize={10} wrapperStyle={{ fontSize: 13, fontWeight: 500 }} />
                    
                    {/* Loop สร้างแท่งแยกตามจำนวนปีที่มีในระบบโดยอัตโนมัติ เพื่อนำมาวางเปรียบเทียบกัน */}
                    {yearlyComparison.yearsList.map((year, idx) => (
                      <Bar 
                        key={year} 
                        dataKey={`year_${year}`} 
                        name={`ปีการศึกษา ${year}`} 
                        fill={CHART_COLORS[idx % CHART_COLORS.length]} 
                        radius={[5, 5, 0, 0]} 
                        barSize={20} // ปรับขนาดแท่งเล็กลงเล็กน้อย เพื่อให้ตั้งกลุ่มเรียงข้างกันอย่างสวยงาม ไม่ซ้อนทับกัน
                      >
                        <LabelList dataKey={`year_${year}`} position="top" style={{ fontSize: 9, fill: "#4b5563", fontWeight: 600 }} formatter={(v) => v > 0 ? Number(v).toFixed(2) : ''} />
                      </Bar>
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* TABLE ZONE ระบบเดิม */}
          <div style={{ background: "white", padding: 24, borderRadius: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>รายละเอียดคะแนนการประเมินหลักสูตรรายปี </h3>
              <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#f9fafb", padding: "6px 12px", borderRadius: 10, border: "1px solid #e5e7eb" }}>
                <span style={{ fontSize: 13, fontWeight: 500, color: "#4b5563" }}>ปีการศึกษา:</span>
                <select value={tableYearFilter} onChange={(e) => setTableYearFilter(e.target.value)} style={{ background: "transparent", border: "none", fontSize: 13, fontWeight: 600, color: "#722ed1", cursor: "pointer", outline: "none" }}>
                  <option value="">แสดงทุกปี</option>
                  {years.map((year) => <option key={year} value={year}>ปีการศึกษา {year}</option>)}
                </select>
              </div>
            </div>
            <Table columns={tableColumns} dataSource={tableData} rowKey={(r, idx) => `${r.year}-${r.major}-${idx}`} pagination={{ pageSize: 10 }} scroll={{ x: true }} bordered />
          </div>

        </Content>
      </Layout>
    </Layout>
  );
}

export default EvaluationPage;
