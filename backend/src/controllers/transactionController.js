const { sendJson, readBody } = require("../utils/http");

function transactionController(services) {
  return {
    list: async (req, res, userId, _params, query) => {
      sendJson(res, 200, {
        items: await services.transactions.list(userId, { entityId: query.entityId || "" }),
      });
    },

    listBatches: async (req, res, userId, _params, query) => {
      try {
        const items = await services.transactions.listBatches(userId, query.productId || "");
        sendJson(res, 200, { items });
      } catch (err) {
        sendJson(res, 400, { error: err.message });
      }
    },

    create: async (req, res, userId) => {
      try {
        const body = await readBody(req);
        const item = await services.transactions.create(userId, body);
        sendJson(res, 201, { ok: true, item });
      } catch (err) {
        sendJson(res, 400, { error: err.message });
      }
    },

    importCsv: async (req, res, userId) => {
      try {
        const body = await readBody(req);
        const result = await services.transactions.importSalesCsv(userId, body.csvText || "");
        sendJson(res, 200, { ok: true, ...result });
      } catch (err) {
        sendJson(res, 400, { error: err.message });
      }
    },

    update: async (req, res, userId, params) => {
      try {
        const body = await readBody(req);
        const item = await services.transactions.update(userId, params.id, body);
        sendJson(res, 200, { ok: true, item });
      } catch (err) {
        sendJson(res, 400, { error: err.message });
      }
    },

    addPayment: async (req, res, userId, params) => {
      try {
        const body = await readBody(req);
        const item = await services.transactions.addPayment(userId, params.id, body);
        sendJson(res, 200, { ok: true, item });
      } catch (err) {
        sendJson(res, 400, { error: err.message });
      }
    },

    remove: async (req, res, userId, params) => {
      try {
        await services.transactions.remove(userId, params.id);
        sendJson(res, 200, { ok: true });
      } catch (err) {
        sendJson(res, 400, { error: err.message });
      }
    },
  };
}

module.exports = transactionController;
