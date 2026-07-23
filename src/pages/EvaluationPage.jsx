import { Layout, Table, Button, Progress, Card, Empty, Spin } from "antd";
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
  Line,
  Cell
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

// Palette สีสำหรับกราฟย้อนหลัง
const YEARLY_COLORS = ["#2f3559", "#7272b0", "#b7a8bd", "#dcd5e5"];

function EvaluationPage() {
  // สถานะการโหลดข้อมูล (Loading State)
  const [isLoading, setIsLoading] = useState(false);

  // ฟิลเตอร์หลัก (ส่วนบนสุด)
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedMajor, setSelectedMajor] = useState("");
  const [appliedFilters, setAppliedFilters] = useState({ year: "", major: "" });
  
  // ฟิลเตอร์แยกเฉพาะโซนกราฟย้อนหลัง (ทำงานอิสระ 100%)
  const [trendYearFilter, setTrendYearFilter] = useState("");   // ฟิลเตอร์ปีสำหรับกราฟย้อนหลัง 9 กราฟ
  const [trendMajorFilter, setTrendMajorFilter] = useState(""); // ฟิลเตอร์สาขาสำหรับกราฟย้อนหลัง 9 กราฟ

  const [rawData, setRawData] = useState([]);
  const [tableYearFilter, setTableYearFilter] = useState("");

  // 1. โหลดข้อมูลจาก localStorage
  useEffect(() => {
    setIsLoading(true);
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
        
        if (list.length > 0) {
          const latestYear = list[0];
          setSelectedYear(latestYear);
          setTrendYearFilter(latestYear);
          setTableYearFilter(latestYear);
          setAppliedFilters({ year: latestYear, major: "" });
        }
      } catch (e) {
        console.error("Error parsing data", e);
      } finally {
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
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

  // ฟังก์ชันกดค้นหา/ประมวลผล (สำหรับฟิลเตอร์บนสุด)
  const handleApplyFilters = () => {
    setIsLoading(true);

    // อัปเดตเฉพาะฟิลเตอร์หลัก แยกขาดจาก trend-filters ชัดเจน
    setAppliedFilters({ year: selectedYear, major: selectedMajor });

    setTimeout(() => {
      setIsLoading(false);
    }, 400);
  };

  // 3. กรองข้อมูลสำหรับภาพรวมหลัก (KPI Circle และการ์ดสรุปบนสุด)
  const filteredData = useMemo(() => {
    if (isLoading) return [];
    return rawData.filter(item => {
      const year = extractYear(item["ปีการศึกษา"]);
      const majorClean = cleanString(item["ชื่อสาขา"]);

      if (appliedFilters.year && year !== appliedFilters.year) return false;
      if (appliedFilters.major && majorClean !== cleanString(appliedFilters.major)) return false;
      return true;
    });
  }, [rawData, appliedFilters, isLoading]);

  // 4. กรองข้อมูลสำหรับตารางรายละเอียดด้านล่างสุด
  const tableData = useMemo(() => {
    if (isLoading) return [];
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
  }, [rawData, tableYearFilter, appliedFilters.major, isLoading]);

  // 5. คำนวณค่าเฉลี่ยสรุปสำหรับการ์ด KPI
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

  // 6. กราฟแท่งรายองค์ประกอบ
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

  // 7. โซน 9 กราฟย้อนหลัง (รับค่าคำนวณแยกอิสระจาก trendYearFilter และ trendMajorFilter)
  const trendChartsData = useMemo(() => {
    if (!rawData || rawData.length === 0) return [];

    const filteredByMajor = rawData.filter(item => {
      return trendMajorFilter ? cleanString(item["ชื่อสาขา"]) === cleanString(trendMajorFilter) : true;
    });

    const allAvailableYears = [...new Set(filteredByMajor.map(item => extractYear(item["ปีการศึกษา"])))]
      .filter(Boolean)
      .sort();

    if (allAvailableYears.length === 0) return [];

    let targetYears = [];

    if (trendYearFilter) {
      const endYearNum = parseInt(trendYearFilter);
      const startYearNum = endYearNum - 3;
      
      for (let y = startYearNum; y <= endYearNum; y++) {
        targetYears.push(String(y));
      }
    } else {
      targetYears = allAvailableYears.slice(-4);
    }

    return targetYears.map(year => {
      const matchYearData = filteredByMajor.filter(item => extractYear(item["ปีการศึกษา"]) === year);
      
      const getAvg = (key) => {
        if (matchYearData.length === 0) return 0;
        const total = matchYearData.reduce((sum, item) => sum + Number(item[key] || 0), 0);
        return Number((total / matchYearData.length).toFixed(2));
      };

      return {
        year: `ปี ${year}`,
        c2: getAvg("องค์ที่ 2 บัณฑิต"),
        c3: getAvg("องค์ที่ 3 นิสิต"),
        c4: getAvg("องค์ที่ 4อาจารย์"),
        c5: getAvg("องค์ที่ 5หลักสูตร การเรียนการสอน การประเมินผู้เรียน"),
        c6: getAvg("องค์ที่ 6 สิ่งสนับสนุนการเรียนรู้"),
        input: getAvg("Input"),
        process: getAvg("Process"),
        output: getAvg("Output"),
        avgTotal: getAvg("คะแนนเฉลี่ยรวม") || getAvg("คะแนนรวม")
      };
    });
  }, [rawData, trendYearFilter, trendMajorFilter]);

  // คอลัมน์สำหรับตารางรายละเอียดด้านล่างสุด
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

  // Helper สำหรับวาดการ์ดกราฟย่อย
  const renderTrendMiniCard = (title, dataKey) => (
    <Card bodyStyle={{ padding: "16px" }} style={{ borderRadius: 16, boxShadow: "0 1px 3px rgba(0,0,0,0.05)", border: "1px solid #f1f5f9", background: "#ffffff" }}>
      <div style={{ textAlign: "center", marginBottom: 12, minHeight: "36px", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <h4 style={{ margin: 0, fontSize: "13px", fontWeight: "600", color: "#334155", lineHeight: "1.3" }}>
          {title}
        </h4>
      </div>
      <div style={{ height: 180, width: "100%" }}>
        {!isLoading && trendChartsData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={trendChartsData} margin={{ top: 15, right: 5, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f8fafc" />
              <XAxis dataKey="year" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} domain={[0, 5]} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: "#0f172a", borderRadius: 8, border: "none", color: "#fff", fontSize: 12 }} formatter={(value) => [`${value} คะแนน`, 'คะแนนประเมิน']} />
              <Bar dataKey={dataKey} radius={[6, 6, 0, 0]} barSize={22}>
                {trendChartsData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={YEARLY_COLORS[index % YEARLY_COLORS.length]} />
                ))}
                <LabelList dataKey={dataKey} position="top" style={{ fill: '#475569', fontSize: 11, fontWeight: '600' }} formatter={(v) => v > 0 ? v : ''} />
              </Bar>
              <Line type="linear" dataKey={dataKey} stroke="#ef4444" strokeWidth={2.5} dot={{ r: 4, fill: "#ef4444" }} activeDot={{ r: 6 }} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={isLoading ? "กำลังโหลดข้อมูล..." : "ไม่มีข้อมูล"} />
          </div>
        )}
      </div>
    </Card>
  );

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sidebar defaultSelectedKey="eval" />
      <Layout>
        <Header style={{ background: "white", padding: "16px 24px", height: "auto", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #f0f0f0" }}>
          <div>
            <h2 style={{ margin: "0 0 4px 0", fontSize: "20px", fontWeight: "600", color: "#1f1f1f", lineHeight: "1.2" }}>ผลการประเมินคุณภาพหลักสูตร</h2>
            <div style={{ color: "#8c8c8c", fontSize: "13px", lineHeight: "1.4" }}>วิเคราะห์ผลการดำเนินงานของหลักสูตรและคะแนนการประเมินตามเกณฑ์มาตรฐาน AUN-QA / สป.อว.</div>
          </div>
        </Header>

        <Content style={{ padding: "16px 32px 32px 32px", background: "#f5f5f5" }}>
          
          {/* MAIN FILTER SECTION */}
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
              <Button type="primary" size="large" icon={<SearchOutlined />} onClick={handleApplyFilters} loading={isLoading} style={{ borderRadius: 10, background: "#722ed1", borderColor: "#722ed1" }}>
                ประมวลผลการประเมินหลักสูตร
              </Button>
            </div>
          </div>

          {/* MAIN KPI ZONE */}
          <Spin spinning={isLoading}>
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
          </Spin>

          {/* 📊 CHART ZONE (แผนภูมิแท่งผลการประเมินคุณภาพรายองค์ประกอบ) */}
          <div style={{ background: "white", padding: 24, borderRadius: 16, marginBottom: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
              <BarChartOutlined style={{ fontSize: 20, color: "#722ed1" }} />
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>แผนภูมิแท่งผลการประเมินคุณภาพรายองค์ประกอบ</h3>
            </div>
            <Spin spinning={isLoading}>
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
            </Spin>
          </div>

          {/* 📈 วิเคราะห์แนวโน้มผลการประเมินคุณภาพย้อนหลัง 4 ปี (TQF) (โซน 9 กราฟย้อนหลัง - ฟิลเตอร์ทำงานอิสระ 100%) */}
          <div style={{ background: "white", padding: 24, borderRadius: 16, marginBottom: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
            
            <div style={{
              background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
              padding: "24px 32px",
              borderRadius: 16,
              boxShadow: "0 10px 25px -5px rgba(15, 23, 42, 0.15), 0 8px 10px -6px rgba(15, 23, 42, 0.15)",
              marginBottom: 24,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 20
            }}>
              <div>
                <h3 style={{ color: "#ffffff", fontSize: "20px", fontWeight: "600", margin: 0, letterSpacing: "-0.5px", display: "flex", alignItems: "center", gap: 10 }}>
                  <HistoryOutlined style={{ color: "#38bdf8" }} />
                  วิเคราะห์แนวโน้มผลการประเมินคุณภาพย้อนหลัง 4 ปี (TQF)
                </h3>
                <p style={{ color: "#94a3b8", fontSize: "13px", margin: "6px 0 0 0" }}>
                  เปรียบเทียบสถิติและผลประเมินย้อนหลัง 4 ปีการศึกษาเพื่อวิเคราะห์คุณภาพอย่างต่อเนื่อง
                </p>
              </div>
              
              <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap", color: "#e2e8f0", fontSize: "13px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <span style={{ color: "#94a3b8", fontSize: "11px", textTransform: "uppercase", fontWeight: "600", letterSpacing: "0.5px" }}>ปีการศึกษาอ้างอิง</span>
                  <select 
                    value={trendYearFilter} 
                    onChange={(e) => setTrendYearFilter(e.target.value)} 
                    style={{ background: "rgba(255, 255, 255, 0.07)", border: "1px solid rgba(255, 255, 255, 0.15)", borderRadius: "8px", padding: "8px 14px", color: "#ffffff", outline: "none", cursor: "pointer", fontSize: "13px", minWidth: "120px", backdropFilter: "blur(4px)" }}
                  >
                    <option value="" style={{ color: "#0f172a" }}>ทั้งหมด</option>
                    {years.map(y => <option key={`trend-y-${y}`} value={y} style={{ color: "#0f172a" }}>ปีการศึกษา {y}</option>)}
                  </select>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <span style={{ color: "#94a3b8", fontSize: "11px", textTransform: "uppercase", fontWeight: "600", letterSpacing: "0.5px" }}>สาขาวิชา</span>
                  <select 
                    value={trendMajorFilter} 
                    onChange={(e) => setTrendMajorFilter(e.target.value)} 
                    style={{ background: "rgba(255, 255, 255, 0.07)", border: "1px solid rgba(255, 255, 255, 0.15)", borderRadius: "8px", padding: "8px 14px", color: "#ffffff", outline: "none", cursor: "pointer", maxWidth: "260px", fontSize: "13px", backdropFilter: "blur(4px)" }}
                  >
                    <option value="" style={{ color: "#0f172a" }}>ทั้งหมด</option>
                    {majors.map(m => <option key={`trend-m-${m}`} value={m} style={{ color: "#0f172a" }}>{m}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* แสดง 9 กราฟย่อย (Grid 3 Column) */}
            <Spin spinning={isLoading}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
                {renderTrendMiniCard("คะแนนเฉลี่ยด้าน Input", "input")}
                {renderTrendMiniCard("คะแนนเฉลี่ยด้าน Process", "process")}
                {renderTrendMiniCard("คะแนนเฉลี่ยด้าน Output", "output")}
                
                {renderTrendMiniCard("คะแนนเฉลี่ยตัวบ่งชี้ที่ 2 (องค์ฯ 2 บัณฑิต)", "c2")}
                {renderTrendMiniCard("คะแนนเฉลี่ยตัวบ่งชี้ที่ 3 (องค์ฯ 3 นิสิต)", "c3")}
                {renderTrendMiniCard("คะแนนเฉลี่ยตัวบ่งชี้ที่ 4 (องค์ฯ 4 อาจารย์)", "c4")}
                
                {renderTrendMiniCard("คะแนนเฉลี่ยตัวบ่งชี้ที่ 5 (องค์ฯ 5 หลักสูตร)", "c5")}
                {renderTrendMiniCard("คะแนนเฉลี่ยตัวบ่งชี้ที่ 6 (องค์ฯ 6 สิ่งสนับสนุน)", "c6")}
                {renderTrendMiniCard("คะแนนเฉลี่ยรวม", "avgTotal")}
              </div>
            </Spin>
          </div>

          {/* 📋 TABLE ZONE รายละเอียดคะแนนการประเมินหลักสูตรรายปี (ตารางล่างสุด) */}
          <div style={{ background: "white", padding: 24, borderRadius: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>รายละเอียดคะแนนการประเมินหลักสูตรรายปี</h3>
              <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#f9fafb", padding: "6px 12px", borderRadius: 10, border: "1px solid #e5e7eb" }}>
                <span style={{ fontSize: 13, fontWeight: 500, color: "#4b5563" }}>ปีการศึกษา:</span>
                <select value={tableYearFilter} onChange={(e) => setTableYearFilter(e.target.value)} style={{ background: "transparent", border: "none", fontSize: 13, fontWeight: 600, color: "#722ed1", cursor: "pointer", outline: "none" }}>
                  <option value="">แสดงทุกปี</option>
                  {years.map((year) => <option key={year} value={year}>ปีการศึกษา {year}</option>)}
                </select>
              </div>
            </div>
            <Table 
              columns={tableColumns} 
              dataSource={tableData} 
              rowKey={(r, idx) => `${r.year}-${r.major}-${idx}`} 
              pagination={{ pageSize: 10 }} 
              scroll={{ x: true }} 
              bordered 
              loading={isLoading}
            />
          </div>

        </Content>
      </Layout>
    </Layout>
  );
}

export default EvaluationPage;
