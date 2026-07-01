import Sidebar from "../components/Sidebar";
import { useState, useEffect } from "react";
import {
  Layout,
  Card,
  Button,
  Modal,
  message,
  Empty,
  Select,
  Table,
  Alert,
  Tag,
} from "antd";
import {
  UploadOutlined,
  FileExcelOutlined,
  CheckCircleOutlined,
  BarChartOutlined,
} from "@ant-design/icons";

const { Header, Content } = Layout;

// ตั้งค่า URL ของ Backend — Vite ใช้ import.meta.env แทน process.env ของ Next.js
// ต้องมีไฟล์ .env ที่ root ของโปรเจ็ค มีบรรทัด: VITE_API_URL=https://xxxxx
const API = import.meta.env.VITE_API_URL || "http://localhost:8000";

function UploadPage() {
  // ── State: รายชื่อตารางจาก backend ──────────────────────────────
  const [tables, setTables] = useState([]);
  const [tableName, setTableName] = useState(undefined);

  // ── State: ไฟล์ที่เลือก ──────────────────────────────────────────
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileName, setFileName] = useState("");

  // ── State: ผลลัพธ์จาก /preview และ modal ────────────────────────
  const [previewData, setPreviewData] = useState(null);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // ── โหลดรายชื่อตารางตอนเข้าหน้า ──────────────────────────────────
  useEffect(() => {
    fetch(`${API}/api/tables`)
      .then((res) => res.json())
      .then((data) => setTables(data))
      .catch(() =>
        message.error("โหลดรายชื่อตารางไม่ได้ — ตรวจสอบว่า Backend กำลังทำงานอยู่")
      );
  }, []);

  // ── เลือกไฟล์ (ไม่ parse ที่เบราว์เซอร์แล้ว — backend จัดการให้) ──
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const ext = file.name.split(".").pop().toLowerCase();
    if (!["xlsx", "csv"].includes(ext)) {
      message.error("รองรับเฉพาะไฟล์ .xlsx และ .csv เท่านั้น");
      return;
    }

    setSelectedFile(file);
    setFileName(file.name);
  };

  // ── Step 1: ส่งไฟล์ไปตรวจสอบ (preview) ───────────────────────────
  const handlePreview = async () => {
    if (!tableName) {
      message.warning("กรุณาเลือกตารางก่อน");
      return;
    }
    if (!selectedFile) {
      message.warning("กรุณาเลือกไฟล์ก่อน");
      return;
    }

    setLoading(true);
    const form = new FormData();
    form.append("table_name", tableName);
    form.append("file", selectedFile);

    try {
      const res = await fetch(`${API}/api/upload/preview`, {
        method: "POST",
        body: form,
      });
      const data = await res.json();

      if (!res.ok) {
        // FastAPI ส่ง { detail: "..." } กลับมาเมื่อ error
        const detail = Array.isArray(data.detail)
          ? data.detail.join(" / ")
          : data.detail || "เกิดข้อผิดพลาด";
        message.error(detail);
        return;
      }

      setPreviewData(data);
      setPreviewModalOpen(true);
    } catch (err) {
      message.error("เชื่อมต่อ Backend ไม่ได้ — ตรวจสอบ API URL และการเชื่อมต่อ");
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: ยืนยันนำเข้าจริง (confirm) ───────────────────────────
  const handleConfirm = () => {
    Modal.confirm({
      title: `ยืนยันการนำเข้าข้อมูล ${previewData.total_rows} แถว?`,
      content: `ตาราง: ${tableName} — การกระทำนี้จะบันทึกข้อมูลลงฐานข้อมูลจริง`,
      okText: "ยืนยันนำเข้า",
      cancelText: "ยกเลิก",
      onOk: async () => {
        setLoading(true);
        try {
          const res = await fetch(`${API}/api/upload/confirm`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              table_name: tableName,
              session_data: previewData.session_data,
            }),
          });
          const result = await res.json();

          if (!res.ok) {
            message.error(result.detail || "นำเข้าไม่สำเร็จ");
            return;
          }

          if (result.status === "ok") {
            message.success(
              `นำเข้าสำเร็จ ${result.inserted} แถว` +
                (result.skipped ? ` (ข้ามซ้ำ ${result.skipped} แถว)` : "")
            );
          } else {
            message.warning(
              `นำเข้าบางส่วน: สำเร็จ ${result.inserted} / ผิดพลาด ${result.error_count} แถว`
            );
          }

          // reset ทุกอย่างกลับสู่สถานะเริ่มต้น
          setPreviewModalOpen(false);
          setPreviewData(null);
          setSelectedFile(null);
          setFileName("");
          setTableName(undefined);
        } catch (err) {
          message.error("เชื่อมต่อ Backend ไม่ได้ระหว่างนำเข้าข้อมูล");
        } finally {
          setLoading(false);
        }
      },
    });
  };

  // ── สร้าง columns สำหรับ antd Table จาก preview ──────────────────
  const previewColumns =
    previewData?.columns.map((col) => ({
      title: col,
      dataIndex: col,
      key: col,
      ellipsis: true,
      width: 140,
    })) || [];

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sidebar />
      <Layout>
        <Header
          style={{
            background: "white",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "20px 20px",
            height: "auto",
            lineHeight: "normal",
          }}
        >
          <div style={{ paddingTop: 10 }}>
            <h2 style={{ margin: 0 }}>Data Management</h2>
            <div style={{ color: "#888", fontSize: 13, marginTop: 2 }}>
              จัดการข้อมูล อัปโหลด และนำเข้าสู่ฐานข้อมูล PostgreSQL โดยตรง
            </div>
          </div>
        </Header>

        <Content style={{ padding: "16px 32px 32px 32px", background: "#f5f5f5" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "55% 45%",
              gap: 20,
              alignItems: "start",
            }}
          >
            {/* ฝั่งซ้าย: อัปโหลดไฟล์ */}
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <Card
                title="นำเข้าข้อมูลเข้าฐานข้อมูล"
                style={{ borderRadius: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}
                bodyStyle={{ padding: 20 }}
              >
                {/* เลือกตาราง */}
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: "block", marginBottom: 6, fontWeight: 500, fontSize: 13 }}>
                    เลือกตารางปลายทาง
                  </label>
                  <Select
                    style={{ width: "100%" }}
                    placeholder="— เลือกตาราง —"
                    value={tableName}
                    onChange={setTableName}
                    options={tables.map((t) => ({
                      value: t.table_name,
                      label: `${t.label} (${t.table_name})`,
                    }))}
                  />
                </div>

                {/* เลือกไฟล์ */}
                <div
                  style={{
                    border: "2px dashed #d9d9d9",
                    padding: "20px 16px",
                    borderRadius: 12,
                    textAlign: "center",
                    background: "#fafafa",
                    marginBottom: 16,
                  }}
                >
                  <UploadOutlined style={{ fontSize: 24, color: "#888", marginBottom: 8 }} />
                  <div>
                    <label htmlFor="file-upload" style={{ cursor: "pointer", color: "#3b82f6", fontWeight: 600 }}>
                      คลิกเลือกไฟล์ข้อมูล
                    </label>
                    <input
                      id="file-upload"
                      type="file"
                      accept=".xlsx,.csv"
                      onChange={handleFileChange}
                      style={{ display: "none" }}
                    />
                  </div>
                  <div style={{ fontSize: 11, color: "#aaa", marginTop: 4 }}>
                    รองรับ .xlsx และ .csv (รวม CSV UTF-8)
                  </div>
                </div>

                {fileName && (
                  <div
                    style={{
                      background: "#f9fafb",
                      padding: 12,
                      borderRadius: 10,
                      border: "1px solid #e5e7eb",
                      marginBottom: 16,
                      fontSize: 13,
                    }}
                  >
                    <FileExcelOutlined style={{ color: "#10b981", marginRight: 6 }} />
                    <b>ไฟล์ที่เลือก:</b> {fileName}
                  </div>
                )}

                <Button
                  type="primary"
                  icon={<CheckCircleOutlined />}
                  disabled={!selectedFile || !tableName}
                  loading={loading}
                  onClick={handlePreview}
                  style={{ width: "100%", height: 40, borderRadius: 8 }}
                >
                  ตรวจสอบไฟล์ก่อนนำเข้า
                </Button>
              </Card>

              {/* หมายเหตุ: ฟีเจอร์อัปโหลดกราฟสาขาแยก ยังไม่มีตารางรองรับใน Backend
                  ต้องคุยกับทีม Backend เพื่อเพิ่มตารางใหม่ก่อน ถ้าต้องการใช้ต่อ */}
              <Card
                title="อัปโหลดไฟล์กราฟสาขา"
                style={{ borderRadius: 16, border: "1px solid #ffd591", opacity: 0.7 }}
                bodyStyle={{ padding: 20 }}
              >
                <Alert
                  type="warning"
                  showIcon
                  message="ฟีเจอร์นี้ยังไม่เชื่อมกับฐานข้อมูล"
                  description="ต้องเพิ่มตารางใหม่ใน Backend (table_registry.py) ก่อนใช้งานได้ — แจ้งทีม Backend เพื่อออกแบบตารางเพิ่มเติม"
                />
              </Card>
            </div>

            {/* ฝั่งขวา: รายชื่อตารางในระบบ */}
            <Card
              title="ตารางทั้งหมดในระบบ"
              style={{ borderRadius: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}
              bodyStyle={{ padding: 20 }}
            >
              <p style={{ color: "#666", fontSize: 13, marginBottom: 16 }}>
                รายชื่อตารางที่พร้อมนำเข้าข้อมูล — เลือกจาก dropdown ด้านซ้ายเพื่ออัปโหลด
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {tables.map((t) => (
                  <div
                    key={t.table_name}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "10px 14px",
                      background: tableName === t.table_name ? "#f0f7ff" : "#fff",
                      border: "1px solid #e5e7eb",
                      borderRadius: 10,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: "50%",
                          background: "#52c41a",
                        }}
                      />
                      <span style={{ fontWeight: 500, fontSize: 14 }}>{t.label}</span>
                    </div>
                    <Tag>{t.table_name}</Tag>
                  </div>
                ))}
                {tables.length === 0 && (
                  <Empty description="โหลดรายชื่อตารางไม่ได้" style={{ padding: "20px 0" }} />
                )}
              </div>
            </Card>
          </div>
        </Content>
      </Layout>

      {/* ── Preview Modal ── */}
      <Modal
        title="ตัวอย่างข้อมูลก่อนนำเข้า"
        open={previewModalOpen}
        onCancel={() => setPreviewModalOpen(false)}
        width={900}
        footer={[
          <Button key="cancel" onClick={() => setPreviewModalOpen(false)}>
            ยกเลิก
          </Button>,
          <Button key="confirm" type="primary" loading={loading} onClick={handleConfirm}>
            ยืนยันนำเข้า {previewData?.total_rows} แถว
          </Button>,
        ]}
      >
        {previewData && (
          <>
            <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
              <Tag color="blue">ทั้งหมด {previewData.total_rows} แถว</Tag>
              <Tag color="orange">ตัดแถวสรุปออก {previewData.removed_rows} แถว</Tag>
              <Tag color="default">Encoding: {previewData.encoding}</Tag>
            </div>

            {previewData.warnings?.length > 0 && (
              <Alert
                type="warning"
                showIcon
                style={{ marginBottom: 16 }}
                message="ข้อควรระวัง"
                description={
                  <ul style={{ margin: 0, paddingLeft: 18 }}>
                    {previewData.warnings.map((w, i) => (
                      <li key={i}>{w}</li>
                    ))}
                  </ul>
                }
              />
            )}

            <Table
              dataSource={previewData.preview.map((row, i) => ({ ...row, key: i }))}
              columns={previewColumns}
              size="small"
              scroll={{ x: true }}
              pagination={false}
            />
          </>
        )}
      </Modal>
    </Layout>
  );
}

export default UploadPage;
