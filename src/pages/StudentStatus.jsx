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
  Legend
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

  // ดึงข้อมูลจากฐานข้อมูลจำลอง (localStorage)
  useEffect(() => {
    const stored = localStorage.getItem("dashboardData");
    if (stored) {
      setDashboardData(JSON.parse(stored));
    }
  }, []);

  // สมมติชื่อ Object ใน localStorage (สามารถปรับให้ตรงกับคีย์จริงในไฟล์ระบบคุณได้เลยครับ)
  const dropoutData = dashboardData?.["นิสิตลาออก"] || [];
  const dismissedData = dashboardData?.["นิสิตพ้นสภาพ"] || [];
  const expelledData = dashboardData?.["นิสิตถูกคัดชื่อ"] || [];

  // รวบรวมปีการศึกษาทั้งหมดเพื่อทำฟิลเตอร์
  const years = useMemo(() => {
    const allYears = [
      ...dropoutData.map(item => item["ปีการศึกษา"] || item["ปี"]),
      ...dismissedData.map(item => item["ปีการศึกษา"] || item["ปี"]),
      ...expelledData.map(item => item["ปีการศึกษา"] || item["ปี"])
    ];
    return [...new Set(allYears)].filter(Boolean).sort();
  }, [dropoutData, dismissedData, expelledData]);

  // รวบรวมสาขาทั้งหมดเพื่อทำฟิลเตอร์
  const majors = useMemo(() => {
    const allMajors = [
      ...dropoutData.map(item => item["ชื่อสาขา"] || item["สาขา"]),
      ...dismissedData.map(item => item["ชื่อสาขา"] || item["สาขา"]),
      ...expelledData.map(item => item["ชื่อสาขา"] || item["สาขา"])
    ];
    return [...new Set(allMajors)].filter(Boolean).sort();
  }, [dropoutData, dismissedData, expelledData]);

  const handleApplyFilters = () => {
    setAppliedFilters({
      year: selectedYear,
      major: selectedMajor,
      search: searchText
    });
  };

  // ฟังก์ชันช่วยกรองข้อมูลในแต่ละตาราง/กล่องข้อมูล
  const filterHelper = (data) => {
    return data.filter((item) => {
      const searchMatch = !appliedFilters.search || JSON.stringify(item).toLowerCase().includes(appliedFilters.search.toLowerCase());
      const yearMatch = !appliedFilters.year || String(item["ปีการศึกษา"] || item["ปี"]) === String(appliedFilters.year);
      const majorMatch = !appliedFilters.major || (item["ชื่อสาขา"] || item["สาขา"]) === appliedFilters.major;
      return searchMatch && yearMatch && majorMatch;
    });
  };

  const filteredDropout = useMemo(() => filterHelper(dropoutData), [dropoutData, appliedFilters]);
  const filteredDismissed = useMemo(() => filterHelper(dismissedData), [dismissedData, appliedFilters]);
  const filteredExpelled = useMemo(() => filterHelper(expelledData), [expelledData, appliedFilters]);

  // คำนวณยอดรวมยอด KPI ผลลัพธ์
  const totalDropout = filteredDropout.reduce((sum, item) => sum + Number(item["จำนวน"] || 1), 0);
  const totalDismissed = filteredDismissed.reduce((sum, item) => sum + Number(item["จำนวน"] || 1), 0);
  const totalExpelled = filteredExpelled.reduce((sum, item) => sum + Number(item["จำนวน"] || 1), 0);

  // เตรียมข้อมูลทำกราฟแท่งเปรียบเทียบสถิติแยกตามสาขา
  const chartData = useMemo(() => {
    const map = {};
    filteredDropout.forEach(item => {
      const m = item["ชื่อสาขา"] || item["สาขา"] || "-";
      if (!map[m]) map[m] = { name: m, ลาออก: 0, พ้นสภาพ: 0, ถูกคัดชื่อ: 0 };
      map[m].ลาออก += Number(item["จำนวน"] || 1);
    });
    filteredDismissed.forEach(item => {
      const m = item["ชื่อสาขา"] || item["สาขา"] || "-";
      if (!map[m]) map[m] = { name: m, ลาออก: 0, พ้นสภาพ: 0, ถูกคัดชื่อ: 0 };
      map[m].พ้นสภาพ += Number(item["จำนวน"] || 1);
    });
    filteredExpelled.forEach(item => {
      const m = item["ชื่อสาขา"] || item["สาขา"] || "-";
      if (!map[m]) map[m] = { name: m, ลาออก: 0, พ้นสภาพ: 0, ถูกคัดชื่อ: 0 };
      map[m].ถูกคัดชื่อ += Number(item["จำนวน"] || 1);
    });
    return Object.values(map);
  }, [filteredDropout, filteredDismissed, filteredExpelled]);

  const columns = [
    { title: "ปีการศึกษา", dataIndex: "ปีการศึกษา", key: "year" },
    { title: "สาขาวิชา", dataIndex: "ชื่อสาขา", key: "major", render: (text, record) => text || record["สาขา"] },
    { title: "เหตุผล/รายละเอียด", dataIndex: "หมายเหตุ", key: "note", render: (text) => text || "-" },
    { title: "จำนวน (คน)", dataIndex: "จำนวน", key: "count", render: (text) => Number(text || 1).toLocaleString() },
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
            <input
              type="text"
              placeholder="พิมพ์คำค้นหา..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: "100%", padding: 14, borderRadius: 12, border: "1px solid #d9d9d9", marginBottom: 20, fontSize: 16 }}
            />

            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 20, marginBottom: 20 }}>
              <div>
                <div style={{ marginBottom: 8, fontWeight: 600 }}>ปีการศึกษา</div>
                <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} style={{ width: "100%", padding: 12, borderRadius: 10, border: "1px solid #d9d9d9" }}>
                  <option value="">ทั้งหมด (ทุกปีการศึกษา)</option>
                  {years.map((year) => <option key={year} value={year}>{year}</option>)}
                </select>
              </div>

              <div>
                <div style={{ marginBottom: 8, fontWeight: 600 }}>สาขาวิชา</div>
                <select value={selectedMajor} onChange={(e) => setSelectedMajor(e.target.value)} style={{ width: "100%", padding: 12, borderRadius: 10, border: "1px solid #d9d9d9" }}>
                  <option value="">ทั้งหมด (ทุกสาขาวิชา)</option>
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

          {/* KPI ZONE - เปลี่ยนสีตามความเหมาะสมเตือนสถานะความเสี่ยง */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
            
            {/* KPI 1: นิสิตลาออก (สีเหลืองส้ม - สัญญาณเตือนให้เฝ้าระวังความพึงพอใจ) */}
            <div style={{ background: "#fffbe6", borderRadius: 16, padding: 24, height: 160, boxShadow: "0 2px 8px rgba(0,0,0,0.04)", border: "1px solid #ffe58f" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div>
                  <h3 style={{ color: "#d46b08", margin: "0 0 12px 0" }}>นิสิตลาออก</h3>
                  <h1 style={{ color: "#d46b08", fontSize: 38, fontWeight: 700, margin: 0 }}>{totalDropout.toLocaleString()}</h1>
                  <p style={{ marginTop: 8, color: "#8c8c8c", fontSize: 13 }}>คน (สะสม)</p>
                </div>
                <LogoutOutlined style={{ fontSize: 50, color: "#ffd591", marginTop: 10 }} />
              </div>
            </div>

            {/* KPI 2: นิสิตพ้นสภาพ (สีแดงเข้ม - สถานะวิกฤตทางวิชาการ/เวลาเรียน) */}
            <div style={{ background: "#fff1f0", borderRadius: 16, padding: 24, height: 160, boxShadow: "0 2px 8px rgba(0,0,0,0.04)", border: "1px solid #ffa39e" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div>
                  <h3 style={{ color: "#cf1322", margin: "0 0 12px 0" }}>นิสิตพ้นสภาพ</h3>
                  <h1 style={{ color: "#cf1322", fontSize: 38, fontWeight: 700, margin: 0 }}>{totalDismissed.toLocaleString()}</h1>
                  <p style={{ marginTop: 8, color: "#8c8c8c", fontSize: 13 }}>คน (สะสม)</p>
                </div>
                <CloseCircleOutlined style={{ fontSize: 50, color: "#ffccc7", marginTop: 10 }} />
              </div>
            </div>

            {/* KPI 3: นิสิตถูกคัดชื่อ (สีเทาดำ - ยุติสถานภาพจากระบบถาวร) */}
            <div style={{ background: "#f5f5f5", borderRadius: 16, padding: 24, height: 160, boxShadow: "0 2px 8px rgba(0,0,0,0.04)", border: "1px solid #d9d9d9" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div>
                  <h3 style={{ color: "#434343", margin: "0 0 12px 0" }}>นิสิตถูกคัดชื่อ</h3>
                  <h1 style={{ color: "#434343", fontSize: 38, fontWeight: 700, margin: 0 }}>{totalExpelled.toLocaleString()}</h1>
                  <p style={{ marginTop: 8, color: "#8c8c8c", fontSize: 13 }}>คน (สะสม)</p>
                </div>
                <UserDeleteOutlined style={{ fontSize: 50, color: "#d9d9d9", marginTop: 10 }} />
              </div>
            </div>

          </div>

          {/* GRAPH CHART ZONE */}
          <div style={{ background: "white", borderRadius: 16, padding: 24, marginTop: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
            <h2 style={{ marginBottom: 20 }}>เปรียบเทียบจำนวนนิสิตกลุ่มพิเศษแยกตามสาขาวิชา</h2>
            <div style={{ height: 350 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" style={{ fontSize: 11 }} />
                  <YAxis />
                  <Tooltip contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }} />
                  <Legend />
                  <Bar dataKey="ลาออก" fill="#d46b08" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="พ้นสภาพ" fill="#cf1322" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="ถูกคัดชื่อ" fill="#595959" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* TABLE ZONE */}
          <div style={{ background: "white", padding: 24, borderRadius: 16, marginTop: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
            <h2>รายละเอียดข้อมูลนิสิตจำแนกรายบุคคล/กลุ่มสถานะ</h2>
            
            <h3 style={{ marginTop: 20, color: "#d46b08" }}>📋 รายการนิสิตลาออก</h3>
            <Table columns={columns} dataSource={filteredDropout} rowKey={(record, i) => `drop-${i}`} pagination={{ pageSize: 5 }} size="small" />

            <h3 style={{ marginTop: 30, color: "#cf1322" }}>📋 รายการนิสิตพ้นสภาพ</h3>
            <Table columns={columns} dataSource={filteredDismissed} rowKey={(record, i) => `dism-${i}`} pagination={{ pageSize: 5 }} size="small" />

            <h3 style={{ marginTop: 30, color: "#434343" }}>📋 รายการนิสิตถูกคัดชื่อ</h3>
            <Table columns={columns} dataSource={filteredExpelled} rowKey={(record, i) => `expel-${i}`} pagination={{ pageSize: 5 }} size="small" />
          </div>

        </Content>
      </Layout>
    </Layout>
  );
}

export default StudentStatus;
