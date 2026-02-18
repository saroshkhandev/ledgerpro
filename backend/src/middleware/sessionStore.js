const crypto = require("crypto");
const { parseCookies } = require("../utils/http");

const sessions = new Map();

function createSession(userId) {
  const sid = crypto.randomUUID();
  sessions.set(sid, userId);
  return sid;
}

function getSessionIdFromRequest(req) {
  const cookies = parseCookies(req.headers.cookie || "");
  if (cookies.sid) return cookies.sid;
  const headerSid = req.headers["x-session-id"];
  if (headerSid && typeof headerSid === "string") return headerSid;
  return null;
}

function getUserIdFromRequest(req) {
  const sid = getSessionIdFromRequest(req);
  if (!sid) return null;
  return sessions.get(sid) || null;
}

function destroySessionByRequest(req) {
  const sid = getSessionIdFromRequest(req);
  if (sid) sessions.delete(sid);
}

module.exports = { createSession, destroySessionByRequest, getUserIdFromRequest };
