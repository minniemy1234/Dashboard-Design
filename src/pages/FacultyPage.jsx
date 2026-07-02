import { Layout, Table, Button, Card, Row, Col, Statistic, Empty, Input } from "antd";
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
  UserOutlined, 
  BookOutlined, 
  SearchOutlined,
  SolutionOutlined,
  FilterOutlined
} from "@ant-design/icons";

const { Header, Content } = Layout;

function FacultyPage() {
  const [selectedMajor, setSelectedMajor] = useState("");
  const [searchText, setSearchText] = useState("");
  const [rawData, setRawData] = useState([]);
  const [tableMajorFilter, setTableMajorFilter] = useState("");

  // 1. โหลดข้อมูลอาจารย์จาก localStorage
  useEffect(() => {
    const stored = localStorage.getItem("dashboardData");
    if (stored) {
      const parsed = JSON.parse(stored);
      const facultyData = parsed["ข้อมูลอาจารย์"] || parsed["อาจารย์"] || parsed["อาจารย์สาขา"] || [];
      setRawData(facultyData);
    }
  }, []);

  const cleanString = (str) => {
    if (!str) return "";
    return String(str).replace(/\s+/g, '').replace(/['"]+/g, '').trim();
  };

  // 2. ดึงรายชื่อสาขาวิชาทั้งหมดทำ Dropdown คัดกรอง
  const majors = useMemo(() => {
    const list = rawData.map(item => String(item["สาขาวิชา"] || item["ชื่อสาขา"] || item["สาขา"] || "").trim());
    return [...new Set(list)].filter(Boolean).sort();
  }, [rawData]);

  // 3. กรองข้อมูลสำหรับภาพรวมด้านบน (KPI & กราฟ)
  const mainFilteredData = useMemo(() => {
    return rawData.filter(item => {
      const majorClean = cleanString(item["สาขาวิชา"] || item["ชื่อสาขา"] || item["สาขา"]);
      const teacherName = item["ชื่อ นามสกุล"] || item["ชื่อ-นามสกุล"] || item["ชื่ออาจารย์"] || item["ชื่อ"] || "";
      const nameClean = String(teacherName).toLowerCase();
      
      if (selectedMajor && majorClean !== cleanString(selectedMajor)) return false;
      if (searchText && !nameClean.includes(searchText.toLowerCase())) return false;
      
      return true;
    });
  }, [rawData, selectedMajor, searchText]);

  // 4. กรองข้อมูลสำหรับตารางด้านล่าง
  const tableData = useMemo(() => {
    return rawData.filter(item => {
      const majorClean = cleanString(item["สาขาวิชา"] || item["ชื่อสาขา"] || item["สาขา"]);
      const teacherName = item["ชื่อ นามสกุล"] || item["ชื่อ-นามสกุล"] || item["ชื่ออาจารย์"] || item["ชื่อ"] || "";
      const nameClean = String(teacherName).toLowerCase();

      const activeMajorFilter = tableMajorFilter || selectedMajor;
      if (activeMajorFilter && majorClean !== cleanString(activeMajorFilter)) return false;
      if (searchText && !nameClean.includes(searchText.toLowerCase())) return false;

      return true;
    });
  }, [rawData, selectedMajor, tableMajorFilter, searchText]);

  // 5. คำนวณสถิติภาพรวม (KPI)
  const stats = useMemo(() => {
    const total = mainFilteredData.length;
    let phdCount = 0;
    let masterCount = 0;
    let academicPositionCount = 0;

    mainFilteredData.forEach(item => {
      const degree = String(item["คุณวุฒิ"] || item["วุฒิการศึกษา"] || item["การศึกษา"] || "");
      const position = String(item["ตำแหน่งทางวิชาการ"] || item["ตำแหน่งวิชาการ"] || item["ตำแหน่ง"] || "");

      if (degree.includes("ปริญญาเอก") || degree.toLowerCase().includes("ph.d") || degree.includes("ดร.")) {
        phdCount++;
      } else if (degree.includes("ปริญญาโท") || degree.toLowerCase().includes("master")) {
        masterCount++;
      }

      if (position.includes("ผศ.") || position.includes("รศ.") || position.includes("ศ.") || position.includes("ศาสตราจารย์")) {
        academicPositionCount++;
      }
    });

    return { total, phdCount, masterCount, academicPositionCount };
  }, [mainFilteredData]);

  // 6. เตรียมข้อมูลสถิติตำแหน่งเพื่อไปวาดกราฟแท่ง
  const chartData = useMemo(() => {
    if (mainFilteredData.length === 0) return [];
    
    let prof = 0, assocProf = 0, asstProf = 0, lecturer = 0;
    
    mainFilteredData.forEach(item => {
      const pos = String(item["ตำแหน่งทางวิชาการ"] || item["ตำแหน่งวิชาการ"] || item["ตำแหน่ง"] || "");
      if (pos.includes("ศ.") || pos.includes("ศาสตราจารย์")) prof++;
      else if (pos.includes("รศ.")) assocProf++;
      else if (pos.includes("ผศ.")) asstProf++;
      else lecturer++;
    });

    return [
      { name: "ศาสตราจารย์ (ศ.)", จำนวน: prof },
      { name: "รองศาสตราจารย์ (รศ.)", จำนวน: assocProf },
      { name: "ผู้ช่วยศาสตราจารย์ (ผศ.)", จำนวน: asstProf },
      { name: "อาจารย์ / อื่นๆ", จำนวน: lecturer },
    ];
  }, [mainFilteredData]);

  // นิยามคอลัมน์ของตารางข้อมูลอาจารย์
  const columns = [
    { 
      title: "ลำดับ", 
      key: "index", 
      width: 70, 
      align: "center", 
      render: (text, record, index) => index + 1 
    },
    { 
      title: "ชื่อ นามสกุล", 
      key: "name",
      render: (text, record) => {
        return record["ชื่อ นามสกุล"] || 
               record["ชื่อ-นามสกุล"] || 
               record["ชื่ออาจารย์"] || 
               record["ชื่อ"] || 
               record["อาจารย์"] || "-";
      }
    },
    { 
      title: "ตำแหน่งทางวิชาการ", 
      key: "position",
      align: "center",
      render: (text, record) => {
        return record["ตำแหน่งทางวิชาการ"] || 
               record["ตำแหน่งวิชาการ"] || 
               record["ตำแหน่ง"] || "อาจารย์";
      }
    },
    { 
      title: "คุณวุฒิ / การศึกษาสูงสุด", 
      key: "degree",
      render: (text, record) => {
        return record["คุณวุฒิ"] || 
               record["วุฒิการศึกษา"] || 
               record["การศึกษา"] || "-";
      }
    },
    { 
      title: "สาขาวิชาที่สังกัด", 
      key: "major",
      render: (text, record) => {
        return record["สาขาวิชา"] || 
               record["สาขา"] || 
               record["ชื่อสาขา"] || "-";
      }
    },
  ];

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sidebar />
      <Layout>
        {/* HEADER ZONE */}
        <Header style={{ background: "white", padding: "16px 24px", height: "auto", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #f0f0f0" }}>
          <div>
            <h2 style={{ margin: "0 0 4px 0", fontSize: "20px", fontWeight: "600", color: "#1f1f1f" }}>ข้อมูลอาจารย์ประจำสาขาวิชา</h2>
            <div style={{ color: "#8c8c8c", fontSize: "13px" }}>บริหารจัดการข้อมูล คุณวุฒิการศึกษา และตำแหน่งทางวิชาการของบุคลากรสายวิชาการ</div>
          </div>
        </Header>

        <Content style={{ padding: "24px 32px", background: "#f5f5f5" }}>
          
          {/* FILTER & SEARCH SECTION */}
          <div style={{ background: "#fff", padding: 20, borderRadius: 16, marginBottom: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
            <Row gutter={[16, 16]} align="bottom">
              <Col xs={24} md={10}>
                <div style={{ marginBottom: 6, fontWeight: 600 }}>เลือกคณะ / สาขาวิชา (ภาพรวมหลัก)</div>
                <select 
                  value={selectedMajor} 
                  onChange={(e) => {
                    setSelectedMajor(e.target.value);
                    setTableMajorFilter("");
                  }} 
                  style={{ width: "100%", padding: "10px", borderRadius: 8, border: "1px solid #d9d9d9", outline: "none" }}
                >
                  <option value="">แสดงทุกสาขาวิชา</option>
                  {majors.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </Col>
              <Col xs={24} md={14}>
                <div style={{ marginBottom: 6, fontWeight: 600 }}>ค้นหาชื่ออาจารย์</div>
                <Input 
                  placeholder="พิมพ์ชื่อหรือนามสกุลที่ต้องการค้นหา..." 
                  prefix={<SearchOutlined style={{ color: "#bfbfbf" }} />} 
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  style={{ height: 42, borderRadius: 8 }}
                  allowClear
                />
              </Col>
            </Row>
          </div>

          {rawData.length === 0 ? (
            <Card style={{ borderRadius: 16, padding: "40px 0", textAlign: "center" }}>
              <Empty 
                description={
                  <span>
                    ยังไม่มีข้อมูลอาจารย์ในระบบคลังข้อมูล <br />
                    <span style={{ fontSize: 12, color: "#bfbfbf" }}>กรุณาอัปโหลดไฟล์ Excel ที่มีแผ่นงานอาจารย์ที่หน้าจัดการข้อมูลก่อน</span>
                  </span>
                } 
              />
            </Card>
          ) : (
            <>
              {/* 🌟 ZONE ปรับปรุงใหม่: เปลี่ยนกรอบ KPI การ์ดให้เป็นธีมเดียวกับ Dashboard หลัก */}
              <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col xs={24} sm={8} md={6}>
                  <div style={{ background: "#e6f7ff", padding: 20, borderRadius: 15, border: "1px solid #91d5ff", position: "relative" }}>
                    <div style={{ color: "#8c8c8c", fontSize: 12 }}>บุคลากรสายวิชาการ</div>
                    <h4 style={{ margin: "5px 0", fontSize: 14, color: "#0050b3" }}>อาจารย์ทั้งหมด</h4>
                    <h2 style={{ margin: 0, fontSize: 28, fontWeight: "bold", color: "#0050b3" }}>{stats.total} <span style={{ fontSize: 14, fontWeight: "normal", color: "#8c8c8c" }}>ท่าน</span></h2>
                    <UserOutlined style={{ fontSize: 28, color: "#1890ff", position: "absolute", right: 20, bottom: 20, opacity: 0.3 }} />
                  </div>
                </Col>
                <Col xs={24} sm={8} md={6}>
                  <div style={{ background: "#f6ffed", padding: 20, borderRadius: 15, border: "1px solid #b7eb8f", position: "relative" }}>
                    <div style={{ color: "#8c8c8c", fontSize: 12 }}>ระดับคุณวุฒิ</div>
                    <h4 style={{ margin: "5px 0", fontSize: 14, color: "#237804" }}>จบการศึกษาปริญญาเอก</h4>
                    <h2 style={{ margin: 0, fontSize: 28, fontWeight: "bold", color: "#237804" }}>{stats.phdCount} <span style={{ fontSize: 14, fontWeight: "normal", color: "#8c8c8c" }}>ท่าน</span></h2>
                    <BookOutlined style={{ fontSize: 28, color: "#52c41a", position: "absolute", right: 20, bottom: 20, opacity: 0.3 }} />
                  </div>
                </Col>
                <Col xs={24} sm={8} md={6}>
                  <div style={{ background: "#fffbe6", padding: 20, borderRadius: 15, border: "1px solid #ffe58f", position: "relative" }}>
                    <div style={{ color: "#8c8c8c", fontSize: 12 }}>ระดับคุณวุฒิ</div>
                    <h4 style={{ margin: "5px 0", fontSize: 14, color: "#ad6800" }}>จบการศึกษาปริญญาโท</h4>
                    <h2 style={{ margin: 0, fontSize: 28, fontWeight: "bold", color: "#ad6800" }}>{stats.masterCount} <span style={{ fontSize: 14, fontWeight: "normal", color: "#8c8c8c" }}>ท่าน</span></h2>
                    <BookOutlined style={{ fontSize: 28, color: "#faad14", position: "absolute", right: 20, bottom: 20, opacity: 0.3 }} />
                  </div>
                </Col>
                <Col xs={24} sm={24} md={6}>
                  <div style={{ background: "#f9f0ff", padding: 20, borderRadius: 15, border: "1px solid #d3adf7", position: "relative" }}>
                    <div style={{ color: "#8c8c8c", fontSize: 12 }}>ตำแหน่งวิชาการ</div>
                    <h4 style={{ margin: "5px 0", fontSize: 14, color: "#531dab" }}>ดำรงตำแหน่ง ผศ./รศ./ศ.</h4>
                    <h2 style={{ margin: 0, fontSize: 28, fontWeight: "bold", color: "#531dab" }}>{stats.academicPositionCount} <span style={{ fontSize: 14, fontWeight: "normal", color: "#8c8c8c" }}>ท่าน</span></h2>
                    <SolutionOutlined style={{ fontSize: 28, color: "#722ed1", position: "absolute", right: 20, bottom: 20, opacity: 0.3 }} />
                  </div>
                </Col>
              </Row>

              {/* GRAPH ZONE */}
              <div style={{ background: "white", padding: 24, borderRadius: 16, marginBottom: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
                <h3 style={{ marginBottom: 20 }}>แผนภูมิแสดงจำนวนอาจารย์แยกตามตำแหน่งทางวิชาการ</h3>
                <div style={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} />
                      <YAxis axisLine={false} tickLine={false} allowDecimals={false} />
                      <Tooltip cursor={{ fill: '#f5f5f5' }} />
                      <Legend />
                      <Bar dataKey="จำนวน" fill="#1890ff" radius={[6, 6, 0, 0]} barSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* TABLE ZONE */}
              <div style={{ background: "white", padding: 24, borderRadius: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
                  <h3 style={{ margin: 0 }}>รายชื่อและรายละเอียดคุณวุฒิอาจารย์</h3>
                  
                  <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#f9fafb", padding: "6px 14px", borderRadius: 10, border: "1px solid #e5e7eb" }}>
                    <FilterOutlined style={{ color: "#1890ff" }} />
                    <span style={{ fontSize: 13, fontWeight: 500, color: "#4b5563" }}>แยกเฉพาะสาขาในตาราง:</span>
                    <select 
                      value={tableMajorFilter} 
                      onChange={(e) => setTableMajorFilter(e.target.value)} 
                      style={{ background: "transparent", border: "none", fontSize: 13, fontWeight: 600, color: "#1890ff", cursor: "pointer", outline: "none" }}
                    >
                      <option value="">{selectedMajor ? `ตามตัวกรองหลัก (${selectedMajor})` : "แสดงทุกสาขาวิชา"}</option>
                      {majors.map((m) => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                </div>

                <Table 
                  columns={columns} 
                  dataSource={tableData} 
                  rowKey={(record, idx) => `faculty-${idx}`}
                  pagination={{ pageSize: 10, showTotal: (total) => `รวมทั้งหมด ${total} รายการ` }}
                  bordered
                  scroll={{ x: true }}
                />
              </div>
            </>
          )}

        </Content>
      </Layout>
    </Layout>
  );
}

export default FacultyPage;
