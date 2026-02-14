const { sendJson, readBody } = require("../utils/http");

function billController(services) {
  return {
    list: async (req, res, userId) => {
      sendJson(res, 200, { items: await services.bills.list(userId) });
    },

    create: async (req, res, userId) => {
      try {
        const body = await readBody(req);
        const item = await services.bills.create(userId, body);
        sendJson(res, 201, { ok: true, item });
      } catch (err) {
        sendJson(res, 400, { error: err.message });
      }
    },

    remove: async (req, res, userId, params) => {
      try {
        await services.bills.remove(userId, params.id);
        sendJson(res, 200, { ok: true });
      } catch (err) {
        sendJson(res, 400, { error: err.message });
      }
    },
  };
}

module.exports = billController;
