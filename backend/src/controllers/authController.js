const { sendJson, readBody } = require("../utils/http");
const { createSession, destroySessionByRequest, getUserIdFromRequest } = require("../middleware/sessionStore");

function authController(services) {
  return {
    register: async (req, res) => {
      try {
        const body = await readBody(req);
        const user = await services.auth.register(body);
        const sid = createSession(user.id);
        sendJson(res, 201, { ok: true, user, sid }, { "Set-Cookie": `sid=${sid}; HttpOnly; Path=/; SameSite=Lax` });
      } catch (err) {
        sendJson(res, 400, { error: err.message });
      }
    },

    login: async (req, res) => {
      try {
        const body = await readBody(req);
        const user = await services.auth.login(body);
        const sid = createSession(user.id);
        sendJson(res, 200, { ok: true, user, sid }, { "Set-Cookie": `sid=${sid}; HttpOnly; Path=/; SameSite=Lax` });
      } catch (err) {
        sendJson(res, 401, { error: err.message });
      }
    },

    logout: (req, res) => {
      destroySessionByRequest(req);
      sendJson(res, 200, { ok: true }, { "Set-Cookie": "sid=; HttpOnly; Max-Age=0; Path=/; SameSite=Lax" });
    },

    me: async (req, res) => {
      const user = await services.auth.me(getUserIdFromRequest(req));
      if (!user) return sendJson(res, 200, { authenticated: false });
      return sendJson(res, 200, { authenticated: true, user });
    },

    profile: async (req, res) => {
      try {
        const userId = getUserIdFromRequest(req);
        if (!userId) return sendJson(res, 401, { error: "Unauthorized" });

        if (req.method === "GET") {
          const user = await services.auth.me(userId);
          return sendJson(res, 200, { item: user });
        }

        const body = await readBody(req);
        const item = await services.auth.updateProfile(userId, body);
        return sendJson(res, 200, { ok: true, item });
      } catch (err) {
        return sendJson(res, 400, { error: err.message });
      }
    },
  };
}

module.exports = authController;
