const { sendJson, readBody } = require("../utils/http");

function auditController(services) {
  return {
    list: async (req, res, userId, _params, query) => {
      const limit = Number(query.limit || 200);
      sendJson(res, 200, { items: await services.audit.list(userId, limit) });
    },

    create: async (req, res, userId) => {
      try {
        const body = await readBody(req);
        const item = await services.audit.log(userId, body);
        sendJson(res, 201, { ok: true, item });
      } catch (err) {
        sendJson(res, 400, { error: err.message });
      }
    },
  };
}

module.exports = auditController;
