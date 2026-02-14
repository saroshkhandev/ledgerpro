const { sendJson } = require("../utils/http");

function summaryController(services) {
  return {
    get: async (req, res, userId) => {
      sendJson(res, 200, await services.summary.get(userId));
    },
  };
}

module.exports = summaryController;
