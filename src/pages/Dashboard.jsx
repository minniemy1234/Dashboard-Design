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
  "วท.ม.เทคโนโลยีเคมีประยุกต์"
];

// 🔹 ฟังก์ชั่นดึงค่าคอลัมน์จาก Key ของ Object (ลบ space หน้า-หลัง ให้อัตโนมัติ)
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

  // 🔹 ฟังก์ชั่นทำความสะอาดชื่อสาขา
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

  // 🔹 ตรวจสอบว่าเป็นสาขาระดับ ป.โท หรือไม่ (เช็กเฉพาะคำนำหน้า วท.ม. หรือ X)
  const isMasterOrXMajor = (majorName) => {
    if (!majorName) return false;
    const clean = String(majorName).replace(/\s+/g, '').trim();
    return clean.startsWith("วท.ม.") || clean.startsWith("X") || clean.startsWith("x");
  };

  const retain = useMemo(() => {
    if (!dashboardData || Object.keys(dashboardData).length === 0) return [];
    return dashboardData["student_retain"] || dashboardData["นิสิตคงอยู่"] || dashboardData["ข้อมูลนิสิตคงอยู่"] || dashboardData["จำนวนนิสิตคงอยู่"] || dashboardData["student_retain_data"] || [];
  }, [dashboardData]);

  // 🔹 ดึงข้อมูลภาวะการมีงานทำแบบล็อกเฉพาะ Key แรกที่พบ
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

  const entryYears = useMemo(() => {
    const list = retain.map(item => extractYear(getCleanItemValue(item, ["ปีการศึกษาที่รับเข้า", "ปีการศึกษา"])));
    return [...new Set(list)].filter(Boolean).sort().reverse();
  }, [retain]);

  const surveyYears = useMemo(() => {
    const list = retain.map(item => extractYear(getCleanItemValue(item, ["ปีที่สำรวจ"])));
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
    const retainYears = retain.map((item) => extractYear(getCleanItemValue(item, ["ปีที่สำรวจ", "ปีการศึกษาที่รับเข้า"])));
    return [...new Set(retainYears)].filter(Boolean).sort();
  }, [retain]);

  const majorsOptions = useMemo(() => {
    if (retain.length === 0) return [];
    const rawMajors = retain
      .map(item => cleanMajorName(getCleanItemValue(item, ["ชื่อสาขา", "สาขาวิชา", "สาขา"])))
      .filter(m => m && !isMasterOrXMajor(m));
    const combined = [...new Set([...rawMajors, ...EXTRA_MAJORS])].filter(Boolean);

    const bachelorMajors = combined.filter(m => !isMasterOrXMajor(m)).sort();
    const masterMajors = combined.filter(m => isMasterOrXMajor(m)).sort();

    return [...bachelorMajors, ...masterMajors];
  }, [retain]);

  // 🔹 นับจำนวนหลักสูตรทั้งหมดจาก "ปีที่รับเข้า" ล่าสุด (ปี 2568 ภาคต้น = 6 สาขา + ป.โท 2 สาขา = 8 สาขา)
  const latestYearProgramsCount = useMemo(() => {
    if (retain.length === 0) return majorsOptions.length;
    
    const latestEntryYear = entryYears.length > 0 ? entryYears[0] : (yearsOptions.length > 0 ? [...yearsOptions].sort((a, b) => Number(b) - Number(a))[0] : "");
    if (!latestEntryYear) return majorsOptions.length;

    const latestYearMajors = retain
      .filter(item => {
        const rawMajor = String(getCleanItemValue(item, ["ชื่อสาขา", "สาขาวิชา", "สาขา"]) || "").trim();
        if (!rawMajor || rawMajor === "-" || rawMajor.includes("รวม") || rawMajor.includes("จำนวน")) return false;

        const itemEntryYear = extractYear(getCleanItemValue(item, ["ปีการศึกษาที่รับเข้า", "ปีการศึกษา", "ปีที่สำรวจ"]));
        const itemTerm = String(getCleanItemValue(item, ["ภาคเรียน", "ภาคการศึกษา"]) || "").trim();
        
        const isLatestYear = itemEntryYear === latestEntryYear;
        const isEarlyTerm = itemTerm === "ต้น" || itemTerm === "ภาคต้น" || itemTerm === "1";
        
        return isLatestYear && isEarlyTerm;
      })
      .map(item => {
        let name = cleanMajorName(getCleanItemValue(item, ["ชื่อสาขา", "สาขาวิชา", "สาขา"]));
        name = name
          .replace(/^หลักสูตร.*?สาขาวิชา/g, "")
          .replace(/^วท\.บ\./g, "")
          .replace(/\(.*?\)/g, "")
          .replace(/ภาคปกติ|ภาคพิเศษ/g, "")
          .trim();
        return cleanString(name);
      })
      .filter(name => Boolean(name) && !isMasterOrXMajor(name));

    const cleanedExtraMajors = EXTRA_MAJORS.map(m => cleanString(cleanMajorName(m))).filter(Boolean);
    const uniqueLatestMajors = new Set([...latestYearMajors, ...cleanedExtraMajors]);

    return uniqueLatestMajors.size > 0 ? uniqueLatestMajors.size : majorsOptions.length;
  }, [retain, entryYears, yearsOptions, majorsOptions]);

  const handleSelectAllYears = (shouldSelectAll) => {
    setSelectedYears(shouldSelectAll ? yearsOptions : []);
  };

  const handleSelectAllMajors = (shouldSelectAll) => {
    setSelectedMajors(shouldSelectAll ? majorsOptions : []);
  };

  const handleApplyFilters = () => {
    setAppliedFilters({ years: selectedYears, majors: selectedMajors });
  };

  const rawGraphData = useMemo(() => {
    if (retain.length === 0) return [];

    const grouped = {};

    majorsOptions.forEach(majorName => {
      const key = cleanString(majorName);
      if (key) {
        grouped[key] = { name: majorName, earlyTerm: 0, lateTerm: 0 };
      }
    });

    retain.forEach(item => {
      const itemEntryYear = extractYear(getCleanItemValue(item, ["ปีการศึกษาที่รับเข้า", "ปีการศึกษา"]));
      const itemSurveyYear = extractYear(getCleanItemValue(item, ["ปีที่สำรวจ"]));

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
  }, [retain, graphEntryYear, graphSurveyYear, majorsOptions]);

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

  // 🔹 คำนวณสรุปข้อมูล KPI
  const studentBreakdown = useMemo(() => {
    let admitted = 0;
    let retained = 0;
    let bachelorAdmitted = 0;
    let bachelorRetained = 0;
    let masterAdmitted = 0;
    let masterRetained = 0;
    let lecturers = 66 + 32; // ค่าเริ่มต้น +32 คนชั่วคราว
    let graduates = 0;

    if (dashboardData && Object.keys(dashboardData).length > 0) {
      const teacher = 
        dashboardData["ข้อมูลอาจารย์"] || 
        dashboardData["อาจารย์สาขา"] || 
        dashboardData["อาจารย์"] || 
        dashboardData["อาจารย์ประจำสาขา"] ||
        [];

      const isAllYearsSelected = appliedFilters.years.length === 0;
      const isAllMajorsSelected = appliedFilters.majors.length === 0;

      // คำนวณนิสิตคงอยู่
      retain.forEach((item) => {
        const retMajorClean = cleanMajorName(getCleanItemValue(item, ["ชื่อสาขา", "สาขาวิชา", "สาขา"]));
        const retYear = extractYear(getCleanItemValue(item, ["ปีที่สำรวจ", "ปีการศึกษาที่รับเข้า"]));
        const retTerm = String(getCleanItemValue(item, ["ภาคเรียน", "ภาคการศึกษา"]) || "").trim();
        const amt = Number(getCleanItemValue(item, ["จำนวน", "รวม"]) || 0);
        const code = String(getCleanItemValue(item, ["รหัสสาขา"]) || "").trim().toUpperCase();

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

      // 🎯 คำนวณผู้สำเร็จการศึกษา: ใช้ Set ดักจับ Unique Key (สาขา + ปี) ป้องกันข้อมูลซ้ำซ้อนในฐานข้อมูล
      const trackedRowKeys = new Set();
      let directGradSum = 0;

      if (Array.isArray(employmentList)) {
        employmentList.forEach((item) => {
          const rawMajor = getCleanItemValue(item, ["ชื่อสาขา", "สาขาวิชา", "สาขา"]);
          const cleanName = String(rawMajor || "").trim();

          // ข้ามแถวที่ไม่มีข้อมูล หรือแถวรวม
          if (!cleanName || cleanName.includes("รวม") || cleanName.includes("จำนวน") || cleanName === "-") {
            return;
          }

          const gradMajorClean = cleanMajorName(rawMajor);
          const rawYear = getCleanItemValue(item, ["ปีการศึกษา", "ปีสำเร็จการศึกษา", "ปีที่สำเร็จ", "ปีการศึกษาที่รับเข้า", "ปีที่สำรวจ"]);
          const gradYear = extractYear(rawYear);

          // 🛑 ล็อกแถว: ถ้าสาขา X ในปี Y ถูกนับไปแล้ว จะไม่นำมารวมซ้ำ
          const rowKey = `${gradMajorClean}_${gradYear}`;
          if (trackedRowKeys.has(rowKey)) {
            return;
          }

          const rawAmt = getCleanItemValue(item, ["ผู้สำเร็จการศึกษา", "จำนวนผู้สำเร็จการศึกษา"]);
          const amt = Number(rawAmt || 0);

          const yearMatch = isAllYearsSelected || appliedFilters.years.includes(gradYear);
          const majorMatch = isAllMajorsSelected || appliedFilters.majors.includes(gradMajorClean);

          if (majorMatch && yearMatch && amt > 0) {
            directGradSum += amt;
            trackedRowKeys.add(rowKey);
          }
        });
      }

      graduates = directGradSum;

      // คำนวณบุคลากร (+32 คนเพิ่มชั่วคราวตามต้องการ)
      if (Array.isArray(teacher) && teacher.length > 0) {
        const selectedBaseMajors = new Set(
          appliedFilters.majors.map(m => cleanMajorName(m))
        );

        const validTeachers = teacher.filter(item => {
          const rawTeacherMajor = cleanMajorName(getCleanItemValue(item, ["ชื่อสาขา", "สาขาวิชา", "สาขา"]));
          const name = getCleanItemValue(item, ["ชื่อ นามสกุล", "ชื่อ-นามสกุล", "ชื่ออาจารย์", "ชื่อ"]) || "";
          const cleanName = String(name).trim();

          const majorMatch = isAllMajorsSelected || selectedBaseMajors.has(rawTeacherMajor);
          if (!majorMatch) return false;

          return cleanName !== "" && cleanName !== "-" && !cleanName.includes("รวม") && !cleanName.includes("จำนวน");
        });

        const uniqueTeacherNames = new Set(
          validTeachers.map(item => {
            const name = getCleanItemValue(item, ["ชื่อ นามสกุล", "ชื่อ-นามสกุล", "ชื่ออาจารย์", "ชื่อ"]) || "";
            return String(name).replace(/\s+/g, '').trim();
          })
        );

        if (uniqueTeacherNames.size > 0) {
          lecturers = uniqueTeacherNames.size + 32;
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
  }, [dashboardData, retain, employmentList, appliedFilters]);

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

  return (
    <Layout style={{ minHeight: "100vh", background: "#f8fafc" }}>
      <Sidebar />
      <Layout style={{ background: "#f8fafc" }}>

        <Header
          style={{
            background: "linear-gradient(135deg, #0f172a 0%, #0c4a6e 50%, #0369a1 100%)",
            padding: "36px 40px",
            height: "auto",
            lineHeight: "normal",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: "4px solid #38bdf8",
            boxShadow: "0 12px 30px -5px rgba(15, 23, 42, 0.3)"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
            {/* กล่องไอคอนเด่นด้านซ้าย */}
            <div
              style={{
                width: "68px",
                height: "68px",
                borderRadius: "18px",
                background: "linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 0 24px rgba(56, 189, 248, 0.45)",
                border: "1.5px solid rgba(255, 255, 255, 0.35)",
                flexShrink: 0
              }}
            >
              <DashboardOutlined style={{ fontSize: "34px", color: "#ffffff" }} />
            </div>

            {/* ข้อความหัวข้อและคำอธิบาย */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <h1
                style={{
                  margin: 0,
                  fontSize: "30px",
                  fontWeight: "900",
                  color: "#ffffff",
                  textShadow: "0 2px 6px rgba(0, 0, 0, 0.35)",
                  letterSpacing: "-0.01em",
                  lineHeight: "1.3"
                }}
              >
                ระบบสารสนเทศด้านการศึกษาเพื่อการบริหารและพัฒนา
                <br />
                คณะวิทยาศาสตร์ ศรีราชา
              </h1>
              <p
                style={{
                  color: "#e2e8f0",
                  fontSize: "15.5px",
                  fontWeight: "400",
                  margin: 0,
                  lineHeight: "1.4",
                  letterSpacing: "0.02em",
                  display: "flex",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "6px"
                }}
              >
                <span>Education Management Information System</span>
                <span
                  style={{
                    background: "linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)",
                    color: "#ffffff",
                    fontWeight: "800",
                    fontSize: "14px",
                    padding: "2px 10px",
                    borderRadius: "6px",
                    letterSpacing: "0.06em",
                    boxShadow: "0 2px 8px rgba(56, 189, 248, 0.4)",
                    border: "1px solid rgba(255, 255, 255, 0.3)"
                  }}
                >
                  EMIS
                </span>
                <span>for Faculty of Science, Sriracha</span>
              </p>
            </div>
          </div>

          <Space size="middle">
            <AntTooltip title="รีเฟรชข้อมูล">
              <Button
                shape="circle"
                icon={<ReloadOutlined style={{ fontSize: "20px" }} />}
                onClick={loadDashboardData}
                style={{
                  width: "48px",
                  height: "48px",
                  borderColor: "rgba(255, 255, 255, 0.3)",
                  color: "#ffffff",
                  background: "rgba(255, 255, 255, 0.12)",
                  backdropFilter: "blur(4px)",
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)"
                }}
              />
            </AntTooltip>
          </Space>
        </Header>

        <Content style={{ padding: "28px 32px", maxWidth: "1600px", margin: "0 auto", width: "100%" }}>

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
                    <CalendarOutlined style={{ color: "#0284c7" }} /> ปีการศึกษา
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
                  placeholder="เลือกปีการศึกษา "
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
                  placeholder="เลือกสาขาวิชา"
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
                 ประมวลผล
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
              {/* PROMINENT TOP KPI CARDS ZONE */}
              <div style={{ marginBottom: "32px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                  <h2 style={{ fontSize: "18px", fontWeight: "700", margin: 0, color: "#0f172a", display: "flex", alignItems: "center", gap: "8px" }}>
                    <DashboardOutlined style={{ color: "#0284c7" }} /> สรุปภาพรวมสถิตินิสิตและบุคลากร
                  </h2>
                </div>

                <Row gutter={[20, 20]}>
                  {/* KPI 1: จำนวนหลักสูตร (คำนวณจากปีล่าสุด) */}
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
                        <div style={{ color: "#bae6fd", fontSize: "12px", fontWeight: "700", letterSpacing: "0.05em", textTransform: "uppercase" }}>TOTAL PROGRAMS (LATEST YEAR)</div>
                        <h3 style={{ margin: "2px 0 0 0", fontSize: "15px", color: "#f0f9ff", fontWeight: "500", lineHeight: "1.3" }}>หลักสูตรทั้งหมด (ปีล่าสุด)</h3>
                      </div>
                      <div style={{ display: "flex", alignItems: "baseline" }}>
                        <span style={{ fontSize: "32px", fontWeight: "800", color: "#ffffff", lineHeight: "1" }}>
                          {latestYearProgramsCount.toLocaleString()}
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
                        <div style={{ color: "#ddd6fe", fontSize: "12px", fontWeight: "700", letterSpacing: "0.05em", textTransform: "uppercase" }}>GRADUATES / EMPLOYMENT</div>
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

                  {/* KPI 4: บุคลากรรวม (+32 คน) */}
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
                        <h3 style={{ margin: "2px 0 0 0", fontSize: "15px", color: "#fffbeb", fontWeight: "500", lineHeight: "1.3" }}>บุคลากร</h3>
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

              {/* GRAPH SECTION PANEL */}
              <div style={{ marginTop: "32px" }}>
                <Card 
                  style={{ borderRadius: "16px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}
                  title={
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px", padding: "8px 0" }}>
                      <div>
                        <span style={{ fontSize: "16px", fontWeight: "700", color: "#0f172a" }}>
                          แผนภูมิเปรียบเทียบจำนวนนิสิตภาคต้นและภาคปลาย
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
                  {/* กราฟระดับปริญญาตรี */}
                  <div style={{ marginBottom: "36px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "20px" }}>
                      <span style={{ display: "inline-block", width: "4px", height: "16px", backgroundColor: "#0ea5e9", borderRadius: "2px" }}></span>
                      <h4 style={{ color: "#0f172a", fontWeight: "700", margin: 0, fontSize: "15px" }}>
                        🎓 ระดับปริญญาตรี
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
                              fill="#0ea5e9" 
                              radius={[0, 4, 4, 0]}
                              barSize={14}
                              label={renderBarValueLabel} 
                            />
                            <Bar 
                              dataKey="lateTerm" 
                              name="ภาคปลาย" 
                              fill="#10b981" 
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

                  {/* กราฟระดับปริญญาโท */}
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "20px" }}>
                      <span style={{ display: "inline-block", width: "4px", height: "16px", backgroundColor: "#8b5cf6", borderRadius: "2px" }}></span>
                      <h4 style={{ color: "#0f172a", fontWeight: "700", margin: 0, fontSize: "15px" }}>
                        🎓 ระดับปริญญาโท
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

export default Dashboard;
