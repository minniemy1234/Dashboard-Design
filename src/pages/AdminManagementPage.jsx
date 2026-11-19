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
  const [adminNamesMap, setAdminNamesMap] = useState({}); // เก็บคู่ email -> name
  const [adminRolesMap, setAdminRolesMap] = useState({}); // เก็บคู่ email -> role
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
        let list = [DEFAULT_SUPER_ADMIN];
        let names = {};
        let roles = { [DEFAULT_SUPER_ADMIN]: "Super Admin" };

        if (docSnap.exists()) {
          const data = docSnap.data();
          if (Array.isArray(data.list)) {
            list = Array.from(
              new Set(data.list.map((e) => String(e).toLowerCase().trim()))
            );
          }
          if (data.names && typeof data.names === "object") {
            names = data.names;
          }
          if (data.roles && typeof data.roles === "object") {
            roles = { ...data.roles };
          }
          // รองรับข้อมูลโครงสร้างเก่าที่มี superAdmin เดี่ยว
          if (data.superAdmin) {
            const legacySuper = String(data.superAdmin).toLowerCase().trim();
            if (!roles[legacySuper]) {
              roles[legacySuper] = "Super Admin";
            }
          }
        } else {
          setDoc(doc(db, "system_config", "admins"), { 
            list: [DEFAULT_SUPER_ADMIN],
            names: {},
            roles: { [DEFAULT_SUPER_ADMIN]: "Super Admin" }
          }).catch((err) =>
            console.error("Error creating initial admin config:", err)
          );
        }

        setAdminNamesMap(names);
        setAdminRolesMap(roles);
        setAdminList(
          list.map((email, index) => ({
            key: index,
            name: names[email] || "-",
            email: email,
            role: roles[email] || "Admin (ผู้ดูแลระบบ)",
          }))
        );
      },
      (error) => {
        console.error("Firebase Admin Listener Error:", error);
        message.error("ไม่สามารถเชื่อมต่อข้อมูลผู้ใช้งานจาก Cloud ได้");
      }
    );

    return () => unsub();
  }, []);

  // เพิ่มผู้ใช้งานลง Cloud Firebase 
  const handleAddAdmin = (values) => {
    const newName = values.name.trim();
    const newEmail = values.email.trim().toLowerCase();
    const selectedRole = values.role;

    if (!newEmail.endsWith("@ku.th")) {
      message.error("กรุณาใช้อีเมลสถาบัน (@ku.th) เท่านั้น!");
      return;
    }

    const currentAdmins = adminList.map((a) => a.email);
    if (currentAdmins.includes(newEmail)) {
      message.warning("อีเมลนี้มีอยู่ในระบบแล้ว!");
      return;
    }

    Modal.confirm({
      title: <span style={{ fontSize: 18, fontWeight: 600 }}>ยืนยันการเพิ่มผู้ใช้งาน</span>,
      icon: <ExclamationCircleOutlined style={{ color: "#00b4d8", fontSize: 22 }} />,
      width: 520,
      style: { borderRadius: 16, overflow: "hidden" },
      content: (
        <div style={{ marginTop: 12, fontSize: 15, color: "#434343" }}>
          คุณต้องการเพิ่มสิทธิ์การใช้งานให้กับบัญชีนี้ใช่หรือไม่?
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
            <div>ชื่อ: {newName}</div>
            <div>อีเมล: {newEmail}</div>
            <div>บทบาท: {selectedRole}</div>
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
          const updatedNames = { ...adminNamesMap, [newEmail]: newName };
          const updatedRoles = { ...adminRolesMap, [newEmail]: selectedRole };

          // เก็บ superAdmin คนแรกไว้เพื่อความเข้ากันได้กับส่วนอื่น (ถ้ามี)
          const firstSuperAdmin =
            updatedAdmins.find((e) => updatedRoles[e] === "Super Admin") || DEFAULT_SUPER_ADMIN;

          await setDoc(doc(db, "system_config", "admins"), { 
            superAdmin: firstSuperAdmin,
            list: updatedAdmins,
            names: updatedNames,
            roles: updatedRoles
          });

          message.success(`เพิ่มสิทธิ์ ${selectedRole} ให้ ${newName} (${newEmail}) เรียบร้อยแล้ว!`);
          setIsModalOpen(false);
          form.resetFields();
        } catch (error) {
          console.error("Error adding user:", error);
          message.error("เกิดข้อผิดพลาดในการเพิ่มผู้ใช้งาน กรุณาลองใหม่อีกครั้ง");
        } finally {
          setSubmitting(false);
        }
      },
    });
  };

  // เปิด Modal แก้ไขชื่อ อีเมล และบทบาท
  const handleOpenEditModal = (record) => {
    setEditingTargetEmail(record.email);
    editForm.setFieldsValue({ 
      name: record.name === "-" ? "" : record.name,
      email: record.email,
      role: record.role
    });
    setIsEditModalOpen(true);
  };

  // บันทึกการแก้ไขไปยัง Cloud Firebase
  const handleSaveEditAdmin = async (values) => {
    const updatedName = values.name.trim();
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

    // ตรวจสอบจำนวน Super Admin ก่อนบันทึก (ต้องมีอย่างน้อย 1 คนเสมอ)
    const superAdminCount = adminList.filter((a) => a.role === "Super Admin").length;
    const wasSuperAdmin = adminRolesMap[editingTargetEmail] === "Super Admin";

    if (wasSuperAdmin && updatedRole !== "Super Admin" && superAdminCount <= 1) {
      message.warning("ไม่สามารถลดบทบาทได้ เนื่องจากต้องมี Super Admin ในระบบอย่างน้อย 1 ท่าน");
      return;
    }

    setSubmitting(true);
    try {
      const updatedList = currentAdmins.map((e) => (e === editingTargetEmail ? updatedEmail : e));
      const updatedNames = { ...adminNamesMap };
      const updatedRoles = { ...adminRolesMap };

      if (updatedEmail !== editingTargetEmail) {
        delete updatedNames[editingTargetEmail];
        delete updatedRoles[editingTargetEmail];
      }
      updatedNames[updatedEmail] = updatedName;
      updatedRoles[updatedEmail] = updatedRole;

      const firstSuperAdmin =
        updatedList.find((e) => updatedRoles[e] === "Super Admin") || DEFAULT_SUPER_ADMIN;

      await setDoc(doc(db, "system_config", "admins"), { 
        superAdmin: firstSuperAdmin,
        list: updatedList,
        names: updatedNames,
        roles: updatedRoles
      });

      message.success(`บันทึกการแก้ไขของ ${updatedName} เรียบร้อยแล้ว!`);
      setIsEditModalOpen(false);
      editForm.resetFields();
    } catch (error) {
      console.error("Error updating user:", error);
      message.error("เกิดข้อผิดพลาดในการแก้ไขข้อมูล กรุณาลองใหม่อีกครั้ง");
    } finally {
      setSubmitting(false);
    }
  };

  // ลบผู้ใช้งานออกจาก Cloud
  const handleDeleteAdmin = (emailToDelete) => {
    if (adminList.length <= 1) {
      message.error("ไม่สามารถลบได้ ต้องมีผู้ใช้งานคงอยู่อย่างน้อย 1 ท่าน!");
      return;
    }

    const superAdminCount = adminList.filter((a) => a.role === "Super Admin").length;
    const isTargetSuperAdmin = adminRolesMap[emailToDelete] === "Super Admin";

    if (isTargetSuperAdmin && superAdminCount <= 1) {
      message.error("ไม่สามารถลบได้ เนื่องจากต้องมี Super Admin คงอยู่ในระบบอย่างน้อย 1 ท่าน!");
      return;
    }

    const targetName = adminNamesMap[emailToDelete];

    Modal.confirm({
      title: <span style={{ fontSize: 18, fontWeight: 600 }}>ยืนยันการลบผู้ใช้งาน</span>,
      icon: <ExclamationCircleOutlined style={{ color: "#ff4d4f", fontSize: 22 }} />,
      width: 520,
      content: (
        <div style={{ marginTop: 12, fontSize: 15, color: "#434343" }}>
          คุณต้องการลบบัญชีผู้ใช้งานนี้ออกจากระบบใช่หรือไม่?
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
            {targetName ? `${targetName} (${emailToDelete})` : emailToDelete}
          </div>
        </div>
      ),
      okText: "ลบ",
      okType: "danger",
      cancelText: "ยกเลิก",
      maskClosable: true,
      async onOk() {
        try {
          const updatedAdmins = adminList.map((a) => a.email).filter((e) => e !== emailToDelete);
          const updatedNames = { ...adminNamesMap };
          const updatedRoles = { ...adminRolesMap };
          delete updatedNames[emailToDelete];
          delete updatedRoles[emailToDelete];

          const firstSuperAdmin =
            updatedAdmins.find((e) => updatedRoles[e] === "Super Admin") || DEFAULT_SUPER_ADMIN;

          await setDoc(doc(db, "system_config", "admins"), { 
            superAdmin: firstSuperAdmin,
            list: updatedAdmins,
            names: updatedNames,
            roles: updatedRoles
          });
          message.success(`ลบบัญชี ${emailToDelete} เรียบร้อยแล้ว`);
        } catch (error) {
          console.error("Error deleting user:", error);
          message.error("เกิดข้อผิดพลาดในการลบ กรุณาลองใหม่อีกครั้ง");
        }
      },
    });
  };

  // ฟังก์ชันเลือกสี Tag ตามบทบาท
  const getRoleTagColor = (role) => {
    switch (role) {
      case "Super Admin":
        return "gold";
      case "Admin (ผู้ดูแลระบบ)":
        return "blue";
      case "ประธานหลักสูตร":
        return "purple";
      case "ผู้รับผิดชอบหลักสูตร":
        return "cyan";
      case "อาจารย์ผู้สอน":
        return "orange";
      default:
        return "green";
    }
  };

  const roleOptions = (
    <>
      <Select.Option value="User (ผู้ใช้งานทั่วไป)">User (ผู้ใช้งานทั่วไป)</Select.Option>
      <Select.Option value="อาจารย์ผู้สอน">อาจารย์ผู้สอน</Select.Option>
      <Select.Option value="ผู้รับผิดชอบหลักสูตร">ผู้รับผิดชอบหลักสูตร</Select.Option>
      <Select.Option value="ประธานหลักสูตร">ประธานหลักสูตร</Select.Option>
      <Select.Option value="Admin (ผู้ดูแลระบบ)">Admin (ผู้ดูแลระบบ)</Select.Option>
      <Select.Option value="Super Admin">Super Admin (ผู้ดูแลระบบสูงสุด)</Select.Option>
    </>
  );

  const columns = [
    {
      title: "ชื่อ",
      dataIndex: "name",
      key: "name",
      render: (text) => <span style={{ fontWeight: 500, color: "#1f1f1f" }}>{text}</span>,
    },
    {
      title: "อีเมล",
      dataIndex: "email",
      key: "email",
      render: (text) => <b style={{ color: "#262626" }}>{text}</b>,
    },
    {
      title: "บทบาท",
      dataIndex: "role",
      key: "role",
      render: (role) => (
        <Tag 
          color={getRoleTagColor(role)}
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

          {/* ปุ่มลบ */}
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
            ลบ
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
              กำหนดสิทธิ์ผู้ใช้งาน (User Authorization)
            </h2>
            <div style={{ color: "#8c8c8c", fontSize: "13px", lineHeight: "1.4", margin: 0 }}>
              ระบบเพิ่ม แก้ไข และลบบัญชีผู้ใช้งานพร้อมการอัปเดตข้อมูลแบบเรียลไทม์
            </div>
          </div>
        </Header>

        {/* CONTENT SECTION */}
        <Content style={{ padding: "24px 32px 32px 32px", background: "#f5f5f5" }}>
          <Card
            title={
              <div style={{ fontSize: 16, fontWeight: 600, color: "#1f1f1f" }}>
                รายการบัญชีผู้ใช้งาน
              </div>
            }
            extra={
              <Button
                type="primary"
                icon={<UserAddOutlined />}
                style={{ background: "#00b4d8", borderColor: "#00b4d8", borderRadius: 10, height: 40 }}
                onClick={() => {
                  form.setFieldsValue({ role: "User (ผู้ใช้งานทั่วไป)" });
                  setIsModalOpen(true);
                }}
              >
                เพิ่มผู้ใช้งานใหม่
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

          {/* MODAL สำหรับเพิ่มผู้ใช้งาน */}
          <Modal
            title={<span style={{ fontSize: 18, fontWeight: 600 }}>เพิ่มสิทธิ์ผู้ใช้งานใหม่</span>}
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
                name="name"
                label="ชื่อ-นามสกุล"
                rules={[{ required: true, message: "กรุณากรอกชื่อ-นามสกุล" }]}
              >
                <Input placeholder="กรอกชื่อ-นามสกุล" size="large" style={{ borderRadius: 10 }} />
              </Form.Item>

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
                label="บทบาท"
                rules={[{ required: true, message: "กรุณาเลือกบทบาท" }]}
              >
                <Select size="large" style={{ borderRadius: 10 }}>
                  {roleOptions}
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
                  ยืนยันเพิ่มผู้ใช้งาน
                </Button>
              </Form.Item>
            </Form>
          </Modal>

          {/* MODAL สำหรับแก้ไขชื่อ อีเมล และบทบาท */}
          <Modal
            title={<span style={{ fontSize: 18, fontWeight: 600 }}>แก้ไขข้อมูลผู้ใช้งาน</span>}
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
                name="name"
                label="ชื่อ-นามสกุล"
                rules={[{ required: true, message: "กรุณากรอกชื่อ-นามสกุล" }]}
              >
                <Input placeholder="กรอกชื่อ-นามสกุล" size="large" style={{ borderRadius: 10 }} />
              </Form.Item>

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
                label="บทบาท"
                rules={[{ required: true, message: "กรุณาเลือกบทบาท" }]}
              >
                <Select size="large" style={{ borderRadius: 10 }}>
                  {roleOptions}
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
