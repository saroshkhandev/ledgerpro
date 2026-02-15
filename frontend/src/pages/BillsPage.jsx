import { useEffect, useMemo, useState } from "react";
import { Button, Card, Checkbox, Col, Divider, Drawer, Form, Input, Row, Select, Space, Table, Typography, message } from "antd";
import RowActions from "../components/RowActions";

const optionSections = [
  {
    title: "Header Fields",
    path: "header",
    items: [
      ["businessName", "Business Name"],
      ["businessGstin", "Business GSTIN"],
      ["businessAddress", "Business Address"],
      ["businessEmail", "Business Email"],
      ["businessPhone", "Business Phone"],
      ["clientName", "Client Name"],
      ["clientAddress", "Client Address"],
      ["clientGstin", "Client GSTIN"],
      ["invoiceNo", "Invoice Number"],
      ["invoiceDate", "Invoice Date"],
    ],
  },
  {
    title: "Line Columns",
    path: "columns",
    items: [
      ["srNo", "Serial #"],
      ["item", "Item"],
      ["batchNo", "Batch No"],
      ["qty", "Quantity"],
      ["unitAmount", "Unit Amount"],
      ["base", "Taxable Amount"],
      ["gstRate", "GST Rate"],
      ["gst", "GST Amount"],
      ["gross", "Line Total"],
    ],
  },
  {
    title: "Totals",
    path: "totals",
    items: [
      ["subtotal", "Subtotal"],
      ["gstTotal", "GST Total"],
      ["cgst", "CGST"],
      ["sgst", "SGST"],
      ["igst", "IGST"],
      ["total", "Grand Total"],
    ],
  },
];

