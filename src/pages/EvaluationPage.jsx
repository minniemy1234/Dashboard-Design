import { Layout, Table, Button, Progress, Rate, Card, Row, Col } from "antd";
import Sidebar from "../components/Sidebar"; // ใส่สองจุดถูกตำแหน่งเรียบร้อย
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
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from "recharts";
import { SearchOutlined, StarOutlined, AuditOutlined, DeploymentUnitOutlined } from "@ant-design/icons";

const { Header, Content } = Layout;

function EvaluationPage() {
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedMajor, setSelectedMajor] = useState("");
  const [appliedFilters, setAppliedFilters] = useState({ year: "", major: "" });
  const [dashboardData, setDashboardData] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem("dashboardData");
    if (stored) {
      setDashboardData(JSON.parse(stored));
    }
  }, []);

  // ดึงข้อมูลจำลองจากฐานข้อมูล (สามารถอัปโหลดไฟล์เข้ามาแมพทีหลังได้)
  const evalData = dashboardData?.["ผลการประเมินความพึงพอใจ"] || [];

  // ข้อมูลจำลองกรณีที่ยังไม่มีการอัปโหลดไฟล์ (Fallback Data)
  const defaultScores = {
    satisfaction: 4.35, // เต็ม 5
    tqfPassRate: 100,  // ร้อยละการดำเนินงานผ่านเกณฑ์มาตรฐาน TQF
    supportScore: 4.12 // คะแนนสิ่งสนับสนุนการเรียนรู้
  };

  const handleApplyFilters = () => {
    setAppliedFilters({ year: selectedYear, major: selectedMajor });
  };

  // 1. ข้อมูลจำลอง: ผลการดำเนินงานตามกรอบมาตรฐานคุณวุฒิ (TQF 5 ด้านหลัก)
  const tqfChartData = [
    { subject: "1. ด้านคุณธรรม จริยธรรม", คะแนน: 4.50, เกณฑ์ขั้นต่ำ: 3.51 },
    { subject: "2. ด้านความรู้", คะแนน: 4.25, เกณฑ์ขั้นต่ำ: 3.51 },
    { subject: "3. ด้านทักษะทางปัญญา", คะแนน: 4.15, เกณฑ์ขั้นต่ำ: 3.51 },
    { subject: "4. ความสัมพันธ์ระหว่างบุคคล", คะแนน: 4.40, เกณฑ์ขั้นต่ำ: 3.51 },
    { subject: "5. ทักษะการวิเคราะห์เชิงตัวเลข", คะแนน: 3.95, เกณฑ์ขั้นต่ำ: 3.51 }
  ];

  // 2. ข้อมูลจำลอง: ข้อเสนอแนะและสิ่งสนับสนุนการเรียนรู้เพื่อการปรับปรุงพัฒนา
  const suggestionColumns = [
    { title: "ปีการศึกษา", dataIndex: "year", width: 100 },
    { title: "สาขาวิชา", dataIndex: "major", width: 180 },
    { title: "หัวข้อประเมินสิ่งสนับสนุน", dataIndex: "topic", width: 220 },
    { title: "คะแนนเฉลี่ย", dataIndex: "score", width: 120, render: (score) => <strong>{score} / 5.00</strong> },
    { title: "ข้อเสนอแนะจากนิสิตเพื่อการปรับปรุงพัฒนา", dataIndex: "text" }
  ];

  const suggestionData = [
    { key: "1", year: "2566", major: "วิทยาการคอมพิวเตอร์", topic: "ห้องปฏิบัติการคอมพิวเตอร์และอุปกรณ์", score: "4.20", text: "ควรปรับปรุงสเปคคอมพิวเตอร์ในห้อง LAB 402 ให้รองรับการเขียนโปรแกรมขั้นสูงและการประมวลผล AI ได้รวดเร็วยิ่งขึ้น" },
    { key: "2", year: "2566", major: "เทคโนโลยีสารสนเทศ", topic: "ระบบเครือข่ายอินเทอร์เน็ตไร้สาย", score: "3.85", text: "สัญญาณ Wi-Fi บริเวณชั้น 3 ค่อนข้างอับสัญญาณในช่วงเวลาที่มีนิสิตเข้าใช้งานพร้อมกันจำนวนมาก" },
    { key: "3", year: "2567", major: "วิทยาการและเทคโนโลยีดิจิทัล", topic: "ทรัพยากรการเรียนรู้ / ห้องสมุด", score: "4.30", text: "อยากให้จัดหาหนังสือลิขสิทธิ์และ e-Book เกี่ยวกับ Cloud Computing และ Cyber Security เพิ่มเติม" },
  ];

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sidebar />
      <Layout>
        <Header style={{ background: "white", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 20px", height: "auto", lineHeight: "normal" }}>
          <div>
            <h2 style={{ margin: 0 }}>Course Evaluation & Student Satisfaction</h2>
            <div style={{ color: "#888", fontSize: 13 }}>ระบบวิเคราะห์ผลประเมินความพึงพอใจของนิสิตต่อหลักสูตรและสิ่งสนับสนุนการเรียนรู้</div>
          </div>
        </Header>

        <Content style={{ padding: "16px 32px 32px 32px", background: "#f5f5f5" }}>
          
          {/* FILTER ZONE */}
          <div style={{ background: "#fff", padding: 24, borderRadius: 20, marginBottom: 24, boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 20, marginBottom: 10 }}>
              <div>
                <div style={{ marginBottom: 8, fontWeight: 600 }}>ปีการศึกษา</div>
                <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} style={{ width: "100%", padding: 12, borderRadius: 10, border: "1px solid #d9d9d9" }}>
                  <option value="">ทั้งหมด (รวมทุกปี)</option>
                  <option value="2565">2565</option>
                  <option value="2566">2566</option>
                  <option value="2567">2567</option>
                </select>
              </div>
              <div>
                <div style={{ marginBottom: 8, fontWeight: 600 }}>สาขาวิชา</div>
                <select value={selectedMajor} onChange={(e) => setSelectedMajor(e.target.value)} style={{ width: "100%", padding: 12, borderRadius: 10, border: "1px solid #d9d9d9" }}>
                  <option value="">ทั้งหมด (รวมทุกสาขา)</option>
                  <option value="วิทยาการคอมพิวเตอร์">วิทยาการคอมพิวเตอร์</option>
                  <option value="เทคโนโลยีสารสนเทศ">เทคโนโลยีสารสนเทศ</option>
                  <option value="วิทยาการและเทคโนโลยีดิจิทัล">วิทยาการและเทคโนโลยีดิจิทัล</option>
                </select>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 15 }}>
              <Button type="primary" size="large" icon={<SearchOutlined />} onClick={handleApplyFilters} style={{ height: 45, borderRadius: 10, padding: "0 32px", fontSize: 15, fontWeight: 500 }}>
                ดึงข้อมูลผลประเมิน
              </Button>
            </div>
          </div>

          {/* KPI ZONE */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20, marginBottom: 24 }}>
            
            {/* กล่อง 1: ความพึงพอใจต่อหลักสูตร */}
            <div style={{ background: "#f6ffed", borderRadius: 16, padding: 24, border: "1px solid #b7eb8f", boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                <div>
                  <h4 style={{ color: "#389e0d", margin: "0 0 8px 0" }}>1. ความพึงพอใจต่อหลักสูตรภาพรวม</h4>
                  <h1 style={{ color: "#389e0d", fontSize: 36, fontWeight: 700, margin: 0 }}>{defaultScores.satisfaction} <span style={{ fontSize: 18, fontWeight: 400, color: "#8c8c8c" }}>/ 5.00</span></h1>
                  <div style={{ marginTop: 8 }}><Rate disabled defaultValue={4.5} allowHalf style={{ fontSize: 16 }} /></div>
                </div>
                <StarOutlined style={{ fontSize: 44, color: "#95de64" }} />
              </div>
            </div>

            {/* กล่อง 2: การดำเนินงานผ่านเกณฑ์ TQF */}
            <div style={{ background: "#e6f7ff", borderRadius: 16, padding: 24, border: "1px solid #91d5ff", boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                <div>
                  <h4 style={{ color: "#096dd9", margin: "0 0 8px 0" }}>2. ดำเนินงานหลักสูตรตามเกณฑ์ TQF</h4>
                  <h1 style={{ color: "#096dd9", fontSize: 36, fontWeight: 700, margin: 0 }}>{defaultScores.tqfPassRate}%</h1>
                  <div style={{ marginTop: 12, width: 150 }}><Progress percent={100} size="small" strokeColor="#096dd9" showInfo={false} /></div>
                </div>
                <AuditOutlined style={{ fontSize: 44, color: "#69c0ff" }} />
              </div>
            </div>

            {/* กล่อง 3: ประเมินสิ่งสนับสนุนการเรียนรู้ */}
            <div style={{ background: "#f0f5ff", borderRadius: 16, padding: 24, border: "1px solid #adc6ff", boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                <div>
                  <h4 style={{ color: "#1d39c4", margin: "0 0 8px 0" }}>3. คะแนนสิ่งสนับสนุนการเรียนรู้</h4>
                  <h1 style={{ color: "#1d39c4", fontSize: 36, fontWeight: 700, margin: 0 }}>{defaultScores.supportScore} <span style={{ fontSize: 18, fontWeight: 400, color: "#8c8c8c" }}>/ 5.00</span></h1>
                  <p style={{ margin: "6px 0 0 0", color: "#8c8c8c", fontSize: 12 }}>ระดับความพึงพอใจ: ดีมาก</p>
                </div>
               <DeploymentUnitOutlined style={{ fontSize: 40, color: "#85a5ff" }} />
              </div>
            </div>

          </div>

          {/* GRAPH ZONE - ผลการประเมินตามกรอบมาตรฐานคุณวุฒิแห่งชาติ */}
          <div style={{ background: "white", borderRadius: 16, padding: 24, marginBottom: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
            <h2>ผลการดำเนินงานและผลลัพธ์การเรียนรู้ตามกรอบมาตรฐานคุณวุฒิ (TQF)</h2>
            <p style={{ color: "#888", fontSize: 13, marginBottom: 20 }}>เปรียบเทียบผลการประเมินความพึงพอใจของนิสิตในแต่ละด้านเทียบกับเกณฑ์ขั้นต่ำของมหาวิทยาลัย</p>
            
            <Row gutter={24}  align="middle">
              <Col span={14}>
                <div style={{ height: 320 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={tqfChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="subject" style={{ fontSize: 11 }} />
                      <YAxis domain={[0, 5]} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="คะแนน" fill="#52c41a" radius={[4, 4, 0, 0]} barSize={30} />
                      <Bar dataKey="เกณฑ์ขั้นต่ำ" fill="#f5222d" radius={[4, 4, 0, 0]} barSize={10} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Col>
              
              {/* ตารางย่อยอธิบายรายละเอียดด้านข้างกราฟ */}
              <Col span={10}>
                <div style={{ background: "#fafafa", padding: 20, borderRadius: 12, border: "1px solid #f0f0f0" }}>
                  <h4 style={{ margin: "0 0 12px 0", color: "#333" }}>💡 สรุปผลสัมฤทธิ์ของหลักสูตร</h4>
                  <ul style={{ paddingLeft: 20, lineHeight: "24px", color: "#555" }}>
                    <li>นิสิตประเมินให้คะแนน <strong>"ด้านคุณธรรม จริยธรรม"</strong> สูงที่สุด (4.50 คะแนน)</li>
                    <li>ทุกด้านผ่านเกณฑ์ขั้นต่ำของกรอบมาตรฐาน (3.51 คะแนน) 100%</li>
                    <li>ส่วนที่ควรส่งเสริมเพิ่มเติมคือ <strong>"ทักษะการวิเคราะห์เชิงตัวเลขและการใช้เทคโนโลยี"</strong> เนื่องจากมีคะแนนประเมินใกล้เคียงเกณฑ์มากที่สุด</li>
                  </ul>
                </div>
              </Col>
            </Row>
          </div>

          {/* TABLE ZONE - สิ่งสนับสนุนการเรียนรู้และข้อเสนอแนะ */}
          <div style={{ background: "white", padding: 24, borderRadius: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
            <h2>สิ่งสนับสนุนการเรียนรู้ (ผลการประเมินและข้อเสนอแนะเพื่อการปรับปรุงพัฒนา)</h2>
            <p style={{ color: "#888", fontSize: 13, marginBottom: 20 }}>ความคิดเห็นเชิงคุณภาพและจุดที่นิสิตเสนอแนะเพื่อให้หลักสูตรและคณะนำไปใช้วางแผนพัฒนาพัฒนาต่อในอนาคต</p>
            
            <Table 
              columns={suggestionColumns} 
              dataSource={suggestionData} 
              pagination={false}
              bordered
            />
          </div>

        </Content>
      </Layout>
    </Layout>
  );
}

export default EvaluationPage;