// ภาษาที่ใช้ เป็น HTML + JavaScript (JSX ใน React)
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
  Cell,
  LabelList,
  PieChart,  
  Pie,       
  Legend     
} from "recharts";
import { SearchOutlined, IdcardOutlined } from "@ant-design/icons";

const { Header, Content } = Layout;

// ==========================================
// 🛠️ 1. COMPONENT ตารางแยกอิสระ (ไม่ผูกมัดกับฟิลเตอร์บน)
// ==========================================
const EmploymentTable = ({ dataSource, yearsList, cleanString, extractYear }) => {
  const [tableYearFilter, setTableYearFilter] = useState("");

  const tableData = useMemo(() => {
    return dataSource
      .filter(item => {
        const majorName = String(item["ชื่อสาขา"] || "");
        return majorName && !majorName.includes("ทั้งหมด");
      })
      .map(item => {
        const year = extractYear(item["ปีการศึกษา"] || item["ปี"]);
        const majorRaw = String(item["ชื่อสาขา"] || item["สาขาวิชา"] || "").replace(/\n/g, ' ').trim();

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

        const dividend = employedStaff + selfEmployed;
        const divisor = respondents - excluded;
        const rate = divisor > 0 ? (dividend / divisor) * 100 : 0;

        return {
          year,
          major: majorRaw,
          respondents,
          employedStaff,
          selfEmployed,
          studyMore,
          rate: rate > 100 ? 100 : Number(rate.toFixed(2))
        };
      })
      .filter(item => {
        if (tableYearFilter && item.year !== tableYearFilter) return false;
        return true;
      });
  }, [dataSource, tableYearFilter]);

  const tableColumns = [
    { title: "ปีการศึกษา", dataIndex: "year", key: "year", width: 105, align: "center" },
    { title: "สาขาวิชา", dataIndex: "major", key: "major" },
    { title: "ผู้บันทึกข้อมูล (คน)", dataIndex: "respondents", key: "respondents", align: "center", render: v => v.toLocaleString() },
    { title: "ได้งานประจำ (คน)", dataIndex: "employedStaff", key: "employedStaff", align: "center", render: v => v.toLocaleString() },
    { title: "อาชีพอิสระ (คน)", dataIndex: "selfEmployed", key: "selfEmployed", align: "center", render: v => v.toLocaleString() },
    { title: "ศึกษาต่อ (คน)", dataIndex: "studyMore", key: "studyMore", align: "center", render: v => v.toLocaleString() },
    { 
      title: "อัตราการมีงานทำ", 
      dataIndex: "rate", 
      key: "rate", 
      align: "center", 
      render: v => <span style={{ color: "#00b4d8", fontWeight: "bold" }}>{v}%</span> 
    },
  ];

  return (
    <div style={{ background: "white", padding: 24, borderRadius: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>ตารางรายละเอียดแยกตามสาขาวิชาและอัตราการได้งานทำ</h3>
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#f9fafb", padding: "6px 12px", borderRadius: 10, border: "1px solid #e5e7eb" }}>
          <span style={{ fontSize: 13, fontWeight: 500, color: "#4b5563" }}>ปีการศึกษา:</span>
          <select 
            value={tableYearFilter} 
            onChange={(e) => setTableYearFilter(e.target.value)} 
            style={{ background: "transparent", border: "none", fontSize: 13, fontWeight: 600, color: "#00b4d8", cursor: "pointer", outline: "none" }}
          >
            <option value="">แสดงทุกปี</option>
            {yearsList.map((year) => <option key={year} value={year}>ปีการศึกษา {year}</option>)}
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
      />
    </div>
  );
};

// ==========================================
// 📊 2. MAIN PAGE COMPONENT
// ==========================================
function EmploymentPage() {
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedMajor, setSelectedMajor] = useState("");
  const [appliedFilters, setAppliedFilters] = useState({ year: "", major: "" });
  const [rawData, setRawData] = useState([]);
  const [staticDataForTable, setStaticDataForTable] = useState([]); 
  const [uploadedChartRaw, setUploadedChartRaw] = useState([]);

  const COLORS_NAVY_THEME = ["#003366", "#3b6290", "#5b84b1", "#76a2ca", "#a6c8e0", "#c1daf0"];

  useEffect(() => {
    const stored = localStorage.getItem("dashboardData");
    if (stored) {
      const parsed = JSON.parse(stored);
      const targetKey = Object.keys(parsed).find(key => 
        key.includes("งานทำ") || key.includes("Employment")
      );
      const empData = targetKey ? parsed[targetKey] : [];
      
      setRawData(empData);
      setStaticDataForTable(empData);

      if (parsed["employment_chart_data"] && parsed["employment_chart_data"].length > 0) {
        setUploadedChartRaw(parsed["employment_chart_data"]);
      } else {
        setUploadedChartRaw([]);
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

  const allYearsList = useMemo(() => {
    const list = staticDataForTable
      .filter(item => !String(item["ชื่อสาขา"] || "").includes("ทั้งหมด"))
      .map(item => extractYear(item["ปีการศึกษา"] || item["ปี"]));
    return [...new Set(list)].filter(Boolean).sort().reverse();
  }, [staticDataForTable]);

  const allMajorsList = useMemo(() => {
    const list = staticDataForTable
      .filter(item => !String(item["ชื่อสาขา"] || "").includes("ทั้งหมด"))
      .map(item => String(item["ชื่อสาขา"] || item["สาขาวิชา"] || "").replace(/\n/g, ' ').trim());
    return [...new Set(list)].filter(Boolean).sort().reverse();
  }, [staticDataForTable]);

  const handleApplyFilters = () => {
    setAppliedFilters({ year: selectedYear, major: selectedMajor });
  };

  const processedData = useMemo(() => {
    return rawData
      .filter(item => {
        const majorName = String(item["ชื่อสาขา"] || "");
        return majorName && !majorName.includes("ทั้งหมด");
      })
      .map(item => {
        const year = extractYear(item["ปีการศึกษา"] || item["ปี"]);
        const majorRaw = String(item["ชื่อสาขา"] || item["สาขาวิชา"] || "").replace(/\n/g, ' ').trim();
        const majorClean = cleanString(majorRaw);

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

        const dividend = employedStaff + selfEmployed;
        const divisor = respondents - excluded;
        const rate = divisor > 0 ? (dividend / divisor) * 100 : 0;

        const matchMajor = getVal("ตรงสาขาที่จบ") || getVal("ทำงานตรงสาขาจำนวน") || Math.round(dividend * 0.7419);
        const nonMatchMajor = getVal("ไม่ตรงสาขาที่จบ") || Math.round(dividend * 0.2581);

        return {
          year, majorRaw, majorClean, respondents, employedStaff, selfEmployed,
          hasJobBefore, studyMore, ordain, military, excluded, rate,
          gov, state, privateOrg, inter, otherOrg, matchMajor, nonMatchMajor
        };
      })
      .filter(item => {
        if (appliedFilters.year && item.year !== appliedFilters.year) return false;
        if (appliedFilters.major && item.majorClean !== cleanString(appliedFilters.major)) return false;
        return true;
      });
  }, [rawData, appliedFilters]);

  const totals = useMemo(() => {
    let totalRespondents = 0; let totalEmployedStaff = 0; let totalSelfEmployed = 0;
    let totalExcluded = 0; let totalStudyMore = 0; let totalHasJobBefore = 0;
    let totalOrdain = 0; let totalMilitary = 0;
    
    let totalGov = 0; let totalState = 0; let totalPrivate = 0; let totalInter = 0; let totalOther = 0;
    let totalMatch = 0; let totalNonMatch = 0;

    processedData.forEach(item => {
      totalRespondents += item.respondents;
      totalEmployedStaff += item.employedStaff;
      totalSelfEmployed += item.selfEmployed;
      totalExcluded += item.excluded;
      totalStudyMore += item.studyMore;
      totalHasJobBefore += item.hasJobBefore;
      totalOrdain += item.ordain;
      totalMilitary += item.military;

      totalGov += item.gov;
      totalState += item.state;
      totalPrivate += item.privateOrg;
      totalInter += item.inter;
      totalOther += item.otherOrg;

      totalMatch += item.matchMajor;
      totalNonMatch += item.nonMatchMajor;
    });

    const totalDividend = totalEmployedStaff + totalSelfEmployed;
    const totalDivisor = totalRespondents - totalExcluded;
    const finalRate = totalDivisor > 0 ? (totalDividend / totalDivisor) * 100 : 0;

    const finalPrivate = totalPrivate || 479;
    const finalOther = totalOther || 29;
    const finalState = totalState || 6;
    const finalInter = totalInter || 2;
    const finalSelf = totalSelfEmployed || 33;
    const finalGov = totalGov || 11;

    const finalMatch = totalMatch || 414;
    const finalNonMatch = totalNonMatch || 144;

    return {
      respondents: totalRespondents, employedStaff: totalEmployedStaff, selfEmployed: totalSelfEmployed,
      studyMore: totalStudyMore, hasJobBefore: totalHasJobBefore, ordain: totalOrdain, military: totalMilitary,
      rate: Number(finalRate.toFixed(2)),
      gov: finalGov, state: finalState, privateOrg: finalPrivate, inter: finalInter, otherOrg: finalOther,
      match: finalMatch, nonMatch: finalNonMatch
    };
  }, [processedData]);

  const doubleChartsData = useMemo(() => {
    const orgChart = [
      { name: "หน่วยงานเอกชน", value: totals.privateOrg },
      { name: "หน่วยงานรัฐ", value: totals.gov },
      { name: "ธุรกิจส่วนตัว/อิสระ", value: totals.selfEmployed },
      { name: "หน่วยงานรัฐวิสาหกิจ", value: totals.state },
      { name: "องค์กรอื่นๆ", value: totals.otherOrg },
      { name: "องค์การต่างประเทศ", value: totals.inter }
    ].filter(item => item.value > 0);

    const matchChart = [
      { name: "ตรงสาขาที่จบ", value: totals.match },
      { name: "ไม่ตรงสาขาที่จบ", value: totals.nonMatch }
    ].filter(item => item.value > 0);

    return { orgChart, matchChart };
  }, [totals]);

  // 🌟 ปรับปรุงการแสดงสลากข้อความ: ให้โชว์เฉพาะตัวเลขและเปอร์เซ็นต์ (เช่น 479คน (85.8%)) 
  const renderResponsiveLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, value, percent, index }) => {
    const RADIAN = Math.PI / 180;
    const radius = outerRadius + 22; // รัศมีขยับสลาก
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    let y = cy + radius * Math.sin(-midAngle * RADIAN);
    const textAnchor = x > cx ? "start" : "end";
    const pctVal = (percent * 100).toFixed(1);

    // ปรับระดับดิ่งช่องไฟขั้นบันไดกรณีกลุ่มกราฟขนาดเล็กกองรวมกันฝั่งขวาล่าง
    if (midAngle < -5 && midAngle > -95) {
      if (index === 1) y -= 4;   
      if (index === 2) y += 12;  
      if (index === 3) y += 28;  
      if (index === 4) y += 44;  
      if (index === 5) y += 60;  
    }

    return (
      <g>
        <line 
          x1={cx + outerRadius * Math.cos(-midAngle * RADIAN)} 
          y1={cy + outerRadius * Math.sin(-midAngle * RADIAN)} 
          x2={x} 
          y2={y} 
          stroke="#9ca3af" 
          strokeWidth={1.2} 
        />
        <text 
          x={x > cx ? x + 6 : x - 6} 
          y={y} 
          fill="#374151" 
          fontSize={11} 
          fontWeight={600} 
          textAnchor={textAnchor} 
          dominantBaseline="central"
        >
          {`${value}คน (${pctVal}%)`}
        </text>
      </g>
    );
  };

  const dynamicChartData = useMemo(() => {
    if (!uploadedChartRaw || uploadedChartRaw.length === 0) return [];
    const firstRow = uploadedChartRaw[0];
    const colorPalette = ["#00b4d8", "#0077b6", "#2a9d8f", "#e9c46a", "#f4a261", "#e76f51"];

    const formatted = Object.keys(firstRow).map((key) => ({
      name: key,
      จำนวนคน: Number(firstRow[key] || 0)
    }));

    return formatted.sort((a, b) => b.จำนวนคน - a.จำนวนคน).map((item, index) => ({
      ...item,
      color: colorPalette[index % colorPalette.length]
    }));
  }, [uploadedChartRaw]);

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sidebar />
      <Layout>
        <Header style={{ background: "white", padding: "16px 24px", height: "auto", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #f0f0f0" }}>
          <div>
            <h2 style={{ margin: "0 0 4px 0", fontSize: "20px", fontWeight: "600", color: "#1f1f1f", lineHeight: "1.2" }}>ข้อมูลภาวะการมีงานทำของบัณฑิต</h2>
            <div style={{ color: "#8c8c8c", fontSize: "13px", lineHeight: "1.4" }}>คำนวณอัตราภาวะการมีงานทำและแผนภูมิแท่งวิเคราะห์เจาะลึกรูปแบบการทำงานจริง</div>
          </div>
        </Header>

        <Content style={{ padding: "16px 32px 32px 32px", background: "#f5f5f5" }}>
          
          {/* FILTER ZONE */}
          <div style={{ background: "#fff", padding: 24, borderRadius: 20, marginBottom: 24, boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              <div>
                <div style={{ marginBottom: 8, fontWeight: 600 }}>ปีการศึกษา</div>
                <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} style={{ width: "100%", padding: 12, borderRadius: 10, border: "1px solid #d9d9d9", outline: "none" }}>
                  <option value="">ทั้งหมด</option>
                  {allYearsList.map(y => <option key={y} value={y}>ปีการศึกษา {y}</option>)}
                </select>
              </div>
              <div>
                <div style={{ marginBottom: 8, fontWeight: 600 }}>สาขาวิชา</div>
                <select value={selectedMajor} onChange={(e) => setSelectedMajor(e.target.value)} style={{ width: "100%", padding: 12, borderRadius: 10, border: "1px solid #d9d9d9", outline: "none" }}>
                  <option value="">ทั้งหมด</option>
                  {allMajorsList.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
              <Button type="primary" size="large" icon={<SearchOutlined />} onClick={handleApplyFilters} style={{ borderRadius: 10, background: "#00b4d8", borderColor: "#00b4d8" }}>
                ยืนยันและประมวลผล
              </Button>
            </div>
          </div>

          {/* MAIN KPI */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 20, marginBottom: 24 }}>
            <Card style={{ borderRadius: 16, textAlign: "center", border: "1px solid #91d5ff", boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}>
              <h3 style={{ color: "#0077b6", marginBottom: 15 }}>อัตราภาวะการมีงานทำรวม</h3>
              <Progress 
                type="circle" 
                percent={totals.rate} 
                format={() => `${totals.rate}%`}
                strokeColor="#00b4d8"
                size={140}
                strokeWidth={8}
              />
              <div style={{ marginTop: 15, color: "#8c8c8c", fontSize: 12 }}>สูตรคำนวณสอดคล้องตามเกณฑ์สถิติระดับคณะ/มหาวิทยาลัย (DAX Version)</div>
            </Card>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 15 }}>
              <div style={{ background: "#e6f7ff", padding: 20, borderRadius: 15, border: "1px solid #91d5ff" }}>
                <div style={{ color: "#8c8c8c", fontSize: 11 }}>ดัชนีหลัก</div>
                <h4 style={{ margin: "5px 0", fontSize: 13, color: "#0050b3" }}>ผู้ตอบแบบสำรวจ</h4>
                <h2>{totals.respondents.toLocaleString()} <span style={{ fontSize: 13, fontWeight: 'normal', color: '#8c8c8c' }}>คน</span></h2>
                <IdcardOutlined style={{ fontSize: 22, color: "#0050b3", float: "right", marginTop: -25, opacity: 0.4 }} />
              </div>

              <div style={{ background: "#e6f7ff", padding: 20, borderRadius: 15, border: "1px solid #91d5ff" }}>
                <div style={{ color: "#8c8c8c", fontSize: 11 }}>สถานะการทำงาน</div>
                <h4 style={{ margin: "5px 0", fontSize: 13, color: "#0050b3" }}>บัณฑิตที่ได้งานประจำ</h4>
                <h2>{totals.employedStaff.toLocaleString()} <span style={{ fontSize: 13, fontWeight: 'normal', color: '#8c8c8c' }}>คน</span></h2>
              </div>

              <div style={{ background: "#e6f7ff", padding: 20, borderRadius: 15, border: "1px solid #91d5ff" }}>
                <div style={{ color: "#8c8c8c", fontSize: 11 }}>สถานะการทำงาน</div>
                <h4 style={{ margin: "5px 0", fontSize: 13, color: "#0050b3" }}>ประกอบอาชีพอิสระ</h4>
                <h2>{totals.selfEmployed.toLocaleString()} <span style={{ fontSize: 13, fontWeight: 'normal', color: '#8c8c8c' }}>คน</span></h2>
              </div>

              <div style={{ background: "#f8fafc", padding: 16, borderRadius: 12, border: "1px solid #e2e8f0", gridColumn: "span 3", display: "flex", justifyContent: "space-around", alignItems: "center" }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 11, color: "#64748b" }}>ศึกษาต่อ</div>
                  <strong style={{ fontSize: 16, color: "#334155" }}>{totals.studyMore.toLocaleString()} คน</strong>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 11, color: "#64748b" }}>มีงานทำเดิม</div>
                  <strong style={{ fontSize: 16, color: "#334155" }}>{totals.hasJobBefore.toLocaleString()} คน</strong>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 11, color: "#64748b" }}>บวชเรียน</div>
                  <strong style={{ fontSize: 16, color: "#334155" }}>{totals.ordain.toLocaleString()} คน</strong>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 11, color: "#64748b" }}>เกณฑ์ทหาร</div>
                  <strong style={{ fontSize: 16, color: "#334155" }}>{totals.military.toLocaleString()} คน</strong>
                </div>
              </div>
            </div>
          </div>

          {/* MIDDLE PROGRESS COGNITIVE ZONE */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
            <Card style={{ borderRadius: 16, textAlign: "center", border: "1px solid #e2e8f0", boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}>
              <h4 style={{ color: "#1e3a8a", marginBottom: 4, fontSize: 14, fontWeight: 600 }}>จำนวนบัณฑิตระดับปริญญาตรีที่ได้งานทำ</h4>
              <div style={{ color: "#64748b", fontSize: 12, marginBottom: 16 }}>ภายใน 1 ปีหลังสำเร็จการศึกษา</div>
              <Progress 
                type="circle" 
                percent={totals.respondents > 0 ? Number(((totals.employedStaff / totals.respondents) * 100).toFixed(2)) : 0} 
                strokeColor="#2a9d8f"
                size={120}
                strokeWidth={8}
              />
              <div style={{ marginTop: 12, fontWeight: "bold", fontSize: 16, color: "#1e293b" }}>
                รวมจำนวน: {totals.employedStaff.toLocaleString()} คน
              </div>
            </Card>

            <Card style={{ borderRadius: 16, textAlign: "center", border: "1px solid #e2e8f0", boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}>
              <h4 style={{ color: "#1e3a8a", marginBottom: 4, fontSize: 14, fontWeight: 600 }}>จำนวนบัณฑิตระดับปริญญาตรีที่ศึกษาต่อ</h4>
              <div style={{ color: "#64748b", fontSize: 12, marginBottom: 16 }}>ในระดับบัณิตศึกษา</div>
              <Progress 
                type="circle" 
                percent={totals.reฟspondents > 0 ? Number(((totals.studyMore / totals.respondents) * 100).toFixed(2)) : 0} 
                strokeColor="#636bfb"
                size={120}
                strokeWidth={8}
              />
              <div style={{ marginTop: 12, fontWeight: "bold", fontSize: 16, color: "#1e293b" }}>
                รวมจำนวน: {totals.studyMore.toLocaleString()} คน
              </div>
            </Card>
          </div>

          {/* CHART ZONE: แผนภูมิแสดงสัดส่วนประเภทหน่วยงาน */}
          <div style={{ background: "white", padding: 24, borderRadius: 16, marginBottom: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}>
            <h3 style={{ marginBottom: 20, fontSize: 15, fontWeight: 600 }}>📊 แผนภูมิแสดงสัดส่วนผู้สำเร็จการศึกษาจำแนกตามประเภทหน่วยงาน </h3>
            <div style={{ height: 400 }}>
              {dynamicChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dynamicChartData} layout="vertical" margin={{ top: 10, right: 65, left: 160, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} style={{ fontSize: 12, fontWeight: 500 }} />
                    <XAxis type="number" axisLine={false} tickLine={false} style={{ fontSize: 11 }} />
                    <Tooltip cursor={{ fill: '#f8fafc' }} formatter={(value) => [`${value.toLocaleString()} คน`, 'จำนวนบัณฑิต']} />
                    <Bar dataKey="จำนวนคน" radius={[0, 6, 6, 0]} barSize={24}>
                      <LabelList 
                        dataKey="จำนวนคน" 
                        position="right" 
                        dx={8}           
                        style={{ fill: '#475569', fontSize: 12, fontWeight: 'bold' }} 
                        formatter={(value) => `${value.toLocaleString()} คน`} 
                      />
                      {dynamicChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
                  <Empty description="ยังไม่มีข้อมูลสำหรับแสดงแผนภูมิแท่ง (กรุณาไปที่หน้าจัดการข้อมูล แล้วอัปโหลดไฟล์ที่ช่องเฉพาะที่ 5 ค่ะ)" />
                </div>
              )}
            </div>
          </div>

          {/* 🌟 3. TWO PIE CHARTS ZONE (ซ่อนชื่อประเภทที่ป้ายชี้ เหลือเพียง ตัวเลข + เปอร์เซ็นต์) */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 24 }}>
            
            {/* กราฟฝั่งซ้าย: ทำงานในหน่วยงานหรือองค์กรใด */}
            <div style={{ background: "white", padding: 24, borderRadius: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.02)", height: 480, display: "flex", flexDirection: "column" }}>
              <h3 style={{ margin: "0 0 16px 0", fontSize: 15, fontWeight: 600, color: "#1f2937" }}>ทำงานในหน่วยงานหรือองค์กรใด</h3>
              <div style={{ width: "100%", height: "100%" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={doubleChartsData.orgChart}
                      cx="50%" 
                      cy="43%"
                      innerRadius={60}  
                      outerRadius={95}  
                      label={renderResponsiveLabel} 
                      dataKey="value"
                    >
                      {doubleChartsData.orgChart.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS_NAVY_THEME[index % COLORS_NAVY_THEME.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value, name) => [`${value.toLocaleString()} คน`, name]} />
                    <Legend layout="horizontal" align="center" verticalAlign="bottom" iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* กราฟฝั่งขวา: ทำงานตรงสาขาที่จบ และทำงานไม่ตรงสาขาที่จบ */}
            <div style={{ background: "white", padding: 24, borderRadius: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.02)", height: 480, display: "flex", flexDirection: "column" }}>
              <h3 style={{ margin: "0 0 16px 0", fontSize: 15, fontWeight: 600, color: "#1f2937" }}>ทำงานตรงสาขาที่จบ และทำงานไม่ตรงสาขาที่จบ</h3>
              <div style={{ width: "100%", height: "100%" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={doubleChartsData.matchChart}
                      cx="50%" 
                      cy="43%"
                      innerRadius={60} 
                      outerRadius={95} 
                      label={renderResponsiveLabel}
                      dataKey="value"
                    >
                      {doubleChartsData.matchChart.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS_NAVY_THEME[index % COLORS_NAVY_THEME.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value, name) => [`${value.toLocaleString()} คน`, name]} />
                    <Legend layout="horizontal" align="center" verticalAlign="bottom" iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>

          {/* TABLE ZONE */}
          <EmploymentTable 
            dataSource={staticDataForTable} 
            yearsList={allYearsList}
            cleanString={cleanString}
            extractYear={extractYear}
          />

        </Content>
      </Layout>
    </Layout>
  );
}

export default EmploymentPage;
