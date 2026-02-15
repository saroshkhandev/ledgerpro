import { useState } from "react";
import { Button, Card, Divider, Drawer, Form, Input, InputNumber, Row, Col, Space, Switch, Table, Tag } from "antd";
import RowActions from "../components/RowActions";

export default function ProductsPage({
  productForm,
  setProductForm,
  products,
  saveProduct,
  editProduct,
  deleteProduct,
  getProductStockLedger,
  saveLoading,
  money,
  fmtDate,
}) {
  const [open, setOpen] = useState(false);
  const [ledgerOpen, setLedgerOpen] = useState(false);
  const [ledgerLoading, setLedgerLoading] = useState(false);
  const [ledger, setLedger] = useState(null);

  const openAdd = () => {
    setProductForm({ id: null, name: "", sku: "", unit: "pcs", batchingEnabled: false, initialBatchNo: "", initialMfgDate: "", initialExpDate: "", salePrice: 0, purchasePrice: 0, gstRate: 18, stockQty: 0, reorderLevel: 5, description: "" });
    setOpen(true);
  };

  const openEdit = (record) => {
    editProduct(record);
    setOpen(true);
  };

  const onSave = async () => {
    const ok = await saveProduct();
    if (ok) setOpen(false);
  };

  const openLedger = async (record) => {
    setLedgerOpen(true);
    setLedgerLoading(true);
    try {
      const item = await getProductStockLedger(record.id);
      setLedger(item);
    } finally {
      setLedgerLoading(false);
    }
  };

  const columns = [
    { title: "Product", dataIndex: "name", width: 220 },
    { title: "SKU", dataIndex: "sku", width: 110, render: (v) => v || "-" },
    { title: "Unit", dataIndex: "unit", width: 80 },
    { title: "Batching", dataIndex: "batchingEnabled", width: 95, render: (v) => (v ? "On" : "Off") },
    { title: "Sale", dataIndex: "salePrice", width: 100, render: (v) => money(v) },
    { title: "Purchase", dataIndex: "purchasePrice", width: 110, render: (v) => money(v) },
    { title: "GST%", dataIndex: "gstRate", width: 80 },
    { title: "Opening Stock", dataIndex: "openingStock", width: 120 },
    { title: "Current Stock", dataIndex: "currentStock", width: 120 },
    { title: "Reorder", dataIndex: "reorderLevel", width: 90 },
    {
      title: "Status",
      render: (_, r) => (
        <Space size={4} wrap>
          {r.lowStock ? <Tag color="error">Low Stock</Tag> : <Tag color="success">Healthy</Tag>}
          {Number(r.expiredCount || 0) > 0 ? <Tag color="red">Expired Batch: {r.expiredCount}</Tag> : null}
          {Number(r.nearExpiryCount || 0) > 0 ? <Tag color="gold">Near Expiry: {r.nearExpiryCount}</Tag> : null}
        </Space>
      ),
    },
    {
      title: "Actions",
      width: 110,
      render: (_, r) => (
        <RowActions
          menuActions={[
            { key: "ledger", label: "Stock Ledger", onClick: () => openLedger(r) },
            { key: "edit", label: "Edit", onClick: () => openEdit(r) },
            { key: "delete", label: "Delete", danger: true, onClick: () => deleteProduct(r.id) },
          ]}
        />
      ),
    },
  ];

  const ledgerColumns = [
    { title: "Date", dataIndex: "date", render: (v, r) => (r.refType === "opening" ? "-" : fmtDate(v)) },
    { title: "Type", dataIndex: "refType", render: (v) => (v === "opening" ? "Opening" : v === "purchase" ? "Purchase" : "Sale") },
    { title: "Reference", dataIndex: "refItem" },
    { title: "In", dataIndex: "inQty" },
    { title: "Out", dataIndex: "outQty" },
    { title: "Running Stock", dataIndex: "runningStock" },
  ];

  const batchColumns = [
    { title: "Batch No", dataIndex: "batchNo" },
    { title: "Mfg", dataIndex: "mfgDate", render: (v) => (v ? fmtDate(v) : "-") },
    { title: "Exp", dataIndex: "expDate", render: (v) => (v ? fmtDate(v) : "-") },
    { title: "In", dataIndex: "inQty" },
    { title: "Out", dataIndex: "outQty" },
    { title: "Current", dataIndex: "currentQty" },
    {
      title: "Status",
      render: (_, r) => (
        <Space size={4} wrap>
          {r.isExpired ? <Tag color="red">Expired</Tag> : null}
          {!r.isExpired && r.isNearExpiry ? <Tag color="gold">Near Expiry</Tag> : null}
          {!r.isExpired && !r.isNearExpiry ? <Tag color="success">OK</Tag> : null}
        </Space>
      ),
    },
  ];

  return (
    <div className="page-stack">
      <Card className="page-card page-card--table" title="Products" extra={<Button type="primary" onClick={openAdd}>Add Product</Button>}>
        <Table className="products-table page-table" rowKey="id" columns={columns} dataSource={products} pagination={{ pageSize: 10 }} scroll={{ x: 1360 }} />
      </Card>

      <Drawer
        className="standard-form-drawer"
        title={productForm.id ? "Edit Product" : "Add Product"}
        open={open}
        onClose={() => setOpen(false)}
        width={860}
        destroyOnClose
        extra={<Button type="primary" loading={saveLoading} onClick={onSave}>Save Product</Button>}
      >
        <Form layout="vertical" className="drawer-form">
          <Form.Item label="Product Name" required extra="Shown in transactions and invoices.">
            <Input
              placeholder="e.g. Paracetamol 500mg"
              value={productForm.name}
              onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
            />
          </Form.Item>

          <Row gutter={12}>
            <Col xs={24} md={12}>
              <Form.Item label="SKU / Code" extra="Your internal product code (optional).">
                <Input
                  placeholder="e.g. MED-PARA-500"
                  value={productForm.sku}
                  onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="Unit" extra="Examples: pcs, box, kg, litre.">
                <Input
                  placeholder="e.g. pcs"
                  value={productForm.unit}
                  onChange={(e) => setProductForm({ ...productForm, unit: e.target.value })}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="Enable Batching" extra="Turn on if this product is managed by batch no/expiry.">
                <Space>
                  <Switch
                    checked={!!productForm.batchingEnabled}
                    onChange={(checked) => setProductForm({
                      ...productForm,
                      batchingEnabled: checked,
                      initialBatchNo: checked ? productForm.initialBatchNo : "",
                      initialMfgDate: checked ? productForm.initialMfgDate : "",
                      initialExpDate: checked ? productForm.initialExpDate : "",
                    })}
                  />
                  <span>{productForm.batchingEnabled ? "Batch tracking enabled" : "Batch tracking disabled"}</span>
                </Space>
              </Form.Item>
            </Col>
          </Row>

          {productForm.batchingEnabled ? (
            <>
              <Divider className="form-section-divider" />
              <Row gutter={12}>
                <Col xs={24} md={8}>
                  <Form.Item label="Initial Batch No" extra="Optional: opening stock batch.">
                    <Input
                      placeholder="e.g. PCM-2401"
                      value={productForm.initialBatchNo}
                      onChange={(e) => setProductForm({ ...productForm, initialBatchNo: e.target.value })}
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item label="Initial Mfg Date">
                    <Input
                      type="date"
                      value={productForm.initialMfgDate || ""}
                      onChange={(e) => setProductForm({ ...productForm, initialMfgDate: e.target.value })}
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item label="Initial Exp Date">
                    <Input
                      type="date"
                      value={productForm.initialExpDate || ""}
                      onChange={(e) => setProductForm({ ...productForm, initialExpDate: e.target.value })}
                    />
                  </Form.Item>
                </Col>
              </Row>
            </>
          ) : null}

          <Divider className="form-section-divider" />

          <Row gutter={12}>
            <Col xs={24} md={8}>
              <Form.Item label="Sale Price" extra="Price charged to customer, before GST.">
                <InputNumber
                  min={0}
                  style={{ width: "100%" }}
                  value={Number(productForm.salePrice || 0)}
                  onChange={(v) => setProductForm({ ...productForm, salePrice: Number(v || 0) })}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="Purchase Price" extra="Cost price from supplier, before GST.">
                <InputNumber
                  min={0}
                  style={{ width: "100%" }}
                  value={Number(productForm.purchasePrice || 0)}
                  onChange={(v) => setProductForm({ ...productForm, purchasePrice: Number(v || 0) })}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="GST Rate (%)" extra="Applied during sales/purchase entries.">
                <InputNumber
                  min={0}
                  max={100}
                  style={{ width: "100%" }}
                  value={Number(productForm.gstRate || 0)}
                  onChange={(v) => setProductForm({ ...productForm, gstRate: Number(v || 0) })}
                />
              </Form.Item>
            </Col>
          </Row>

          <Divider className="form-section-divider" />

          <Row gutter={12}>
            <Col xs={24} md={12}>
              <Form.Item label="Opening Stock Qty" extra="Starting quantity when product is created.">
                <InputNumber
                  min={0}
                  style={{ width: "100%" }}
                  value={Number(productForm.stockQty || 0)}
                  onChange={(v) => setProductForm({ ...productForm, stockQty: Number(v || 0) })}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="Reorder Level" extra="Marked low-stock when current qty is below this value.">
                <InputNumber
                  min={0}
                  style={{ width: "100%" }}
                  value={Number(productForm.reorderLevel || 5)}
                  onChange={(v) => setProductForm({ ...productForm, reorderLevel: Number(v || 0) })}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="Description" extra="Optional notes like brand, composition, packing size.">
            <Input.TextArea
              rows={2}
              placeholder="Add notes for this product"
              value={productForm.description}
              onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
            />
          </Form.Item>
        </Form>
      </Drawer>

      <Drawer
        title={ledger ? `${ledger.productName} Stock Ledger` : "Stock Ledger"}
        open={ledgerOpen}
        onClose={() => {
          setLedgerOpen(false);
          setLedger(null);
        }}
        width={820}
      >
        <Space style={{ marginBottom: 12 }}>
          <Tag color="blue">Opening: {ledger?.openingStock ?? 0}</Tag>
          <Tag color={ledger?.lowStock ? "error" : "success"}>Current: {ledger?.currentStock ?? 0}</Tag>
          <Tag color="gold">Reorder: {ledger?.reorderLevel ?? 0}</Tag>
          {Number(ledger?.expiredCount || 0) > 0 ? <Tag color="red">Expired Batch: {ledger?.expiredCount}</Tag> : null}
          {Number(ledger?.nearExpiryCount || 0) > 0 ? <Tag color="gold">Near Expiry: {ledger?.nearExpiryCount}</Tag> : null}
        </Space>
        <Table
          className="page-table"
          loading={ledgerLoading}
          rowKey="id"
          columns={batchColumns}
          dataSource={ledger?.batches || []}
          pagination={{ pageSize: 6 }}
          size="small"
          title={() => "Batch-wise Stock"}
          style={{ marginBottom: 12 }}
        />
        <Table
          className="page-table"
          loading={ledgerLoading}
          rowKey="id"
          columns={ledgerColumns}
          dataSource={ledger?.lines || []}
          pagination={{ pageSize: 10 }}
        />
      </Drawer>
    </div>
  );
}
