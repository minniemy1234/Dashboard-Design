import React, { useState, useEffect, useMemo } from "react";
import Sidebar from "../components/Sidebar";
import { Layout, Card, Row, Col, Alert, Select as AntSelect, Spin, Empty, Tag, Table } from "antd";
import {
  ReadOutlined,
  TrophyOutlined,
  LockOutlined,
  BarChartOutlined,
  PieChartOutlined,
  SafetyCertificateOutlined,
  FilterOutlined
} from "@ant-design/icons";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  LabelList,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";
import { db } from "../firebase";
import { doc, onSnapshot } from "firebase/firestore";

const { Header, Content } = Layout;

// Palette สีสำหรับกราฟแท่งและกราฟวงกลม
const BAR_COLORS = ["#0284c7", "#0ea5e9", "#38bdf8", "#7dd3fc", "#0369a1"];
const HINDEX_COLORS = ["#8b5cf6", "#f472b6"]; // สีม่วงสำหรับ >=1, สีชมพูสำหรับ <1

const extractYear = (yearStr) => {
  if (!yearStr) return "";
  const match = String(yearStr).match(/\d+/);
  return match ? match[0] : String(yearStr).trim();
};

function ResearchPage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // Raw data จาก localStorage สำหรับทั้ง 3 ไฟล์
  const [researchDataList, setResearchDataList] = useState([]);
  const [ipDataList, setIpDataList] = useState([]);
  const [hIndexDataList, setHIndexDataList] = useState([]);

  // Filter States
  const [scopusFilter, setScopusFilter] = useState("ทั้งหมด");
  const [levelFilter, setLevelFilter] = useState("ทั้งหมด");
  const [selectedHIndexYear, setSelectedHIndexYear] = useState("");

  const currentEmail = (localStorage.getItem("email") || "").toLowerCase().trim();

  // เช็กสิทธิ์ Admin
  useEffect(() => {
    if (!db) {
      setIsAdmin(true);
      setLoading(false);
      return;
    }

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

  // โหลดข้อมูลทั้ง 3 ไฟล์วิจัยจาก localStorage
  useEffect(() => {
    const stored = localStorage.getItem("dashboardData");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        
        // 1. ไฟล์ผลงานวิจัย
        const resList = parsed["ข้อมูลวิจัย(จำนวนผลงานวิจัย)"] || parsed["จำนวนผลงานวิจัย"] || parsed["ข้อมูลวิจัย"] || [];
        setResearchDataList(Array.isArray(resList) ? resList : []);

        // 2. ไฟล์ทรัพย์สินทางปัญญา
        const ipList = parsed["ข้อมูลวิจัย(จำนวนทรัพย์สินทางปัญญา)"] || parsed["จำนวนทรัพย์สินทางปัญญา"] || parsed["ทรัพย์สินทางปัญญา"] || [];
        setIpDataList(Array.isArray(ipList) ? ipList : []);

        // 3. ไฟล์ H-Index
        const hList = parsed["ข้อมูลวิจัย(ค่า H-Index)"] || parsed["ค่า H-Index"] || parsed["H-Index"] || [];
        setHIndexDataList(Array.isArray(hList) ? hList : []);

        // ตั้งค่าปีล่าสุดของ H-Index
        if (Array.isArray(hList) && hList.length > 0) {
          const years = hList.map(item => extractYear(item["ปี พ.ศ."] || item["ปีการศึกษา"])).filter(Boolean).sort().reverse();
          if (years.length > 0) setSelectedHIndexYear(years[0]);
        }
      } catch (e) {
        console.error("Error reading research data:", e);
      }
    }
  }, []);

  // --- 1. ตัวเลือก Dropdown ผลงานวิจัย ---
  const scopusOptions = useMemo(() => {
    const list = researchDataList.map(item => item["Scopus"] || item["ฐานข้อมูล"]).filter(Boolean);
    return ["ทั้งหมด", ...new Set(list)];
  }, [researchDataList]);

  const levelOptions = useMemo(() => {
    const list = researchDataList.map(item => item["ระดับการตีพิมพ์"]).filter(Boolean);
    return ["ทั้งหมด", ...new Set(list)];
  }, [researchDataList]);

  // ข้อมูลกราฟแท่งเปรียบเทียบผลงานวิจัยรายปี
  const researchBarChartData = useMemo(() => {
    if (!researchDataList || researchDataList.length === 0) return [];

    const filtered = researchDataList.filter(item => {
      const matchScopus = scopusFilter === "ทั้งหมด" || (item["Scopus"] || item["ฐานข้อมูล"]) === scopusFilter;
      const matchLevel = levelFilter === "ทั้งหมด" || item["ระดับการตีพิมพ์"] === levelFilter;
      return matchScopus && matchLevel;
    });

    const yearMap = new Map();
    filtered.forEach(item => {
      const year = extractYear(item["ปี พ.ศ."] || item["ปีการศึกษา"] || item["ปี"]);
      const count = Number(item["จำนวน"] || 0);
      if (year) {
        yearMap.set(year, (yearMap.get(year) || 0) + count);
      }
    });

    return Array.from(yearMap.entries())
      .map(([year, count]) => ({ year: `ปี ${year}`, count }))
      .sort((a, b) => a.year.localeCompare(b.year));
  }, [researchDataList, scopusFilter, levelFilter]);

  // ยอดรวมผลงานวิจัย
  const totalFilteredResearchCount = useMemo(() => {
    return researchBarChartData.reduce((sum, d) => sum + d.count, 0);
  }, [researchBarChartData]);

  // --- 2. สรุปข้อมูลทรัพย์สินทางปัญญา ---
  const ipSummary = useMemo(() => {
    if (!ipDataList || ipDataList.length === 0) return { total: 0, items: [] };

    let total = 0;
    const items = ipDataList.map((item, idx) => {
      const cnt = Number(item["จำนวน"] || 0);
      total += cnt;
      return {
        key: idx,
        year: extractYear(item["ปีงบประมาณ"] || item["ปี พ.ศ."]),
        type: String(item["ประเภททรัพย์สินทางปัญญา"] || "").trim(),
        level: String(item["ระดับทรัพย์สินทางปัญญา"] || "").trim(),
        count: cnt
      };
    });

    return { total, items };
  }, [ipDataList]);

  // --- 3. ข้อมูลกราฟวงกลม H-index ---
  const hIndexYears = useMemo(() => {
    const years = hIndexDataList.map(item => extractYear(item["ปี พ.ศ."] || item["ปีการศึกษา"])).filter(Boolean);
    return [...new Set(years)].sort().reverse();
  }, [hIndexDataList]);

  const hIndexPieData = useMemo(() => {
    if (!hIndexDataList || hIndexDataList.length === 0) return { chartData: [], total: 0, ge1: 0, lt1: 0 };

    const activeYear = selectedHIndexYear || (hIndexYears.length > 0 ? hIndexYears[0] : "");
    const match = hIndexDataList.find(item => extractYear(item["ปี พ.ศ."] || item["ปีการศึกษา"]) === activeYear);

    if (!match) return { chartData: [], total: 0, ge1: 0, lt1: 0 };

    const ge1 = Number(match["จำนวนอาจารย์ที่มีค่า H-Index ตั้งแต่ 1 ขึ้นไป"] || 0);
    const lt1 = Number(match["จำนวนอาจารย์ที่มีค่า H-Index น้อยกว่า 1"] || 0);
    const total = ge1 + lt1;

    const chartData = [
      { name: "H-Index ตั้งแต่ 1 ขึ้นไป", value: ge1 },
      { name: "H-Index น้อยกว่า 1", value: lt1 }
    ];

    return { chartData, total, ge1, lt1 };
  }, [hIndexDataList, selectedHIndexYear, hIndexYears]);

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
        <Spin size="large" tip="กำลังโหลดข้อมูล..." />
      </div>
    );
  }

  return (
    <Layout style={{ minHeight: "100vh", background: "#f8fafc" }}>
      <Sidebar defaultSelectedKey="research" />
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
              ข้อมูลผลงานวิจัย ทรัพย์สินทางปัญญา และ H-index
            </h2>
            <span style={{ color: "#64748b", fontSize: "12px" }}>
              | สรุปสถิติวิจัยและผลงานวิชาการของคณะฯ
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
              
              {/* โซนที่ 1: กราฟเปรียบเทียบผลงานวิจัย  */}
              <Card
                bordered={false}
                style={{
                  borderRadius: 16,
                  boxShadow: "0 4px 20px rgba(0, 0, 0, 0.03)",
                  background: "#ffffff"
                }}
                title={
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ background: "#e0f2fe", padding: "8px 12px", borderRadius: 10 }}>
                        <BarChartOutlined style={{ color: "#0284c7", fontSize: 20 }} />
                      </div>
                      <div>
                        <div style={{ fontSize: 16, fontWeight: 700, color: "#142549" }}>1. เปรียบเทียบจำนวนผลงานวิจัยตีพิมพ์</div>
                        <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 400 }}>วิเคราะห์แนวโน้มจำแนกตามฐานข้อมูลและระดับการตีพิมพ์</div>
                      </div>
                    </div>

                    <Tag color="blue" style={{ fontSize: 13, padding: "4px 12px", borderRadius: 8, fontWeight: 600 }}>
                      รวมตามเงื่อนไข: {totalFilteredResearchCount} เรื่อง
                    </Tag>
                  </div>
                }
              >
                {/* FILTER BAR */}
                <div style={{ 
                  background: "#f8fafc", 
                  padding: "16px 20px", 
                  borderRadius: 12, 
                  marginBottom: 20,
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  flexWrap: "wrap",
                  border: "1px solid #e2e8f0"
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#475569", fontWeight: 600, fontSize: 13 }}>
                    <FilterOutlined style={{ color: "#0284c7" }} /> ตัวกรองข้อมูล:
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 13, color: "#64748b" }}>ฐานข้อมูล / Scopus:</span>
                    <AntSelect
                      style={{ width: 160 }}
                      value={scopusFilter}
                      onChange={(val) => setScopusFilter(val)}
                    >
                      {scopusOptions.map(opt => (
                        <AntSelect.Option key={opt} value={opt}>{opt}</AntSelect.Option>
                      ))}
                    </AntSelect>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 13, color: "#64748b" }}>ระดับการตีพิมพ์:</span>
                    <AntSelect
                      style={{ width: 160 }}
                      value={levelFilter}
                      onChange={(val) => setLevelFilter(val)}
                    >
                      {levelOptions.map(opt => (
                        <AntSelect.Option key={opt} value={opt}>{opt}</AntSelect.Option>
                      ))}
                    </AntSelect>
                  </div>
                </div>

                {/* GRAPH AREA */}
                <div style={{ height: 320, width: "100%" }}>
                  {researchBarChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={researchBarChartData} margin={{ top: 25, right: 30, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="year" tick={{ fontSize: 12, fill: "#64748b", fontWeight: 600 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} allowDecimals={false} />
                        <RechartsTooltip contentStyle={{ borderRadius: 10, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }} formatter={(val) => [`${val} เรื่อง`, "จำนวนผลงานวิจัย"]} />
                        <Bar dataKey="count" name="จำนวนผลงาน" radius={[8, 8, 0, 0]} barSize={40}>
                          <LabelList dataKey="count" position="top" style={{ fill: "#0369a1", fontSize: 13, fontWeight: 700 }} formatter={(v) => v > 0 ? v : ""} />
                          {researchBarChartData.map((entry, idx) => (
                            <Cell key={`cell-${idx}`} fill={BAR_COLORS[idx % BAR_COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <Empty description="ไม่พบข้อมูลผลงานวิจัยตามเงื่อนไขที่เลือก" style={{ marginTop: 40 }} />
                  )}
                </div>
              </Card>

              {/* ทรัพย์สินทางปัญญา & โซนที่ 3 H-Index */}
              <Row gutter={[24, 24]}>

                {/* ทรัพย์สินทางปัญญา */}
                <Col xs={24} lg={12}>
                  <Card
                    bordered={false}
                    style={{
                      borderRadius: 16,
                      boxShadow: "0 4px 20px rgba(0, 0, 0, 0.03)",
                      background: "#ffffff",
                      height: "100%"
                    }}
                    title={
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ background: "#fef3c7", padding: "8px 12px", borderRadius: 10 }}>
                          <SafetyCertificateOutlined style={{ color: "#d97706", fontSize: 20 }} />
                        </div>
                        <div>
                          <div style={{ fontSize: 16, fontWeight: 700, color: "#142549" }}>2. ทรัพย์สินทางปัญญา</div>
                          <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 400 }}>สิทธิบัตร / อนุสิทธิบัตร ของคณะฯ</div>
                        </div>
                      </div>
                    }
                  >
                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                      {/* STAT SUMMARY CARD */}
                      <div style={{ 
                        background: "linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)", 
                        border: "1px solid #fde68a", 
                        borderRadius: 14, 
                        padding: "16px 20px",
                        display: "flex",
                        alignItems: "center",
                        justify: "space-between"
                      }}>
                        <div>
                          <div style={{ color: "#b45309", fontSize: 13, fontWeight: 600 }}>จำนวนทรัพย์สินทางปัญญารวมทั้งหมด</div>
                          <div style={{ fontSize: 28, fontWeight: 800, color: "#d97706", marginTop: 2 }}>
                            {ipSummary.total} <span style={{ fontSize: 13, fontWeight: 500, color: "#b45309" }}>รายการ</span>
                          </div>
                        </div>
                        <TrophyOutlined style={{ fontSize: 40, color: "#f59e0b", opacity: 0.4 }} />
                      </div>

                      {/* DETAILS TABLE */}
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#475569", marginBottom: 8 }}>รายการจดทะเบียนทรัพย์สินทางปัญญา:</div>
                        <Table
                          dataSource={ipSummary.items}
                          pagination={false}
                          size="small"
                          bordered
                          columns={[
                            { title: "ปีงบประมาณ", dataIndex: "year", key: "year", width: 100, align: "center", render: y => `ปี ${y}` },
                            { title: "ประเภททรัพย์สินทางปัญญา", dataIndex: "type", key: "type" },
                            { 
                              title: "ระดับ", 
                              dataIndex: "level", 
                              key: "level", 
                              align: "center", 
                              width: 90,
                              render: l => <Tag color="gold" style={{ borderRadius: 6, fontWeight: 600 }}>{l}</Tag> 
                            },
                            { 
                              title: "จำนวน", 
                              dataIndex: "count", 
                              key: "count", 
                              align: "center", 
                              width: 80,
                              render: c => <strong>{c} รายการ</strong> 
                            },
                          ]}
                        />
                      </div>
                    </div>
                  </Card>
                </Col>

                {/* H-index  */}
                <Col xs={24} lg={12}>
                  <Card
                    bordered={false}
                    style={{
                      borderRadius: 16,
                      boxShadow: "0 4px 20px rgba(0, 0, 0, 0.03)",
                      background: "#ffffff",
                      height: "100%"
                    }}
                    title={
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{ background: "#f3e8ff", padding: "8px 12px", borderRadius: 10 }}>
                            <PieChartOutlined style={{ color: "#9333ea", fontSize: 20 }} />
                          </div>
                          <div>
                            <div style={{ fontSize: 16, fontWeight: 700, color: "#142549" }}>3. สัดส่วน H-Index อาจารย์ประจำ</div>
                            <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 400 }}>จำแนกตามระดับ H-Index ของอาจารย์/นักวิจัย</div>
                          </div>
                        </div>

                        {/* SELECT FILTER YEAR */}
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ fontSize: 12, color: "#64748b" }}>ปี พ.ศ.:</span>
                          <AntSelect
                            style={{ width: 110 }}
                            value={selectedHIndexYear}
                            onChange={(val) => setSelectedHIndexYear(val)}
                          >
                            {hIndexYears.map(y => (
                              <AntSelect.Option key={y} value={y}>พ.ศ. {y}</AntSelect.Option>
                            ))}
                          </AntSelect>
                        </div>
                      </div>
                    }
                  >
                    {hIndexPieData.total > 0 ? (
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                        <div style={{ height: 220, width: "100%" }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={hIndexPieData.chartData}
                                cx="50%"
                                cy="50%"
                                innerRadius={50}
                                outerRadius={80}
                                paddingAngle={4}
                                dataKey="value"
                              >
                                {hIndexPieData.chartData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={HINDEX_COLORS[index % HINDEX_COLORS.length]} />
                                ))}
                              </Pie>
                              <RechartsTooltip 
                                formatter={(value) => [`${value} คน (${((value / hIndexPieData.total) * 100).toFixed(1)}%)`, "จำนวน"]} 
                                contentStyle={{ borderRadius: 10, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                              />
                              <Legend verticalAlign="bottom" height={36} />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>

                        {/* SUMMARY STATS UNDER PIE */}
                        <Row gutter={16} style={{ width: "100%", marginTop: 4 }}>
                          <Col span={12}>
                            <div style={{ background: "#faf5ff", border: "1px solid #f3e8ff", borderRadius: 12, padding: "10px", textAlign: "center" }}>
                              <div style={{ fontSize: 12, color: "#6b21a8", fontWeight: 600 }}>H-Index ≥ 1</div>
                              <div style={{ fontSize: 18, fontWeight: 800, color: "#8b5cf6" }}>
                                {hIndexPieData.ge1} <span style={{ fontSize: 12, color: "#a855f7", fontWeight: 500 }}>คน</span>
                              </div>
                            </div>
                          </Col>
                          <Col span={12}>
                            <div style={{ background: "#fdf2f8", border: "1px solid #fbcfe8", borderRadius: 12, padding: "10px", textAlign: "center" }}>
                              <div style={{ fontSize: 12, color: "#9d174d", fontWeight: 600 }}>H-Index &lt; 1</div>
                              <div style={{ fontSize: 18, fontWeight: 800, color: "#ec4899" }}>
                                {hIndexPieData.lt1} <span style={{ fontSize: 12, color: "#f472b6", fontWeight: 500 }}>คน</span>
                              </div>
                            </div>
                          </Col>
                        </Row>
                      </div>
                    ) : (
                      <Empty description="ไม่พบข้อมูล H-index ในปีที่เลือก" style={{ marginTop: 40 }} />
                    )}
                  </Card>
                </Col>

              </Row>

            </div>
          )}
        </Content>
      </Layout>
    </Layout>
  );
}

export default ResearchPage;
