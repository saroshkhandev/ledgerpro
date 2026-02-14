const models = require("../models");
const AuthService = require("./authService");
const EntityService = require("./entityService");
const TransactionService = require("./transactionService");
const BillService = require("./billService");
const SummaryService = require("./summaryService");
const ProductService = require("./productService");
const AuditService = require("./auditService");
const BackupService = require("./backupService");

module.exports = {
  auth: new AuthService(models),
  entities: new EntityService(models),
  transactions: new TransactionService(models),
  bills: new BillService(models),
  summary: new SummaryService(models),
  products: new ProductService(models),
  audit: new AuditService(models),
  backup: new BackupService(models),
};
