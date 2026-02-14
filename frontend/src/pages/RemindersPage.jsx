import { Button, Card, Table, Tag } from "antd";

export default function RemindersPage({ reminders, addPayment, money, fmtDate }) {
  const columns = [
    { title: "Due Date", dataIndex: "dueDate", render: (v) => fmtDate(v) },
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
    { title: "Action", render: (_, r) => <Button size="small" onClick={() => addPayment(r)}>Record Payment</Button> },
  ];

  return (
    <div className="page-stack">
      <Card className="page-card page-card--table" title="Payment Reminders">
        <Table className="page-table" rowKey="id" columns={columns} dataSource={reminders} pagination={{ pageSize: 8 }} />
      </Card>
    </div>
  );
}
