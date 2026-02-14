const { nowIso } = require("../utils/format");
const { getDb, toObjectId, normalize } = require("../db/mongo");

class TransactionModel {
  col() {
    return getDb().collection("transactions");
  }

  async listByUser(userId) {
    const docs = await this.col().find({ userId: String(userId) }).toArray();
    return docs.map(normalize);
  }

  async create(userId, payload) {
    const doc = { userId: String(userId), ...payload, entityId: String(payload.entityId), createdAt: nowIso() };
    const res = await this.col().insertOne(doc);
    return normalize({ _id: res.insertedId, ...doc });
  }

  async update(userId, id, payload) {
    const oid = toObjectId(id);
    if (!oid) return null;
    const patch = { ...payload, entityId: String(payload.entityId) };
    await this.col().updateOne({ _id: oid, userId: String(userId) }, { $set: patch });
    return this.findById(userId, id);
  }

  async patchPayment(userId, id, payment, paidAmount) {
    const oid = toObjectId(id);
    if (!oid) return null;
    await this.col().updateOne(
      { _id: oid, userId: String(userId) },
      {
        $set: { paidAmount },
        $push: { payments: payment },
      }
    );
    return this.findById(userId, id);
  }

  async remove(userId, id) {
    const oid = toObjectId(id);
    if (!oid) return false;
    const res = await this.col().deleteOne({ _id: oid, userId: String(userId) });
    return res.deletedCount > 0;
  }

  async findById(userId, id) {
    const oid = toObjectId(id);
    if (!oid) return null;
    return normalize(await this.col().findOne({ _id: oid, userId: String(userId) }));
  }

  async existsByEntity(userId, entityId) {
    const hit = await this.col().findOne({ userId: String(userId), entityId: String(entityId) }, { projection: { _id: 1 } });
    return !!hit;
  }
}

module.exports = TransactionModel;
