// ภาษาที่ใช้ เป็น HTML + JavaScript (JSX ใน React)
import { Layout, Table, Input, Card, Row, Col, Empty, Alert, Statistic } from "antd";
import Sidebar from "../components/Sidebar";
import { useMemo, useState, useEffect } from "react";
import { 
  TeamOutlined, 
  UserAddOutlined, 
  TrophyOutlined, 
  SearchOutlined,
  FilterOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined,
  DashboardOutlined
} from "@ant-design/icons";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Sector } from "recharts";

const { Header, Content } = Layout;

const renderActiveShape = (props) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius - 2}
        outerRadius={outerRadius + 6}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        style={{ filter: "drop-shadow(0px 4px 8px rgba(0,0,0,0.15))", cursor: "pointer" }}
      />
    </g>
  );
};

function StudentPage() {
  const [selectedMajor, setSelectedMajor] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [searchText, setSearchText] = useState("");
  const [dashboardData, setDashboardData] = useState(null);
  const [activeIndex, setActiveIndex] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem("dashboardData");
    if (stored) {
      setDashboardData(JSON.parse(stored));
    }
  }, []);

  const cleanMajorName = (majorStr) => {
    if (!majorStr) return "";
    let name = String(majorStr).replace(/\n/g, ' ').trim();
    if (name.startsWith("สาขาวิชา")) {
      name = name.replace("สาขาวิชา", "").trim();
    } else if (name.startsWith("สาขา")) {
      name = name.replace("สาขา", "").trim();
    }
    return name;
  };

  const extractYear = (yearStr) => {
    if (!yearStr) return "";
    const match = String(yearStr).match(/\d+/);
    return match ? match[0] : String(yearStr).trim();
  };

  const cleanString = (str) => {
    if (!str) return "";
    return String(str).replace(/\s+/g, '').replace(/['"]+/g, '').trim();
  };

  const retainData = dashboardData?.["นิสิตคงอยู่"] || dashboardData?.["ข้อมูลนิสิตคงอยู่"] || dashboardData?.["จำนวนนิสิตคงอยู่"] || [];
  const employmentData = dashboardData?.["ภาวะการมีงานทำ"] || [];

  const majorsList = useMemo(() => {
    const list = retainData.map(item => cleanMajorName(item["ชื่อสาขา"] || item["สาขาวิชา"] || item["สาขา"]));
    return [...new Set(list)].filter(Boolean).sort();
  }, [retainData]);

  const yearsList = useMemo(() => {
    const list = retainData.map(item => extractYear(item["ปีที่สำรวจ"] || item["ปีการศึกษาที่รับเข้า"] || item["ปีการศึกษา"]));
    return [...new Set(list)].filter(Boolean).sort();
  }, [retainData]);

  const filteredRetainTable = useMemo(() => {
    return retainData.filter(item => {
      const itemMajor = cleanMajorName(item["ชื่อสาขา"] || item["สาขาวิชา"] || item["สาขา"]);
      const itemYear = extractYear(item["ปีที่สำรวจ"] || item["ปีการศึกษาที่รับเข้า"] || item["ปีการศึกษา"]);
      const itemTerm = String(item["ภาคเรียน"] || item["ภาคการศึกษา"] || "").trim();
      
      const majorMatch = !selectedMajor || itemMajor === selectedMajor;
      const yearMatch = !selectedYear || itemYear === selectedYear;
      const termMatch = itemTerm === "ปลาย"; 
      const searchMatch = !searchText || JSON.stringify(item).toLowerCase().includes(searchText.toLowerCase());

      return majorMatch && yearMatch && termMatch && searchMatch;
    });
  }, [retainData, selectedMajor, selectedYear, searchText]);

  const studentStats = useMemo(() => {
    let totalAdmitted = 0;
    let totalRetained = 0;

    retainData.forEach(item => {
      const itemMajor = cleanMajorName(item["ชื่อสาขา"] || item["สาขาวิชา"] || item["สาขา"]);
      const itemYear = extractYear(item["ปีที่สำรวจ"] || item["ปีการศึกษาที่รับเข้า"] || item["ปีการศึกษา"]);
      const itemTerm = String(item["ภาคเรียน"] || item["ภาคการศึกษา"] || "").trim();
      const amt = Number(item["จำนวน"] || item["รวม"] || 0);

      const majorMatch = !selectedMajor || cleanString(itemMajor) === cleanString(selectedMajor);
      const yearMatch = !selectedYear || itemYear === selectedYear;

      if (majorMatch && yearMatch) {
        if (itemTerm === "ต้น") totalAdmitted += amt;
        if (itemTerm === "ปลาย") totalRetained += amt;
      }
    });

    let gradsByYear = 0;
    let gradsByCriteria = 0;

    employmentData.forEach(item => {
      const itemMajor = cleanMajorName(item["ชื่อสาขา"] || item["สาขาวิชา"]);
      const itemYear = extractYear(item["ปีการศึกษา"]);

      const majorMatch = !selectedMajor || cleanString(itemMajor) === cleanString(selectedMajor);
      const yearMatch = !selectedYear || itemYear === selectedYear;

      if (majorMatch && yearMatch) {
        gradsByYear += Number(item["ผู้สำเร็จการศึกษา"] || item["จำนวน"] || 0);
        gradsByCriteria += Number(item["สำเร็จการศึกษาตามเกณฑ์"] || item["ผู้สำเร็จการศึกษา"] || 0);
      }
    });

    const retentionRate = totalAdmitted > 0 ? ((totalRetained / totalAdmitted) * 100).toFixed(2) : "0.00";
    const gradCriteriaRate = gradsByYear > 0 ? ((gradsByCriteria / gradsByYear) * 100).toFixed(2) : "0.00";

    return {
      admitted: totalAdmitted,
      retained: totalRetained,
      graduatesYear: gradsByYear,
      graduatesCriteria: gradsByCriteria,
      retentionRate: retentionRate,
      gradCriteriaRate: gradCriteriaRate
    };
  }, [retainData, employmentData, selectedMajor, selectedYear]);

  const totalSum = studentStats.admitted + studentStats.retained;
  const admittedPercent = totalSum > 0 ? ((studentStats.admitted / totalSum) * 100).toFixed(1) : "0";
  const retainedPercent = totalSum > 0 ? ((studentStats.retained / totalSum) * 100).toFixed(1) : "0";

  const pieData = useMemo(() => {
    return [
      { name: "นิสิตรับเข้า (ภาคต้น)", value: studentStats.admitted },
      { name: "นิสิตคงอยู่ (ภาคปลาย)", value: studentStats.retained }
    ];
  }, [studentStats.admitted, studentStats.retained]);

  const columns = [
    { title: "ลำดับ", key: "index", width: 65, align: "center", render: (t, r, idx) => idx + 1 },
    { title: "ปีที่สำรวจ", key: "year", align: "center", render: (text, record) => record["ปีที่สำรวจ"] || record["ปีการศึกษาที่รับเข้า"] || "-" },
    { title: "ภาคเรียน", key: "term", align: "center", render: () => "ปลาย" },
    { title: "สาขาวิชา", key: "major", render: (text, record) => cleanMajorName(record["ชื่อสาขา"] || record["สาขาวิชา"]) },
    { 
      title: "จำนวนนิสิตคงอยู่", 
      key: "amount",
      align: "right",
      render: (text, record) => <strong>{Number(record["จำนวน"] || 0).toLocaleString()} คน</strong>
    },
  ];

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sidebar />
      <Layout>
       
        <Header style={{ background: "white", padding: "16px 24px", height: "auto", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #f0f0f0" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <h2 style={{ margin: 0, fontSize: "20px", fontWeight: "600", color: "#1f1f1f", lineHeight: "1.2" }}>
              ข้อมูลสถิตินิสิตประจำคณะ
            </h2>
            <div style={{ color: "#8c8c8c", fontSize: "13px", lineHeight: "1.4", margin: 0 }}>
              ประมวลผลยอดนิสิตรับเข้า และ ยอดนิสิตคงอยู่พร้อมกราฟวิเคราะห์สัดส่วน
            </div>
          </div>
        </Header>

        <Content style={{ padding: "24px 32px", background: "#f5f5f5" }}>
          
          {/* FILTER & SEARCH ZONE */}
          <div style={{ background: "#fff", padding: 20, borderRadius: 16, marginBottom: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
            <Row gutter={[16, 16]} align="bottom">
              <Col xs={24} md={8}>
                <div style={{ marginBottom: 6, fontWeight: 600 }}><FilterOutlined /> สาขาวิชา</div>
                <select value={selectedMajor} onChange={(e) => setSelectedMajor(e.target.value)} style={{ width: "100%", padding: "10px", borderRadius: 8, border: "1px solid #d9d9d9", outline: "none" }}>
                  <option value="">สาขาวิชา</option>
                  {majorsList.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </Col>
              <Col xs={24} md={6}>
                <div style={{ marginBottom: 6, fontWeight: 600 }}>ปีการศึกษา</div>
                <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} style={{ width: "100%", padding: "10px", borderRadius: 8, border: "1px solid #d9d9d9", outline: "none" }}>
                  <option value="">ปีการศึกษา</option>
                  {yearsList.map(y => <option key={y} value={y}>ปี {y}</option>)}
                </select>
              </Col>
              <Col xs={24} md={10}>
                <div style={{ marginBottom: 6, fontWeight: 600 }}>ค้นหาในตารางภาคปลาย</div>
                <Input placeholder="พิมพ์สิ่งที่ต้องการค้นหา..." prefix={<SearchOutlined style={{ color: "#bfbfbf" }} />} value={searchText} onChange={(e) => setSearchText(e.target.value)} style={{ height: 41, borderRadius: 8 }} allowClear />
              </Col>
            </Row>
          </div>

          {retainData.length === 0 ? (
            <Card style={{ borderRadius: 16, padding: "40px 0", textAlign: "center" }}>
              <Empty description="ไม่พบข้อมูลสถิตินิสิตคงอยู่ กรุณาเช็กไฟล์อัปโหลดในระบบคลัง" />
            </Card>
          ) : (
            <>
              {/* EXECUTIVE SUMMARY ZONE */}
              <div style={{ marginBottom: 24 }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: "#262626", display: "flex", alignItems: "center", gap: 8 }}>
                  <DashboardOutlined style={{ color: "#1890ff" }} /> สรุปภาพรวมและวิเคราะห์สถิตินิสิต (Executive Summary)
                </h3>
                
                <Row gutter={[16, 16]}>
                  <Col xs={24} md={12}>
                    <Card bordered={false} style={{ borderRadius: 12, boxShadow: "0 2px 6px rgba(0,0,0,0.03)", background: "linear-gradient(135deg, #f6ffed 0%, #e6f7ff 100%)" }}>
                      <Row align="middle">
                        <Col span={24}>
                          <Statistic 
                            title={<span style={{ color: "#555", fontWeight: 500 }}>อัตราการคงอยู่เฉลี่ย (Retention Rate)</span>} 
                            value={studentStats.retentionRate} 
                            precision={2}
                            valueStyle={{ color: '#1890ff', fontWeight: 700, fontSize: 26 }}
                            suffix="%" 
                          />
                        </Col>
                      </Row>
                    </Card>
                  </Col>

                  <Col xs={24} md={12}>
                    <Card bordered={false} style={{ borderRadius: 12, boxShadow: "0 2px 6px rgba(0,0,0,0.03)" }}>
                      <Statistic 
                        title={<span style={{ color: "#555", fontWeight: 500 }}>อัตราการสำเร็จการศึกษาตามเกณฑ์ประจำปี</span>} 
                        value={studentStats.gradCriteriaRate} 
                        precision={2}
                        valueStyle={{ color: '#52c41a', fontWeight: 700, fontSize: 26 }}
                        suffix="%" 
                      />
                    </Card>
                  </Col>
                </Row>

                <Alert
                  message={<b style={{ fontSize: "14px" }}>บทวิเคราะห์สถิติสถานะภาพรวม</b>}
                  description={
                    <div style={{ fontSize: "12.5px", color: "#434343", marginTop: 4 }}>
                      จากการประมวลผลฐานข้อมูล {selectedYear ? `ปีการศึกษา ${selectedYear}` : "ทุกปีการศึกษา"} 
                      {selectedMajor ? ` สาขาวิชา${selectedMajor}` : " ทุกสาขาวิชา"} 
                      ปัจจุบันพบคณะมีดัชนีอัตราการรักษาสภาพและคงอยู่ของนิสิตสะสมอยู่ที่ <b style={{ color: "#1890ff" }}>{studentStats.retentionRate}%</b> 
                      และมีสัดส่วนของบัณฑิตที่สำเร็จการศึกษาได้ตรงตามเกณฑ์มาตรฐานระยะเวลาที่หลักสูตรกำหนดคิดเป็น <b style={{ color: "#52c41a" }}>{studentStats.gradCriteriaRate}%</b> ของผู้สำเร็จการศึกษาทั้งหมด
                    </div>
                  }
                  type="info"
                  showIcon
                  icon={<InfoCircleOutlined />}
                  style={{ marginTop: 14, borderRadius: 12, border: "1px solid #bae7ff", backgroundColor: "#e6f7ff" }}
                />
              </div>

              {/* KPI CARDS ZONE */}
              <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col xs={24} sm={12} md={6}>
                  <div style={{ background: "#e6f7ff", padding: 20, borderRadius: 15, border: "1px solid #91d5ff", position: "relative", minHeight: 130 }}>
                    <div style={{ color: "#8c8c8c", fontSize: 11 }}>ภาคต้น</div>
                    <h4 style={{ margin: "4px 0", fontSize: 14, color: "#0050b3" }}>นิสิตรับเข้าศึกษา</h4>
                    <h2 style={{ margin: 0, fontSize: 26, fontWeight: "bold", color: "#0050b3" }}>{studentStats.admitted.toLocaleString()} <span style={{ fontSize: 13, fontWeight: "normal", color: "#8c8c8c" }}>คน</span></h2>
                    <UserAddOutlined style={{ fontSize: 28, color: "#1890ff", position: "absolute", right: 20, bottom: 20, opacity: 0.22 }} />
                  </div>
                </Col>

                <Col xs={24} sm={12} md={6}>
                  <div style={{ background: "#f6ffed", padding: 20, borderRadius: 15, border: "1px solid #b7eb8f", position: "relative", minHeight: 130 }}>
                    <div style={{ color: "#8c8c8c", fontSize: 11 }}>ภาคปลาย</div>
                    <h4 style={{ margin: "4px 0", fontSize: 14, color: "#237804" }}>นิสิตคงอยู่รวม</h4>
                    <h2 style={{ margin: 0, fontSize: 26, fontWeight: "bold", color: "#237804" }}>{studentStats.retained.toLocaleString()} <span style={{ fontSize: 13, fontWeight: "normal", color: "#8c8c8c" }}>คน</span></h2>
                    <TeamOutlined style={{ fontSize: 28, color: "#52c41a", position: "absolute", right: 20, bottom: 20, opacity: 0.22 }} />
                  </div>
                </Col>

                <Col xs={24} sm={12} md={6}>
                  <div style={{ background: "#fffbe6", padding: 20, borderRadius: 15, border: "1px solid #ffe58f", position: "relative", minHeight: 130 }}>
                    <div style={{ color: "#8c8c8c", fontSize: 11 }}>ภาวะการมีงานทำประจำปี</div>
                    <h4 style={{ margin: "4px 0", fontSize: 14, color: "#ad6800" }}>สำเร็จการศึกษา (ตามปี)</h4>
                    <h2 style={{ margin: 0, fontSize: 26, fontWeight: "bold", color: "#ad6800" }}>{studentStats.graduatesYear.toLocaleString()} <span style={{ fontSize: 13, fontWeight: "normal", color: "#8c8c8c" }}>คน</span></h2>
                    <TrophyOutlined style={{ fontSize: 28, color: "#faad14", position: "absolute", right: 20, bottom: 20, opacity: 0.22 }} />
                  </div>
                </Col>

                <Col xs={24} sm={12} md={6}>
                  <div style={{ background: "#f9f0ff", padding: 20, borderRadius: 15, border: "1px solid #d3adf7", position: "relative", minHeight: 130 }}>
                    <div style={{ color: "#8c8c8c", fontSize: 11 }}>ภาวะการมีงานทำประจำปี</div>
                    <h4 style={{ margin: "4px 0", fontSize: 14, color: "#531dab" }}>สำเร็จการศึกษา (ตามเกณฑ์)</h4>
                    <h2 style={{ margin: 0, fontSize: 26, fontWeight: "bold", color: "#531dab" }}>{studentStats.graduatesCriteria.toLocaleString()} <span style={{ fontSize: 13, fontWeight: "normal", color: "#8c8c8c" }}>คน</span></h2>
                    <CheckCircleOutlined style={{ fontSize: 28, color: "#722ed1", position: "absolute", right: 20, bottom: 20, opacity: 0.22 }} />
                  </div>
                </Col>
              </Row>

              {/* VISUAL ZONE: PIE CHART & TABLE SIDE-BY-SIDE */}
              <Row gutter={[20, 20]}>
                <Col xs={24} lg={9}>
                  <div style={{ background: "white", padding: 24, borderRadius: 16, boxShadow: "0 4px 16px rgba(0,0,0,0.03)", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: "#262626" }}>สัดส่วน รับเข้า VS คงอยู่ </h3>
                      <div style={{ color: "#8c8c8c", fontSize: 12, marginTop: 4 }}>เปรียบเทียบโครงสร้างจำนวนนิสิตภายในปี</div>
                    </div>
                    
                    <div style={{ height: 230, position: "relative", margin: "10px 0" }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie 
                            activeIndex={activeIndex}
                            activeShape={renderActiveShape}
                            data={pieData} 
                            dataKey="value" 
                            nameKey="name" 
                            innerRadius={65} 
                            outerRadius={88} 
                            paddingAngle={5} 
                            cx="50%" 
                            cy="50%"
                            onMouseEnter={(data, index) => setActiveIndex(index)}
                            onMouseLeave={() => setActiveIndex(null)}
                          >
                            <Cell fill="#00b4d8" style={{ outline: "none" }} />
                            <Cell fill="#2a9d8f" style={{ outline: "none" }} />
                          </Pie>
                          <Tooltip 
                            contentStyle={{ borderRadius: 8, border: "none", boxShadow: "0 2px 8px rgba(0,0,0,0.15)" }}
                            formatter={(value) => `${Number(value).toLocaleString()} คน`} 
                          />
                        </PieChart>
                      </ResponsiveContainer>
                      
                      <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", textAlign: "center", pointerEvents: "none" }}>
                        <span style={{ fontSize: 12, color: "#8c8c8c", display: "block" }}>สถิติรวม</span>
                        <h3 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#262626" }}>{totalSum.toLocaleString()}</h3>
                      </div>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 10, borderTop: "1px solid #f0f0f0", paddingTop: 16, fontSize: 13 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 8px", borderRadius: 8, backgroundColor: activeIndex === 0 ? "#f0f9ff" : "transparent", transition: "all 0.2s" }}>
                        <div style={{ display: "flex", alignItems: "center" }}>
                          <span style={{ display: "inline-block", width: 10, height: 10, background: "#00b4d8", borderRadius: "50%", marginRight: 10 }}></span>
                          <span style={{ color: "#434343" }}>รับเข้าศึกษา (ภาคต้น)</span>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <strong style={{ color: "#262626" }}>{studentStats.admitted.toLocaleString()} คน</strong>
                          <span style={{ fontSize: 11, color: "#8c8c8c", marginLeft: 8 }}>({admittedPercent}%)</span>
                        </div>
                      </div>
                      
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 8px", borderRadius: 8, backgroundColor: activeIndex === 1 ? "#f6ffed" : "transparent", transition: "all 0.2s" }}>
                        <div style={{ display: "flex", alignItems: "center" }}>
                          <span style={{ display: "inline-block", width: 10, height: 10, background: "#2a9d8f", borderRadius: "50%", marginRight: 10 }}></span>
                          <span style={{ color: "#434343" }}>นิสิตคงอยู่จริง (ภาคปลาย)</span>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <strong style={{ color: "#262626" }}>{studentStats.retained.toLocaleString()} คน</strong>
                          <span style={{ fontSize: 11, color: "#8c8c8c", marginLeft: 8 }}>({retainedPercent}%)</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Col>

                <Col xs={24} lg={15}>
                  <div style={{ background: "white", padding: 24, borderRadius: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
                    <div style={{ marginBottom: 16 }}>
                      <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: "#262626" }}>ตารางแจกแจงจำนวนนิสิตคงอยู่ประจำปี (คัดเฉพาะข้อมูลภาคปลาย)</h3>
                    </div>
                    <Table 
                      columns={columns} 
                      dataSource={filteredRetainTable} 
                      rowKey={(record, idx) => `student-pie-page-${idx}`}
                      pagination={{ 
                        defaultPageSize: 5, // กลับมาแสดง 5 แถวให้สั้นกะทัดรัดเหมือนเดิมแล้วค่ะ
                        pageSizeOptions: ["10", "20", "30"], // ตัวเลือกเมนูมีแค่ 10, 20, 30 ไม่มี 50, 100 แล้ว
                        showSizeChanger: true,
                        showTotal: (total) => `รวม ${total} รายการ` 
                      }}
                      bordered
                      scroll={{ x: true }}
                    />
                  </div>
                </Col>
              </Row>
            </>
          )}

        </Content>
      </Layout>
    </Layout>
  );
}

export default StudentPage;
