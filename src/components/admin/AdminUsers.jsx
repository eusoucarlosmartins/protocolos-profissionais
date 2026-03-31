import { useState } from "react";
import { B, EMPTY_PERMS, PERM_KEYS } from "../../lib/app-constants";
import { hashSecret, isStrongPassword, isValidEmail } from "../../lib/app-services";

const PERM_LABELS = {
  dashboard: { label: "Dashboard", icon: "DB" },
  products: { label: "Produtos", icon: "PR" },
  protocols: { label: "Protocolos", icon: "PT" },
  categories: { label: "Categorias", icon: "CT" },
  indications: { label: "Indicacoes", icon: "IN" },
  phases: { label: "Fases", icon: "FA" },
  alerts: { label: "Alertas", icon: "AL" },
  settings: { label: "Configuracoes", icon: "CF" },
  marketing: { label: "Marketing", icon: "MK" },
  users: { label: "Usuarios", icon: "US" },
};

const ACTION_LABELS = { view: "Ver", edit: "Editar", delete: "Excluir", publish: "Publicar" };

export const AdminUsers = ({ users, saveUsers, loggedUser, Btn, Field, SectionTitle, uid }) => {
  const EMPTY_USER = { id: "", name: "", email: "", password: "", passwordHash: "", perms: EMPTY_PERMS };
  const [editing, setEditing] = useState(null);
  const [formState, setFormState] = useState(null);

  const startEdit = (user) => {
    const clone = JSON.parse(JSON.stringify(user));
    setFormState({ ...clone, password: "" });
    setEditing(user.id || "new");
  };

  const startNew = () => {
    startEdit({ ...EMPTY_USER, id: uid() });
  };

  const cancel = () => {
    setEditing(null);
    setFormState(null);
  };

  const doSave = async () => {
    if (!formState.name.trim()) return alert("Nome obrigatorio");
    if (!formState.email.trim()) return alert("E-mail obrigatorio");
    if (!isValidEmail(formState.email)) return alert("Informe um e-mail valido");

    const isNew = !users.find((user) => user.id === formState.id);
    const nextPassword = formState.password.trim();
    const hasExistingPassword = !!formState.passwordHash;
    const normalizedEmail = formState.email.trim().toLowerCase();

    if (users.find((user) => user.id !== formState.id && String(user.email || "").trim().toLowerCase() === normalizedEmail)) {
      return alert("Este e-mail ja esta em uso por outro usuario.");
    }

    if (!nextPassword && !hasExistingPassword) return alert("Senha obrigatoria");
    if (nextPassword && !isStrongPassword(nextPassword)) {
      return alert("Use pelo menos 8 caracteres, com letras e numeros.");
    }

    let passwordHash = formState.passwordHash || "";
    if (nextPassword) {
      passwordHash = await hashSecret(nextPassword);
      if (users.find((user) => user.id !== formState.id && user.passwordHash === passwordHash)) {
        return alert("Esta senha ja esta em uso por outro usuario.");
      }
    }

    const payload = { ...formState, email: normalizedEmail, passwordHash };
    delete payload.password;
    saveUsers(isNew ? [...users, payload] : users.map((user) => (user.id === formState.id ? payload : user)));
    cancel();
  };

  const doDelete = (id) => {
    if (id === loggedUser.id) return alert("Voce nao pode excluir seu proprio acesso.");
    if (window.confirm("Excluir este usuario?")) {
      saveUsers(users.filter((user) => user.id !== id));
    }
  };

  const togglePerm = (section, action) => {
    setFormState((prev) => ({
      ...prev,
      perms: {
        ...prev.perms,
        [section]: { ...prev.perms[section], [action]: !prev.perms[section][action] },
      },
    }));
  };

  const toggleAllSection = (section) => {
    const actions = PERM_KEYS[section];
    const allOn = actions.every((action) => formState.perms[section][action]);
    setFormState((prev) => ({
      ...prev,
      perms: {
        ...prev.perms,
        [section]: Object.fromEntries(actions.map((action) => [action, !allOn])),
      },
    }));
  };

  if (editing !== null && formState) {
    return (
      <div style={{ maxWidth: 700 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
          <button
            onClick={cancel}
            style={{
              background: "none",
              border: "none",
              color: B.purple,
              fontWeight: 700,
              cursor: "pointer",
              fontSize: 14,
              fontFamily: "inherit",
            }}
          >
            Voltar
          </button>
          <h2 style={{ margin: 0, color: B.purpleDark, fontSize: 20, fontFamily: "Georgia, serif" }}>
            {editing === "new" ? "Novo Usuario" : "Editar Usuario"}
          </h2>
        </div>

        <div style={{ background: B.white, borderRadius: 12, border: `1px solid ${B.border}`, padding: 24, marginBottom: 16 }}>
          <SectionTitle>Identificacao</SectionTitle>
          <Field label="Nome *" value={formState.name} onChange={(value) => setFormState({ ...formState, name: value })} placeholder="Ex: Ana Lima" />
          <Field label="E-mail *" value={formState.email || ""} onChange={(value) => setFormState({ ...formState, email: value })} type="email" placeholder="Ex: ana@empresa.com.br" note="Esse e-mail sera usado no login do admin." />
          <Field
            label={`Senha de acesso ${formState.passwordHash ? "(opcional)" : "*"}`}
            value={formState.password}
            onChange={(value) => setFormState({ ...formState, password: value })}
            type="password"
            placeholder={formState.passwordHash ? "Preencha apenas para trocar a senha" : "Minimo 8 caracteres"}
            note={formState.passwordHash ? "Deixe em branco para manter a senha atual." : "Use ao menos 8 caracteres, com letras e numeros."}
          />
        </div>

        <div style={{ background: B.white, borderRadius: 12, border: `1px solid ${B.border}`, padding: 24, marginBottom: 24 }}>
          <SectionTitle>Permissoes</SectionTitle>
          <p style={{ margin: "0 0 16px", fontSize: 13, color: B.muted }}>
            Defina o que este usuario pode visualizar, editar ou excluir em cada area.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {Object.entries(PERM_KEYS).map(([section, actions]) => {
              const allOn = actions.every((action) => formState.perms[section]?.[action]);
              return (
                <div
                  key={section}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 0,
                    padding: "10px 14px",
                    borderRadius: 9,
                    background: allOn ? B.purpleLight : B.cream,
                    border: `1px solid ${allOn ? B.purple : B.border}`,
                  }}
                >
                  <div
                    style={{ width: 150, display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}
                    onClick={() => toggleAllSection(section)}
                  >
                    <span style={{ fontSize: 12, fontWeight: 700 }}>{PERM_LABELS[section].icon}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: allOn ? B.purple : B.text }}>
                      {PERM_LABELS[section].label}
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {actions.map((action) => (
                      <label
                        key={action}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 5,
                          cursor: "pointer",
                          padding: "4px 10px",
                          borderRadius: 6,
                          background: formState.perms[section]?.[action] ? B.purple : "#fff",
                          border: `1px solid ${formState.perms[section]?.[action] ? B.purple : B.border}`,
                          userSelect: "none",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={!!formState.perms[section]?.[action]}
                          onChange={() => togglePerm(section, action)}
                          style={{ display: "none" }}
                        />
                        <span
                          style={{
                            fontSize: 12,
                            fontWeight: 700,
                            color: formState.perms[section]?.[action] ? "#fff" : B.muted,
                          }}
                        >
                          {ACTION_LABELS[action] || action}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <Btn onClick={doSave} sx={{ padding: "12px 28px" }}>Salvar usuario</Btn>
          <Btn variant="ghost" onClick={cancel}>Cancelar</Btn>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h2 style={{ margin: 0, color: B.purpleDark, fontSize: 22, fontFamily: "Georgia, serif" }}>
          Usuarios ({users.length})
        </h2>
        <Btn onClick={startNew}>+ Novo Usuario</Btn>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {users.map((user) => (
          <div
            key={user.id}
            style={{
              background: B.white,
              borderRadius: 12,
              border: `1px solid ${B.border}`,
              padding: "16px 20px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: B.text, marginBottom: 4 }}>
                {user.name}
                {user.id === loggedUser.id && (
                  <span
                    style={{
                      background: B.gold,
                      color: "#fff",
                      fontSize: 10,
                      fontWeight: 700,
                      padding: "2px 8px",
                      borderRadius: 20,
                      marginLeft: 6,
                    }}
                  >
                    VOCE
                  </span>
                )}
              </div>
              <div style={{ fontSize: 12, color: B.muted, marginBottom: 8 }}>{user.email || "Sem e-mail cadastrado"}</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {Object.entries(user.perms || {})
                  .filter(([, values]) => Object.values(values).some(Boolean))
                  .map(([key]) => (
                    <span
                      key={key}
                      style={{
                        background: B.purpleLight,
                        color: B.purple,
                        fontSize: 11,
                        fontWeight: 700,
                        padding: "2px 8px",
                        borderRadius: 20,
                      }}
                    >
                      {PERM_LABELS[key]?.label}
                    </span>
                  ))}
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <Btn size="sm" variant="secondary" onClick={() => startEdit(user)}>Editar</Btn>
              {user.id !== loggedUser.id && <Btn size="sm" variant="danger" onClick={() => doDelete(user.id)}>Excluir</Btn>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
