import { Layout, Card, Progress, Row, Col, Statistic, Empty } from "antd";
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
  LabelList
} from "recharts";
import { 
  FileTextOutlined, 
  DashboardOutlined, 
  PieChartOutlined, 
  GlobalOutlined, 
  StarOutlined, 
  TeamOutlined 
} from "@ant-design/icons";

const { Header, Content } = Layout;

function SummaryReportPage() {
  const [rawData, setRawData] = useState([]);
  const [uploadedChartRaw, setUploadedChartRaw] = useState([]);
  const [qaData, setQaData] = useState([]);
  const [gradEvalData, setGradEvalData] = useState([]);

  useEffect(() => {
    const stored = localStorage.getItem("dashboardData");
    if (stored) {
      const parsed = JSON.parse(stored);
      
      // 1. ดึงข้อมูลภาวะการมีงานทำ
      const targetKey = Object.keys(parsed).find(key => key.includes("งานทำ") || key.includes("Employment"));
      setRawData(targetKey ? parsed[targetKey] : []);

      // 2. ดึงข้อมูลกราฟแท่งหน่วยงาน
      if (parsed["employment_chart_data"] && parsed["employment_chart_data"].length > 0) {
        setUploadedChartRaw(parsed["employment_chart_data"]);
      }

      // 3. ดึงข้อมูลผลการประเมินคุณภาพหลักสูตร
      const qaKey = Object.keys(parsed).find(key => key.includes("หลักสูตร") || key.includes("ประเมินคุณภาพ"));
      setQaData(qaKey ? parsed[qaKey] : []);

      // 4. ดึงข้อมูลความพึงพอใจบัณฑิต
      const gradKey = Object.keys(parsed).find(key => key.includes("บัณฑิต") && key.includes("ประเมิน"));
      setGradEvalData(gradKey ? parsed[gradKey] : []);
    }
  }, []);

  // สกัดตัวเลข Summary รวมของคณะ (ใช้ข้อมูลปีล่าสุดในระบบเป็นหลัก)
  const statsSummary = useMemo(() => {
    if (rawData.length === 0) return { rate: "0.00", totalGrads: 0, working: 0 };
    
    // กรองเอาเฉพาะแถวสรุป "ทั้งหมด" ของคณะ
    const totalRows = rawData.filter(item => String(item["ชื่อสาขา"] || "").includes("ทั้งหมด"));
    const latestRow = totalRows.length > 0 ? totalRows[0] : rawData[0]; // สมมติเอาแถวแรกที่เจอ

    const cleanVal = (key) => {
      const foundKey = Object.keys(latestRow).find(k => k.replace(/\s+/g, '').includes(key));
      return foundKey ? Number(latestRow[foundKey] || 0) : 0;
    };

    const q2 = cleanVal("ผู้สำเร็จการศึกษา");
    const q3_direct = cleanVal("สถานภาพของบัณฑิตทำงานแล้วจำนวน");
    const q4 = cleanVal("ทำงานธุรกิจส่วนตัว/อิสระจำนวน");
    const q5 = cleanVal("มีงานทำเดิม");
    const q6 = cleanVal("ศึกษาต่อ");
    const q7 = cleanVal("บัณฑิตบวช");
    const q8 = cleanVal("บัณฑิตเกณฑ์ทหาร");

    // คำนวณตามสูตร สป.อว.
    const divisor = q2 - q5 - q6 - q7 - q8;
    const rate = divisor > 0 ? ((q3_direct) / divisor) * 100 : 0;

    return {
      rate: rate > 100 ? "100.00" : rate.toFixed(2),
      totalGrads: q2,
      working: q3_direct,
      year: latestRow["ปีการศึกษา"] || latestRow["ปี"] || "ล่าสุด"
    };
  }, [rawData]);

  // จัดการข้อมูลกราฟแท่งแนวนอน (สัดส่วนหน่วยงาน)
  const chartData = useMemo(() => {
    if (!uploadedChartRaw || uploadedChartRaw.length === 0) return [];
    const firstRow = uploadedChartRaw[0];
    const colorPalette = ["#0077b6", "#00b4d8", "#2a9d8f", "#e9c46a", "#f4a261", "#e76f51"];

    return Object.keys(firstRow).map((key) => ({
      name: key.replace("ทำงานใน", "").replace("จำนวน", ""), // ตัดคำให้สั้นกระชับขึ้นสำหรับหน้ารายงานสรุป
      value: Number(firstRow[key] || 0)
    })).sort((a, b) => b.value - a.value).map((item, index) => ({
      ...item,
      color: colorPalette[index % colorPalette.length]
    }));
  }, [uploadedChartRaw]);

  // คำนวณคะแนนประเมินหลักสูตรและบัณฑิตเฉลี่ยรวม
  const qaSummary = useMemo(() => {
    if (qaData.length === 0) return "0.00";
    const foundScores = qaData.map(item => Number(item["คะแนนเฉลี่ยรวม"] || item["คะแนนรวม"] || 0)).filter(Boolean);
    if (foundScores.length === 0) return "0.00";
    const avg = foundScores.reduce((a, b) => a + b, 0) / foundScores.length;
    return avg.toFixed(2);
  }, [qaData]);

  const gradSatisfaction = useMemo(() => {
    if (gradEvalData.length === 0) return "0.00";
    // กรองเอาเฉพาะหัวข้อ "รวม"
    const totalRows = gradEvalData.filter(item => String(item["หัวข้อ"] || "").includes("รวม"));
    const targetRows = totalRows.length > 0 ? totalRows : gradEvalData;
    const foundScores = targetRows.map(item => Number(item["ค่าเฉลี่ยความพึงพอใจ"] || 0)).filter(Boolean);
    if (foundScores.length === 0) return "0.00";
    return (foundScores.reduce((a, b) => a + b, 0) / foundScores.length).toFixed(2);
  }, [gradEvalData]);

  // สไตล์ส่วนกลาง
  const cardStyle = {
    borderRadius: 16,
    boxShadow: "0 4px 20px rgba(0,0,0,0.02)",
    border: "1px solid #eef2f6",
    background: "#ffffff"
  };

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sidebar />
      <Layout>
        {/* HEADER SECTION */}
        <Header style={{ background: "white", padding: "20px 32px", height: "auto", borderBottom: "1px solid #f0f0f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h2 style={{ margin: 0, fontSize: "22px", fontWeight: "700", color: "#1e293b" }}>
              <DashboardOutlined style={{ marginRight: 8, color: "#0077b6" }} /> Executive Summary Report
            </h2>
            <div style={{ color: "#64748b", fontSize: "13px", marginTop: 4 }}>
              รายงานสรุปผลการดำเนินงานและสถิติตัวบ่งชี้สำคัญของคณะประจำปีการศึกษา ({statsSummary.year})
            </div>
          </div>
        </Header>

        {/* MAIN CONTENT */}
        <Content style={{ padding: "32px", background: "#f8fafc" }}>
          
          {/* SECTION 1: EXECUTIVE KEY KPIS */}
          <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
            <Col xs={24} md={8}>
              <Card style={{ ...cardStyle, borderLeft: "6px solid #00b4d8", textAlign: "center", padding: "10px 0" }}>
                <h4 style={{ color: "#475569", margin: "0 0 12px 0", fontSize: "14px", fontWeight: 600 }}>อัตราการมีงานทำรวมของคณะ</h4>
                <Progress 
                  type="circle" 
                  percent={Number(statsSummary.rate)} 
                  strokeColor={{ '0%': '#00b4d8', '100%': '#0077b6' }}
                  size={120}
                  strokeWidth={9}
                  format={() => <span style={{ fontWeight: 700, fontSize: 20, color: "#0f172a" }}>{statsSummary.rate}%</span>}
                />
                <div style={{ color: "#94a3b8", fontSize: "11px", marginTop: 12 }}>คำนวณหักลบยอดศึกษาต่อ/เกณฑ์ทหารแล้ว</div>
              </Card>
            </Col>

            <Col xs={24} md={16}>
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <Card style={cardStyle} bodyStyle={{ padding: 20 }}>
                    <Statistic 
                      title={<span style={{ color: "#64748b", fontWeight: 500 }}>ผู้สำเร็จการศึกษาทั้งหมด</span>}
                      value={statsSummary.totalGrads}
                      valueStyle={{ color: "#0f172a", fontWeight: 700, fontSize: 28 }}
                      suffix={<span style={{ fontSize: 14, color: "#94a3b8", fontWeight: "normal" }}>คน</span>}
                      prefix={<TeamOutlined style={{ color: "#0077b6", marginRight: 8 }} />}
                    />
                  </Card>
                </Col>
                <Col span={12}>
                  <Card style={cardStyle} bodyStyle={{ padding: 20 }}>
                    <Statistic 
                      title={<span style={{ color: "#64748b", fontWeight: 500 }}>บัณฑิตที่ได้งานทำ & ประกอบอาชีพ</span>}
                      value={statsSummary.working}
                      valueStyle={{ color: "#10b981", fontWeight: 700, fontSize: 28 }}
                      suffix={<span style={{ fontSize: 14, color: "#94a3b8", fontWeight: "normal" }}>คน</span>}
                      prefix={<GlobalOutlined style={{ color: "#10b981", marginRight: 8 }} />}
                    />
                  </Card>
                </Col>
                <Col span={12}>
                  <Card style={cardStyle} bodyStyle={{ padding: 20 }}>
                    <Statistic 
                      title={<span style={{ color: "#64748b", fontWeight: 500 }}>คะแนนประเมินหลักสูตรเฉลี่ย (เต็ม 5)</span>}
                      value={qaSummary}
                      valueStyle={{ color: "#f59e0b", fontWeight: 700, fontSize: 28 }}
                      prefix={<FileTextOutlined style={{ color: "#f59e0b", marginRight: 8 }} />}
                    />
                  </Card>
                </Col>
                <Col span={12}>
                  <Card style={cardStyle} bodyStyle={{ padding: 20 }}>
                    <Statistic 
                      title={<span style={{ color: "#64748b", fontWeight: 500 }}>ความพึงพอใจต่อบัณฑิต (เต็ม 5)</span>}
                      value={gradSatisfaction}
                      valueStyle={{ color: "#6366f1", fontWeight: 700, fontSize: 28 }}
                      prefix={<StarOutlined style={{ color: "#6366f1", marginRight: 8 }} />}
                    />
                  </Card>
                </Col>
              </Row>
            </Col>
          </Row>

          {/* SECTION 2 & 3: CHART & INSIGHTS GRID */}
          <Row gutter={[24, 24]}>
            {/* กราฟแท่งแนวนอนสุดโมเดิร์นพร้อมตัวเลขปลายแท่ง */}
            <Col xs={24} lg={15}>
              <Card title={<span style={{ fontWeight: 600 }}><PieChartOutlined style={{ marginRight: 6, color: "#00b4d8" }} /> สรุปประเภทหน่วยงานที่บัณฑิตเข้าทำงานหลัก</span>} style={cardStyle}>
                <div style={{ height: 320 }}>
                  {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} layout="vertical" margin={{ top: 10, right: 60, left: 10, bottom: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                        <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} style={{ fontSize: 12, fontWeight: 500, fill: "#475569" }} width={90} />
                        <XAxis type="number" axisLine={false} tickLine={false} style={{ fontSize: 11 }} />
                        <Tooltip formatter={(value) => [`${value} คน`, 'จำนวนคน']} cursor={{ fill: '#f8fafc' }} />
                        <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
                          {/* เปิดตัวเลขต่อท้ายแท่งทันทีตามที่ปรับปรุงระบบไว้ */}
                          <LabelList 
                            dataKey="value" 
                            position="right" 
                            dx={8} 
                            style={{ fill: '#475569', fontSize: 11, fontWeight: 'bold' }} 
                            formatter={(v) => `${v} คน`}
                          />
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
                      <Empty description="ไม่มีข้อมูลแผนภูมิหน่วยงานในระบบ" />
                    </div>
                  )}
                </div>
              </Card>
            </Col>

            {/* ส่วนกล่องข้อความสรุปเชิงวิเคราะห์เชิงบริหาร */}
            <Col xs={24} lg={9}>
              <Card title={<span style={{ fontWeight: 600 }}><StarOutlined style={{ marginRight: 6, color: "#f59e0b" }} /> Executive Strategic Insights</span>} style={{ ...cardStyle, height: "100%" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div style={{ background: "#f0fdf4", padding: "14px 16px", borderRadius: 12, border: "1px solid #bbf7d0" }}>
                    <strong style={{ color: "#166534", display: "block", marginBottom: 4 }}>ด้านการผลิตบัณฑิตและการทำงาน</strong>
                    <span style={{ fontSize: 13, color: "#14532d" }}>
                      คณะมีอัตราการมีงานทำของบัณฑิตอยู่ที่ <b style={{ fontSize: 15 }}>{statsSummary.rate}%</b> ซึ่งสะท้อนถึงการตอบรับที่สูงจากตลาดแรงงาน โดยหน่วยงานประเภท<b>เอกชน</b>เป็นกลุ่มหลักที่รับเข้าทำงานมากที่สุด
                    </span>
                  </div>

                  <div style={{ background: "#fef3c7", padding: "14px 16px", borderRadius: 12, border: "1px solid #fde68a" }}>
                    <strong style={{ color: "#92400e", display: "block", marginBottom: 4 }}>ด้านการประกันคุณภาพหลักสูตร (QA)</strong>
                    <span style={{ fontSize: 13, color: "#78350f" }}>
                      ผลการดำเนินงานและควบคุมมาตรฐานหลักสูตรเฉลี่ยสะสมทุกภาควิชาได้คะแนน <b style={{ fontSize: 15 }}>{qaSummary}</b> คะแนน ซึ่งอยู่ในระดับมาตรฐานคุณภาพเป็นที่พึงพอใจตามเกณฑ์มหาวิทยาลัย
                    </span>
                  </div>

                  <div style={{ background: "#e0e7ff", padding: "14px 16px", borderRadius: 12, border: "1px solid #c7d2fe" }}>
                    <strong style={{ color: "#3730a3", display: "block", marginBottom: 4 }}>เสียงสะท้อนจากผู้ประกอบการ</strong>
                    <span style={{ fontSize: 13, color: "#1e1b4b" }}>
                      ผู้ประกอบการและหน่วยงานภายนอกประเมินความพึงพอใจต่อสมรรถนะของบัณฑิตเฉลี่ยรวมที่ระดับ <b style={{ fontSize: 15 }}>{gradSatisfaction}</b> คะแนน บ่งชี้ว่าบัณฑิตมีคุณลักษณะและทักษะที่ตรงความต้องการขององค์กร
                    </span>
                  </div>
                </div>
              </Card>
            </Col>
          </Row>

        </Content>
      </Layout>
    </Layout>
  );
}

export default SummaryReportPage;
