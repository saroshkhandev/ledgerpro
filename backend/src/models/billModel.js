const { nowIso } = require("../utils/format");
const { getDb, toObjectId, normalize } = require("../db/mongo");

class BillModel {
  col() {
    return getDb().collection("bills");
  }

  async listByUser(userId) {
    const docs = await this.col().find({ userId: String(userId) }).toArray();
    return docs.map(normalize);
  }

  async create(userId, payload) {
    const doc = {
      userId: String(userId),
      entityId: String(payload.entityId),
      prefix: payload.prefix,
      billNo: payload.billNo,
      date: payload.date,
      lines: payload.lines,
      subtotal: payload.subtotal,
      gstTotal: payload.gstTotal,
      total: payload.total,
      createdAt: nowIso(),
    };
    const res = await this.col().insertOne(doc);
    return normalize({ _id: res.insertedId, ...doc });
  }

  async remove(userId, id) {
    const oid = toObjectId(id);
    if (!oid) return false;
    const res = await this.col().deleteOne({ _id: oid, userId: String(userId) });
    return res.deletedCount > 0;
  }

  async rebuildAfterTransactionDelete(userId, txId) {
    const bills = await this.listByUser(userId);
    for (const bill of bills) {
      const lines = (bill.lines || []).filter((ln) => String(ln.transactionId) !== String(txId));
      if (!lines.length) {
        await this.remove(userId, bill.id);
        continue;
      }
      if (lines.length === (bill.lines || []).length) continue;
      const subtotal = lines.reduce((a, b) => a + Number(b.base || 0), 0);
      const gstTotal = lines.reduce((a, b) => a + Number(b.gst || 0), 0);
      const oid = toObjectId(bill.id);
      await this.col().updateOne(
        { _id: oid, userId: String(userId) },
        { $set: { lines, subtotal, gstTotal, total: subtotal + gstTotal } }
      );
    }
  }
}

module.exports = BillModel;
