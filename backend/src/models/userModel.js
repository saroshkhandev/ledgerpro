const { nowIso } = require("../utils/format");
const { getDb, toObjectId, normalize } = require("../db/mongo");

class UserModel {
  col() {
    return getDb().collection("users");
  }

  async create({
    name,
    email,
    passwordHash,
    address,
    photoUrl,
    currency,
    businessName,
    businessGstin,
    businessPhone,
    businessEmail,
    bankName,
    bankBranch,
    bankAccountNo,
    bankIfsc,
  }) {
    const doc = {
      name,
      email,
      passwordHash,
      address: address || "",
      photoUrl: photoUrl || "",
      currency: currency || "INR",
      businessName: businessName || "",
      businessGstin: businessGstin || "",
      businessPhone: businessPhone || "",
      businessEmail: businessEmail || "",
      bankName: bankName || "",
      bankBranch: bankBranch || "",
      bankAccountNo: bankAccountNo || "",
      bankIfsc: bankIfsc || "",
      createdAt: nowIso(),
    };
    const res = await this.col().insertOne(doc);
    return normalize({ _id: res.insertedId, ...doc });
  }

  async findByEmail(email) {
    return normalize(await this.col().findOne({ email }));
  }

  async findById(id) {
    const oid = toObjectId(id);
    if (!oid) return null;
    return normalize(await this.col().findOne({ _id: oid }));
  }

  async updateProfile(id, patch) {
    const oid = toObjectId(id);
    if (!oid) return null;
    await this.col().updateOne({ _id: oid }, { $set: patch });
    return this.findById(id);
  }
}

module.exports = UserModel;
