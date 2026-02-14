const { sendJson, readBody } = require("../utils/http");

function productController(services) {
  return {
    list: async (req, res, userId) => {
      sendJson(res, 200, { items: await services.products.list(userId) });
    },

    stockLedger: async (req, res, userId, params) => {
      try {
        const item = await services.products.stockLedger(userId, params.id);
        sendJson(res, 200, { item });
      } catch (err) {
        sendJson(res, 400, { error: err.message });
      }
    },

    create: async (req, res, userId) => {
      try {
        const body = await readBody(req);
        const item = await services.products.create(userId, body);
        sendJson(res, 201, { ok: true, item });
      } catch (err) {
        sendJson(res, 400, { error: err.message });
      }
    },

    update: async (req, res, userId, params) => {
      try {
        const body = await readBody(req);
        const item = await services.products.update(userId, params.id, body);
        sendJson(res, 200, { ok: true, item });
      } catch (err) {
        sendJson(res, 400, { error: err.message });
      }
    },

    remove: async (req, res, userId, params) => {
      try {
        await services.products.remove(userId, params.id);
        sendJson(res, 200, { ok: true });
      } catch (err) {
        sendJson(res, 400, { error: err.message });
      }
    },
  };
}

module.exports = productController;
