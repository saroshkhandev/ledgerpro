class EntityService {
  constructor(models) {
    this.models = models;
  }

  sanitize(payload = {}) {
    return {
      name: String(payload.name || "").trim(),
      category: String(payload.category || "Other").trim() || "Other",
      gstin: String(payload.gstin || "").trim(),
      phone: String(payload.phone || "").trim(),
      address: String(payload.address || "").trim(),
      openingBalance: Number.isFinite(Number(payload.openingBalance)) ? Number(payload.openingBalance) : 0,
    };
  }

  txOutstandingImpact(tx) {
    const base = Number(tx.qty || 0) * Number(tx.unitAmount || 0);
    const gst = (base * Number(tx.gstRate || 0)) / 100;
    const gross = base + gst;
    const due = Math.max(gross - Number(tx.paidAmount || 0), 0);
    if (tx.type === "sale") return due;
    if (tx.type === "purchase") return -due;
    if (tx.type === "sale_return") return -due;
    if (tx.type === "purchase_return") return due;
    return 0;
  }

  async list(userId) {
    const entities = await this.models.entities.listByUser(userId);
    const txs = await this.models.transactions.listByUser(userId);
    return entities.map((entity) => {
      const openingBalance = Number(entity.openingBalance || 0);
      const balance = txs.reduce((acc, tx) => {
        if (String(tx.entityId) !== String(entity.id)) return acc;
        return acc + this.txOutstandingImpact(tx);
      }, openingBalance);
      return { ...entity, openingBalance, balance };
    });
  }

  async passbook(userId, entityId) {
    const entity = await this.models.entities.findById(userId, entityId);
    if (!entity) throw new Error("Entity not found.");

    const openingBalance = Number(entity.openingBalance || 0);
    const txs = await this.models.transactions.listByUser(userId);
    const lines = txs
      .filter((tx) => String(tx.entityId) === String(entityId))
      .sort((a, b) => {
        const ad = `${a.date || ""}|${a.createdAt || ""}`;
        const bd = `${b.date || ""}|${b.createdAt || ""}`;
        return ad < bd ? -1 : 1;
      });

    let running = openingBalance;
    const entries = [
      {
        id: "opening",
        date: "",
        type: "opening",
        item: "Opening Balance",
        debit: openingBalance > 0 ? openingBalance : 0,
        credit: openingBalance < 0 ? Math.abs(openingBalance) : 0,
        balance: running,
      },
    ];

    lines.forEach((tx) => {
      const base = Number(tx.qty || 0) * Number(tx.unitAmount || 0);
      const gst = (base * Number(tx.gstRate || 0)) / 100;
      const gross = base + gst;
      const paid = Number(tx.paidAmount || 0);
      const due = Math.max(gross - paid, 0);
      const debit = tx.type === "sale" ? due : 0;
      const credit = tx.type === "purchase" ? due : 0;
      running += debit - credit;

      entries.push({
        id: tx.id,
        date: tx.date,
        type: tx.type,
        item: tx.item,
        gross,
        paid,
        debit,
        credit,
        balance: running,
      });
    });

    return {
      entityId: entity.id,
      entityName: entity.name,
      openingBalance,
      closingBalance: running,
      entries,
    };
  }

  async create(userId, payload) {
    const clean = this.sanitize(payload);
    if (!clean.name) throw new Error("Entity name is required.");
    return this.models.entities.create(userId, clean);
  }

  async update(userId, id, payload) {
    const clean = this.sanitize(payload);
    if (!clean.name) throw new Error("Entity name is required.");
    const entity = await this.models.entities.update(userId, id, clean);
    if (!entity) throw new Error("Entity not found.");
    return entity;
  }

  async remove(userId, id) {
    if (await this.models.transactions.existsByEntity(userId, id)) {
      throw new Error("Cannot delete entity with transactions.");
    }
    const ok = await this.models.entities.remove(userId, id);
    if (!ok) throw new Error("Entity not found.");
    return true;
  }
}

module.exports = EntityService;
