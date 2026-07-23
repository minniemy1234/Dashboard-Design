import { Layout, Table, Button, Input } from "antd";
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
  UserDeleteOutlined
} from "@ant-design/icons";

const { Header, Content } = Layout;

function StudentStatus() {
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedMajor, setSelectedMajor] = useState("");
  const [searchText, setSearchText] = useState("");

  const [appliedFilters, setAppliedFilters] = useState({
    year: "",
    major: "",
    search: ""
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

  // 🎯 หัวใจหลักการแกะตาราง: ล็อกตำแหน่งดัชนีคอลัมน์ตามโครงสร้างไฟล์จริง
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

    // เริ่มวนลูปอ่านแถวข้อมูลจริงตั้งแต่แถวที่ 6 เป็นต้นไป (หลังจากผ่านช่วงหัวข้อรายงานแล้ว)
    rawList.forEach((row) => {
      if (!row) return;

      // แปลง Object ให้เป็นอาร์เรย์ของข้อมูลรายคอลัมน์ เพื่อตัดปัญหาชื่อ Key เพี้ยน
      const rowValues = Object.values(row);

      // ล็อกดัชนีคอลัมน์ตามตำแหน่งของไฟล์จริง
      const degree = rowValues[0] ? String(rowValues[0]).trim() : "";  // คอลัมน์แรก: ชื่อหลักสูตร
      const major = rowValues[1] ? String(rowValues[1]).trim() : "";   // คอลัมน์ 2: สาขาวิชา
      const year = rowValues[3] ? String(rowValues[3]).trim() : "";    // คอลัมน์ 4: ปีการศึกษาที่รับเข้า

      // ดักจับข้อมูลขยะ แถวสรุปยอด หรือ แถวหัวตารางเดิมที่ปนมา
      if (!major || major === "สาขา" || major.includes("คณะ") || !year || year.includes("ปีการศึกษา")) {
        return; 
      }

      // ดึงสถิติตามตำแหน่งคอลัมน์ (นับตำแหน่งเริ่มจาก 0)
      // คอลัมน์ดัชนีที่ 5 = ลาออก (ปี 2564)
      // คอลัมน์ดัชนีที่ 10 = ลาออก (ภาคปลาย 2567)
      const dropCount1 = Number(rowValues[5]) || 0;
      const dropCount2 = Number(rowValues[10]) || 0;
      const totalDrop = dropCount1 + dropCount2;

      // คอลัมน์ดัชนีที่ 6 = พ้นสภาพ(N)
      const totalDismiss = Number(rowValues[6]) || 0;

      // คอลัมน์ดัชนีที่ 7 = ถูกคัดชื่อออก
      const totalExpel = Number(rowValues[7]) || 0;

      // จัดหมวดหมู่ส่งไปยังตารางและกราฟ (ดักกรองแสดงเฉพาะยอดที่มากกว่า 0)
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
      major: selectedMajor,
      search: searchText
    });
  };

  const filterHelper = (data) => {
    return data.filter((item) => {
      const searchMatch = !appliedFilters.search || JSON.stringify(item).toLowerCase().includes(appliedFilters.search.toLowerCase());
      const yearMatch = !appliedFilters.year || String(item["ปีการศึกษา"]) === String(appliedFilters.year);
      const majorMatch = !appliedFilters.major || item["ชื่อสาขา"] === appliedFilters.major;
      return searchMatch && yearMatch && majorMatch;
    });
  };

  const filteredDropout = useMemo(() => filterHelper(parsedData.dropouts), [parsedData.dropouts, appliedFilters]);
  const filteredDismissed = useMemo(() => filterHelper(parsedData.dismissals), [parsedData.dismissals, appliedFilters]);
  const filteredExpelled = useMemo(() => filterHelper(parsedData.expels), [parsedData.expels, appliedFilters]);

  const totalDropout = filteredDropout.reduce((sum, item) => sum + item["จำนวน"], 0);
  const totalDismissed = filteredDismissed.reduce((sum, item) => sum + item["จำนวน"], 0);
  const totalExpelled = filteredExpelled.reduce((sum, item) => sum + item["จำนวน"], 0);

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

  // 📈 คำนวณหาค่าสูงที่สุดในแต่ละสาขาวิชา และบวกเผื่อพื้นที่ด้านขวา เพื่อไม่ให้ตัวเลขหลักหน่วย/สิบที่แสดงปลายแท่งโดนบีบจนตกขอบแกนกราฟ
  const maxChartValue = useMemo(() => {
    if (chartData.length === 0) return 5;
    let absoluteMax = 0;
    chartData.forEach(item => {
      const itemMax = Math.max(item.ลาออก || 0, item.พ้นสภาพ || 0, item.ถูกคัดชื่อ || 0);
      if (itemMax > absoluteMax) absoluteMax = itemMax;
    });
    
    if (absoluteMax < 5) return 5;
    
    // เผื่อขอบไว้ 15% เพื่อให้มีที่ว่างพอสำหรับวาง Label ตัวเลขปลายแท่ง
    return Math.ceil(absoluteMax * 1.15);
  }, [chartData]);

  // 📝 คำนวณ Dynamic Title สำหรับกราฟตามปีการศึกษาที่เลือกจริง
  const chartTitleYear = useMemo(() => {
    if (appliedFilters.year) {
      return `ปีการศึกษา ${appliedFilters.year}`;
    }
    if (years.length > 0) {
      // แสดงช่วงปีที่พบทั้งหมด เช่น "ปีการศึกษา 2564 - 2567"
      return `ปีการศึกษา ${years[0]} - ${years[years.length - 1]}`;
    }
    return "ทุกปีการศึกษา";
  }, [appliedFilters.year, years]);

  const columns = [
    { title: "ปีการศึกษาที่รับเข้า", dataIndex: "ปีการศึกษา", key: "year", width: 150, align: "center" },
    { title: "สาขาวิชา", dataIndex: "ชื่อสาขา", key: "major" },
    { title: "หลักสูตร", dataIndex: "หลักสูตร", key: "degree" },
    { title: "สถานะ/รายละเอียด", dataIndex: "หมายเหตุ", key: "note" },
    { 
      title: "จำนวน (คน)", 
      dataIndex: "จำนวน", 
      key: "count", 
      align: "right",
      render: (text) => <strong>{Number(text).toLocaleString()} คน</strong> 
    },
  ];

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sidebar />
      <Layout>
        <Header style={{ background: "white", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 20px", height: "auto", lineHeight: "normal" }}>
          <div>
            <h2 style={{ margin: 0 }}>Student Status Overview</h2>
            <div style={{ color: "#888", fontSize: 13 }}>ระบบวิเคราะห์ข้อมูลสถานะนิสิต (ลาออก / พ้นสภาพ / ถูกคัดชื่อ)</div>
          </div>
        </Header>

        <Content style={{ padding: "16px 32px 32px 32px", background: "#f5f5f5" }}>
          
          {/* FILTER ZONE */}
          <div style={{ background: "#fff", padding: 24, borderRadius: 20, marginBottom: 24, boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
            <Input
              placeholder="พิมพ์คำค้นหา เช่น ชื่อสาขา หรือ สถานะ..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: "100%", padding: 14, borderRadius: 12, marginBottom: 20, fontSize: 16 }}
              allowClear
              prefix={<SearchOutlined style={{ color: "#bfbfbf" }} />}
            />

            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 20, marginBottom: 20 }}>
              <div>
                <div style={{ marginBottom: 8, fontWeight: 600 }}>ปีการศึกษาที่รับเข้า</div>
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
              <Button type="primary" size="large" icon={<SearchOutlined />} onClick={handleApplyFilters} style={{ height: 45, borderRadius: 10, padding: "0 32px", fontSize: 15, fontWeight: 500 }}>
                ค้นหาข้อมูลสถานะ
              </Button>
            </div>
          </div>

          {/* KPI ZONE */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
            <div style={{ background: "#fffbe6", borderRadius: 16, padding: 24, height: 160, boxShadow: "0 2px 8px rgba(0,0,0,0.04)", border: "1px solid #ffe58f" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div>
                  <h3 style={{ color: "#d46b08", margin: "0 0 12px 0" }}>นิสิตลาออก</h3>
                  <h1 style={{ color: "#d46b08", fontSize: 38, fontWeight: 700, margin: 0 }}>{totalDropout.toLocaleString()}</h1>
                  <p style={{ marginTop: 8, color: "#8c8c8c", fontSize: 13 }}>คน 

                  
                  </p>
                </div>
                <LogoutOutlined style={{ fontSize: 50, color: "#ffd591", marginTop: 10 }} />
              </div>
            </div>

            <div style={{ background: "#fff1f0", borderRadius: 16, padding: 24, height: 160, boxShadow: "0 2px 8px rgba(0,0,0,0.04)", border: "1px solid #ffa39e" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div>
                  <h3 style={{ color: "#cf1322", margin: "0 0 12px 0" }}>นิสิตพ้นสภาพ</h3>
                  <h1 style={{ color: "#cf1322", fontSize: 38, fontWeight: 700, margin: 0 }}>{totalDismissed.toLocaleString()}</h1>
                  <p style={{ marginTop: 8, color: "#8c8c8c", fontSize: 13 }}>คน</p>
                </div>
                <CloseCircleOutlined style={{ fontSize: 50, color: "#ffccc7", marginTop: 10 }} />
              </div>
            </div>

            <div style={{ background: "#f5f5f5", borderRadius: 16, padding: 24, height: 160, boxShadow: "0 2px 8px rgba(0,0,0,0.04)", border: "1px solid #d9d9d9" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div>
                  <h3 style={{ color: "#434343", margin: "0 0 12px 0" }}>นิสิตถูกคัดชื่อ</h3>
                  <h1 style={{ color: "#434343", fontSize: 38, fontWeight: 700, margin: 0 }}>{totalExpelled.toLocaleString()}</h1>
                  <p style={{ marginTop: 8, color: "#8c8c8c", fontSize: 13 }}>คน </p>
                </div>
                <UserDeleteOutlined style={{ fontSize: 50, color: "#d9d9d9", marginTop: 10 }} />
              </div>
            </div>
          </div>

          {/* 🍩 PIE/DONUT CHARTS ZONE (ต่อจาก KPI Zone) */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 20, marginTop: 24 }}>
            
            {/* กราฟที่ 1: สาเหตุการออก */}
            <div style={{ background: "white", borderRadius: 16, padding: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
              <h3 style={{ margin: "0 0 16px 0", fontSize: 18, fontWeight: 600, color: "#1f1f1f" }}>
                สาเหตุการออก
              </h3>
              <div style={{ height: 260 }}>
                {totalDropout + totalDismissed + totalExpelled === 0 ? (
                  <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#bfbfbf" }}>
                    ไม่มีข้อมูลการออก
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: "พ้นสภาพ", value: totalDismissed, color: "#0091ff" },
                          { name: "ถูกคัดชื่อออก", value: totalExpelled, color: "#61c8fe" },
                          { name: "ลาออก", value: totalDropout, color: "#003a8c" }
                        ].filter(item => item.value > 0)}
                        dataKey="value"
                        nameKey="name"
                        cx="40%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={90}
                        paddingAngle={2}
                        label={({ value, percent }) => `${value} (${(percent * 100).toFixed(2)}%)`}
                      >
                        {[
                          { name: "พ้นสภาพ", color: "#0091ff" },
                          { name: "ถูกคัดชื่อออก", color: "#61c8fe" },
                          { name: "ลาออก", color: "#003a8c" }
                        ].map((entry, index) => (
                          <Cell key={`cell-reason-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value} คน`, 'จำนวน']} />
                      <Legend 
                        layout="vertical" 
                        verticalAlign="middle" 
                        align="right"
                        iconType="circle"
                        wrapperStyle={{ fontSize: 13, paddingLeft: 10 }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* กราฟที่ 2: สถานะบัณฑิต/กลุ่มสถานะ */}
            <div style={{ background: "white", borderRadius: 16, padding: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
              <h3 style={{ margin: "0 0 16px 0", fontSize: 18, fontWeight: 600, color: "#1f1f1f" }}>
                สถานะบัณฑิต
              </h3>
              <div style={{ height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={(() => {
                        const totalOut = totalDropout + totalDismissed + totalExpelled;
                        // สามารถคำนวณหรือกำหนดนิสิตกำลังศึกษา/สำเร็จการศึกษาจาก Data ได้ตามต้องการ
                        const studying = 473; 
                        return [
                          { name: "กำลังศึกษา", value: studying, color: "#003a8c" },
                          { name: "ออกกลางคัน", value: totalOut, color: "#0091ff" },
                          { name: "สำเร็จการศึกษา", value: 0, color: "#bae7ff" }
                        ].filter(item => item.value > 0);
                      })()}
                      dataKey="value"
                      nameKey="name"
                      cx="40%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={90}
                      paddingAngle={2}
                      label={({ value, percent }) => `${value} (${(percent * 100).toFixed(2)}%)`}
                    >
                      {[
                        { color: "#003a8c" },
                        { color: "#0091ff" },
                        { color: "#bae7ff" }
                      ].map((entry, index) => (
                        <Cell key={`cell-status-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} คน`, 'จำนวน']} />
                    <Legend 
                      layout="vertical" 
                      verticalAlign="middle" 
                      align="right"
                      iconType="circle"
                      title="กลุ่มสถานะ"
                      wrapperStyle={{ fontSize: 13, paddingLeft: 10 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>

          {/* GRAPH CHART ZONE */}
          <div style={{ background: "white", borderRadius: 16, padding: 24, marginTop: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
            <div style={{ marginBottom: 20 }}>
              {/* 🔄 แสดงหัวข้อแบบ Dynamic มีปีการศึกษาเปลี่ยนไปตามฟิลเตอร์ด้านบน */}
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600, color: "#262626" }}>
                เปรียบเทียบจำนวนนิสิตกลุ่มพิเศษแยกตามสาขาวิชา ({chartTitleYear})
              </h2>
              <div style={{ color: "#8c8c8c", fontSize: 13, marginTop: 4 }}>จำแนกตามสัดส่วน ลาออก พ้นสภาพ และถูกคัดชื่อออก</div>
            </div>
            
            {/* ปรับความสูงกราฟอัตโนมัติตามปริมาณสาขา เพื่อไม่ให้แท่งกราฟเบียดซ้อนกัน */}
            <div style={{ height: chartData.length > 5 ? chartData.length * 55 : 350, minHeight: 350 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={chartData} 
                  layout="vertical"
                  margin={{ top: 10, right: 40, left: 10, bottom: 10 }} // เผื่อ right margin เล็กน้อยสำหรับตัวเลขปลายแท่ง
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f0f0f0" />
                  
                  {/* แกน X แสดงจำนวนคน - ห้ามทศนิยมและล็อกโดเมนแบบ Dynamic ตามสัดส่วนสูงสุดจริง */}
                  <XAxis 
                    type="number" 
                    stroke="#bfbfbf" 
                    style={{ fontSize: 12 }} 
                    allowDecimals={false}
                    domain={[0, maxChartValue]}
                  />
                  
                  {/* แกน Y แสดงชื่อสาขาวิชา */}
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    stroke="#8c8c8c" 
                    tickLine={false}
                    axisLine={{ stroke: '#f0f0f0' }}
                    style={{ fontSize: 12, fontWeight: 500 }}
                    width={180}
                  />
                  
                  <Tooltip 
                    cursor={{ fill: '#f5f5f5', opacity: 0.5 }}
                    contentStyle={{ 
                      borderRadius: 12, 
                      border: "none", 
                      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
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
                  
                  {/* กำหนดความหนาแท่งกราฟ แต่งขอบมนฝั่งขวา และเพิ่ม LabelList แสดงตัวเลข */}
                  <Bar dataKey="ลาออก" fill="#d46b08" barSize={12} radius={[0, 4, 4, 0]}>
                    <LabelList 
                      dataKey="ลาออก" 
                      position="right" 
                      fill="#d46b08" 
                      style={{ fontSize: 11, fontWeight: 600, paddingLeft: 5 }} 
                      formatter={(value) => value > 0 ? value : ""} // แสดงเฉพาะกรณีมากกว่า 0 คน
                    />
                  </Bar>
                  <Bar dataKey="พ้นสภาพ" fill="#cf1322" barSize={12} radius={[0, 4, 4, 0]}>
                    <LabelList 
                      dataKey="พ้นสภาพ" 
                      position="right" 
                      fill="#cf1322" 
                      style={{ fontSize: 11, fontWeight: 600, paddingLeft: 5 }} 
                      formatter={(value) => value > 0 ? value : ""}
                    />
                  </Bar>
                  <Bar dataKey="ถูกคัดชื่อ" fill="#595959" barSize={12} radius={[0, 4, 4, 0]}>
                    <LabelList 
                      dataKey="ถูกคัดชื่อ" 
                      position="right" 
                      fill="#595959" 
                      style={{ fontSize: 11, fontWeight: 600, paddingLeft: 5 }} 
                      formatter={(value) => value > 0 ? value : ""}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* TABLE ZONE */}
          <div style={{ background: "white", padding: 24, borderRadius: 16, marginTop: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
            <h2>รายละเอียดข้อมูลนิสิตจำแนกรายบุคคล/กลุ่มสถานะ</h2>
            
            <h3 style={{ marginTop: 20, color: "#d46b08" }}>📋 รายการนิสิตลาออก</h3>
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

            <h3 style={{ marginTop: 30, color: "#cf1322" }}>📋 รายการนิสิตพ้นสภาพ</h3>
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

            <h3 style={{ marginTop: 30, color: "#434343" }}>📋 รายการนิสิตถูกคัดชื่อ</h3>
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
