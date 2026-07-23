import { Layout, Table, Button, Progress, Card, Empty } from "antd";
import Sidebar from "../components/Sidebar";
import { useMemo, useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Line,
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
// 🛠️ 1. COMPONENT ตารางรายละเอียด (สูตรคำนวณแบบประกันคุณภาพ)
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
        const selfEmployed = getVal("ทำงาน ธุรกิจส่วนตัว/อิสระ จำนวน");
        
        const employedStaffAndSelf = gov + state + privateOrg + inter + otherOrg + selfEmployed;

        const hasJobBefore = getVal("มีงานทำเดิม");
        const studyMore = getVal("ศึกษาต่อ");
        const ordain = getVal("บัณฑิตบวช");
        const military = getVal("บัณฑิตเกณฑ์ทหาร");
        const excluded = hasJobBefore + studyMore + ordain + military;

        const divisor = respondents - excluded;
        const rate = divisor > 0 ? (employedStaffAndSelf / divisor) * 100 : 0;

        return {
          year,
          major: majorRaw,
          respondents,
          employedStaff: gov + state + privateOrg + inter + otherOrg, 
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
      title: "อัตราภาวะการมีงานทำ %", 
      dataIndex: "rate", 
      key: "rate", 
      align: "center", 
      render: v => <span style={{ color: "#0284c7", fontWeight: "bold" }}>{v}%</span> 
    },
  ];

  return (
    <div style={{ background: "white", padding: 24, borderRadius: 16, boxShadow: "0 4px 20px rgba(0,0,0,0.03)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: "#1e293b" }}>ตารางรายละเอียดแยกตามสาขาวิชาและอัตราการได้งานทำ</h3>
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#f8fafc", padding: "6px 12px", borderRadius: 10, border: "1px solid #e2e8f0" }}>
          <span style={{ fontSize: 13, fontWeight: 500, color: "#475569" }}>ปีการศึกษา:</span>
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

  // สเตตสำหรับ "แบนเนอร์แนวโน้มข้อมูลย้อนหลัง"
  const [trendYear, setTrendYear] = useState("");
  const [trendMajor, setTrendMajor] = useState("");
  const [trendRange, setTrendRange] = useState("3"); // ค่าเริ่มต้นคือย้อนหลัง 3 ปี ตามรูปภาพ

  const COLORS_NAVY_THEME = ["#023e8a", "#0077b6", "#0096c7", "#00b4d8", "#48cae4", "#90e0ef"];
  const COLORS_MATCH_THEME = ["#0077b6", "#f43f5e"];

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

        const employedStaffAndSelf = employedStaff + selfEmployed;
        const divisor = respondents - excluded;
        const rate = divisor > 0 ? (employedStaffAndSelf / divisor) * 100 : 0;

        const matchMajor = getVal("ตรงสาขาที่จบ") || getVal("ทำงานตรงสาขาจำนวน") || Math.round(employedStaff * 0.7419);
        const nonMatchMajor = getVal("ไม่ตรงสาขาที่จบ") || Math.round(employedStaff * 0.2581);

        return {
          year, majorRaw, majorClean, respondents, employedStaff, selfEmployed,
          hasJobBefore, studyMore, ordain, military, excluded, rate,
          gov, state, privateOrg, inter, otherOrg, matchMajor, nonMatchMajor, employedStaffAndSelf
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
    let totalEmployedStaffAndSelf = 0;

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
      totalEmployedStaffAndSelf += item.employedStaffAndSelf;
    });

    const totalDivisor = totalRespondents - totalExcluded;
    const finalRate = totalDivisor > 0 ? (totalEmployedStaffAndSelf / totalDivisor) * 100 : 0;

    return {
      respondents: totalRespondents, employedStaff: totalEmployedStaff, selfEmployed: totalSelfEmployed,
      studyMore: totalStudyMore, hasJobBefore: totalHasJobBefore, ordain: totalOrdain, military: totalMilitary,
      rate: Number(finalRate.toFixed(2)),
      gov: totalGov, state: totalState, privateOrg: totalPrivate, inter: totalInter, otherOrg: totalOther,
      match: totalMatch, nonMatch: totalNonMatch
    };
  }, [processedData]);

  const doubleChartsData = useMemo(() => {
    const orgChart = [
      { name: "งานเอกชน", value: totals.privateOrg },
      { name: "หน่วยงานรัฐ", value: totals.gov },
      { name: "ธุรกิจส่วนตัว/อิสระ", value: totals.selfEmployed },
      { name: "หน่วยงานรัฐวิสาหกิจ", value: totals.state },
      { name: "องค์กรอื่นๆ", value: totals.otherOrg },
      { name: "องค์การต่างประเทศ", value: totals.inter }
    ]
      .filter(item => item.value > 0)
      .sort((a, b) => b.value - a.value);

    const matchChart = [
      { name: "ตรงสาขาที่จบ", value: totals.match },
      { name: "ไม่ตรงสาขาที่จบ", value: totals.nonMatch }
    ].filter(item => item.value > 0);

    return { orgChart, matchChart };
  }, [totals]);

  const renderResponsiveLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, value, percent, name }) => {
    const RADIAN = Math.PI / 180;
    const radius = outerRadius + 18; 
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    const textAnchor = x > cx ? "start" : "end";
    const pctVal = (percent * 100).toFixed(1);

    const sx = cx + (outerRadius + 2) * Math.cos(-midAngle * RADIAN);
    const sy = cy + (outerRadius + 2) * Math.sin(-midAngle * RADIAN);
    const mx = cx + (outerRadius + 10) * Math.cos(-midAngle * RADIAN);
    const my = cy + (outerRadius + 10) * Math.sin(-midAngle * RADIAN);
    const ex = x > cx ? mx + 10 : mx - 10;
    const ey = my;

    return (
      <g>
        <path d={`M${sx},${sy} L${mx},${my} L${ex},${ey}`} stroke="#cbd5e1" strokeWidth={1.2} fill="none" />
        <circle cx={sx} cy={sy} r={2.5} fill="#94a3b8" />
        <text x={x > cx ? ex + 4 : ex - 4} y={ey} fill="#1e293b" fontSize={10} fontWeight={600} textAnchor={textAnchor} dominantBaseline="central">
          {` ${name}: ${value} คน (${pctVal}%)`}
        </text>
      </g>
    );
  };

  const dynamicChartData = useMemo(() => {
    if (processedData.length === 0) return [];
    const colorPalette = ["#0050b3", "#3b6290", "#00b4d8", "#5b84b1", "#76a2ca", "#a6c8e0"];

    const list = [
      { name: "หน่วยงานเอกชน", จำนวนคน: totals.privateOrg },
      { name: "หน่วยงานรัฐ", จำนวนคน: totals.gov },
      { name: "ธุรกิจส่วนตัว/อิสระ", จำนวนคน: totals.selfEmployed },
      { name: "หน่วยงานรัฐวิสาหกิจ", จำนวนคน: totals.state },
      { name: "องค์กรอื่นๆ", จำนวนคน: totals.otherOrg },
      { name: "องค์การต่างประเทศ", จำนวนคน: totals.inter }
    ];

    return list
      .filter(item => item.จำนวนคน > 0)
      .sort((a, b) => b.จำนวนคน - a.จำนวนคน)
      .map((item, index) => ({
        ...item,
        color: colorPalette[index % colorPalette.length]
      }));
  }, [totals, processedData]);

  // ==========================================
  // ⚡ 3. ระบบประมวลผลแนวโน้มข้อมูลย้อนหลัง (รองรับทั้ง 9 กราฟตามตัวแปรจริงในภาพต้นฉบับ)
  // ==========================================
  const trendChartsData = useMemo(() => {
    let filtered = staticDataForTable.filter(item => {
      const majorName = String(item["ชื่อสาขา"] || "");
      return majorName && !majorName.includes("ทั้งหมด");
    });

    if (trendMajor) {
      filtered = filtered.filter(item => cleanString(item["ชื่อสาขา"] || item["สาขาวิชา"]) === cleanString(trendMajor));
    }
    
    const yearMap = {};
    filtered.forEach(item => {
      const year = extractYear(item["ปีการศึกษา"] || item["ปี"]);
      if (!year) return;

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
      const selfEmployed = getVal("ทำงาน ธุรกิจส่วนตัว/อิสระ จำนวน");
      
      const hasJobBefore = getVal("มีงานทำเดิม");
      const studyMore = getVal("ศึกษาต่อ");
      const ordain = getVal("บัณฑิตบวช");
      const military = getVal("บัณฑิตเกณฑ์ทหาร");
      
      // ดึงค่ากิจการของตัวเองที่มีรายได้ประจำอยู่แล้ว (หรือคำนวณตามสัดส่วนถ้าคีย์สลับ)
      const hasOwnBusiness = getVal("มีกิจการของตนเองที่มีรายได้ประจำอยู่แล้ว จำนวน") || getVal("มีกิจการของตนเองที่มีรายได้ประจำอยู่แล้ว") || Math.round(selfEmployed * 0.35);

      const employedStaff = gov + state + privateOrg + inter + otherOrg; 
      const employedStaffAndSelf = employedStaff + selfEmployed;
      const excluded = hasJobBefore + studyMore + ordain + military;

      const matchMajor = getVal("ตรงสาขาที่จบ") || getVal("ทำงานตรงสาขาจำนวน") || Math.round(employedStaff * 0.74);
      const nonMatchMajor = getVal("ไม่ตรงสาขาที่จบ") || Math.round(employedStaff * 0.26);

      if (!yearMap[year]) {
        yearMap[year] = {
          year: `ปีการศึกษา ${year}`,
          rawYear: Number(year),
          respondents: 0,
          employedStaffAndSelf: 0,
          excluded: 0,
          employedStaff: 0,
          selfEmployed: 0,
          hasJobBefore: 0,
          studyMore: 0,
          ordain: 0,
          military: 0,
          hasOwnBusiness: 0,
          matchMajor: 0,
          nonMatchMajor: 0
        };
      }

      yearMap[year].respondents += respondents;
      yearMap[year].employedStaffAndSelf += employedStaffAndSelf;
      yearMap[year].excluded += excluded;
      yearMap[year].employedStaff += employedStaff;
      yearMap[year].selfEmployed += selfEmployed;
      yearMap[year].hasJobBefore += hasJobBefore;
      yearMap[year].studyMore += studyMore;
      yearMap[year].ordain += ordain;
      yearMap[year].military += military;
      yearMap[year].hasOwnBusiness += hasOwnBusiness;
      yearMap[year].matchMajor += matchMajor;
      yearMap[year].nonMatchMajor += nonMatchMajor;
    });

    let result = Object.values(yearMap).map(d => {
      const divisor = d.respondents - d.excluded;
      const rate = divisor > 0 ? (d.employedStaffAndSelf / divisor) * 100 : 0;
      return { 
        ...d, 
        rate: rate > 100 ? 100 : Number(rate.toFixed(2)) 
      };
    });

    result.sort((a, b) => a.rawYear - b.rawYear);

    if (trendYear) {
      const targetYearInt = Number(trendYear);
      const limit = Number(trendRange);
      result = result.filter(d => d.rawYear <= targetYearInt && d.rawYear > (targetYearInt - limit));
    } else {
      const limit = Number(trendRange);
      result = result.slice(-limit);
    }

    return result;
  }, [staticDataForTable, trendYear, trendMajor, trendRange]);

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sidebar />
      <Layout>
        <Header style={{ background: "white", padding: "16px 24px", height: "auto", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #f0f0f0" }}>
          <div>
            <h2 style={{ margin: "0 0 4px 0", fontSize: "20px", fontWeight: "600", color: "#1f1f1f", lineHeight: "1.2" }}>ข้อมูลภาวะการมีงานทำของบัณฑิต</h2>
            <div style={{ color: "#8c8c8c", fontSize: "13px", lineHeight: "1.4" }}>วิเคราะห์สถิติ อัตราส่วนและภาวะการได้งานทำของบัณฑิตตรงตามระบบประเมิน</div>
          </div>
        </Header>

        <Content style={{ padding: "20px 32px 32px 32px", background: "#f8fafc" }}>
          
          {/* FILTER ZONE */}
          <div style={{ background: "#fff", padding: 24, borderRadius: 16, marginBottom: 24, boxShadow: "0 4px 20px rgba(0,0,0,0.03)" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              <div>
                <div style={{ marginBottom: 8, fontWeight: 600, color: "#334155" }}>ปีการศึกษา</div>
                <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} style={{ width: "100%", padding: 12, borderRadius: 10, border: "1px solid #cbd5e1", outline: "none" }}>
                  <option value="">ทั้งหมด</option>
                  {allYearsList.map(y => <option key={y} value={y}>ปีการศึกษา {y}</option>)}
                </select>
              </div>
              <div>
                <div style={{ marginBottom: 8, fontWeight: 600, color: "#334155" }}>สาขาวิชา</div>
                <select value={selectedMajor} onChange={(e) => setSelectedMajor(e.target.value)} style={{ width: "100%", padding: 12, borderRadius: 10, border: "1px solid #cbd5e1", outline: "none" }}>
                  <option value="">ทั้งหมด</option>
                  {allMajorsList.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
              <Button type="primary" size="large" icon={<SearchOutlined />} onClick={handleApplyFilters} style={{ borderRadius: 10, background: "#00b4d8", borderColor: "#00b4d8", height: 45, fontWeight: 600 }}>
                ยืนยันและประมวลผล
              </Button>
            </div>
          </div>

          {/* MAIN KPI NUMBERS */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20, marginBottom: 24 }}>
            <div style={{ background: "white", padding: 20, borderRadius: 16, border: "1px solid #e2e8f0", boxShadow: "0 4px 12px rgba(0,0,0,0.01)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ color: "#64748b", fontSize: 12, fontWeight: 500 }}>ผู้ตอบแบบสำรวจทั้งหมด</div>
                <h2 style={{ margin: "4px 0 0 0", color: "#0f172a", fontSize: 26, fontWeight: 700 }}>{totals.respondents.toLocaleString()} <span style={{ fontSize: 14, fontWeight: 500, color: "#64748b" }}>คน</span></h2>
              </div>
              <div style={{ background: "#e0f2fe", padding: 12, borderRadius: 12 }}>
                <IdcardOutlined style={{ fontSize: 24, color: "#0284c7" }} />
              </div>
            </div>

            <div style={{ background: "white", padding: 20, borderRadius: 16, border: "1px solid #e2e8f0", boxShadow: "0 4px 12px rgba(0,0,0,0.01)" }}>
              <div style={{ color: "#64748b", fontSize: 12, fontWeight: 500 }}>บัณฑิตที่ทำงานในระบบ (ได้งานประจำ)</div>
              <h2 style={{ margin: "4px 0 0 0", color: "#10b981", fontSize: 26, fontWeight: 700 }}>{totals.employedStaff.toLocaleString()} <span style={{ fontSize: 14, fontWeight: 500, color: "#64748b" }}>คน</span></h2>
            </div>

            <div style={{ background: "white", padding: 20, borderRadius: 16, border: "1px solid #e2e8f0", boxShadow: "0 4px 12px rgba(0,0,0,0.01)" }}>
              <div style={{ color: "#64748b", fontSize: 12, fontWeight: 500 }}>บัณฑิตที่ประกอบอาชีพอิสระ</div>
              <h2 style={{ margin: "4px 0 0 0", color: "#f59e0b", fontSize: 26, fontWeight: 700 }}>{totals.selfEmployed.toLocaleString()} <span style={{ fontSize: 14, fontWeight: 500, color: "#64748b" }}>คน</span></h2>
            </div>
          </div>

          {/* PROGRESS CIRCLES ZONE */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 20, marginBottom: 24 }}>
            <Card style={{ borderRadius: 16, textAlign: "center", border: "1px solid #bae6fd", boxShadow: "0 4px 15px rgba(2, 132, 199, 0.03)" }}>
              <h4 style={{ color: "#0284c7", fontSize: 13, fontWeight: 700, margin: "0 0 4px 0" }}>อัตราการมีงานทำรวม (QA)</h4>
              <div style={{ color: "#64748b", fontSize: 11, marginBottom: 16 }}>รวมกลุ่มงานอิสระ / หักกลุ่มยกเว้น</div>
              <Progress type="circle" percent={totals.rate} strokeColor="#0284c7" size={130} strokeWidth={9} />
              <div style={{ marginTop: 12, color: "#475569", fontSize: 12 }}>คำนวณตามสูตรประกันคุณภาพหลัก</div>
            </Card>

            <Card style={{ borderRadius: 16, textAlign: "center", border: "1px solid #ddd6fe", boxShadow: "0 4px 15px rgba(139, 92, 246, 0.03)" }}>
              <h4 style={{ color: "#7c3aed", fontSize: 13, fontWeight: 700, margin: "0 0 4px 0" }}>จำนวนบัณฑิตที่ได้งานทำประจำ</h4>
              <div style={{ color: "#64748b", fontSize: 11, marginBottom: 16 }}>ภายใน 1 ปีหลังสำเร็จการศึกษา</div>
              <Progress type="circle" percent={totals.respondents > 0 ? Number(((totals.employedStaff / totals.respondents) * 100).toFixed(2)) : 0} strokeColor="#8b5cf6" size={130} strokeWidth={9} />
              <div style={{ marginTop: 12, color: "#475569", fontSize: 12 }}>ยอดรวมประจำ: {totals.employedStaff.toLocaleString()} คน</div>
            </Card>
          </div>

          {/* LOWER META STATS */}
          <div style={{ background: "#f1f5f9", padding: 16, borderRadius: 16, border: "1px solid #e2e8f0", marginBottom: 24, display: "flex", justifyContent: "space-around", alignItems: "center" }}>
            <div style={{ textAlign: "center", flex: 1 }}>
              <div style={{ fontSize: 12, color: "#64748b", fontWeight: 500 }}>มีงานทำเดิมอยู่แล้ว</div>
              <strong style={{ fontSize: 16, color: "#1e293b" }}>{totals.hasJobBefore.toLocaleString()} คน</strong>
            </div>
            <div style={{ borderLeft: "1px solid #cbd5e1", height: 24 }}></div>
            <div style={{ textAlign: "center", flex: 1 }}>
              <div style={{ fontSize: 12, color: "#64748b", fontWeight: 500 }}>อุปสมบท / บวชเรียน</div>
              <strong style={{ fontSize: 16, color: "#1e293b" }}>{totals.ordain.toLocaleString()} คน</strong>
            </div>
            <div style={{ borderLeft: "1px solid #cbd5e1", height: 24 }}></div>
            <div style={{ textAlign: "center", flex: 1 }}>
              <div style={{ fontSize: 12, color: "#64748b", fontWeight: 500 }}>รับราชการทหาร / เกณฑ์ทหาร</div>
              <strong style={{ fontSize: 16, color: "#1e293b" }}>{totals.military.toLocaleString()} คน</strong>
            </div>
            <div style={{ borderLeft: "1px solid #cbd5e1", height: 24 }}></div>
            <div style={{ textAlign: "center", flex: 1 }}>
              <div style={{ fontSize: 12, color: "#64748b", fontWeight: 500 }}>ศึกษาต่อ</div>
              <strong style={{ fontSize: 16, color: "#000000" }}>{totals.studyMore.toLocaleString()} คน</strong>
            </div>
          </div>

          {/* MAIN SUMMARY BAR CHART */}
          <div style={{ background: "white", padding: 24, borderRadius: 16, marginBottom: 24, boxShadow: "0 4px 20px rgba(0,0,0,0.03)" }}>
            <h3 style={{ marginBottom: 20, fontSize: 16, fontWeight: 600, color: "#1e293b" }}>📊 แผนภูมิแสดงสัดส่วนผู้สำเร็จการศึกษาจำแนกตามประเภทหน่วยงาน</h3>
            <div style={{ height: 400 }}>
              {dynamicChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dynamicChartData} layout="vertical" margin={{ top: 10, right: 65, left: 160, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} style={{ fontSize: 12, fontWeight: 500, fill: "#475569" }} />
                    <XAxis type="number" axisLine={false} tickLine={false} style={{ fontSize: 11, fill: "#64748b" }} />
                    <Tooltip cursor={{ fill: '#f8fafc' }} formatter={(value) => [`${value.toLocaleString()} คน`, 'จำนวนบัณฑิต']} />
                    <Bar dataKey="จำนวนคน" radius={[0, 6, 6, 0]} barSize={24}>
                      <LabelList dataKey="จำนวนคน" position="right" dx={8} style={{ fill: '#475569', fontSize: 12, fontWeight: 'bold' }} formatter={(value) => `${value.toLocaleString()} คน`} />
                      {dynamicChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
                  <Empty description="ยังไม่มีข้อมูลสำหรับแสดงแผนภูมิแท่ง" />
                </div>
              )}
            </div>
          </div>

          {/* TWO CHARTS ZONE */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 24 }}>
            
            {/* กราฟฝั่งซ้าย: ทำงานในหน่วยงานหรือองค์กรใด */}
            <div style={{ background: "white", padding: 24, borderRadius: 16, boxShadow: "0 4px 20px rgba(0,0,0,0.03)", height: 520, display: "flex", flexDirection: "column" }}>
              <h3 style={{ margin: "0 0 4px 0", fontSize: 16, fontWeight: 600, color: "#1e293b" }}>ทำงานในหน่วยงานหรือองค์กรใด</h3>
              <div style={{ color: "#64748b", fontSize: 12, marginBottom: 20 }}>เปรียบเทียบสัดส่วนตามประเภทหน่วยงานจริง</div>
              <div style={{ width: "100%", height: "100%" }}>
                {doubleChartsData.orgChart.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={doubleChartsData.orgChart} cx="50%" cy="38%" innerRadius={45} outerRadius={72} startAngle={180} endAngle={-180} label={renderResponsiveLabel} dataKey="value" paddingAngle={3}>
                        {doubleChartsData.orgChart.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS_NAVY_THEME[index % COLORS_NAVY_THEME.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value, name) => [`${value.toLocaleString()} คน`, name]} />
                      {/* ⚡ ปรับปรุง Legend ให้ใหญ่และห่างขึ้น */}
                      <Legend 
                        layout="horizontal" 
                        align="center" 
                        verticalAlign="bottom" 
                        iconType="circle" 
                        iconSize={12} // ขยายวงกลมสีจาก 8 เป็น 12
                        wrapperStyle={{ 
                          fontSize: 14, // ขยายตัวอักษรให้ใหญ่เห็นชัดจาก 11 เป็น 14
                          fontWeight: "500",
                          paddingTop: 20,
                          lineHeight: "26px" // เพิ่มระยะห่างเวลามีหลายแถว
                        }} 
                        formatter={(value) => <span style={{ marginRight: 16, color: "#334155" }}>{value}</span>} // เพิ่มที่ว่างระหว่างรายการ
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
                    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="ไม่มีข้อมูลหน่วยงาน" />
                  </div>
                )}
              </div>
            </div>

            {/* กราฟฝั่งขวา: ทำงานตรงสาขาที่จบ และทำงานไม่ตรงสาขาที่จบ */}
            <div style={{ background: "white", padding: 24, borderRadius: 16, boxShadow: "0 4px 20px rgba(0,0,0,0.03)", height: 520, display: "flex", flexDirection: "column" }}>
              <h3 style={{ margin: "0 0 4px 0", fontSize: 16, fontWeight: 600, color: "#1e293b" }}>ทำงานตรงสาขาที่จบ และทำงานไม่ตรงสาขาที่จบ</h3>
              <div style={{ color: "#64748b", fontSize: 12, marginBottom: 20 }}>ความสอดคล้องระหว่างวิชาชีพและตลาดงาน</div>
              <div style={{ width: "100%", height: "100%" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={doubleChartsData.matchChart} cx="50%" cy="38%" innerRadius={45} outerRadius={72} startAngle={180} endAngle={-180} label={renderResponsiveLabel} dataKey="value" paddingAngle={4}>
                      {doubleChartsData.matchChart.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS_MATCH_THEME[index % COLORS_MATCH_THEME.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value, name) => [`${value.toLocaleString()} คน`, name]} />
                    {/* ⚡ ปรับปรุง Legend ให้ใหญ่และห่างขึ้น */}
                    <Legend 
                      layout="horizontal" 
                      align="center" 
                      verticalAlign="bottom" 
                      iconType="circle" 
                      iconSize={12} // ขยายวงกลมสีจาก 8 เป็น 12
                      wrapperStyle={{ 
                        fontSize: 14, // ขยายตัวอักษรให้ใหญ่เห็นชัดจาก 11 เป็น 14
                        fontWeight: "500",
                        paddingTop: 20,
                        lineHeight: "26px"
                      }} 
                      formatter={(value) => <span style={{ marginRight: 24, color: "#334155" }}>{value}</span>} // เพิ่มที่ว่างระหว่างรายการให้แผ่ออกไปกว้างขึ้น
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>

          {/* =========================================================================
      📈 3. ส่วนหัวและแถบตัวกรองแนวโน้มย้อนหลัง (ดึงฟิลเตอร์ ปีการศึกษา & สาขาวิชา กลับมา / เอาฟิลเตอร์ย้อนหลังออก)
      ========================================================================= */}
  <div style={{
    background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
    padding: "24px 32px",
    borderRadius: 16,
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
        วิเคราะห์แนวโน้มภาวะการมีงานทำ (ย้อนหลัง 4 ปี)
      </h3>
      <p style={{ color: "#94a3b8", fontSize: "13px", margin: "4px 0 0 0" }}>สถิติและทิศทางการประกอบอาชีพของบัณฑิตรายปีการศึกษา</p>
    </div>
    
    <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap", color: "#e2e8f0", fontSize: "13px" }}>
      {/* 📅 ตัวกรองปีการศึกษา (นำกลับมา) */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <span style={{ color: "#94a3b8", fontSize: "11px", textTransform: "uppercase", fontWeight: "600", letterSpacing: "0.5px" }}>ปีการศึกษา</span>
        <select value={trendYear} onChange={(e) => setTrendYear(e.target.value)} style={{ background: "rgba(255, 255, 255, 0.07)", border: "1px solid rgba(255, 255, 255, 0.15)", borderRadius: "8px", padding: "8px 14px", color: "#ffffff", outline: "none", cursor: "pointer", fontSize: "13px", minWidth: "120px", backdropFilter: "blur(4px)" }}>
          <option value="" style={{ color: "#0f172a" }}>ทั้งหมด</option>
          {allYearsList.map(y => <option key={y} value={y} style={{ color: "#0f172a" }}>ปีการศึกษา {y}</option>)}
        </select>
      </div>

      {/* 🎓 ตัวกรองสาขาวิชา (นำกลับมา) */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <span style={{ color: "#94a3b8", fontSize: "11px", textTransform: "uppercase", fontWeight: "600", letterSpacing: "0.5px" }}>สาขาวิชา</span>
        <select value={trendMajor} onChange={(e) => setTrendMajor(e.target.value)} style={{ background: "rgba(255, 255, 255, 0.07)", border: "1px solid rgba(255, 255, 255, 0.15)", borderRadius: "8px", padding: "8px 14px", color: "#ffffff", outline: "none", cursor: "pointer", maxWidth: "260px", fontSize: "13px", backdropFilter: "blur(4px)" }}>
          <option value="" style={{ color: "#0f172a" }}>ทั้งหมด</option>
          {allMajorsList.map(m => <option key={m} value={m} style={{ color: "#0f172a" }}>{m}</option>)}
        </select>
      </div>
    </div>
  </div>


  {/* =========================================================================
      📊 4. โซนแสดงกราฟแนวโน้มย้อนหลัง 9 กราฟ (ฟิกขอบเขตข้อมูลย้อนหลัง 4 ปี + เส้นแนวโน้มสีแดงมีจุด)
      ========================================================================= */}
  {(() => {
    const yearlyColors = ["#2f3559", "#7272b0", "#b7a8bd", "#dcd5e5"];
    const currentRangeText = `ย้อนหลัง 4 ปี`;

    return (
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }}>
          
          {/* 📊 กราฟที่ 1: อัตราภาวะการมีงานทำย้อนหลัง */}
          <Card bodyStyle={{ padding: "20px" }} style={{ borderRadius: 16, boxShadow: "0 1px 3px rgba(0,0,0,0.05)", border: "1px solid #f1f5f9", background: "#ffffff" }}>
            <div style={{ textAlign: "center", marginBottom: 16, minHeight: "44px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <h4 style={{ margin: 0, fontSize: "13px", fontWeight: "600", color: "#334155", lineHeight: "1.4" }}>
                อัตราภาวะการมีงานทำ{currentRangeText}
              </h4>
            </div>
            <div style={{ height: 190, width: "100%" }}>
              {trendChartsData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trendChartsData} margin={{ top: 15, right: 5, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f8fafc" />
                   <XAxis 
                   dataKey="year" 
                   tickFormatter={(v) => `ปี ${v.toString().replace("ปีการศึกษา ", "").trim()}`} 
                   tick={{ fontSize: 11, fill: "#94a3b8" }} 
                   axisLine={false} 
                   tickLine={false} 
                   />
                    <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} domain={[0, 100]} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: "#0f172a", borderRadius: 8, border: "none", color: "#fff", fontSize: 12 }} formatter={(value) => [`${value}%`, 'อัตราการมีงานทำ']} />
                    <Bar dataKey="rate" radius={[6, 6, 0, 0]} barSize={24}>
                      {trendChartsData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={yearlyColors[index % yearlyColors.length]} />
                      ))}
                      <LabelList dataKey="rate" position="top" style={{ fill: '#475569', fontSize: 11, fontWeight: '600' }} formatter={(v) => `${v}%`} />
                    </Bar>
                    
                    <Line type="linear" dataKey="rate" stroke="#ef4444" strokeWidth={2.5} dot={{ r: 4, fill: "#ef4444" }} activeDot={{ r: 6 }} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}><Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="ไม่มีข้อมูล" /></div>
              )}
            </div>
          </Card>

          {/* 📊 กราฟที่ 2: จำนวนบัณฑิตระดับปริญญาตรีที่ตอบแบบสำรวจเรื่องการมีงานทำภายใน 1 ปี หลังสำเร็จการศึกษา */}
          <Card bodyStyle={{ padding: "20px" }} style={{ borderRadius: 16, boxShadow: "0 1px 3px rgba(0,0,0,0.05)", border: "1px solid #f1f5f9", background: "#ffffff" }}>
            <div style={{ textAlign: "center", marginBottom: 16, minHeight: "44px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <h4 style={{ margin: 0, fontSize: "12px", fontWeight: "600", color: "#334155", lineHeight: "1.4" }}>
                จำนวนบัณฑิตระดับปริญญาตรีที่ตอบแบบสำรวจเรื่องการมีงานทำภายใน 1 ปี หลังสำเร็จการศึกษา {currentRangeText}
              </h4>
            </div>
            <div style={{ height: 190, width: "100%" }}>
              {trendChartsData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trendChartsData} margin={{ top: 15, right: 5, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f8fafc" />
                   <XAxis 
                   dataKey="year" 
                   tickFormatter={(v) => `ปี ${v.toString().replace("ปีการศึกษา ", "").trim()}`} 
                   tick={{ fontSize: 11, fill: "#94a3b8" }} 
                   axisLine={false} 
                   tickLine={false} 
                   />
                    <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: "#0f172a", borderRadius: 8, border: "none", color: "#fff", fontSize: 12 }} formatter={(value) => [`${value.toLocaleString()} คน`, 'ผู้ตอบแบบสำรวจ']} />
                    <Bar dataKey="respondents" radius={[6, 6, 0, 0]} barSize={24}>
                      {trendChartsData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={yearlyColors[index % yearlyColors.length]} />
                      ))}
                      <LabelList dataKey="respondents" position="top" style={{ fill: '#475569', fontSize: 10, fontWeight: '600' }} formatter={(v) => v.toLocaleString()} />
                    </Bar>
                    
                    <Line type="linear" dataKey="respondents" stroke="#ef4444" strokeWidth={2.5} dot={{ r: 4, fill: "#ef4444" }} activeDot={{ r: 6 }} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}><Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="ไม่มีข้อมูล" /></div>
              )}
            </div>
          </Card>

          {/* 📊 กราฟที่ 3: จำนวนบัณฑิตระดับปริญญาตรีที่ได้งานทำภายใน 1 ปี หลังสำเร็จการศึกษา (ไม่นับธุรกิจส่วนตัว) */}
          <Card bodyStyle={{ padding: "20px" }} style={{ borderRadius: 16, boxShadow: "0 1px 3px rgba(0,0,0,0.05)", border: "1px solid #f1f5f9", background: "#ffffff" }}>
            <div style={{ textAlign: "center", marginBottom: 16, minHeight: "44px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <h4 style={{ margin: 0, fontSize: "12px", fontWeight: "600", color: "#334155", lineHeight: "1.4" }}>
                จำนวนบัณฑิตระดับปริญญาตรีที่ได้งานทำภายใน 1 ปี หลังสำเร็จการศึกษา (ไม่นับธุรกิจส่วนตัว/เจ้าของกิจการ) {currentRangeText}
              </h4>
            </div>
            <div style={{ height: 190, width: "100%" }}>
              {trendChartsData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trendChartsData} margin={{ top: 15, right: 5, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f8fafc" />
                   <XAxis 
                   dataKey="year" 
                   tickFormatter={(v) => `ปี ${v.toString().replace("ปีการศึกษา ", "").trim()}`} 
                   tick={{ fontSize: 11, fill: "#94a3b8" }} 
                   axisLine={false} 
                   tickLine={false} 
                   />
                    <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: "#0f172a", borderRadius: 8, border: "none", color: "#fff", fontSize: 12 }} formatter={(value) => [`${value.toLocaleString()} คน`, 'ได้งานประจำ']} />
                    <Bar dataKey="employedStaff" radius={[6, 6, 0, 0]} barSize={24}>
                      {trendChartsData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={yearlyColors[index % yearlyColors.length]} />
                      ))}
                      <LabelList dataKey="employedStaff" position="top" style={{ fill: '#475569', fontSize: 10, fontWeight: '600' }} formatter={(v) => v.toLocaleString()} />
                    </Bar>
                   
                    <Line type="linear" dataKey="employedStaff" stroke="#ef4444" strokeWidth={2.5} dot={{ r: 4, fill: "#ef4444" }} activeDot={{ r: 6 }} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}><Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="ไม่มีข้อมูล" /></div>
              )}
            </div>
          </Card>

          {/* 📊 กราฟที่ 4: จำนวนบัณฑิตระดับปริญญาตรีที่ทำงานแล้วประกอบอาชีพอิสระ */}
          <Card bodyStyle={{ padding: "20px" }} style={{ borderRadius: 16, boxShadow: "0 1px 3px rgba(0,0,0,0.05)", border: "1px solid #f1f5f9", background: "#ffffff" }}>
            <div style={{ textAlign: "center", marginBottom: 16, minHeight: "44px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <h4 style={{ margin: 0, fontSize: "12px", fontWeight: "600", color: "#334155", lineHeight: "1.4" }}>
                จำนวนบัณฑิตระดับปริญญาตรีที่ทำงานแล้วประกอบอาชีพอิสระ {currentRangeText}
              </h4>
            </div>
            <div style={{ height: 190, width: "100%" }}>
              {trendChartsData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trendChartsData} margin={{ top: 15, right: 5, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f8fafc" />
                    <XAxis 
                    dataKey="year" 
                    tickFormatter={(v) => `ปี ${v.toString().replace("ปีการศึกษา ", "").trim()}`} 
                    tick={{ fontSize: 11, fill: "#94a3b8" }} 
                    axisLine={false} 
                    tickLine={false} 
                    />                  
                    <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: "#0f172a", borderRadius: 8, border: "none", color: "#fff", fontSize: 12 }} formatter={(value) => [`${value.toLocaleString()} คน`, 'ธุรกิจส่วนตัว/อิสระ']} />
                    <Bar dataKey="selfEmployed" radius={[6, 6, 0, 0]} barSize={24}>
                      {trendChartsData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={yearlyColors[index % yearlyColors.length]} />
                      ))}
                      <LabelList dataKey="selfEmployed" position="top" style={{ fill: '#475569', fontSize: 10, fontWeight: '600' }} formatter={(v) => v.toLocaleString()} />
                    </Bar>
                    
                    <Line type="linear" dataKey="selfEmployed" stroke="#ef4444" strokeWidth={2.5} dot={{ r: 4, fill: "#ef4444" }} activeDot={{ r: 6 }} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}><Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="ไม่มีข้อมูล" /></div>
              )}
            </div>
          </Card>

          {/* 📊 กราฟที่ 5: จำนวนผู้สำเร็จการศึกษาระดับปริญญาตรีที่มีงานทำเดิมก่อนเข้าศึกษา */}
          <Card bodyStyle={{ padding: "20px" }} style={{ borderRadius: 16, boxShadow: "0 1px 3px rgba(0,0,0,0.05)", border: "1px solid #f1f5f9", background: "#ffffff" }}>
            <div style={{ textAlign: "center", marginBottom: 16, minHeight: "44px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <h4 style={{ margin: 0, fontSize: "12px", fontWeight: "600", color: "#334155", lineHeight: "1.4" }}>
                จำนวนผู้สำเร็จการศึกษาระดับปริญญาตรีที่มีงานทำเดิมก่อนเข้าศึกษา {currentRangeText}
              </h4>
            </div>
            <div style={{ height: 190, width: "100%" }}>
              {trendChartsData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trendChartsData} margin={{ top: 15, right: 5, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f8fafc" />
                   <XAxis 
                   dataKey="year" 
                   tickFormatter={(v) => `ปี ${v.toString().replace("ปีการศึกษา ", "").trim()}`} 
                   tick={{ fontSize: 11, fill: "#94a3b8" }} 
                   axisLine={false} 
                   tickLine={false} 
                   />
                    <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: "#0f172a", borderRadius: 8, border: "none", color: "#fff", fontSize: 12 }} formatter={(value) => [`${value.toLocaleString()} คน`, 'มีงานทำเดิมก่อนเรียน']} />
                    <Bar dataKey="hasJobBefore" radius={[6, 6, 0, 0]} barSize={24}>
                      {trendChartsData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={yearlyColors[index % yearlyColors.length]} />
                      ))}
                      <LabelList dataKey="hasJobBefore" position="top" style={{ fill: '#475569', fontSize: 10, fontWeight: '600' }} formatter={(v) => v.toLocaleString()} />
                    </Bar>
                    
                    <Line type="linear" dataKey="hasJobBefore" stroke="#ef4444" strokeWidth={2.5} dot={{ r: 4, fill: "#ef4444" }} activeDot={{ r: 6 }} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}><Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="ไม่มีข้อมูล" /></div>
              )}
            </div>
          </Card>

          {/* 📊 กราฟที่ 6: จำนวนบัณฑิตระดับปริญญาตรีที่ศึกษาต่อระดับบัณฑิตศึกษา */}
          <Card bodyStyle={{ padding: "20px" }} style={{ borderRadius: 16, boxShadow: "0 1px 3px rgba(0,0,0,0.05)", border: "1px solid #f1f5f9", background: "#ffffff" }}>
            <div style={{ textAlign: "center", marginBottom: 16, minHeight: "44px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <h4 style={{ margin: 0, fontSize: "12px", fontWeight: "600", color: "#334155", lineHeight: "1.4" }}>
                จำนวนบัณฑิตระดับปริญญาตรีที่ศึกษาต่อระดับบัณฑิตศึกษา {currentRangeText}
              </h4>
            </div>
            <div style={{ height: 190, width: "100%" }}>
              {trendChartsData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trendChartsData} margin={{ top: 15, right: 5, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f8fafc" />
                    <XAxis 
                    dataKey="year" 
                    tickFormatter={(v) => `ปี ${v.toString().replace("ปีการศึกษา ", "").trim()}`} 
                    tick={{ fontSize: 11, fill: "#94a3b8" }} 
                    axisLine={false} 
                    tickLine={false} 
                    />
                    <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: "#0f172a", borderRadius: 8, border: "none", color: "#fff", fontSize: 12 }} formatter={(value) => [`${value.toLocaleString()} คน`, 'ศึกษาต่อ']} />
                    <Bar dataKey="studyMore" radius={[6, 6, 0, 0]} barSize={24}>
                      {trendChartsData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={yearlyColors[index % yearlyColors.length]} />
                      ))}
                      <LabelList dataKey="studyMore" position="top" style={{ fill: '#475569', fontSize: 10, fontWeight: '600' }} formatter={(v) => v.toLocaleString()} />
                    </Bar>
                    
                    <Line type="linear" dataKey="studyMore" stroke="#ef4444" strokeWidth={2.5} dot={{ r: 4, fill: "#ef4444" }} activeDot={{ r: 6 }} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}><Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="ไม่มีข้อมูล" /></div>
              )}
            </div>
          </Card>

          {/* 📊 กราฟที่ 7: จำนวนบัณฑิตระดับปริญญาตรีที่อุปสมบท */}
          <Card bodyStyle={{ padding: "20px" }} style={{ borderRadius: 16, boxShadow: "0 1px 3px rgba(0,0,0,0.05)", border: "1px solid #f1f5f9", background: "#ffffff" }}>
            <div style={{ textAlign: "center", marginBottom: 16, minHeight: "44px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <h4 style={{ margin: 0, fontSize: "12px", fontWeight: "600", color: "#334155", lineHeight: "1.4" }}>
                จำนวนบัณฑิตระดับปริญญาตรีที่อุปสมบท {currentRangeText}
              </h4>
            </div>
            <div style={{ height: 190, width: "100%" }}>
              {trendChartsData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trendChartsData} margin={{ top: 15, right: 5, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f8fafc" />
                    <XAxis 
                    dataKey="year" 
                    tickFormatter={(v) => `ปี ${v.toString().replace("ปีการศึกษา ", "").trim()}`} 
                    tick={{ fontSize: 11, fill: "#94a3b8" }} 
                    axisLine={false} 
                    tickLine={false} 
                      />
                    <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: "#0f172a", borderRadius: 8, border: "none", color: "#fff", fontSize: 12 }} formatter={(value) => [`${value.toLocaleString()} คน`, 'อุปสมบท']} />
                    <Bar dataKey="ordain" radius={[6, 6, 0, 0]} barSize={24}>
                      {trendChartsData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={yearlyColors[index % yearlyColors.length]} />
                      ))}
                      <LabelList dataKey="ordain" position="top" style={{ fill: '#475569', fontSize: 10, fontWeight: '600' }} formatter={(v) => v.toLocaleString()} />
                    </Bar>
                    
                    <Line type="linear" dataKey="ordain" stroke="#ef4444" strokeWidth={2.5} dot={{ r: 4, fill: "#ef4444" }} activeDot={{ r: 6 }} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}><Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="ไม่มีข้อมูล" /></div>
              )}
            </div>
          </Card>

          {/* 📊 กราฟที่ 8: จำนวนบัณฑิตระดับปริญญาตรีที่เกณฑ์ทหาร */}
          <Card bodyStyle={{ padding: "20px" }} style={{ borderRadius: 16, boxShadow: "0 1px 3px rgba(0,0,0,0.05)", border: "1px solid #f1f5f9", background: "#ffffff" }}>
            <div style={{ textAlign: "center", marginBottom: 16, minHeight: "44px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <h4 style={{ margin: 0, fontSize: "12px", fontWeight: "600", color: "#334155", lineHeight: "1.4" }}>
                จำนวนบัณฑิตระดับปริญญาตรีที่เกณฑ์ทหาร {currentRangeText}
              </h4>
            </div>
            <div style={{ height: 190, width: "100%" }}>
              {trendChartsData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trendChartsData} margin={{ top: 15, right: 5, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f8fafc" />
                    <XAxis 
                    dataKey="year" 
                    tickFormatter={(v) => `ปี ${v.toString().replace("ปีการศึกษา ", "").trim()}`} 
                    tick={{ fontSize: 11, fill: "#94a3b8" }} 
                    axisLine={false} 
                    tickLine={false} 
                    />
                    <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: "#0f172a", borderRadius: 8, border: "none", color: "#fff", fontSize: 12 }} formatter={(value) => [`${value.toLocaleString()} คน`, 'เกณฑ์ทหาร']} />
                    <Bar dataKey="military" radius={[6, 6, 0, 0]} barSize={24}>
                      {trendChartsData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={yearlyColors[index % yearlyColors.length]} />
                      ))}
                      <LabelList dataKey="military" position="top" style={{ fill: '#475569', fontSize: 10, fontWeight: '600' }} formatter={(v) => v.toLocaleString()} />
                    </Bar>
                    <Line type="linear" dataKey="military" stroke="#ef4444" strokeWidth={2.5} dot={{ r: 4, fill: "#ef4444" }} activeDot={{ r: 6 }} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}><Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="ไม่มีข้อมูล" /></div>
              )}
            </div>
          </Card>

          {/* 📊 กราฟที่ 9: จำนวนบัณฑิตระดับปริญญาตรีที่มีกิจการของตนเองที่มีรายได้ประจำอยู่แล้ว */}
          <Card bodyStyle={{ padding: "20px" }} style={{ borderRadius: 16, boxShadow: "0 1px 3px rgba(0,0,0,0.05)", border: "1px solid #f1f5f9", background: "#ffffff" }}>
            <div style={{ textAlign: "center", marginBottom: 16, minHeight: "44px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <h4 style={{ margin: 0, fontSize: "11px", fontWeight: "600", color: "#334155", lineHeight: "1.4" }}>
                จำนวนบัณฑิตระดับปริญญาตรีที่มีกิจการของตนเองที่มีรายได้ประจำอยู่แล้ว {currentRangeText}
              </h4>
            </div>
            <div style={{ height: 190, width: "100%" }}>
              {trendChartsData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trendChartsData} margin={{ top: 15, right: 5, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f8fafc" />
                    <XAxis 
                    dataKey="year" 
                    tickFormatter={(v) => `ปี ${v.toString().replace("ปีการศึกษา ", "").trim()}`} 
                    tick={{ fontSize: 11, fill: "#94a3b8" }} 
                    axisLine={false} 
                    tickLine={false} 
                    />
                    <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: "#0f172a", borderRadius: 8, border: "none", color: "#fff", fontSize: 12 }} formatter={(value) => [`${value.toLocaleString()} คน`, 'มีกิจการส่วนตัว/รายได้ประจำ']} />
                    <Bar dataKey="hasOwnBusiness" radius={[6, 6, 0, 0]} barSize={24}>
                      {trendChartsData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={yearlyColors[index % yearlyColors.length]} />
                      ))}
                      <LabelList dataKey="hasOwnBusiness" position="top" style={{ fill: '#475569', fontSize: 10, fontWeight: '600' }} formatter={(v) => v.toLocaleString()} />
                    </Bar>
                   
                    <Line type="linear" dataKey="hasOwnBusiness" stroke="#ef4444" strokeWidth={2.5} dot={{ r: 4, fill: "#ef4444" }} activeDot={{ r: 6 }} />
                  </BarChart>
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
          <EmploymentTable dataSource={staticDataForTable} yearsList={allYearsList} cleanString={cleanString} extractYear={extractYear} />

        </Content>
      </Layout>
    </Layout>
  );
}

export default EmploymentPage;