export default function BillsPage({
  billForm,
  setBillForm,
  entities,
  salesForBill,
  bills,
  saveBill,
  printBill,
  deleteBill,
  billTemplateConfig,
  setBillTemplateConfig,
  defaultBillTemplateConfig,
  saveLoading,
  money,
  fmtDate,
}) {
  const [msgApi, contextHolder] = message.useMessage();
  const [open, setOpen] = useState(false);
  const [exportTemplate, setExportTemplate] = useState("classic");
  const [builderOpen, setBuilderOpen] = useState(false);
  const [presetName, setPresetName] = useState("");
  const [presetId, setPresetId] = useState("default");
  const [presets, setPresets] = useState(() => {
    try {
      const raw = localStorage.getItem("ledger_bill_template_presets");
      const parsed = raw ? JSON.parse(raw) : null;
      if (Array.isArray(parsed) && parsed.length) return parsed;
      return [{ id: "default", name: "Default", config: billTemplateConfig }];
    } catch {
      return [{ id: "default", name: "Default", config: billTemplateConfig }];
    }
  });

  const openCreate = () => {
    setBillForm({ date: new Date().toISOString().slice(0, 10), entityId: "", prefix: "INV", saleIds: [], template: exportTemplate });
    setOpen(true);
  };

  const onSave = async () => {
    const ok = await saveBill();
    if (ok) setOpen(false);
  };

  const columns = [
    { title: "Invoice No", dataIndex: "billNo" },
    { title: "Date", dataIndex: "date", render: (v) => fmtDate(v) },
    { title: "Entity", dataIndex: "entityName" },
    { title: "Subtotal", dataIndex: "subtotal", render: (v) => money(v), responsive: ["md"] },
    { title: "GST", dataIndex: "gstTotal", render: (v) => money(v), responsive: ["lg"] },
    { title: "Total", dataIndex: "total", render: (v) => money(v) },
    {
      title: "Actions",
      render: (_, r) => (
        <RowActions
          quickActions={[{ key: "download", label: "Download PDF", onClick: () => printBill(r, exportTemplate, activeConfig) }]}
          menuActions={[{ key: "delete", label: "Delete", danger: true, onClick: () => deleteBill(r.id) }]}
        />
      ),
    },
  ];

  const activeConfig = useMemo(() => {
    const p = presets.find((x) => x.id === presetId);
    return p?.config || billTemplateConfig;
  }, [presets, presetId, billTemplateConfig]);

  useEffect(() => {
    localStorage.setItem("ledger_bill_template_presets", JSON.stringify(presets));
  }, [presets]);

  useEffect(() => {
    const found = presets.find((x) => x.id === presetId);
    if (!found && presets.length) {
      setPresetId(presets[0].id);
      setBillTemplateConfig(presets[0].config);
      return;
    }
    if (found) setBillTemplateConfig(found.config);
  }, [presetId, presets, setBillTemplateConfig]);

  const syncPresetConfig = (nextConfig) => {
    setBillTemplateConfig(nextConfig);
    setPresets((prev) =>
      prev.map((p) => (p.id === presetId ? { ...p, config: nextConfig } : p))
    );
  };

  const setConfig = (section, key, checked) => {
    const next = {
      ...activeConfig,
      [section]: {
        ...activeConfig[section],
        [key]: checked,
      },
    };
    syncPresetConfig(next);
  };

  const createPreset = () => {
    const name = presetName.trim();
    if (!name) return msgApi.warning("Enter preset name");
    const id = `preset_${Date.now()}`;
    const next = { id, name, config: activeConfig };
    setPresets((prev) => [...prev, next]);
    setPresetId(id);
    setPresetName("");
    msgApi.success("Preset created");
  };

  const updatePreset = () => {
    setPresets((prev) => prev.map((p) => (p.id === presetId ? { ...p, config: activeConfig } : p)));
    msgApi.success("Preset updated");
  };

  const deletePreset = () => {
    if (presetId === "default") return msgApi.warning("Default preset cannot be deleted");
    setPresets((prev) => prev.filter((p) => p.id !== presetId));
    setPresetId("default");
    msgApi.success("Preset deleted");
  };

  return (
    <div className="page-stack">
      {contextHolder}
      <Card className="page-card page-card--table" title="Invoices" extra={<Space className="page-toolbar"><Select value={exportTemplate} onChange={setExportTemplate} style={{ width: 190 }} options={[{ label: "Template: Classic", value: "classic" }, { label: "Template: Modern", value: "modern" }, { label: "Template: Minimal", value: "minimal" }, { label: "Template: GST Formal", value: "gst_formal" }]} /><Button onClick={() => setBuilderOpen(true)}>Customize Template</Button><Button type="primary" onClick={openCreate}>New Invoice</Button></Space>}>
        <Table className="page-table" rowKey="id" columns={columns} dataSource={bills} pagination={{ pageSize: 8 }} />
      </Card>

      <Drawer
        className="standard-form-drawer"
        title="Bill Template Builder"
        open={builderOpen}
        onClose={() => setBuilderOpen(false)}
        width={860}
        extra={
          <Space>
            <Button onClick={() => syncPresetConfig(defaultBillTemplateConfig)}>Reset Defaults</Button>
            <Button type="primary" onClick={() => setBuilderOpen(false)}>Done</Button>
          </Space>
        }
      >
        <Typography.Paragraph type="secondary" style={{ marginBottom: 14 }}>
          Choose which fields and columns appear in generated bill PDFs.
        </Typography.Paragraph>
        <Row gutter={12} style={{ marginBottom: 12 }}>
          <Col xs={24} md={10}>
            <Select
              style={{ width: "100%" }}
              value={presetId}
              onChange={setPresetId}
              options={presets.map((p) => ({ label: p.name, value: p.id }))}
            />
          </Col>
          <Col xs={24} md={8}>
            <Input placeholder="New preset name" value={presetName} onChange={(e) => setPresetName(e.target.value)} />
          </Col>
          <Col xs={24} md={6}>
            <Space>
              <Button onClick={createPreset}>Save As New</Button>
              <Button onClick={deletePreset} danger>Delete</Button>
            </Space>
          </Col>
        </Row>
        <Row style={{ marginBottom: 10 }}>
          <Col>
            <Button onClick={updatePreset}>Update Current Preset</Button>
          </Col>
        </Row>
        {optionSections.map((section) => (
          <div key={section.path} style={{ marginBottom: 16 }}>
            <Typography.Title level={5} style={{ margin: "0 0 8px" }}>
              {section.title}
            </Typography.Title>
            <Row gutter={[10, 10]}>
              {section.items.map(([key, label]) => (
                <Col xs={24} md={8} key={key}>
                  <Checkbox
                    checked={!!activeConfig?.[section.path]?.[key]}
                    onChange={(e) => setConfig(section.path, key, e.target.checked)}
                  >
                    {label}
                  </Checkbox>
                </Col>
              ))}
            </Row>
            <Divider style={{ margin: "12px 0 0" }} />
          </div>
        ))}
      </Drawer>

      <Drawer className="standard-form-drawer" title="Create GST Invoice" open={open} onClose={() => setOpen(false)} width={860} destroyOnClose extra={<Button type="primary" loading={saveLoading} onClick={onSave}>Generate Invoice</Button>}>
        <Form layout="vertical" className="drawer-form">
          <Row gutter={12}>
            <Col xs={24} md={8}>
              <Form.Item label="Invoice Date" extra="Printed date on the invoice document.">
                <Input
                  type="date"
                  value={billForm.date}
                  onChange={(e) => setBillForm({ ...billForm, date: e.target.value })}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={10}>
              <Form.Item label="Entity" required extra="Customer/business for which invoice is generated.">
                <Select
                  style={{ width: "100%" }}
                  placeholder="Select entity"
                  value={billForm.entityId || undefined}
                  onChange={(v) => setBillForm({ ...billForm, entityId: v, saleIds: [] })}
                  options={entities.map((e) => ({ label: e.name, value: String(e.id) }))}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Form.Item label="Invoice Prefix" extra="Example: INV, TAX, BILL.">
                <Input
                  placeholder="INV"
                  value={billForm.prefix}
                  onChange={(e) => setBillForm({ ...billForm, prefix: e.target.value })}
                />
              </Form.Item>
            </Col>
          </Row>

          <Divider className="form-section-divider" />

          <Row gutter={12}>
            <Col xs={24} md={10}>
              <Form.Item label="Template" extra="Choose PDF layout style for this invoice.">
                <Select
                  style={{ width: "100%" }}
                  value={billForm.template || "classic"}
                  onChange={(v) => setBillForm({ ...billForm, template: v })}
                  options={[
                    { label: "Classic", value: "classic" },
                    { label: "Modern", value: "modern" },
                    { label: "Minimal", value: "minimal" },
                    { label: "GST Formal", value: "gst_formal" },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={14}>
              <Form.Item label="Select Sales Entries" required extra="Pick one or multiple sales to include in this invoice.">
                <Select
                  mode="multiple"
                  style={{ width: "100%" }}
                  placeholder="Select sales entries"
                  value={billForm.saleIds.map(String)}
                  onChange={(vals) => setBillForm({ ...billForm, saleIds: vals })}
                  options={salesForBill.map((s) => ({
                    value: String(s.id),
                    label: `${fmtDate(s.date)} | ${s.item} | Qty ${s.qty} | ${money(s.base)}`,
                  }))}
                />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Drawer>
    </div>
  );
}
