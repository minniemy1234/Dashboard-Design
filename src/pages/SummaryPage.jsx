import { Layout, Card } from "antd";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  
} from "recharts";
import Sidebar from "../components/Sidebar";

const { Header, Content } = Layout;

function SummaryPage() {
  const dashboardData =
  JSON.parse(
    localStorage.getItem("dashboardData")
  ) || {};

  const students =
dashboardData?.["จำนวนนิสิตลงทะเบียน"] || [];

const teachers =
dashboardData?.["อาจารย์สาขา"] || [];

const employment =
dashboardData?.["ภาวะการมีงานทำ"] || [];

// นิสิตทั้งหมด
const totalStudents =
students.reduce(
(sum, item) =>
sum +
Number(item["ชั้นปีที่ 1"] || 0) +
Number(item["ชั้นปีที่ 2"] || 0) +
Number(item["ชั้นปีที่ 3"] || 0) +
Number(item["ชั้นปีที่ 4"] || 0) +
Number(item["ชั้นปีที่ 5"] || 0) +
Number(item["ชั้นปีที่ 6"] || 0),
0
);

// ผู้สำเร็จการศึกษา
const totalGraduates =
employment.reduce(
(sum, item) =>
sum +
Number(
item["ผู้สำเร็จการศึกษา"] || 0
),
0
);

// ผู้มีงานทำ
const employed =
employment.reduce(
(sum, item) =>
sum +
Number(
item["ผู้มีงานทำ"] || 0
),
0
);

const employmentRate =
totalGraduates > 0
? (
(employed /
totalGraduates) *
100
).toFixed(2)
: 0;

const chartData = [
  {
    name: "นิสิต",
    value: totalStudents,
  },
  {
    name: "สำเร็จ",
    value: totalGraduates,
  },
  {
    name: "อาจารย์",
    value: teachers.length,
  },
];

const employmentChart =
  employment.map((item) => ({
    name: item["ชื่อสาขา"],
    employed: Number(
      item["ผู้มีงานทำ"] || 0
    ),
  }));



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
          รายงานสรุป
        </Header>

        <Content
          style={{
            padding: 24,
            background: "#f5f5f5",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(4,1fr)",
              gap: 20,
              marginBottom: 24,
            }}
          >
            <Card>
              <h3>นิสิตทั้งหมด</h3>
              <h1>
                {totalStudents.toLocaleString()}
              </h1>
            </Card>

            <Card>
              <h3>สำเร็จการศึกษา</h3>
              <h1>
                {totalGraduates.toLocaleString()}
              </h1>
            </Card>

            <Card>
              <h3>อาจารย์</h3>
              <h1>
                {teachers.length.toLocaleString()}
              </h1>
            </Card>

            <Card>
              <h3>มีงานทำ</h3>
              <h1>
                {employmentRate}%
              </h1>
            </Card>
          </div>


<Card
  title="ภาพรวมมหาวิทยาลัย"
  style={{ marginBottom: 24 }}
>
  <ResponsiveContainer
    width="100%"
    height={350}
  >
    <BarChart data={chartData}>
      <CartesianGrid strokeDasharray="3 3" />

      <XAxis dataKey="name" />

      <YAxis />

      <Tooltip />

      <Bar dataKey="value" />
    </BarChart>
  </ResponsiveContainer>
</Card>

<Card
  title="ผู้มีงานทำแยกตามสาขา"
  style={{
    marginBottom: 24,
    marginTop: 24,
  }}
>
  <ResponsiveContainer
    width="100%"
    height={400}
  >
    <BarChart
      data={employmentChart}
    >
      <CartesianGrid
        strokeDasharray="3 3"
      />
<XAxis
  dataKey="name"
  angle={-45}
  textAnchor="end"
  height={100}
/>

      <YAxis />

      <Tooltip />

      <Bar
        dataKey="employed"
      />
    </BarChart>
  </ResponsiveContainer>
</Card>
<Card
  title="สัดส่วนข้อมูล"
  style={{
    marginBottom: 24,
  }}
>
  <ResponsiveContainer
    width="100%"
    height={350}
  >
    <PieChart>
      <Pie
        data={[
          {
            name: "นิสิต",
            value: totalStudents,
          },
          {
            name: "สำเร็จ",
            value: totalGraduates,
          },
          {
            name: "อาจารย์",
            value: teachers.length,
          },
        ]}
        dataKey="value"
        nameKey="name"
        outerRadius={120}
        label
      />
      <Tooltip />
    </PieChart>
  </ResponsiveContainer>
</Card>

          <Card
            title="สรุปข้อมูลมหาวิทยาลัย"
          >
            <ul>
              <li>
                จำนวนนิสิตทั้งหมด{" "}
                {totalStudents.toLocaleString()} คน
              </li>

              <li>
                ผู้สำเร็จการศึกษา{" "}
                {totalGraduates.toLocaleString()} คน
              </li>

              <li>
                จำนวนอาจารย์{" "}
                {teachers.length.toLocaleString()} คน
              </li>

              <li>
                อัตราการมีงานทำ{" "}
                {employmentRate}%
              </li>
            </ul>
          </Card>
        </Content>
      </Layout>
    </Layout>
  );
}

export default SummaryPage;
