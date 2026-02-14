function sendJson(res, status, body, headers = {}) {
  res.writeHead(status, { "Content-Type": "application/json", ...headers });
  res.end(JSON.stringify(body));
}

function sendText(res, status, body, headers = {}) {
  res.writeHead(status, { "Content-Type": "text/plain", ...headers });
  res.end(body);
}

function parseCookies(header) {
  const out = {};
  if (!header) return out;
  header.split(";").forEach((kv) => {
    const [k, ...rest] = kv.trim().split("=");
    out[k] = decodeURIComponent(rest.join("="));
  });
  return out;
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => {
      data += chunk;
      if (data.length > 1e6) req.destroy();
    });
    req.on("end", () => {
      if (!data) return resolve({});
      try {
        resolve(JSON.parse(data));
      } catch {
        reject(new Error("Invalid JSON"));
      }
    });
    req.on("error", reject);
  });
}

module.exports = { sendJson, sendText, parseCookies, readBody };
