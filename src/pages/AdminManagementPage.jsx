import React, { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import { Layout, Card, Table, Button, Input, Modal, Form, Tag, message, Select, Space } from "antd";
import { 
  UserAddOutlined, 
  DeleteOutlined, 
  EditOutlined,
  SafetyCertificateOutlined, 
  ExclamationCircleOutlined 
} from "@ant-design/icons";
import { db } from "../firebase";
import { doc, onSnapshot, setDoc } from "firebase/firestore";

const { Header, Content } = Layout;
const DEFAULT_SUPER_ADMIN = "naramon.si@ku.th";

function AdminManagementPage() {
  const [adminList, setAdminList] = useState([]);
  const [superAdminEmail, setSuperAdminEmail] = useState(DEFAULT_SUPER_ADMIN);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // State สำหรับการแก้ไข
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTargetEmail, setEditingTargetEmail] = useState("");

  const [form] = Form.useForm();
  const [editForm] = Form.useForm();

  useEffect(() => {
    if (!db) {
      console.error("Firebase DB is not initialized");
      return;
    }

    const unsub = onSnapshot(
      doc(db, "system_config", "admins"),
      (docSnap) => {
        let currentSuper = DEFAULT_SUPER_ADMIN;
        let list = [DEFAULT_SUPER_ADMIN];

        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.superAdmin) {
            currentSuper = String(data.superAdmin).toLowerCase().trim();
          }
          if (Array.isArray(data.list)) {
            list = Array.from(
              new Set([currentSuper, ...data.list.map((e) => String(e).toLowerCase().trim())])
            );
          }
        } else {
          setDoc(doc(db, "system_config", "admins"), { 
            superAdmin: DEFAULT_SUPER_ADMIN,
            list: [DEFAULT_SUPER_ADMIN] 
          }).catch((err) =>
            console.error("Error creating initial admin config:", err)
          );
        }

        setSuperAdminEmail(currentSuper);
        setAdminList(
          list.map((email, index) => ({
            key: index,
            email: email,
            role: email === currentSuper ? "Super Admin" : "Admin (ผู้ดูแลระบบ)",
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
    const selectedRole = values.role;

    if (!newEmail.endsWith("@ku.th")) {
      message.error("กรุณาใช้อีเมลสถาบัน (@ku.th) เท่านั้น!");
      return;
    }

    const currentAdmins = adminList.map((a) => a.email);
    if (currentAdmins.includes(newEmail)) {
      message.warning("อีเมลนี้มีสิทธิ์เป็นแอดมินในระบบอยู่แล้ว!");
      return;
    }

    Modal.confirm({
      title: <span style={{ fontSize: 18, fontWeight: 600 }}>ยืนยันการแต่งตั้งผู้ดูแลระบบ</span>,
      icon: <ExclamationCircleOutlined style={{ color: "#00b4d8", fontSize: 22 }} />,
      width: 520,
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
            {newEmail} ({selectedRole})
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
          const updatedSuperAdmin = selectedRole === "Super Admin" ? newEmail : superAdminEmail;

          await setDoc(doc(db, "system_config", "admins"), { 
            superAdmin: updatedSuperAdmin,
            list: updatedAdmins 
          });

          message.success(`เพิ่มสิทธิ์ ${selectedRole} ให้ ${newEmail} เรียบร้อยแล้ว!`);
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

  // เปิด Modal แก้ไขอีเมลและสิทธิ์
  const handleOpenEditModal = (record) => {
    setEditingTargetEmail(record.email);
    editForm.setFieldsValue({ 
      email: record.email,
      role: record.role === "Super Admin" ? "Super Admin" : "Admin (ผู้ดูแลระบบ)"
    });
    setIsEditModalOpen(true);
  };

  // บันทึกการแก้ไขไปยัง Cloud Firebase
  const handleSaveEditAdmin = async (values) => {
    const updatedEmail = values.email.trim().toLowerCase();
    const updatedRole = values.role;

    if (!updatedEmail.endsWith("@ku.th")) {
      message.error("กรุณาใช้อีเมลสถาบัน (@ku.th) เท่านั้น!");
      return;
    }

    const currentAdmins = adminList.map((a) => a.email);
    
    // ตรวจสอบกรณีเปลี่ยนอีเมลไปซ้ำกับคนอื่น
    if (updatedEmail !== editingTargetEmail && currentAdmins.includes(updatedEmail)) {
      message.warning("อีเมลใหม่นี้มีอยู่ในระบบแล้ว!");
      return;
    }

    setSubmitting(true);
    try {
      let updatedList = currentAdmins.map((e) => (e === editingTargetEmail ? updatedEmail : e));
      let newSuperAdmin = superAdminEmail;

      // ถ้าคนเดิมเป็น Super Admin แล้วถูกเปลี่ยนบทบาทเป็น Admin ให้ย้ายสิทธิ์ Super Admin
      if (editingTargetEmail === superAdminEmail && updatedRole !== "Super Admin") {
        if (updatedEmail !== editingTargetEmail) {
          newSuperAdmin = updatedEmail; // เปลี่ยนเป็นอีเมลใหม่ถ้าระบุ
        } else {
          // หากปรับ Super Admin คนเดิมลงเป็น Admin ต้องเลือกคนอื่นขึ้นมาเป็น Super Admin แทน
          const otherAdmin = updatedList.find(e => e !== editingTargetEmail);
          if (otherAdmin) {
            newSuperAdmin = otherAdmin;
            message.info(`ระบบแต่งตั้งให้ ${otherAdmin} เป็น Super Admin แทนเรียบร้อยแล้ว`);
          }
        }
      }

      // ถ้าเลือกระดับสิทธิ์ให้คนนี้เป็น Super Admin ใหม่
      if (updatedRole === "Super Admin") {
        newSuperAdmin = updatedEmail;
      }

      await setDoc(doc(db, "system_config", "admins"), { 
        superAdmin: newSuperAdmin,
        list: updatedList 
      });

      message.success(`บันทึกการแก้ไขของ ${updatedEmail} เรียบร้อยแล้ว!`);
      setIsEditModalOpen(false);
      editForm.resetFields();
    } catch (error) {
      console.error("Error updating admin:", error);
      message.error("เกิดข้อผิดพลาดในการแก้ไขข้อมูล กรุณาลองใหม่อีกครั้ง");
    } finally {
      setSubmitting(false);
    }
  };

  // ถอนสิทธิ์แอดมินออกจาก Cloud
  const handleDeleteAdmin = (emailToDelete) => {
    if (adminList.length <= 1) {
      message.error("ไม่สามารถถอนสิทธิ์ได้ ต้องมีผู้ดูแลระบบคงอยู่อย่างน้อย 1 ท่าน!");
      return;
    }

    Modal.confirm({
      title: <span style={{ fontSize: 18, fontWeight: 600 }}>ยืนยันการถอนสิทธิ์แอดมิน</span>,
      icon: <ExclamationCircleOutlined style={{ color: "#ff4d4f", fontSize: 22 }} />,
      width: 520,
      content: (
        <div style={{ marginTop: 12, fontSize: 15, color: "#434343" }}>
          คุณต้องการถอนสิทธิ์ผู้ดูแลระบบของบัญชีนี้ใช่หรือไม่?
          <div 
            style={{ 
              marginTop: 12, 
              padding: "12px 16px", 
              background: "#fff1f0", 
              borderRadius: 10, 
              border: "1px solid #ffa39e",
              color: "#cf1322",
              fontWeight: 600,
              wordBreak: "break-all"
            }}
          >
            {emailToDelete}
          </div>
        </div>
      ),
      okText: "ถอนสิทธิ์",
      okType: "danger",
      cancelText: "ยกเลิก",
      maskClosable: true,
      async onOk() {
        try {
          const updatedAdmins = adminList.map((a) => a.email).filter((e) => e !== emailToDelete);
          let newSuperAdmin = superAdminEmail;

          // ถ้าลบ Super Admin หลักออก ให้โอนสิทธิ์ Super Admin ให้แอดมินคนที่เหลืออยู่
          if (emailToDelete === superAdminEmail) {
            newSuperAdmin = updatedAdmins[0];
            message.info(`ระบบแต่งตั้งให้ ${newSuperAdmin} เป็น Super Admin หลักคนใหม่เรียบร้อยแล้ว`);
          }

          await setDoc(doc(db, "system_config", "admins"), { 
            superAdmin: newSuperAdmin,
            list: updatedAdmins 
          });
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
          color={record.email === superAdminEmail ? "gold" : "blue"}
          style={{ borderRadius: 12, padding: "2px 10px", fontWeight: 500 }}
        >
          {role}
        </Tag>
      ),
    },
    {
      title: "การจัดการ",
      key: "action",
      width: 200,
      render: (_, record) => (
        <Space size="middle">
          {/* ปุ่มแก้ไข */}
          <Button
            type="default"
            icon={<EditOutlined style={{ color: "#00b4d8" }} />}
            onClick={() => handleOpenEditModal(record)}
            style={{ 
              borderRadius: 8, 
              color: "#00b4d8", 
              backgroundColor: "#e6f7ff",
              borderColor: "#91d5ff",
              fontWeight: 500,
              boxShadow: "0 2px 4px rgba(0, 180, 216, 0.1)"
            }}
          >
            แก้ไข
          </Button>

          {/* ปุ่มถอนสิทธิ์ */}
          <Button
            type="default"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteAdmin(record.email)}
            style={{ 
              borderRadius: 8, 
              backgroundColor: "#fff1f0",
              borderColor: "#ffa39e",
              fontWeight: 500,
              boxShadow: "0 2px 4px rgba(255, 77, 79, 0.1)"
            }}
          >
            ถอนสิทธิ์
          </Button>
        </Space>
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
              ระบบเพิ่ม แก้ไข และถอนสิทธิ์บัญชีผู้ดูแลระบบพร้อมการอัปเดตข้อมูลแบบเรียลไทม์
            </div>
          </div>
        </Header>

        {/* CONTENT SECTION */}
        <Content style={{ padding: "24px 32px 32px 32px", background: "#f5f5f5" }}>
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
                onClick={() => {
                  form.setFieldsValue({ role: "Admin (ผู้ดูแลระบบ)" });
                  setIsModalOpen(true);
                }}
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

              <Form.Item
                name="role"
                label="ระดับสิทธิ์ผู้ดูแลระบบ"
                rules={[{ required: true, message: "กรุณาเลือกระดับสิทธิ์" }]}
              >
                <Select size="large" style={{ borderRadius: 10 }}>
                  <Select.Option value="Admin (ผู้ดูแลระบบ)">Admin (ผู้ดูแลระบบ)</Select.Option>
                  <Select.Option value="Super Admin">Super Admin (ผู้ดูแลระบบสูงสุด)</Select.Option>
                </Select>
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

          {/* MODAL สำหรับแก้ไขอีเมลและสิทธิ์แอดมิน */}
          <Modal
            title={<span style={{ fontSize: 18, fontWeight: 600 }}>แก้ไขข้อมูลผู้ดูแลระบบ</span>}
            open={isEditModalOpen}
            onCancel={() => {
              setIsEditModalOpen(false);
              editForm.resetFields();
            }}
            footer={null}
            destroyOnClose
            style={{ borderRadius: 16 }}
          >
            <Form form={editForm} layout="vertical" onFinish={handleSaveEditAdmin} style={{ marginTop: 16 }}>
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

              <Form.Item
                name="role"
                label="ระดับสิทธิ์ผู้ดูแลระบบ"
                rules={[{ required: true, message: "กรุณาเลือกระดับสิทธิ์" }]}
              >
                <Select size="large" style={{ borderRadius: 10 }}>
                  <Select.Option value="Admin (ผู้ดูแลระบบ)">Admin (ผู้ดูแลระบบ)</Select.Option>
                  <Select.Option value="Super Admin">Super Admin (ผู้ดูแลระบบสูงสุด)</Select.Option>
                </Select>
              </Form.Item>

              <Form.Item style={{ marginBottom: 0, textAlign: "right", marginTop: 24 }}>
                <Button
                  style={{ marginRight: 8, borderRadius: 10, height: 40 }}
                  onClick={() => {
                    setIsEditModalOpen(false);
                    editForm.resetFields();
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
                  บันทึกการแก้ไข
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
