const { toNumber } = require("../utils/format");

class ProductService {
  constructor(models) {
    this.models = models;
  }

  attachOpeningBatch(summary, product, openingStock) {
    const batchNo = String(product.initialBatchNo || "").trim();
    if (!product.batchingEnabled || !batchNo || openingStock <= 0) return summary;
    if (summary.batches.find((b) => b.batchNo === batchNo)) return summary;

    const today = new Date().toISOString().slice(0, 10);
    const nearExpiryCutoff = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const mfgDate = String(product.initialMfgDate || "").trim();
    const expDate = String(product.initialExpDate || "").trim();

    summary.batches.push({
      id: batchNo,
      batchNo,
      mfgDate,
      expDate,
      inQty: openingStock,
      outQty: 0,
      currentQty: openingStock,
      lastUsedDate: "",
      isExpired: !!expDate && expDate < today,
      isNearExpiry: !!expDate && expDate >= today && expDate <= nearExpiryCutoff,
    });
    summary.nearExpiryCount = summary.batches.filter((b) => b.isNearExpiry).length;
    summary.expiredCount = summary.batches.filter((b) => b.isExpired).length;
    return summary;
  }

  batchSummaryForProduct(txs, productId) {
    const today = new Date().toISOString().slice(0, 10);
    const nearExpiryCutoff = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const map = new Map();

    txs
      .filter((tx) => String(tx.productId || "") === String(productId) && String(tx.batchNo || "").trim())
      .forEach((tx) => {
        const key = String(tx.batchNo || "").trim();
        const qty = toNumber(tx.qty);
        const inQty = tx.type === "purchase" || tx.type === "sale_return" ? qty : 0;
        const outQty = tx.type === "sale" || tx.type === "purchase_return" ? qty : 0;
        if (!map.has(key)) {
          map.set(key, {
            id: key,
            batchNo: key,
            mfgDate: tx.mfgDate || "",
            expDate: tx.expDate || "",
            inQty: 0,
            outQty: 0,
            currentQty: 0,
            lastUsedDate: tx.date || "",
          });
        }
        const row = map.get(key);
        row.inQty += inQty;
        row.outQty += outQty;
        row.currentQty = row.inQty - row.outQty;
        if (!row.mfgDate && tx.mfgDate) row.mfgDate = tx.mfgDate;
        if (!row.expDate && tx.expDate) row.expDate = tx.expDate;
        if (!row.lastUsedDate || (tx.date || "") > row.lastUsedDate) row.lastUsedDate = tx.date || row.lastUsedDate;
      });

    const batches = [...map.values()]
      .map((b) => ({
        ...b,
        isExpired: !!b.expDate && b.expDate < today,
        isNearExpiry: !!b.expDate && b.expDate >= today && b.expDate <= nearExpiryCutoff,
      }))
      .sort((a, b) => (a.expDate && b.expDate ? (a.expDate < b.expDate ? -1 : 1) : (a.batchNo < b.batchNo ? -1 : 1)));

    const nearExpiryCount = batches.filter((b) => b.isNearExpiry).length;
    const expiredCount = batches.filter((b) => b.isExpired).length;

    return { batches, nearExpiryCount, expiredCount };
  }

  sanitize(payload = {}) {
    const batchingEnabled = payload.batchingEnabled === true || String(payload.batchingEnabled || "") === "true" || String(payload.batchingEnabled || "") === "1";
    const initialBatchNo = String(payload.initialBatchNo || "").trim();
    const initialMfgDate = String(payload.initialMfgDate || "").trim();
    const initialExpDate = String(payload.initialExpDate || "").trim();
    if (batchingEnabled && initialMfgDate && initialExpDate && initialExpDate < initialMfgDate) {
      throw new Error("Initial batch expiry date should be after manufacturing date.");
    }

    return {
      name: String(payload.name || "").trim(),
      sku: String(payload.sku || "").trim(),
      unit: String(payload.unit || "pcs").trim() || "pcs",
      batchingEnabled,
      initialBatchNo: batchingEnabled ? initialBatchNo : "",
      initialMfgDate: batchingEnabled ? initialMfgDate : "",
      initialExpDate: batchingEnabled ? initialExpDate : "",
      salePrice: toNumber(payload.salePrice),
      purchasePrice: toNumber(payload.purchasePrice),
      gstRate: toNumber(payload.gstRate),
      stockQty: toNumber(payload.stockQty),
      reorderLevel: toNumber(payload.reorderLevel, 5),
      description: String(payload.description || "").trim(),
    };
  }

