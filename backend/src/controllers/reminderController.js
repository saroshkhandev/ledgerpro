const { sendJson } = require("../utils/http");

function reminderController(services) {
  return {
    list: async (req, res, userId) => {
      sendJson(res, 200, { items: await services.transactions.reminders(userId) });
    },
  };
}

module.exports = reminderController;
