const crypto = require("crypto");
const { parseCookies } = require("../utils/http");

const sessions = new Map();

function createSession(userId) {
  const sid = crypto.randomUUID();
  sessions.set(sid, userId);
  return sid;
}

function destroySessionByCookie(cookieHeader) {
  const cookies = parseCookies(cookieHeader || "");
  if (cookies.sid) sessions.delete(cookies.sid);
}

function getUserIdFromRequest(req) {
  const cookies = parseCookies(req.headers.cookie || "");
  if (!cookies.sid) return null;
  return sessions.get(cookies.sid) || null;
}

module.exports = { createSession, destroySessionByCookie, getUserIdFromRequest };
