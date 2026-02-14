const UserModel = require("./userModel");
const EntityModel = require("./entityModel");
const TransactionModel = require("./transactionModel");
const BillModel = require("./billModel");
const ProductModel = require("./productModel");
const AuditModel = require("./auditModel");

module.exports = {
  users: new UserModel(),
  entities: new EntityModel(),
  transactions: new TransactionModel(),
  bills: new BillModel(),
  products: new ProductModel(),
  audit: new AuditModel(),
};
