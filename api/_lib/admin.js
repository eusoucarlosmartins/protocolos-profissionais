import crypto from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const USERS_KEY = "edt_users_v10";
const SESSION_COOKIE = "edt_admin_session";
const SESSION_TTL_SECONDS = 60 * 60 * 12;
const DEFAULT_SUPABASE_URL = "https://jwpsptwqcjhmnicuhgyw.supabase.co";
const DEFAULT_SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3cHNwdHdxY2pobW5pY3VoZ3l3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2MTI5NDUsImV4cCI6MjA5MDE4ODk0NX0.RjWrKGjziNAKDZH-OjE-SlIwihhmzUW_42n01V0atE4";
const PERM_KEYS = {
  dashboard: ["view"],
  products: ["view", "edit", "delete"],
  protocols: ["view", "edit", "delete", "publish"],
  categories: ["view", "edit", "delete"],
  indications: ["view", "edit", "delete"],
  phases: ["view", "edit", "delete"],
  alerts: ["view"],
  settings: ["view", "edit"],
  marketing: ["view", "edit"],
  users: ["view", "edit", "delete"],
};
const FULL_PERMS = Object.fromEntries(
  Object.entries(PERM_KEYS).map(([section, actions]) => [
    section,
    Object.fromEntries(actions.map((action) => [action, true])),
  ]),
);

export const PUBLIC_KEYS = new Set([
  "edt_products_v10",
  "edt_protocols_v10",
  "edt_indications_v10",
  "edt_categories_v10",
  "edt_phases_v10",
  "edt_marketing_v10",
  "edt_brand_v10",
  "edt_views_v10",
]);

export const ADMIN_KEYS = new Set([
  ...PUBLIC_KEYS,
  USERS_KEY,
]);

const getSupabaseUrl = () => process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
const getAnonKey = () => process.env.SUPABASE_ANON || process.env.VITE_SUPABASE_ANON || DEFAULT_SUPABASE_ANON;

export const getServiceRoleKey = () => process.env.SUPABASE_SERVICE_ROLE_KEY || "";
export const getSessionSecret = () => process.env.ADMIN_SESSION_SECRET || "";
export const getTempAdminPassword = () => String(process.env.TEMP_ADMIN_PASSWORD || "").trim();
export const getTempAdminUserId = () => String(process.env.TEMP_ADMIN_USER_ID || "").trim();

export const createServerSupabase = () => {
  const serviceRoleKey = getServiceRoleKey();
  const supabaseKey = serviceRoleKey || getAnonKey();
  return createClient(getSupabaseUrl(), supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
};

export const readJsonBody = async (req) => {
  if (req.body && typeof req.body === "object") return req.body;
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
};

export const sendJson = (res, statusCode, payload) => {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
};

const parseCookies = (req) => {
  const cookieHeader = req.headers.cookie || "";
  return Object.fromEntries(
    cookieHeader
      .split(";")
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const idx = part.indexOf("=");
        return idx === -1 ? [part, ""] : [part.slice(0, idx), decodeURIComponent(part.slice(idx + 1))];
      }),
  );
};

const base64url = (value) => Buffer.from(value).toString("base64url");
const sign = (value, secret) => crypto.createHmac("sha256", secret).update(value).digest("base64url");

export const hashSecret = async (value) =>
  crypto.createHash("sha256").update(String(value || "").trim()).digest("hex");

export const normalizeStoredUser = async (user) => {
  const safeUser = { ...user };
  if (!safeUser.passwordHash && safeUser.password) {
    safeUser.passwordHash = await hashSecret(safeUser.password);
  }
  delete safeUser.password;
  return safeUser;
};

export const secureUsersForStorage = async (users) => Promise.all((users || []).map(normalizeStoredUser));

export const sanitizeUser = (user) => {
  if (!user) return null;
  const { passwordHash, password, ...safeUser } = user;
  return safeUser;
};

export const readAppData = async (key, fallback = null) => {
  const supabase = createServerSupabase();
  const { data, error } = await supabase.from("app_data").select("value").eq("key", key).single();
  if (error || !data) return fallback;
  return data.value;
};

export const writeAppData = async (key, value) => {
  const supabase = createServerSupabase();
  const { error } = await supabase.from("app_data").upsert({ key, value }, { onConflict: "key" });
  if (error) throw error;
};

export const createSessionCookie = (userId) => {
  const secret = getSessionSecret();
  if (!secret) throw new Error("Missing ADMIN_SESSION_SECRET");
  const payload = JSON.stringify({ userId, exp: Date.now() + SESSION_TTL_SECONDS * 1000 });
  const encoded = base64url(payload);
  const signature = sign(encoded, secret);
  return `${encoded}.${signature}`;
};

export const setSessionCookie = (res, userId) => {
  const token = createSessionCookie(userId);
  res.setHeader(
    "Set-Cookie",
    `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${SESSION_TTL_SECONDS}`,
  );
};

export const clearSessionCookie = (res) => {
  res.setHeader("Set-Cookie", `${SESSION_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`);
};

export const readSessionPayload = (req) => {
  const secret = getSessionSecret();
  if (!secret) return null;
  const cookies = parseCookies(req);
  const token = cookies[SESSION_COOKIE];
  if (!token) return null;
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) return null;
  if (sign(encoded, secret) !== signature) return null;
  try {
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
    if (!payload?.userId || !payload?.exp || payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
};

export const getSessionUser = async (req) => {
  const payload = readSessionPayload(req);
  if (!payload) return null;
  const users = await secureUsersForStorage(await readAppData(USERS_KEY, []));
  return users.find((user) => user.id === payload.userId) || null;
};

export const requireAdmin = async (req, res) => {
  const user = await getSessionUser(req);
  if (!user) {
    clearSessionCookie(res);
    sendJson(res, 401, { error: "Unauthorized" });
    return null;
  }
  return user;
};

export const verifyPassword = async (user, password) => {
  if (!password) return false;
  if (user?.passwordHash) return user.passwordHash === (await hashSecret(password));
  if (user?.password) return user.password === password;
  return false;
};

const createDefaultAdminUser = () => ({
  id: "u_admin",
  name: "Admin",
  perms: FULL_PERMS,
});

export const resolveResettableAdminUser = (users) => {
  const targetUserId = getTempAdminUserId();
  const pool = Array.isArray(users) && users.length ? users : [createDefaultAdminUser()];
  if (targetUserId) {
    return pool.find((user) => user.id === targetUserId) || { ...createDefaultAdminUser(), id: targetUserId };
  }
  return pool.find((user) => user.id === "u_admin") || pool[0] || createDefaultAdminUser();
};
