import {
  clearSessionCookie,
  getSessionUser,
  readAppData,
  readJsonBody,
  sanitizeUser,
  secureUsersForStorage,
  sendJson,
  setSessionCookie,
  verifyPassword,
  writeAppData,
} from "../_lib/admin.js";

const USERS_KEY = "edt_users_v10";

export default async function handler(req, res) {
  if (req.method === "GET") {
    const user = await getSessionUser(req);
    if (!user) {
      clearSessionCookie(res);
      return sendJson(res, 401, { user: null });
    }
    return sendJson(res, 200, { user: sanitizeUser(user) });
  }

  if (req.method === "DELETE") {
    clearSessionCookie(res);
    return sendJson(res, 200, { ok: true });
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "GET, POST, DELETE");
    return sendJson(res, 405, { error: "Method not allowed" });
  }

  try {
    const body = await readJsonBody(req);
    const password = String(body?.password || "");
    const loadedUsers = await readAppData(USERS_KEY, []);
    const securedUsers = await secureUsersForStorage(loadedUsers);

    if (JSON.stringify(loadedUsers) !== JSON.stringify(securedUsers)) {
      await writeAppData(USERS_KEY, securedUsers);
    }

    for (const user of securedUsers) {
      if (await verifyPassword(user, password)) {
        setSessionCookie(res, user.id);
        return sendJson(res, 200, { user: sanitizeUser(user) });
      }
    }

    return sendJson(res, 401, { error: "Credenciais inválidas" });
  } catch (error) {
    return sendJson(res, 500, { error: error.message || "Erro interno" });
  }
}

