import StatCard from "../components/StatCard";
import {
  Layout,
  Table,
} from "antd";
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
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

import {
  TeamOutlined,
  UserOutlined,
  TrophyOutlined
} from "@ant-design/icons";

const { Header, Content } = Layout;

function Dashboard() {
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedMajor, setSelectedMajor] = useState("");
  const [selectedTerm, setSelectedTerm] = useState(""); 
  const [searchText, setSearchText] = useState("");
  const [dashboardData, setDashboardData] = useState(null);

  // ดึงข้อมูลใหม่จาก localStorage ทุกครั้งที่เปิดหน้าหรือกลับมาหน้านี้
  useEffect(() => {
    const stored = localStorage.getItem("dashboardData");
    if (stored) {
      setDashboardData(JSON.parse(stored));
    }
  }, []);

  const tcas = dashboardData?.["TCAS64-67"] || [];
  const retain = dashboardData?.["จำนวนนิสิตคงอยู่"] || [];

  // ดึงรายการปีการศึกษาจากทั้งข้อมูล TCAS และข้อมูลนิสิตคงอยู่ เพื่อให้ครอบคลุมทุกไฟล์
  const years = useMemo(() => {
    const tcasYears = tcas.map((item) => item["ปีการศึกษา"] || item["ปี"]);
    const retainYears = retain.map((item) => item["ปีที่สำรวจ"] || item["ปีการศึกษาที่รับเข้า"]);
    return [...new Set([...tcasYears, ...retainYears])].filter(Boolean).sort();
  }, [tcas, retain]);

  // ดึงรายชื่อสาขาจากทั้งไฟล์ TCAS และไฟล์นิสิตคงอยู่รวมกัน
  const majors = useMemo(() => {
    const tcasMajors = tcas.map((item) => item["ชื่อสาขา"]);
    const retainMajors = retain.map((item) => item["ชื่อสาขา"]);
    return [...new Set([...tcasMajors, ...retainMajors])].filter(Boolean).sort();
  }, [tcas, retain]);

  // ดึงรายการภาคการศึกษาจากทั้งข้อมูล TCAS และข้อมูลนิสิตคงอยู่
  const terms = useMemo(() => {
    const tcasTerms = tcas.map((item) => item["ภาคการศึกษา"]);
    const retainTerms = retain.map((item) => item["ภาคเรียน"]);
    return [...new Set([...tcasTerms, ...retainTerms])].filter(Boolean);
  }, [tcas, retain]);

  const filteredTCAS = tcas.filter(
    (item) => {
      const searchMatch =
        !searchText ||
        JSON.stringify(item)
          .toLowerCase()
          .includes(searchText.toLowerCase());

      const yearMatch =
        !selectedYear ||
        String(item["ปีการศึกษา"] || item["ปี"]) === String(selectedYear);

      const termMatch =
        !selectedTerm ||
        String(item["ภาคการศึกษา"]) === String(selectedTerm);

      const majorMatch =
        !selectedMajor ||
        item["ชื่อสาขา"] === selectedMajor;

      return searchMatch && yearMatch && termMatch && majorMatch;
    }
  );

  const groupedData = {};
  filteredTCAS.forEach((item) => {
    const major = item["ชื่อสาขา"] || "-";
    if (!groupedData[major]) {
      groupedData[major] = {
        name: major,
        applicants: 0,
        admitted: 0,
      };
    }
    groupedData[major].applicants += Number(item["จำนวนผู้สมัคร"] || 0);
    groupedData[major].admitted += Number(item["จำนวนรับ"] || 0);
  });

  const chartData = Object.values(groupedData);

  let admitted = 0;
  let enrolled = 0;
  let retained = 0;
  let lecturers = 0;
  let graduates = 0;
  let totalStudents = 0;

  if (dashboardData) {
    const register = dashboardData["จำนวนนิสิตลงทะเบียน"] || [];
    const teacher = dashboardData["อาจารย์สาขา"] || [];
    const employment = dashboardData["ภาวะการมีงานทำ"] || [];

    const filteredRegister = register.filter(
      (item) =>
        !selectedYear ||
        String(item["ปีการศึกษา"]) === String(selectedYear)
    );

    totalStudents = filteredRegister.reduce(
      (sum, item) =>
        sum +
        Number(item["ชั้นปีที่ 1"] || 0) +
        Number(item["ชั้นปีที่ 2"] || 0) +
        Number(item["ชั้นปีที่ 3"] || 0) +
        Number(item["ชั้นปีที่ 4"] || 0) +
        Number(item["ชั้นปีที่ 5"] || 0) +
        Number(item["ชั้นปีที่ 6"] || 0),
      0
    );

    graduates = employment.reduce(
      (sum, item) => sum + Number(item["ผู้สำเร็จการศึกษา"] || 0),
      0
    );

    // คำนวณข้อมูล "นิสิตคงอยู่" จากไฟล์โครงสร้างชุดใหม่ (.csv)
    retained = retain.reduce((sum, item) => {
      const currentYear = selectedYear || (years.length > 0 ? years[years.length - 1] : "");
      
      const yearMatch = String(item["ปีที่สำรวจ"]) === String(currentYear);
      const termMatch = !selectedTerm || String(item["ภาคเรียน"]) === String(selectedTerm);
      const majorMatch = !selectedMajor || String(item["ชื่อสาขา"]) === String(selectedMajor);

      if (yearMatch && termMatch && majorMatch) {
        return sum + Number(item["จำนวน"] || 0);
      }
      return sum;
    }, 0); 
    
    lecturers = teacher.length;
    admitted = filteredTCAS.reduce((sum, item) => sum + Number(item["จำนวนรับ"] || 0), 0);
    enrolled = filteredTCAS.reduce((sum, item) => sum + Number(item["จำนวนผู้สมัคร"] || 0), 0);
  }

  const columns = [
    { title: "ปีการศึกษา", dataIndex: "ปีการศึกษา" },
    { title: "ภาคการศึกษา", dataIndex: "ภาคการศึกษา" },
    { title: "สาขา", dataIndex: "ชื่อสาขา" },
    { title: "ผู้สมัคร", dataIndex: "จำนวนผู้สมัคร" },
    { title: "จำนวนรับ", dataIndex: "จำนวนรับ" },
  ];

  const pieData = [
    { name: "จำนวนรับ", value: admitted },
    { name: "ผู้สมัคร", value: enrolled },
  ];

  
  const topMajors = [...chartData]
    .sort((a, b) => b.applicants - a.applicants)
    .slice(0, 5);

  const admissionRate = enrolled > 0 ? ((admitted / enrolled) * 100).toFixed(2) : 0;
  const retentionRate = totalStudents > 0 ? ((retained / totalStudents) * 100).toFixed(2) : 0;
  const graduationRate = totalStudents > 0 ? ((graduates / totalStudents) * 100).toFixed(2) : 0;

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sidebar />
      <Layout>
        <Header
          style={{
            background: "white",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "20px 20px",
            height: "auto",
            lineHeight: "normal",
          }}
        >
          <div style={{ paddingTop: 10 }}>
            <h2 style={{ margin: 0 }}>University Dashboard</h2>
            <div style={{ color: "#888", fontSize: 13 }}>ระบบวิเคราะห์ข้อมูลมหาวิทยาลัย</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div>Admin</div>
            <div style={{ color: "#888", fontSize: 12 }}>{new Date().toLocaleDateString()}</div>
          </div>
        </Header>

        <Content style={{ padding: "16px 32px 32px 32px", marginTop: 0, background: "#f5f5f5" }}>
          {/* FILTER */}
          <div
            style={{
              background: "#fff",
              padding: 24,
              borderRadius: 20,
              marginBottom: 24,
              boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
            }}
          >
            <input
              type="text"
              placeholder="ค้นหาภาคการศึกษา สาขา หรือข้อมูล..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{
                width: "100%",
                padding: 14,
                borderRadius: 12,
                border: "1px solid #d9d9d9",
                marginBottom: 24,
                fontSize: 16,
              }}
            />

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
              <div>
                <div style={{ marginBottom: 8, fontWeight: 600 }}>ปีการศึกษา</div>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  style={{ width: "100%", padding: 12, borderRadius: 10, border: "1px solid #d9d9d9" }}
                >
                  <option value="">ทั้งหมด</option>
                  {years.map((year) => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>

              <div>
                <div style={{ marginBottom: 8, fontWeight: 600 }}>ภาคการศึกษา</div>
                <select
                  value={selectedTerm}
                  onChange={(e) => setSelectedTerm(e.target.value)}
                  style={{ width: "100%", padding: 12, borderRadius: 10, border: "1px solid #d9d9d9" }}
                >
                  <option value="">ทั้งหมด</option>
                  {terms.map((term) => (
                    <option key={term} value={term}>{term}</option>
                  ))}
                </select>
              </div>

              <div>
                <div style={{ marginBottom: 8, fontWeight: 600 }}>สาขา</div>
                <select
                  value={selectedMajor}
                  onChange={(e) => setSelectedMajor(e.target.value)}
                  style={{ width: "100%", padding: 12, borderRadius: 10, border: "1px solid #d9d9d9" }}
                >
                  <option value="">ทั้งหมด</option>
                  {majors.map((major) => (
                    <option key={major} value={major}>{major}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* KPI */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(250px,1fr))", gap: 20, marginTop: 20 }}>
            <div style={{ background: "#f5f9ff", borderRadius: 16, padding: 24, height: 170, boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div>
                  <h3 style={{ color: "#2f7ce9", marginBottom: 12 }}>นิสิตรับเข้า (ปี {selectedYear || "ทั้งหมด"})</h3>
                  <h1 style={{ color: "#2f7ce9", fontSize: 36, fontWeight: 700, margin: 0 }}>{admitted.toLocaleString()}</h1>
                  <p style={{ marginTop: 10 }}>คน</p>
                </div>
                <TeamOutlined style={{ fontSize: 56, color: "#2f7ce9", marginTop: 10 }} />
              </div>
            </div>

            <div style={{ background: "#f4fff7", borderRadius: 16, padding: 24, height: 170, boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div>
                  <h3 style={{ color: "#16a34a", marginBottom: 12 }}>นิสิตคงอยู่</h3>
                  <h1 style={{ color: "#16a34a", fontSize: 36, fontWeight: 700, margin: 0 }}>{retained.toLocaleString()}</h1>
                  <p style={{ marginTop: 10 }}>คน</p>
                </div>
                <TeamOutlined style={{ fontSize: 56, color: "#16a34a", marginTop: 10 }} />
              </div>
            </div>

            <div style={{ background: "#faf5ff", borderRadius: 16, padding: 24, height: 170, boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div>
                  <h3 style={{ color: "#7c3aed", marginBottom: 12 }}>นิสิตลงทะเบียน</h3>
                  <h1 style={{ color: "#7c3aed", fontSize: 36, fontWeight: 700, margin: 0 }}>{totalStudents.toLocaleString()}</h1>
                  <p style={{ marginTop: 10 }}>คน</p>
                </div>
                <TrophyOutlined style={{ fontSize: 56, color: "#7c3aed", marginTop: 10 }} />
              </div>
            </div>

            <div style={{ background: "#fff8f1", borderRadius: 16, padding: 24, height: 170, boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div>
                  <h3 style={{ color: "#f97316", marginBottom: 12 }}>อาจารย์ทั้งหมด</h3>
                  <h1 style={{ color: "#f97316", fontSize: 36, fontWeight: 700, margin: 0 }}>{lecturers.toLocaleString()}</h1>
                  <p style={{ marginTop: 10 }}>คน</p>
                </div>
                <UserOutlined style={{ fontSize: 56, color: "#f97316", marginTop: 10 }} />
              </div>
            </div>
          </div>

          {/* 🔥 ส่วนที่ปรับย้ายใหม่: Top 5 สาขายอดนิยม ถูกย้ายขึ้นมาอยู่ตรงนี้ พร้อมปรับกรอบรองรับกราฟแนวนอน */}
          <div
            style={{
              background: "white",
              borderRadius: 16,
              padding: 24,
              marginTop: 24,
              boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
            }}
          >
            <h2 style={{ marginBottom: 20 }}>สาขาทั้งหมด</h2>
            <div style={{ display: "grid", gridTemplateColumns: "100%", gap: 24, alignItems: "start" }}>
              {/* เปลี่ยนเป็นกราฟแท่งแนวนอน (Horizontal Bar Chart) เพื่อความสวยงามและรองรับตัวอักษรยาวๆ */}
              <div style={{ minHeight: 320 }}>
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={topMajors} layout="vertical" margin={{ left: 50, right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                    <XAxis type="number" axisLine={false} tickLine={false} />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={150} style={{ fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        borderRadius: 12,
                        border: "none",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                      }}
                    />
                    <Bar dataKey="applicants" name="จำนวนผู้สมัคร" fill="#3b82f6" radius={[0, 8, 8, 0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* รายการแสดงผล Top 5 แบบข้อความเคียงคู่กับกราฟ */}
              <div style={{ borderLeft: "1px solid #f0f0f0", paddingLeft: 24 }}>
                {topMajors.map((item, index) => (
                  <div
                    key={item.name}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "14px 0",
                      borderBottom: index !== topMajors.length - 1 ? "1px solid #f5f5f5" : "none",
                    }}
                  >
                    <span style={{ fontSize: 14, color: "#555" }}>{index + 1}. {item.name}</span>
                    <strong style={{ color: "#3b82f6" }}>{item.applicants.toLocaleString()} คน</strong>
                  </div>
                ))}
                {topMajors.length === 0 && (
                  <div style={{ color: "#888", textAlign: "center", paddingTop: 40 }}>ไม่มีข้อมูลสาขาที่จะแสดงผล</div>
                )}
              </div>
            </div>
          </div>

          {/* สรุปภาพรวมมหาวิทยาลัย */}
          <div
            style={{
              background: "white",
              borderRadius: 16,
              padding: 24,
              marginTop: 24,
              boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
            }}
          >
            <h2 style={{ marginBottom: 20 }}>สรุปภาพรวมมหาวิทยาลัย</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 20 }}>
              <div>
                <h4 style={{ color: "#22c55e" }}>อัตราการคงอยู่</h4>
                <h2>{retentionRate}%</h2>
              </div>
              <div>
                <h4 style={{ color: "#3b82f6" }}>อัตราสำเร็จการศึกษา</h4>
                <h2>{graduationRate}%</h2>
              </div>
              <div>
                <h4 style={{ color: "#f59e0b" }}>นิสิตสำเร็จการศึกษา</h4>
                <h2>{graduates.toLocaleString()}</h2>
              </div>
              <div>
                <h4 style={{ color: "#ef4444" }}>อัตราการรับเข้า</h4>
                <h2>{admissionRate}%</h2>
              </div>
            </div>
          </div>

          <div
            style={{
              background: "white",
              borderRadius: 16,
              padding: 24,
              marginTop: 20,
            }}
          >
            <h2>สรุปภาพรวม</h2>
            <ul>
              <li>ผู้สมัครทั้งหมด {enrolled.toLocaleString()} คน</li>
              <li>รับเข้า {admitted.toLocaleString()} คน</li>
              <li>อัตราการรับเข้า {admissionRate}%</li>
              <li>จำนวนอาจารย์ {lecturers} คน</li>
            </ul>
          </div>

          {/* สัดส่วนและแนวโน้มภาพรวมอื่นๆ */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "40% 60%",
              gap: 20,
              marginTop: 24,
            }}
          >
            {/* PIE */}
            <div style={{ background: "white", padding: 24, borderRadius: 16 }}>
              <h2>สัดส่วนผู้สมัครและจำนวนรับ</h2>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={70}
                    outerRadius={110}
                    label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                  >
                    <Cell fill="#2f7ce9" />
                    <Cell fill="#80ef48" />
                  </Pie>
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* BAR - ภาพรวมแนวโน้มทั้งหมด */}
            <div style={{ background: "white", padding: 24, borderRadius: 16 }}>
              <h2>แนวโน้มการรับนิสิตภาพรวมตามสาขา (TCAS)</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="2 2" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} style={{ fontSize: 10 }} />
                  <YAxis axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 12,
                      border: "none",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                    }}
                  />
                  <Bar dataKey="admitted" name="จำนวนรับ" fill="#10b981" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div style={{ background: "white", padding: 24, borderRadius: 16, marginTop: 24 }}>
            <h2>รายละเอียดข้อมูล TCAS</h2>
            <Table
              columns={columns}
              dataSource={filteredTCAS}
              rowKey={(record, index) => index}
              pagination={{ pageSize: 10 }}
              scroll={{ x: true }}
            />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
}

export default Dashboard;