import {
  clearSessionCookie,
  getTempAdminPassword,
  getSessionUser,
  readAppData,
  readJsonBody,
  hashSecret,
  resolveResettableAdminUser,
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

  if (req.method === "PUT") {
    try {
      const sessionUser = await getSessionUser(req);
      if (!sessionUser) {
        clearSessionCookie(res);
        return sendJson(res, 401, { error: "Unauthorized" });
      }

      const body = await readJsonBody(req);
      const nextPassword = String(body?.password || "").trim();
      if (nextPassword.length < 8 || !/[A-Za-z]/.test(nextPassword) || !/\d/.test(nextPassword)) {
        return sendJson(res, 400, { error: "Use pelo menos 8 caracteres, com letras e números" });
      }

      const loadedUsers = await readAppData(USERS_KEY, []);
      const securedUsers = await secureUsersForStorage(loadedUsers);
      const nextPasswordHash = await hashSecret(nextPassword);
      const updatedUsers = securedUsers.map((user) =>
        user.id === sessionUser.id
          ? { ...user, passwordHash: nextPasswordHash, requirePasswordReset: false }
          : user,
      );

      await writeAppData(USERS_KEY, updatedUsers);
      const updatedUser = updatedUsers.find((user) => user.id === sessionUser.id);
      return sendJson(res, 200, { user: sanitizeUser(updatedUser) });
    } catch (error) {
      return sendJson(res, 500, { error: error.message || "Erro interno" });
    }
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "GET, POST, PUT, DELETE");
    return sendJson(res, 405, { error: "Method not allowed" });
  }

  try {
    const body = await readJsonBody(req);
    const password = String(body?.password || "");
    const loadedUsers = await readAppData(USERS_KEY, []);
    let securedUsers = await secureUsersForStorage(loadedUsers);

    if (JSON.stringify(loadedUsers) !== JSON.stringify(securedUsers)) {
      await writeAppData(USERS_KEY, securedUsers);
    }

    const tempPassword = getTempAdminPassword();
    if (tempPassword && password === tempPassword) {
      const targetUser = resolveResettableAdminUser(securedUsers);
      const targetUserHash = await hashSecret(tempPassword);
      const nextUser = {
        ...targetUser,
        passwordHash: targetUserHash,
        requirePasswordReset: true,
      };
      const existingIndex = securedUsers.findIndex((user) => user.id === nextUser.id);
      const nextUsers = existingIndex >= 0
        ? securedUsers.map((user, index) => (index === existingIndex ? nextUser : user))
        : [...securedUsers, nextUser];

      await writeAppData(USERS_KEY, nextUsers);
      setSessionCookie(res, nextUser.id);
      return sendJson(res, 200, { user: sanitizeUser(nextUser) });
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
