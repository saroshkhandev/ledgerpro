const { sendJson, readBody } = require("../utils/http");

function backupController(services) {
  return {
    export: async (req, res, userId) => {
      try {
        const item = await services.backup.export(userId);
        sendJson(res, 200, { item });
      } catch (err) {
        sendJson(res, 400, { error: err.message });
      }
    },

    restore: async (req, res, userId) => {
      try {
        const body = await readBody(req);
        const item = await services.backup.restore(userId, body);
        sendJson(res, 200, { ok: true, item });
      } catch (err) {
        sendJson(res, 400, { error: err.message });
      }
    },
  };
}

module.exports = backupController;
