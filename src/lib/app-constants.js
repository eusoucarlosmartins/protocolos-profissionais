export const RESPONSIVE_CSS = `
  .rp-hero { padding: 52px 24px 44px !important; }
  .rp-hero h1 { font-size: 30px !important; }
  .rp-grid-proto { grid-template-columns: repeat(auto-fill, minmax(310px, 1fr)) !important; }
  .rp-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
  .rp-grid-home { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .rp-nav { display: flex; gap: 4px; }
  .rp-hero-product { display: flex; gap: 32px; align-items: flex-start; flex-wrap: wrap; }
  .rp-pad { padding: 36px 24px !important; }
  .rp-pad-inner { padding: 28px !important; }
  .rp-tooltip { width: 320px !important; }
  .print-only { display: none; }
  .avoid-break { page-break-inside: avoid; break-inside: avoid; }
  
  @media (max-width: 640px) {
    .rp-hero { padding: 32px 16px 28px !important; }
    .rp-hero h1 { font-size: 22px !important; }
    .rp-grid-proto { grid-template-columns: 1fr !important; }
    .rp-grid-2 { grid-template-columns: 1fr !important; }
    .rp-grid-home { grid-template-columns: 1fr !important; }
    .rp-nav { display: none; }
    .rp-nav-open { display: flex; flex-direction: column; position: fixed; top: 58px; right: 0; background: #2C1F40; padding: 12px; gap: 6px; z-index: 300; border-radius: 0 0 0 12px; }
    .rp-hero-product { flex-direction: column !important; gap: 16px !important; }
    .rp-pad { padding: 16px !important; }
    .rp-pad-inner { padding: 16px !important; }
    .rp-tooltip { width: calc(100vw - 32px) !important; max-width: 340px !important; }
    .rp-card-pad { padding: 16px !important; }
    .rp-step-gap { padding-bottom: 14px !important; }
    .rp-bkbar { padding: 8px 14px !important; }
    .rp-bkbar button { font-size: 13px !important; }
    .rp-cost-summary { padding: 16px 18px !important; }
    .rp-cost-total { flex-direction: column !important; gap: 4px !important; text-align: center !important; }
    .rp-cost-total div:last-child { font-size: 22px !important; }
    .rp-admin-tabs { flex-wrap: wrap !important; }
    .rp-admin-tab { font-size: 12px !important; padding: 7px 10px !important; }
    .rp-section-inner { padding: 16px 14px !important; }
    .rp-proto-meta { flex-direction: column !important; gap: 6px !important; align-items: flex-start !important; }
  }
  @media print {
    .no-print { display: none !important; }
    .print-only { display: block !important; }
    body { background: white !important; }
    a { text-decoration: none !important; color: inherit !important; }
    .rp-bkbar { display: none !important; }
    .avoid-break { page-break-inside: avoid !important; break-inside: avoid !important; display: block; }
  }
`;

export const B = {
  purple: "#5E3D8F",
  purpleDark: "#2C1F40",
  purpleLight: "#EDE5F5",
  purpleMid: "#8B6AB0",
  gold: "#C8A96E",
  goldLight: "#FBF5E8",
  cream: "#F7F4F0",
  white: "#FFFFFF",
  text: "#1A1A2E",
  muted: "#6B7280",
  border: "#E2D9F3",
  green: "#1E7E46",
  greenLight: "#E8F5E9",
  red: "#C0392B",
  redLight: "#FDECEA",
  blue: "#1A56DB",
  blueLight: "#EBF5FF",
};

export const INIT_BRAND = {
  companyName: "Extratos da Terra",
  logoUrl: "",
  colorMain: "#5E3D8F",
  colorAccent: "#C8A96E",
  showCalculator: false,
};

export const INIT_INDICATIONS = [
  { id: "clareamento", label: "Clareamento" },
  { id: "acne", label: "Acne" },
  { id: "antienvelhecimento", label: "Antienvelhecimento" },
  { id: "hidratacao", label: "Hidratação" },
  { id: "lifting", label: "Lifting" },
  { id: "relaxamento", label: "Relaxamento" },
  { id: "rejuvenescimento", label: "Rejuvenescimento" },
  { id: "oleosidade", label: "Oleosidade" },
  { id: "estrias", label: "Estrias" },
  { id: "celulite", label: "Celulite" },
];

