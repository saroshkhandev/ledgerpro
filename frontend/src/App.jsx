import { useEffect, useMemo, useState } from "react";
import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { App as AntApp, ConfigProvider, Spin, message, theme as antdTheme } from "antd";
import api from "./api/client";
import AppLayout from "./layout/AppLayout";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import EntitiesPage from "./pages/EntitiesPage";
import TransactionsPage from "./pages/TransactionsPage";
import BillsPage from "./pages/BillsPage";
import ReportsPage from "./pages/ReportsPage";
import RemindersPage from "./pages/RemindersPage";
import ProductsPage from "./pages/ProductsPage";
import ImportSalesPage from "./pages/ImportSalesPage";
import ProfilePage from "./pages/ProfilePage";
import { csvDownload, fmtDate, money, today } from "./utils/format";

const initialTxForm = () => ({
  id: null,
  date: today(),
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

const defaultBillTemplateConfig = {
  header: {
    businessName: true,
    businessGstin: true,
    businessAddress: true,
    businessEmail: true,
    businessPhone: true,
    clientName: true,
    clientAddress: true,
    clientGstin: true,
    invoiceNo: true,
    invoiceDate: true,
  },
  columns: {
    srNo: true,
    item: true,
    batchNo: false,
    qty: true,
    unitAmount: true,
    base: true,
    gstRate: true,
    gst: true,
    gross: true,
  },
  totals: {
    subtotal: true,
    gstTotal: true,
    cgst: true,
    sgst: true,
    igst: false,
    total: true,
  },
};

const initialProfileForm = () => ({
  name: "",
  email: "",
  address: "",
  photoUrl: "",
  currency: "INR",
  businessName: "",
  businessGstin: "",
  businessPhone: "",
  businessEmail: "",
  bankName: "",
  bankBranch: "",
  bankAccountNo: "",
  bankIfsc: "",
});

function mergeBillTemplateConfig(raw) {
  const parsed = raw || {};
  return {
    header: { ...defaultBillTemplateConfig.header, ...(parsed.header || {}) },
    columns: { ...defaultBillTemplateConfig.columns, ...(parsed.columns || {}) },
    totals: { ...defaultBillTemplateConfig.totals, ...(parsed.totals || {}) },
  };
}

function ProtectedRoute({ me, authLoading, children }) {
  if (authLoading) {
    return (
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", gap: 12 }}>
        <Spin size="large" />
        <div style={{ color: "var(--text-soft)", fontWeight: 600 }}>Loading your ledger...</div>
      </div>
    );
  }
  if (!me) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  const navigate = useNavigate();
  const [apiMsg, contextHolder] = message.useMessage();
  const [busy, setBusy] = useState({
    login: false,
    register: false,
    logout: false,
    profile: false,
    entity: false,
    product: false,
    transaction: false,
    payment: false,
    bill: false,
    importCsv: false,
    backupExport: false,
    backupImport: false,
  });

  const [me, setMe] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authMsg, setAuthMsg] = useState("");

  const [entities, setEntities] = useState([]);
  const [products, setProducts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [bills, setBills] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [summary, setSummary] = useState(null);
  const [audits, setAudits] = useState([]);
  const [globalQuery, setGlobalQuery] = useState("");

  const [entityForm, setEntityForm] = useState({ id: null, name: "", category: "Medical Store", gstin: "", phone: "", address: "", openingBalance: 0 });
  const [productForm, setProductForm] = useState({ id: null, name: "", sku: "", unit: "pcs", batchingEnabled: false, initialBatchNo: "", initialMfgDate: "", initialExpDate: "", salePrice: 0, purchasePrice: 0, gstRate: 18, stockQty: 0, reorderLevel: 5, description: "" });
  const [txForm, setTxForm] = useState(initialTxForm());
  const [billForm, setBillForm] = useState({ date: today(), entityId: "", prefix: "INV", saleIds: [], template: "classic" });
  const [billTemplateConfig, setBillTemplateConfig] = useState(() => {
    try {
      const raw = localStorage.getItem("ledger_bill_template_config");
      return raw ? mergeBillTemplateConfig(JSON.parse(raw)) : defaultBillTemplateConfig;
    } catch {
      return defaultBillTemplateConfig;
    }
  });
  const [profileForm, setProfileForm] = useState(initialProfileForm());
  const [entityFilter, setEntityFilter] = useState("");
  const [uiPrefs, setUiPrefs] = useState(() => {
    try {
      const raw = localStorage.getItem("ledger_ui_prefs");
      return raw ? JSON.parse(raw) : { darkMode: false, compactTables: false };
    } catch {
      return { darkMode: false, compactTables: false };
    }
  });

  const loadAll = async () => {
    const [ent, prod, tx, bl, rem, sum, profile, audit] = await Promise.all([
      api.get("/entities"),
      api.get("/products"),
      api.get("/transactions"),
      api.get("/bills"),
      api.get("/reminders"),
      api.get("/summary"),
      api.get("/auth/profile"),
      api.get("/audit?limit=200"),
    ]);
    setEntities(ent.data.items || []);
    setProducts(prod.data.items || []);
    setTransactions(tx.data.items || []);
    setBills(bl.data.items || []);
    setReminders(rem.data.items || []);
    setSummary(sum.data || null);
    setProfileForm({ ...initialProfileForm(), ...(profile.data.item || {}) });
    setAudits(audit.data.items || []);
  };

  const boot = async () => {
    try {
      setAuthLoading(true);
      const res = await api.get("/auth/me");
      if (!res.data.authenticated) {
        setMe(null);
        setAuthLoading(false);
        return;
      }
      setMe(res.data.user);
      await loadAll();
    } catch {
      setMe(null);
    } finally {
      setAuthLoading(false);
    }
  };

  useEffect(() => {
    boot();
  }, []);

  useEffect(() => {
    localStorage.setItem("ledger_ui_prefs", JSON.stringify(uiPrefs));
    document.documentElement.setAttribute("data-theme", uiPrefs.darkMode ? "dark" : "light");
    document.documentElement.setAttribute(
      "data-density",
      uiPrefs.compactTables ? "compact" : "comfortable"
    );
  }, [uiPrefs]);

  useEffect(() => {
    localStorage.setItem("ledger_bill_template_config", JSON.stringify(billTemplateConfig));
  }, [billTemplateConfig]);

  useEffect(() => {
    if (!authLoading && me && window.location.pathname === "/login") {
      navigate("/dashboard", { replace: true });
    }
  }, [authLoading, me, navigate]);

  const salesForBill = useMemo(() => {
    const entityId = String(billForm.entityId || "");
    return transactions.filter((t) => t.type === "sale" && String(t.entityId) === entityId);
  }, [transactions, billForm.entityId]);

  const antTheme = useMemo(
    () => ({
      algorithm: uiPrefs.darkMode ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
      token: uiPrefs.darkMode
        ? {
            colorPrimary: "#34a37d",
            colorInfo: "#34a37d",
            colorSuccess: "#3dbf91",
            colorWarning: "#e4a84e",
            colorError: "#df6b78",
            colorBgBase: "#0f1720",
            colorTextBase: "#e5edf7",
            borderRadius: 8,
          }
        : {
            colorPrimary: "#1f7a5a",
            colorInfo: "#1f7a5a",
            colorSuccess: "#2a9d76",
            colorWarning: "#c98a35",
            colorError: "#c75463",
            colorBgBase: "#f5f7f4",
            colorTextBase: "#1f2a37",
            borderRadius: 8,
          },
      components: {
        Button: { borderRadius: 8, controlHeight: 36, fontWeight: 600 },
        Card: { borderRadiusLG: 10 },
        Menu: { itemBorderRadius: 8 },
        Input: { borderRadius: 8 },
        Select: { borderRadius: 8 },
        Table: { borderRadius: 10 },
      },
    }),
    [uiPrefs.darkMode]
  );

  const matchesQuery = (obj, query) => {
    if (!query) return true;
    const q = String(query).toLowerCase();
    return Object.values(obj || {}).some((v) => String(v ?? "").toLowerCase().includes(q));
  };

  const filteredEntities = useMemo(
    () => entities.filter((e) => matchesQuery(e, globalQuery)),
    [entities, globalQuery]
  );
  const filteredProducts = useMemo(
    () => products.filter((p) => matchesQuery(p, globalQuery)),
    [products, globalQuery]
  );
  const filteredTransactions = useMemo(() => {
    const entityId = String(entityFilter || "");
    return transactions.filter((t) => {
      if (entityId && String(t.entityId) !== entityId) return false;
      return matchesQuery(t, globalQuery);
    });
  }, [transactions, entityFilter, globalQuery]);
  const filteredBills = useMemo(
    () => bills.filter((b) => matchesQuery(b, globalQuery)),
    [bills, globalQuery]
  );
  const filteredReminders = useMemo(
    () => reminders.filter((r) => matchesQuery(r, globalQuery)),
    [reminders, globalQuery]
  );

  const moneyFmt = useMemo(
    () => (value) => money(value, profileForm.currency || me?.currency || "INR"),
    [profileForm.currency, me?.currency]
  );

  const onRegister = async (payload) => {
    setBusy((prev) => ({ ...prev, register: true }));
    try {
      await api.post("/auth/register", payload);
      setAuthMsg("");
      await boot();
      navigate("/dashboard");
      return true;
    } catch (err) {
      setAuthMsg(err?.response?.data?.error || "Registration failed");
      return false;
    } finally {
      setBusy((prev) => ({ ...prev, register: false }));
    }
  };

  const addAudit = async (action, resource, messageText, meta = {}) => {
    try {
      await api.post("/audit", { action, resource, message: messageText, meta });
    } catch {
      // intentionally ignore audit failures
    }
  };

  const onLogin = async (payload) => {
    setBusy((prev) => ({ ...prev, login: true }));
    try {
      await api.post("/auth/login", payload);
      setAuthMsg("");
      await boot();
      navigate("/dashboard");
      return true;
    } catch (err) {
      setAuthMsg(err?.response?.data?.error || "Login failed");
      return false;
    } finally {
      setBusy((prev) => ({ ...prev, login: false }));
    }
  };

  const onLogout = async () => {
    setBusy((prev) => ({ ...prev, logout: true }));
    try {
      await api.post("/auth/logout");
      setMe(null);
      navigate("/login");
    } finally {
      setBusy((prev) => ({ ...prev, logout: false }));
    }
  };

  const saveProfile = async () => {
    setBusy((prev) => ({ ...prev, profile: true }));
    try {
      const res = await api.put("/auth/profile", profileForm);
      setMe(res.data.item);
      apiMsg.success("Profile updated");
      return true;
    } catch (err) {
      apiMsg.error(err?.response?.data?.error || "Failed to update profile");
      return false;
    } finally {
      setBusy((prev) => ({ ...prev, profile: false }));
    }
  };

  const fillEntity = (entity) =>
    setEntityForm({
      id: entity.id,
      name: entity.name,
      category: entity.category,
      gstin: entity.gstin || "",
      phone: entity.phone || "",
      address: entity.address || "",
      openingBalance: Number(entity.openingBalance || 0),
    });

  const saveEntity = async () => {
    setBusy((prev) => ({ ...prev, entity: true }));
    try {
      const payload = { ...entityForm };
      delete payload.id;
      if (!payload.name.trim()) {
        apiMsg.error("Entity name is required");
        return false;
      }
      if (entityForm.id) await api.put(`/entities/${entityForm.id}`, payload);
      else await api.post("/entities", payload);
      await addAudit(entityForm.id ? "update" : "create", "entity", `${payload.name} ${entityForm.id ? "updated" : "created"}`);
      setEntityForm({ id: null, name: "", category: "Medical Store", gstin: "", phone: "", address: "", openingBalance: 0 });
      await loadAll();
      apiMsg.success("Entity saved");
      return true;
    } catch (err) {
      apiMsg.error(err?.response?.data?.error || "Failed to save entity");
      return false;
    } finally {
      setBusy((prev) => ({ ...prev, entity: false }));
    }
  };

  const deleteEntity = async (id) => {
    if (!window.confirm("Delete entity?")) return;
    try {
      await api.delete(`/entities/${id}`);
      await addAudit("delete", "entity", `Entity deleted`, { id });
      await loadAll();
    } catch (err) {
      apiMsg.error(err?.response?.data?.error || "Failed to delete entity");
    }
  };

  const getEntityPassbook = async (id) => {
    const res = await api.get(`/entities/${id}/passbook`);
    return res.data.item;
  };

  const editProduct = (p) =>
    setProductForm({
      ...p,
      batchingEnabled: !!p.batchingEnabled,
      initialBatchNo: String(p.initialBatchNo || ""),
      initialMfgDate: String(p.initialMfgDate || ""),
      initialExpDate: String(p.initialExpDate || ""),
    });

  const saveProduct = async () => {
    setBusy((prev) => ({ ...prev, product: true }));
    try {
      const payload = { ...productForm };
      delete payload.id;
      if (!payload.name?.trim()) {
        apiMsg.error("Product name is required");
        return false;
      }
      if (productForm.id) await api.put(`/products/${productForm.id}`, payload);
      else await api.post("/products", payload);
      await addAudit(productForm.id ? "update" : "create", "product", `${payload.name} ${productForm.id ? "updated" : "created"}`);
      setProductForm({ id: null, name: "", sku: "", unit: "pcs", batchingEnabled: false, initialBatchNo: "", initialMfgDate: "", initialExpDate: "", salePrice: 0, purchasePrice: 0, gstRate: 18, stockQty: 0, reorderLevel: 5, description: "" });
      await loadAll();
      apiMsg.success("Product saved");
      return true;
    } catch (err) {
      apiMsg.error(err?.response?.data?.error || "Failed to save product");
      return false;
    } finally {
      setBusy((prev) => ({ ...prev, product: false }));
    }
  };

  const deleteProduct = async (id) => {
    if (!window.confirm("Delete product?")) return;
    try {
      await api.delete(`/products/${id}`);
      await addAudit("delete", "product", `Product deleted`, { id });
      await loadAll();
    } catch (err) {
      apiMsg.error(err?.response?.data?.error || "Failed to delete product");
    }
  };

  const getProductStockLedger = async (id) => {
    const res = await api.get(`/products/${id}/stock-ledger`);
    return res.data.item;
  };

  const editTx = (tx) =>
    setTxForm({
      ...initialTxForm(),
      ...tx,
      entityId: String(tx.entityId),
      productId: String(tx.productId || ""),
      batchingEnabled: !!(tx.batchingEnabled || tx.batchNo),
      batchNo: String(tx.batchNo || ""),
      mfgDate: String(tx.mfgDate || ""),
      expDate: String(tx.expDate || ""),
    });

  const saveTx = async () => {
    setBusy((prev) => ({ ...prev, transaction: true }));
    try {
      const payload = {
        date: txForm.date,
        entityId: String(txForm.entityId || ""),
        productId: String(txForm.productId || ""),
        type: txForm.type,
        item: txForm.item,
        qty: Number(txForm.qty),
        unitAmount: Number(txForm.unitAmount),
        gstRate: Number(txForm.gstRate),
        dueDate: txForm.dueDate || "",
        paidAmount: Number(txForm.paidAmount || 0),
        reminderEnabled: !!txForm.reminderEnabled,
        note: txForm.note,
        batchingEnabled: !!txForm.batchingEnabled,
        batchNo: txForm.batchingEnabled ? String(txForm.batchNo || "").trim() : "",
        mfgDate: txForm.batchingEnabled ? String(txForm.mfgDate || "").trim() : "",
        expDate: txForm.batchingEnabled ? String(txForm.expDate || "").trim() : "",
      };
      if (!payload.entityId || !payload.item || !payload.date) {
        apiMsg.error("Required fields missing");
        return false;
      }
      if (txForm.id) await api.put(`/transactions/${txForm.id}`, payload);
      else await api.post("/transactions", payload);
      await addAudit(txForm.id ? "update" : "create", "transaction", `${payload.item} ${txForm.id ? "updated" : "created"}`, { type: payload.type });
      setTxForm(initialTxForm());
      await loadAll();
      apiMsg.success("Transaction saved");
      return true;
    } catch (err) {
      apiMsg.error(err?.response?.data?.error || "Failed to save transaction");
      return false;
    } finally {
      setBusy((prev) => ({ ...prev, transaction: false }));
    }
  };

  const importSalesCsv = async (csvText) => {
    setBusy((prev) => ({ ...prev, importCsv: true }));
    try {
      const res = await api.post("/transactions/import-csv", { csvText });
      await loadAll();
      return res.data;
    } finally {
      setBusy((prev) => ({ ...prev, importCsv: false }));
    }
  };

  const addPayment = async (tx, payload = null) => {
    let requestPayload = payload;
    if (!requestPayload) {
      const input = window.prompt(`Current due: ${moneyFmt(tx.due)}\nEnter amount:`);
      if (!input) return;
      const addPaid = Number(input);
      if (Number.isNaN(addPaid) || addPaid <= 0) return;
      requestPayload = { addPaid };
    }
    setBusy((prev) => ({ ...prev, payment: true }));
    try {
      await api.patch(`/transactions/${tx.id}/payment`, requestPayload);
      await addAudit("payment", "transaction", `Payment recorded for ${tx.item}`, { id: tx.id, addPaid: requestPayload.addPaid });
      await loadAll();
      apiMsg.success("Payment recorded");
      return true;
    } catch (err) {
      apiMsg.error(err?.response?.data?.error || "Failed to update payment");
      return false;
    } finally {
      setBusy((prev) => ({ ...prev, payment: false }));
    }
  };

  const getProductBatches = async (productId) => {
    const res = await api.get(`/transactions/batches?productId=${encodeURIComponent(String(productId || ""))}`);
    return res.data.items || [];
  };

  const deleteTx = async (id) => {
    if (!window.confirm("Delete transaction?")) return;
    await api.delete(`/transactions/${id}`);
    await addAudit("delete", "transaction", `Transaction deleted`, { id });
    await loadAll();
  };

  const saveBill = async () => {
    setBusy((prev) => ({ ...prev, bill: true }));
    try {
      if (!billForm.saleIds.length) {
        apiMsg.error("Select one or more sales");
        return false;
      }
      await api.post("/bills", {
        date: billForm.date,
        entityId: String(billForm.entityId || ""),
        prefix: billForm.prefix.toUpperCase(),
        saleIds: billForm.saleIds.map((x) => String(x)),
      });
      await addAudit("create", "invoice", "Invoice generated", { entityId: billForm.entityId, sales: billForm.saleIds.length });
      setBillForm({ date: today(), entityId: "", prefix: "INV", saleIds: [], template: "classic" });
      await loadAll();
      return true;
    } finally {
      setBusy((prev) => ({ ...prev, bill: false }));
    }
  };

  const deleteBill = async (id) => {
    if (!window.confirm("Delete bill?")) return;
    await api.delete(`/bills/${id}`);
    await addAudit("delete", "invoice", "Invoice deleted", { id });
    await loadAll();
  };

  const exportBackup = async () => {
    setBusy((prev) => ({ ...prev, backupExport: true }));
    try {
      const res = await api.get("/backup");
      const file = `ledger-backup-${today()}.json`;
      const blob = new Blob([JSON.stringify(res.data.item, null, 2)], { type: "application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = file;
      a.click();
      await addAudit("export", "backup", "Backup exported");
      apiMsg.success("Backup exported");
    } catch (err) {
      apiMsg.error(err?.response?.data?.error || "Backup export failed");
    } finally {
      setBusy((prev) => ({ ...prev, backupExport: false }));
    }
  };

  const importBackup = async (jsonText) => {
    setBusy((prev) => ({ ...prev, backupImport: true }));
    try {
      const parsed = JSON.parse(jsonText);
      await api.post("/backup/restore", parsed);
      await addAudit("import", "backup", "Backup restored");
      await loadAll();
      apiMsg.success("Backup restored");
    } catch (err) {
      apiMsg.error(err?.response?.data?.error || err.message || "Backup restore failed");
    } finally {
      setBusy((prev) => ({ ...prev, backupImport: false }));
    }
  };

  const printBill = (bill, template = "classic", templateConfig = billTemplateConfig) => {
    const cfg = templateConfig || defaultBillTemplateConfig;
    const businessName = profileForm.businessName || me?.name || "Business Name";
    const businessGstin = profileForm.businessGstin || "-";
    const businessPhone = profileForm.businessPhone || "-";
    const businessEmail = profileForm.businessEmail || me?.email || "-";
    const businessAddress = profileForm.address || "-";
    const bankName = profileForm.bankName || "-";
    const bankBranch = profileForm.bankBranch || "-";
    const bankAccountNo = profileForm.bankAccountNo || "-";
    const bankIfsc = profileForm.bankIfsc || "-";
    const themes = {
      classic: {
        bodyBg: "#ffffff",
        text: "#1f2937",
        accent: "#1f7a5a",
        thBg: "#f3f6f4",
      },
      modern: {
        bodyBg: "#f7faf8",
        text: "#13203a",
        accent: "#206f53",
        thBg: "#eaf3ee",
      },
      minimal: {
        bodyBg: "#ffffff",
        text: "#111827",
        accent: "#374151",
        thBg: "#f9fafb",
      },
      gst_formal: {
        bodyBg: "#ffffff",
        text: "#111111",
        accent: "#111111",
        thBg: "#ffffff",
      },
    };
    const theme = themes[template] || themes.classic;
    const cgst = (Number(bill.gstTotal || 0) / 2).toFixed(2);
    const sgst = (Number(bill.gstTotal || 0) / 2).toFixed(2);
    const igst = "0.00";

    if (template === "gst_formal") {
      const rows = bill.lines
        .map((line, idx) => {
          const cells = [];
          if (cfg.columns.srNo) cells.push(`<td>${idx + 1}</td>`);
          if (cfg.columns.item) cells.push(`<td>${line.item}</td>`);
          if (cfg.columns.qty) cells.push(`<td>${line.qty}</td>`);
          if (cfg.columns.unitAmount) cells.push(`<td>${moneyFmt(line.unitAmount)}</td>`);
          if (cfg.columns.gross) cells.push(`<td>${moneyFmt(line.gross)}</td>`);
          return `<tr>${cells.join("")}</tr>`;
        })
        .join("");

      const headCells = [
        cfg.columns.srNo ? "<th>Sr No</th>" : "",
        cfg.columns.item ? "<th>Description of Goods</th>" : "",
        cfg.columns.qty ? "<th>Qty</th>" : "",
        cfg.columns.unitAmount ? "<th>Rate</th>" : "",
        cfg.columns.gross ? "<th>Amount</th>" : "",
      ].filter(Boolean).join("");

      const summaryCells = [
        cfg.totals.subtotal ? `<tr><td>Taxable Value</td><td class="right">${moneyFmt(bill.subtotal)}</td></tr>` : "",
        cfg.totals.gstTotal ? `<tr><td>GST Total</td><td class="right">${moneyFmt(bill.gstTotal)}</td></tr>` : "",
        cfg.totals.cgst ? `<tr><td>CGST</td><td class="right">${moneyFmt(cgst)}</td></tr>` : "",
        cfg.totals.sgst ? `<tr><td>SGST</td><td class="right">${moneyFmt(sgst)}</td></tr>` : "",
        cfg.totals.igst ? `<tr><td>IGST</td><td class="right">${moneyFmt(igst)}</td></tr>` : "",
        cfg.totals.total ? `<tr><td><b>Total Amount</b></td><td class="right"><b>${moneyFmt(bill.total)}</b></td></tr>` : "",
      ].filter(Boolean).join("");

      const html = `<html><head><title>${bill.billNo}</title><style>
      body{font-family:Arial,sans-serif;padding:20px;color:#111}
      .sheet{border:2px solid #111;padding:12px}
      .head{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px}
      .h1{font-size:22px;font-weight:700}
      .tax{font-size:46px;font-weight:700}
      .meta{display:grid;grid-template-columns:2fr 1fr;border:1px solid #111;margin-top:12px}
      .meta > div{padding:10px;min-height:85px}
      .meta > div:first-child{border-right:1px solid #111}
      table{width:100%;border-collapse:collapse}
      th,td{border:1px solid #111;padding:6px;vertical-align:top}
      .items{min-height:420px}
      .items td{height:26px}
      .summary td{font-weight:600}
      .bank{margin-top:0}
      .small{font-size:12px}
      .right{text-align:right}
      </style></head><body>
      <div class="sheet">
        <div class="head">
          <div>
            ${cfg.header.businessName ? `<div class="h1">${businessName}</div>` : ""}
            ${cfg.header.businessGstin ? `<div>GSTIN : ${businessGstin}</div>` : ""}
            ${cfg.header.businessAddress ? `<div>Office : ${businessAddress}</div>` : ""}
            ${cfg.header.businessEmail ? `<div>Email ID : ${businessEmail}</div>` : ""}
            ${cfg.header.businessPhone ? `<div>Phone : ${businessPhone}</div>` : ""}
          </div>
          <div class="tax">Tax Invoice</div>
        </div>

        <div class="meta">
          <div>
            ${cfg.header.clientName ? `<div><b>Client Name:</b> ${bill.entityName || "-"}</div>` : ""}
            ${cfg.header.clientAddress ? `<div>Address: ${bill.entityAddress || "-"}</div>` : ""}
            ${cfg.header.clientGstin ? `<div>GSTIN No: ${bill.entityGstin || "-"}</div>` : ""}
          </div>
          <div>
            ${cfg.header.invoiceNo ? `<div><b>Invoice No</b>: ${bill.billNo}</div>` : ""}
            ${cfg.header.invoiceDate ? `<div><b>Invoice Date</b>: ${fmtDate(bill.date)}</div>` : ""}
          </div>
        </div>

        <table>
          <thead>
            <tr>${headCells}</tr>
          </thead>
          <tbody class="items">
            ${rows}
          </tbody>
        </table>

        <table class="summary">
          ${summaryCells}
        </table>

        <table class="bank">
          <tr><td colspan="2"><b>Bank Details</b></td><td rowspan="5"><b>Auth. Signatory</b></td></tr>
          <tr><td>Bank Name</td><td>${bankName}</td></tr>
          <tr><td>Branch Name</td><td>${bankBranch}</td></tr>
          <tr><td>Bank Account No</td><td>${bankAccountNo}</td></tr>
          <tr><td>Bank IFSC Code</td><td>${bankIfsc}</td></tr>
        </table>
      </div>
      </body></html>`;

      const popup = window.open("", "_blank");
      popup.document.write(html);
      popup.document.close();
      popup.print();
      return;
    }

    const colDefs = [
      cfg.columns.srNo ? { key: "srNo", label: "#", render: (_line, idx) => idx + 1 } : null,
      cfg.columns.item ? { key: "item", label: "Item", render: (line) => line.item } : null,
      cfg.columns.batchNo ? { key: "batchNo", label: "Batch", render: (line) => line.batchNo || "-" } : null,
      cfg.columns.qty ? { key: "qty", label: "Qty", render: (line) => line.qty } : null,
      cfg.columns.unitAmount ? { key: "unitAmount", label: "Unit", render: (line) => moneyFmt(line.unitAmount) } : null,
      cfg.columns.base ? { key: "base", label: "Taxable", render: (line) => moneyFmt(line.base) } : null,
      cfg.columns.gstRate ? { key: "gstRate", label: "GST%", render: (line) => line.gstRate } : null,
      cfg.columns.gst ? { key: "gst", label: "GST", render: (line) => moneyFmt(line.gst) } : null,
      cfg.columns.gross ? { key: "gross", label: "Total", render: (line) => moneyFmt(line.gross) } : null,
    ].filter(Boolean);
    const headHtml = colDefs.map((c) => `<th>${c.label}</th>`).join("");
    const linesHtml = bill.lines
      .map((line, idx) => `<tr>${colDefs.map((c) => `<td>${c.render(line, idx)}</td>`).join("")}</tr>`)
      .join("");
    const totalsHtml = [
      cfg.totals.subtotal ? `<p><b>Subtotal:</b> ${moneyFmt(bill.subtotal)}</p>` : "",
      cfg.totals.gstTotal ? `<p><b>GST:</b> ${moneyFmt(bill.gstTotal)}</p>` : "",
      cfg.totals.cgst ? `<p><b>CGST:</b> ${moneyFmt(cgst)}</p>` : "",
      cfg.totals.sgst ? `<p><b>SGST:</b> ${moneyFmt(sgst)}</p>` : "",
      cfg.totals.igst ? `<p><b>IGST:</b> ${moneyFmt(igst)}</p>` : "",
      cfg.totals.total ? `<p><b>Total:</b> ${moneyFmt(bill.total)}</p>` : "",
    ].join("");
    const headerMeta = [
      cfg.header.businessName ? `<p><b>Business:</b> ${businessName}</p>` : "",
      cfg.header.businessGstin ? `<p><b>GSTIN:</b> ${businessGstin}</p>` : "",
      cfg.header.businessAddress ? `<p><b>Address:</b> ${businessAddress}</p>` : "",
      cfg.header.businessEmail ? `<p><b>Email:</b> ${businessEmail}</p>` : "",
      cfg.header.businessPhone ? `<p><b>Phone:</b> ${businessPhone}</p>` : "",
      cfg.header.clientName ? `<p><b>Entity:</b> ${bill.entityName || "-"}</p>` : "",
      cfg.header.invoiceNo ? `<p><b>Invoice:</b> ${bill.billNo}</p>` : "",
      cfg.header.invoiceDate ? `<p><b>Date:</b> ${fmtDate(bill.date)}</p>` : "",
    ].join("");
    const html = `<html><head><title>${bill.billNo}</title><style>body{font-family:Arial;padding:24px;background:${theme.bodyBg};color:${theme.text}}h2{color:${theme.accent}}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ddd;padding:8px}th{background:${theme.thBg}}</style></head><body><h2>Tax Invoice ${bill.billNo}</h2>${headerMeta}<table><thead><tr>${headHtml}</tr></thead><tbody>${linesHtml}</tbody></table>${totalsHtml}</body></html>`;
    const popup = window.open("", "_blank");
    popup.document.write(html);
    popup.document.close();
    popup.print();
  };

  const onExportEntities = () => csvDownload("entities.csv", [["Name", "Category", "GSTIN", "Phone", "Address", "Opening Balance", "Balance"], ...entities.map((e) => [e.name, e.category, e.gstin, e.phone, e.address, e.openingBalance, e.balance])]);
  const onExportTransactions = () =>
    csvDownload(
      "transactions.csv",
      [[
        "Date",
        "Entity",
        "Product",
        "Type",
        "Item",
        "Batch No",
        "Mfg Date",
        "Exp Date",
        "Qty",
        "Unit",
        "Base",
        "GST",
        "Gross",
        "Paid",
        "Due",
        "Due Date",
      ], ...transactions.map((t) => [
        t.date,
        t.entityName,
        t.productName || "",
        t.type,
        t.item,
        t.batchNo || "",
        t.mfgDate || "",
        t.expDate || "",
        t.qty,
        t.unitAmount,
        t.base,
        t.gst,
        t.gross,
        t.paidAmount,
        t.due,
        t.dueDate || "",
      ])]
    );
  const onExportBills = () => csvDownload("bills.csv", [["Bill No", "Date", "Entity", "Subtotal", "GST", "Total"], ...bills.map((b) => [b.billNo, b.date, b.entityName, b.subtotal, b.gstTotal, b.total])]);

  return (
    <ConfigProvider theme={antTheme}>
      <AntApp>
        {contextHolder}
        <Routes>
        <Route path="/login" element={<LoginPage authMsg={authMsg} onLogin={onLogin} onRegister={onRegister} authBusy={busy} />} />

        <Route
          path="/*"
          element={
            <ProtectedRoute me={me} authLoading={authLoading}>
              <AppLayout me={me} onLogout={onLogout} logoutLoading={busy.logout} uiPrefs={uiPrefs} onUpdateUiPrefs={setUiPrefs} globalQuery={globalQuery} onGlobalQueryChange={setGlobalQuery}>
                <Routes>
                  <Route path="/dashboard" element={<DashboardPage summary={summary} transactions={filteredTransactions} money={moneyFmt} fmtDate={fmtDate} />} />
                  <Route path="/entities" element={<EntitiesPage entityForm={entityForm} setEntityForm={setEntityForm} entities={filteredEntities} saveEntity={saveEntity} fillEntity={fillEntity} deleteEntity={deleteEntity} getEntityPassbook={getEntityPassbook} saveLoading={busy.entity} money={moneyFmt} fmtDate={fmtDate} />} />
                  <Route path="/products" element={<ProductsPage productForm={productForm} setProductForm={setProductForm} products={filteredProducts} saveProduct={saveProduct} editProduct={editProduct} deleteProduct={deleteProduct} getProductStockLedger={getProductStockLedger} saveLoading={busy.product} money={moneyFmt} fmtDate={fmtDate} />} />
                  <Route path="/transactions" element={<TransactionsPage txForm={txForm} setTxForm={setTxForm} entities={entities} products={products} entityFilter={entityFilter} setEntityFilter={setEntityFilter} filteredTransactions={filteredTransactions} saveTx={saveTx} editTx={editTx} addPayment={addPayment} deleteTx={deleteTx} getProductBatches={getProductBatches} saveLoading={busy.transaction} paymentLoading={busy.payment} money={moneyFmt} fmtDate={fmtDate} />} />
                  <Route path="/import-sales" element={<ImportSalesPage onImport={importSalesCsv} importLoading={busy.importCsv} />} />
                  <Route path="/bills" element={<BillsPage billForm={billForm} setBillForm={setBillForm} entities={entities} salesForBill={salesForBill} bills={filteredBills} saveBill={saveBill} printBill={printBill} deleteBill={deleteBill} billTemplateConfig={billTemplateConfig} setBillTemplateConfig={setBillTemplateConfig} defaultBillTemplateConfig={defaultBillTemplateConfig} saveLoading={busy.bill} money={moneyFmt} fmtDate={fmtDate} />} />
                  <Route path="/reports" element={<ReportsPage summary={summary} transactions={transactions} audits={audits} onExportEntities={onExportEntities} onExportTransactions={onExportTransactions} onExportBills={onExportBills} onExportBackup={exportBackup} onImportBackup={importBackup} exportLoading={busy.backupExport} importLoading={busy.backupImport} money={moneyFmt} />} />
                  <Route path="/reminders" element={<RemindersPage reminders={filteredReminders} addPayment={addPayment} money={moneyFmt} fmtDate={fmtDate} />} />
                  <Route path="/profile" element={<ProfilePage profileForm={profileForm} setProfileForm={setProfileForm} saveProfile={saveProfile} saveLoading={busy.profile} />} />
                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
              </AppLayout>
            </ProtectedRoute>
          }
        />
        </Routes>
      </AntApp>
    </ConfigProvider>
  );
}