  async list(userId) {
    const products = await this.models.products.listByUser(userId);
    const txs = await this.models.transactions.listByUser(userId);

    return products.map((p) => {
      const openingStock = toNumber(p.stockQty);
      const movementQty = txs.reduce((acc, tx) => {
        if (String(tx.productId || "") !== String(p.id)) return acc;
        const qty = toNumber(tx.qty);
        if (tx.type === "purchase") return acc + qty;
        if (tx.type === "sale") return acc - qty;
        if (tx.type === "sale_return") return acc + qty;
        if (tx.type === "purchase_return") return acc - qty;
        return acc;
      }, 0);
      const currentStock = openingStock + movementQty;
      const reorderLevel = toNumber(p.reorderLevel, 5);
      const batchSummary = this.attachOpeningBatch(this.batchSummaryForProduct(txs, p.id), p, openingStock);
      return {
        ...p,
        openingStock,
        currentStock,
        reorderLevel,
        lowStock: currentStock <= reorderLevel,
        batchCount: batchSummary.batches.length,
        nearExpiryCount: batchSummary.nearExpiryCount,
        expiredCount: batchSummary.expiredCount,
      };
    });
  }

  async stockLedger(userId, productId) {
    const product = await this.models.products.findById(userId, productId);
    if (!product) throw new Error("Product not found.");

    const openingStock = toNumber(product.stockQty);
    const txs = await this.models.transactions.listByUser(userId);
    const movements = txs
      .filter((tx) => String(tx.productId || "") === String(productId))
      .sort((a, b) => (a.date < b.date ? -1 : 1))
      .map((tx) => ({
        id: tx.id,
        date: tx.date,
        refType: tx.type,
        refItem: tx.item,
        inQty: tx.type === "purchase" || tx.type === "sale_return" ? toNumber(tx.qty) : 0,
        outQty: tx.type === "sale" || tx.type === "purchase_return" ? toNumber(tx.qty) : 0,
        note: tx.note || "",
      }));

    let runningStock = openingStock;
    const lines = [
      {
        id: "opening",
        date: "",
        refType: "opening",
        refItem: "Opening Stock",
        inQty: openingStock,
        outQty: 0,
        runningStock,
        note: "",
      },
    ];

    movements.forEach((m) => {
      runningStock += m.inQty - m.outQty;
      lines.push({ ...m, runningStock });
    });

    const reorderLevel = toNumber(product.reorderLevel, 5);
    const batchSummary = this.attachOpeningBatch(this.batchSummaryForProduct(txs, productId), product, openingStock);
    return {
      productId: product.id,
      productName: product.name,
      unit: product.unit || "pcs",
      openingStock,
      currentStock: runningStock,
      reorderLevel,
      lowStock: runningStock <= reorderLevel,
      nearExpiryCount: batchSummary.nearExpiryCount,
      expiredCount: batchSummary.expiredCount,
      batches: batchSummary.batches,
      lines,
    };
  }

  async create(userId, payload) {
    const clean = this.sanitize(payload);
    if (!clean.name) throw new Error("Product name is required.");
    return this.models.products.create(userId, clean);
  }

  async update(userId, id, payload) {
    const clean = this.sanitize(payload);
    if (!clean.name) throw new Error("Product name is required.");
    const item = await this.models.products.update(userId, id, clean);
    if (!item) throw new Error("Product not found.");
    return item;
  }

  async remove(userId, id) {
    const ok = await this.models.products.remove(userId, id);
    if (!ok) throw new Error("Product not found.");
    return true;
  }
}

module.exports = ProductService;