export const INIT_CATEGORIES = [
  { id: "facial", label: "Facial" },
  { id: "corporal", label: "Corporal" },
  { id: "capilar", label: "Capilar" },
];

export const INIT_PHASES = [
  { id: "higienizacao", label: "Higienização" },
  { id: "esfoliacao", label: "Esfoliação Química" },
  { id: "eletroterapia", label: "Eletroterapia" },
  { id: "clareamento", label: "Clareamento" },
  { id: "mascara", label: "Máscara" },
  { id: "regeneracao", label: "Regeneração" },
  { id: "protecao", label: "Proteção" },
];

export const PERM_KEYS = {
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

export const FULL_PERMS = Object.fromEntries(
  Object.entries(PERM_KEYS).map(([key, actions]) => [key, Object.fromEntries(actions.map((action) => [action, true]))]),
);

export const EMPTY_PERMS = Object.fromEntries(
  Object.entries(PERM_KEYS).map(([key, actions]) => [key, Object.fromEntries(actions.map((action) => [action, false]))]),
);

export const hasPerm = (user, section, action) => !!user?.perms?.[section]?.[action];

export const USERS_KEY = "edt_users_v10";
export const BRAND_KEY = "edt_brand_v10";
export const PRODUCTS_KEY = "edt_products_v10";
export const PROTOCOLS_KEY = "edt_protocols_v10";
export const INDICATIONS_KEY = "edt_indications_v10";
export const CATEGORIES_KEY = "edt_categories_v10";
export const PHASES_KEY = "edt_phases_v10";
export const MARKETING_KEY = "edt_marketing_v10";
export const VIEWS_KEY = "edt_views_v10";
export const ADMIN_LOGIN_GUARD_KEY = "edt_admin_login_guard_v1";
export const ADMIN_LOGIN_MAX_ATTEMPTS = 5;
export const ADMIN_LOGIN_LOCK_MS = 5 * 60 * 1000;

export const INIT_USERS = [
  {
    id: "u_admin",
    name: "Admin",
    email: "admin@protocolo.local",
    passwordHash: "c34e5438ee9a41a666e0a07824cdb5c955f100aead223eb951eaefebb34e0921",
    perms: FULL_PERMS,
  },
];

export const INIT_MARKETING = {
  banners: [],
  notice: { active: false, text: "", bgColor: "#5E3D8F", textColor: "#ffffff" },
  campaign: { active: false, protocolId: "", title: "", subtitle: "" },
};

export const EMPTY_PRODUCT = {
  id: "",
  code: "",
  name: "",
  categories: ["facial"],
  uso: ["profissional"],
  productTypes: ["protocol"],
  active: true,
  image: "",
  mainFunction: "",
  benefits: "",
  description: "",
  actives: "",
  differentials: "",
  howToUse: "",
  indications: "",
  contra: "",
  size: "",
  yieldApplications: "",
  yieldGramsPerUse: "",
  cost: "",
  anvisa: "",
  faq: "",
  composition: "",
  homeUseNote: "",
  siteUrl: "",
  metaDescription: "",
  keywords: "",
  badge: "",
};

export const PRODUCT_TYPE_OPTIONS = [
  { id: "protocol", label: "Produto de Protocolo" },
  { id: "skincare", label: "Produto de Skincare" },
  { id: "kit_professional", label: "Kit Profissional" },
  { id: "kit_homecare", label: "Kit Home Care" },
];

export const INIT_PRODUCTS = [
  {
    code: "PROD-001",
    name: "Advanced Detox Creme de Massagem 700g - Profissional",
    uso: ["profissional"],
    categories: ["corporal"],
    mainFunction: "Ação detox, eliminando toxinas e líquidos em excesso.",
    description: "Creme de massagem corporal com ação detox e anticelulítica.",
    active: true,
    cost: "190.50",
    yieldApplications: "70",
    id: "p_001",
  },
];

export const INIT_PROTOCOLS = [
  {
    id: "prot1",
    code: "PROTO-001",
    name: "Peeling de Diamante – Clareamento e Uniformização",
    description:
      "Protocolo facial completo associado ao peeling de diamante para auxiliar no clareamento e uniformização da pele, ideal para manchas e tom irregular.",
    concerns: ["clareamento"],
    category: "facial",
    frequency: "1 sessão a cada 15 dias",
    associations: "Peeling de diamante",
    published: true,
    youtubeUrl: "",
    steps: [],
    homeUse: { morning: [], night: [] },
  },
];
