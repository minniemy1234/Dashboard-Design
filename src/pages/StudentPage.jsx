import React, { useMemo, useState, useEffect, useCallback } from "react";
import { Layout, Table, Card, Row, Col, Empty, Alert, Select, Button, Space, Tag } from "antd";
import Sidebar from "../components/Sidebar";
import { 
  TeamOutlined, 
  UserAddOutlined, 
  TrophyOutlined, 
  FilterOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined,
  DashboardOutlined,
  ReadOutlined,
  CrownOutlined,
  PercentageOutlined,
  PieChartOutlined,
  ReloadOutlined
} from "@ant-design/icons";

import { 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  ResponsiveContainer, 
  Sector,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend
} from "recharts";

import { db } from "../firebase";
import { doc, onSnapshot } from "firebase/firestore";

const { Header, Content } = Layout;

// 🔹 รายการสาขาวิชาเพิ่มเติม
const EXTRA_MAJORS = [
  "วท.ม.วิทยาศาสตร์และเทคโนโลยีผลิตภัณฑ์ธรรมชาติ",
  "วท.ม.เทคโนโลยีเคมีประยุกต์"
];

// 🔹 ฟังก์ชั่นลบ space หน้า-หลัง ออกจาก Key ป้องกัน Error
const getCleanItemValue = (item, keyNames) => {
  if (!item || typeof item !== "object") return null;
  
  const cleanedItem = {};
  try {
    Object.keys(item).forEach((k) => {
      if (k !== null && k !== undefined) {
        cleanedItem[String(k).trim()] = item[k];
      }
    });
  } catch (e) {
    console.error("Key clean error:", e);
  }

  for (const name of keyNames) {
    if (cleanedItem[name] !== undefined && cleanedItem[name] !== null && cleanedItem[name] !== "") {
      return cleanedItem[name];
    }
  }
  return null;
};

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

const renderBarValueLabel = (props) => {
  const { x, y, width, height, value } = props;
  if (value === undefined || value === null || value === 0) return null;
  return (
    <text
      x={(x || 0) + (width || 0) + 6}
      y={(y || 0) + (height || 0) / 2 + 4}
      fill="#334155"
      fontSize={12}
      fontWeight="600"
      textAnchor="start"
    >
      {value.toLocaleString()}
    </text>
  );
};

