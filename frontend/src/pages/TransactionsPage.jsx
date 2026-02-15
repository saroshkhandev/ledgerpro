import { useEffect, useState } from "react";
import { Button, Card, Col, DatePicker, Divider, Drawer, Form, Grid, Input, InputNumber, Modal, Row, Select, Space, Switch, Table, Tag, Timeline, Typography } from "antd";
import { CloseCircleOutlined, FilterOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import RowActions from "../components/RowActions";

export default function TransactionsPage({
  txForm,
  setTxForm,
  entities,
  products,
  entityFilter,
  setEntityFilter,
  filteredTransactions,
  saveTx,
  editTx,
  addPayment,
  deleteTx,
  getProductBatches,
  saveLoading,
  paymentLoading,
  money,
  fmtDate,
}) {
  const [open, setOpen] = useState(false);
  const [quickView, setQuickView] = useState(() => localStorage.getItem("ledger_quick_view") || "all");
  const [payOpen, setPayOpen] = useState(false);
  const [payTx, setPayTx] = useState(null);
  const [payForm, setPayForm] = useState({ addPaid: 0, date: dayjs(), note: "" });
  const [timelineOpen, setTimelineOpen] = useState(false);
  const [timelineTx, setTimelineTx] = useState(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [batchOptions, setBatchOptions] = useState([]);
  const [batchLoading, setBatchLoading] = useState(false);
  const [selectedExistingBatch, setSelectedExistingBatch] = useState("");
  const screens = Grid.useBreakpoint();
  const isMobile = !screens.sm;

  const openAdd = () => {
    setTxForm({
      id: null,
      date: new Date().toISOString().slice(0, 10),
      entityId: "",
      productId: "",
      type: "sale",
      item: "",
      qty: 1,
      unitAmount: "",
      gstRate: 18,
      dueDate: "",
      paidAmount: 0,
      reminderEnabled: true,
      note: "",
      batchingEnabled: false,
      batchNo: "",
      mfgDate: "",
      expDate: "",
    });
    setBatchOptions([]);
    setSelectedExistingBatch("");
    setOpen(true);
  };

  const openEdit = (record) => {
    editTx(record);
    setOpen(true);
  };

  const onSave = async () => {
    const ok = await saveTx();
    if (ok) {
      setOpen(false);
      setBatchOptions([]);
      setSelectedExistingBatch("");
    }
  };

  useEffect(() => {
    localStorage.setItem("ledger_quick_view", quickView);
  }, [quickView]);

  const loadBatches = async (productId) => {
    if (!productId) {
      setBatchOptions([]);
      return;
    }
    try {
      setBatchLoading(true);
      const items = await getProductBatches(productId);
      setBatchOptions(items);
    } finally {
      setBatchLoading(false);
    }
  };

  useEffect(() => {
    if (!open) return;
    if (!txForm.batchingEnabled) return;
    if (!txForm.productId) {
      setBatchOptions([]);
      return;
    }
    loadBatches(txForm.productId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, txForm.batchingEnabled, txForm.productId]);

  const openPayModal = (record) => {
    setPayTx(record);
    setPayForm({ addPaid: Number(record.due || 0), date: dayjs(), note: "" });
    setPayOpen(true);
  };

  const onConfirmPayment = async () => {
    await addPayment(payTx, {
      addPaid: Number(payForm.addPaid || 0),
      date: payForm.date ? payForm.date.format("YYYY-MM-DD") : undefined,
      note: payForm.note,
    });
    setPayOpen(false);
    setPayTx(null);
  };

  const gross = Number(txForm.qty || 0) * Number(txForm.unitAmount || 0);
  const gst = (gross * Number(txForm.gstRate || 0)) / 100;
  const total = gross + gst;
  const due = Math.max(total - Number(txForm.paidAmount || 0), 0);

  const columns = [
    { title: "Date", dataIndex: "date", width: 120, render: (v) => fmtDate(v) },
    { title: "Entity", dataIndex: "entityName", width: 190 },
    {
      title: "Type",
      dataIndex: "type",
      width: 130,
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
    { title: "Item", dataIndex: "item", width: 220, responsive: ["md"] },
    { title: "Batch", dataIndex: "batchNo", width: 120, render: (v) => v || "-", responsive: ["lg"] },
    { title: "Gross", dataIndex: "gross", width: 120, render: (v) => money(v), responsive: ["md"] },
    { title: "Paid", dataIndex: "paidAmount", width: 120, render: (v) => money(v), responsive: ["lg"] },
    { title: "Due", dataIndex: "due", width: 120, render: (v) => money(v), responsive: ["md"] },
    { title: "Due Date", dataIndex: "dueDate", width: 130, render: (v) => (v ? fmtDate(v) : "-"), responsive: ["lg"] },
    {
      title: "Actions",
      width: 124,
      render: (_, r) => (
        <RowActions
          quickActions={[
            {
              key: "pay",
              label: "Pay",
              type: "dashed",
              visible: Number(r.due || 0) > 0,
              onClick: () => openPayModal(r),
            },
          ]}
          menuActions={[
            { key: "edit", label: "Edit", onClick: () => openEdit(r) },
            { key: "record", label: "Record Payment", onClick: () => openPayModal(r) },
            {
              key: "timeline",
              label: "Timeline",
              onClick: () => {
                setTimelineTx(r);
                setTimelineOpen(true);
              },
            },
            { key: "delete", label: "Delete", danger: true, onClick: () => deleteTx(r.id) },
          ]}
        />
      ),
    },
  ];

  const quickFiltered = filteredTransactions.filter((t) => {
    if (quickView === "all") return true;
    if (quickView === "overdue") return t.due > 0 && t.dueDate && new Date(t.dueDate) < new Date();
    if (quickView === "dueToday") {
      const today = new Date().toISOString().slice(0, 10);
      return t.due > 0 && t.dueDate === today;
    }
    if (quickView === "highValue") return Number(t.gross || 0) >= 10000;
    if (quickView === "returns") return t.type === "sale_return" || t.type === "purchase_return";
    return true;
  });

  return (
    <div className="page-stack">
      <Card
        className="page-card page-card--table"
        title={isMobile ? null : "Transactions"}
        extra={
          isMobile ? (
            <Space className="page-toolbar tx-toolbar-mobile" wrap>
              <Button icon={<FilterOutlined />} onClick={() => setFilterOpen(true)}>
                Filters
              </Button>
              <Button type="primary" onClick={openAdd}>New Entry</Button>
            </Space>
          ) : (
            <Space className="page-toolbar tx-toolbar" wrap>
              <Select
                style={{ width: 180 }}
                value={quickView}
                onChange={setQuickView}
                options={[
                  { label: "Quick View: All", value: "all" },
                  { label: "Overdue", value: "overdue" },
                  { label: "Due Today", value: "dueToday" },
                  { label: "High Value", value: "highValue" },
                  { label: "Returns", value: "returns" },
                ]}
              />
              <Select style={{ width: 220 }} placeholder="Filter by entity" value={entityFilter || undefined} onChange={(v) => setEntityFilter(v || "")} options={entities.map((e) => ({ label: e.name, value: String(e.id) }))} />
              <Button icon={<CloseCircleOutlined />} onClick={() => setEntityFilter("")}>Clear</Button>
              <Button type="primary" onClick={openAdd}>New Entry</Button>
            </Space>
          )
        }
      >
        <Table
          className="page-table tx-table"
          rowKey="id"
          columns={columns}
          dataSource={quickFiltered}
          pagination={{ pageSize: 8 }}
          scroll={{ x: 1180 }}
          size="middle"
        />
      </Card>

      <Modal
        title="Transaction Filters"
        open={filterOpen}
        onCancel={() => setFilterOpen(false)}
        onOk={() => setFilterOpen(false)}
        okText="Apply"
      >
        <Space direction="vertical" style={{ width: "100%" }} size={12}>
          <Select
            style={{ width: "100%" }}
            value={quickView}
            onChange={setQuickView}
            options={[
              { label: "Quick View: All", value: "all" },
              { label: "Overdue", value: "overdue" },
              { label: "Due Today", value: "dueToday" },
              { label: "High Value", value: "highValue" },
              { label: "Returns", value: "returns" },
            ]}
          />
          <Select
            style={{ width: "100%" }}
            placeholder="Filter by entity"
            value={entityFilter || undefined}
            onChange={(v) => setEntityFilter(v || "")}
            options={entities.map((e) => ({ label: e.name, value: String(e.id) }))}
          />
          <Button onClick={() => setEntityFilter("")}>Clear Filter</Button>
        </Space>
      </Modal>

      <Drawer className="standard-form-drawer" title={txForm.id ? "Edit Entry" : "New Entry"} open={open} onClose={() => setOpen(false)} width={860} destroyOnClose extra={<Button type="primary" loading={saveLoading} onClick={onSave}>Save Entry</Button>}>
        <Form layout="vertical" className="tx-form-wrap drawer-form">
          <Typography.Text className="tx-section-title">Basic Details</Typography.Text>
          <Row gutter={[12, 12]}>
            <Col xs={24} md={8}>
              <Form.Item label="Transaction Date" extra="Date this sale/purchase happened.">
                <Input type="date" value={txForm.date} onChange={(e) => setTxForm({ ...txForm, date: e.target.value })} />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="Entity" required extra="Party/customer/supplier for this entry.">
                <Select style={{ width: "100%" }} placeholder="Select entity" value={txForm.entityId || undefined} onChange={(v) => setTxForm({ ...txForm, entityId: v })} options={entities.map((e) => ({ label: e.name, value: String(e.id) }))} />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="Entry Type" extra="Choose sale, purchase, or return type.">
                <Select
                  style={{ width: "100%" }}
                  value={txForm.type}
                  onChange={(v) => setTxForm({ ...txForm, type: v })}
                  options={[
                    { label: "Sale", value: "sale" },
                    { label: "Purchase", value: "purchase" },
                    { label: "Sale Return", value: "sale_return" },
                    { label: "Purchase Return", value: "purchase_return" },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="Product (Optional)" extra="Select to auto-fill item name, rate and GST.">
                <Select style={{ width: "100%" }} placeholder="Choose product (optional)" allowClear value={txForm.productId || undefined} onChange={(v) => {
                  const product = products.find((p) => String(p.id) === String(v || ""));
                  setSelectedExistingBatch("");
                  setTxForm({
                    ...txForm,
                    productId: v || "",
                    item: product ? product.name : txForm.item,
                    batchingEnabled: product ? !!product.batchingEnabled : txForm.batchingEnabled,
                    batchNo: product && !product.batchingEnabled ? "" : txForm.batchNo,
                    mfgDate: product && !product.batchingEnabled ? "" : txForm.mfgDate,
                    expDate: product && !product.batchingEnabled ? "" : txForm.expDate,
                    unitAmount: product
                      ? (txForm.type === "sale" || txForm.type === "sale_return" ? product.salePrice : product.purchasePrice)
                      : txForm.unitAmount,
                    gstRate: product ? product.gstRate : txForm.gstRate,
                  });
                }} options={products.map((p) => ({ label: `${p.name} (${p.sku || "no-sku"})`, value: String(p.id) }))} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="Item Description" required extra="Final item text shown in reports/invoice.">
                <Input placeholder="e.g. Paracetamol 500mg" value={txForm.item} onChange={(e) => setTxForm({ ...txForm, item: e.target.value })} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="Batching?" extra="Enable only when this entry should track batch and expiry.">
                <Space>
                  <Switch
                    checked={!!txForm.batchingEnabled}
                    onChange={(checked) => {
                      setTxForm((prev) => ({
                        ...prev,
                        batchingEnabled: checked,
                        batchNo: checked ? prev.batchNo : "",
                        mfgDate: checked ? prev.mfgDate : "",
                        expDate: checked ? prev.expDate : "",
                      }));
                      if (!checked) setBatchOptions([]);
                      if (!checked) setSelectedExistingBatch("");
                    }}
                  />
                  <Typography.Text>{txForm.batchingEnabled ? "Enabled" : "Disabled"}</Typography.Text>
                </Space>
              </Form.Item>
            </Col>
            {txForm.batchingEnabled ? (
              <>
                <Col xs={24} md={12}>
                  <Form.Item label="Use Existing Batch (Optional)" extra="Select previous batch to auto-fill details.">
                    <Select
                      style={{ width: "100%" }}
                      loading={batchLoading}
                      allowClear
                      placeholder="Use existing batch (optional)"
                      value={selectedExistingBatch || undefined}
                      onChange={(batchNo) => {
                        setSelectedExistingBatch(String(batchNo || ""));
                        const b = batchOptions.find((x) => String(x.batchNo) === String(batchNo));
                        if (!b) return;
                        setTxForm((prev) => ({
                          ...prev,
                          batchNo: b.batchNo || prev.batchNo,
                          mfgDate: b.mfgDate || prev.mfgDate,
                          expDate: b.expDate || prev.expDate,
                          gstRate: b.gstRate || prev.gstRate,
                          unitAmount: b.unitAmount || prev.unitAmount,
                        }));
                      }}
                      options={batchOptions.map((b) => ({
                        label: `${b.batchNo} | Qty ${Number(b.currentQty || 0)} | Exp ${b.expDate ? fmtDate(b.expDate) : "-"}`,
                        value: b.batchNo,
                      }))}
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item label="Batch No" required extra="Manufacturer or internal batch identifier.">
                    <Input
                      placeholder="e.g. PCM-2401"
                      value={txForm.batchNo}
                      onChange={(e) => setTxForm({ ...txForm, batchNo: e.target.value })}
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item label="Manufacturing Date">
                    <Input
                      type="date"
                      value={txForm.mfgDate || ""}
                      onChange={(e) => setTxForm({ ...txForm, mfgDate: e.target.value })}
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item label="Expiry Date">
                    <Input
                      type="date"
                      value={txForm.expDate || ""}
                      onChange={(e) => setTxForm({ ...txForm, expDate: e.target.value })}
                    />
                  </Form.Item>
                </Col>
              </>
            ) : null}
          </Row>

          <Divider className="form-section-divider" />
          <Typography.Text className="tx-section-title">Amount & Settlement</Typography.Text>
          <Row gutter={[12, 12]}>
            <Col xs={12} md={6}>
              <Form.Item label="Quantity">
                <InputNumber min={1} style={{ width: "100%" }} value={Number(txForm.qty || 1)} onChange={(v) => setTxForm({ ...txForm, qty: Number(v || 1) })} />
              </Form.Item>
            </Col>
            <Col xs={12} md={6}>
              <Form.Item label="Unit Amount" extra="Per-item rate before GST.">
                <InputNumber min={0} style={{ width: "100%" }} value={Number(txForm.unitAmount || 0)} onChange={(v) => setTxForm({ ...txForm, unitAmount: Number(v || 0) })} />
              </Form.Item>
            </Col>
            <Col xs={12} md={6}>
              <Form.Item label="GST Rate (%)">
                <InputNumber min={0} max={100} style={{ width: "100%" }} value={Number(txForm.gstRate || 0)} onChange={(v) => setTxForm({ ...txForm, gstRate: Number(v || 0) })} />
              </Form.Item>
            </Col>
            <Col xs={12} md={6}>
              <Form.Item label="Paid Amount" extra="Amount already received/paid in this entry.">
                <InputNumber min={0} style={{ width: "100%" }} value={Number(txForm.paidAmount || 0)} onChange={(v) => setTxForm({ ...txForm, paidAmount: Number(v || 0) })} />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="Due Date" extra="Optional due date for reminder and follow-up.">
                <Input type="date" value={txForm.dueDate} onChange={(e) => setTxForm({ ...txForm, dueDate: e.target.value })} />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="Reminder" extra="Enable or disable due reminder for this entry.">
                <Select style={{ width: "100%" }} value={txForm.reminderEnabled ? "1" : "0"} onChange={(v) => setTxForm({ ...txForm, reminderEnabled: v === "1" })} options={[{ label: "Reminder On", value: "1" }, { label: "Reminder Off", value: "0" }]} />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Card size="small" className="tx-summary-card">
                <div className="tx-summary-row"><span>Gross</span><strong>{money(gross)}</strong></div>
                <div className="tx-summary-row"><span>GST</span><strong>{money(gst)}</strong></div>
                <div className="tx-summary-row"><span>Total</span><strong>{money(total)}</strong></div>
                <div className="tx-summary-row"><span>Due</span><strong>{money(due)}</strong></div>
              </Card>
            </Col>
            <Col span={24}>
              <Form.Item label="Notes" extra="Optional internal remarks for this entry.">
                <Input.TextArea rows={3} placeholder="Notes (optional)" value={txForm.note} onChange={(e) => setTxForm({ ...txForm, note: e.target.value })} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Drawer>

      <Modal
        title={payTx ? `Record Payment - ${payTx.item}` : "Record Payment"}
        open={payOpen}
        onCancel={() => setPayOpen(false)}
        onOk={onConfirmPayment}
        okText="Save Payment"
        confirmLoading={paymentLoading}
      >
        <Space direction="vertical" style={{ width: "100%" }}>
          <Typography.Text type="secondary">Current Due: {money(payTx?.due || 0)}</Typography.Text>
          <InputNumber
            min={0.01}
            max={Number(payTx?.due || 0)}
            style={{ width: "100%" }}
            value={Number(payForm.addPaid || 0)}
            onChange={(v) => setPayForm((s) => ({ ...s, addPaid: Number(v || 0) }))}
            addonBefore="Amount"
          />
          <DatePicker
            style={{ width: "100%" }}
            value={payForm.date}
            onChange={(v) => setPayForm((s) => ({ ...s, date: v || dayjs() }))}
          />
          <Input.TextArea
            rows={3}
            placeholder="Note (optional)"
            value={payForm.note}
            onChange={(e) => setPayForm((s) => ({ ...s, note: e.target.value }))}
          />
        </Space>
      </Modal>

      <Drawer
        title={timelineTx ? `Payment Timeline - ${timelineTx.item}` : "Payment Timeline"}
        open={timelineOpen}
        onClose={() => setTimelineOpen(false)}
        width={560}
      >
        {timelineTx?.payments?.length ? (
          <Timeline
            items={[...timelineTx.payments]
              .sort((a, b) => (a.date < b.date ? 1 : -1))
              .map((p) => ({
                color: "green",
                children: (
                  <div>
                    <div><b>{money(p.amount)}</b> on {fmtDate(p.date)}</div>
                    {p.note ? <Typography.Text type="secondary">{p.note}</Typography.Text> : null}
                  </div>
                ),
              }))}
          />
        ) : (
          <Typography.Text type="secondary">No payments recorded yet.</Typography.Text>
        )}
      </Drawer>
    </div>
  );
}
