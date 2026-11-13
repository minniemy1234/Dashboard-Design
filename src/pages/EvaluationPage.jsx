import React, { useMemo, useState, useEffect, useCallback } from "react";
import { Layout, Table, Button, Progress, Card, Empty, Spin, Tag, Select as AntSelect } from "antd";
import Sidebar from "../components/Sidebar";
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
const YEARLY_COLORS = ["#0ea5e9", "#0284c7", "#0369a1", "#075985"];

// Pure Helper Functions
const cleanString = (str) => {
  if (!str) return "";
  return String(str).replace(/\s+/g, "").replace(/['"]+/g, "").trim();
};

const extractYear = (yearStr) => {
  if (!yearStr) return "";
  const match = String(yearStr).match(/\d+/);
  return match ? match[0] : String(yearStr).trim();
};

// 🔹 ฟังก์ชั่นช่วยดึงค่าจากคอลัมน์ที่ชื่อต่างกันในแต่ละไฟล์
const getItemValue = (item, keys) => {
  if (!item || typeof item !== "object") return null;
  for (const k of keys) {
    if (item[k] !== undefined && item[k] !== null && item[k] !== "") {
      return item[k];
    }
  }
  return null;
};

// 🔹 ฟังก์ชั่นเช็กว่าสาขาเป็นระดับปริญญาโทหรือไม่
const isMasterMajor = (majorStr) => {
  if (!majorStr) return false;
  const str = String(majorStr).trim();
  return str.startsWith("วท.ม.") || str.startsWith("X") || str.startsWith("x") || str.startsWith("XS") || str.startsWith("xs");
};

// 🔹 ฟังก์ชั่นทำความสะอาดชื่อสาขา (คงคำว่า วท.ม. ไว้สำหรับ ป.โท)
const cleanMajorName = (majorStr) => {
  if (!majorStr) return "";
  let name = String(majorStr).replace(/\n/g, ' ').trim();
  name = name.replace(/^วท\.บ\./, '').replace(/^สาขาวิชา/, '').replace(/^หลักสูตร/, '').trim();
  return name;
};

// ฟังก์ชันแปลงค่าตัวเลขให้แสดงทศนิยม 2 ตำแหน่ง
const formatScore = (val) => {
  if (val === undefined || val === null || val === "" || Number(val) === 0) return "-";
  const num = Number(val);
  return isNaN(num) ? "-" : num.toFixed(2);
};

function EvaluationPage() {
  // สถานะการโหลดข้อมูล
  const [isLoading, setIsLoading] = useState(false);

  // ฟิลเตอร์หลัก (ส่วนบนสุด)
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedMajor, setSelectedMajor] = useState("");
  const [appliedFilters, setAppliedFilters] = useState({ year: "", major: "" });
  
  // ฟิลเตอร์แยกเฉพาะโซนกราฟย้อนหลัง
  const [trendYearFilter, setTrendYearFilter] = useState("");   
  const [trendMajorFilter, setTrendMajorFilter] = useState(""); 

  const [rawData, setRawData] = useState([]);
  const [tableYearFilter, setTableYearFilter] = useState("");

  // 1. โหลดข้อมูลจาก localStorage
  useEffect(() => {
    setIsLoading(true);
    const stored = localStorage.getItem("dashboardData");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const evalData = parsed["ผลการประเมินคุณภาพหลักสูตร"] || parsed["ข้อมูลผลการประเมินคุณภาพหลักสูตร"] || parsed["ข้อมูลวิจัย"] || [];
        setRawData(evalData);
        
        const list = evalData
          .map(item => extractYear(getItemValue(item, ["ปีการศึกษา"])))
          .filter(Boolean)
          .sort()
          .reverse();
        
        if (list.length > 0) {
          const latestYear = list[0];
          setSelectedYear(latestYear);
          setTrendYearFilter(latestYear);
          setTableYearFilter(latestYear);
          setAppliedFilters({ year: latestYear, major: "" });
        }
      } catch (e) {
        console.error("Error parsing dashboardData from localStorage:", e);
      } finally {
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }
  }, []);

  // 2. ดึงข้อมูลทำ Dropdown ตัวเลือกหลัก (แยกกลุ่ม ป.ตรี และ ป.โท)
  const years = useMemo(() => {
    const list = rawData.map(item => extractYear(getItemValue(item, ["ปีการศึกษา"])));
    return [...new Set(list)].filter(Boolean).sort().reverse();
  }, [rawData]);

  const majors = useMemo(() => {
    const list = rawData.map(item => cleanMajorName(getItemValue(item, ["ชื่อสาขา", "หลักสูตร", "สาขาวิชา"])));
    const combined = [...new Set(list)].filter(Boolean);
    
    // เรียงให้ ป.ตรี ขึ้นก่อน แล้วตามด้วย ป.โท
    const bachelorList = combined.filter(m => !isMasterMajor(m)).sort();
    const masterList = combined.filter(m => isMasterMajor(m)).sort();

    return [...bachelorList, ...masterList];
  }, [rawData]);

  // ฟังก์ชันกดค้นหา/ประมวลผล
  const handleApplyFilters = useCallback(() => {
    setIsLoading(true);
    setAppliedFilters({ year: selectedYear, major: selectedMajor });

    setTimeout(() => {
      setIsLoading(false);
    }, 300);
  }, [selectedYear, selectedMajor]);

  // 3. กรองข้อมูลสำหรับภาพรวมหลัก
  const filteredData = useMemo(() => {
    if (isLoading || rawData.length === 0) return [];
    return rawData.filter(item => {
      const year = extractYear(getItemValue(item, ["ปีการศึกษา"]));
      const majorClean = cleanString(cleanMajorName(getItemValue(item, ["ชื่อสาขา", "หลักสูตร", "สาขาวิชา"])));

      if (appliedFilters.year && year !== appliedFilters.year) return false;
      if (appliedFilters.major && majorClean !== cleanString(appliedFilters.major)) return false;
      return true;
    });
  }, [rawData, appliedFilters, isLoading]);

  // 4. กรองข้อมูลสำหรับตารางรายละเอียดด้านล่างสุด
  const tableData = useMemo(() => {
    if (isLoading || rawData.length === 0) return [];
    return rawData
      .filter(item => {
        const year = extractYear(getItemValue(item, ["ปีการศึกษา"]));
        const majorClean = cleanString(cleanMajorName(getItemValue(item, ["ชื่อสาขา", "หลักสูตร", "สาขาวิชา"])));

        if (tableYearFilter && year !== tableYearFilter) return false;
        if (appliedFilters.major && majorClean !== cleanString(appliedFilters.major)) return false;
        return true;
      })
      .map(item => {
        const mName = cleanMajorName(getItemValue(item, ["ชื่อสาขา", "หลักสูตร", "สาขาวิชา"]));
        return {
          ...item,
          year: extractYear(getItemValue(item, ["ปีการศึกษา"])),
          major: mName,
          isMaster: isMasterMajor(mName),
          comp2: getItemValue(item, ["องค์ที่ 2 บัณฑิต", "บัณฑิต"]),
          comp3: getItemValue(item, ["องค์ที่ 3 นิสิต", "นิสิต"]),
          comp4: getItemValue(item, ["องค์ที่ 4อาจารย์", "อาจารย์"]),
          comp5: getItemValue(item, ["องค์ที่ 5หลักสูตร การเรียนการสอน การประเมินผู้เรียน", "หลักสูตร การเรียนการสอน การประเมินผู้เรียน"]),
          comp6: getItemValue(item, ["องค์ที่ 6 สิ่งสนับสนุนการเรียนรู้", "สิ่งสนับสนุนการเรียนรู้"]),
          avgTotal: getItemValue(item, ["คะแนนเฉลี่ยรวม", "คะแนนรวม"])
        };
      });
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
      const inp = Number(getItemValue(item, ["Input"]) || 0);
      const prc = Number(getItemValue(item, ["Process"]) || 0);
      const out = Number(getItemValue(item, ["Output"]) || 0);
      const av = Number(getItemValue(item, ["คะแนนเฉลี่ยรวม", "คะแนนรวม"]) || 0);
      
      const c2 = Number(getItemValue(item, ["องค์ที่ 2 บัณฑิต", "บัณฑิต"]) || 0);
      const c3 = Number(getItemValue(item, ["องค์ที่ 3 นิสิต", "นิสิต"]) || 0);
      const c4 = Number(getItemValue(item, ["องค์ที่ 4อาจารย์", "อาจารย์"]) || 0);
      const c5 = Number(getItemValue(item, ["องค์ที่ 5หลักสูตร การเรียนการสอน การประเมินผู้เรียน", "หลักสูตร การเรียนการสอน การประเมินผู้เรียน"]) || 0);
      const c6 = Number(getItemValue(item, ["องค์ที่ 6 สิ่งสนับสนุนการเรียนรู้", "สิ่งสนับสนุนการเรียนรู้"]) || 0);

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
  const tqfColors = ["#0284c7", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4", "#3b82f6", "#6366f1"];

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

  // 7. โซน 9 กราฟย้อนหลัง
  const trendChartsData = useMemo(() => {
    if (!rawData || rawData.length === 0) return [];

    const filteredByMajor = rawData.filter(item => {
      const mName = cleanMajorName(getItemValue(item, ["ชื่อสาขา", "หลักสูตร", "สาขาวิชา"]));
      return trendMajorFilter ? cleanString(mName) === cleanString(trendMajorFilter) : true;
    });

    const allAvailableYears = [...new Set(filteredByMajor.map(item => extractYear(getItemValue(item, ["ปีการศึกษา"]))))]
      .filter(Boolean)
      .sort();

    if (allAvailableYears.length === 0) return [];

    let targetYears = [];

    if (trendYearFilter) {
      const endYearNum = parseInt(trendYearFilter, 10);
      const startYearNum = endYearNum - 3;
      
      for (let y = startYearNum; y <= endYearNum; y++) {
        targetYears.push(String(y));
      }
    } else {
      targetYears = allAvailableYears.slice(-4);
    }

    return targetYears.map(year => {
      const matchYearData = filteredByMajor.filter(item => extractYear(getItemValue(item, ["ปีการศึกษา"])) === year);
      
      const getAvg = (keys) => {
        if (matchYearData.length === 0) return 0;
        const validItems = matchYearData.filter(i => Number(getItemValue(i, keys)) > 0);
        if (validItems.length === 0) return 0;
        const total = validItems.reduce((sum, item) => sum + Number(getItemValue(item, keys) || 0), 0);
        return Number((total / validItems.length).toFixed(2));
      };

      return {
        year: `ปี ${year}`,
        c2: getAvg(["องค์ที่ 2 บัณฑิต", "บัณฑิต"]),
        c3: getAvg(["องค์ที่ 3 นิสิต", "นิสิต"]),
        c4: getAvg(["องค์ที่ 4อาจารย์", "อาจารย์"]),
        c5: getAvg(["องค์ที่ 5หลักสูตร การเรียนการสอน การประเมินผู้เรียน", "หลักสูตร การเรียนการสอน การประเมินผู้เรียน"]),
        c6: getAvg(["องค์ที่ 6 สิ่งสนับสนุนการเรียนรู้", "สิ่งสนับสนุนการเรียนรู้"]),
        input: getAvg(["Input"]),
        process: getAvg(["Process"]),
        output: getAvg(["Output"]),
        avgTotal: getAvg(["คะแนนเฉลี่ยรวม", "คะแนนรวม"])
      };
    });
  }, [rawData, trendYearFilter, trendMajorFilter]);

  // คอลัมน์สำหรับตารางรายละเอียดด้านล่างสุด
  const tableColumns = [
    { title: "ปีการศึกษา", dataIndex: "year", key: "year", width: 105, align: "center" },
    { 
      title: "สาขาวิชา", 
      dataIndex: "major", 
      key: "major",
      render: (text, record) => (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span>{text}</span>
          {record.isMaster && (
            <Tag color="blue" style={{ borderRadius: 6, fontSize: 11, fontWeight: 600 }}>
              ป.โท
            </Tag>
          )}
        </div>
      )
    },
    { title: "Input", dataIndex: "Input", key: "Input", align: "center", render: v => <strong>{formatScore(v)}</strong> },
    { title: "Process", dataIndex: "Process", key: "Process", align: "center", render: v => <strong>{formatScore(v)}</strong> },
    { title: "Output", dataIndex: "Output", key: "Output", align: "center", render: v => <strong>{formatScore(v)}</strong> },
    { title: "องค์ฯ 2 บัณฑิต", dataIndex: "comp2", key: "comp2", align: "center", render: v => <strong>{formatScore(v)}</strong> },
    { title: "องค์ฯ 3 นิสิต", dataIndex: "comp3", key: "comp3", align: "center", render: v => <strong>{formatScore(v)}</strong> },
    { title: "องค์ฯ 4 อาจารย์", dataIndex: "comp4", key: "comp4", align: "center", render: v => <strong>{formatScore(v)}</strong> },
    { title: "องค์ฯ 5 หลักสูตร", dataIndex: "comp5", key: "comp5", align: "center", render: v => <strong>{formatScore(v)}</strong> },
    { title: "องค์ฯ 6 สิ่งสนับสนุน", dataIndex: "comp6", key: "comp6", align: "center", render: v => <strong>{formatScore(v)}</strong> },
    { 
      title: "คะแนนเฉลี่ยรวม", 
      dataIndex: "avgTotal", 
      key: "avgTotal", 
      align: "center", 
      render: (v) => <span style={{ color: "#0d9488", fontWeight: "bold" }}>{formatScore(v)}</span>
    },
  ];

  // Helper สำหรับวาดการ์ดกราฟย่อย
  const renderTrendMiniCard = (title, dataKey) => (
    <Card 
      styles={{ body: { padding: "16px" } }} 
      style={{ borderRadius: 16, boxShadow: "0 1px 3px rgba(0,0,0,0.05)", border: "1px solid #f1f5f9", background: "#ffffff" }}
    >
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
                <LabelList dataKey={dataKey} position="top" style={{ fill: '#475569', fontSize: 11, fontWeight: '600' }} formatter={(v) => v > 0 ? Number(v).toFixed(2) : ''} />
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

        <Content style={{ padding: "16px 32px 32px 32px", background: "#f8fafc" }}>
          
          {/* MAIN FILTER SECTION */}
          <div style={{ background: "#fff", padding: 24, borderRadius: 20, marginBottom: 24, boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              <div>
                <div style={{ marginBottom: 8, fontWeight: 600 }}>ปีการศึกษา</div>
                <AntSelect
                  style={{ width: "100%", height: 44 }}
                  value={selectedYear || undefined}
                  placeholder="ทั้งหมด"
                  allowClear
                  onChange={(val) => setSelectedYear(val || "")}
                >
                  {years.map(y => (
                    <AntSelect.Option key={y} value={y}>ปีการศึกษา {y}</AntSelect.Option>
                  ))}
                </AntSelect>
              </div>

              {/* 🔹 ฟิลเตอร์เลือกสาขาวิชา (ใช้ AntSelect ให้มีป้าย Tag ป.โท สีฟ้าด้านขวาสุดเหมือนภาพตัวอย่าง) */}
              <div>
                <div style={{ marginBottom: 8, fontWeight: 600 }}>สาขาวิชา</div>
                <AntSelect
                  style={{ width: "100%", height: 44 }}
                  value={selectedMajor || undefined}
                  placeholder="ทั้งหมด"
                  allowClear
                  onChange={(val) => setSelectedMajor(val || "")}
                >
                  {majors.map(m => {
                    const isMaster = isMasterMajor(m);
                    return (
                      <AntSelect.Option key={m} value={m}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
                          <span style={{ color: isMaster ? "#0284c7" : "#0f172a", fontWeight: isMaster ? 600 : 400 }}>
                            {m}
                          </span>
                          {isMaster && (
                            <Tag color="blue" style={{ borderRadius: 6, fontSize: 11, fontWeight: 600, margin: 0 }}>
                              ป.โท
                            </Tag>
                          )}
                        </div>
                      </AntSelect.Option>
                    );
                  })}
                </AntSelect>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
              <Button type="primary" size="large" icon={<SearchOutlined />} onClick={handleApplyFilters} loading={isLoading} style={{ borderRadius: 10, background: "#0d9488", borderColor: "#0d9488", fontWeight: 500 }}>
                ประมวลผล
              </Button>
            </div>
          </div>

          {/* MAIN KPI ZONE */}
          <Spin spinning={isLoading}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 20, marginBottom: 24 }}>
              
              {/* Card วงกลม คะแนนรวม */}
              <Card style={{ borderRadius: 20, textAlign: "center", border: "none", boxShadow: "0 10px 25px -5px rgba(13, 148, 136, 0.15)", background: "linear-gradient(180deg, #ffffff 0%, #f0fdf4 100%)" }}>
                <h3 style={{ color: "#0f766e", marginBottom: 15, fontWeight: "700" }}>คะแนนเฉลี่ยรวมหลักสูตร</h3>
                <Progress 
                  type="circle" 
                  percent={(stats.avg / 5) * 100} 
                  format={() => <span style={{ fontSize: 32, fontWeight: "bold", color: "#0f766e" }}>{stats.avg.toFixed(2)}</span>}
                  strokeColor={{ '0%': '#14b8a6', '100%': '#0f766e' }}
                  strokeWidth={10}
                  size={140}
                />
                <div style={{ marginTop: 15, color: "#64748b", fontWeight: 500, fontSize: 13 }}>จากคะแนนเต็ม 5.00 คะแนน</div>
              </Card>

              {/* Grid 3 ตัวบ่งชี้หลัก + องค์ประกอบ 2-6 ด้านล่าง */}
              <div style={{ display: "flex", flexDirection: "column", gap: 15 }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 15 }}>
                  
                  {/* ด้าน Input */}
                  <div style={{ background: "linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)", padding: 18, borderRadius: 16, border: "1px solid #93c5fd", boxShadow: "0 4px 6px -1px rgba(2, 132, 199, 0.1)", position: "relative", overflow: "hidden" }}>
                    <div style={{ color: "#0369a1", fontSize: 11, fontWeight: "700", textTransform: "uppercase" }}>ตัวบ่งชี้หลัก</div>
                    <h4 style={{ margin: "4px 0 10px 0", fontSize: 14, color: "#0f172a", fontWeight: "600" }}>ด้าน Input</h4>
                    <div style={{ fontSize: 26, fontWeight: "800", color: "#0284c7" }}>{stats.input.toFixed(2)}</div>
                    <BookOutlined style={{ fontSize: 36, color: "#0284c7", position: "absolute", right: 12, bottom: 12, opacity: 0.25 }} />
                  </div>

                  {/* ด้าน Process */}
                  <div style={{ background: "linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)", padding: 18, borderRadius: 16, border: "1px solid #6ee7b7", boxShadow: "0 4px 6px -1px rgba(16, 185, 129, 0.1)", position: "relative", overflow: "hidden" }}>
                    <div style={{ color: "#047857", fontSize: 11, fontWeight: "700", textTransform: "uppercase" }}>ตัวบ่งชี้หลัก</div>
                    <h4 style={{ margin: "4px 0 10px 0", fontSize: 14, color: "#0f172a", fontWeight: "600" }}>ด้าน Process</h4>
                    <div style={{ fontSize: 26, fontWeight: "800", color: "#059669" }}>{stats.process.toFixed(2)}</div>
                    <SlidersOutlined style={{ fontSize: 36, color: "#059669", position: "absolute", right: 12, bottom: 12, opacity: 0.25 }} />
                  </div>

                  {/* ด้าน Output */}
                  <div style={{ background: "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)", padding: 18, borderRadius: 16, border: "1px solid #fcd34d", boxShadow: "0 4px 6px -1px rgba(245, 158, 11, 0.1)", position: "relative", overflow: "hidden" }}>
                    <div style={{ color: "#b45309", fontSize: 11, fontWeight: "700", textTransform: "uppercase" }}>ตัวบ่งชี้หลัก</div>
                    <h4 style={{ margin: "4px 0 10px 0", fontSize: 14, color: "#0f172a", fontWeight: "600" }}>ด้าน Output</h4>
                    <div style={{ fontSize: 26, fontWeight: "800", color: "#d97706" }}>{stats.output.toFixed(2)}</div>
                    <ExportOutlined style={{ fontSize: 36, color: "#d97706", position: "absolute", right: 12, bottom: 12, opacity: 0.25 }} />
                  </div>
                </div>

                {/* แถบรวมคะแนนรายองค์ประกอบ 2-6 */}
                <div style={{ background: "#ffffff", padding: "16px 20px", borderRadius: 16, border: "1px solid #e2e8f0", display: "flex", justifyContent: "space-around", alignItems: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 12, color: "#64748b", fontWeight: 500 }}>องค์ฯ 2 บัณฑิต</div>
                    <strong style={{ fontSize: 18, color: "#0d9488", fontWeight: "700" }}>{stats.comp2.toFixed(2)}</strong>
                  </div>
                  <div style={{ width: 1, height: 28, background: "#e2e8f0" }} />
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 12, color: "#64748b", fontWeight: 500 }}>องค์ฯ 3 นิสิต</div>
                    <strong style={{ fontSize: 18, color: "#0d9488", fontWeight: "700" }}>{stats.comp3.toFixed(2)}</strong>
                  </div>
                  <div style={{ width: 1, height: 28, background: "#e2e8f0" }} />
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 12, color: "#64748b", fontWeight: 500 }}>องค์ฯ 4 อาจารย์</div>
                    <strong style={{ fontSize: 18, color: "#0d9488", fontWeight: "700" }}>{stats.comp4.toFixed(2)}</strong>
                  </div>
                  <div style={{ width: 1, height: 28, background: "#e2e8f0" }} />
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 12, color: "#64748b", fontWeight: 500 }}>องค์ฯ 5 หลักสูตร</div>
                    <strong style={{ fontSize: 18, color: "#0d9488", fontWeight: "700" }}>{stats.comp5.toFixed(2)}</strong>
                  </div>
                  <div style={{ width: 1, height: 28, background: "#e2e8f0" }} />
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 12, color: "#64748b", fontWeight: 500 }}>องค์ฯ 6 สิ่งสนับสนุน</div>
                    <strong style={{ fontSize: 18, color: "#0d9488", fontWeight: "700" }}>{stats.comp6.toFixed(2)}</strong>
                  </div>
                </div>
              </div>

            </div>
          </Spin>

          {/* CHART ZONE */}
          <div style={{ background: "white", padding: 24, borderRadius: 20, marginBottom: 24, boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
              <BarChartOutlined style={{ fontSize: 20, color: "#0d9488" }} />
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: "#1e293b" }}>แผนภูมิแสดงผลการประเมินคุณภาพรายองค์ประกอบ</h3>
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
                      
                      <Bar dataKey="score" name="คะแนนผลการประเมินคุณภาพ" radius={[8, 8, 0, 0]} barSize={40}>
                        <LabelList dataKey="score" position="top" style={{ fontSize: 11, fontWeight: 600, fill: "#334155" }} formatter={(v) => v > 0 ? Number(v).toFixed(2) : ''} />
                        {dynamicGraphData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={tqfColors[index % tqfColors.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Spin>
          </div>

          {/* วิเคราะห์แนวโน้มผลการประเมินคุณภาพย้อนหลัง 4 ปี */}
          <div style={{ background: "white", padding: 24, borderRadius: 20, marginBottom: 24, boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
            
            <div style={{
              background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
              padding: "24px 32px",
              borderRadius: 20,
              boxShadow: "0 10px 25px -5px rgba(15, 23, 42, 0.15), 0 8px 10px -6px rgba(15, 23, 42, 0.15)",
              marginBottom: 24,
              display: "flex",
              justify: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 20
            }}>
              <div>
                <h3 style={{ color: "#ffffff", fontSize: "20px", fontWeight: "600", margin: 0, letterSpacing: "-0.5px", display: "flex", alignItems: "center", gap: 10 }}>
                  <HistoryOutlined style={{ color: "#38bdf8" }} />
                  วิเคราะห์แนวโน้มผลการประเมินคุณภาพย้อนหลัง
                </h3>
                <p style={{ color: "#94a3b8", fontSize: "13px", margin: "6px 0 0 0" }}>
                  เปรียบเทียบสถิติและผลประเมิน
                </p>
              </div>
              
              <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap", color: "#e2e8f0", fontSize: "13px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <span style={{ color: "#94a3b8", fontSize: "11px", textTransform: "uppercase", fontWeight: "600", letterSpacing: "0.5px" }}>ปีการศึกษาอ้างอิง</span>
                  <AntSelect
                    style={{ minWidth: 130 }}
                    value={trendYearFilter || undefined}
                    placeholder="ทั้งหมด"
                    allowClear
                    onChange={(val) => setTrendYearFilter(val || "")}
                  >
                    {years.map(y => (
                      <AntSelect.Option key={`trend-y-${y}`} value={y}>ปีการศึกษา {y}</AntSelect.Option>
                    ))}
                  </AntSelect>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <span style={{ color: "#94a3b8", fontSize: "11px", textTransform: "uppercase", fontWeight: "600", letterSpacing: "0.5px" }}>สาขาวิชา</span>
                  <AntSelect
                    style={{ minWidth: 240 }}
                    value={trendMajorFilter || undefined}
                    placeholder="ทั้งหมด"
                    allowClear
                    onChange={(val) => setTrendMajorFilter(val || "")}
                  >
                    {majors.map(m => {
                      const isMaster = isMasterMajor(m);
                      return (
                        <AntSelect.Option key={`trend-m-${m}`} value={m}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
                            <span style={{ color: isMaster ? "#0284c7" : "#0f172a", fontWeight: isMaster ? 600 : 400 }}>
                              {m}
                            </span>
                            {isMaster && (
                              <Tag color="blue" style={{ borderRadius: 6, fontSize: 11, fontWeight: 600, margin: 0 }}>
                                ป.โท
                              </Tag>
                            )}
                          </div>
                        </AntSelect.Option>
                      );
                    })}
                  </AntSelect>
                </div>
              </div>
            </div>

            {/* แสดง 9 กราฟย่อย */}
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

          {/* TABLE ZONE */}
          <div style={{ background: "white", padding: 24, borderRadius: 20, boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: "#1e293b" }}>รายละเอียดคะแนนการประเมินรายหลักสูตร</h3>
              <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#f8fafc", padding: "6px 14px", borderRadius: 10, border: "1px solid #e2e8f0" }}>
                <span style={{ fontSize: 13, fontWeight: 500, color: "#475569" }}>ปีการศึกษา:</span>
                <AntSelect
                  style={{ minWidth: 130 }}
                  value={tableYearFilter || undefined}
                  placeholder="แสดงทุกปี"
                  allowClear
                  onChange={(val) => setTableYearFilter(val || "")}
                >
                  {years.map((year) => (
                    <AntSelect.Option key={year} value={year}>ปีการศึกษา {year}</AntSelect.Option>
                  ))}
                </AntSelect>
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
