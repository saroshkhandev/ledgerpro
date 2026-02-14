const { txTotals } = require("../utils/format");

class BillService {
  constructor(models) {
    this.models = models;
  }

  async list(userId) {
    const entities = await this.models.entities.listByUser(userId);
    const bills = await this.models.bills.listByUser(userId);
    return bills
      .map((bill) => {
        const entity = entities.find((e) => String(e.id) === String(bill.entityId));
        return {
          ...bill,
          entityName: entity ? entity.name : "-",
          entityCategory: entity ? entity.category : "",
          entityGstin: entity ? entity.gstin : "",
          entityPhone: entity ? entity.phone : "",
          entityAddress: entity ? entity.address : "",
        };
      })
      .sort((a, b) => (a.date < b.date ? 1 : -1));
  }

  async create(userId, payload) {
    const entityId = String(payload.entityId || "").trim();
    const date = String(payload.date || "").trim();
    const prefix = String(payload.prefix || "INV").trim().toUpperCase();
    const saleIds = Array.isArray(payload.saleIds) ? payload.saleIds.map((x) => String(x)) : [];

    if (!entityId || !date || !saleIds.length) throw new Error("Invalid bill data.");

    const allTx = await this.models.transactions.listByUser(userId);
    const sales = allTx.filter(
      (tx) => String(tx.entityId) === entityId && tx.type === "sale" && saleIds.includes(String(tx.id))
    );
    if (!sales.length) throw new Error("No valid sales selected.");

    const lines = sales.map((tx) => {
      const totals = txTotals(tx);
      return {
        transactionId: String(tx.id),
        date: tx.date,
        item: tx.item,
        qty: tx.qty,
        unitAmount: tx.unitAmount,
        gstRate: tx.gstRate,
        base: totals.base,
        gst: totals.gst,
        gross: totals.gross,
      };
    });

    const subtotal = lines.reduce((a, b) => a + b.base, 0);
    const gstTotal = lines.reduce((a, b) => a + b.gst, 0);
    const total = subtotal + gstTotal;

    const existing = await this.models.bills.listByUser(userId);
    const seq = existing.filter((b) => b.prefix === prefix).length + 1;
    const billNo = `${prefix}-${String(seq).padStart(4, "0")}`;

    return this.models.bills.create(userId, {
      entityId,
      prefix,
      billNo,
      date,
      lines,
      subtotal,
      gstTotal,
      total,
    });
  }

  async remove(userId, id) {
    const ok = await this.models.bills.remove(userId, id);
    if (!ok) throw new Error("Bill not found.");
    return true;
  }
}

module.exports = BillService;
