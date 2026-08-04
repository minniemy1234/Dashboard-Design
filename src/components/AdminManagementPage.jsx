import React, { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import { Layout, Card, Table, Button, Input, Modal, Form, Tag, message, Alert } from "antd";
import { UserAddOutlined, DeleteOutlined, SafetyCertificateOutlined, LockOutlined, ExclamationCircleOutlined } from "@ant-design/icons";
import { db } from "../firebase";
import { doc, onSnapshot, setDoc } from "firebase/firestore";

const { Header, Content } = Layout;
const SUPER_ADMIN_EMAIL = "naramon.si@ku.th";

function AdminManagementPage() {
  const [adminList, setAdminList] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  const currentEmail = (localStorage.getItem("email") || "").toLowerCase().trim();
  const isSuperAdmin = currentEmail === SUPER_ADMIN_EMAIL;

 
  useEffect(() => {
    if (!db) {
      console.error("Firebase DB is not initialized");
      return;
    }

    const unsub = onSnapshot(
      doc(db, "system_config", "admins"),
      (docSnap) => {
        let admins = [SUPER_ADMIN_EMAIL];
        
        if (docSnap.exists() && Array.isArray(docSnap.data().list)) {
          admins = Array.from(
            new Set([SUPER_ADMIN_EMAIL, ...docSnap.data().list.map((e) => String(e).toLowerCase().trim())])
          );
        } else {
         
          setDoc(doc(db, "system_config", "admins"), { list: [SUPER_ADMIN_EMAIL] }).catch((err) =>
            console.error("Error creating initial admin config:", err)
          );
        }

        setAdminList(
          admins.map((email, index) => ({
            key: index,
            email: email,
            role: email === SUPER_ADMIN_EMAIL ? "Super Admin" : "Admin (ผู้ดูแลระบบ)",
          }))
        );
      },
      (error) => {
        console.error("Firebase Admin Listener Error:", error);
        message.error("ไม่สามารถเชื่อมต่อข้อมูลแอดมินจาก Cloud ได้");
      }
    );

    return () => unsub();
  }, []);

  // เพิ่มอีเมลแอดมินลง Cloud Firebase 
  const handleAddAdmin = (values) => {
    const newEmail = values.email.trim().toLowerCase();

    if (!newEmail.endsWith("@ku.th")) {
      message.error("กรุณาใช้อีเมลสถาบัน (@ku.th) เท่านั้น!");
      return;
    }

    const currentAdmins = adminList.map((a) => a.email);
    if (currentAdmins.includes(newEmail)) {
      message.warning("อีเมลนี้มีสิทธิ์เป็นแอดมินในระบบอยู่แล้ว!");
      return;
    }

    // แสดง Pop-up ยืนยัน
    Modal.confirm({
      title: <span style={{ fontSize: 18, fontWeight: 600 }}>ยืนยันการแต่งตั้งผู้ดูแลระบบ</span>,
      icon: <ExclamationCircleOutlined style={{ color: "#00b4d8", fontSize: 22 }} />,
      width: 520, // 👈 ปรับความกว้างให้เท่ากับ Modal มาตรฐานของ Ant Design (520px)
      style: { borderRadius: 16, overflow: "hidden" },
      content: (
        <div style={{ marginTop: 12, fontSize: 15, color: "#434343" }}>
          คุณต้องการเพิ่มสิทธิ์ผู้ดูแลระบบให้กับบัญชีนี้ใช่หรือไม่?
          <div 
            style={{ 
              marginTop: 12, 
              padding: "12px 16px", 
              background: "#e6f7ff", 
              borderRadius: 10, 
              border: "1px solid #91d5ff",
              color: "#0050b3",
              fontWeight: 600,
              wordBreak: "break-all"
            }}
          >
            {newEmail}
          </div>
        </div>
      ),
      okText: "ยืนยัน",
      cancelText: "ยกเลิก",
      okButtonProps: { 
        style: { background: "#00b4d8", borderColor: "#00b4d8", borderRadius: 10, height: 40 } 
      },
      cancelButtonProps: {
        style: { borderRadius: 10, height: 40 }
      },
      maskClosable: true,
      async onOk() {
        setSubmitting(true);
        try {
          const updatedAdmins = [...currentAdmins, newEmail];
          await setDoc(doc(db, "system_config", "admins"), { list: updatedAdmins });

          message.success(`เพิ่มสิทธิ์ผู้ดูแลระบบให้ ${newEmail} เรียบร้อยแล้ว!`);
          setIsModalOpen(false);
          form.resetFields();
        } catch (error) {
          console.error("Error adding admin:", error);
          message.error("เกิดข้อผิดพลาดในการเพิ่มผู้ดูแลระบบ กรุณาลองใหม่อีกครั้ง");
        } finally {
          setSubmitting(false);
        }
      },
    });
  };

  // ถอนสิทธิ์แอดมินออกจาก Cloud
  const handleDeleteAdmin = (emailToDelete) => {
    if (emailToDelete === SUPER_ADMIN_EMAIL) {
      message.error("ไม่สามารถถอนสิทธิ์ Super Admin หลักได้!");
      return;
    }

    Modal.confirm({
      title: <span style={{ fontSize: 18, fontWeight: 600 }}>ยืนยันการถอนสิทธิ์แอดมิน</span>,
      width: 520,
      content: `คุณต้องการถอนสิทธิ์ผู้ดูแลระบบของ "${emailToDelete}" ใช่หรือไม่?`,
      okText: "ถอนสิทธิ์",
      okType: "danger",
      cancelText: "ยกเลิก",
      maskClosable: true,
      async onOk() {
        try {
          const updatedAdmins = adminList.map((a) => a.email).filter((e) => e !== emailToDelete);
          await setDoc(doc(db, "system_config", "admins"), { list: updatedAdmins });
          message.success(`ถอนสิทธิ์แอดมิน ${emailToDelete} เรียบร้อยแล้ว`);
        } catch (error) {
          console.error("Error deleting admin:", error);
          message.error("เกิดข้อผิดพลาดในการถอนสิทธิ์ กรุณาลองใหม่อีกครั้ง");
        }
      },
    });
  };

  const columns = [
    {
      title: "อีเมลผู้ดูแลระบบ",
      dataIndex: "email",
      key: "email",
      render: (text) => <b style={{ color: "#262626" }}>{text}</b>,
    },
    {
      title: "ระดับสิทธิ์",
      dataIndex: "role",
      key: "role",
      render: (role, record) => (
        <Tag 
          color={record.email === SUPER_ADMIN_EMAIL ? "gold" : "blue"}
          style={{ borderRadius: 12, padding: "2px 10px", fontWeight: 500 }}
        >
          {role}
        </Tag>
      ),
    },
    {
      title: "การจัดการ",
      key: "action",
      width: 120,
      render: (_, record) =>
        record.email !== SUPER_ADMIN_EMAIL && isSuperAdmin ? (
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteAdmin(record.email)}
            style={{ borderRadius: 6 }}
          >
            ถอนสิทธิ์
          </Button>
        ) : (
          <span style={{ color: "#bfbfbf", fontSize: 13 }}>-</span>
        ),
    },
  ];

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sidebar />
      <Layout>
        {/* HEADER SECTION */}
        <Header
          style={{
            background: "white",
            display: "flex",
            justify: "space-between",
            alignItems: "center",
            padding: "16px 24px",
            height: "auto",
            borderBottom: "1px solid #f0f0f0",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <h2 style={{ margin: 0, fontSize: "20px", fontWeight: "600", color: "#1f1f1f", lineHeight: "1.2" }}>
              <SafetyCertificateOutlined style={{ color: "#ff4d4f", marginRight: 8 }} />
              จัดการสิทธิ์ผู้ดูแลระบบ (Admin Management)
            </h2>
            <div style={{ color: "#8c8c8c", fontSize: "13px", lineHeight: "1.4", margin: 0 }}>
              ระบบเพิ่มและถอนสิทธิ์บัญชีผู้ดูแลระบบพร้อมการอัปเดตข้อมูลแบบเรียลไทม์
            </div>
          </div>
        </Header>

        {/* CONTENT SECTION */}
        <Content style={{ padding: "24px 32px 32px 32px", background: "#f5f5f5" }}>
          {!isSuperAdmin ? (
            <Alert
              message="ไม่มีสิทธิ์เข้าถึงส่วนการจัดการนี้"
              description={`เฉพาะ Super Admin หลัก (${SUPER_ADMIN_EMAIL}) เท่านั้นที่มีสิทธิ์จัดการเพิ่มหรือถอนสิทธิ์แอดมินคนอื่นได้`}
              type="error"
              showIcon
              icon={<LockOutlined />}
              style={{ borderRadius: 16, padding: "16px 20px" }}
            />
          ) : (
            <Card
              title={
                <div style={{ fontSize: 16, fontWeight: 600, color: "#1f1f1f" }}>
                  รายการบัญชีผู้ดูแลระบบทั้งหมด (Cloud Realtime)
                </div>
              }
              extra={
                <Button
                  type="primary"
                  icon={<UserAddOutlined />}
                  style={{ background: "#00b4d8", borderColor: "#00b4d8", borderRadius: 10, height: 40 }}
                  onClick={() => setIsModalOpen(true)}
                >
                  เพิ่มแอดมินใหม่
                </Button>
              }
              style={{ borderRadius: 20, boxShadow: "0 2px 12px rgba(0,0,0,0.05)", border: "none" }}
            >
              <Table 
                columns={columns} 
                dataSource={adminList} 
                pagination={false} 
                style={{ borderRadius: 12, overflow: "hidden" }}
              />
            </Card>
          )}

          {/* MODAL สำหรับเพิ่มแอดมิน */}
          <Modal
            title={<span style={{ fontSize: 18, fontWeight: 600 }}>เพิ่มสิทธิ์ผู้ดูแลระบบใหม่</span>}
            open={isModalOpen}
            onCancel={() => {
              setIsModalOpen(false);
              form.resetFields();
            }}
            footer={null}
            destroyOnClose
            style={{ borderRadius: 16 }}
          >
            <Form form={form} layout="vertical" onFinish={handleAddAdmin} style={{ marginTop: 16 }}>
              <Form.Item
                name="email"
                label="อีเมล Google KU (@ku.th)"
                rules={[
                  { required: true, message: "กรุณากรอกอีเมล" },
                  { type: "email", message: "รูปแบบอีเมลไม่ถูกต้อง" },
                  {
                    validator: (_, value) => {
                      if (!value || value.trim().toLowerCase().endsWith("@ku.th")) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error("ต้องเป็นอีเมลองค์กร @ku.th เท่านั้น"));
                    },
                  },
                ]}
              >
                <Input placeholder="example.a@ku.th" size="large" style={{ borderRadius: 10 }} />
              </Form.Item>

              <Form.Item style={{ marginBottom: 0, textAlign: "right", marginTop: 24 }}>
                <Button
                  style={{ marginRight: 8, borderRadius: 10, height: 40 }}
                  onClick={() => {
                    setIsModalOpen(false);
                    form.resetFields();
                  }}
                >
                  ยกเลิก
                </Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={submitting}
                  style={{ background: "#00b4d8", borderColor: "#00b4d8", borderRadius: 10, height: 40 }}
                >
                  ยืนยันเพิ่มแอดมิน
                </Button>
              </Form.Item>
            </Form>
          </Modal>
        </Content>
      </Layout>
    </Layout>
  );
}

export default AdminManagementPage;
