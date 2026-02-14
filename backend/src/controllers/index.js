const authController = require("./authController");
const entityController = require("./entityController");
const transactionController = require("./transactionController");
const billController = require("./billController");
const reminderController = require("./reminderController");
const summaryController = require("./summaryController");
const productController = require("./productController");
const auditController = require("./auditController");
const backupController = require("./backupController");

module.exports = (services) => ({
  auth: authController(services),
  entities: entityController(services),
  transactions: transactionController(services),
  bills: billController(services),
  reminders: reminderController(services),
  summary: summaryController(services),
  products: productController(services),
  audit: auditController(services),
  backup: backupController(services),
});
