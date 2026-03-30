import { createClient } from "@supabase/supabase-js";
import {
  ADMIN_LOGIN_GUARD_KEY,
  ADMIN_LOGIN_LOCK_MS,
  ADMIN_LOGIN_MAX_ATTEMPTS,
  EMPTY_PERMS,
  FULL_PERMS,
  USERS_KEY,
} from "./app-constants";

let purifyInstance = null;
let supabaseInstance = null;

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://jwpsptwqcjhmnicuhgyw.supabase.co";
const SUPABASE_ANON =
  import.meta.env.VITE_SUPABASE_ANON ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3cHNwdHdxY2pobW5pY3VoZ3l3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2MTI5NDUsImV4cCI6MjA5MDE4ODk0NX0.RjWrKGjziNAKDZH-OjE-SlIwihhmzUW_42n01V0atE4";

const stripHtml = (html) => String(html || "").replace(/<[^>]*>/g, "");
const MOJIBAKE_RE = /Ã.|Â.|â€|â€“|â€”|�/;

const MOJIBAKE_RE_BROAD = /Ã|Â|â€|â€“|â€”|ï¿½|�/;

const decodeMojibake = (value) => {
  if (typeof value !== "string" || !(MOJIBAKE_RE.test(value) || MOJIBAKE_RE_BROAD.test(value))) return value;
  try {
    let current = value;
    for (let index = 0; index < 5; index += 1) {
      const bytes = Uint8Array.from(Array.from(current).map((char) => char.charCodeAt(0) & 0xff));
      const next = new TextDecoder("utf-8").decode(bytes);
      if (!next || next === current) break;
      current = next;
      if (!(MOJIBAKE_RE.test(current) || MOJIBAKE_RE_BROAD.test(current))) break;
    }
    return current;
  } catch {
    return value;
  }
};

const normalizeContent = (value) => {
  if (Array.isArray(value)) return value.map(normalizeContent);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, normalizeContent(item)]));
  }
  return decodeMojibake(value);
};

export const getPurify = () => {
  if (purifyInstance) return Promise.resolve(purifyInstance);
  if (window.DOMPurify) {
    purifyInstance = window.DOMPurify;
    return Promise.resolve(purifyInstance);
  }
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/dompurify/3.1.6/purify.min.js";
    script.onload = () => {
      purifyInstance = window.DOMPurify;
      resolve(purifyInstance);
    };
    script.onerror = reject;
    document.head.appendChild(script);
  });
};

export const clean = (html) => {
  if (!html) return "";
  if (purifyInstance) return purifyInstance.sanitize(html);
  if (window.DOMPurify) return window.DOMPurify.sanitize(html);
  return stripHtml(html);
};

export const primePurify = () => getPurify().catch(() => null);

export const getSupabase = async () => {
  if (supabaseInstance) return supabaseInstance;
  supabaseInstance = createClient(SUPABASE_URL, SUPABASE_ANON);
  return supabaseInstance;
};

export const loadHtml2Pdf = () => {
  if (window.html2pdf) return Promise.resolve(window.html2pdf);
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js";
    script.onload = () => resolve(window.html2pdf);
    document.head.appendChild(script);
  });
};

export const load = async (key, fallback) => {
  try {
    const response = await fetch(`/api/data?key=${encodeURIComponent(key)}`, { credentials: "same-origin" });
    if (response.ok) {
      const payload = await response.json();
      if (payload && Object.prototype.hasOwnProperty.call(payload, "value")) {
        return payload.value == null ? normalizeContent(fallback) : normalizeContent(payload.value);
      }
    }
    if (key === USERS_KEY) return normalizeContent(fallback);
  } catch (error) {
    if (key === USERS_KEY) return normalizeContent(fallback);
    console.warn("API load error:", error);
  }

  try {
    const supabaseClient = await getSupabase();
    const { data, error } = await supabaseClient.from("app_data").select("value").eq("key", key).single();
    if (!error && data) return data.value == null ? normalizeContent(fallback) : normalizeContent(data.value);
  } catch (error) {
    console.warn("Supabase load error:", error);
  }

  return normalizeContent(fallback);
};

export const save = async (key, value) => {
  const normalizedValue = normalizeContent(value);
  const response = await fetch("/api/data", {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ key, value: normalizedValue }),
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    if (response.status === 401) {
      await logoutAdmin();
      throw new Error("Sua sessão expirou. Faça login novamente.");
    }
    throw new Error(payload?.error || "Falha ao salvar dados");
  }
  return response.json().catch(() => ({ ok: true }));
};

export const savePublic = async (key, value) => {
  try {
    const supabaseClient = await getSupabase();
    await supabaseClient.from("app_data").upsert({ key, value: normalizeContent(value) }, { onConflict: "key" });
  } catch (error) {
    console.warn("Supabase save error:", error);
  }
};

export const getAdminSession = async () => {
  const response = await fetch("/api/admin/session", { credentials: "same-origin" });
  if (!response.ok) return null;
  const payload = await response.json().catch(() => ({}));
  return payload?.user || null;
};

