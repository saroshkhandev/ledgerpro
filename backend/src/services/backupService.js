const { getDb, toObjectId } = require("../db/mongo");

class BackupService {
  constructor(models) {
    this.models = models;
  }

  async export(userId) {
    const [user, entities, products, transactions, bills] = await Promise.all([
      this.models.users.findById(userId),
      this.models.entities.listByUser(userId),
      this.models.products.listByUser(userId),
      this.models.transactions.listByUser(userId),
      this.models.bills.listByUser(userId),
    ]);

    return {
      version: 1,
      exportedAt: new Date().toISOString(),
      data: {
        user: user
          ? {
              name: user.name || "",
              email: user.email || "",
              address: user.address || "",
              photoUrl: user.photoUrl || "",
              currency: user.currency || "INR",
            }
          : null,
        entities,
        products,
        transactions,
        bills,
      },
    };
  }

  restoreDoc(userId, x) {
    const { id, _id, ...rest } = x || {};
    const next = { userId: String(userId), ...rest };
    const oid = toObjectId(id || _id);
    if (oid) next._id = oid;
    return next;
  }

  async restore(userId, payload = {}) {
    const data = payload.data || {};
    const entities = Array.isArray(data.entities) ? data.entities : [];
    const products = Array.isArray(data.products) ? data.products : [];
    const transactions = Array.isArray(data.transactions) ? data.transactions : [];
    const bills = Array.isArray(data.bills) ? data.bills : [];

    const db = getDb();

    await Promise.all([
      db.collection("entities").deleteMany({ userId: String(userId) }),
      db.collection("products").deleteMany({ userId: String(userId) }),
      db.collection("transactions").deleteMany({ userId: String(userId) }),
      db.collection("bills").deleteMany({ userId: String(userId) }),
    ]);

    if (entities.length) {
      await db.collection("entities").insertMany(
        entities.map((x) => this.restoreDoc(userId, x))
      );
    }
    if (products.length) {
      await db.collection("products").insertMany(
        products.map((x) => this.restoreDoc(userId, x))
      );
    }
    if (transactions.length) {
      await db.collection("transactions").insertMany(
        transactions.map((x) => this.restoreDoc(userId, x))
      );
    }
    if (bills.length) {
      await db.collection("bills").insertMany(
        bills.map((x) => this.restoreDoc(userId, x))
      );
    }

    if (data.user && typeof data.user === "object") {
      const userPatch = {
        name: String(data.user.name || "").trim() || undefined,
        address: String(data.user.address || "").trim(),
        photoUrl: String(data.user.photoUrl || "").trim(),
        currency: String(data.user.currency || "INR").trim().toUpperCase(),
      };
      Object.keys(userPatch).forEach((k) => userPatch[k] === undefined && delete userPatch[k]);
      await this.models.users.updateProfile(userId, userPatch);
    }

    return {
      entities: entities.length,
      products: products.length,
      transactions: transactions.length,
      bills: bills.length,
    };
  }
}

module.exports = BackupService;
