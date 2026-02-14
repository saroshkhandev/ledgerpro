const { nowIso } = require("../utils/format");
const { getDb, normalize } = require("../db/mongo");

class AuditModel {
  col() {
    return getDb().collection("audit_logs");
  }

  async create(userId, payload) {
    const doc = {
      userId: String(userId),
      action: String(payload.action || "").trim(),
      resource: String(payload.resource || "").trim(),
      message: String(payload.message || "").trim(),
      meta: payload.meta && typeof payload.meta === "object" ? payload.meta : {},
      createdAt: nowIso(),
    };
    const res = await this.col().insertOne(doc);
    return normalize({ _id: res.insertedId, ...doc });
  }

  async listByUser(userId, limit = 200) {
    const docs = await this.col()
      .find({ userId: String(userId) })
      .sort({ createdAt: -1 })
      .limit(Number(limit) || 200)
      .toArray();
    return docs.map(normalize);
  }
}

module.exports = AuditModel;
