import React, { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import { Layout, Card, Row, Col, Statistic, Alert } from "antd";
import {
  DollarOutlined,
  LockOutlined,
  AccountBookOutlined,
  UserSwitchOutlined,
  PieChartOutlined,
  RiseOutlined
} from "@ant-design/icons";
import { db } from "../firebase";
import { doc, onSnapshot } from "firebase/firestore";

const { Header, Content } = Layout;

function FinancePage() {
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

  // ค่าเริ่มต้นเป็น 0 (เตรียมพร้อมเชื่อมต่อไฟล์ข้อมูลจริง)
  const financeData = {
    // โซน 1: การเงิน
    totalRevenue: 0,                   // รายได้ทั้งหมด
    totalExpense: 0,                   // ค่าใช้จ่ายทั้งหมด
    totalRevenueAmount: 0,             // จำนวนเงินรายได้ทั้งหมด
    totalBudgetAmount: 0,              // จำนวนเงินงบประมาณทั้งหมด
    educationRevenue: 0,               // รายได้จากพันธกิจด้านการศึกษา
    researchRevenue: 0,                // รายได้จากพันธกิจด้านการวิจัย
    academicServicesRevenue: 0,        // รายได้จากพันธกิจด้านการบริการวิชาการ
    universityAccumulatedFund: 0,      // เงินสะสมของมหาวิทยาลัย
    productDevRevenue: 0,              // รายได้จากการพัฒนาผลิตภัณฑ์
    netProfit: 0,                      // กำไรสุทธิ
    totalAssets: 0,                    // รวมสินทรัพย์
    personnelExpense: 0,               // จำนวนค่าใช้จ่ายงบบุคลากร
    operatingExpense: 0,               // จำนวนค่าใช้จ่ายงบดำเนินการ
    investmentExpense: 0,              // จำนวนค่าใช้จ่ายงบลงทุน

    // โซน 2: Reskill Upskill
    totalReskillUpskillClients: 0,     // จำนวนของลูกค้า reskill upskill
    upskillClients: 0,                 // จำนวนของลูกค้า upskill
    reskillClients: 0,                 // จำนวนของลูกค้า reskill
  };

  if (loading) return null;

  return (
    <Layout style={{ minHeight: "100vh", background: "#f8fafc" }}>
      <Sidebar />
      <Layout style={{ background: "transparent" }}>
        
        {/* 🟢 HEADER */}
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
              <DollarOutlined style={{ color: "#10b981", marginRight: 8 }} />
              ข้อมูลการเงิน และ Reskill / Upskill
            </h2>
            <span style={{ color: "#64748b", fontSize: "12px" }}>
              | รายงานงบประมาณ รายได้-ค่าใช้จ่าย และการพัฒนาทักษะ (จำกัดสิทธิ์ Admin)
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
              
              {/* 🟢 โซน 1: สรุปสถานะการเงินภาพรวม (Highlight Banner Cards) */}
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={12} md={6}>
                  <div style={{ background: "linear-gradient(135deg, #10b981 0%, #047857 100%)", borderRadius: 12, padding: "18px 20px", color: "white" }}>
                    <Statistic
                      title={<span style={{ color: "#a7f3d0", fontSize: 13, fontWeight: 600 }}>รายได้ทั้งหมด</span>}
                      value={financeData.totalRevenue}
                      prefix="฿"
                      precision={2}
                      valueStyle={{ color: "#ffffff", fontWeight: 700, fontSize: 24 }}
                    />
                  </div>
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <div style={{ background: "linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)", borderRadius: 12, padding: "18px 20px", color: "white" }}>
                    <Statistic
                      title={<span style={{ color: "#fca5a5", fontSize: 13, fontWeight: 600 }}>ค่าใช้จ่ายทั้งหมด</span>}
                      value={financeData.totalExpense}
                      prefix="฿"
                      precision={2}
                      valueStyle={{ color: "#ffffff", fontWeight: 700, fontSize: 24 }}
                    />
                  </div>
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <div style={{ background: "linear-gradient(135deg, #142549 0%, #1e3a8a 100%)", borderRadius: 12, padding: "18px 20px", color: "white" }}>
                    <Statistic
                      title={<span style={{ color: "#93c5fd", fontSize: 13, fontWeight: 600 }}>กำไรสุทธิ</span>}
                      value={financeData.netProfit}
                      prefix="฿"
                      precision={2}
                      valueStyle={{ color: "#ffffff", fontWeight: 700, fontSize: 24 }}
                    />
                  </div>
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <div style={{ background: "linear-gradient(135deg, #0f172a 0%, #334155 100%)", borderRadius: 12, padding: "18px 20px", color: "white" }}>
                    <Statistic
                      title={<span style={{ color: "#cbd5e1", fontSize: 13, fontWeight: 600 }}>รวมสินทรัพย์</span>}
                      value={financeData.totalAssets}
                      prefix="฿"
                      precision={2}
                      valueStyle={{ color: "#ffffff", fontWeight: 700, fontSize: 24 }}
                    />
                  </div>
                </Col>
              </Row>

              {/* 💵 โซน 2: รายละเอียดด้านการเงิน (ปรับโครงสร้างใหม่) */}
              <Card
                bordered={false}
                style={{
                  borderRadius: 16,
                  boxShadow: "0 4px 20px rgba(0, 0, 0, 0.03)",
                  background: "#ffffff"
                }}
                title={
                  <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "4px 0" }}>
                    <div style={{ background: "#d1fae5", padding: "6px 10px", borderRadius: 8 }}>
                      <AccountBookOutlined style={{ color: "#059669", fontSize: 18 }} />
                    </div>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: "#142549" }}>งบประมาณและจำแนกรายได้-ค่าใช้จ่าย</div>
                      <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 400 }}>ข้อมูลจำแนกรายได้ตามพันธกิจ และหมวดหมู่ค่าใช้จ่าย</div>
                    </div>
                  </div>
                }
              >
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                  
                  {/* กลุ่มที่ 1: รายได้และงบประมาณ (7 รายการ จัด Grid 3 การ์ด/แถว) */}
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#059669", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
                      <RiseOutlined /> หมวดหมู่รายได้และงบประมาณ
                    </div>
                    <Row gutter={[16, 16]}>
                      {[
                        { label: "จำนวนเงินรายได้ทั้งหมด", val: financeData.totalRevenueAmount },
                        { label: "จำนวนเงินงบประมาณทั้งหมด", val: financeData.totalBudgetAmount },
                        { label: "เงินสะสมของมหาวิทยาลัย", val: financeData.universityAccumulatedFund },
                        { label: "รายได้จากพันธกิจด้านการศึกษา", val: financeData.educationRevenue, highlight: true },
                        { label: "รายได้จากพันธกิจด้านการวิจัย", val: financeData.researchRevenue, highlight: true },
                        { label: "รายได้จากพันธกิจด้านการบริการวิชาการ", val: financeData.academicServicesRevenue, highlight: true },
                        { label: "รายได้จากการพัฒนาผลิตภัณฑ์", val: financeData.productDevRevenue },
                      ].map((item, idx) => (
                        <Col xs={24} sm={12} md={8} key={idx}>
                          <div style={{
                            background: item.highlight ? "#f0fdf4" : "#f8fafc",
                            border: item.highlight ? "1px solid #bbf7d0" : "1px solid #f1f5f9",
                            borderRadius: 12,
                            padding: "16px 20px"
                          }}>
                            <Statistic
                              title={<span style={{ color: "#475569", fontSize: 13, fontWeight: 500 }}>{item.label}</span>}
                              value={item.val}
                              prefix="฿"
                              precision={2}
                              valueStyle={{ color: "#142549", fontWeight: 700, fontSize: 22 }}
                            />
                          </div>
                        </Col>
                      ))}
                    </Row>
                  </div>

                  <div style={{ height: "1px", background: "#f1f5f9", margin: "4px 0" }} />

                  {/* กลุ่มที่ 2: ค่าใช้จ่าย (3 รายการ จัด Grid 3 การ์ดลงตัวในแถวเดียวพอดี) */}
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#dc2626", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
                      <PieChartOutlined /> หมวดหมู่ค่าใช้จ่าย
                    </div>
                    <Row gutter={[16, 16]}>
                      {[
                        { label: "จำนวนค่าใช้จ่ายงบบุคลากร", val: financeData.personnelExpense },
                        { label: "จำนวนค่าใช้จ่ายงบดำเนินการ", val: financeData.operatingExpense },
                        { label: "จำนวนค่าใช้จ่ายงบลงทุน", val: financeData.investmentExpense },
                      ].map((item, idx) => (
                        <Col xs={24} sm={12} md={8} key={idx}>
                          <div style={{
                            background: "#fef2f2",
                            border: "1px solid #fecaca",
                            borderRadius: 12,
                            padding: "16px 20px"
                          }}>
                            <Statistic
                              title={<span style={{ color: "#991b1b", fontSize: 13, fontWeight: 500 }}>{item.label}</span>}
                              value={item.val}
                              prefix="฿"
                              precision={2}
                              valueStyle={{ color: "#dc2626", fontWeight: 700, fontSize: 22 }}
                            />
                          </div>
                        </Col>
                      ))}
                    </Row>
                  </div>

                </div>
              </Card>

              {/* Reskill / Upskill */}
              <Card
                bordered={false}
                style={{
                  borderRadius: 16,
                  boxShadow: "0 4px 20px rgba(0, 0, 0, 0.03)",
                  background: "#ffffff"
                }}
                title={
                  <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "4px 0" }}>
                    <div style={{ background: "#e0e7ff", padding: "6px 10px", borderRadius: 8 }}>
                      <UserSwitchOutlined style={{ color: "#4f46e5", fontSize: 18 }} />
                    </div>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: "#142549" }}>Reskill / Upskill</div>
                      <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 400 }}>สถิติจำนวนผู้รับบริการอบรมเพิ่มพูนและเปลี่ยนผ่านทักษะ</div>
                    </div>
                  </div>
                }
              >
                <Row gutter={[16, 16]}>
                  <Col xs={24} sm={8}>
                    <div style={{
                      background: "#eef2ff",
                      border: "1px solid #c7d2fe",
                      borderRadius: 12,
                      padding: "20px 16px",
                      textAlign: "center"
                    }}>
                      <div style={{ color: "#3730a3", fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
                        จำนวนของลูกค้า Reskill Upskill ทั้งหมด
                      </div>
                      <Statistic
                        value={financeData.totalReskillUpskillClients}
                        suffix={<span style={{ fontSize: 14, color: "#6366f1" }}>คน</span>}
                        valueStyle={{ color: "#4338ca", fontWeight: 800, fontSize: 32 }}
                      />
                    </div>
                  </Col>

                  <Col xs={24} sm={8}>
                    <div style={{
                      background: "#faf5ff",
                      border: "1px solid #f3e8ff",
                      borderRadius: 12,
                      padding: "20px 16px",
                      textAlign: "center"
                    }}>
                      <div style={{ color: "#6b21a8", fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
                        จำนวนของลูกค้า Upskill
                      </div>
                      <Statistic
                        value={financeData.upskillClients}
                        suffix={<span style={{ fontSize: 14, color: "#a855f7" }}>คน</span>}
                        valueStyle={{ color: "#7e22ce", fontWeight: 800, fontSize: 32 }}
                      />
                    </div>
                  </Col>

                  <Col xs={24} sm={8}>
                    <div style={{
                      background: "#f0fdf4",
                      border: "1px solid #bbf7d0",
                      borderRadius: 12,
                      padding: "20px 16px",
                      textAlign: "center"
                    }}>
                      <div style={{ color: "#166534", fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
                        จำนวนของลูกค้า Reskill
                      </div>
                      <Statistic
                        value={financeData.reskillClients}
                        suffix={<span style={{ fontSize: 14, color: "#4ade80" }}>คน</span>}
                        valueStyle={{ color: "#15803d", fontWeight: 800, fontSize: 32 }}
                      />
                    </div>
                  </Col>
                </Row>
              </Card>

            </div>
          )}
        </Content>
      </Layout>
    </Layout>
  );
}

export default FinancePage;
