import { Card } from "antd";

function StatCard({ title, value, color }) {
  return (
    <Card
      style={{
        borderRadius: 16,
      }}
    >
      <h3 style={{ color }}>{title}</h3>

      <h1
        style={{
          fontSize: 36,
          marginTop: 10,
        }}
      >
        {value}
      </h1>

      <p>คน</p>
    </Card>
  );
}

export default StatCard;
