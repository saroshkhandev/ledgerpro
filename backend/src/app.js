const http = require("http");
const fs = require("fs");
const path = require("path");
const { URL } = require("url");
require("./config/env");

const { PORT, FRONTEND_DIST_DIR } = require("./config/constants");
const services = require("./services");
const buildControllers = require("./controllers");
const { buildRoutes, routeMatch } = require("./routes");
const { connectMongo } = require("./db/mongo");
const { sendJson, sendText } = require("./utils/http");
const { getUserIdFromRequest } = require("./middleware/sessionStore");

const controllers = buildControllers(services);
const routes = buildRoutes(controllers);

function contentTypeFor(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".html") return "text/html";
  if (ext === ".css") return "text/css";
  if (ext === ".js" || ext === ".mjs") return "application/javascript";
  if (ext === ".json") return "application/json";
  if (ext === ".svg") return "image/svg+xml";
  if (ext === ".png") return "image/png";
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".ico") return "image/x-icon";
  return "application/octet-stream";
}

function serveBuiltFrontend(pathname, res) {
  const requested = pathname === "/" ? "/index.html" : pathname;
  const filePath = path.join(FRONTEND_DIST_DIR, path.normalize(requested));
  if (!filePath.startsWith(FRONTEND_DIST_DIR)) return sendText(res, 403, "Forbidden");

  fs.readFile(filePath, (err, data) => {
    if (!err) {
      res.writeHead(200, { "Content-Type": contentTypeFor(filePath) });
      res.end(data);
      return;
    }

    const indexPath = path.join(FRONTEND_DIST_DIR, "index.html");
    fs.readFile(indexPath, (indexErr, indexData) => {
      if (indexErr) {
        return sendText(res, 404, "Frontend build not found. Run: npm --prefix frontend run build");
      }
      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(indexData);
    });
  });
}

function findRoute(method, pathname) {
  for (const route of routes) {
    if (route.method !== method) continue;
    const params = routeMatch(pathname, route.path);
    if (params) return { ...route, params };
  }
  return null;
}

function setCorsHeaders(req, res) {
  const origin = req.headers.origin;
  const allowedOrigins = new Set([
    "capacitor://localhost",
    "http://localhost",
    "http://localhost:5173",
    "http://localhost:4000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:4000",
  ]);
  if (origin && allowedOrigins.has(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  }
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-Session-Id");
}

const server = http.createServer(async (req, res) => {
  try {
    setCorsHeaders(req, res);
    if (req.method === "OPTIONS") {
      res.writeHead(204);
      res.end();
      return;
    }

    const url = new URL(req.url, `http://${req.headers.host}`);
    const { pathname } = url;

    if (pathname === "/api/health") {
      return sendJson(res, 200, { ok: true, service: "ledgerpro" });
    }

    const route = findRoute(req.method, pathname);
    if (route) {
      if (route.auth) {
        const userId = getUserIdFromRequest(req);
        if (!userId) return sendJson(res, 401, { error: "Unauthorized" });
        return await route.handler(
          req,
          res,
          userId,
          route.params,
          Object.fromEntries(url.searchParams.entries())
        );
      }
      return await route.handler(
        req,
        res,
        null,
        route.params,
        Object.fromEntries(url.searchParams.entries())
      );
    }

    if (pathname.startsWith("/api/")) return sendJson(res, 404, { error: "Not Found" });
    return serveBuiltFrontend(pathname, res);
  } catch (err) {
    return sendJson(res, 500, { error: err.message || "Internal server error" });
  }
});

(async () => {
  try {
    await connectMongo();
    server.listen(PORT, () => {
      console.log(`Ledger app running at http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err.message);
    process.exit(1);
  }
})();
