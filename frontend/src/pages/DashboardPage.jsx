import { Card, Table, Tag } from "antd";
import StatCard from "../components/StatCard";

export default function DashboardPage({ summary, transactions, money, fmtDate }) {
  const cards = summary
    ? [
        ["Sales", money(summary.sales)],
        ["Purchases", money(summary.purchases)],
        ["Net Revenue", money(summary.netRevenue)],
        ["Receivables", money(summary.receivables)],
      ]
    : [];

  const columns = [
    { title: "Date", dataIndex: "date", render: (v) => fmtDate(v) },
    { title: "Entity", dataIndex: "entityName" },
    {
      title: "Type",
      dataIndex: "type",
      render: (v) => {
        const map = {
          sale: { label: "Sale", color: "green" },
          purchase: { label: "Purchase", color: "orange" },
          sale_return: { label: "Sale Return", color: "cyan" },
          purchase_return: { label: "Purchase Return", color: "purple" },
        };
        const item = map[v] || { label: v, color: "default" };
        return <Tag color={item.color}>{item.label}</Tag>;
      },
    },
    { title: "Item", dataIndex: "item" },
    { title: "Gross", dataIndex: "gross", render: (v) => money(v) },
    { title: "Due", dataIndex: "due", render: (v) => money(v) },
  ];

  return (
    <div className="page-stack">
      <div className="stats-grid">
        {cards.map(([title, value]) => (
          <div key={title}>
            <StatCard title={title} value={value} />
          </div>
        ))}
      </div>

      <Card className="page-card page-card--table" title="Recent Activity">
        <Table className="page-table" rowKey="id" columns={columns} dataSource={transactions.slice(0, 6)} pagination={false} />
      </Card>
    </div>
  );
}
