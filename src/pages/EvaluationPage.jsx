import { Layout, Table, Button, Progress, Card, Empty } from "antd"; // เพิ่ม Empty สำหรับทำกราฟเปล่า
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
  Legend
} from "recharts";
import { 
  SearchOutlined, 
  BookOutlined, 
  SlidersOutlined, 
  ExportOutlined,
  DashboardOutlined
} from "@ant-design/icons";

const { Header, Content } = Layout;

function EvaluationPage() {
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedMajor, setSelectedMajor] = useState("");
  const [appliedFilters, setAppliedFilters] = useState({ year: "", major: "" });
  const [rawData, setRawData] = useState([]);
  const [tableYearFilter, setTableYearFilter] = useState("");

  // 🌟 State เพิ่มเติม: สำหรับเก็บข้อมูลกราฟประเมินแยกรายองค์ประกอบที่ได้มาจากช่องอัปโหลดใหม่
  const [evalGraphData, setEvalGraphData] = useState([]);

  // 1. โหลดข้อมูลจริงจาก localStorage
  useEffect(() => {
    const stored = localStorage.getItem("dashboardData");
    if (stored) {
      const parsed = JSON.parse(stored);
      // ดึงคีย์ "ผลการประเมินคุณภาพหลักสูตร" จาก Excel (ระบบเดิม)
      const evalData = parsed["ผลการประเมินคุณภาพหลักสูตร"] || [];
      setRawData(evalData);

      // 🌟 ดึงคีย์ข้อมูลตัวใหม่ "ข้อมูลประเมินคุณภาพ" ที่อัปโหลดมาจากหน้า UploadPage เพื่อนำมาวาดกราฟ
      const customEvalGraph = parsed["ข้อมูลประเมินคุณภาพ"] || [];
      setEvalGraphData(customEvalGraph);
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

  // 2. ดึงข้อมูลทำ Dropdown ตัวเลือก (ปีการศึกษา และ สาขาวิชา)
  const years = useMemo(() => {
    const list = rawData.map(item => extractYear(item["ปีการศึกษา"]));
    return [...new Set(list)].filter(Boolean).sort().reverse();
  }, [rawData]);

  const majors = useMemo(() => {
    const list = rawData.map(item => String(item["ชื่อสาขา"] || "").replace(/\n/g, ' ').trim());
    return [...new Set(list)].filter(Boolean).sort();
  }, [rawData]);

  const handleApplyFilters = () => {
    setAppliedFilters({ year: selectedYear, major: selectedMajor });
  };

  // 3. กรองและคำนวณข้อมูลสำหรับภาพรวมหลัก (KPI)
  const filteredData = useMemo(() => {
    return rawData.filter(item => {
      const year = extractYear(item["ปีการศึกษา"]);
      const majorClean = cleanString(item["ชื่อสาขา"]);

      if (appliedFilters.year && year !== appliedFilters.year) return false;
      if (appliedFilters.major && majorClean !== cleanString(appliedFilters.major)) return false;
      return true;
    });
  }, [rawData, appliedFilters]);

  // 4. กรองข้อมูลสำหรับตารางด้านล่าง (เพื่อให้กรองปีแยกได้อิสระ)
  const tableData = useMemo(() => {
    return rawData.filter(item => {
      const year = extractYear(item["ปีการศึกษา"]);
      const majorClean = cleanString(item["ชื่อสาขา"]);

      if (tableYearFilter && year !== tableYearFilter) return false;
      if (appliedFilters.major && majorClean !== cleanString(appliedFilters.major)) return false;
      return true;
    }).map(item => ({
      ...item,
      year: extractYear(item["ปีการศึกษา"]),
      major: String(item["ชื่อสาขา"] || "").replace(/\n/g, ' ').trim()
    }));
  }, [rawData, tableYearFilter, appliedFilters.major]);

  // 5. คำนวณค่าเฉลี่ยสรุปสำหรับเปิดการ์ด KPI
  const stats = useMemo(() => {
    if (filteredData.length === 0) {
      return { input: "0.00", process: "0.00", output: "0.00", comp2: "0.00", comp3: "0.00", comp4: "0.00", comp5: "0.00", comp6: "0.00", avg: "0.00" };
    }

    let sumInput = 0, sumProcess = 0, sumOutput = 0, sumAvg = 0;
    let sumC2 = 0, sumC3 = 0, sumC4 = 0, sumC5 = 0, sumC6 = 0;
    
    let cInput = 0, cProcess = 0, cOutput = 0, cAvg = 0;
    let cC2 = 0, cC3 = 0, cC4 = 0, cC5 = 0, cC6 = 0;

    filteredData.forEach(item => {
      const inp = Number(item["Input"] || 0);
      const prc = Number(item["Process"] || 0);
      const out = Number(item["Output"] || 0);
      const av = Number(item["คะแนนเฉลี่ยรวม"] || item["คะแนนรวม"] || 0);
      
      const c2 = Number(item["องค์ที่ 2 บัณฑิต"] || 0);
      const c3 = Number(item["องค์ที่ 3 นิสิต"] || 0);
      const c4 = Number(item["องค์ที่ 4อาจารย์"] || 0);
      const c5 = Number(item["องค์ที่ 5หลักสูตร การเรียนการสอน การประเมินผู้เรียน"] || 0);
      const c6 = Number(item["องค์ที่ 6 สิ่งสนับสนุนการเรียนรู้"] || 0);

      if (inp > 0) { sumInput += inp; cInput++; }
      if (prc > 0) { sumProcess += prc; cProcess++; }
      if (out > 0) { sumOutput += out; cOutput++; }
      if (av > 0) { sumAvg += av; cAvg++; }
      
      if (c2 > 0) { sumC2 += c2; cC2++; }
      if (c3 > 0) { sumC3 += c3; cC3++; }
      if (c4 > 0) { sumC4 += c4; cC4++; }
      if (c5 > 0) { sumC5 += c5; cC5++; }
      if (c6 > 0) { sumC6 += c6; cC6++; }
    });

    return {
      input: cInput > 0 ? (sumInput / cInput).toFixed(2) : "0.00",
      process: cProcess > 0 ? (sumProcess / cProcess).toFixed(2) : "0.00",
      output: cOutput > 0 ? (sumOutput / cOutput).toFixed(2) : "0.00",
      comp2: cC2 > 0 ? (sumC2 / cC2).toFixed(2) : "0.00",
      comp3: cC3 > 0 ? (sumC3 / cC3).toFixed(2) : "0.00",
      comp4: cC4 > 0 ? (sumC4 / cC4).toFixed(2) : "0.00",
      comp5: cC5 > 0 ? (sumC5 / cC5).toFixed(2) : "0.00",
      comp6: cC6 > 0 ? (sumC6 / cC6).toFixed(2) : "0.00",
      avg: cAvg > 0 ? (sumAvg / cAvg).toFixed(2) : "0.00"
    };
  }, [filteredData]);

  // นิยามคอลัมน์ของตารางข้อมูลรายละเอียด ด้านล่างสุด
  const tableColumns = [
    { title: "ปีการศึกษา", dataIndex: "year", key: "year", width: 105, align: "center" },
    { title: "สาขาวิชา", dataIndex: "major", key: "major" },
    { title: "Input", dataIndex: "Input", key: "Input", align: "center", render: v => v || "-" },
    { title: "Process", dataIndex: "Process", key: "Process", align: "center", render: v => v || "-" },
    { title: "Output", dataIndex: "Output", key: "Output", align: "center", render: v => v || "-" },
    { title: "องค์ฯ 2 บัณฑิต", dataIndex: "องค์ที่ 2 บัณฑิต", key: "c2", align: "center", render: v => v || "-" },
    { title: "องค์ฯ 3 นิสิต", dataIndex: "องค์ที่ 3 นิสิต", key: "c3", align: "center", render: v => v || "-" },
    { title: "องค์ฯ 4 อาจารย์", dataIndex: "องค์ที่ 4อาจารย์", key: "c4", align: "center", render: v => v || "-" },
    { title: "องค์ฯ 5 หลักสูตร", dataIndex: "องค์ที่ 5หลักสูตร การเรียนการสอน การประเมินผู้เรียน", key: "c5", align: "center", render: v => v || "-" },
    { title: "องค์ฯ 6 สิ่งสนับสนุน", dataIndex: "องค์ที่ 6 สิ่งสนับสนุนการเรียนรู้", key: "c6", align: "center", render: v => v || "-" },
    { title: "คะแนนเฉลี่ยรวม", dataIndex: "คะแนนเฉลี่ยรวม", key: "total", align: "center", render: v => <span style={{ color: "#722ed1", fontWeight: "bold" }}>{v || "-"}</span> },
  ];

  // 🌟 นิยามคอลัมน์ของตารางใหม่สำหรับข้อมูลประเมินคุณภาพรายองค์ประกอบ (ล้อตามกราฟใหม่)
  const evalTableColumns = [
    { title: "องค์ประกอบคุณภาพ", dataIndex: "name", key: "name" },
    { title: "คะแนนประเมินปีนี้", dataIndex: "score", key: "score", align: "center", render: (v) => <strong style={{ color: "#f59e0b" }}>{v}</strong> },
    { title: "ค่าเป้าหมาย / ปีที่ผ่านมา", dataIndex: "target", key: "target", align: "center" },
  ];

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sidebar />
      <Layout>
        {/* HEADER ZONE */}
        <Header style={{ background: "white", padding: "16px 24px", height: "auto", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #f0f0f0" }}>
          <div>
            <h2 style={{ margin: "0 0 4px 0", fontSize: "20px", fontWeight: "600", color: "#1f1f1f", lineHeight: "1.2" }}>ผลการประเมินคุณภาพหลักสูตร</h2>
            <div style={{ color: "#8c8c8c", fontSize: "13px", lineHeight: "1.4" }}>วิเคราะห์ผลการดำเนินงานของหลักสูตรและคะแนนการประเมินตามเกณฑ์มาตรฐาน AUN-QA / สป.อว.</div>
          </div>
        </Header>

        <Content style={{ padding: "16px 32px 32px 32px", background: "#f5f5f5" }}>
          
          {/* FILTER SECTION */}
          <div style={{ background: "#fff", padding: 24, borderRadius: 20, marginBottom: 24, boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              <div>
                <div style={{ marginBottom: 8, fontWeight: 600 }}>ปีการศึกษา (KPI & กราฟ)</div>
                <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} style={{ width: "100%", padding: 12, borderRadius: 10, border: "1px solid #d9d9d9", outline: "none" }}>
                  <option value="">ทั้งหมดทุกปี</option>
                  {years.map(y => <option key={y} value={y}>ปีการศึกษา {y}</option>)}
                </select>
              </div>
              <div>
                <div style={{ marginBottom: 8, fontWeight: 600 }}>หลักสูตร / สาขาวิชา</div>
                <select value={selectedMajor} onChange={(e) => setSelectedMajor(e.target.value)} style={{ width: "100%", padding: 12, borderRadius: 10, border: "1px solid #d9d9d9", outline: "none" }}>
                  <option value="">ทั้งหมดทุกสาขา</option>
                  {majors.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
              <Button type="primary" size="large" icon={<SearchOutlined />} onClick={handleApplyFilters} style={{ borderRadius: 10, background: "#722ed1", borderColor: "#722ed1" }}>
                ประมวลผลการประเมินหลักสูตร
              </Button>
            </div>
          </div>

          {/* MAIN KPI ZONE */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 20, marginBottom: 24 }}>
            <Card style={{ borderRadius: 16, textAlign: "center", border: "1px solid #d3adf7" }}>
              <h3 style={{ color: "#722ed1", marginBottom: 15 }}>คะแนนเฉลี่ยรวมหลักสูตร</h3>
              <Progress 
                type="circle" 
                percent={(Number(stats.avg) / 5) * 100} 
                format={() => stats.avg}
                strokeColor="#722ed1"
                size={140}
              />
              <div style={{ marginTop: 15, color: "#8c8c8c" }}>คะแนนเต็ม 5.00 คะแนน</div>
            </Card>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 15 }}>
              <div style={{ background: "#f9f0ff", padding: 20, borderRadius: 15, border: "1px solid #d3adf7" }}>
                <div style={{ color: "#8c8c8c", fontSize: 12 }}>ตัวบ่งชี้หลัก</div>
                <h4 style={{ margin: "5px 0", fontSize: 14 }}>ด้าน Input</h4>
                <h2>{stats.input}</h2>
                <BookOutlined style={{ fontSize: 24, color: "#722ed1", float: "right", marginTop: -30, opacity: 0.4 }} />
              </div>
              <div style={{ background: "#f9f0ff", padding: 20, borderRadius: 15, border: "1px solid #d3adf7" }}>
                <div style={{ color: "#8c8c8c", fontSize: 12 }}>ตัวบ่งชี้หลัก</div>
                <h4 style={{ margin: "5px 0", fontSize: 14 }}>ด้าน Process</h4>
                <h2>{stats.process}</h2>
                <SlidersOutlined style={{ fontSize: 24, color: "#722ed1", float: "right", marginTop: -30, opacity: 0.4 }} />
              </div>
              <div style={{ background: "#f9f0ff", padding: 20, borderRadius: 15, border: "1px solid #d3adf7" }}>
                <div style={{ color: "#8c8c8c", fontSize: 12 }}>ตัวบ่งชี้หลัก</div>
                <h4 style={{ margin: "5px 0", fontSize: 14 }}>ด้าน Output</h4>
                <h2>{stats.output}</h2>
                <ExportOutlined style={{ fontSize: 24, color: "#722ed1", float: "right", marginTop: -30, opacity: 0.4 }} />
              </div>
              <div style={{ background: "#f5f5f5", padding: 16, borderRadius: 12, border: "1px solid #d9d9d9", gridColumn: "span 3", display: "flex", justifyContent: "space-around", alignItems: "center" }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 11, color: "#8c8c8c" }}>องค์ฯ 2 บัณฑิต</div>
                  <strong style={{ fontSize: 16, color: "#722ed1" }}>{stats.comp2}</strong>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 11, color: "#8c8c8c" }}>องค์ฯ 3 นิสิต</div>
                  <strong style={{ fontSize: 16, color: "#722ed1" }}>{stats.comp3}</strong>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 11, color: "#8c8c8c" }}>องค์ฯ 4 อาจารย์</div>
                  <strong style={{ fontSize: 16, color: "#722ed1" }}>{stats.comp4}</strong>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 11, color: "#8c8c8c" }}>องค์ฯ 5 หลักสูตร</div>
                  <strong style={{ fontSize: 16, color: "#722ed1" }}>{stats.comp5}</strong>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 11, color: "#8c8c8c" }}>องค์ฯ 6 สิ่งสนับสนุน</div>
                  <strong style={{ fontSize: 16, color: "#722ed1" }}>{stats.comp6}</strong>
                </div>
              </div>
            </div>
          </div>

          {/* 🌟 CHART ZONE (ปรับเงื่อนไขแสดงผลตามที่คุณต้องการแบบ 100%) */}
          <div style={{ background: "white", padding: 24, borderRadius: 16, marginBottom: 24 }}>
            <h3 style={{ marginBottom: 20 }}>แผนภูมิเปรียบเทียบผลการประเมินคุณภาพรายองค์ประกอบ</h3>
            
            {/* 🛠️ ตรวจสอบสถานะ: ถ้าในระบบยังไม่มีไฟล์กราฟประเมินแยกอัปโหลดเข้ามา จะขึ้นกล่องว่างเปล่า (Empty State) ก่อนทันที */}
            {evalGraphData.length === 0 ? (
              <div style={{ padding: "60px 0", border: "2px dashed #cbd5e1", borderRadius: 12, background: "#fafafa" }}>
                <Empty 
                  description={
                    <span style={{ color: "#94a3b8", fontSize: 14 }}>
                      ยังไม่มีการอัปโหลดไฟล์สถิติสำหรับแผนภูมินี้ในระบบ <br />
                      <span style={{ fontSize: 12, color: "#cbd5e1" }}>กรุณาเพิ่มไฟล์ที่หัวข้อ "ช่องเฉพาะอัปโหลดกราฟประเมินคุณภาพรายองค์ประกอบ" ที่หน้าอัปโหลดหลักก่อน</span>
                    </span>
                  } 
                />
              </div>
            ) : (
              /* ถ้าอัปโหลดไฟล์เข้ามาที่หน้า Data Management เรียบร้อยแล้ว กราฟเปรียบเทียบตัวใหม่คู่เป้าหมายจะถูกวาดทันที */
              <div style={{ height: 350 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={evalGraphData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} style={{ fontSize: 12, fill: "#64748b" }} />
                    <YAxis axisLine={false} tickLine={false} style={{ fontSize: 12, fill: "#64748b" }} />
                    <Tooltip contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }} />
                    <Legend verticalAlign="top" height={40} iconType="circle" />
                    
                    <Bar dataKey="score" name="คะแนนประเมินปีนี้" fill="#f59e0b" radius={[6, 6, 0, 0]} barSize={24} />
                    <Bar dataKey="target" name="คะแนนเป้าหมาย / ปีที่ผ่านมา" fill="#cbd5e1" radius={[6, 6, 0, 0]} barSize={24} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* 🌟 TABLE ZONE สำหรับข้อมูลประเมินรายองค์ประกอบ (จะปรากฏขึ้นมาคู่อัตโนมัติตอนที่มีข้อมูลกราฟแล้ว) */}
          {evalGraphData.length > 0 && (
            <div style={{ background: "white", padding: 24, borderRadius: 16, marginBottom: 24 }}>
              <h3 style={{ marginBottom: 16 }}>ตารางแสดงรายละเอียดผลคะแนนตามองค์ประกอบคุณภาพ</h3>
              <Table 
                columns={evalTableColumns} 
                dataSource={evalGraphData} 
                rowKey={(r, idx) => `eval-row-${idx}`} 
                pagination={false} 
                bordered 
              />
            </div>
          )}

          {/* TABLE ZONE ระบบเดิม (คงไว้ 100%) */}
          <div style={{ background: "white", padding: 24, borderRadius: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
              <h3 style={{ margin: 0 }}>รายละเอียดคะแนนการประเมินหลักสูตรรายปี</h3>
              
              {/* ฟิลเตอร์เลือกปีสำหรับตารางด้านล่างโดยเฉพาะ */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#f9fafb", padding: "6px 12px", borderRadius: 10, border: "1px solid #e5e7eb" }}>
                <span style={{ fontSize: 13, fontWeight: 500, color: "#4b5563" }}>เลือกปีดูในตาราง:</span>
                <select 
                  value={tableYearFilter} 
                  onChange={(e) => setTableYearFilter(e.target.value)} 
                  style={{ background: "transparent", border: "none", fontSize: 13, fontWeight: 600, color: "#722ed1", cursor: "pointer", outline: "none" }}
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

export default EvaluationPage;