function StudentPage() {
  const [selectedMajors, setSelectedMajors] = useState([]);
  const [selectedYears, setSelectedYears] = useState([]);
  const [tableEntryYear, setTableEntryYear] = useState(null);
  const [tableSurveyYear, setTableSurveyYear] = useState(null);
  const [dashboardData, setDashboardData] = useState({});
  
  const [activeTotalIndex, setActiveTotalIndex] = useState(null);
  const [activeBachelorIndex, setActiveBachelorIndex] = useState(null);
  const [activeMasterIndex, setActiveMasterIndex] = useState(null);

  const [graphEntryYear, setGraphEntryYear] = useState(null);
  const [graphSurveyYear, setGraphSurveyYear] = useState(null);

  // โหลดข้อมูลจาก localStorage / Firebase
  const loadDashboardData = useCallback(() => {
    const localData = localStorage.getItem("dashboardData");
    if (localData) {
      try {
        const parsed = JSON.parse(localData);
        if (parsed && typeof parsed === "object" && Object.keys(parsed).length > 0) {
          setDashboardData(parsed);
          return;
        }
      } catch (err) {
        console.error("Error parsing local dashboardData:", err);
      }
    }
    setDashboardData({});
  }, []);

  useEffect(() => {
    loadDashboardData();

    const handleStorageChange = () => {
      loadDashboardData();
    };
    window.addEventListener("storage", handleStorageChange);

    let unsubscribe = () => {};
    if (db) {
      const docRef = doc(db, "dashboardData", "main");
      unsubscribe = onSnapshot(
        docRef,
        (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            const localData = localStorage.getItem("dashboardData");
            if (localData && Object.keys(JSON.parse(localData)).length > 0) {
              setDashboardData(prev => ({ ...data, ...prev }));
            }
          }
        },
        (error) => {
          console.error("Firebase Dashboard Listener Error:", error);
        }
      );
    }

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      unsubscribe();
    };
  }, [loadDashboardData]);

  const cleanString = (str) => {
    if (!str) return "";
    return String(str).replace(/\s+/g, '').replace(/['"]+/g, '').trim();
  };

  // 🔹 ฟังก์ชั่นทำความสะอาดและรวมชื่อสาขา
  const cleanMajorName = (majorStr) => {
    if (!majorStr) return "";
    let name = String(majorStr).replace(/\n/g, ' ').trim();
    
    if (name.startsWith("สาขาวิชา")) name = name.replace("สาขาวิชา", "").trim();
    else if (name.startsWith("สาขา")) name = name.replace("สาขา", "").trim();
    else if (name.startsWith("หลักสูตร")) name = name.replace("หลักสูตร", "").trim();

    name = name
      .replace(/\(ภาคปกติ\)/g, "")
      .replace(/ภาคปกติ/g, "")
      .replace(/\(ภาคพิเศษ\)/g, "")
      .replace(/ภาคพิเศษ/g, "")
      .trim();

    if (name.includes("วิทยาการคอมพิวเตอร์")) {
      name = "วิทยาการคอมพิวเตอร์";
    }
    if (name.includes("เทคโนโลยีสารสนเทศ")) {
      name = "เทคโนโลยีสารสนเทศ";
    }
    if (name.includes("วิทยาการและเทคโนโลยีดิจิทัล")) {
      name = "วิทยาการและเทคโนโลยีดิจิทัล";
    }

    return name;
  };

  const extractYear = (yearStr) => {
    if (!yearStr) return "";
    const match = String(yearStr).match(/\d+/);
    if (!match) return "";
    let year = match[0];
    if (year.length === 2) {
      year = "25" + year;
    }
    return year;
  };

  const isMasterOrXMajor = (majorName, code) => {
    if (code) {
      const c = String(code).trim().toUpperCase();
      if (c.startsWith("X") || c.startsWith("XS")) return true;
    }
    if (!majorName) return false;
    const clean = String(majorName).trim();
    return clean.startsWith("วท.ม.") || clean.startsWith("X") || clean.startsWith("x");
  };

  // 🔹 ดึงข้อมูลนิสิตคงอยู่
  const retainData = useMemo(() => {
    if (!dashboardData || Object.keys(dashboardData).length === 0) return [];
    return dashboardData["นิสิตคงอยู่"] || dashboardData["ข้อมูลนิสิตคงอยู่"] || dashboardData["จำนวนนิสิตคงอยู่"] || dashboardData["student_retain"] || dashboardData["student_retain_data"] || [];
  }, [dashboardData]);

  // 🔹 ดึงข้อมูลภาวะการมีงานทำ (ผู้สำเร็จการศึกษา)
  const employmentList = useMemo(() => {
    if (!dashboardData || Object.keys(dashboardData).length === 0) return [];
    if (dashboardData["ภาวะการมีงานทำ"] && Array.isArray(dashboardData["ภาวะการมีงานทำ"]) && dashboardData["ภาวะการมีงานทำ"].length > 0) {
      return dashboardData["ภาวะการมีงานทำ"];
    }
    if (dashboardData["ข้อมูลภาวะการมีงานทำ"] && Array.isArray(dashboardData["ข้อมูลภาวะการมีงานทำ"]) && dashboardData["ข้อมูลภาวะการมีงานทำ"].length > 0) {
      return dashboardData["ข้อมูลภาวะการมีงานทำ"];
    }
    if (dashboardData["employment_status"] && Array.isArray(dashboardData["employment_status"]) && dashboardData["employment_status"].length > 0) {
      return dashboardData["employment_status"];
    }
    if (dashboardData["ผู้สำเร็จการศึกษา"] && Array.isArray(dashboardData["ผู้สำเร็จการศึกษา"]) && dashboardData["ผู้สำเร็จการศึกษา"].length > 0) {
      return dashboardData["ผู้สำเร็จการศึกษา"];
    }
    return dashboardData["graduates"] || [];
  }, [dashboardData]);

  const majorsList = useMemo(() => {
    if (retainData.length === 0) return [];
    const rawMajors = retainData.map(item => cleanMajorName(getCleanItemValue(item, ["ชื่อสาขา", "สาขาวิชา", "สาขา"])));
    const combined = [...new Set([...rawMajors, ...EXTRA_MAJORS])].filter(Boolean);

    const bachelorMajors = combined.filter(m => !isMasterOrXMajor(m)).sort();
    const masterMajors = combined.filter(m => isMasterOrXMajor(m)).sort();

    return [...bachelorMajors, ...masterMajors];
  }, [retainData]);

  const yearsList = useMemo(() => {
    const list = retainData.map(item => extractYear(getCleanItemValue(item, ["ปีที่สำรวจ", "ปีการศึกษาที่รับเข้า", "ปีการศึกษา"])));
    return [...new Set(list)].filter(Boolean).sort();
  }, [retainData]);

  const entryYears = useMemo(() => {
    const list = retainData.map(item => extractYear(getCleanItemValue(item, ["ปีการศึกษาที่รับเข้า", "ปีการศึกษา"])));
    return [...new Set(list)].filter(Boolean).sort().reverse();
  }, [retainData]);

  const surveyYears = useMemo(() => {
    const list = retainData.map(item => extractYear(getCleanItemValue(item, ["ปีที่สำรวจ", "ปีการศึกษา"])));
    return [...new Set(list)].filter(Boolean).sort().reverse();
  }, [retainData]);

  useEffect(() => {
    if (entryYears.length > 0 && !graphEntryYear) {
      setGraphEntryYear(entryYears[0]);
    }
    if (surveyYears.length > 0 && !graphSurveyYear) {
      setGraphSurveyYear(surveyYears[0]);
    }
  }, [entryYears, surveyYears, graphEntryYear, graphSurveyYear]);

  const handleSelectAllMajors = (shouldSelectAll) => {
    setSelectedMajors(shouldSelectAll ? majorsList : []);
  };

  const handleSelectAllYears = (shouldSelectAll) => {
    setSelectedYears(shouldSelectAll ? yearsList : []);
  };

  // 🔹 กรองข้อมูลสำหรับตารางนิสิตคงอยู่
  const filteredRetainTable = useMemo(() => {
    return retainData.filter(item => {
      const itemMajor = cleanMajorName(getCleanItemValue(item, ["ชื่อสาขา", "สาขาวิชา", "สาขา"]));
      const itemEntryYr = extractYear(getCleanItemValue(item, ["ปีการศึกษาที่รับเข้า", "ปีการศึกษา"]));
      const itemSurveyYr = extractYear(getCleanItemValue(item, ["ปีที่สำรวจ", "ปีการศึกษา"]));
      const itemTerm = String(getCleanItemValue(item, ["ภาคเรียน", "ภาคการศึกษา"]) || "").trim();
      
      const majorMatch = selectedMajors.length === 0 || selectedMajors.includes(itemMajor);
      const yearMatch = selectedYears.length === 0 || selectedYears.includes(itemSurveyYr) || selectedYears.includes(itemEntryYr);
      const termMatch = itemTerm === "ปลาย" || itemTerm === "ภาคปลาย"; 
      
      const tableEntryMatch = !tableEntryYear || itemEntryYr === tableEntryYear;
      const tableSurveyMatch = !tableSurveyYear || itemSurveyYr === tableSurveyYear;

      return majorMatch && yearMatch && termMatch && tableEntryMatch && tableSurveyMatch;
    });
  }, [retainData, selectedMajors, selectedYears, tableEntryYear, tableSurveyYear]);

  // 🔹 คำนวณ KPI สถิติสำคัญทั้งหมด
  const studentStats = useMemo(() => {
    let totalAdmitted = 0;
    let totalRetained = 0;

    let bachelorAdmitted = 0;
    let bachelorRetained = 0;

    let masterAdmitted = 0;
    let masterRetained = 0;

    const cleanedSelectedMajors = selectedMajors.map(m => cleanString(m));

    retainData.forEach(item => {
      const itemMajor = cleanMajorName(getCleanItemValue(item, ["ชื่อสาขา", "สาขาวิชา", "สาขา"]));
      const itemYear = extractYear(getCleanItemValue(item, ["ปีที่สำรวจ", "ปีการศึกษาที่รับเข้า", "ปีการศึกษา"]));
      const itemTerm = String(getCleanItemValue(item, ["ภาคเรียน", "ภาคการศึกษา"]) || "").trim();
      const amt = Number(getCleanItemValue(item, ["จำนวน", "รวม"]) || 0);
      const code = String(getCleanItemValue(item, ["รหัสสาขา"]) || "").trim().toUpperCase();

      const majorMatch = selectedMajors.length === 0 || cleanedSelectedMajors.includes(cleanString(itemMajor));
      const yearMatch = selectedYears.length === 0 || selectedYears.includes(itemYear);

      if (majorMatch && yearMatch) {
        const isMaster = isMasterOrXMajor(itemMajor, code);

        if (itemTerm === "ต้น" || itemTerm === "ภาคต้น") {
          totalAdmitted += amt;
          if (isMaster) masterAdmitted += amt;
          else bachelorAdmitted += amt;
        }
        if (itemTerm === "ปลาย" || itemTerm === "ภาคปลาย") {
          totalRetained += amt;
          if (isMaster) masterRetained += amt;
          else bachelorRetained += amt;
        }
      }
    });

    // 🎯 คำนวณผู้สำเร็จการศึกษา
    const trackedRowKeys = new Set();
    let totalGraduates = 0;

    if (Array.isArray(employmentList)) {
      employmentList.forEach((item) => {
        const rawMajor = getCleanItemValue(item, ["ชื่อสาขา", "สาขาวิชา", "สาขา"]);
        const cleanName = String(rawMajor || "").trim();

        if (!cleanName || cleanName.includes("รวม") || cleanName.includes("จำนวน") || cleanName === "-") return;

        const gradMajorClean = cleanMajorName(rawMajor);
        const rawYear = getCleanItemValue(item, ["ปีการศึกษา", "ปีสำเร็จการศึกษา", "ปีที่สำเร็จ", "ปีการศึกษาที่รับเข้า", "ปีที่สำรวจ"]);
        const gradYear = extractYear(rawYear);

        const rowKey = `${gradMajorClean}_${gradYear}`;
        if (trackedRowKeys.has(rowKey)) return;

        const rawAmt = getCleanItemValue(item, ["ผู้สำเร็จการศึกษา", "จำนวนผู้สำเร็จการศึกษา"]);
        const amt = Number(rawAmt || 0);

        const yearMatch = selectedYears.length === 0 || selectedYears.includes(gradYear);
        const majorMatch = selectedMajors.length === 0 || selectedMajors.includes(gradMajorClean);

        if (majorMatch && yearMatch && amt > 0) {
          totalGraduates += amt;
          trackedRowKeys.add(rowKey);
        }
      });
    }

    const totalLost = totalAdmitted > totalRetained ? totalAdmitted - totalRetained : 0;
    const dropRate = totalAdmitted > 0 ? ((totalLost / totalAdmitted) * 100).toFixed(2) : "0.00";
    const retentionRate = totalAdmitted > 0 ? ((totalRetained / totalAdmitted) * 100).toFixed(2) : "0.00";

    const bachelorLost = bachelorAdmitted > bachelorRetained ? bachelorAdmitted - bachelorRetained : 0;
    const masterLost = masterAdmitted > masterRetained ? masterAdmitted - masterRetained : 0;

    return {
      admitted: totalAdmitted,
      retained: totalRetained,
      lost: totalLost,
      dropRate,
      bachelorAdmitted,
      bachelorRetained,
      bachelorLost,
      masterAdmitted,
      masterRetained,
      masterLost,
      retentionRate,
      graduates: totalGraduates
    };
  }, [retainData, employmentList, selectedMajors, selectedYears]);

  const totalRetainedPercent = studentStats.admitted > 0 ? ((studentStats.retained / studentStats.admitted) * 100).toFixed(1) : "0";
  const totalLostPercent = studentStats.admitted > 0 ? ((studentStats.lost / studentStats.admitted) * 100).toFixed(1) : "0";

  // 🔹 ข้อมูล Pie Chart ทั้ง 3 วง
  const totalPieData = useMemo(() => {
    return [
      { name: "นิสิตคงอยู่จริง (ภาคปลาย)", value: studentStats.retained },
      { name: "จำนวนนิสิตที่ลดลง/หายไป", value: studentStats.lost }
    ];
  }, [studentStats.retained, studentStats.lost]);

  const bachelorPieData = useMemo(() => {
    return [
      { name: "คงอยู่จริง (ภาคปลาย)", value: studentStats.bachelorRetained },
      { name: "ลดลง/หายไป", value: studentStats.bachelorLost }
    ];
  }, [studentStats.bachelorRetained, studentStats.bachelorLost]);

  const masterPieData = useMemo(() => {
    return [
      { name: "คงอยู่จริง (ภาคปลาย)", value: studentStats.masterRetained },
      { name: "ลดลง/หายไป", value: studentStats.masterLost }
    ];
  }, [studentStats.masterRetained, studentStats.masterLost]);

  // 🔹 คำนวณข้อมูลกราฟเปรียบเทียบภาคต้น vs ภาคปลาย
  const rawGraphData = useMemo(() => {
    if (retainData.length === 0) return [];

    const grouped = {};

    majorsList.forEach(majorName => {
      const key = cleanString(majorName);
      if (key) {
        grouped[key] = { name: majorName, earlyTerm: 0, lateTerm: 0 };
      }
    });

    retainData.forEach(item => {
      const itemEntryYear = extractYear(getCleanItemValue(item, ["ปีการศึกษาที่รับเข้า", "ปีการศึกษา"]));
      const itemSurveyYear = extractYear(getCleanItemValue(item, ["ปีที่สำรวจ", "ปีการศึกษา"]));

      if (itemEntryYear !== graphEntryYear || itemSurveyYear !== graphSurveyYear) return;

      const rawName = cleanMajorName(getCleanItemValue(item, ["ชื่อสาขา", "สาขาวิชา", "สาขา"]));
      if (!rawName) return;

      const majorKey = cleanString(rawName);
      const term = String(getCleanItemValue(item, ["ภาคเรียน", "ภาคการศึกษา"]) || "").trim();
      const amt = Number(getCleanItemValue(item, ["จำนวน", "รวม"]) || 0);

      if (!grouped[majorKey]) {
        grouped[majorKey] = { name: rawName, earlyTerm: 0, lateTerm: 0 };
      }

      if (term === "ต้น" || term === "ภาคต้น") grouped[majorKey].earlyTerm += amt;
      else if (term === "ปลาย" || term === "ภาคปลาย") grouped[majorKey].lateTerm += amt;
    });

    return Object.values(grouped);
  }, [retainData, graphEntryYear, graphSurveyYear, majorsList]);

  const bachelorGraphData = useMemo(() => {
    return rawGraphData
      .filter(item => !isMasterOrXMajor(item.name) && (item.earlyTerm + item.lateTerm) > 0)
      .sort((a, b) => (b.earlyTerm + b.lateTerm) - (a.earlyTerm + a.lateTerm));
  }, [rawGraphData]);

  const masterGraphData = useMemo(() => {
    return rawGraphData
      .filter(item => isMasterOrXMajor(item.name) && (item.earlyTerm + item.lateTerm) > 0)
      .sort((a, b) => (b.earlyTerm + b.lateTerm) - (a.earlyTerm + a.lateTerm));
  }, [rawGraphData]);

  // 🔹 คอลัมน์ตาราง
  const columns = [
    { title: "ลำดับ", key: "index", width: 60, align: "center", render: (t, r, idx) => idx + 1 },
    { 
      title: "ปีที่รับเข้า", 
      key: "entryYear", 
      align: "center", 
      render: (text, record) => <Tag color="blue">ปี {getCleanItemValue(record, ["ปีการศึกษาที่รับเข้า", "ปีการศึกษา"]) || "-"}</Tag> 
    },
    { 
      title: "ปีที่สำรวจ", 
      key: "surveyYear", 
      align: "center", 
      render: (text, record) => <Tag color="green">ปี {getCleanItemValue(record, ["ปีที่สำรวจ"]) || "-"}</Tag> 
    },
    { title: "ภาคเรียน", key: "term", align: "center", render: () => "ปลาย" },
    { title: "สาขาวิชา", key: "major", render: (text, record) => cleanMajorName(getCleanItemValue(record, ["ชื่อสาขา", "สาขาวิชา"])) },
    { 
      title: "จำนวนนิสิตคงอยู่", 
      key: "amount",
      align: "right",
      render: (text, record) => <strong>{Number(getCleanItemValue(record, ["จำนวน", "รวม"]) || 0).toLocaleString()} คน</strong>
    },
  ];

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sidebar />
      <Layout style={{ background: "#f8fafc" }}>
        
        {/* MODERN HEADER */}
        <Header style={{ background: "white", padding: "14px 32px", height: "auto", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #e2e8f0" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "0px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "0px" }}>
              <h2 style={{ margin: 0, fontSize: "20px", fontWeight: "700", color: "#0f172a", lineHeight: "1.2" }}>
                ข้อมูลสถิตินิสิต
              </h2>
              <Tag color="blue" style={{ borderRadius: "12px", padding: "1px 10px", fontWeight: "600" }}>
                คณะวิทยาศาสตร์ ศรีราชา
              </Tag>
            </div>
            <div style={{ color: "#64748b", fontSize: "13px", lineHeight: "1.2", margin: "2px 0 0 0" }}>
              รายงานวิเคราะห์ยอดรับเข้า ยอดคงอยู่ การสำเร็จการศึกษา และการติดตามอัตราการพ้นสภาพ
            </div>
          </div>

          <Space size="middle">
            <Button 
              shape="circle" 
              icon={<ReloadOutlined />} 
              onClick={loadDashboardData}
              style={{ borderColor: "#cbd5e1", color: "#64748b" }}
            />
          </Space>
        </Header>

        <Content style={{ padding: "24px 32px" }}>
          
          {/* 🔹 ฟิลเตอร์หลักด้านบน */}
          <div style={{ background: "#ffffff", padding: 20, borderRadius: 16, marginBottom: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.02)", border: "1px solid #e2e8f0" }}>
            <Row gutter={[16, 16]} align="bottom">
              
              <Col xs={24} md={12}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <span style={{ fontWeight: 600, fontSize: 13, color: "#334155" }}>สาขาวิชา</span>
                  <Button 
                    type="link" 
                    size="small" 
                    onClick={() => handleSelectAllMajors(selectedMajors.length !== majorsList.length)}
                    style={{ padding: 0, height: "auto", fontSize: 12, color: "#0284c7" }}
                  >
                    {majorsList.length > 0 && selectedMajors.length === majorsList.length ? "ยกเลิกทั้งหมด" : "เลือกทั้งหมด"}
                  </Button>
                </div>
                <Select
                  mode="multiple"
                  allowClear
                  style={{ width: '100%' }}
                  placeholder="เลือกทั้งหมด (แสดงทุกสาขาวิชา)"
                  value={selectedMajors}
                  onChange={(val) => setSelectedMajors(val)}
                  maxTagCount="responsive"
                  size="large"
                >
                  {majorsList.map(m => {
                    const isMaster = isMasterOrXMajor(m);
                    return (
                      <Select.Option key={m} value={m}>
                        <div style={{ 
                          display: "flex", 
                          justify: "space-between", 
                          alignItems: "center",
                          backgroundColor: isMaster ? "#f0f9ff" : "transparent", 
                          padding: isMaster ? "2px 8px" : "0",
                          borderRadius: isMaster ? 6 : 0,
                          color: isMaster ? "#0284c7" : "inherit",
                          fontWeight: isMaster ? 600 : 400
                        }}>
                          <span>{m}</span>
                          {isMaster && (
                            <span style={{ fontSize: 10, background: "#bae6fd", color: "#0369a1", padding: "1px 6px", borderRadius: 4, marginLeft: 8 }}>
                              ป.โท
                            </span>
                          )}
                        </div>
                      </Select.Option>
                    );
                  })}
                </Select>
              </Col>

              <Col xs={24} md={12}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <span style={{ fontWeight: 600, fontSize: 13, color: "#334155" }}>ปีการศึกษา</span>
                  <Button 
                    type="link" 
                    size="small" 
                    onClick={() => handleSelectAllYears(selectedYears.length !== yearsList.length)}
                    style={{ padding: 0, height: "auto", fontSize: 12, color: "#0284c7" }}
                  >
                    {yearsList.length > 0 && selectedYears.length === yearsList.length ? "ยกเลิกทั้งหมด" : "เลือกทั้งหมด"}
                  </Button>
                </div>
                <Select
                  mode="multiple"
                  allowClear
                  style={{ width: '100%' }}
                  placeholder="เลือกทั้งหมด (แสดงทุกปี)"
                  value={selectedYears}
                  onChange={(val) => setSelectedYears(val)}
                  maxTagCount="responsive"
                  size="large"
                >
                  {yearsList.map(y => (
                    <Select.Option key={y} value={y}>ปี {y}</Select.Option>
                  ))}
                </Select>
              </Col>
            </Row>
          </div>

          {retainData.length === 0 ? (
            <Card style={{ borderRadius: 16, padding: "40px 0", textAlign: "center" }}>
              <Empty description="ไม่พบข้อมูลสถิตินิสิตคงอยู่ กรุณาเช็กไฟล์อัปโหลดในระบบคลัง" />
            </Card>
          ) : (
            <>
              {/* 🔹 สถิติตัวชี้วัดสำคัญ 5 รายการหลัก (KPI 5 การ์ด) */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: "#0f172a", display: "flex", alignItems: "center", gap: 8 }}>
                    <DashboardOutlined style={{ color: "#0284c7" }} /> สถิติตัวชี้วัดสำคัญ (Key Performance Indicators)
                  </h3>
                </div>

                <Row gutter={[16, 16]}>
                  {/* KPI 1 */}
                  <Col xs={24} sm={12} md={4.8} style={{ flex: "0 0 20%", maxWidth: "20%" }}>
                    <div style={{ background: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)", padding: "20px", borderRadius: 16, color: "#ffffff", boxShadow: "0 4px 14px rgba(2, 132, 199, 0.25)", position: "relative", minHeight: 130 }}>
                      <div style={{ color: "#bae6fd", fontSize: 11, fontWeight: 600 }}>ภาคต้น </div>
                      <h4 style={{ margin: "4px 0", fontSize: 13, color: "#f0f9ff", fontWeight: 500 }}>นิสิตรับเข้าศึกษา</h4>
                      <h2 style={{ margin: 0, fontSize: 26, fontWeight: "800", color: "#ffffff" }}>
                        {studentStats.admitted.toLocaleString()} <span style={{ fontSize: 12, fontWeight: "400", color: "#e0f2fe" }}>คน</span>
                      </h2>
                      <UserAddOutlined style={{ fontSize: 32, color: "#ffffff", position: "absolute", right: 16, bottom: 16, opacity: 0.25 }} />
                    </div>
                  </Col>

                  {/* KPI 2 */}
                  <Col xs={24} sm={12} md={4.8} style={{ flex: "0 0 20%", maxWidth: "20%" }}>
                    <div style={{ background: "linear-gradient(135deg, #059669 0%, #047857 100%)", padding: "20px", borderRadius: 16, color: "#ffffff", boxShadow: "0 4px 14px rgba(5, 150, 105, 0.25)", position: "relative", minHeight: 130 }}>
                      <div style={{ color: "#a7f3d0", fontSize: 11, fontWeight: 600 }}>ภาคปลาย </div>
                      <h4 style={{ margin: "4px 0", fontSize: 13, color: "#ecfdf5", fontWeight: 500 }}>นิสิตคงอยู่ปัจจุบัน</h4>
                      <h2 style={{ margin: 0, fontSize: 26, fontWeight: "800", color: "#ffffff" }}>
                        {studentStats.retained.toLocaleString()} <span style={{ fontSize: 12, fontWeight: "400", color: "#d1fae5" }}>คน</span>
                      </h2>
                      <TeamOutlined style={{ fontSize: 32, color: "#ffffff", position: "absolute", right: 16, bottom: 16, opacity: 0.25 }} />
                    </div>
                  </Col>

                  {/* KPI 3 */}
                  <Col xs={24} sm={12} md={4.8} style={{ flex: "0 0 20%", maxWidth: "20%" }}>
                    <div style={{ background: "linear-gradient(135deg, #8fbc1d 0%, #7ca818 100%)", padding: "20px", borderRadius: 16, color: "#ffffff", boxShadow: "0 4px 14px rgba(143, 188, 29, 0.25)", position: "relative", minHeight: 130 }}>
                      <div style={{ color: "#fef3c7", fontSize: 11, fontWeight: 600 }}>ภาวะการมีงานทำประจำปี</div>
                      <h4 style={{ margin: "4px 0", fontSize: 13, color: "#fffbeb", fontWeight: 500 }}>สำเร็จการศึกษา (ตามปี)</h4>
                      <h2 style={{ margin: 0, fontSize: 26, fontWeight: "800", color: "#ffffff" }}>
                        {studentStats.graduates.toLocaleString()} <span style={{ fontSize: 12, fontWeight: "400", color: "#fef3c7" }}>คน</span>
                      </h2>
                      <TrophyOutlined style={{ fontSize: 32, color: "#ffffff", position: "absolute", right: 16, bottom: 16, opacity: 0.25 }} />
                    </div>
                  </Col>

                  {/* KPI 4 */}
                  <Col xs={24} sm={12} md={4.8} style={{ flex: "0 0 20%", maxWidth: "20%" }}>
                    <div style={{ background: "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)", padding: "20px", borderRadius: 16, color: "#ffffff", boxShadow: "0 4px 14px rgba(124, 58, 237, 0.25)", position: "relative", minHeight: 130 }}>
                      <div style={{ color: "#ddd6fe", fontSize: 11, fontWeight: 600 }}>ภาวะการมีงานทำประจำปี</div>
                      <h4 style={{ margin: "4px 0", fontSize: 13, color: "#f5f3ff", fontWeight: 500 }}>สำเร็จการศึกษา (ตามเกณฑ์)</h4>
                      <h2 style={{ margin: 0, fontSize: 26, fontWeight: "800", color: "#ffffff" }}>
                        {studentStats.graduates.toLocaleString()} <span style={{ fontSize: 12, fontWeight: "400", color: "#ddd6fe" }}>คน</span>
                      </h2>
                      <CheckCircleOutlined style={{ fontSize: 32, color: "#ffffff", position: "absolute", right: 16, bottom: 16, opacity: 0.25 }} />
                    </div>
                  </Col>

                  {/* KPI 5 */}
                  <Col xs={24} sm={12} md={4.8} style={{ flex: "0 0 20%", maxWidth: "20%" }}>
                    <div style={{ background: "linear-gradient(135deg, #d97706 0%, #b45309 100%)", padding: "20px", borderRadius: 16, color: "#ffffff", boxShadow: "0 4px 14px rgba(217, 119, 6, 0.25)", position: "relative", minHeight: 130 }}>
                      <div style={{ color: "#fef3c7", fontSize: 11, fontWeight: 600 }}>ภาพรวมระบบ</div>
                      <h4 style={{ margin: "4px 0", fontSize: 13, color: "#fffbeb", fontWeight: 500 }}>อัตราการคงอยู่เฉลี่ย</h4>
                      <h2 style={{ margin: 0, fontSize: 26, fontWeight: "800", color: "#ffffff" }}>
                        {studentStats.retentionRate} <span style={{ fontSize: 14, fontWeight: "600", color: "#fef3c7" }}>%</span>
                      </h2>
                      <PercentageOutlined style={{ fontSize: 32, color: "#ffffff", position: "absolute", right: 16, bottom: 16, opacity: 0.25 }} />
                    </div>
                  </Col>
                </Row>
              </div>

              {/*  แถวแสดงการ์ดสรุปยอด นิสิตระดับปริญญาตรี และ ปริญญาโท */}
              <div style={{ marginBottom: 24 }}>
                <Row gutter={[16, 16]}>
                  {/* 🎓 การ์ดนิสิตระดับปริญญาตรี */}
                  <Col xs={24} md={12}>
                    <div style={{ background: "#ffffff", padding: 20, borderRadius: 16, border: "1px solid #e2e8f0", boxShadow: "0 2px 8px rgba(0,0,0,0.02)", height: "100%" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <ReadOutlined style={{ fontSize: 22, color: "#0284c7" }} />
                          <div>
                            <h4 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#0369a1" }}>นิสิตระดับปริญญาตรี</h4>
                            <span style={{ fontSize: 11, color: "#64748b" }}>รหัสสาขาปกติ</span>
                          </div>
                        </div>
                      </div>

                      <Row gutter={12}>
                        <Col span={12}>
                          <div style={{ background: "#f0f9ff", padding: 12, borderRadius: 12, border: "1px solid #bae6fd" }}>
                            <div style={{ fontSize: 11, color: "#0369a1" }}>ภาคต้น (รับเข้า)</div>
                            <div style={{ fontSize: 20, fontWeight: "bold", color: "#0284c7" }}>
                              {studentStats.bachelorAdmitted.toLocaleString()} <span style={{ fontSize: 12, fontWeight: "normal" }}>คน</span>
                            </div>
                          </div>
                        </Col>
                        <Col span={12}>
                          <div style={{ background: "#f0fdf4", padding: 12, borderRadius: 12, border: "1px solid #bbf7d0" }}>
                            <div style={{ fontSize: 11, color: "#15803d" }}>ภาคปลาย (คงอยู่)</div>
                            <div style={{ fontSize: 20, fontWeight: "bold", color: "#16a34a" }}>
                              {studentStats.bachelorRetained.toLocaleString()} <span style={{ fontSize: 12, fontWeight: "normal" }}>คน</span>
                            </div>
                          </div>
                        </Col>
                      </Row>
                    </div>
                  </Col>

                  {/* การ์ดนิสิตระดับปริญญาโท */}
                  <Col xs={24} md={12}>
                    <div style={{ background: "#ffffff", padding: 20, borderRadius: 16, border: "1px solid #e2e8f0", boxShadow: "0 2px 8px rgba(0,0,0,0.02)", height: "100%" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <CrownOutlined style={{ fontSize: 22, color: "#7c3aed" }} />
                          <div>
                            <h4 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#6d28d9" }}>นิสิตระดับปริญญาโท</h4>
                            <span style={{ fontSize: 11, color: "#64748b" }}>รหัสสาขาขึ้นต้นด้วย X หรือ XS หรือ วท.ม.</span>
                          </div>
                        </div>
                      </div>

                      <Row gutter={12}>
                        <Col span={12}>
                          <div style={{ background: "#f5f3ff", padding: 12, borderRadius: 12, border: "1px solid #ddd6fe" }}>
                            <div style={{ fontSize: 11, color: "#6d28d9" }}>ภาคต้น (รับเข้า)</div>
                            <div style={{ fontSize: 20, fontWeight: "bold", color: "#7c3aed" }}>
                              {studentStats.masterAdmitted.toLocaleString()} <span style={{ fontSize: 12, fontWeight: "normal" }}>คน</span>
                            </div>
                          </div>
                        </Col>
                        <Col span={12}>
                          <div style={{ background: "#fdf4ff", padding: 12, borderRadius: 12, border: "1px solid #f5d0fe" }}>
                            <div style={{ fontSize: 11, color: "#a21caf" }}>ภาคปลาย (คงอยู่)</div>
                            <div style={{ fontSize: 20, fontWeight: "bold", color: "#c026d3" }}>
                              {studentStats.masterRetained.toLocaleString()} <span style={{ fontSize: 12, fontWeight: "normal" }}>คน</span>
                            </div>
                          </div>
                        </Col>
                      </Row>
                    </div>
                  </Col>
                </Row>

                <Alert
                  message={<b style={{ fontSize: "14px", color: "#0f172a" }}>บทวิเคราะห์สถิติและอัตราการสูญเสีย (Executive Retention Analysis)</b>}
                  description={
                    <div style={{ fontSize: "13px", color: "#334155", marginTop: 6, lineHeight: "1.6" }}>
                      จากการประมวลผลฐานข้อมูล {selectedYears.length > 0 ? `ปีการศึกษา ${selectedYears.join(", ")}` : "ทุกปีการศึกษา"} 
                      {selectedMajors.length > 0 ? ` สาขาวิชา${selectedMajors.join(", ")}` : " ทุกสาขาวิชา"} 
                      มียอดรับเข้าศึกษาภาคต้นรวม <b style={{ color: "#0284c7" }}>{studentStats.admitted.toLocaleString()} คน</b> และมียอดคงอยู่ภาคปลายรวม <b style={{ color: "#059669" }}>{studentStats.retained.toLocaleString()} คน</b> 
                      เมื่อคำนวณเปรียบเทียบหักลบพบนิสิตที่มีการลาออก / พ้นสภาพ / ถูกคัดชื่อ <b style={{ color: "#e11d48" }}>{studentStats.lost.toLocaleString()} คน</b> (คิดเป็นอัตราลดลงของจำนวนนิสิตเป็น <b style={{ color: "#e11d48" }}>{studentStats.dropRate}%</b>) 
                      ส่งผลให้อัตราการคงอยู่ในระบบภาพรวมคงอยู่ที่ <b style={{ color: "#0284c7" }}>{studentStats.retentionRate}%</b>
                    </div>
                  }
                  type="info"
                  showIcon
                  icon={<InfoCircleOutlined style={{ color: "#0284c7" }} />}
                  style={{ marginTop: 16, borderRadius: 16, border: "1px solid #bae6fd", backgroundColor: "#f0f9ff" }}
                />
              </div>

              {/*  กราฟวงกลม 3 วง  */}
              <div style={{ marginBottom: 24 }}>
                <Row gutter={[16, 16]}>
                  {/*  วงกลมที่ 1: สัดส่วนภาพรวมทั้งหมด (อันเดิม) */}
                  <Col xs={24} md={8}>
                    <div style={{ background: "white", padding: 20, borderRadius: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.03)", height: "100%", border: "1px solid #e2e8f0", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                      <div>
                        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#0f172a", display: "flex", alignItems: "center", gap: 6 }}>
                          <PieChartOutlined style={{ color: "#059669" }} /> สัดส่วนการคงอยู่ (ภาพรวม)
                        </h3>
                        <div style={{ color: "#64748b", fontSize: 11, marginTop: 2 }}>เปรียบเทียบจากสถิตินิสิตรับเข้าศึกษาทั้งหมด</div>
                      </div>

                      <div style={{ height: 190, position: "relative", margin: "8px 0" }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie 
                              activeIndex={activeTotalIndex}
                              activeShape={renderActiveShape}
                              data={totalPieData} 
                              dataKey="value" 
                              nameKey="name" 
                              innerRadius={50} 
                              outerRadius={70} 
                              paddingAngle={5} 
                              cx="50%" 
                              cy="50%"
                              onMouseEnter={(data, index) => setActiveTotalIndex(index)}
                              onMouseLeave={() => setActiveTotalIndex(null)}
                            >
                              <Cell fill="#059669" style={{ outline: "none" }} />
                              <Cell fill="#e11d48" style={{ outline: "none" }} />
                            </Pie>
                            <Tooltip 
                              contentStyle={{ borderRadius: 8, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }}
                              formatter={(value) => `${Number(value).toLocaleString()} คน`} 
                            />
                          </PieChart>
                        </ResponsiveContainer>

                        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", textAlign: "center", pointerEvents: "none" }}>
                          <span style={{ fontSize: 10, color: "#64748b", display: "block", fontWeight: 500 }}>รับเข้า (รวม)</span>
                          <h4 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#0f172a" }}>
                            {studentStats.admitted.toLocaleString()}
                          </h4>
                          <span style={{ fontSize: 9, color: "#94a3b8" }}>คน</span>
                        </div>
                      </div>

                      <div style={{ display: "flex", flexDirection: "column", gap: 6, borderTop: "1px solid #f1f5f9", paddingTop: 10, fontSize: 12 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div style={{ display: "flex", alignItems: "center" }}>
                            <span style={{ display: "inline-block", width: 8, height: 8, background: "#059669", borderRadius: "50%", marginRight: 6 }}></span>
                            <span style={{ color: "#334155" }}>จำนวนนิสิตคงอยู่</span>
                          </div>
                          <div>
                            <strong style={{ color: "#059669" }}>{studentStats.retained.toLocaleString()} คน</strong>
                            <span style={{ fontSize: 10, color: "#64748b", marginLeft: 4 }}>({totalRetainedPercent}%)</span>
                          </div>
                        </div>

                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div style={{ display: "flex", alignItems: "center" }}>
                            <span style={{ display: "inline-block", width: 8, height: 8, background: "#e11d48", borderRadius: "50%", marginRight: 6 }}></span>
                            <span style={{ color: "#334155" }}>จำนวนนิสิตที่ลดลง</span>
                          </div>
                          <div>
                            <strong style={{ color: "#e11d48" }}>{studentStats.lost.toLocaleString()} คน</strong>
                            <span style={{ fontSize: 10, color: "#64748b", marginLeft: 4 }}>({totalLostPercent}%)</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Col>

                  {/* วงกลมที่ 2: สัดส่วนระดับปริญญาตรี */}
                  <Col xs={24} md={8}>
                    <div style={{ background: "white", padding: 20, borderRadius: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.03)", height: "100%", border: "1px solid #e2e8f0", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                      <div>
                        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#0369a1", display: "flex", alignItems: "center", gap: 6 }}>
                          <ReadOutlined /> สัดส่วนคงอยู่ (ปริญญาตรี)
                        </h3>
                        <div style={{ color: "#64748b", fontSize: 11, marginTop: 2 }}>เฉพาะระดับปริญญาตรี</div>
                      </div>

                      <div style={{ height: 190, position: "relative", margin: "8px 0" }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie 
                              activeIndex={activeBachelorIndex}
                              activeShape={renderActiveShape}
                              data={bachelorPieData} 
                              dataKey="value" 
                              nameKey="name" 
                              innerRadius={50} 
                              outerRadius={70} 
                              paddingAngle={5} 
                              cx="50%" 
                              cy="50%"
                              onMouseEnter={(data, index) => setActiveBachelorIndex(index)}
                              onMouseLeave={() => setActiveBachelorIndex(null)}
                            >
                              <Cell fill="#0284c7" style={{ outline: "none" }} />
                              <Cell fill="#e11d48" style={{ outline: "none" }} />
                            </Pie>
                            <Tooltip 
                              contentStyle={{ borderRadius: 8, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }}
                              formatter={(value) => `${Number(value).toLocaleString()} คน`} 
                            />
                          </PieChart>
                        </ResponsiveContainer>

                        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", textAlign: "center", pointerEvents: "none" }}>
                          <span style={{ fontSize: 10, color: "#64748b", display: "block" }}>รับเข้า (ป.ตรี)</span>
                          <h4 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#0f172a" }}>
                            {studentStats.bachelorAdmitted.toLocaleString()}
                          </h4>
                          <span style={{ fontSize: 9, color: "#94a3b8" }}>คน</span>
                        </div>
                      </div>

                      <div style={{ display: "flex", flexDirection: "column", gap: 6, borderTop: "1px solid #f1f5f9", paddingTop: 10, fontSize: 12 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div style={{ display: "flex", alignItems: "center" }}>
                            <span style={{ display: "inline-block", width: 8, height: 8, background: "#0284c7", borderRadius: "50%", marginRight: 6 }}></span>
                            <span style={{ color: "#334155" }}>จำนวนนิสิตคงอยู่</span>
                          </div>
                          <div>
                            <strong style={{ color: "#0284c7" }}>{studentStats.bachelorRetained.toLocaleString()} คน</strong>
                          </div>
                        </div>

                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div style={{ display: "flex", alignItems: "center" }}>
                            <span style={{ display: "inline-block", width: 8, height: 8, background: "#e11d48", borderRadius: "50%", marginRight: 6 }}></span>
                            <span style={{ color: "#334155" }}>จำนวนนิสิตที่ลดลง</span>
                          </div>
                          <div>
                            <strong style={{ color: "#e11d48" }}>{studentStats.bachelorLost.toLocaleString()} คน</strong>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Col>

                  {/* วงกลมที่ 3: สัดส่วนระดับปริญญาโท */}
                  <Col xs={24} md={8}>
                    <div style={{ background: "white", padding: 20, borderRadius: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.03)", height: "100%", border: "1px solid #e2e8f0", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                      <div>
                        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#6d28d9", display: "flex", alignItems: "center", gap: 6 }}>
                          <CrownOutlined /> สัดส่วนคงอยู่ (ปริญญาโท)
                        </h3>
                        <div style={{ color: "#64748b", fontSize: 11, marginTop: 2 }}>เฉพาะระดับปริญญาโท</div>
                      </div>

                      <div style={{ height: 190, position: "relative", margin: "8px 0" }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie 
                              activeIndex={activeMasterIndex}
                              activeShape={renderActiveShape}
                              data={masterPieData} 
                              dataKey="value" 
                              nameKey="name" 
                              innerRadius={50} 
                              outerRadius={70} 
                              paddingAngle={5} 
                              cx="50%" 
                              cy="50%"
                              onMouseEnter={(data, index) => setActiveMasterIndex(index)}
                              onMouseLeave={() => setActiveMasterIndex(null)}
                            >
                              <Cell fill="#7c3aed" style={{ outline: "none" }} />
                              <Cell fill="#f97316" style={{ outline: "none" }} />
                            </Pie>
                            <Tooltip 
                              contentStyle={{ borderRadius: 8, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }}
                              formatter={(value) => `${Number(value).toLocaleString()} คน`} 
                            />
                          </PieChart>
                        </ResponsiveContainer>

                        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", textAlign: "center", pointerEvents: "none" }}>
                          <span style={{ fontSize: 10, color: "#64748b", display: "block" }}>รับเข้า (ป.โท)</span>
                          <h4 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#0f172a" }}>
                            {studentStats.masterAdmitted.toLocaleString()}
                          </h4>
                          <span style={{ fontSize: 9, color: "#94a3b8" }}>คน</span>
                        </div>
                      </div>

                      <div style={{ display: "flex", flexDirection: "column", gap: 6, borderTop: "1px solid #f1f5f9", paddingTop: 10, fontSize: 12 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div style={{ display: "flex", alignItems: "center" }}>
                            <span style={{ display: "inline-block", width: 8, height: 8, background: "#7c3aed", borderRadius: "50%", marginRight: 6 }}></span>
                            <span style={{ color: "#334155" }}>จำนวนนิสิตคงอยู่</span>
                          </div>
                          <div>
                            <strong style={{ color: "#7c3aed" }}>{studentStats.masterRetained.toLocaleString()} คน</strong>
                          </div>
                        </div>

                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div style={{ display: "flex", alignItems: "center" }}>
                            <span style={{ display: "inline-block", width: 8, height: 8, background: "#f97316", borderRadius: "50%", marginRight: 6 }}></span>
                            <span style={{ color: "#334155" }}>จำนวนนิสิตที่ลดลง</span>
                          </div>
                          <div>
                            <strong style={{ color: "#f97316" }}>{studentStats.masterLost.toLocaleString()} คน</strong>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Col>
                </Row>
              </div>

              {/*  ตารางจำนวนนิสิตคงอยู่ */}
              <Row style={{ marginBottom: 24 }}>
                <Col span={24}>
                  <div style={{ background: "white", padding: 24, borderRadius: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.03)", border: "1px solid #e2e8f0" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
                      <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#0f172a" }}>ตารางจำนวนนิสิตคงอยู่ (จำแนกตามรุ่นปีที่รับเข้า และปีที่สำรวจ)</h3>

                      <Space wrap>
                        <FilterOutlined style={{ color: "#0284c7", fontSize: 13 }} />
                        <span style={{ fontSize: 13, color: "#475569", fontWeight: 500 }}>ปีที่รับเข้า:</span>
                        <Select
                          allowClear
                          placeholder="ทั้งหมด"
                          value={tableEntryYear}
                          onChange={(val) => setTableEntryYear(val)}
                          style={{ width: 110 }}
                          size="small"
                        >
                          {entryYears.map(y => (
                            <Select.Option key={y} value={y}>ปี {y}</Select.Option>
                          ))}
                        </Select>

                        <span style={{ fontSize: 13, color: "#475569", fontWeight: 500, marginLeft: 8 }}>ปีที่สำรวจ:</span>
                        <Select
                          allowClear
                          placeholder="ทั้งหมด"
                          value={tableSurveyYear}
                          onChange={(val) => setTableSurveyYear(val)}
                          style={{ width: 110 }}
                          size="small"
                        >
                          {surveyYears.map(y => (
                            <Select.Option key={y} value={y}>ปี {y}</Select.Option>
                          ))}
                        </Select>
                      </Space>
                    </div>

                    <Table 
                      columns={columns} 
                      dataSource={filteredRetainTable} 
                      rowKey={(record, idx) => `${getCleanItemValue(record, ["รหัสสาขา", "ชื่อสาขา"]) || "row"}-${getCleanItemValue(record, ["ปีการศึกษาที่รับเข้า"])}-${getCleanItemValue(record, ["ปีที่สำรวจ"])}-${idx}`}
                      pagination={{ 
                        defaultPageSize: 10,
                        pageSizeOptions: ["10", "20", "50"],
                        showSizeChanger: true,
                        showTotal: (total) => `รวม ${total} รายการ` 
                      }}
                      bordered
                      scroll={{ x: true }}
                    />
                  </div>
                </Col>
              </Row>

              {/* 📊 GRAPH SECTION PANEL (ส่วนกราฟแท่งเปรียบเทียบ) */}
              <div style={{ marginTop: "32px" }}>
                <Card 
                  style={{ borderRadius: "16px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}
                  title={
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px", padding: "8px 0" }}>
                      <div>
                        <span style={{ fontSize: "16px", fontWeight: "700", color: "#0f172a" }}>
                          แผนภูมิเปรียบเทียบจำนวนนิสิตตามสาขาวิชา
                        </span>
                        <p style={{ margin: 0, fontSize: "12px", color: "#64748b", fontWeight: "normal" }}>
                          จำแนกตามรายสาขาวิชา 
                        </p>
                      </div>
                      <Space>
                        <span style={{ fontSize: "13px", fontWeight: "600", color: "#334155" }}>ปีที่รับเข้า:</span>
                        <Select 
                          value={graphEntryYear} 
                          onChange={setGraphEntryYear} 
                          size="small" 
                          style={{ width: 100 }}
                        >
                          {entryYears.map(y => <Select.Option key={y} value={y}>{y}</Select.Option>)}
                        </Select>
                        <span style={{ fontSize: "13px", fontWeight: "600", color: "#334155", marginLeft: "8px" }}>ปีที่สำรวจ:</span>
                        <Select 
                          value={graphSurveyYear} 
                          onChange={setGraphSurveyYear} 
                          size="small" 
                          style={{ width: 100 }}
                        >
                          {surveyYears.map(y => <Select.Option key={y} value={y}>{y}</Select.Option>)}
                        </Select>
                      </Space>
                    </div>
                  }
                >
                  {/* 🎓 กราฟระดับปริญญาตรี */}
                  <div style={{ marginBottom: "36px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "20px" }}>
                      <span style={{ display: "inline-block", width: "4px", height: "16px", backgroundColor: "#0ea5e9", borderRadius: "2px" }}></span>
                      <h4 style={{ color: "#0f172a", fontWeight: "700", margin: 0, fontSize: "15px" }}>
                        🎓 นิสิตระดับปริญญาตรี
                      </h4>
                    </div>

                    {bachelorGraphData.length > 0 ? (
                      <div style={{ width: "100%", height: Math.max(300, bachelorGraphData.length * 75) }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart 
                            data={bachelorGraphData} 
                            layout="vertical" 
                            margin={{ top: 10, right: 65, left: 20, bottom: 10 }}
                            barGap={6}
                            barCategoryGap="25%"
                          >
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                            <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
                            <YAxis 
                              dataKey="name" 
                              type="category" 
                              width={260} 
                              axisLine={false}
                              tickLine={false}
                              tick={{ fontSize: 13, fill: "#334155", fontWeight: 500 }}
                            />
                            <Tooltip 
                              cursor={{ fill: "rgba(241, 245, 249, 0.6)" }}
                              contentStyle={{ 
                                borderRadius: "12px", 
                                border: "1px solid #e2e8f0", 
                                boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                                padding: "12px 16px"
                              }} 
                            />
                            <Legend verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: "12px" }} />
                            <Bar 
                              dataKey="earlyTerm" 
                              name="ภาคต้น" 
                              fill="#3b8bda" 
                              radius={[0, 4, 4, 0]}
                              barSize={14}
                              label={renderBarValueLabel} 
                            />
                            <Bar 
                              dataKey="lateTerm" 
                              name="ภาคปลาย" 
                              fill="#34a8c8" 
                              radius={[0, 4, 4, 0]} 
                              barSize={14}
                              label={renderBarValueLabel} 
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="ไม่มีข้อมูลระดับปริญญาตรีสำหรับปีการศึกษาที่เลือก" />
                    )}
                  </div>

                  {/* 🎓 กราฟระดับปริญญาโท */}
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "20px" }}>
                      <span style={{ display: "inline-block", width: "4px", height: "16px", backgroundColor: "#8b5cf6", borderRadius: "2px" }}></span>
                      <h4 style={{ color: "#0f172a", fontWeight: "700", margin: 0, fontSize: "15px" }}>
                        🎓 นิสิตระดับปริญญาโท
                      </h4>
                    </div>

                    {masterGraphData.length > 0 ? (
                      <div style={{ width: "100%", height: Math.max(200, masterGraphData.length * 75) }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart 
                            data={masterGraphData} 
                            layout="vertical" 
                            margin={{ top: 10, right: 65, left: 20, bottom: 10 }}
                            barGap={6}
                            barCategoryGap="25%"
                          >
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                            <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
                            <YAxis 
                              dataKey="name" 
                              type="category" 
                              width={260} 
                              axisLine={false}
                              tickLine={false}
                              tick={{ fontSize: 13, fill: "#334155", fontWeight: 500 }}
                            />
                            <Tooltip 
                              cursor={{ fill: "rgba(241, 245, 249, 0.6)" }}
                              contentStyle={{ 
                                borderRadius: "12px", 
                                border: "1px solid #e2e8f0", 
                                boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                                padding: "12px 16px"
                              }} 
                            />
                            <Legend verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: "12px" }} />
                            <Bar 
                              dataKey="earlyTerm" 
                              name="ภาคต้น" 
                              fill="#8b5cf6" 
                              radius={[0, 4, 4, 0]}
                              barSize={14}
                              label={renderBarValueLabel} 
                            />
                            <Bar 
                              dataKey="lateTerm" 
                              name="ภาคปลาย" 
                              fill="#f97316" 
                              radius={[0, 4, 4, 0]} 
                              barSize={14}
                              label={renderBarValueLabel} 
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="ไม่มีข้อมูลระดับปริญญาโทสำหรับปีการศึกษาที่เลือก" />
                    )}
                  </div>
                </Card>
              </div>
            </>
          )}

        </Content>
      </Layout>
    </Layout>
  );
}

export default StudentPage;
