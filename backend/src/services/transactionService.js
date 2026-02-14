const { toNumber, txTotals, todayIso } = require("../utils/format");
const { parseCsv } = require("../utils/csv");

class TransactionService {
  constructor(models) {
    this.models = models;
  }

  sanitize(payload = {}, { forUpdate = false } = {}) {
    const paidProvided = Object.prototype.hasOwnProperty.call(payload || {}, "paidAmount");
    const allowedTypes = ["sale", "purchase", "sale_return", "purchase_return"];
    const incomingType = String(payload.type || "sale").trim().toLowerCase();
    return {
      entityId: String(payload.entityId || "").trim(),
      productId: String(payload.productId || "").trim(),
      type: allowedTypes.includes(incomingType) ? incomingType : "sale",
      date: String(payload.date || "").trim(),
      item: String(payload.item || "").trim(),
      qty: toNumber(payload.qty, 1),
      unitAmount: toNumber(payload.unitAmount),
      gstRate: toNumber(payload.gstRate),
      dueDate: String(payload.dueDate || "").trim(),
      paidAmount: forUpdate && !paidProvided ? undefined : toNumber(payload.paidAmount),
      reminderEnabled: payload.reminderEnabled !== false,
      note: String(payload.note || "").trim(),
      batchingEnabled: payload.batchingEnabled === true || String(payload.batchingEnabled || "") === "true" || String(payload.batchingEnabled || "") === "1",
      batchNo: String(payload.batchNo || "").trim(),
      mfgDate: String(payload.mfgDate || "").trim(),
      expDate: String(payload.expDate || "").trim(),
    };
  }

  async assertValid(payload, userId) {
    if (!payload.date || !payload.entityId || !payload.item) throw new Error("Invalid transaction fields.");
    if (payload.qty <= 0 || payload.unitAmount < 0 || payload.gstRate < 0) throw new Error("Invalid transaction numbers.");
    const entity = await this.models.entities.findById(userId, payload.entityId);
    if (!entity) throw new Error("Entity not found.");
    if (payload.productId) {
      const product = await this.models.products.findById(userId, payload.productId);
      if (!product) throw new Error("Product not found.");
    }
    if (payload.batchingEnabled && !payload.batchNo) {
      throw new Error("Batch number is required when batching is enabled.");
    }
    if (payload.mfgDate && payload.expDate && payload.expDate < payload.mfgDate) {
      throw new Error("Batch expiry date should be after manufacturing date.");
    }
  }

  async enrich(userId, tx) {
    const entity = await this.models.entities.findById(userId, tx.entityId);
    const product = tx.productId ? await this.models.products.findById(userId, tx.productId) : null;
    let payments = Array.isArray(tx.payments) ? tx.payments : [];
    if (!payments.length && toNumber(tx.paidAmount) > 0) {
      payments = [
        {
          id: `legacy_${tx.id}`,
          amount: toNumber(tx.paidAmount),
          date: tx.date || todayIso(),
          note: "Legacy paid amount",
          createdAt: tx.createdAt || new Date().toISOString(),
        },
      ];
    }
    const paidFromTimeline = payments.reduce((acc, p) => acc + toNumber(p.amount), 0);
    const paidAmount = Math.max(toNumber(tx.paidAmount), paidFromTimeline);
    return {
      ...tx,
      paidAmount,
      payments,
      ...txTotals({ ...tx, paidAmount }),
      entityName: entity ? entity.name : "-",
      productName: product ? product.name : "",
    };
  }

  async list(userId, { entityId } = {}) {
    const txs = await this.models.transactions.listByUser(userId);
    const filtered = txs.filter((tx) => (!entityId ? true : String(tx.entityId) === String(entityId)));
    const enriched = await Promise.all(filtered.map((tx) => this.enrich(userId, tx)));
    return enriched.sort((a, b) => (a.date < b.date ? 1 : -1));
  }

  async create(userId, payload) {
    const clean = this.sanitize(payload);

    if (clean.productId && !clean.item) {
      const product = await this.models.products.findById(userId, clean.productId);
      if (product) clean.item = product.name;
      if (product && !clean.unitAmount) {
        clean.unitAmount = clean.type === "sale" || clean.type === "sale_return"
          ? Number(product.salePrice || 0)
          : Number(product.purchasePrice || 0);
      }
      if (product && !clean.gstRate) clean.gstRate = Number(product.gstRate || 0);
    }

    await this.assertValid(clean, userId);
    clean.paidAmount = Math.max(0, toNumber(clean.paidAmount));
    clean.payments = clean.paidAmount > 0 ? [{ id: `p_${Date.now()}`, amount: clean.paidAmount, date: clean.date || todayIso(), note: "Initial paid amount" }] : [];
    return this.models.transactions.create(userId, clean);
  }

  async update(userId, id, payload) {
    const existing = await this.models.transactions.findById(userId, id);
    if (!existing) throw new Error("Transaction not found.");

    const clean = this.sanitize(payload, { forUpdate: true });
    if (clean.paidAmount === undefined) clean.paidAmount = toNumber(existing.paidAmount);
    clean.payments = Array.isArray(existing.payments) ? existing.payments : [];
    await this.assertValid(clean, userId);
    const tx = await this.models.transactions.update(userId, id, clean);
    if (!tx) throw new Error("Transaction not found.");
    return tx;
  }

