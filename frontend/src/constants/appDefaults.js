import { today } from "../utils/format";

export const STORAGE_KEYS = {
  uiPrefs: "ledger_ui_prefs",
  billTemplate: "ledger_bill_template_config",
};

export const defaultUiPrefs = { darkMode: false, compactTables: false };

export const initialBusyState = {
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
};

export const initialEntityForm = {
  id: null,
  name: "",
  category: "Medical Store",
  gstin: "",
  phone: "",
  address: "",
  openingBalance: 0,
};

export const initialProductForm = {
  id: null,
  name: "",
  sku: "",
  unit: "pcs",
  batchingEnabled: false,
  initialBatchNo: "",
  initialMfgDate: "",
  initialExpDate: "",
  salePrice: 0,
  purchasePrice: 0,
  gstRate: 18,
  stockQty: 0,
  reorderLevel: 5,
  description: "",
};

export const initialTxForm = () => ({
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

export const initialBillForm = () => ({
  date: today(),
  entityId: "",
  prefix: "INV",
  saleIds: [],
  template: "classic",
});

export const defaultBillTemplateConfig = {
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

export const initialProfileForm = () => ({
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

export function mergeBillTemplateConfig(raw) {
  const parsed = raw || {};
  return {
    header: { ...defaultBillTemplateConfig.header, ...(parsed.header || {}) },
    columns: { ...defaultBillTemplateConfig.columns, ...(parsed.columns || {}) },
    totals: { ...defaultBillTemplateConfig.totals, ...(parsed.totals || {}) },
  };
}
