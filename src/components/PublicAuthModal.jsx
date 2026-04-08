import { useState } from "react";
import { B } from "../lib/app-constants";
import { signInPublic, signUpPublic, isValidEmail } from "../lib/app-services";

export const PublicAuthModal = ({ open, onClose }) => {
  const [tab, setTab] = useState("login"); // "login" | "signup"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  if (!open) return null;

  const reset = () => { setEmail(""); setPassword(""); setError(""); setSuccess(""); };

  const handleTabChange = (t) => { setTab(t); reset(); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!isValidEmail(email)) { setError("Email inválido."); return; }
    if (password.length < 6) { setError("Senha deve ter pelo menos 6 caracteres."); return; }
    setLoading(true);
    try {
      if (tab === "login") {
        await signInPublic({ email, password });
        onClose();
      } else {
        await signUpPublic({ email, password });
        setSuccess("Conta criada! Verifique seu email para confirmar o cadastro.");
        setEmail(""); setPassword("");
      }
    } catch (err) {
      const msg = err.message || "";
      if (msg.includes("Invalid login credentials")) setError("Email ou senha incorretos.");
      else if (msg.includes("User already registered")) setError("Este email já possui uma conta. Faça login.");
      else if (msg.includes("Email not confirmed")) setError("Confirme seu email antes de entrar.");
      else setError(msg || "Ocorreu um erro. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const inpSt = {
    width: "100%", padding: "10px 12px", border: `1.5px solid ${B.border}`,
    borderRadius: 8, fontSize: 14, outline: "none", boxSizing: "border-box",
    fontFamily: "inherit", background: B.white, color: B.text, marginBottom: 12,
  };

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ background: B.white, borderRadius: 16, padding: "32px 28px", maxWidth: 400, width: "100%", boxShadow: "0 24px 60px rgba(44,31,64,0.18)" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: B.purpleDark, fontFamily: "Georgia, serif" }}>
            {tab === "login" ? "Entrar" : "Criar conta"}
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: B.muted, lineHeight: 1 }}>×</button>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", background: B.cream, borderRadius: 10, padding: 4, marginBottom: 24, gap: 4 }}>
          {["login", "signup"].map((t) => (
            <button
              key={t}
              onClick={() => handleTabChange(t)}
              style={{
                flex: 1, padding: "8px 0", borderRadius: 8, border: "none", fontWeight: 700, fontSize: 13,
                cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s",
                background: tab === t ? B.white : "transparent",
                color: tab === t ? B.purple : B.muted,
                boxShadow: tab === t ? "0 1px 4px rgba(44,31,64,0.1)" : "none",
              }}
            >
              {t === "login" ? "Entrar" : "Criar conta"}
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: B.muted, marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.06em" }}>Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" style={inpSt} autoComplete="email" />

          <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: B.muted, marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.06em" }}>Senha</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={tab === "signup" ? "Mínimo 6 caracteres" : "••••••••"} style={inpSt} autoComplete={tab === "login" ? "current-password" : "new-password"} />

          {error && (
            <div style={{ background: B.redLight, color: B.red, fontSize: 13, fontWeight: 600, padding: "10px 14px", borderRadius: 8, marginBottom: 14 }}>{error}</div>
          )}
          {success && (
            <div style={{ background: B.greenLight, color: B.green, fontSize: 13, fontWeight: 600, padding: "10px 14px", borderRadius: 8, marginBottom: 14 }}>{success}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%", padding: "12px 0", borderRadius: 8, border: "none",
              background: loading ? B.muted : B.purple, color: B.white,
              fontWeight: 800, fontSize: 14, cursor: loading ? "wait" : "pointer",
              fontFamily: "inherit", marginTop: 4,
            }}
          >
            {loading ? "Aguarde..." : tab === "login" ? "Entrar" : "Criar conta"}
          </button>
        </form>

        {tab === "login" && (
          <p style={{ fontSize: 12, color: B.muted, textAlign: "center", marginTop: 16 }}>
            Não tem conta?{" "}
            <button onClick={() => handleTabChange("signup")} style={{ background: "none", border: "none", color: B.purple, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", fontSize: 12 }}>
              Criar conta grátis
            </button>
          </p>
        )}
      </div>
    </div>
  );
};
