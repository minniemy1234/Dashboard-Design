import { Layout, Table, Button, Progress, Card } from "antd";
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
  Cell
} from "recharts";
import { SearchOutlined, IdcardOutlined } from "@ant-design/icons";

const { Header, Content } = Layout;

function EmploymentPage() {
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedMajor, setSelectedMajor] = useState("");
  const [appliedFilters, setAppliedFilters] = useState({ year: "", major: "" });
  const [rawData, setRawData] = useState([]);
  const [tableYearFilter, setTableYearFilter] = useState("");

  // 1. ดึงข้อมูลจาก localStorage โดยรองรับชื่อแผ่นงานทุกรูปแบบที่เกี่ยวกับภาวะการมีงานทำ
  useEffect(() => {
    const stored = localStorage.getItem("dashboardData");
    if (stored) {
      const parsed = JSON.parse(stored);
      // ค้นหาคีย์แผ่นงานที่มีคำว่า "งานทำ" หรือ "Employment"
      const targetKey = Object.keys(parsed).find(key => 
        key.includes("งานทำ") || key.includes("Employment")
      );
      const empData = targetKey ? parsed[targetKey] : [];
      setRawData(empData);
    }
  }, []);

  const cleanString = (str) => {
    if (!str) return "";
    return String(str).replace(/\s+/g, '').replace(/['"]+/g, '').trim();
  };

  const extractYear = (yearStr) => {
    if (!yearStr) return "";
    const match = String(yearStr).match(/\d+/);
    return match ? match[0] : String(yearStr).trim();
  };

  // 2. ทำ Dropdown ตัวเลือก ปีการศึกษา และ สาขาวิชา จากไฟล์ Excel จริง
  const years = useMemo(() => {
    const list = rawData.map(item => extractYear(item["ปีการศึกษา"] || item["ปี"]));
    return [...new Set(list)].filter(Boolean).sort().reverse();
  }, [rawData]);

  const majors = useMemo(() => {
    const list = rawData.map(item => String(item["ชื่อสาขา"] || item["สาขาวิชา"] || item["สาขา"] || "").replace(/\n/g, ' ').trim());
    return [...new Set(list)].filter(Boolean).sort();
  }, [rawData]);

  const handleApplyFilters = () => {
    setAppliedFilters({ year: selectedYear, major: selectedMajor });
  };

  // 3. ทำ Auto-Pivot สอดคล้องตามข้อ 2 - 10 ใน Excel ของคุณ
  const processedData = useMemo(() => {
    const groups = {};

    rawData.forEach(item => {
      // รองรับชื่อคอลัมน์หลายรูปแบบที่มักจะอยู่ใน Excel
      const year = extractYear(item["ปีการศึกษา"] || item["ปี"]);
      const majorRaw = String(item["ชื่อสาขา"] || item["สาขาวิชา"] || item["สาขา"] || "").replace(/\n/g, ' ').trim();
      const majorClean = cleanString(majorRaw);
      
      const topic = String(item["หัวข้อ"] || item["รายการ"] || item["ดัชนี"] || "");
      const value = Number(item["จำนวน"] || item["จำนวนคน"] || item["มูลค่า"] || item["คะแนน"] || 0);

      // กรองข้อมูลตาม Filter ด้านบน
      if (appliedFilters.year && year !== appliedFilters.year) return;
      if (appliedFilters.major && majorClean !== cleanString(appliedFilters.major)) return;

      const key = `${year}-${majorClean}`;
      if (!groups[key]) {
        groups[key] = { year, major: majorRaw, q2: 0, q3: 0, q4: 0, q5: 0, q6: 0, q7: 0, q8: 0, q9: 0 };
      }

      // ดักจับจับคู่ตามข้อความจริงในคำถามของคุณ (รองรับทั้งแบบมีเลขข้อและไม่มีเลขข้อ)
      if (topic.includes("ตอบแบบสำรวจ")) groups[key].q2 += value;
      else if (topic.includes("ได้งานทำภายใน") || (topic.includes("ทำงานแล้ว") && !topic.includes("อิสระ") && !topic.includes("เดิม"))) groups[key].q3 += value;
      else if (topic.includes("อาชีพอิสระ")) groups[key].q4 += value;
      else if (topic.includes("งานทำเดิม")) groups[key].q5 += value;
      else if (topic.includes("ศึกษาต่อ")) groups[key].q6 += value;
      else if (topic.includes("อุปสมบท")) groups[key].q7 += value;
      else if (topic.includes("เกณฑ์ทหาร")) groups[key].q8 += value;
      else if (topic.includes("กิจการของตนเอง")) groups[key].q9 += value;
    });

    // คำนวณ ข้อ 10: อัตราภาวะการมีงานทำ = (ข้อ3+4) / (ข้อ 2-5-6-7-8-9) * 100
    return Object.values(groups).map(item => {
      const dividend = item.q3 + item.q4;
      const divisor = item.q2 - item.q5 - item.q6 - item.q7 - item.q8 - item.q9;
      const rate = divisor > 0 ? (dividend / divisor) * 100 : 0;
      
      return {
        ...item,
        rate: rate > 100 ? 100 : Number(rate.toFixed(2))
      };
    });
  }, [rawData, appliedFilters]);

  // 4. คำนวณสรุปยอดรวมแสดงผลในการ์ด KPI
  const totals = useMemo(() => {
    let t2 = 0, t3 = 0, t4 = 0, t5 = 0, t6 = 0, t7 = 0, t8 = 0, t9 = 0;
    
    processedData.forEach(item => {
      t2 += item.q2; t3 += item.q3; t4 += item.q4; t5 += item.q5;
      t6 += item.q6; t7 += item.q7; t8 += item.q8; t9 += item.q9;
    });

    const totalDividend = t3 + t4;
    const totalDivisor = t2 - t5 - t6 - t7 - t8 - t9;
    const finalRate = totalDivisor > 0 ? (totalDividend / totalDivisor) * 100 : 0;

    return {
      q2: t2, q3: t3, q4: t4, q5: t5, q6: t6, q7: t7, q8: t8, q9: t9,
      rate: finalRate.toFixed(2)
    };
  }, [processedData]);

  const chartData = [
    { name: "ได้งานทำประจำ", จำนวนคน: totals.q3, color: "#0050b3" },
    { name: "ประกอบอาชีพอิสระ", จำนวนคน: totals.q4, color: "#1890ff" },
    { name: "ศึกษาต่อ", จำนวนคน: totals.q6, color: "#69c0ff" },
    { name: "ภาระ/งานเดิม/อื่นๆ", จำนวนคน: (totals.q5 + totals.q7 + totals.q8 + totals.q9), color: "#bfbfbf" },
  ];

  const tableData = useMemo(() => {
    if (!tableYearFilter) return processedData;
    return processedData.filter(item => item.year === tableYearFilter);
  }, [processedData, tableYearFilter]);

  const tableColumns = [
    { title: "ปีการศึกษา", dataIndex: "year", key: "year", width: 105, align: "center" },
    { title: "สาขาวิชา", dataIndex: "major", key: "major" },
    { title: "2. ตอบแบบสำรวจ (คน)", dataIndex: "q2", key: "q2", align: "center" },
    { title: "3. ได้งานทำ (คน)", dataIndex: "q3", key: "q3", align: "center" },
    { title: "4. อาชีพอิสระ (คน)", dataIndex: "q4", key: "q4", align: "center" },
    { title: "6. ศึกษาต่อ (คน)", dataIndex: "q6", key: "q6", align: "center" },
    { title: "หักลบอื่นๆ (5+7+8+9)", key: "others", align: "center", render: (_, r) => r.q5 + r.q7 + r.q8 + r.q9 },
    { 
      title: "10. อัตราการมีงานทำ", 
      dataIndex: "rate", 
      key: "rate", 
      align: "center", 
      render: v => <span style={{ color: "#0050b3", fontWeight: "bold" }}>{v}%</span> 
    },
  ];

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sidebar />
      <Layout>
        <Header style={{ background: "white", padding: "16px 24px", height: "auto", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #f0f0f0" }}>
          <div>
            <h2 style={{ margin: "0 0 4px 0", fontSize: "20px", fontWeight: "600", color: "#1f1f1f", lineHeight: "1.2" }}>ข้อมูลภาวะการมีงานทำของบัณฑิต</h2>
            <div style={{ color: "#8c8c8c", fontSize: "13px", lineHeight: "1.4" }}>คำนวณอัตราภาวะการมีงานทำตามเกณฑ์มาตรฐานการประกันคุณภาพการศึกษา (สป.อว.)</div>
          </div>
        </Header>

        <Content style={{ padding: "16px 32px 32px 32px", background: "#f5f5f5" }}>
          
          {/* FILTER ZONE */}
          <div style={{ background: "#fff", padding: 24, borderRadius: 20, marginBottom: 24, boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              <div>
                <div style={{ marginBottom: 8, fontWeight: 600 }}>ปีการศึกษา</div>
                <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} style={{ width: "100%", padding: 12, borderRadius: 10, border: "1px solid #d9d9d9", outline: "none" }}>
                  <option value="">ทั้งหมดทุกปี</option>
                  {years.map(y => <option key={y} value={y}>ปีการศึกษา {y}</option>)}
                </select>
              </div>
              <div>
                <div style={{ marginBottom: 8, fontWeight: 600 }}>สาขาวิชา / หลักสูตร</div>
                <select value={selectedMajor} onChange={(e) => setSelectedMajor(e.target.value)} style={{ width: "100%", padding: 12, borderRadius: 10, border: "1px solid #d9d9d9", outline: "none" }}>
                  <option value="">ทั้งหมดทุกสาขา</option>
                  {majors.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
              <Button type="primary" size="large" icon={<SearchOutlined />} onClick={handleApplyFilters} style={{ borderRadius: 10, background: "#0050b3", borderColor: "#0050b3" }}>
                ประมวลผลภาวะการมีงานทำ
              </Button>
            </div>
          </div>

          {/* MAIN KPI & FORMULA RESULT */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 20, marginBottom: 24 }}>
            <Card style={{ borderRadius: 16, textAlign: "center", border: "1px solid #91d5ff" }}>
              <h3 style={{ color: "#0050b3", marginBottom: 15 }}>ข้อ 10: อัตราภาวะการมีงานทำ</h3>
              <Progress 
                type="circle" 
                percent={Number(totals.rate)} 
                format={() => `${totals.rate}%`}
                strokeColor="#0050b3"
                size={140}
                strokeWidth={8}
              />
              <div style={{ marginTop: 15, color: "#8c8c8c", fontSize: 12 }}>สูตรคำนวณสอดคล้องตามเกณฑ์ สป.อว.</div>
            </Card>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 15 }}>
              <div style={{ background: "#e6f7ff", padding: 20, borderRadius: 15, border: "1px solid #91d5ff" }}>
                <div style={{ color: "#8c8c8c", fontSize: 11 }}>ข้อ 2: ตอบแบบสำรวจ</div>
                <h4 style={{ margin: "5px 0", fontSize: 13, color: "#0050b3" }}>ผู้ตอบแบบสำรวจรวม</h4>
                <h2>{totals.q2} <span style={{ fontSize: 13, fontWeight: 'normal', color: '#8c8c8c' }}>คน</span></h2>
                <IdcardOutlined style={{ fontSize: 22, color: "#0050b3", float: "right", marginTop: -25, opacity: 0.4 }} />
              </div>

              <div style={{ background: "#e6f7ff", padding: 20, borderRadius: 15, border: "1px solid #91d5ff" }}>
                <div style={{ color: "#8c8c8c", fontSize: 11 }}>ข้อ 3: งานประจำ</div>
                <h4 style={{ margin: "5px 0", fontSize: 13, color: "#0050b3" }}>บัณฑิตที่ได้งานทำ</h4>
                <h2>{totals.q3} <span style={{ fontSize: 13, fontWeight: 'normal', color: '#8c8c8c' }}>คน</span></h2>
              </div>

              <div style={{ background: "#e6f7ff", padding: 20, borderRadius: 15, border: "1px solid #91d5ff" }}>
                <div style={{ color: "#8c8c8c", fontSize: 11 }}>ข้อ 4: อาชีพอิสระ</div>
                <h4 style={{ margin: "5px 0", fontSize: 13, color: "#0050b3" }}>ประกอบอาชีพอิสระ</h4>
                <h2>{totals.q4} <span style={{ fontSize: 13, fontWeight: 'normal', color: '#8c8c8c' }}>คน</span></h2>
              </div>

              <div style={{ background: "#f8fafc", padding: 16, borderRadius: 12, border: "1px solid #e2e8f0", gridColumn: "span 3", display: "flex", justifyContent: "space-around", alignItems: "center" }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 11, color: "#64748b" }}>ข้อ 6: ศึกษาต่อ</div>
                  <strong style={{ fontSize: 16, color: "#334155" }}>{totals.q6} คน</strong>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 11, color: "#64748b" }}>ข้อ 5: มีงานทำเดิม</div>
                  <strong style={{ fontSize: 16, color: "#334155" }}>{totals.q5} คน</strong>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 11, color: "#64748b" }}>ข้อ 9: มีกิจการตัวเอง</div>
                  <strong style={{ fontSize: 16, color: "#334155" }}>{totals.q9} คน</strong>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 11, color: "#64748b" }}>ข้อ 7+8: บวช/ทหาร</div>
                  <strong style={{ fontSize: 16, color: "#334155" }}>{totals.q7 + totals.q8} คน</strong>
                </div>
              </div>
            </div>
          </div>

          {/* CHART ZONE */}
          <div style={{ background: "white", padding: 24, borderRadius: 16, marginBottom: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}>
            <h3 style={{ marginBottom: 20 }}>แผนภูมิแสดงสัดส่วนผู้สำเร็จการศึกษาจำแนกตามสถานะ</h3>
            <div style={{ height: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} style={{ fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip cursor={{ fill: '#f1f5f9' }} />
                  <Bar dataKey="จำนวนคน" radius={[8, 8, 0, 0]} barSize={50}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* TABLE ZONE */}
          <div style={{ background: "white", padding: 24, borderRadius: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
              <h3 style={{ margin: 0 }}>ตารางรายละเอียดแยกตามสาขาวิชาและอัตราการได้งานทำ</h3>
              
              <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#f9fafb", padding: "6px 12px", borderRadius: 10, border: "1px solid #e5e7eb" }}>
                <span style={{ fontSize: 13, fontWeight: 500, color: "#4b5563" }}>เลือกปีดูในตาราง:</span>
                <select 
                  value={tableYearFilter} 
                  onChange={(e) => setTableYearFilter(e.target.value)} 
                  style={{ background: "transparent", border: "none", fontSize: 13, fontWeight: 600, color: "#0050b3", cursor: "pointer", outline: "none" }}
                >
                  <option value="">แสดงทุกปี</option>
                  {years.map((year) => <option key={year} value={year}>ปีการศึกษา {year}</option>)}
                </select>
              </div>
            </div>

            <Table 
              columns={tableColumns} 
              dataSource={tableData} 
              rowKey={(r, idx) => `${r.year}-${r.major}-${idx}`} 
              pagination={{ pageSize: 10 }}
              scroll={{ x: true }}
              bordered
            />
          </div>

        </Content>
      </Layout>
    </Layout>
  );
}

export default EmploymentPage;
