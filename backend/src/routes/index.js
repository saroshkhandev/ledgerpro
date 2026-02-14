function routeMatch(pathname, pattern) {
  const names = [];
  const regex = new RegExp(
    "^" +
      pattern
        .replace(/\//g, "\\/")
        .replace(/:([A-Za-z0-9_]+)/g, (_, name) => {
          names.push(name);
          return "([A-Za-z0-9_-]+)";
        }) +
      "$"
  );

  const match = pathname.match(regex);
  if (!match) return null;
  const params = {};
  names.forEach((name, idx) => {
    params[name] = match[idx + 1];
  });
  return params;
}

function buildRoutes(controllers) {
  return [
    { method: "POST", path: "/api/auth/register", handler: controllers.auth.register, auth: false },
    { method: "POST", path: "/api/auth/login", handler: controllers.auth.login, auth: false },
    { method: "POST", path: "/api/auth/logout", handler: controllers.auth.logout, auth: false },
    { method: "GET", path: "/api/auth/me", handler: controllers.auth.me, auth: false },
    { method: "GET", path: "/api/auth/profile", handler: controllers.auth.profile, auth: false },
    { method: "PUT", path: "/api/auth/profile", handler: controllers.auth.profile, auth: false },

    { method: "GET", path: "/api/entities", handler: controllers.entities.list, auth: true },
    { method: "GET", path: "/api/entities/:id/passbook", handler: controllers.entities.passbook, auth: true },
    { method: "POST", path: "/api/entities", handler: controllers.entities.create, auth: true },
    { method: "PUT", path: "/api/entities/:id", handler: controllers.entities.update, auth: true },
    { method: "DELETE", path: "/api/entities/:id", handler: controllers.entities.remove, auth: true },

    { method: "GET", path: "/api/products", handler: controllers.products.list, auth: true },
    { method: "GET", path: "/api/products/:id/stock-ledger", handler: controllers.products.stockLedger, auth: true },
    { method: "POST", path: "/api/products", handler: controllers.products.create, auth: true },
    { method: "PUT", path: "/api/products/:id", handler: controllers.products.update, auth: true },
    { method: "DELETE", path: "/api/products/:id", handler: controllers.products.remove, auth: true },

    { method: "GET", path: "/api/transactions", handler: controllers.transactions.list, auth: true },
    { method: "GET", path: "/api/transactions/batches", handler: controllers.transactions.listBatches, auth: true },
    { method: "POST", path: "/api/transactions", handler: controllers.transactions.create, auth: true },
    { method: "POST", path: "/api/transactions/import-csv", handler: controllers.transactions.importCsv, auth: true },
    { method: "PUT", path: "/api/transactions/:id", handler: controllers.transactions.update, auth: true },
    { method: "PATCH", path: "/api/transactions/:id/payment", handler: controllers.transactions.addPayment, auth: true },
    { method: "DELETE", path: "/api/transactions/:id", handler: controllers.transactions.remove, auth: true },

    { method: "GET", path: "/api/bills", handler: controllers.bills.list, auth: true },
    { method: "POST", path: "/api/bills", handler: controllers.bills.create, auth: true },
    { method: "DELETE", path: "/api/bills/:id", handler: controllers.bills.remove, auth: true },

    { method: "GET", path: "/api/reminders", handler: controllers.reminders.list, auth: true },
    { method: "GET", path: "/api/summary", handler: controllers.summary.get, auth: true },
    { method: "GET", path: "/api/audit", handler: controllers.audit.list, auth: true },
    { method: "POST", path: "/api/audit", handler: controllers.audit.create, auth: true },
    { method: "GET", path: "/api/backup", handler: controllers.backup.export, auth: true },
    { method: "POST", path: "/api/backup/restore", handler: controllers.backup.restore, auth: true },
  ];
}

module.exports = { buildRoutes, routeMatch };
