import { useEffect, useState } from "react";
import { B } from "../../lib/app-constants";
import {
  clearLoginGuardState,
  getLoginGuardState,
  isStrongPassword,
  loginAdmin,
  registerLoginFailure,
} from "../../lib/app-services";

export const AdminLogin = ({ brand, navigate, setLoggedUser, Logo, Field, Btn }) => {
  const [pwd, setPwd] = useState("");
  const [err, setErr] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [lockRemainingMs, setLockRemainingMs] = useState(() =>
    Math.max(0, (getLoginGuardState().lockedUntil || 0) - Date.now())
  );

  useEffect(() => {
    const timer = window.setInterval(() => {
      setLockRemainingMs(Math.max(0, (getLoginGuardState().lockedUntil || 0) - Date.now()));
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  const tryLogin = async () => {
    if (submitting || lockRemainingMs > 0) return;
    setSubmitting(true);
    try {
      const user = await loginAdmin(pwd);
      clearLoginGuardState();
      setLoggedUser(user);
      setPwd("");
      navigate("/admin");
    } catch {
      const state = registerLoginFailure();
      setLockRemainingMs(Math.max(0, (state.lockedUntil || 0) - Date.now()));
      setErr(true);
      setPwd("");
      setTimeout(() => setErr(false), 2500);
    }
    setSubmitting(false);
  };

  const lockMinutes = Math.ceil(lockRemainingMs / 60000);

  return (
    <div style={{ background: B.cream, flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div
        style={{
          background: B.white,
          borderRadius: 18,
          padding: "44px 40px",
          width: 380,
          boxShadow: "0 8px 50px rgba(44,31,64,0.12)",
          border: `1px solid ${B.border}`,
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
            <Logo brand={brand} size={56} />
          </div>
          <h2 style={{ margin: "0 0 6px", color: B.purpleDark, fontSize: 22, fontFamily: "Georgia, serif" }}>
            Area Administrativa
          </h2>
          <p style={{ color: B.muted, fontSize: 14, margin: 0 }}>Acesso restrito a equipe interna</p>
        </div>
        <Field
          label="Senha"
          value={pwd}
          onChange={setPwd}
          type="password"
          placeholder="Digite sua senha de acesso"
        />
        {err && (
          <div
            style={{
              background: B.redLight,
              color: B.red,
              padding: "9px 14px",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              marginBottom: 14,
            }}
          >
            Senha incorreta
          </div>
        )}
        {lockRemainingMs > 0 && (
          <div
            style={{
              background: B.goldLight,
              color: "#7A5C1E",
              padding: "9px 14px",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              marginBottom: 14,
            }}
          >
            Muitas tentativas. Tente novamente em cerca de {lockMinutes} min.
          </div>
        )}
        <Btn
          onClick={tryLogin}
          disabled={submitting || lockRemainingMs > 0}
          sx={{ width: "100%", padding: "12px 0", borderRadius: 10, fontSize: 15 }}
        >
          {submitting ? "Verificando..." : "Entrar"}
        </Btn>
        <button
          onClick={() => navigate("/")}
          style={{
            width: "100%",
            marginTop: 12,
            background: "none",
            border: "none",
            color: B.muted,
            fontSize: 13,
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          Voltar ao site
        </button>
      </div>
    </div>
  );
};

export const AdminPasswordReset = ({ brand, onSubmit, onLogout, Logo, Field, Btn }) => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (submitting) return;
    if (!isStrongPassword(password)) {
      setError("Use pelo menos 8 caracteres, com letras e numeros.");
      return;
    }
    if (password !== confirmPassword) {
      setError("As senhas nao coincidem.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await onSubmit(password);
      setPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err?.message || "Nao foi possivel atualizar a senha.");
    }
    setSubmitting(false);
  };

  return (
    <div
      style={{ background: B.cream, flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}
    >
      <div
        style={{
          background: B.white,
          borderRadius: 18,
          padding: "44px 40px",
          width: 420,
          boxShadow: "0 8px 50px rgba(44,31,64,0.12)",
          border: `1px solid ${B.border}`,
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
            <Logo brand={brand} size={56} />
          </div>
          <h2 style={{ margin: "0 0 8px", color: B.purpleDark, fontSize: 22, fontFamily: "Georgia, serif" }}>
            Defina sua nova senha
          </h2>
          <p style={{ color: B.muted, fontSize: 14, margin: 0, lineHeight: 1.5 }}>
            Voce entrou com uma senha temporaria. Antes de continuar no painel, crie uma senha definitiva.
          </p>
        </div>
        <Field
          label="Nova senha"
          value={password}
          onChange={setPassword}
          type="password"
          placeholder="Minimo 8 caracteres"
          note="Use letras e numeros."
        />
        <Field
          label="Confirmar nova senha"
          value={confirmPassword}
          onChange={setConfirmPassword}
          type="password"
          placeholder="Repita a nova senha"
        />
        {error && (
          <div
            style={{
              background: B.redLight,
              color: B.red,
              padding: "9px 14px",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              marginBottom: 14,
            }}
          >
            {error}
          </div>
        )}
        <Btn onClick={handleSubmit} disabled={submitting} sx={{ width: "100%", padding: "12px 0", borderRadius: 10, fontSize: 15 }}>
          {submitting ? "Atualizando..." : "Salvar nova senha"}
        </Btn>
        <button
          onClick={onLogout}
          style={{
            width: "100%",
            marginTop: 12,
            background: "none",
            border: "none",
            color: B.muted,
            fontSize: 13,
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          Sair
        </button>
      </div>
    </div>
  );
};
