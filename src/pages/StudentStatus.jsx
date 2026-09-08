import { Layout, Table, Button } from "antd";
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
  PieChart,  
  Pie,       
  Cell,
  LabelList
} from "recharts";
import {
  SearchOutlined,
  LogoutOutlined,
  CloseCircleOutlined,
  UserDeleteOutlined,
  ReloadOutlined,
  FilterOutlined,
  PieChartOutlined,
  BarChartOutlined,
  TableOutlined
} from "@ant-design/icons";

const { Header, Content } = Layout;

function StudentStatus() {
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedMajor, setSelectedMajor] = useState("");

  const [appliedFilters, setAppliedFilters] = useState({
    year: "",
    major: ""
  });

  const [dashboardData, setDashboardData] = useState(null);

  // โหลดข้อมูลจาก localStorage
  const loadDataFromStorage = () => {
    const stored = localStorage.getItem("dashboardData");
    if (stored) {
      try {
        setDashboardData(JSON.parse(stored));
      } catch (err) {
        console.error("Error parsing dashboardData:", err);
      }
    }
  };

  useEffect(() => {
    loadDataFromStorage();
    window.addEventListener("storage", loadDataFromStorage);
    return () => {
      window.removeEventListener("storage", loadDataFromStorage);
    };
  }, []);

  // ล็อกตำแหน่งดัชนีคอลัมน์ตามโครงสร้างไฟล์จริง
  const parsedData = useMemo(() => {
    let rawList = dashboardData?.["ข้อมูลสถานภาพนิสิต"] || [];
    
    if (rawList && !Array.isArray(rawList) && rawList["ข้อมูลสถานภาพนิสิต"]) {
      rawList = rawList["ข้อมูลสถานภาพนิสิต"];
    }
    
    if (!Array.isArray(rawList) || rawList.length === 0) {
      return { dropouts: [], dismissals: [], expels: [] };
    }

    const dropouts = [];
    const dismissals = [];
    const expels = [];

    rawList.forEach((row) => {
      if (!row) return;

      const rowValues = Object.values(row);

      const degree = rowValues[0] ? String(rowValues[0]).trim() : "";
      const major = rowValues[1] ? String(rowValues[1]).trim() : "";
      const year = rowValues[3] ? String(rowValues[3]).trim() : "";

      if (!major || major === "สาขา" || major.includes("คณะ") || !year || year.includes("ปีการศึกษา")) {
        return; 
      }

      const dropCount1 = Number(rowValues[5]) || 0;
      const dropCount2 = Number(rowValues[10]) || 0;
      const totalDrop = dropCount1 + dropCount2;

      const totalDismiss = Number(rowValues[6]) || 0;
      const totalExpel = Number(rowValues[7]) || 0;

      if (totalDrop > 0) {
        dropouts.push({ ปีการศึกษา: year, ชื่อสาขา: major, หลักสูตร: degree, จำนวน: totalDrop, หมายเหตุ: "ลาออกตามความประสงค์" });
      }
      if (totalDismiss > 0) {
        dismissals.push({ ปีการศึกษา: year, ชื่อสาขา: major, หลักสูตร: degree, จำนวน: totalDismiss, หมายเหตุ: "พ้นสภาพเนื่องจากผลการเรียน/เวลาเรียน" });
      }
      if (totalExpel > 0) {
        expels.push({ ปีการศึกษา: year, ชื่อสาขา: major, หลักสูตร: degree, จำนวน: totalExpel, หมายเหตุ: "ถูกคัดชื่อออกจากระบบคณะ" });
      }
    });

    return { dropouts, dismissals, expels };
  }, [dashboardData]);

  // ฟิลเตอร์คัดเลือก ปีการศึกษา
  const years = useMemo(() => {
    const allYears = [
      ...parsedData.dropouts.map(item => item["ปีการศึกษา"]),
      ...parsedData.dismissals.map(item => item["ปีการศึกษา"]),
      ...parsedData.expels.map(item => item["ปีการศึกษา"])
    ];
    return [...new Set(allYears)].filter(Boolean).sort();
  }, [parsedData]);

  // ฟิลเตอร์คัดเลือก สาขาวิชา
  const majors = useMemo(() => {
    const allMajors = [
      ...parsedData.dropouts.map(item => item["ชื่อสาขา"]),
      ...parsedData.dismissals.map(item => item["ชื่อสาขา"]),
      ...parsedData.expels.map(item => item["ชื่อสาขา"])
    ];
    return [...new Set(allMajors)].filter(Boolean).sort();
  }, [parsedData]);

  const handleApplyFilters = () => {
    setAppliedFilters({
      year: selectedYear,
      major: selectedMajor
    });
  };

  const handleResetFilters = () => {
    setSelectedYear("");
    setSelectedMajor("");
    setAppliedFilters({ year: "", major: "" });
  };

  const filterHelper = (data) => {
    return data.filter((item) => {
      const yearMatch = !appliedFilters.year || String(item["ปีการศึกษา"]) === String(appliedFilters.year);
      const majorMatch = !appliedFilters.major || item["ชื่อสาขา"] === appliedFilters.major;
      return yearMatch && majorMatch;
    });
  };

  const filteredDropout = useMemo(() => filterHelper(parsedData.dropouts), [parsedData.dropouts, appliedFilters]);
  const filteredDismissed = useMemo(() => filterHelper(parsedData.dismissals), [parsedData.dismissals, appliedFilters]);
  const filteredExpelled = useMemo(() => filterHelper(parsedData.expels), [parsedData.expels, appliedFilters]);

  const totalDropout = filteredDropout.reduce((sum, item) => sum + item["จำนวน"], 0);
  const totalDismissed = filteredDismissed.reduce((sum, item) => sum + item["จำนวน"], 0);
  const totalExpelled = filteredExpelled.reduce((sum, item) => sum + item["จำนวน"], 0);

  // คำนวณชุดข้อมูลสำหรับ Pie Chart สาเหตุการออก
  const pieReasonData = useMemo(() => {
    return [
      { name: "ลาออก", value: totalDropout, color: "#f59e0b" },
      { name: "พ้นสภาพ", value: totalDismissed, color: "#ef4444" },
      { name: "ถูกคัดชื่อออก", value: totalExpelled, color: "#64748b" }
    ].filter(item => item.value > 0);
  }, [totalDismissed, totalExpelled, totalDropout]);

  // คำนวณชุดข้อมูลสำหรับ Pie Chart สถานะบัณฑิต
  const pieStatusData = useMemo(() => {
    const totalOut = totalDropout + totalDismissed + totalExpelled;
    const studying = 473; 
    return [
      { name: "กำลังศึกษา", value: studying, color: "#2ba859" },
      { name: "ออกกลางคัน", value: totalOut, color: "#ef4444" },
      { name: "สำเร็จการศึกษา", value: 0, color: "#10b981" }
    ].filter(item => item.value > 0);
  }, [totalDropout, totalDismissed, totalExpelled]);

  const chartData = useMemo(() => {
    const map = {};
    filteredDropout.forEach(item => {
      const m = item["ชื่อสาขา"] || "-";
      if (!map[m]) map[m] = { name: m, ลาออก: 0, พ้นสภาพ: 0, ถูกคัดชื่อ: 0 };
      map[m].ลาออก += item["จำนวน"];
    });
    filteredDismissed.forEach(item => {
      const m = item["ชื่อสาขา"] || "-";
      if (!map[m]) map[m] = { name: m, ลาออก: 0, พ้นสภาพ: 0, ถูกคัดชื่อ: 0 };
      map[m].พ้นสภาพ += item["จำนวน"];
    });
    filteredExpelled.forEach(item => {
      const m = item["ชื่อสาขา"] || "-";
      if (!map[m]) map[m] = { name: m, ลาออก: 0, พ้นสภาพ: 0, ถูกคัดชื่อ: 0 };
      map[m].ถูกคัดชื่อ += item["จำนวน"];
    });
    return Object.values(map);
  }, [filteredDropout, filteredDismissed, filteredExpelled]);

  const maxChartValue = useMemo(() => {
    if (chartData.length === 0) return 5;
    let absoluteMax = 0;
    chartData.forEach(item => {
      const itemMax = Math.max(item.ลาออก || 0, item.พ้นสภาพ || 0, item.ถูกคัดชื่อ || 0);
      if (itemMax > absoluteMax) absoluteMax = itemMax;
    });
    
    if (absoluteMax < 5) return 5;
    return Math.ceil(absoluteMax * 1.15);
  }, [chartData]);

  const chartTitleYear = useMemo(() => {
    if (appliedFilters.year) {
      return `ปีการศึกษา ${appliedFilters.year}`;
    }
    if (years.length > 0) {
      return `ปีการศึกษา ${years[0]} - ${years[years.length - 1]}`;
    }
    return "ทุกปีการศึกษา";
  }, [appliedFilters.year, years]);

  const columns = [
    { title: "ปีการศึกษาที่รับเข้า", dataIndex: "ปีการศึกษา", key: "year", width: 160, align: "center" },
    { title: "สาขาวิชา", dataIndex: "ชื่อสาขา", key: "major" },
    { title: "หลักสูตร", dataIndex: "หลักสูตร", key: "degree" },
    { title: "สถานะ/รายละเอียด", dataIndex: "หมายเหตุ", key: "note" },
    { 
      title: "จำนวน (คน)", 
      dataIndex: "จำนวน", 
      key: "count", 
      align: "right",
      render: (text) => <strong style={{ color: "#0f172a" }}>{Number(text).toLocaleString()} คน</strong> 
    },
  ];

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sidebar />
      <Layout style={{ background: "#f8fafc" }}>
        
        {/* HEADER */}
        <Header style={{ background: "white", padding: "16px 24px", height: "auto", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #e2e8f0" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <h2 style={{ margin: 0, fontSize: "20px", fontWeight: "700", color: "#0f172a", lineHeight: "1.2" }}>
              Student Status Overview
            </h2>
            <div style={{ color: "#64748b", fontSize: "13px", lineHeight: "1.4", margin: 0 }}>
              ระบบวิเคราะห์ข้อมูลสถานะนิสิต (จำแนกกลุ่ม ลาออก / พ้นสภาพ / ถูกคัดชื่อ)
            </div>
          </div>
        </Header>

        <Content style={{ padding: "24px 32px" }}>
          
          {/* FILTER ZONE */}
          <div style={{ background: "#fff", padding: 20, borderRadius: 16, marginBottom: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.05)", border: "1px solid #f1f5f9" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16, marginBottom: 16 }}>
              <div>
                <div style={{ marginBottom: 6, fontWeight: 600, color: "#334155", fontSize: 13 }}><FilterOutlined /> ปีการศึกษาที่รับเข้า</div>
                <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} style={{ width: "100%", padding: "10px", borderRadius: 8, border: "1px solid #cbd5e1", outline: "none", color: "#0f172a" }}>
                  <option value="">ทั้งหมด</option>
                  {years.map((year) => <option key={year} value={year}>ปี {year}</option>)}
                </select>
              </div>

              <div>
                <div style={{ marginBottom: 6, fontWeight: 600, color: "#334155", fontSize: 13 }}><FilterOutlined /> สาขาวิชา</div>
                <select value={selectedMajor} onChange={(e) => setSelectedMajor(e.target.value)} style={{ width: "100%", padding: "10px", borderRadius: 8, border: "1px solid #cbd5e1", outline: "none", color: "#0f172a" }}>
                  <option value="">ทั้งหมด</option>
                  {majors.map((major) => <option key={major} value={major}>{major}</option>)}
                </select>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
              <Button size="large" icon={<ReloadOutlined />} onClick={handleResetFilters} style={{ height: 41, borderRadius: 8, padding: "0 20px" }}>
                ล้างค่าการค้นหา
              </Button>
              <Button type="primary" size="large" icon={<SearchOutlined />} onClick={handleApplyFilters} style={{ height: 41, borderRadius: 8, padding: "0 28px", fontSize: 14, fontWeight: 600, background: "#0284c7", borderColor: "#0284c7" }}>
                ค้นหาข้อมูลสถานะ
              </Button>
            </div>
          </div>

          {/* KPI ZONE */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 }}>
            
            {/* KPI 1: นิสิตลาออก */}
            <div style={{ 
              background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)", 
              padding: "20px", 
              borderRadius: 16, 
              color: "#ffffff", 
              boxShadow: "0 4px 14px rgba(245, 158, 11, 0.25)", 
              position: "relative", 
              minHeight: 130 
            }}>
              <div style={{ color: "#fef3c7", fontSize: 11, fontWeight: 600 }}>สถานะนิสิต</div>
              <h4 style={{ margin: "4px 0", fontSize: 14, color: "#fffbeb", fontWeight: 500 }}>นิสิตลาออก</h4>
              <h2 style={{ margin: 0, fontSize: 28, fontWeight: "800", color: "#ffffff" }}>
                {totalDropout.toLocaleString()} <span style={{ fontSize: 13, fontWeight: "400", color: "#fef3c7" }}>คน</span>
              </h2>
              <LogoutOutlined style={{ fontSize: 36, color: "#ffffff", position: "absolute", right: 20, bottom: 20, opacity: 0.25 }} />
            </div>

            {/* KPI 2: นิสิตพ้นสภาพ */}
            <div style={{ 
              background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)", 
              padding: "20px", 
              borderRadius: 16, 
              color: "#ffffff", 
              boxShadow: "0 4px 14px rgba(239, 68, 68, 0.25)", 
              position: "relative", 
              minHeight: 130 
            }}>
              <div style={{ color: "#fee2e2", fontSize: 11, fontWeight: 600 }}>สถานะนิสิต</div>
              <h4 style={{ margin: "4px 0", fontSize: 14, color: "#fef2f2", fontWeight: 500 }}>นิสิตพ้นสภาพ</h4>
              <h2 style={{ margin: 0, fontSize: 28, fontWeight: "800", color: "#ffffff" }}>
                {totalDismissed.toLocaleString()} <span style={{ fontSize: 13, fontWeight: "400", color: "#fee2e2" }}>คน</span>
              </h2>
              <CloseCircleOutlined style={{ fontSize: 36, color: "#ffffff", position: "absolute", right: 20, bottom: 20, opacity: 0.25 }} />
            </div>

            {/* KPI 3: นิสิตถูกคัดชื่อ */}
            <div style={{ 
              background: "linear-gradient(135deg, #64748b 0%, #475569 100%)", 
              padding: "20px", 
              borderRadius: 16, 
              color: "#ffffff", 
              boxShadow: "0 4px 14px rgba(100, 116, 139, 0.25)", 
              position: "relative", 
              minHeight: 130 
            }}>
              <div style={{ color: "#e2e8f0", fontSize: 11, fontWeight: 600 }}>สถานะนิสิต</div>
              <h4 style={{ margin: "4px 0", fontSize: 14, color: "#f8fafc", fontWeight: 500 }}>นิสิตถูกคัดชื่อ</h4>
              <h2 style={{ margin: 0, fontSize: 28, fontWeight: "800", color: "#ffffff" }}>
                {totalExpelled.toLocaleString()} <span style={{ fontSize: 13, fontWeight: "400", color: "#e2e8f0" }}>คน</span>
              </h2>
              <UserDeleteOutlined style={{ fontSize: 36, color: "#ffffff", position: "absolute", right: 20, bottom: 20, opacity: 0.25 }} />
            </div>

          </div>

          {/* PIE/DONUT CHARTS ZONE */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16, marginBottom: 24 }}>
            
            {/* กราฟที่ 1: สาเหตุการออก */}
            <div style={{ background: "white", borderRadius: 16, padding: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.02)", border: "1px solid #e2e8f0" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                <PieChartOutlined style={{ fontSize: 18, color: "#0284c7" }} />
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#0f172a" }}>
                  สัดส่วนสาเหตุการพ้นสภาพ / การออก
                </h3>
              </div>
              <div style={{ height: 260 }}>
                {pieReasonData.length === 0 ? (
                  <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8" }}>
                    ไม่มีข้อมูลการออก
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieReasonData}
                        dataKey="value"
                        nameKey="name"
                        cx="40%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={90}
                        paddingAngle={3}
                        label={({ value, percent }) => `${value} (${(percent * 100).toFixed(1)}%)`}
                      >
                        {pieReasonData.map((entry, index) => (
                          <Cell key={`cell-reason-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value} คน`, 'จำนวน']} contentStyle={{ borderRadius: 8, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }} />
                      <Legend 
                        layout="vertical" 
                        verticalAlign="middle" 
                        align="right"
                        iconType="circle"
                        wrapperStyle={{ fontSize: 13, paddingLeft: 10, fontWeight: 500 }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* กราฟที่ 2: สถานะบัณฑิต */}
            <div style={{ background: "white", borderRadius: 16, padding: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.02)", border: "1px solid #e2e8f0" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                <PieChartOutlined style={{ fontSize: 18, color: "#0284c7" }} />
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#0f172a" }}>
                  เปรียบเทียบสัดส่วนภาพรวมสถานะนิสิต
                </h3>
              </div>
              <div style={{ height: 260 }}>
                {pieStatusData.length === 0 ? (
                  <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8" }}>
                    ไม่มีข้อมูลสถานะ
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieStatusData}
                        dataKey="value"
                        nameKey="name"
                        cx="40%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={90}
                        paddingAngle={3}
                        label={({ value, percent }) => `${value} (${(percent * 100).toFixed(1)}%)`}
                      >
                        {pieStatusData.map((entry, index) => (
                          <Cell key={`cell-status-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value} คน`, 'จำนวน']} contentStyle={{ borderRadius: 8, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }} />
                      <Legend 
                        layout="vertical" 
                        verticalAlign="middle" 
                        align="right"
                        iconType="circle"
                        wrapperStyle={{ fontSize: 13, paddingLeft: 10, fontWeight: 500 }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

          </div>

          {/* GRAPH CHART ZONE */}
          <div style={{ background: "white", borderRadius: 16, padding: 24, marginBottom: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.02)", border: "1px solid #e2e8f0" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <BarChartOutlined style={{ fontSize: 20, color: "#0284c7" }} />
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#0f172a" }}>
                  เปรียบเทียบจำนวนนิสิตออกกลางคันแยกตามสาขาวิชา ({chartTitleYear})
                </h3>
                <div style={{ color: "#64748b", fontSize: 12, marginTop: 2 }}>จำแนกตามสัดส่วน ลาออก พ้นสภาพ และถูกคัดชื่อออก</div>
              </div>
            </div>
            
            <div style={{ height: chartData.length > 5 ? chartData.length * 55 : 350, minHeight: 350 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={chartData} 
                  layout="vertical"
                  margin={{ top: 10, right: 40, left: 10, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                  
                  <XAxis 
                    type="number" 
                    stroke="#94a3b8" 
                    style={{ fontSize: 12 }} 
                    allowDecimals={false}
                    domain={[0, maxChartValue]}
                    axisLine={false}
                    tickLine={false}
                  />
                  
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    stroke="#64748b" 
                    tickLine={false}
                    axisLine={false}
                    style={{ fontSize: 12, fontWeight: 500, fill: "#334155" }}
                    width={180}
                  />
                  
                  <Tooltip 
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ 
                      borderRadius: 8, 
                      border: "none", 
                      boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                      fontSize: 13 
                    }} 
                  />
                  
                  <Legend 
                    verticalAlign="top" 
                    height={40} 
                    iconType="circle"
                    iconSize={10}
                    wrapperStyle={{ fontSize: 13, fontWeight: 500 }}
                  />
                  
                  <Bar dataKey="ลาออก" fill="#f59e0b" barSize={12} radius={[0, 4, 4, 0]}>
                    <LabelList 
                      dataKey="ลาออก" 
                      position="right" 
                      fill="#d97706" 
                      style={{ fontSize: 11, fontWeight: 700 }} 
                      formatter={(value) => value > 0 ? value : ""}
                      dx={5}
                    />
                  </Bar>
                  <Bar dataKey="พ้นสภาพ" fill="#ef4444" barSize={12} radius={[0, 4, 4, 0]}>
                    <LabelList 
                      dataKey="พ้นสภาพ" 
                      position="right" 
                      fill="#dc2626" 
                      style={{ fontSize: 11, fontWeight: 700 }} 
                      formatter={(value) => value > 0 ? value : ""}
                      dx={5}
                    />
                  </Bar>
                  <Bar dataKey="ถูกคัดชื่อ" fill="#64748b" barSize={12} radius={[0, 4, 4, 0]}>
                    <LabelList 
                      dataKey="ถูกคัดชื่อ" 
                      position="right" 
                      fill="#475569" 
                      style={{ fontSize: 11, fontWeight: 700 }} 
                      formatter={(value) => value > 0 ? value : ""}
                      dx={5}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* TABLE ZONE */}
          <div style={{ background: "white", padding: 24, borderRadius: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.02)", border: "1px solid #e2e8f0" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
              <TableOutlined style={{ fontSize: 20, color: "#0284c7" }} />
              <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: "#0f172a" }}>รายละเอียดข้อมูลนิสิตจำแนกรายบุคคล/กลุ่มสถานะ</h3>
            </div>
            
            <h4 style={{ marginTop: 20, color: "#d97706", fontSize: 15, fontWeight: 700 }}>📋 รายการนิสิตลาออก</h4>
            <Table 
              columns={columns} 
              dataSource={filteredDropout} 
              rowKey={(record, i) => `drop-${i}`} 
              pagination={{ 
                defaultPageSize: 5, 
                pageSizeOptions: ["5", "10", "20"], 
                showSizeChanger: true,
                showTotal: (total) => `รวม ${total} รายการ`
              }} 
              size="small" 
              bordered
            />

            <h4 style={{ marginTop: 30, color: "#dc2626", fontSize: 15, fontWeight: 700 }}>📋 รายการนิสิตพ้นสภาพ</h4>
            <Table 
              columns={columns} 
              dataSource={filteredDismissed} 
              rowKey={(record, i) => `dism-${i}`} 
              pagination={{ 
                defaultPageSize: 5, 
                pageSizeOptions: ["5", "10", "20"], 
                showSizeChanger: true,
                showTotal: (total) => `รวม ${total} รายการ`
              }} 
              size="small" 
              bordered
            />

            <h4 style={{ marginTop: 30, color: "#475569", fontSize: 15, fontWeight: 700 }}>📋 รายการนิสิตถูกคัดชื่อ</h4>
            <Table 
              columns={columns} 
              dataSource={filteredExpelled} 
              rowKey={(record, i) => `expel-${i}`} 
              pagination={{ 
                defaultPageSize: 5, 
                pageSizeOptions: ["5", "10", "20"], 
                showSizeChanger: true,
                showTotal: (total) => `รวม ${total} รายการ`
              }} 
              size="small" 
              bordered
            />
          </div>

        </Content>
      </Layout>
    </Layout>
  );
}

export default StudentStatus;
