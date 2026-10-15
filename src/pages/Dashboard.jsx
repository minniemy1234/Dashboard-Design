import React, { useMemo, useState, useEffect, useCallback } from "react";
import { Layout, Button, Empty, Card, Row, Col, Select, Tag, Space, Tooltip as AntTooltip } from "antd"; 
import Sidebar from "../components/Sidebar";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

import {
  TeamOutlined,
  UserOutlined,
  TrophyOutlined,
  SearchOutlined,
  ReadOutlined,
  DashboardOutlined,
  BookOutlined,
  CalendarOutlined,
  ReloadOutlined
} from "@ant-design/icons";

import { db } from "../firebase";
import { doc, onSnapshot } from "firebase/firestore";

const { Header, Content } = Layout;

// รายการสาขาวิชาเพิ่มเติม
const EXTRA_MAJORS = [
  "วท.ม.วิทยาศาสตร์และเทคโนโลยีผลิตภัณฑ์ธรรมชาติ",
  "วท.ม.เทคโนโลยีเคมีประยุกต์",
  "วท.ม.ปัญญาประดิษฐ์และเทคโนโลยีดิจิทัล"
];

function Dashboard() {
  // State ของ Main Filter
  const [selectedYears, setSelectedYears] = useState([]);
  const [selectedMajors, setSelectedMajors] = useState([]);

  const [graphEntryYear, setGraphEntryYear] = useState(""); 
  const [graphSurveyYear, setGraphSurveyYear] = useState(""); 

  const [appliedFilters, setAppliedFilters] = useState({
    years: [],
    majors: []
  });

  const [dashboardData, setDashboardData] = useState({});

  // โหลดข้อมูลจาก localStorage
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

  const cleanMajorName = (majorStr) => {
    if (!majorStr) return "";
    let name = String(majorStr).replace(/\n/g, ' ').trim();
    if (name.startsWith("สาขาวิชา")) name = name.replace("สาขาวิชา", "").trim();
    else if (name.startsWith("สาขา")) name = name.replace("สาขา", "").trim();
    else if (name.startsWith("หลักสูตร")) name = name.replace("หลักสูตร", "").trim();
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

  const isMasterOrXMajor = (majorName) => {
    if (!majorName) return false;
    const clean = String(majorName).trim();
    return clean.startsWith("วท.ม.") || clean.startsWith("X") || clean.startsWith("x");
  };

  const retain = useMemo(() => {
    if (!dashboardData || Object.keys(dashboardData).length === 0) return [];
    return dashboardData["student_retain"] || dashboardData["นิสิตคงอยู่"] || dashboardData["ข้อมูลนิสิตคงอยู่"] || dashboardData["จำนวนนิสิตคงอยู่"] || dashboardData["student_retain_data"] || [];
  }, [dashboardData]);

  // ดึงข้อมูลผู้สำเร็จการศึกษา
  const graduatesList = useMemo(() => {
    if (!dashboardData || Object.keys(dashboardData).length === 0) return [];
    return dashboardData["ผู้สำเร็จการศึกษา"] || dashboardData["สำเร็จการศึกษา"] || dashboardData["graduates"] || dashboardData["student_graduated"] || [];
  }, [dashboardData]);

  const entryYears = useMemo(() => {
    const list = retain.map(item => extractYear(item["ปีการศึกษาที่รับเข้า"] || item["ปีการศึกษา"]));
    return [...new Set(list)].filter(Boolean).sort().reverse();
  }, [retain]);

  const surveyYears = useMemo(() => {
    const list = retain.map(item => extractYear(item["ปีที่สำรวจ"]));
    return [...new Set(list)].filter(Boolean).sort().reverse();
  }, [retain]);

  useEffect(() => {
    if (entryYears.length > 0 && !graphEntryYear) {
      setGraphEntryYear(entryYears[0]);
    }
    if (surveyYears.length > 0 && !graphSurveyYear) {
      setGraphSurveyYear(surveyYears[0]);
    }
  }, [entryYears, surveyYears, graphEntryYear, graphSurveyYear]);

  const yearsOptions = useMemo(() => {
    const retainYears = retain.map((item) => extractYear(item["ปีที่สำรวจ"] || item["ปีการศึกษาที่รับเข้า"]));
    return [...new Set(retainYears)].filter(Boolean).sort();
  }, [retain]);

  const majorsOptions = useMemo(() => {
    if (retain.length === 0) return [];
    const rawMajors = retain.map(item => cleanMajorName(item["ชื่อสาขา"] || item["สาขาวิชา"] || item["สาขา"]));
    const combined = [...new Set([...rawMajors, ...EXTRA_MAJORS])].filter(Boolean);

    const bachelorMajors = combined.filter(m => !isMasterOrXMajor(m)).sort();
    const masterMajors = combined.filter(m => isMasterOrXMajor(m)).sort();

    return [...bachelorMajors, ...masterMajors];
  }, [retain]);

  const handleSelectAllYears = (shouldSelectAll) => {
    setSelectedYears(shouldSelectAll ? yearsOptions : []);
  };

  const handleSelectAllMajors = (shouldSelectAll) => {
    setSelectedMajors(shouldSelectAll ? majorsOptions : []);
  };

  const handleApplyFilters = () => {
    setAppliedFilters({ years: selectedYears, majors: selectedMajors });
  };

  // ข้อมูลพื้นฐานสำหรับสร้างกราฟ
  const rawGraphData = useMemo(() => {
    if (retain.length === 0 || !graphEntryYear || !graphSurveyYear) return [];
    const grouped = {};
    retain.forEach(item => {
      const itemEntryYear = extractYear(item["ปีการศึกษาที่รับเข้า"] || item["ปีการศึกษา"]);
      const itemSurveyYear = extractYear(item["ปีที่สำรวจ"]);

      if (itemEntryYear !== graphEntryYear || itemSurveyYear !== graphSurveyYear) return;

      const rawName = cleanMajorName(item["ชื่อสาขา"] || item["สาขาวิชา"] || item["สาขา"]);
      if (!rawName) return;
      const majorKey = cleanString(rawName);
      const term = String(item["ภาคเรียน"] || item["ภาคการศึกษา"] || "").trim();
      const amt = Number(item["จำนวน"] || item["รวม"] || 0);

      if (!grouped[majorKey]) {
        grouped[majorKey] = { name: rawName, earlyTerm: 0, lateTerm: 0 };
      }

      if (term === "ต้น" || term === "ภาคต้น") grouped[majorKey].earlyTerm += amt;
      else if (term === "ปลาย" || term === "ภาคปลาย") grouped[majorKey].lateTerm += amt;
    });

    return Object.values(grouped);
  }, [retain, graphEntryYear, graphSurveyYear]);

  // แยกชุดข้อมูลกราฟ ป.ตรี
  const bachelorGraphData = useMemo(() => {
    return rawGraphData
      .filter(item => !isMasterOrXMajor(item.name))
      .sort((a, b) => (b.earlyTerm + b.lateTerm) - (a.earlyTerm + a.lateTerm));
  }, [rawGraphData]);

  // แยกชุดข้อมูลกราฟ ป.โท
  const masterGraphData = useMemo(() => {
    return rawGraphData
      .filter(item => isMasterOrXMajor(item.name))
      .sort((a, b) => (b.earlyTerm + b.lateTerm) - (a.earlyTerm + a.lateTerm));
  }, [rawGraphData]);

  const studentBreakdown = useMemo(() => {
    let admitted = 0;
    let retained = 0;
    let bachelorAdmitted = 0;
    let bachelorRetained = 0;
    let masterAdmitted = 0;
    let masterRetained = 0;
    let lecturers = 99; // กำหนดค่าเริ่มต้นบุคลากรสายผู้สอนเป็น 99 ท่าน
    let graduates = 0;

    if (dashboardData && Object.keys(dashboardData).length > 0) {
      const teacher = 
        dashboardData["ข้อมูลอาจารย์"] || 
        dashboardData["อาจารย์สาขา"] || 
        dashboardData["อาจารย์"] || 
        dashboardData["อาจารย์ประจำสาขา"] ||
        [];

      const isAllYearsSelected = appliedFilters.years.length === 0 || appliedFilters.years.length === yearsOptions.length;
      const isAllMajorsSelected = appliedFilters.majors.length === 0 || appliedFilters.majors.length === majorsOptions.length;

      retain.forEach((item) => {
        const retMajorClean = cleanMajorName(item["ชื่อสาขา"] || item["สาขาวิชา"] || item["สาขา"]);
        const retYear = extractYear(item["ปีที่สำรวจ"] || item["ปีการศึกษาที่รับเข้า"]);
        const retTerm = String(item["ภาคเรียน"] || item["ภาคการศึกษา"] || "").trim();
        const amt = Number(item["จำนวน"] || item["รวม"] || 0);
        const code = String(item["รหัสสาขา"] || "").trim().toUpperCase();

        const yearMatch = isAllYearsSelected || appliedFilters.years.includes(retYear);
        const majorMatch = isAllMajorsSelected || appliedFilters.majors.includes(retMajorClean);

        if (majorMatch && yearMatch) {
          const isMaster = code.startsWith("X") || isMasterOrXMajor(retMajorClean);

          if (retTerm === "ต้น" || retTerm === "ภาคต้น") {
            admitted += amt;
            if (isMaster) masterAdmitted += amt;
            else bachelorAdmitted += amt;
          }
          if (retTerm === "ปลาย" || retTerm === "ภาคปลาย") {
            retained += amt;
            if (isMaster) masterRetained += amt;
            else bachelorRetained += amt;
          }
        }
      });

      // ดึงและคำนวณจำนวนผู้สำเร็จการศึกษา
      if (Array.isArray(graduatesList) && graduatesList.length > 0) {
        graduatesList.forEach((item) => {
          const gradMajorClean = cleanMajorName(item["ชื่อสาขา"] || item["สาขาวิชา"] || item["สาขา"]);
          const gradYear = extractYear(item["ปีการศึกษา"] || item["ปีสำเร็จการศึกษา"] || item["ปีที่สำเร็จ"]);
          const amt = Number(item["จำนวน"] || item["จำนวนนิสิต"] || item["รวม"] || 0);

          const yearMatch = isAllYearsSelected || appliedFilters.years.includes(gradYear);
          const majorMatch = isAllMajorsSelected || appliedFilters.majors.includes(gradMajorClean);

          if (majorMatch && yearMatch) {
            graduates += amt;
          }
        });
      }

      if (Array.isArray(teacher) && teacher.length > 0) {
        const stripProgramType = (str) => {
          if (!str) return "";
          return str
            .replace(/\(ภาคปกติ\)/g, "")
            .replace(/\(ภาคพิเศษ\)/g, "")
            .replace(/ภาคปกติ/g, "")
            .replace(/ภาคพิเศษ/g, "")
            .trim();
        };

        const selectedBaseMajors = new Set(
          appliedFilters.majors.map(m => stripProgramType(m))
        );

        const validTeachers = teacher.filter(item => {
          const rawTeacherMajor = cleanMajorName(item["ชื่อสาขา"] || item["สาขาวิชา"] || item["สาขา"]);
          const cleanTeacherMajor = stripProgramType(rawTeacherMajor);

          const name = item["ชื่อ นามสกุล"] || item["ชื่อ-นามสกุล"] || item["ชื่ออาจารย์"] || item["ชื่อ"] || "";
          const cleanName = String(name).trim();

          const majorMatch = isAllMajorsSelected || selectedBaseMajors.has(cleanTeacherMajor);
          if (!majorMatch) return false;

          return cleanName !== "" && cleanName !== "-" && !cleanName.includes("รวม") && !cleanName.includes("จำนวน");
        });

        const uniqueTeacherNames = new Set(
          validTeachers.map(item => {
            const name = item["ชื่อ นามสกุล"] || item["ชื่อ-นามสกุล"] || item["ชื่ออาจารย์"] || item["ชื่อ"] || "";
            return String(name).replace(/\s+/g, '').trim();
          })
        );

        if (uniqueTeacherNames.size > 0) {
          lecturers = uniqueTeacherNames.size;
        }
      }
    }

    return {
      admitted,
      retained,
      bachelorAdmitted,
      bachelorRetained,
      masterAdmitted,
      masterRetained,
      lecturers,
      graduates
    };
  }, [dashboardData, retain, graduatesList, appliedFilters, yearsOptions, majorsOptions]);

  const renderMajorTag = (props) => {
    const { label, value, closable, onClose } = props;
    const isMaster = isMasterOrXMajor(value);

    return (
      <Tag
        closable={closable}
        onClose={onClose}
        style={{
          marginRight: 4,
          borderRadius: 6,
          fontWeight: isMaster ? 600 : 500,
          backgroundColor: isMaster ? "#e0f2fe" : "#f1f5f9",
          color: isMaster ? "#0284c7" : "#475569",
          borderColor: isMaster ? "#bae6fd" : "#cbd5e1"
        }}
      >
        {label}
      </Tag>
    );
  };

  const isDataEmpty = !dashboardData || Object.keys(dashboardData).length === 0;

  // ป้องกัน Error สำหรับ Custom Label ใน Stacked Bar
  const renderStackedTotalLabel = (props) => {
    const { x, y, width, height, payload } = props;
    if (!payload) return null;
    const total = (payload.earlyTerm || 0) + (payload.lateTerm || 0);
    if (!total) return null;
    return (
      <text
        x={(x || 0) + (width || 0) + 8}
        y={(y || 0) + (height || 0) / 2 + 4}
        fill="#334155"
        fontSize={12}
        fontWeight="bold"
        textAnchor="start"
      >
        {total}
      </text>
    );
  };

  return (
    <Layout style={{ minHeight: "100vh", background: "#f8fafc" }}>
      <Sidebar />
      <Layout style={{ background: "#f8fafc" }}>

        {/* MODERN HEADER */}
        <Header style={{ 
          background: "#ffffff", 
          padding: "16px 32px", 
          height: "auto", 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center", 
          borderBottom: "1px solid #e2e8f0",
          boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.03)"
        }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <h1 style={{ margin: 0, fontSize: "22px", fontWeight: "800", color: "#0f172a" }}>
                Faculty Analytics Dashboard
              </h1>
              <Tag color="blue" style={{ borderRadius: "12px", padding: "1px 10px", fontWeight: "600" }}>
                คณะวิทยาศาสตร์ ศรีราชา
              </Tag>
            </div>
            <p style={{ color: "#64748b", fontSize: "13px", margin: 0 }}>
              ระบบสารสนเทศนวัตกรรมเพื่อขับเคลื่อนองค์กรสู่ความเป็นเลิศ (Information System for Excellence)
            </p>
          </div>

          <Space size="middle">
            <AntTooltip title="รีเฟรชข้อมูล">
              <Button 
                shape="circle" 
                icon={<ReloadOutlined />} 
                onClick={loadDashboardData}
                style={{ borderColor: "#cbd5e1", color: "#64748b" }}
              />
            </AntTooltip>
          </Space>
        </Header>

        <Content style={{ padding: "28px 32px", maxWidth: "1600px", margin: "0 auto", width: "100%" }}>

          {/* FILTER CARD ZONE */}
          <div style={{ 
            background: "#ffffff", 
            padding: "24px", 
            borderRadius: "16px", 
            marginBottom: "28px", 
            boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)", 
            border: "1px solid #e2e8f0" 
          }}>
            <Row gutter={[20, 20]} align="bottom">

              {/* Filter ปีการศึกษา */}
              <Col xs={24} lg={10}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <span style={{ fontWeight: "700", color: "#334155", fontSize: "13px", display: "flex", alignItems: "center", gap: "6px" }}>
                    <CalendarOutlined style={{ color: "#0284c7" }} /> ปีการศึกษาที่ต้องการกรอกข้อมูล
                  </span>
                  <Button 
                    type="link" 
                    size="small" 
                    onClick={() => handleSelectAllYears(selectedYears.length !== yearsOptions.length)}
                    style={{ padding: 0, height: "auto", fontSize: "12px", color: "#0284c7", fontWeight: "600" }}
                  >
                    {yearsOptions.length > 0 && selectedYears.length === yearsOptions.length ? "ยกเลิกการเลือก" : "เลือกทั้งหมด"}
                  </Button>
                </div>
                <Select
                  mode="multiple"
                  allowClear
                  style={{ width: "100%" }}
                  placeholder="เลือกปีการศึกษา (ค่าเริ่มต้น: แสดงทั้งหมด)"
                  value={selectedYears}
                  onChange={(val) => setSelectedYears(val)}
                  maxTagCount="responsive"
                  size="large"
                >
                  {yearsOptions.map((year) => (
                    <Select.Option key={year} value={year}>ปีการศึกษา {year}</Select.Option>
                  ))}
                </Select>
              </Col>

              {/* Filter สาขาวิชา */}
              <Col xs={24} lg={10}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <span style={{ fontWeight: "700", color: "#334155", fontSize: "13px", display: "flex", alignItems: "center", gap: "6px" }}>
                    <BookOutlined style={{ color: "#0284c7" }} /> สาขาวิชา
                  </span>
                  <Button 
                    type="link" 
                    size="small" 
                    onClick={() => handleSelectAllMajors(selectedMajors.length !== majorsOptions.length)}
                    style={{ padding: 0, height: "auto", fontSize: "12px", color: "#0284c7", fontWeight: "600" }}
                  >
                    {majorsOptions.length > 0 && selectedMajors.length === majorsOptions.length ? "ยกเลิกการเลือก" : "เลือกทั้งหมด"}
                  </Button>
                </div>
                <Select
                  mode="multiple"
                  allowClear
                  style={{ width: "100%" }}
                  placeholder="เลือกสาขาวิชา (ค่าเริ่มต้น: แสดงทุกสาขา)"
                  value={selectedMajors}
                  onChange={(val) => setSelectedMajors(val)}
                  maxTagCount="responsive"
                  size="large"
                  tagRender={renderMajorTag}
                >
                  {majorsOptions.map((major) => {
                    const isMaster = isMasterOrXMajor(major);
                    return (
                      <Select.Option key={major} value={major}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
                          <span style={{ color: isMaster ? "#0284c7" : "#334155", fontWeight: isMaster ? 600 : 400 }}>
                            {major}
                          </span>
                          {isMaster && (
                            <span style={{ fontSize: "10px", backgroundColor: "#e0f2fe", color: "#0284c7", padding: "1px 6px", borderRadius: "4px", border: "1px solid #bae6fd" }}>
                              ป.โท
                            </span>
                          )}
                        </div>
                      </Select.Option>
                    );
                  })}
                </Select>
              </Col>

              {/* ปุ่มประมวลผล */}
              <Col xs={24} lg={4}>
                <Button 
                  type="primary" 
                  size="large" 
                  icon={<SearchOutlined />} 
                  onClick={handleApplyFilters} 
                  style={{ 
                    width: "100%", 
                    height: "40px", 
                    borderRadius: "10px", 
                    background: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)", 
                    borderColor: "#0284c7",
                    fontWeight: "600",
                    boxShadow: "0 4px 12px rgba(2, 132, 199, 0.25)"
                  }}
                >
                  ประมวลผลข้อมูล
                </Button>
              </Col>

            </Row>
          </div>

          {isDataEmpty ? (
            <Card style={{ borderRadius: "16px", textAlign: "center", padding: "60px 0", border: "1px solid #e2e8f0" }}>
              <Empty description={<span style={{ color: "#64748b" }}>ยังไม่มีข้อมูลในระบบ หรือกำลังดึงข้อมูลจากฐานข้อมูล</span>} />
            </Card>
          ) : (
            <>
              {/* 🏆 PROMINENT TOP KPI CARDS ZONE */}
              <div style={{ marginBottom: "32px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                  <h2 style={{ fontSize: "18px", fontWeight: "700", margin: 0, color: "#0f172a", display: "flex", alignItems: "center", gap: "8px" }}>
                    <DashboardOutlined style={{ color: "#0284c7" }} /> สรุปภาพรวมสถิตินิสิตและบุคลากร
                  </h2>
                </div>

                <Row gutter={[20, 20]}>
                  {/* KPI 1: จำนวนหลักสูตร */}
                  <Col xs={24} sm={12} lg={6}>
                    <div style={{ 
                      background: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)", 
                      padding: "22px 24px", 
                      borderRadius: "16px", 
                      color: "#ffffff", 
                      boxShadow: "0 10px 15px -3px rgba(2, 132, 199, 0.2)", 
                      position: "relative", 
                      height: "150px",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between"
                    }}>
                      <div style={{ minHeight: "44px" }}>
                        <div style={{ color: "#bae6fd", fontSize: "12px", fontWeight: "700", letterSpacing: "0.05em", textTransform: "uppercase" }}>TOTAL PROGRAMS</div>
                        <h3 style={{ margin: "2px 0 0 0", fontSize: "15px", color: "#f0f9ff", fontWeight: "500", lineHeight: "1.3" }}>หลักสูตรทั้งหมด</h3>
                      </div>
                      <div style={{ display: "flex", alignItems: "baseline" }}>
                        <span style={{ fontSize: "32px", fontWeight: "800", color: "#ffffff", lineHeight: "1" }}>
                          {(appliedFilters.majors.length > 0 ? appliedFilters.majors.length : majorsOptions.length).toLocaleString()}
                        </span>
                        <span style={{ fontSize: "14px", fontWeight: "500", color: "#e0f2fe", marginLeft: "8px" }}>หลักสูตร</span>
                      </div>
                      <ReadOutlined style={{ fontSize: "48px", color: "#ffffff", position: "absolute", right: "20px", bottom: "16px", opacity: 0.18 }} />
                    </div>
                  </Col>

                  {/* KPI 2: จำนวนนิสิตคงอยู่ */}
                  <Col xs={24} sm={12} lg={6}>
                    <div style={{ 
                      background: "linear-gradient(135deg, #059669 0%, #047857 100%)", 
                      padding: "22px 24px", 
                      borderRadius: "16px", 
                      color: "#ffffff", 
                      boxShadow: "0 10px 15px -3px rgba(5, 150, 105, 0.2)", 
                      position: "relative", 
                      height: "150px",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between"
                    }}>
                      <div style={{ minHeight: "44px" }}>
                        <div style={{ color: "#a7f3d0", fontSize: "12px", fontWeight: "700", letterSpacing: "0.05em", textTransform: "uppercase" }}>RETAINED STUDENTS</div>
                        <h3 style={{ margin: "2px 0 0 0", fontSize: "15px", color: "#ecfdf5", fontWeight: "500", lineHeight: "1.3" }}>จำนวนนิสิตคงอยู่ (ภาคปลาย)</h3>
                      </div>
                      <div style={{ display: "flex", alignItems: "baseline" }}>
                        <span style={{ fontSize: "32px", fontWeight: "800", color: "#ffffff", lineHeight: "1" }}>
                          {studentBreakdown.retained.toLocaleString()}
                        </span>
                        <span style={{ fontSize: "14px", fontWeight: "500", color: "#d1fae5", marginLeft: "8px" }}>คน</span>
                      </div>
                      <TeamOutlined style={{ fontSize: "48px", color: "#ffffff", position: "absolute", right: "20px", bottom: "16px", opacity: 0.18 }} />
                    </div>
                  </Col>

                  {/* KPI 3: ผู้สำเร็จการศึกษา */}
                  <Col xs={24} sm={12} lg={6}>
                    <div style={{ 
                      background: "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)", 
                      padding: "22px 24px", 
                      borderRadius: "16px", 
                      color: "#ffffff", 
                      boxShadow: "0 10px 15px -3px rgba(124, 58, 237, 0.2)", 
                      position: "relative", 
                      height: "150px",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between"
                    }}>
                      <div style={{ minHeight: "44px" }}>
                        <div style={{ color: "#ddd6fe", fontSize: "12px", fontWeight: "700", letterSpacing: "0.05em", textTransform: "uppercase" }}>GRADUATES (5 YRS)</div>
                        <h3 style={{ margin: "2px 0 0 0", fontSize: "15px", color: "#f5f3ff", fontWeight: "500", lineHeight: "1.3" }}>ผู้สำเร็จการศึกษา</h3>
                      </div>
                      <div style={{ display: "flex", alignItems: "baseline" }}>
                        <span style={{ fontSize: "32px", fontWeight: "800", color: "#ffffff", lineHeight: "1" }}>
                          {studentBreakdown.graduates.toLocaleString()}
                        </span>
                        <span style={{ fontSize: "14px", fontWeight: "500", color: "#ddd6fe", marginLeft: "8px" }}>คน</span>
                      </div>
                      <TrophyOutlined style={{ fontSize: "48px", color: "#ffffff", position: "absolute", right: "20px", bottom: "16px", opacity: 0.18 }} />
                    </div>
                  </Col>

                  {/* KPI 4: บุคลากรรวม */}
                  <Col xs={24} sm={12} lg={6}>
                    <div style={{ 
                      background: "linear-gradient(135deg, #d97706 0%, #b45309 100%)", 
                      padding: "22px 24px", 
                      borderRadius: "16px", 
                      color: "#ffffff", 
                      boxShadow: "0 10px 15px -3px rgba(217, 119, 6, 0.2)", 
                      position: "relative", 
                      height: "150px",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between"
                    }}>
                      <div style={{ minHeight: "44px" }}>
                        <div style={{ color: "#fef3c7", fontSize: "12px", fontWeight: "700", letterSpacing: "0.05em", textTransform: "uppercase" }}>ACADEMIC STAFF</div>
                        <h3 style={{ margin: "2px 0 0 0", fontSize: "15px", color: "#fffbeb", fontWeight: "500", lineHeight: "1.3" }}>บุคลากรสายผู้สอน</h3>
                      </div>
                      <div style={{ display: "flex", alignItems: "baseline" }}>
                        <span style={{ fontSize: "32px", fontWeight: "800", color: "#ffffff", lineHeight: "1" }}>
                          {studentBreakdown.lecturers.toLocaleString()}
                        </span>
                        <span style={{ fontSize: "14px", fontWeight: "500", color: "#fef3c7", marginLeft: "8px" }}>ท่าน</span>
                      </div>
                      <UserOutlined style={{ fontSize: "48px", color: "#ffffff", position: "absolute", right: "20px", bottom: "16px", opacity: 0.18 }} />
                    </div>
                  </Col>
                </Row>
              </div>

              {/* 📊 GRAPH SECTION PANEL (STACKED BAR CHART) */}
              {(bachelorGraphData.length > 0 || masterGraphData.length > 0) && (
                <div style={{ marginTop: "32px" }}>
                  <Card 
                    style={{ borderRadius: "16px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}
                    title={
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px", padding: "8px 0" }}>
                        <div>
                          <span style={{ fontSize: "16px", fontWeight: "700", color: "#0f172a" }}>
                            สถิติจำนวนนิสิตเปรียบเทียบภาคต้นและภาคปลาย
                          </span>
                          <p style={{ margin: 0, fontSize: "12px", color: "#64748b", fontWeight: "normal" }}>
                            จำแนกตามรายสาขาวิชา ประจำปีเข้าศึกษา {graphEntryYear} (สำรวจปี {graphSurveyYear})
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
                    {/* กราฟระดับปริญญาตรี */}
                    {bachelorGraphData.length > 0 && (
                      <div style={{ marginBottom: "32px" }}>
                        <h4 style={{ color: "#0369a1", fontWeight: "700", marginBottom: "16px" }}>
                          🎓 ระดับปริญญาตรี
                        </h4>
                        <div style={{ width: "100%", height: Math.max(300, bachelorGraphData.length * 45) }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={bachelorGraphData} layout="vertical" margin={{ top: 5, right: 50, left: 20, bottom: 5 }}>
                              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                              <XAxis type="number" />
                              <YAxis dataKey="name" type="category" width={220} tick={{ fontSize: 12, fill: "#475569" }} />
                              <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0" }} />
                              <Legend />
                              <Bar 
                                dataKey="earlyTerm" 
                                name="ภาคต้น" 
                                stackId="a" 
                                fill="#0284c7" 
                              />
                              <Bar 
                                dataKey="lateTerm" 
                                name="ภาคปลาย" 
                                stackId="a" 
                                fill="#059669" 
                                radius={[0, 4, 4, 0]} 
                                label={renderStackedTotalLabel} 
                              />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    )}

                    {/* กราฟระดับปริญญาโท */}
                    {masterGraphData.length > 0 && (
                      <div>
                        <h4 style={{ color: "#7c3aed", fontWeight: "700", marginBottom: "16px" }}>
                          🎓 ระดับปริญญาโท
                        </h4>
                        <div style={{ width: "100%", height: Math.max(200, masterGraphData.length * 45) }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={masterGraphData} layout="vertical" margin={{ top: 5, right: 50, left: 20, bottom: 5 }}>
                              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                              <XAxis type="number" />
                              <YAxis dataKey="name" type="category" width={220} tick={{ fontSize: 12, fill: "#475569" }} />
                              <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0" }} />
                              <Legend />
                              <Bar 
                                dataKey="earlyTerm" 
                                name="ภาคต้น" 
                                stackId="a" 
                                fill="#8b5cf6" 
                              />
                              <Bar 
                                dataKey="lateTerm" 
                                name="ภาคปลาย" 
                                stackId="a" 
                                fill="#10b981" 
                                radius={[0, 4, 4, 0]} 
                                label={renderStackedTotalLabel} 
                              />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    )}
                  </Card>
                </div>
              )}
            </>
          )}

        </Content>
      </Layout>
    </Layout>
  );
}

export default Dashboard;
