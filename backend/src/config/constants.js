const path = require("path");

const ROOT_DIR = path.resolve(__dirname, "../../..");

module.exports = {
  PORT: process.env.PORT || 4000,
  ROOT_DIR,
  FRONTEND_DIST_DIR: path.join(ROOT_DIR, "frontend", "dist"),
  MONGODB_URI:
    process.env.MONGODB_URI ||
    "mongodb+srv://saroshklp:GiRm88CfbN0XY01i@ledger-pro.kozjkvj.mongodb.net/?appName=ledger-pro",
  MONGODB_DB: process.env.MONGODB_DB || "ledger_pro",
};
