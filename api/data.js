import {
  ADMIN_KEYS,
  PUBLIC_KEYS,
  readAppData,
  readJsonBody,
  requireAdmin,
  secureUsersForStorage,
  sendJson,
  writeAppData,
} from "./_lib/admin.js";

const USERS_KEY = "edt_users_v10";

export default async function handler(req, res) {
  if (req.method === "GET") {
    const key = String(req.query?.key || "");
    if (!key || !ADMIN_KEYS.has(key)) return sendJson(res, 400, { error: "Invalid key" });
    if (!PUBLIC_KEYS.has(key)) {
      const user = await requireAdmin(req, res);
      if (!user) return;
    }
    const fallback = key === USERS_KEY ? [] : null;
    const value = await readAppData(key, fallback);
    return sendJson(res, 200, { value });
  }

  if (!["POST", "PUT"].includes(req.method)) {
    res.setHeader("Allow", "GET, POST, PUT");
    return sendJson(res, 405, { error: "Method not allowed" });
  }

  const user = await requireAdmin(req, res);
  if (!user) return;

  try {
    const body = await readJsonBody(req);
    const key = String(body?.key || "");
    if (!key || !ADMIN_KEYS.has(key)) return sendJson(res, 400, { error: "Invalid key" });
    const value = key === USERS_KEY ? await secureUsersForStorage(body?.value || []) : body?.value;
    await writeAppData(key, value);
    return sendJson(res, 200, { ok: true, value });
  } catch (error) {
    return sendJson(res, 500, { error: error.message || "Erro interno" });
  }
}

