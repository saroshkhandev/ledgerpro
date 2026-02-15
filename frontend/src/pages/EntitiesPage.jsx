import { useState } from "react";
import { Button, Card, Drawer, Form, Input, InputNumber, Select, Space, Table, Tag, Row, Col, Divider } from "antd";
import RowActions from "../components/RowActions";

const categories = ["Medical Store", "General Store", "Manufacturer", "Wholesaler", "Retailer", "Other"];

export default function EntitiesPage({
  entityForm,
  setEntityForm,
  entities,
  saveEntity,
  fillEntity,
  deleteEntity,
  getEntityPassbook,
  saveLoading,
  money,
  fmtDate,
}) {
  const [open, setOpen] = useState(false);
  const [passbookOpen, setPassbookOpen] = useState(false);
  const [passbook, setPassbook] = useState(null);
  const [passbookLoading, setPassbookLoading] = useState(false);

  const openAdd = () => {
    setEntityForm({ id: null, name: "", category: "Medical Store", gstin: "", phone: "", address: "", openingBalance: 0 });
    setOpen(true);
  };

  const openEdit = (record) => {
    fillEntity(record);
    setOpen(true);
  };

  const onSave = async () => {
    const ok = await saveEntity();
    if (ok) setOpen(false);
  };

  const openPassbook = async (record) => {
    try {
      setPassbookLoading(true);
      setPassbookOpen(true);
      const data = await getEntityPassbook(record.id);
      setPassbook(data);
    } finally {
      setPassbookLoading(false);
    }
  };

  const columns = [
    { title: "Name", dataIndex: "name" },
    { title: "Category", dataIndex: "category" },
    { title: "GSTIN", dataIndex: "gstin", render: (v) => v || "-" },
    { title: "Opening", dataIndex: "openingBalance", render: (v) => money(v) },
    { title: "Balance", dataIndex: "balance", render: (v) => money(v) },
    {
      title: "Actions",
      render: (_, r) => (
        <RowActions
          quickActions={[{ key: "passbook", label: "Passbook", onClick: () => openPassbook(r) }]}
          menuActions={[
            { key: "edit", label: "Edit", onClick: () => openEdit(r) },
            { key: "delete", label: "Delete", danger: true, onClick: () => deleteEntity(r.id) },
          ]}
        />
      ),
    },
  ];

  const passbookColumns = [
    { title: "Date", dataIndex: "date", render: (v, r) => (r.type === "opening" ? "-" : fmtDate(v)) },
    { title: "Entry", dataIndex: "item", render: (v, r) => (r.type === "opening" ? v : `${r.type === "sale" ? "Sale" : "Purchase"} - ${v}`) },
    { title: "Gross", dataIndex: "gross", render: (v) => (v == null ? "-" : money(v)) },
    { title: "Paid", dataIndex: "paid", render: (v) => (v == null ? "-" : money(v)) },
    { title: "Debit", dataIndex: "debit", render: (v) => money(v) },
    { title: "Credit", dataIndex: "credit", render: (v) => money(v) },
    { title: "Balance", dataIndex: "balance", render: (v) => money(v) },
  ];

  return (
    <div className="page-stack">
      <Card
        className="page-card page-card--table"
        title="Entities"
        extra={<Button type="primary" onClick={openAdd}>Add Entity</Button>}
      >
        <Table className="page-table" rowKey="id" columns={columns} dataSource={entities} pagination={{ pageSize: 10 }} />
      </Card>

      <Drawer
        className="standard-form-drawer"
        title={entityForm.id ? "Edit Entity" : "Add Entity"}
        open={open}
        onClose={() => setOpen(false)}
        width={860}
        destroyOnClose
        extra={<Button type="primary" loading={saveLoading} onClick={onSave}>Save Entity</Button>}
      >
        <Form layout="vertical" className="drawer-form">
          <Form.Item label="Entity Name" required extra="Business or party name used in ledger entries.">
            <Input
              placeholder="e.g. City Medical Store"
              value={entityForm.name}
              onChange={(e) => setEntityForm({ ...entityForm, name: e.target.value })}
            />
          </Form.Item>

          <Row gutter={12}>
            <Col xs={24} md={12}>
              <Form.Item label="Category" extra="Helps group entities by business type.">
                <Select
                  value={entityForm.category}
                  onChange={(v) => setEntityForm({ ...entityForm, category: v })}
                  options={categories.map((x) => ({ label: x, value: x }))}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="GSTIN" extra="Optional GST number for invoices/compliance.">
                <Input
                  placeholder="e.g. 22ABCDE1234F1Z5"
                  value={entityForm.gstin}
                  onChange={(e) => setEntityForm({ ...entityForm, gstin: e.target.value })}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={12}>
            <Col xs={24} md={12}>
              <Form.Item label="Phone" extra="Optional contact number.">
                <Input
                  placeholder="e.g. +91 98xxxxxx10"
                  value={entityForm.phone}
                  onChange={(e) => setEntityForm({ ...entityForm, phone: e.target.value })}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="Address" extra="Billing/shipping address for records and invoices.">
                <Input.TextArea
                  rows={2}
                  placeholder="Enter address"
                  value={entityForm.address}
                  onChange={(e) => setEntityForm({ ...entityForm, address: e.target.value })}
                />
              </Form.Item>
            </Col>
          </Row>

          <Divider className="form-section-divider" />

          <Form.Item label="Opening Balance" extra="Use + for receivable from this entity, - for payable to this entity.">
            <InputNumber
              style={{ width: "100%" }}
              value={Number(entityForm.openingBalance || 0)}
              onChange={(v) => setEntityForm({ ...entityForm, openingBalance: Number(v || 0) })}
            />
          </Form.Item>
        </Form>
      </Drawer>

      <Drawer
        title={passbook ? `${passbook.entityName} Passbook` : "Passbook"}
        open={passbookOpen}
        onClose={() => {
          setPassbookOpen(false);
          setPassbook(null);
        }}
        width={900}
      >
        <Space style={{ marginBottom: 12 }}>
          <Tag color="blue">Opening: {money(passbook?.openingBalance || 0)}</Tag>
          <Tag color="green">Closing: {money(passbook?.closingBalance || 0)}</Tag>
        </Space>
        <Table
          className="page-table"
          loading={passbookLoading}
          rowKey="id"
          columns={passbookColumns}
          dataSource={passbook?.entries || []}
          pagination={{ pageSize: 10 }}
        />
      </Drawer>
    </div>
  );
}