export const loginAdmin = async (password) => {
  const response = await fetch("/api/admin/session", {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload?.error || "Falha ao autenticar");
  return payload?.user || null;
};

export const logoutAdmin = async () => {
  await fetch("/api/admin/session", { method: "DELETE", credentials: "same-origin" }).catch(() => null);
};

export const updateAdminPassword = async (password) => {
  const response = await fetch("/api/admin/session", {
    method: "PUT",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload?.error || "Falha ao atualizar a senha");
  return payload?.user || null;
};

export const uid = () => Math.random().toString(36).slice(2, 9);

export const uploadImageSafe = async (file) => {
  const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  const maxMb = 5;
  if (!allowed.includes(file.type)) {
    alert("Apenas imagens JPEG, PNG, WebP ou GIF são permitidas.");
    return null;
  }
  if (file.size > maxMb * 1024 * 1024) {
    alert(`Imagem muito grande. Máximo ${maxMb}MB.`);
    return null;
  }
  return new Promise(async (resolve) => {
    try {
      const supabaseClient = await getSupabase();
      const fileExt = file.name.split(".").pop();
      const fileName = `${uid()}.${fileExt}`;
      const { error } = await supabaseClient.storage.from("images").upload(fileName, file);
      if (error) throw error;
      const {
        data: { publicUrl },
      } = supabaseClient.storage.from("images").getPublicUrl(fileName);
      resolve(publicUrl);
    } catch (error) {
      console.warn("Storage indisponível ou sem permissão. Usando fallback Base64.", error);
      const reader = new FileReader();
      reader.onload = (event) => resolve(event.target.result);
      reader.readAsDataURL(file);
    }
  });
};

export const hashSecret = async (value) => {
  const normalized = String(value || "").trim();
  if (!normalized) return "";
  if (window.crypto?.subtle) {
    const bytes = new TextEncoder().encode(normalized);
    const buffer = await window.crypto.subtle.digest("SHA-256", bytes);
    return Array.from(new Uint8Array(buffer))
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");
  }
  return normalized;
};

export const normalizeStoredUser = async (user) => {
  const safeUser = { ...user };
  const basePerms = safeUser.id === "u_admin" ? FULL_PERMS : EMPTY_PERMS;
  safeUser.perms = Object.fromEntries(
    Object.entries(basePerms).map(([section, actions]) => [
      section,
      {
        ...actions,
        ...(safeUser.perms?.[section] || {}),
      },
    ]),
  );
  if (!safeUser.passwordHash && safeUser.password) {
    safeUser.passwordHash = await hashSecret(safeUser.password);
  }
  delete safeUser.password;
  return safeUser;
};

export const secureUsersForStorage = async (users) => Promise.all((users || []).map(normalizeStoredUser));

export const verifyPassword = async (user, password) => {
  if (!password) return false;
  if (user?.passwordHash) return user.passwordHash === (await hashSecret(password));
  if (user?.password) return user.password === password;
  return false;
};

export const isStrongPassword = (password) => {
  const value = String(password || "");
  return value.length >= 8 && /[A-Za-z]/.test(value) && /\d/.test(value);
};

export const readJsonStorage = (key, fallback) => {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

export const writeJsonStorage = (key, value) => {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {}
};

export const getLoginGuardState = () => readJsonStorage(ADMIN_LOGIN_GUARD_KEY, { attempts: 0, lockedUntil: 0 });

export const clearLoginGuardState = () =>
  writeJsonStorage(ADMIN_LOGIN_GUARD_KEY, { attempts: 0, lockedUntil: 0 });

export const registerLoginFailure = () => {
  const state = getLoginGuardState();
  const nextAttempts = (state.attempts || 0) + 1;
  const lockedUntil = nextAttempts >= ADMIN_LOGIN_MAX_ATTEMPTS ? Date.now() + ADMIN_LOGIN_LOCK_MS : 0;
  writeJsonStorage(ADMIN_LOGIN_GUARD_KEY, { attempts: lockedUntil ? 0 : nextAttempts, lockedUntil });
  return { attempts: nextAttempts, lockedUntil };
};

export const costPerApp = (product) => {
  const cost = parseFloat(product?.cost);
  const yieldApplications = parseFloat(product?.yieldApplications);
  if (!cost || !yieldApplications || yieldApplications === 0) return null;
  return cost / yieldApplications;
};

export const fmtCurrency = (value) => (value != null ? `R$ ${value.toFixed(2).replace(".", ",")}` : "—");

export const sortByName = (list) =>
  [...list].sort((a, b) => a.name.localeCompare(b.name, "pt-BR", { sensitivity: "base" }));

export const isActive = (product) => product?.active !== false;

export const getAffectedProtocols = (product, protocols) =>
  protocols.filter(
    (protocol) =>
      protocol.steps.some((step) => step.productId === product.id) ||
      protocol.homeUse?.morning?.some((item) => item.productId === product.id) ||
      protocol.homeUse?.night?.some((item) => item.productId === product.id) ||
      protocol.professionalKitId === product.id ||
      protocol.homeKitId === product.id,
  );
