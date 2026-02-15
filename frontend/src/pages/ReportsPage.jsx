import { Button, Card, Space, Table, Tag, Upload } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import { useMemo } from "react";
import StatCard from "../components/StatCard";

function daysPastDue(dueDate) {
  if (!dueDate) return 0;
  const ms = new Date().setHours(0, 0, 0, 0) - new Date(dueDate).setHours(0, 0, 0, 0);
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

function agingBucket(days) {
  if (days <= 0) return "Not Due";
  if (days <= 30) return "0-30";
  if (days <= 60) return "31-60";
  if (days <= 90) return "61-90";
  return "90+";
}

export default function ReportsPage({
  summary,
  transactions,
  onExportEntities,
  onExportTransactions,
  onExportBills,
  onExportBackup,
  onImportBackup,
  audits,
  exportLoading,
  importLoading,
  money,
}) {
  const agingRows = useMemo(() => {
    const byEntity = new Map();
    transactions
      .filter((t) => Number(t.due || 0) > 0)
      .forEach((tx) => {
        const key = String(tx.entityId || tx.entityName || "unknown");
        const days = daysPastDue(tx.dueDate);
        const bucket = agingBucket(days);
        const due = Number(tx.due || 0);

        if (!byEntity.has(key)) {
          byEntity.set(key, {
            key,
            entity: tx.entityName || "-",
            totalDue: 0,
            notDue: 0,
            b0_30: 0,
            b31_60: 0,
            b61_90: 0,
            b90: 0,
            entries: 0,
          });
        }

        const row = byEntity.get(key);
        row.totalDue += due;
        row.entries += 1;
        if (bucket === "Not Due") row.notDue += due;
        if (bucket === "0-30") row.b0_30 += due;
        if (bucket === "31-60") row.b31_60 += due;
        if (bucket === "61-90") row.b61_90 += due;
        if (bucket === "90+") row.b90 += due;
      });

    return Array.from(byEntity.values()).sort((a, b) => b.totalDue - a.totalDue);
  }, [transactions]);

  const totals = useMemo(
    () =>
      agingRows.reduce(
        (acc, row) => {
          acc.totalDue += row.totalDue;
          acc.notDue += row.notDue;
          acc.b0_30 += row.b0_30;
          acc.b31_60 += row.b31_60;
          acc.b61_90 += row.b61_90;
          acc.b90 += row.b90;
          return acc;
        },
        { totalDue: 0, notDue: 0, b0_30: 0, b31_60: 0, b61_90: 0, b90: 0 }
      ),
    [agingRows]
  );

  const agingColumns = [
    { title: "Entity", dataIndex: "entity" },
    { title: "Open Entries", dataIndex: "entries", width: 110 },
    { title: "Not Due", dataIndex: "notDue", render: (v) => money(v) },
    { title: "0-30", dataIndex: "b0_30", render: (v) => money(v) },
    { title: "31-60", dataIndex: "b31_60", render: (v) => money(v) },
    { title: "61-90", dataIndex: "b61_90", render: (v) => money(v) },
    { title: "90+", dataIndex: "b90", render: (v) => money(v) },
    { title: "Total Outstanding", dataIndex: "totalDue", render: (v) => money(v) },
  ];

  const auditColumns = [
    { title: "Time", dataIndex: "createdAt", render: (v) => (v ? new Date(v).toLocaleString() : "-"), width: 180 },
    { title: "Action", dataIndex: "action", width: 100 },
    { title: "Resource", dataIndex: "resource", width: 120 },
    { title: "Message", dataIndex: "message" },
  ];

  return (
    <div className="page-stack">
      <div className="stats-grid stats-grid--three">
        <div><StatCard title="Overdue Reminders" value={summary?.overdueCount ?? 0} /></div>
        <div><StatCard title="Partial Payments" value={transactions.filter((t) => t.paidAmount > 0 && t.due > 0).length} /></div>
        <div><StatCard title="Fully Paid" value={transactions.filter((t) => t.due <= 0).length} /></div>
      </div>

      <div className="stats-grid">
        <div><StatCard title="Total Outstanding" value={money(totals.totalDue)} /></div>
        <div><StatCard title="0-30 Days" value={money(totals.b0_30)} /></div>
        <div><StatCard title="31-60 Days" value={money(totals.b31_60)} /></div>
        <div><StatCard title="90+ Days" value={money(totals.b90)} /></div>
      </div>

      <Card
        className="page-card page-card--table"
        title="Aging Report by Entity"
        extra={<Tag color={agingRows.length ? "orange" : "green"}>{agingRows.length} entities with due</Tag>}
      >
        <Table
          className="page-table"
          rowKey="key"
          columns={agingColumns}
          dataSource={agingRows}
          pagination={{ pageSize: 8 }}
          summary={() => (
            <Table.Summary fixed>
              <Table.Summary.Row>
                <Table.Summary.Cell index={0}><b>Total</b></Table.Summary.Cell>
                <Table.Summary.Cell index={1}>-</Table.Summary.Cell>
                <Table.Summary.Cell index={2}>{money(totals.notDue)}</Table.Summary.Cell>
                <Table.Summary.Cell index={3}>{money(totals.b0_30)}</Table.Summary.Cell>
                <Table.Summary.Cell index={4}>{money(totals.b31_60)}</Table.Summary.Cell>
                <Table.Summary.Cell index={5}>{money(totals.b61_90)}</Table.Summary.Cell>
                <Table.Summary.Cell index={6}>{money(totals.b90)}</Table.Summary.Cell>
                <Table.Summary.Cell index={7}><b>{money(totals.totalDue)}</b></Table.Summary.Cell>
              </Table.Summary.Row>
            </Table.Summary>
          )}
        />
      </Card>

      <Card className="page-card" title="Data Exports">
        <Space wrap>
          <Button onClick={onExportEntities}>Entities CSV</Button>
          <Button onClick={onExportTransactions}>Transactions CSV</Button>
          <Button onClick={onExportBills}>Invoices CSV</Button>
          <Button onClick={onExportBackup} loading={exportLoading}>Backup JSON</Button>
          <Upload
            accept=".json,application/json"
            showUploadList={false}
            beforeUpload={async (file) => {
              const text = await file.text();
              await onImportBackup(text);
              return false;
            }}
          >
            <Button icon={<UploadOutlined />} loading={importLoading}>Restore Backup</Button>
          </Upload>
        </Space>
      </Card>

      <Card className="page-card page-card--table" title="Audit Log">
        <Table className="page-table" rowKey="id" columns={auditColumns} dataSource={audits || []} pagination={{ pageSize: 8 }} />
      </Card>
    </div>
  );
}