  async addPayment(userId, id, { addPaid, date, note } = {}) {
    const tx = await this.models.transactions.findById(userId, id);
    if (!tx) throw new Error("Transaction not found.");
    const add = toNumber(addPaid);
    if (add <= 0) throw new Error("Payment should be greater than 0.");
    const payments = Array.isArray(tx.payments) ? tx.payments : [];
    const paidFromTimeline = payments.reduce((acc, p) => acc + toNumber(p.amount), 0);
    const alreadyPaid = Math.max(toNumber(tx.paidAmount), paidFromTimeline);
    const totals = txTotals({ ...tx, paidAmount: alreadyPaid });
    if (totals.due <= 0) throw new Error("Transaction is already fully paid.");

    const paymentAmount = Math.min(totals.due, add);
    const paidAmount = alreadyPaid + paymentAmount;
    const payment = {
      id: `p_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
      amount: paymentAmount,
      date: String(date || todayIso()).slice(0, 10),
      note: String(note || "").trim(),
      createdAt: new Date().toISOString(),
    };
    return this.models.transactions.patchPayment(userId, id, payment, paidAmount);
  }

  async remove(userId, id) {
    const ok = await this.models.transactions.remove(userId, id);
    if (!ok) throw new Error("Transaction not found.");
    await this.models.bills.rebuildAfterTransactionDelete(userId, id);
    return true;
  }

  async listBatches(userId, productId) {
    if (!productId) return [];
    const txs = await this.models.transactions.listByUser(userId);
    const product = await this.models.products.findById(userId, productId);
    const lines = txs
      .filter((tx) =>
        String(tx.productId || "") === String(productId) &&
        (tx.batchingEnabled || tx.batchNo) &&
        String(tx.batchNo || "").trim()
      )
      .sort((a, b) => (a.date < b.date ? 1 : -1));

    const byBatch = new Map();
    lines.forEach((tx) => {
      const batchNo = String(tx.batchNo || "").trim();
      const qty = toNumber(tx.qty);
      const inQty = tx.type === "purchase" || tx.type === "sale_return" ? qty : 0;
      const outQty = tx.type === "sale" || tx.type === "purchase_return" ? qty : 0;
      if (!byBatch.has(batchNo)) {
        byBatch.set(batchNo, {
          batchNo,
          mfgDate: tx.mfgDate || "",
          expDate: tx.expDate || "",
          gstRate: toNumber(tx.gstRate),
          unitAmount: toNumber(tx.unitAmount),
          currentQty: 0,
          lastUsedDate: tx.date || "",
        });
      }
      const row = byBatch.get(batchNo);
      row.currentQty += inQty - outQty;
      if (!row.mfgDate && tx.mfgDate) row.mfgDate = tx.mfgDate;
      if (!row.expDate && tx.expDate) row.expDate = tx.expDate;
      if (!row.lastUsedDate || tx.date > row.lastUsedDate) {
        row.lastUsedDate = tx.date || row.lastUsedDate;
        row.gstRate = toNumber(tx.gstRate);
        row.unitAmount = toNumber(tx.unitAmount);
      }
    });

    if (product?.batchingEnabled && String(product.initialBatchNo || "").trim()) {
      const batchNo = String(product.initialBatchNo || "").trim();
      if (!byBatch.has(batchNo)) {
        byBatch.set(batchNo, {
          batchNo,
          mfgDate: String(product.initialMfgDate || "").trim(),
          expDate: String(product.initialExpDate || "").trim(),
          gstRate: toNumber(product.gstRate),
          unitAmount: toNumber(product.salePrice || product.purchasePrice),
          currentQty: toNumber(product.stockQty),
          lastUsedDate: "",
        });
      }
    }

    return [...byBatch.values()].sort((a, b) => (a.lastUsedDate < b.lastUsedDate ? 1 : -1));
  }

  async reminders(userId) {
    const today = todayIso();
    const items = await this.list(userId);
    return items
      .filter((tx) => tx.reminderEnabled && tx.dueDate && tx.dueDate <= today && tx.due > 0)
      .sort((a, b) => (a.dueDate > b.dueDate ? 1 : -1));
  }

  async importSalesCsv(userId, csvText) {
    const { rows } = parseCsv(csvText);
    if (!rows.length) throw new Error("CSV has no rows.");

    const imported = [];
    const errors = [];

    for (let i = 0; i < rows.length; i += 1) {
      const r = rows[i];
      try {
        const payload = {
          date: r.date || r.tx_date || r.Date || "",
          entityId: r.entityId || r.entity_id || r.EntityId || "",
          productId: r.productId || r.product_id || "",
          type: (r.type || r.Type || "sale").toLowerCase(),
          item: r.item || r.Item || "",
          qty: r.qty || r.quantity || r.Qty || 1,
          unitAmount: r.unitAmount || r.amount || r.unit_amount || r.UnitAmount || 0,
          gstRate: r.gstRate || r.gst || r.gst_rate || r.GstRate || 0,
          dueDate: r.dueDate || r.due_date || "",
          paidAmount: r.paidAmount || r.paid_amount || 0,
          reminderEnabled: String(r.reminderEnabled || r.reminder_enabled || "1") !== "0",
          note: r.note || r.Note || "",
          batchingEnabled: String(r.batchingEnabled || r.batching_enabled || "0") === "1",
          batchNo: r.batchNo || r.batch_no || "",
          mfgDate: r.mfgDate || r.mfg_date || "",
          expDate: r.expDate || r.exp_date || "",
        };

        payload.type = "sale";
        const tx = await this.create(userId, payload);
        imported.push(tx.id);
      } catch (err) {
        errors.push({ row: i + 2, error: err.message });
      }
    }

    return {
      importedCount: imported.length,
      errorCount: errors.length,
      errors,
    };
  }
}

module.exports = TransactionService;
