import { Card, Typography } from "antd";

export default function StatCard({ title, value }) {
  return (
    <Card className="stat-card" bordered={false}>
      <Typography.Text className="stat-label">{title}</Typography.Text>
      <Typography.Title level={4} className="stat-value">
        {value}
      </Typography.Title>
    </Card>
  );
}
