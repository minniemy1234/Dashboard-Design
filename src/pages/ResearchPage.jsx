import React, { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import { Layout, Card, Row, Col, Statistic, Alert, Tag } from "antd";
import {
  ReadOutlined,
  ExperimentOutlined,
  TrophyOutlined,
  LockOutlined,
  BarChartOutlined,
  FileTextOutlined
} from "@ant-design/icons";
import { db } from "../firebase";
import { doc, onSnapshot } from "firebase/firestore";

const { Header, Content } = Layout;

function ResearchPage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const currentEmail = (localStorage.getItem("email") || "").toLowerCase().trim();

  // เช็กสิทธิ์ Admin
  useEffect(() => {
    if (!db) return;

    const unsub = onSnapshot(doc(db, "system_config", "admins"), (docSnap) => {
      let adminList = ["naramon.si@ku.th"];
      if (docSnap.exists() && Array.isArray(docSnap.data().list)) {
        adminList = Array.from(
          new Set(["naramon.si@ku.th", ...docSnap.data().list.map((e) => String(e).toLowerCase().trim())])
        );
      }
      setIsAdmin(adminList.includes(currentEmail));
      setLoading(false);
    });

    return () => unsub();
  }, [currentEmail]);

  // ค่าเริ่มต้นเป็น 0 รอการเชื่อมต่อข้อมูลไฟล์จริง
  const researchData = {
    // โซน 1: ผลงานวิจัย
    totalResearch: 0,
    impactResearch: 0,
    scopusQ1: 0,
    scopusTotal: 0,
    internationalPapers: 0,
    totalPapers: 0,
    teachersWithIntPapers: 0,
    nationalAwards: 0,
    interAwards: 0,
    scopusCitations6Years: 0,
    citations5Years: 0,

    // โซน 2: โครงการวิจัย
    totalProjects: 0,
    interFundedProjects: 0,
    fundedProjects: 0,
    requestedProjects: 0,
    repeatLocalAgencies3Years: 0,
    repeatInterAgencies3Years: 0,
    totalLocalAgencies3Years: 0,
    totalInterAgencies3Years: 0,
    internalFunding: 0,
    externalFunding: 0,

    // โซน 3: H-index
    hIndex0: 0,
    hIndex1_5: 0,
    hIndex6_10: 0,
    hIndexAbove10: 0,
  };

  if (loading) return null;

  return (
    <Layout style={{ minHeight: "100vh", background: "#f8fafc" }}>
      <Sidebar />
      <Layout style={{ background: "transparent" }}>
        
        {/* HEADER */}
        <Header
          style={{
            background: "#ffffff",
            padding: "0 24px",
            height: "64px",
            lineHeight: "64px",
            borderBottom: "1px solid #e2e8f0",
            display: "flex",
            alignItems: "center"
          }}
        >
          <div style={{ display: "flex", alignItems: "baseline", gap: "12px", width: "100%" }}>
            <h2 style={{ margin: 0, fontSize: "18px", fontWeight: "700", color: "#142549", display: "flex", alignItems: "center" }}>
              <ReadOutlined style={{ color: "#00b4d8", marginRight: 8 }} />
              ข้อมูลผลงานวิจัย โครงการวิจัย และ H-index
            </h2>
            <span style={{ color: "#64748b", fontSize: "12px" }}>
              | ระบบสรุปสถิติด้านงานวิจัยและวิชาการ คณะฯ
            </span>
          </div>
        </Header>

        {/* CONTENT */}
        <Content style={{ padding: "24px", background: "#f8fafc" }}>
          {!isAdmin ? (
            <Alert
              message="ไม่มีสิทธิ์เข้าถึงข้อมูลส่วนนี้"
              description="หน้าจอนี้จำกัดเฉพาะผู้ดูแลระบบ (Admin) เท่านั้น"
              type="error"
              showIcon
              icon={<LockOutlined />}
              style={{ borderRadius: 16, padding: "20px 24px", maxWidth: 600, margin: "40px auto" }}
            />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              
              {/* โซน 1: ผลงานวิจัย */}
              <Card
                bordered={false}
                style={{
                  borderRadius: 16,
                  boxShadow: "0 4px 20px rgba(0, 0, 0, 0.03)",
                  background: "#ffffff"
                }}
                title={
                  <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "4px 0" }}>
                    <div style={{ background: "#e0f2fe", padding: "6px 10px", borderRadius: 8 }}>
                      <FileTextOutlined style={{ color: "#0284c7", fontSize: 18 }} />
                    </div>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: "#142549" }}>ผลงานวิจัย</div>
                      <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 400 }}>สถิติการตีพิมพ์ บทความวิจัย และรางวัล</div>
                    </div>
                  </div>
                }
              >
                <Row gutter={[16, 16]}>
                  {[
                    { label: "จำนวนผลงานวิจัยทั้งหมด", val: researchData.totalResearch, unit: "เรื่อง" },
                    { label: "สร้างผลกระทบทางเศรษฐกิจ สังคม และสิ่งแวดล้อม", val: researchData.impactResearch, unit: "เรื่อง" },
                    { label: "อยู่ในวารสาร Q1 ของ Scopus", val: researchData.scopusQ1, unit: "เรื่อง", highlight: true },
                    { label: "อยู่ในฐานข้อมูล Scopus ทั้งหมด", val: researchData.scopusTotal, unit: "เรื่อง" },
                    { label: "ตีพิมพ์ในฐานข้อมูลระดับนานาชาติ", val: researchData.internationalPapers, unit: "เรื่อง" },
                    { label: "ผลงานทางวิชาการที่ตีพิมพ์ทั้งหมด", val: researchData.totalPapers, unit: "เรื่อง" },
                    { label: "อาจารย์/นักวิจัยที่ตีพิมพ์ระดับนานาชาติ", val: researchData.teachersWithIntPapers, unit: "คน" },
                    { label: "ผลงานวิจัยที่ได้รับรางวัลระดับชาติ", val: researchData.nationalAwards, unit: "รางวัล" },
                    { label: "ผลงานวิจัยที่ได้รับรางวัลระดับนานาชาติ", val: researchData.interAwards, unit: "รางวัล" },
                  ].map((item, idx) => (
                    <Col xs={24} sm={12} md={8} key={idx}>
                      <div style={{
                        background: item.highlight ? "#f0f9ff" : "#f8fafc",
                        border: item.highlight ? "1px solid #bae6fd" : "1px solid #f1f5f9",
                        borderRadius: 12,
                        padding: "16px 20px"
                      }}>
                        <Statistic
                          title={<span style={{ color: "#475569", fontSize: 13, fontWeight: 500 }}>{item.label}</span>}
                          value={item.val}
                          suffix={<span style={{ fontSize: 13, color: "#94a3b8" }}>{item.unit}</span>}
                          valueStyle={{ color: "#142549", fontWeight: 700, fontSize: 24 }}
                        />
                      </div>
                    </Col>
                  ))}

                  {/* Highlight Citations Cards */}
                  <Col xs={24} sm={12}>
                    <div style={{ background: "linear-gradient(135deg, #142549 0%, #1e3a8a 100%)", borderRadius: 12, padding: "18px 22px", color: "white" }}>
                      <Statistic
                        title={<span style={{ color: "#93c5fd", fontSize: 13, fontWeight: 500 }}>จำนวนการอ้างอิง (Cited) รอบ 6 ปีย้อนหลัง (Scopus)</span>}
                        value={researchData.scopusCitations6Years}
                        suffix={<span style={{ fontSize: 13, color: "#93c5fd" }}>ครั้ง</span>}
                        valueStyle={{ color: "#ffffff", fontWeight: 700, fontSize: 26 }}
                      />
                    </div>
                  </Col>

                  <Col xs={24} sm={12}>
                    <div style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)", borderRadius: 12, padding: "18px 22px", color: "white" }}>
                      <Statistic
                        title={<span style={{ color: "#cbd5e1", fontSize: 13, fontWeight: 500 }}>จำนวนบทความที่ถูกอ้างอิงย้อนหลัง 5 ปี (ไม่รวมปีรายงาน)</span>}
                        value={researchData.citations5Years}
                        suffix={<span style={{ fontSize: 13, color: "#cbd5e1" }}>บทความ</span>}
                        valueStyle={{ color: "#ffffff", fontWeight: 700, fontSize: 26 }}
                      />
                    </div>
                  </Col>
                </Row>
              </Card>

              {/* โซน 2: โครงการวิจัย */}
              <Card
                bordered={false}
                style={{
                  borderRadius: 16,
                  boxShadow: "0 4px 20px rgba(0, 0, 0, 0.03)",
                  background: "#ffffff"
                }}
                title={
                  <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "4px 0" }}>
                    <div style={{ background: "#dcfce7", padding: "6px 10px", borderRadius: 8 }}>
                      <ExperimentOutlined style={{ color: "#16a34a", fontSize: 18 }} />
                    </div>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: "#142549" }}>โครงการวิจัย</div>
                      <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 400 }}>แหล่งทุนสนับสนุน และหน่วยงานภายนอก</div>
                    </div>
                  </div>
                }
              >
                <Row gutter={[16, 16]}>
                  {[
                    { label: "จำนวนโครงการวิจัยทั้งหมด", val: researchData.totalProjects, unit: "โครงการ" },
                    { label: "ได้รับทุนจากหน่วยงานนานาชาติ", val: researchData.interFundedProjects, unit: "โครงการ" },
                    { label: "จำนวนโครงการวิจัยที่ได้รับทุน", val: researchData.fundedProjects, unit: "โครงการ" },
                    { label: "จำนวนโครงการวิจัยที่เสนอขอรับทุน", val: researchData.requestedProjects, unit: "โครงการ" },
                    { label: "หน่วยงานภายนอก (ในประเทศ) ที่ให้ทุนวิจัยซ้ำในรอบ 3 ปี", val: researchData.repeatLocalAgencies3Years, unit: "แห่ง" },
                    { label: "หน่วยงานภายนอก (นอกประเทศ) ที่ให้ทุนวิจัยซ้ำในรอบ 3 ปี", val: researchData.repeatInterAgencies3Years, unit: "แห่ง" },
                    { label: "หน่วยงานภายนอก (ในประเทศ) ที่ให้ทุนวิจัยทั้งหมดในรอบ 3 ปี", val: researchData.totalLocalAgencies3Years, unit: "แห่ง" },
                    { label: "หน่วยงานภายนอก (นอกประเทศ) ที่ให้ทุนวิจัยทั้งหมดในรอบ 3 ปี", val: researchData.totalInterAgencies3Years, unit: "แห่ง" },
                  ].map((item, idx) => (
                    <Col xs={24} sm={12} md={6} key={idx}>
                      <div style={{ background: "#f8fafc", border: "1px solid #f1f5f9", borderRadius: 12, padding: "16px" }}>
                        <Statistic
                          title={<span style={{ color: "#475569", fontSize: 12, fontWeight: 500 }}>{item.label}</span>}
                          value={item.val}
                          suffix={<span style={{ fontSize: 12, color: "#94a3b8" }}>{item.unit}</span>}
                          valueStyle={{ color: "#142549", fontWeight: 700, fontSize: 22 }}
                        />
                      </div>
                    </Col>
                  ))}

                  {/* Fund Amount Cards */}
                  <Col xs={24} sm={12}>
                    <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 12, padding: "18px 22px" }}>
                      <Statistic
                        title={<span style={{ color: "#166534", fontSize: 13, fontWeight: 600 }}>ทุนสนับสนุนการวิจัยภายในที่ได้รับ</span>}
                        value={researchData.internalFunding}
                        prefix="฿"
                        precision={2}
                        valueStyle={{ color: "#15803d", fontWeight: 700, fontSize: 26 }}
                      />
                    </div>
                  </Col>

                  <Col xs={24} sm={12}>
                    <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 12, padding: "18px 22px" }}>
                      <Statistic
                        title={<span style={{ color: "#166534", fontSize: 13, fontWeight: 600 }}>ทุนสนับสนุนการวิจัยภายนอกที่ได้รับ</span>}
                        value={researchData.externalFunding}
                        prefix="฿"
                        precision={2}
                        valueStyle={{ color: "#15803d", fontWeight: 700, fontSize: 26 }}
                      />
                    </div>
                  </Col>
                </Row>
              </Card>

              {/* โซน 3: H-index */}
              <Card
                bordered={false}
                style={{
                  borderRadius: 16,
                  boxShadow: "0 4px 20px rgba(0, 0, 0, 0.03)",
                  background: "#ffffff"
                }}
                title={
                  <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "4px 0" }}>
                    <div style={{ background: "#f3e8ff", padding: "6px 10px", borderRadius: 8 }}>
                      <TrophyOutlined style={{ color: "#9333ea", fontSize: 18 }} />
                    </div>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: "#142549" }}>H-index</div>
                      <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 400 }}>จำแนกตามระดับ H-index ของอาจารย์ประจำและนักวิจัย</div>
                    </div>
                  </div>
                }
              >
                <Row gutter={[16, 16]}>
                  {[
                    { label: "ค่า H-index เท่ากับ 0", val: researchData.hIndex0, color: "#8b00a7" },
                    { label: "ค่า H-index เท่ากับ 1 - 5", val: researchData.hIndex1_5, color: "#8b00a7" },
                    { label: "ค่า H-index เท่ากับ 6 - 10", val: researchData.hIndex6_10, color: "#8b00a7" },
                    { label: "ค่า H-index มากกว่า 10", val: researchData.hIndexAbove10, color: "#8b00a7" },
                  ].map((item, idx) => (
                    <Col xs={24} sm={12} md={6} key={idx}>
                      <div style={{
                        background: "#faf5ff",
                        border: "1px solid #f3e8ff",
                        borderRadius: 12,
                        padding: "20px 16px",
                        textAlign: "center"
                      }}>
                        <div style={{ color: "#6b21a8", fontSize: 13, fontWeight: 600, marginBottom: 8 }}>{item.label}</div>
                        <Statistic
                          value={item.val}
                          suffix={<span style={{ fontSize: 14, color: "#a855f7" }}>คน</span>}
                          valueStyle={{ color: item.color, fontWeight: 800, fontSize: 30 }}
                        />
                      </div>
                    </Col>
                  ))}
                </Row>
              </Card>

            </div>
          )}
        </Content>
      </Layout>
    </Layout>
  );
}

export default ResearchPage;
