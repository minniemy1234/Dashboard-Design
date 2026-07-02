import { Layout, Card, Table } from "antd";
import Sidebar from "../components/Sidebar";
import { useState } from "react";

const { Header, Content } = Layout;

function StudentPage() {
  const [searchText, setSearchText] =
    useState("");

  const dashboardData = JSON.parse(
    localStorage.getItem("dashboardData")
  );

  const students =
    dashboardData?.["จำนวนนิสิตลงทะเบียน"] || [];

  const graduates =
    dashboardData?.["ผู้สำเร็จการศึกษา"] || [];

  const dropout =
    dashboardData?.["ลาออก"] || [];

  const columns = [
    {
      title: "รหัสนิสิต",
      dataIndex: "รหัสนิสิต",
    },
    {
      title: "ชื่อ",
      dataIndex: "ชื่อ",
    },
    {
      title: "คณะ",
      dataIndex: "คณะ",
    },
    {
      title: "สาขา",
      dataIndex: "สาขา",
    },
  ];

  const filteredStudents =
    students.filter((item) =>
      JSON.stringify(item)
        .toLowerCase()
        .includes(
          searchText.toLowerCase()
        )
    );

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sidebar />

      <Layout>
        <Header
          style={{
            background: "#fff",
            fontSize: 24,
            fontWeight: "bold",
          }}
        >
          ข้อมูลนิสิต
        </Header>

        <Content
          style={{
            padding: 24,
            background: "#f5f5f5",
          }}
        >
          {/* KPI */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(4,1fr)",
              gap: 20,
              marginBottom: 20,
            }}
          >
            <Card
              style={{
                borderRadius: 16,
                background: "#eff6ff",
              }}
            >
              <h3
                style={{
                  color: "#2563eb",
                }}
              >
                นิสิตทั้งหมด
              </h3>

              <h1
                style={{
                  color: "#2563eb",
                  fontSize: 36,
                }}
              >
                {students.length.toLocaleString()}
              </h1>
            </Card>

            <Card
              style={{
                borderRadius: 16,
                background: "#f0fdf4",
              }}
            >
              <h3
                style={{
                  color: "#16a34a",
                }}
              >
                นิสิตคงอยู่
              </h3>

              <h1
                style={{
                  color: "#16a34a",
                  fontSize: 36,
                }}
              >
                {students.length.toLocaleString()}
              </h1>
            </Card>

            <Card
              style={{
                borderRadius: 16,
                background: "#faf5ff",
              }}
            >
              <h3
                style={{
                  color: "#7c3aed",
                }}
              >
                สำเร็จการศึกษา
              </h3>

              <h1
                style={{
                  color: "#7c3aed",
                  fontSize: 36,
                }}
              >
                {graduates.length.toLocaleString()}
              </h1>
            </Card>

            <Card
              style={{
                borderRadius: 16,
                background: "#fff7ed",
              }}
            >
              <h3
                style={{
                  color: "#ea580c",
                }}
              >
                นิสิตลาออก
              </h3>

              <h1
                style={{
                  color: "#ea580c",
                  fontSize: 36,
                }}
              >
                {dropout.length.toLocaleString()}
              </h1>
            </Card>
          </div>

          {/* Filter */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(3,1fr)",
              gap: 20,
              marginBottom: 20,
            }}
          >
            <input
              placeholder="ค้นหานิสิต"
              value={searchText}
              onChange={(e) =>
                setSearchText(
                  e.target.value
                )
              }
              style={{
                padding: 12,
                borderRadius: 10,
                border:
                  "1px solid #d9d9d9",
              }}
            />

            <select
              style={{
                padding: 12,
                borderRadius: 10,
              }}
            >
              <option>
                ทุกคณะ
              </option>
            </select>

            <select
              style={{
                padding: 12,
                borderRadius: 10,
              }}
            >
              <option>
                ทุกสาขา
              </option>
            </select>
          </div>

          {/* Table */}
          <Card title="ข้อมูลนิสิต">
            <Table
              columns={columns}
              dataSource={
                filteredStudents
              }
              rowKey={(
                record,
                index
              ) => index}
              pagination={{
                pageSize: 10,
              }}
            />
          </Card>
        </Content>
      </Layout>
    </Layout>
  );
}

export default StudentPage;
