const crypto = require("crypto");
const { connectMongo, getDb } = require("./mongo");
const { nowIso } = require("../utils/format");

const SEED_TAG = "demo_v1";
const DEFAULT_EMAIL = process.env.SEED_EMAIL || "saroshabdullah2013@gmail.com";

function hash(password) {
  return crypto.createHash("sha256").update(password).digest("hex");
}

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

function txTotals(tx) {
  const base = Number(tx.qty || 0) * Number(tx.unitAmount || 0);
  const gst = (base * Number(tx.gstRate || 0)) / 100;
  const gross = base + gst;
  return { base, gst, gross };
}

async function ensureUser(db, email) {
  const users = db.collection("users");
  const existing = await users.findOne({ email: String(email).toLowerCase() });
  if (existing) return existing;

  const doc = {
    name: "Demo Owner",
    email: String(email).toLowerCase(),
    passwordHash: hash("12345678"),
    address: "Mumbai, India",
    photoUrl: "",
    currency: "INR",
    createdAt: nowIso(),
  };
  const res = await users.insertOne(doc);
  return { _id: res.insertedId, ...doc };
}

async function main() {
  await connectMongo();
  const db = getDb();
  const user = await ensureUser(db, DEFAULT_EMAIL);
  const userId = String(user._id);

  const entitiesCol = db.collection("entities");
  const productsCol = db.collection("products");
  const txCol = db.collection("transactions");
  const billsCol = db.collection("bills");
  const auditCol = db.collection("audit_logs");

  const seeded = await entitiesCol.findOne({ userId, seedTag: SEED_TAG });
  if (seeded) {
    console.log(`Seed already exists for user ${DEFAULT_EMAIL} (${SEED_TAG}).`);
    process.exit(0);
  }

  const entities = [
    { name: "City Medical Store", category: "Medical Store", gstin: "27ABCDE1234F1Z5", phone: "9876543210", address: "Andheri, Mumbai", openingBalance: 12000 },
    { name: "Apex General Traders", category: "General Store", gstin: "27PQRSX5678G1Z2", phone: "9898989898", address: "Thane, Mumbai", openingBalance: -5000 },
    { name: "Nova Manufacturing", category: "Manufacturer", gstin: "27LMNOP2222H1Z9", phone: "9811111111", address: "Navi Mumbai", openingBalance: 0 },
  ].map((x) => ({ ...x, userId, seedTag: SEED_TAG, createdAt: nowIso() }));
  const entRes = await entitiesCol.insertMany(entities);
  const entityDocs = entities.map((e, i) => ({ _id: entRes.insertedIds[i], ...e }));

  const products = [
    { name: "Paracetamol 500mg", sku: "MED-001", unit: "box", batchingEnabled: true, initialBatchNo: "PCM-OPEN-01", initialMfgDate: "2025-01-05", initialExpDate: "2027-01-04", salePrice: 45, purchasePrice: 30, gstRate: 12, stockQty: 120, reorderLevel: 40, description: "Pain relief tablets" },
    { name: "Vitamin C Syrup", sku: "MED-002", unit: "bottle", batchingEnabled: true, initialBatchNo: "VCS-OPEN-01", initialMfgDate: "2025-03-12", initialExpDate: "2026-09-11", salePrice: 95, purchasePrice: 68, gstRate: 12, stockQty: 70, reorderLevel: 25, description: "Immune support" },
    { name: "Notebook A5", sku: "GEN-101", unit: "pcs", batchingEnabled: false, salePrice: 55, purchasePrice: 35, gstRate: 18, stockQty: 220, reorderLevel: 60, description: "Stationery notebook" },
    { name: "Packing Tape", sku: "MFG-301", unit: "roll", batchingEnabled: true, initialBatchNo: "PT-OPEN-01", initialMfgDate: "2025-02-15", initialExpDate: "2028-02-14", salePrice: 80, purchasePrice: 52, gstRate: 18, stockQty: 140, reorderLevel: 35, description: "Industrial tape" },
  ].map((x) => ({ ...x, userId, seedTag: SEED_TAG, createdAt: nowIso() }));
  const prodRes = await productsCol.insertMany(products);
  const productDocs = products.map((p, i) => ({ _id: prodRes.insertedIds[i], ...p }));

  const entityByName = Object.fromEntries(entityDocs.map((e) => [e.name, e]));
  const productByName = Object.fromEntries(productDocs.map((p) => [p.name, p]));

  const txTemplates = [
    { days: 1, entity: "City Medical Store", product: "Paracetamol 500mg", type: "sale", item: "Paracetamol 500mg", qty: 25, unitAmount: 45, gstRate: 12, dueDays: 10, paid: 400, note: "Regular supply", batchingEnabled: true, batchNo: "PCM-2401", mfgDate: "2025-01-05", expDate: "2027-01-04" },
    { days: 3, entity: "City Medical Store", product: "Vitamin C Syrup", type: "sale", item: "Vitamin C Syrup", qty: 12, unitAmount: 95, gstRate: 12, dueDays: 7, paid: 0, note: "Due pending", batchingEnabled: true, batchNo: "VCS-2403", mfgDate: "2025-03-12", expDate: "2026-09-11" },
    { days: 5, entity: "Apex General Traders", product: "Notebook A5", type: "purchase", item: "Notebook A5", qty: 80, unitAmount: 35, gstRate: 18, dueDays: 15, paid: 1200, note: "Bulk purchase" },
    { days: 7, entity: "Apex General Traders", product: "Packing Tape", type: "purchase", item: "Packing Tape", qty: 40, unitAmount: 52, gstRate: 18, dueDays: 8, paid: 0, note: "Factory stock", batchingEnabled: true, batchNo: "PT-2402", mfgDate: "2025-02-15", expDate: "2028-02-14" },
    { days: 9, entity: "Nova Manufacturing", product: "Packing Tape", type: "sale", item: "Packing Tape", qty: 30, unitAmount: 80, gstRate: 18, dueDays: 5, paid: 800, note: "Dispatch order", batchingEnabled: true, batchNo: "PT-2402", mfgDate: "2025-02-15", expDate: "2028-02-14" },
    { days: 11, entity: "City Medical Store", product: "Paracetamol 500mg", type: "sale_return", item: "Paracetamol 500mg", qty: 3, unitAmount: 45, gstRate: 12, dueDays: 0, paid: 0, note: "Damaged return", batchingEnabled: true, batchNo: "PCM-2401", mfgDate: "2025-01-05", expDate: "2027-01-04" },
    { days: 13, entity: "Apex General Traders", product: "Notebook A5", type: "purchase_return", item: "Notebook A5", qty: 5, unitAmount: 35, gstRate: 18, dueDays: 0, paid: 0, note: "Defect pieces" },
    { days: 2, entity: "Nova Manufacturing", product: "Vitamin C Syrup", type: "sale", item: "Vitamin C Syrup", qty: 16, unitAmount: 95, gstRate: 12, dueDays: 14, paid: 500, note: "New customer" },
  ];

  const txDocs = txTemplates.map((t) => {
    const date = daysAgo(t.days);
    const dueDate = t.dueDays > 0 ? daysAgo(t.days - t.dueDays) : "";
    const payments = Number(t.paid) > 0 ? [{ id: `p_seed_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`, amount: Number(t.paid), date, note: "Seed payment", createdAt: nowIso() }] : [];
    return {
      userId,
      seedTag: SEED_TAG,
      date,
      entityId: String(entityByName[t.entity]._id),
      productId: String(productByName[t.product]._id),
      type: t.type,
      item: t.item,
      qty: t.qty,
      unitAmount: t.unitAmount,
      gstRate: t.gstRate,
      dueDate,
      paidAmount: Number(t.paid),
      reminderEnabled: true,
      note: t.note,
      batchingEnabled: !!t.batchingEnabled,
      batchNo: t.batchNo || "",
      mfgDate: t.mfgDate || "",
      expDate: t.expDate || "",
      payments,
      createdAt: nowIso(),
    };
  });
  const txRes = await txCol.insertMany(txDocs);
  const txInserted = txDocs.map((t, i) => ({ _id: txRes.insertedIds[i], ...t }));

  const salesForBill = txInserted.filter((t) => t.type === "sale" && t.entityId === String(entityByName["City Medical Store"]._id)).slice(0, 2);
  if (salesForBill.length) {
    const lines = salesForBill.map((t) => {
      const totals = txTotals(t);
      return {
        transactionId: String(t._id),
        date: t.date,
        item: t.item,
        qty: t.qty,
        unitAmount: t.unitAmount,
        gstRate: t.gstRate,
        base: totals.base,
        gst: totals.gst,
        gross: totals.gross,
      };
    });
    const subtotal = lines.reduce((a, b) => a + b.base, 0);
    const gstTotal = lines.reduce((a, b) => a + b.gst, 0);
    await billsCol.insertOne({
      userId,
      seedTag: SEED_TAG,
      entityId: String(entityByName["City Medical Store"]._id),
      prefix: "INV",
      billNo: "INV-9001",
      date: daysAgo(1),
      lines,
      subtotal,
      gstTotal,
      total: subtotal + gstTotal,
      createdAt: nowIso(),
    });
  }

  await auditCol.insertMany([
    { userId, action: "seed", resource: "system", message: "Dummy data inserted", meta: { tag: SEED_TAG }, createdAt: nowIso() },
    { userId, action: "seed", resource: "transactions", message: `${txDocs.length} transactions created`, meta: { tag: SEED_TAG }, createdAt: nowIso() },
  ]);

  console.log("Dummy seed inserted successfully:");
  console.log(`- user: ${DEFAULT_EMAIL}`);
  console.log(`- entities: ${entities.length}`);
  console.log(`- products: ${products.length}`);
  console.log(`- transactions: ${txDocs.length}`);
  console.log("- invoices: 1");
  console.log("- audit logs: 2");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Seed failed:", err.message);
    process.exit(1);
  });
