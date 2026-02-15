const { MongoClient, ObjectId } = require("mongodb");
const { MONGODB_URI, MONGODB_DB } = require("../config/constants");

let client;
let db;

async function connectMongo() {
  if (db) return db;
  const runningOnRender = Boolean(process.env.RENDER || process.env.RENDER_SERVICE_ID);
  const forceIpv4 = process.env.MONGODB_FORCE_IPV4
    ? process.env.MONGODB_FORCE_IPV4 === "true"
    : !runningOnRender;
  const options = {
    serverSelectionTimeoutMS: Number(process.env.MONGODB_SERVER_SELECTION_TIMEOUT_MS || 12000),
    connectTimeoutMS: Number(process.env.MONGODB_CONNECT_TIMEOUT_MS || 12000),
    ...(forceIpv4 ? { family: 4 } : {}),
  };

  if (MONGODB_URI.startsWith("mongodb+srv://")) {
    options.tls = true;
  }

  if (process.env.MONGODB_TLS_ALLOW_INVALID_CERTS === "true") {
    options.tlsAllowInvalidCertificates = true;
  }
  if (process.env.MONGODB_TLS_ALLOW_INVALID_HOSTS === "true") {
    options.tlsAllowInvalidHostnames = true;
  }

  try {
    client = new MongoClient(MONGODB_URI, options);
    await client.connect();
    db = client.db(MONGODB_DB);
    return db;
  } catch (err) {
    const message = [
      "MongoDB connection failed.",
      err?.message || String(err),
      "Checks:",
      "1) Atlas IP Access List allows your current IP (or temporarily 0.0.0.0/0).",
      "2) MONGODB_URI credentials and cluster host are correct.",
      "3) If TLS handshake keeps failing, set MONGODB_FORCE_IPV4=true.",
      "4) On restricted/corporate networks, try MONGODB_TLS_ALLOW_INVALID_CERTS=true.",
    ].join(" ");
    throw new Error(message);
  }
}

function getDb() {
  if (!db) throw new Error("MongoDB is not connected.");
  return db;
}

function toObjectId(id) {
  if (!id || !ObjectId.isValid(String(id))) return null;
  return new ObjectId(String(id));
}

function normalize(doc) {
  if (!doc) return null;
  const { _id, ...rest } = doc;
  return { id: String(_id), ...rest };
}

module.exports = { connectMongo, getDb, toObjectId, normalize };
