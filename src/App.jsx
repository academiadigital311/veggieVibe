import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Heart, X, Leaf, Egg, Flame, Clock, ChefHat, Search, Sparkles,
  Lock, Crown, LogIn, LogOut, Globe, CalendarDays, ShoppingCart,
  UtensilsCrossed, Plus, Trash2, Check, RotateCcw, Send, Bot, User,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { supabase, supabaseConfigured } from "./supabaseClient";
import { useRecetas, PREMIUM_IDS } from "./data/recetas";
import { loadPaddle, PADDLE_PRICE_IDS } from "./paddleClient";

const C = {
  bg: "#F3FAF1", card: "#FFFFFF", ink: "#1E2E24", inkSoft: "#5E7468",
  line: "#E1F0DD", heroFrom: "#0E6B4E", heroTo: "#5BBE7E",
  vegetariana: "#2E9E93", vegetarianaBg: "#E3F6F2", vegetarianaDark: "#1F6F66",
  vegana: "#4CAF6E", veganaBg: "#E7F6E9", veganaDark: "#357A4B",
  coral: "#FF6F59", coralDark: "#D6492F", sun: "#FFC960",
};

const DIET_STYLE = {
  vegetariana: { color: C.vegetariana, dark: C.vegetarianaDark, bg: C.vegetarianaBg, Icon: Egg },
  vegana: { color: C.vegana, dark: C.veganaDark, bg: C.veganaBg, Icon: Leaf },
};

const MEAL_EMOJI = {
  desayuno: "☀️",
  almuerzo: "🍽️",
  cena: "🌙",
  snack: "🍪",
};

const norm = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

function Llamas({ nivel }) {
  return (
    <span style={{ display: "inline-flex", gap: 2 }}>
      {[1, 2, 3].map((n) => (
        <Flame key={n} size={13} color={n <= nivel ? C.coral : C.line} fill={n <= nivel ? C.coral : "none"} strokeWidth={1.5} />
      ))}
    </span>
  );
}

function DietBadge({ tipo, small, t }) {
  const style = DIET_STYLE[tipo];
  const Icon = style.Icon;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: style.bg, color: style.dark, padding: small ? "3px 9px" : "4px 11px", borderRadius: 999, fontSize: small ? 11 : 12.5, fontWeight: 700 }}>
      <Icon size={small ? 11 : 13} strokeWidth={2.4} />
      {t(`diet.${tipo}`)}
    </span>
  );
}

function CardHeader({ receta }) {
  const style = DIET_STYLE[receta.tipo];
  if (receta.imagen) {
    return <img src={receta.imagen} alt={receta.nombre} className="rv-card-img" />;
  }
  return (
    <div className="rv-illus" style={{ background: `linear-gradient(135deg, ${style.color}, ${style.dark})` }}>
      <span className="rv-illus-blob" style={{ top: -30, left: -20 }} />
      <span className="rv-illus-blob" style={{ bottom: -36, right: -24, width: 110, height: 110 }} />
      <span className="rv-illus-emoji">{receta.emoji}</span>
    </div>
  );
}

function RecipeCard({ receta, isFav, isPremiumUser, onToggleFav, onOpen, t }) {
  const bloqueada = PREMIUM_IDS.has(receta.id) && !isPremiumUser;
  return (
    <div className="rv-card" onClick={() => onOpen(receta)}>
      <div style={{ position: "relative" }}>
        <CardHeader receta={receta} />
        {bloqueada && (
          <div className="rv-card-lock-overlay">
            <span className="rv-card-lock-badge"><Crown size={12} /> {t("premium.badge")}</span>
          </div>
        )}
        <span className="rv-card-badge-left"><DietBadge tipo={receta.tipo} small t={t} /></span>
        <span className="rv-card-badge-right">{t(`difficulty.${receta.dificultad}`)}</span>
        <button onClick={(e) => { e.stopPropagation(); onToggleFav(receta.id); }} aria-label={t("modal.saveFavorite")} className="rv-fav-btn" style={{ background: isFav ? C.coral : "rgba(255,255,255,0.92)" }}>
          <Heart size={14} color={isFav ? "#fff" : C.inkSoft} fill={isFav ? "#fff" : "none"} />
        </button>
      </div>
      <div style={{ padding: "14px 16px 16px" }}>
        <h3 className="rv-card-title">{receta.nombre}</h3>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 10 }}>
          <span style={{ fontSize: 12, color: C.inkSoft, display: "inline-flex", alignItems: "center", gap: 4 }}><Clock size={12} /> {receta.tiempo}</span>
          <span style={{ fontSize: 12, color: C.inkSoft }}>{MEAL_EMOJI[receta.comida]} {t(`meal.${receta.comida}`)}</span>
          <Llamas nivel={receta.dificultad} />
        </div>
      </div>
    </div>
  );
}

function RecipeModal({ receta, isFav, isPremiumUser, onToggleFav, onClose, onQuierePremium, onAddToPlan, user, t }) {
  const [showPlanPicker, setShowPlanPicker] = useState(false);
  const [addedMsg, setAddedMsg] = useState("");
  if (!receta) return null;
  const style = DIET_STYLE[receta.tipo];
  const bloqueada = PREMIUM_IDS.has(receta.id) && !isPremiumUser;
  return (
    <div className="rv-modal-overlay" onClick={onClose}>
      <div className="rv-modal" onClick={(e) => e.stopPropagation()}>
        <div style={{ position: "relative" }}>
          <CardHeader receta={receta} />
          <button onClick={onClose} aria-label={t("modal.close")} className="rv-modal-close"><X size={16} color={C.ink} /></button>
        </div>
        <div style={{ padding: "22px 26px 8px" }}>
          <h2 className="rv-modal-title">{receta.nombre}</h2>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginTop: 10 }}>
            <DietBadge tipo={receta.tipo} t={t} />
            <span style={{ fontSize: 13, color: C.inkSoft }}>{MEAL_EMOJI[receta.comida]} {t(`meal.${receta.comida}`)}</span>
            <span style={{ fontSize: 13, color: C.inkSoft, display: "inline-flex", alignItems: "center", gap: 4 }}><Clock size={14} />{receta.tiempo}</span>
            <span style={{ fontSize: 13, color: C.inkSoft, display: "inline-flex", alignItems: "center", gap: 5 }}><Llamas nivel={receta.dificultad} />{t(`difficulty.${receta.dificultad}`)}</span>
            <button onClick={() => onToggleFav(receta.id)} className="rv-save-btn" style={{ background: isFav ? C.coral : "#fff", color: isFav ? "#fff" : C.ink, borderColor: isFav ? C.coral : C.line }}>
              <Heart size={13} fill={isFav ? "#fff" : "none"} /> {isFav ? t("modal.saved") : t("modal.save")}
            </button>
            {!bloqueada && (
              <button onClick={() => user ? setShowPlanPicker(!showPlanPicker) : null} className="rv-save-btn" style={{ borderColor: C.veganaDark, color: C.veganaDark }}>
                <CalendarDays size={13} /> {t("modal.addToPlan")}
              </button>
            )}
          </div>
          {showPlanPicker && (
            <div style={{ marginTop: 12, padding: 12, background: C.veganaBg, borderRadius: 12 }}>
              {addedMsg ? (
                <p style={{ fontSize: 13, fontWeight: 600, color: C.veganaDark, textAlign: "center", margin: 0 }}>{addedMsg}</p>
              ) : (
                <>
                  <p style={{ fontSize: 12, fontWeight: 700, color: C.veganaDark, margin: "0 0 8px" }}>{t("modal.pickDayMeal")}</p>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
                    {DAY_KEYS.map((dk, dayIdx) => (
                      <div key={dk} style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: C.veganaDark, marginBottom: 4, textTransform: "uppercase" }}>{t(`week.${dk}`)}</div>
                        {MEAL_TYPES.map((mt) => (
                          <button key={mt} onClick={() => { onAddToPlan(dayIdx, mt, receta.id); setAddedMsg(t("modal.addedToPlan")); setTimeout(() => { setAddedMsg(""); setShowPlanPicker(false); }, 1500); }} style={{ display: "block", width: "100%", marginBottom: 3, padding: "4px 2px", border: `1px solid ${C.line}`, borderRadius: 6, background: "#fff", fontSize: 10, cursor: "pointer", color: C.ink }}>
                            {MEAL_EMOJI[mt]}
                          </button>
                        ))}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {bloqueada ? (
            <div className="rv-paywall">
              <div className="rv-paywall-icon"><Lock size={22} color="#fff" /></div>
              <h3 style={{ fontFamily: "'Quicksand',sans-serif", fontSize: 19, fontWeight: 700, margin: "14px 0 6px" }}>{t("premium.locked")}</h3>
              <p style={{ fontSize: 14, color: C.inkSoft, lineHeight: 1.55, maxWidth: 380, margin: "0 auto 18px" }}>
                {t("premium.lockedDesc")}
              </p>
              <button className="rv-upgrade-btn" onClick={onQuierePremium}><Crown size={15} /> {t("premium.viewPlans")}</button>
            </div>
          ) : (
            <div style={{ display: "grid", gap: 22, marginTop: 22 }}>
              <div>
                <h3 className="rv-section-label" style={{ color: style.dark }}>{t("modal.ingredients")}</h3>
                <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: 7 }}>
                  {receta.ingredientes.map((ing, i) => (
                    <li key={i} style={{ fontSize: 14.5, color: C.ink, display: "flex", gap: 9, alignItems: "flex-start" }}>
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: style.color, marginTop: 7, flexShrink: 0 }} />{ing}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="rv-section-label" style={{ color: style.dark }}>{t("modal.preparation")}</h3>
                <ol style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: 12 }}>
                  {receta.pasos.map((paso, i) => (
                    <li key={i} style={{ display: "flex", gap: 12, fontSize: 14.5, color: C.ink, lineHeight: 1.5 }}>
                      <span style={{ flexShrink: 0, width: 24, height: 24, borderRadius: "50%", background: style.bg, color: style.dark, fontWeight: 700, fontSize: 12.5, display: "flex", alignItems: "center", justifyContent: "center" }}>{i + 1}</span>
                      <span style={{ paddingTop: 2 }}>{paso}</span>
                    </li>
                  ))}
                </ol>
              </div>
              <div className="rv-tip-box">
                <ChefHat size={20} color={C.coralDark} style={{ flexShrink: 0, marginTop: 1 }} />
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: C.coralDark, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 3 }}>{t("modal.chefTip")}</div>
                  <div style={{ fontSize: 14, color: C.ink, lineHeight: 1.5 }}>{receta.tip}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AuthModal({ onClose, onAuthed, t }) {
  const [modo, setModo] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!supabaseConfigured) {
      setError("Supabase no está configurado. Revisa tu archivo .env");
      return;
    }
    setCargando(true);
    try {
      const authCall = modo === "login"
        ? supabase.auth.signInWithPassword({ email, password })
        : supabase.auth.signUp({ email, password });
      const result = await Promise.race([
        authCall,
        new Promise((_, reject) => setTimeout(() => reject(new Error("Tiempo de espera agotado. Verifica tu conexión.")), 10000)),
      ]);
      setCargando(false);
      if (result.error) { setError(result.error.message); return; }
      onAuthed(result.data.user);
    } catch (err) {
      setCargando(false);
      setError(err.message);
    }
  };

  return (
    <div className="rv-modal-overlay" onClick={onClose}>
      <div className="rv-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 380 }}>
        <div style={{ padding: "26px 26px 24px", position: "relative" }}>
          <button onClick={onClose} className="rv-modal-close" style={{ position: "absolute", top: 14, right: 14 }}><X size={16} color={C.ink} /></button>
          <h2 style={{ fontFamily: "'Quicksand',sans-serif", fontSize: 21, fontWeight: 700, margin: "0 0 4px" }}>
            {modo === "login" ? t("auth.loginTitle") : t("auth.signupTitle")}
          </h2>
          <p style={{ fontSize: 13, color: C.inkSoft, margin: "0 0 18px" }}>{t("auth.description")}</p>
          <button
            onClick={async () => {
              if (!supabaseConfigured) { setError("Supabase no está configurado"); return; }
              const { error: err } = await supabase.auth.signInWithOAuth({
                provider: "google",
                options: { redirectTo: window.location.origin },
              });
              if (err) setError(err.message);
            }}
            style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: "11px 16px", borderRadius: 10, border: `1.5px solid ${C.line}`, background: "#fff", fontSize: 14, fontWeight: 600, color: C.ink, cursor: "pointer", fontFamily: "'Inter',sans-serif" }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 0 0 1 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            {t("auth.google")}
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "14px 0" }}>
            <span style={{ flex: 1, height: 1, background: C.line }} />
            <span style={{ fontSize: 12, color: C.inkSoft, fontWeight: 600 }}>{t("auth.or")}</span>
            <span style={{ flex: 1, height: 1, background: C.line }} />
          </div>
          <form onSubmit={submit} style={{ display: "grid", gap: 10 }}>
            <input type="email" required placeholder={t("auth.email")} value={email} onChange={(e) => setEmail(e.target.value)} className="rv-input" />
            <input type="password" required minLength={6} placeholder={t("auth.password")} value={password} onChange={(e) => setPassword(e.target.value)} className="rv-input" />
            {error && <p style={{ color: C.coralDark, fontSize: 12.5, margin: 0 }}>{error}</p>}
            <button type="submit" disabled={cargando} className="rv-upgrade-btn" style={{ width: "100%" }}>
              {cargando ? t("auth.loading") : modo === "login" ? t("auth.login") : t("auth.signup")}
            </button>
          </form>
          <button onClick={() => setModo(modo === "login" ? "signup" : "login")} style={{ marginTop: 14, background: "none", border: "none", color: C.veganaDark, fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>
            {modo === "login" ? t("auth.switchToSignup") : t("auth.switchToLogin")}
          </button>
        </div>
      </div>
    </div>
  );
}

function PremiumModal({ onClose, isPremiumUser, userPlan, onSuscribirse, cargando, initialTier, t }) {
  const [tier, setTier] = useState(initialTier === "premium" ? "premium" : "chef");
  const [periodo, setPeriodo] = useState("mensual");

  const tiers = {
    premium: {
      beneficios: [t("premium.benefit1"), t("premium.benefit2"), t("premium.benefit3")],
      precios: { mensual: "$3.99", anual: "$24.99" },
      planIds: { mensual: "mensual", anual: "anual" },
    },
    chef: {
      beneficios: [t("premium.benefit1"), t("premium.benefit2"), t("premium.benefit3"), t("premium.benefit4")],
      precios: { mensual: t("premium.chefMonthly"), anual: t("premium.chefAnnual") },
      planIds: { mensual: "chef_mensual", anual: "chef_anual" },
    },
  };
  const sel = tiers[tier];

  return (
    <div className="rv-modal-overlay" onClick={onClose}>
      <div className="rv-modal rv-premium-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
        <button onClick={onClose} className="rv-modal-close" style={{ background: "rgba(255,255,255,0.9)" }}><X size={16} color={C.ink} /></button>
        <div className="rv-premium-hero">
          <Crown size={26} color="#fff" />
          <h2 style={{ fontFamily: "'Quicksand',sans-serif", fontWeight: 700, fontSize: 24, color: "#fff", margin: "10px 0 4px" }}>{t("premium.title")}</h2>
          <p style={{ color: "rgba(255,255,255,0.92)", fontSize: 13.5, margin: 0 }}>{t("premium.subtitle")}</p>
        </div>
        <div style={{ padding: "22px 26px 26px" }}>
          {isPremiumUser ? (
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <p style={{ fontSize: 15, color: C.ink, fontWeight: 600 }}>{t("premium.already")}</p>
              {userPlan !== "chef" && (
                <button className="rv-upgrade-btn" style={{ marginTop: 12 }} onClick={() => { setTier("chef"); }}>
                  <Bot size={15} /> {t("chef.upgrade")}
                </button>
              )}
            </div>
          ) : (
            <>
              <div style={{ display: "flex", gap: 8, marginBottom: 18, justifyContent: "center" }}>
                <button onClick={() => setTier("premium")} className="rv-plan-card" style={{ flex: 1, borderColor: tier === "premium" ? C.veganaDark : C.line, background: tier === "premium" ? C.veganaBg : "#fff", textAlign: "center", padding: "12px" }}>
                  <Crown size={16} color={tier === "premium" ? C.veganaDark : C.inkSoft} />
                  <div style={{ fontSize: 13, fontWeight: 700, marginTop: 4 }}>{t("premium.planPremium")}</div>
                </button>
                <button onClick={() => setTier("chef")} className="rv-plan-card" style={{ flex: 1, borderColor: tier === "chef" ? C.veganaDark : C.line, background: tier === "chef" ? C.veganaBg : "#fff", textAlign: "center", padding: "12px", position: "relative" }}>
                  <span className="rv-plan-badge">{t("premium.chefBadge")}</span>
                  <Bot size={16} color={tier === "chef" ? C.veganaDark : C.inkSoft} />
                  <div style={{ fontSize: 13, fontWeight: 700, marginTop: 4 }}>{t("premium.planChef")}</div>
                </button>
              </div>

              <ul style={{ listStyle: "none", margin: "0 0 18px", padding: 0, display: "grid", gap: 8 }}>
                {sel.beneficios.map((b, i) => (
                  <li key={i} style={{ display: "flex", gap: 10, fontSize: 13.5, color: C.ink }}>✅ {b}</li>
                ))}
              </ul>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 18 }}>
                <button onClick={() => setPeriodo("mensual")} className="rv-plan-card" style={{ borderColor: periodo === "mensual" ? C.veganaDark : C.line, background: periodo === "mensual" ? C.veganaBg : "#fff" }}>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{t("plan.monthly")}</div>
                  <div style={{ fontSize: 21, fontWeight: 700, color: C.veganaDark, fontFamily: "'Quicksand',sans-serif" }}>{sel.precios.mensual}<span style={{ fontSize: 12, color: C.inkSoft, fontWeight: 500 }}> {t("plan.perMonth")}</span></div>
                </button>
                <button onClick={() => setPeriodo("anual")} className="rv-plan-card" style={{ borderColor: periodo === "anual" ? C.veganaDark : C.line, background: periodo === "anual" ? C.veganaBg : "#fff", position: "relative" }}>
                  <span className="rv-plan-badge">{t("plan.save")}</span>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{t("plan.annual")}</div>
                  <div style={{ fontSize: 21, fontWeight: 700, color: C.veganaDark, fontFamily: "'Quicksand',sans-serif" }}>{sel.precios.anual}<span style={{ fontSize: 12, color: C.inkSoft, fontWeight: 500 }}> {t("plan.perYear")}</span></div>
                </button>
              </div>

              <button className="rv-upgrade-btn" style={{ width: "100%" }} disabled={cargando} onClick={() => onSuscribirse(sel.planIds[periodo])}>
                <Crown size={15} /> {cargando ? t("premium.redirecting") : t("premium.subscribe")}
              </button>
              <p style={{ textAlign: "center", fontSize: 11.5, color: C.inkSoft, marginTop: 10 }}>{t("premium.disclaimer")}</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

const DAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
const MEAL_TYPES = ["desayuno", "almuerzo", "cena", "snack"];

function RecipePicker({ recetas, isPremiumUser, onPick, onClose, t }) {
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    const term = norm(q.trim());
    const list = recetas.filter((r) => {
      if (PREMIUM_IDS.has(r.id) && !isPremiumUser) return false;
      if (!term) return true;
      return norm(r.nombre).includes(term) || r.tags.some((tag) => norm(tag).includes(term));
    });
    return list;
  }, [recetas, q, isPremiumUser]);

  return (
    <div className="rv-modal-overlay" onClick={onClose}>
      <div className="rv-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
        <div style={{ padding: "20px 22px 18px", position: "relative" }}>
          <button onClick={onClose} className="rv-modal-close" style={{ position: "absolute", top: 12, right: 12 }}><X size={16} color={C.ink} /></button>
          <h2 style={{ fontFamily: "'Quicksand',sans-serif", fontSize: 19, fontWeight: 700, margin: "0 0 14px" }}>{t("plan.pickRecipe")}</h2>
          <div className="rv-search-box" style={{ marginBottom: 14 }}>
            <Search size={15} color={C.inkSoft} />
            <input type="text" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("plan.searchRecipes")} />
          </div>
          <div style={{ display: "grid", gap: 6, maxHeight: 340, overflowY: "auto" }}>
            {filtered.length === 0 && <p style={{ fontSize: 13, color: C.inkSoft, textAlign: "center", padding: 20 }}>{t("plan.noRecipes")}</p>}
            {filtered.map((r) => {
              const bloqueada = PREMIUM_IDS.has(r.id) && !isPremiumUser;
              return (
                <button key={r.id} onClick={() => !bloqueada && onPick(r)} className="rv-picker-item" style={{ opacity: bloqueada ? 0.5 : 1, cursor: bloqueada ? "not-allowed" : "pointer" }}>
                  {r.imagen ? <img src={r.imagen} alt="" style={{ width: 44, height: 44, borderRadius: 10, objectFit: "cover" }} /> : <span style={{ width: 44, height: 44, borderRadius: 10, background: C.veganaBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>{r.emoji}</span>}
                  <div style={{ flex: 1, textAlign: "left" }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: C.ink }}>{r.nombre}</div>
                    <div style={{ fontSize: 11.5, color: C.inkSoft }}>{MEAL_EMOJI[r.comida]} {t(`meal.${r.comida}`)} · {r.tiempo} · {t(`difficulty.${r.dificultad}`)}</div>
                  </div>
                  {bloqueada && <Lock size={14} color={C.inkSoft} />}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function WeeklyPlan({ planData, recetas, isPremiumUser, onAssign, onRemove, onNeedAuth, user, t }) {
  const [pickerSlot, setPickerSlot] = useState(null);

  const handleAddClick = (dayIdx, mealType) => {
    if (!user) { onNeedAuth(); return; }
    setPickerSlot({ dayIdx, mealType });
  };

  const getReceta = (recetaId) => recetas.find((r) => r.id === recetaId);

  return (
    <div className="rv-plan-section">
      {!user && (
        <div style={{ textAlign: "center", padding: "16px 20px", background: C.veganaBg, borderRadius: 14, marginBottom: 18, fontSize: 13.5, color: C.veganaDark, fontWeight: 600 }}>
          <LogIn size={14} style={{ verticalAlign: -2, marginRight: 6 }} />{t("plan.loginRequired")}
        </div>
      )}
      <div className="rv-week-grid">
        <div className="rv-week-header">
          <div className="rv-week-corner" />
          {DAY_KEYS.map((dk) => (
            <div key={dk} className="rv-week-day-label">{t(`week.${dk}`)}</div>
          ))}
        </div>
        {MEAL_TYPES.map((mt) => (
          <div key={mt} className="rv-week-row">
            <div className="rv-week-meal-label">{MEAL_EMOJI[mt]}<span className="rv-week-meal-text">{t(`meal.${mt}`)}</span></div>
            {DAY_KEYS.map((_, dayIdx) => {
              const entry = planData.find((p) => p.day_index === dayIdx && p.meal_type === mt);
              const receta = entry ? getReceta(entry.receta_id) : null;
              return (
                <div key={dayIdx} className="rv-week-cell">
                  {receta ? (
                    <div className="rv-week-recipe">
                      {receta.imagen && <img src={receta.imagen} alt="" className="rv-week-recipe-img" />}
                      <span className="rv-week-recipe-name">{receta.nombre}</span>
                      <button onClick={() => onRemove(dayIdx, mt)} className="rv-week-remove" aria-label={t("plan.removeRecipe")}><X size={10} /></button>
                    </div>
                  ) : (
                    <button onClick={() => handleAddClick(dayIdx, mt)} className="rv-week-add" aria-label={t("plan.addRecipe")}><Plus size={16} color={C.inkSoft} /></button>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <div className="rv-week-grid-mobile">
        {DAY_KEYS.map((dk, dayIdx) => (
          <div key={dk} className="rv-week-day-card">
            <div className="rv-week-day-card-title">{t(`week.${dk}Full`)}</div>
            <div className="rv-week-day-meals">
              {MEAL_TYPES.map((mt) => {
                const entry = planData.find((p) => p.day_index === dayIdx && p.meal_type === mt);
                const receta = entry ? getReceta(entry.receta_id) : null;
                return (
                  <div key={mt}>
                    <div className="rv-week-day-meal-label">{MEAL_EMOJI[mt]} {t(`meal.${mt}`)}</div>
                    <div className="rv-week-cell">
                      {receta ? (
                        <div className="rv-week-recipe">
                          {receta.imagen && <img src={receta.imagen} alt="" className="rv-week-recipe-img" />}
                          <span className="rv-week-recipe-name">{receta.nombre}</span>
                          <button onClick={() => onRemove(dayIdx, mt)} className="rv-week-remove" aria-label={t("plan.removeRecipe")}><X size={10} /></button>
                        </div>
                      ) : (
                        <button onClick={() => handleAddClick(dayIdx, mt)} className="rv-week-add" aria-label={t("plan.addRecipe")}><Plus size={14} color={C.inkSoft} /></button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {pickerSlot && (
        <RecipePicker
          recetas={recetas}
          isPremiumUser={isPremiumUser}
          t={t}
          onClose={() => setPickerSlot(null)}
          onPick={(r) => { onAssign(pickerSlot.dayIdx, pickerSlot.mealType, r.id); setPickerSlot(null); }}
        />
      )}
    </div>
  );
}

function ShoppingList({ planData, recetas, t }) {
  const [checks, setChecks] = useState(() => {
    try { return JSON.parse(localStorage.getItem("rv-shop-checks") || "{}"); } catch { return {}; }
  });

  const items = useMemo(() => {
    const map = new Map();
    planData.forEach((p) => {
      const receta = recetas.find((r) => r.id === p.receta_id);
      if (!receta) return;
      receta.ingredientes.forEach((ing) => {
        const key = norm(ing);
        if (!map.has(key)) map.set(key, { text: ing, recipes: [] });
        const entry = map.get(key);
        if (!entry.recipes.includes(receta.nombre)) entry.recipes.push(receta.nombre);
      });
    });
    return [...map.entries()].map(([key, val]) => ({ key, ...val }));
  }, [planData, recetas]);

  const toggleCheck = (key) => {
    setChecks((prev) => {
      const next = { ...prev };
      if (next[key]) delete next[key]; else next[key] = true;
      localStorage.setItem("rv-shop-checks", JSON.stringify(next));
      return next;
    });
  };

  const clearChecks = () => {
    setChecks({});
    localStorage.removeItem("rv-shop-checks");
  };

  const checkedCount = items.filter((i) => checks[i.key]).length;

  if (items.length === 0) {
    return (
      <div className="rv-empty" style={{ paddingTop: 40 }}>
        <ShoppingCart size={40} color={C.line} />
        <p style={{ fontSize: 14.5, marginTop: 14 }}>{t("shopping.empty")}</p>
      </div>
    );
  }

  return (
    <div className="rv-shopping-section">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <span style={{ fontSize: 13.5, color: C.inkSoft, fontWeight: 600 }}>
          {t("shopping.checked", { count: checkedCount, total: items.length })}
        </span>
        {checkedCount > 0 && (
          <button onClick={clearChecks} style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12.5, color: C.coralDark, background: "none", border: "none", cursor: "pointer", fontWeight: 700 }}>
            <RotateCcw size={12} /> {t("shopping.clearChecks")}
          </button>
        )}
      </div>
      <div style={{ display: "grid", gap: 4 }}>
        {items.map((item) => {
          const checked = !!checks[item.key];
          return (
            <button key={item.key} onClick={() => toggleCheck(item.key)} className="rv-shop-item" style={{ opacity: checked ? 0.55 : 1 }}>
              <span className="rv-shop-check" style={{ background: checked ? C.vegana : "#fff", borderColor: checked ? C.vegana : C.line }}>
                {checked && <Check size={11} color="#fff" strokeWidth={3} />}
              </span>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: 14, color: C.ink, textDecoration: checked ? "line-through" : "none" }}>{item.text}</span>
                {item.recipes.length > 0 && (
                  <span style={{ display: "block", fontSize: 11, color: C.inkSoft, marginTop: 1 }}>
                    {item.recipes.map((n) => t("shopping.fromRecipe", { name: n })).join(" · ")}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ChefIA({ user, userPlan, onNeedAuth, onNeedUpgrade, t }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatRef = React.useRef(null);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages, loading]);

  if (!user) {
    return (
      <div className="rv-chef-section">
        <div className="rv-chef-gate">
          <Bot size={40} color={C.veganaDark} />
          <h3 style={{ fontFamily: "'Quicksand',sans-serif", fontSize: 20, fontWeight: 700, margin: "12px 0 6px" }}>{t("chef.title")}</h3>
          <p style={{ color: C.inkSoft, fontSize: 14, margin: "0 0 16px" }}>{t("chef.loginRequired")}</p>
          <button className="rv-upgrade-btn" onClick={onNeedAuth}><LogIn size={15} /> {t("nav.login")}</button>
        </div>
      </div>
    );
  }

  if (userPlan !== "chef") {
    return (
      <div className="rv-chef-section">
        <div className="rv-chef-gate">
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: `linear-gradient(135deg, ${C.heroFrom}, ${C.heroTo})`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Bot size={28} color="#fff" />
          </div>
          <h3 style={{ fontFamily: "'Quicksand',sans-serif", fontSize: 20, fontWeight: 700, margin: "12px 0 6px" }}>{t("chef.needChef")}</h3>
          <p style={{ color: C.inkSoft, fontSize: 14, margin: "0 0 6px" }}>{t("chef.needChefDesc")}</p>
          <p style={{ color: C.inkSoft, fontSize: 13, margin: "0 0 16px" }}>{t("premium.chefMonthly")} {t("plan.perMonth")}</p>
          <button className="rv-upgrade-btn" onClick={onNeedUpgrade}><Crown size={15} /> {t("chef.upgrade")}</button>
        </div>
      </div>
    );
  }

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    const newMessages = [...messages, { role: "user", content: text }];
    setMessages(newMessages);
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch("/api/chef-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ message: text, history: messages }),
      });
      const data = await res.json();
      if (data.reply) {
        setMessages([...newMessages, { role: "assistant", content: data.reply }]);
      } else {
        setMessages([...newMessages, { role: "assistant", content: t("chef.error") }]);
      }
    } catch {
      setMessages([...newMessages, { role: "assistant", content: t("chef.error") }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rv-chef-section">
      <div className="rv-chef-chat">
        <div className="rv-chef-messages" ref={chatRef}>
          <div className="rv-chef-msg rv-chef-msg-bot">
            <div className="rv-chef-avatar"><Bot size={16} color="#fff" /></div>
            <div className="rv-chef-bubble">{t("chef.welcome")}</div>
          </div>
          {messages.map((m, i) => (
            <div key={i} className={`rv-chef-msg ${m.role === "user" ? "rv-chef-msg-user" : "rv-chef-msg-bot"}`}>
              <div className="rv-chef-avatar">{m.role === "user" ? <User size={16} color="#fff" /> : <Bot size={16} color="#fff" />}</div>
              <div className="rv-chef-bubble" style={{ whiteSpace: "pre-wrap" }}>{m.content}</div>
            </div>
          ))}
          {loading && (
            <div className="rv-chef-msg rv-chef-msg-bot">
              <div className="rv-chef-avatar"><Bot size={16} color="#fff" /></div>
              <div className="rv-chef-bubble rv-chef-thinking">{t("chef.thinking")}</div>
            </div>
          )}
        </div>
        <form className="rv-chef-input-row" onSubmit={(e) => { e.preventDefault(); sendMessage(); }}>
          <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder={t("chef.placeholder")} className="rv-chef-input" disabled={loading} />
          <button type="submit" className="rv-chef-send" disabled={loading || !input.trim()}><Send size={18} /></button>
        </form>
      </div>
    </div>
  );
}

export default function App() {
  const { t, i18n } = useTranslation();
  const RECETAS = useRecetas();

  const [dieta, setDieta] = useState("todas");
  const [comida, setComida] = useState("todas");
  const [dificultad, setDificultad] = useState(0);
  const [soloFavoritas, setSoloFavoritas] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [seleccionada, setSeleccionada] = useState(null);

  const [user, setUser] = useState(null);
  const [favoritas, setFavoritas] = useState([]);
  const [isPremiumUser, setIsPremiumUser] = useState(false);
  const [userPlan, setUserPlan] = useState("free");
  const [mostrarAuth, setMostrarAuth] = useState(false);
  const [mostrarPremium, setMostrarPremium] = useState(false);
  const [premiumTier, setPremiumTier] = useState(null);
  const [cargandoCheckout, setCargandoCheckout] = useState(false);
  const [vista, setVista] = useState("recetas");
  const [planData, setPlanData] = useState([]);

  const currentLang = i18n.resolvedLanguage || i18n.language;

  useEffect(() => {
    document.documentElement.lang = currentLang;
    document.title = t("hero.title");
  }, [currentLang, t]);

  const toggleLang = () => {
    i18n.changeLanguage(currentLang === "es" ? "en" : "es");
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user ?? null));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const premiumParam = params.get("premium");
    if (premiumParam === "premium" || premiumParam === "chef") {
      setPremiumTier(premiumParam);
      setMostrarPremium(true);
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  const cargarDatosUsuario = useCallback(async (uid) => {
    const { data: favs } = await supabase.from("favoritas").select("receta_id").eq("user_id", uid);
    setFavoritas((favs || []).map((f) => f.receta_id));
    const { data: perfil } = await supabase.from("profiles").select("is_premium, plan").eq("id", uid).single();
    setIsPremiumUser(!!perfil?.is_premium);
    setUserPlan(perfil?.plan || "free");
    const { data: plan } = await supabase.from("meal_plans").select("day_index, meal_type, receta_id").eq("user_id", uid);
    setPlanData(plan || []);
  }, []);

  useEffect(() => {
    if (user) cargarDatosUsuario(user.id);
    else { setFavoritas([]); setIsPremiumUser(false); setUserPlan("free"); }
  }, [user, cargarDatosUsuario]);

  const toggleFav = async (recetaId) => {
    if (!user) { setMostrarAuth(true); return; }
    const yaEsta = favoritas.includes(recetaId);
    if (yaEsta) {
      setFavoritas(favoritas.filter((id) => id !== recetaId));
      await supabase.from("favoritas").delete().eq("user_id", user.id).eq("receta_id", recetaId);
    } else {
      setFavoritas([...favoritas, recetaId]);
      await supabase.from("favoritas").insert({ user_id: user.id, receta_id: recetaId });
    }
  };

  const assignPlan = async (dayIdx, mealType, recetaId) => {
    if (!user) return;
    setPlanData((prev) => {
      const next = prev.filter((p) => !(p.day_index === dayIdx && p.meal_type === mealType));
      return [...next, { day_index: dayIdx, meal_type: mealType, receta_id: recetaId }];
    });
    await supabase.from("meal_plans").upsert({ user_id: user.id, day_index: dayIdx, meal_type: mealType, receta_id: recetaId });
  };

  const removePlan = async (dayIdx, mealType) => {
    if (!user) return;
    setPlanData((prev) => prev.filter((p) => !(p.day_index === dayIdx && p.meal_type === mealType)));
    await supabase.from("meal_plans").delete().eq("user_id", user.id).eq("day_index", dayIdx).eq("meal_type", mealType);
  };

  const iniciarCheckout = async (planId) => {
    if (!user) { setMostrarAuth(true); return; }
    const priceId = PADDLE_PRICE_IDS[planId];
    if (!priceId) { alert(t("error.paymentGeneric")); return; }
    setCargandoCheckout(true);
    try {
      const Paddle = await loadPaddle((event) => {
        if (event.name === "checkout.completed") {
          setMostrarPremium(false);
          if (user) setTimeout(() => cargarDatosUsuario(user.id), 2000);
        }
      });
      Paddle.Checkout.open({
        items: [{ priceId, quantity: 1 }],
        customer: { email: user.email },
        customData: { user_id: user.id },
        settings: { locale: currentLang === "es" ? "es" : "en" },
      });
    } catch (e) {
      alert(t("error.payment") + e.message);
    } finally {
      setCargandoCheckout(false);
    }
  };

  const recetasFiltradas = useMemo(() => {
    const term = norm(busqueda.trim());
    return RECETAS.filter((r) => {
      if (dieta !== "todas" && r.tipo !== dieta) return false;
      if (comida !== "todas" && r.comida !== comida) return false;
      if (dificultad !== 0 && r.dificultad !== dificultad) return false;
      if (soloFavoritas && !favoritas.includes(r.id)) return false;
      if (term) {
        const enNombre = norm(r.nombre).includes(term);
        const enTags = r.tags.some((t) => norm(t).includes(term));
        const enIngredientes = r.ingredientes.some((i) => norm(i).includes(term));
        if (!enNombre && !enTags && !enIngredientes) return false;
      }
      return true;
    });
  }, [RECETAS, dieta, comida, dificultad, soloFavoritas, favoritas, busqueda]);

  const hayFiltrosActivos = dieta !== "todas" || comida !== "todas" || dificultad !== 0 || soloFavoritas || busqueda.trim() !== "";
  const limpiarFiltros = () => { setDieta("todas"); setComida("todas"); setDificultad(0); setSoloFavoritas(false); setBusqueda(""); };

  const Pill = ({ active, onClick, children, color = C.ink }) => (
    <button onClick={onClick} className="rv-pill" style={{ borderColor: active ? color : C.line, background: active ? color : "#fff", color: active ? "#fff" : C.ink }}>{children}</button>
  );

  return (
    <div className="rv-root">
      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; }
        .rv-root { min-height: 100vh; background: ${C.bg}; font-family: 'Inter', sans-serif; color: ${C.ink}; }
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-thumb { background: ${C.line}; border-radius: 8px; }
        .rv-hero { position: relative; padding: 52px 24px 56px; text-align: center; overflow: hidden;
          background: linear-gradient(135deg, ${C.heroFrom}, ${C.heroTo}); }
        .rv-hero-topbar { max-width:1080px; margin:0 auto 18px; display:flex; align-items:center; justify-content:space-between; gap:10px; flex-wrap:wrap; }
        .rv-hero-badge { display:inline-flex; align-items:center; gap:8px; background:rgba(255,255,255,0.18); color:#fff; border:1px solid rgba(255,255,255,0.35); border-radius:999px; padding:6px 14px; font-size:12.5px; font-weight:600; }
        .rv-hero-icon-btn { display:inline-flex; align-items:center; gap:6px; background:rgba(255,255,255,0.16); color:#fff; border:1px solid rgba(255,255,255,0.35); border-radius:999px; padding:8px 12px; font-size:12.5px; font-weight:700; cursor:pointer; }
        .rv-hero-premium-btn { background:${C.sun}; color:${C.coralDark}; border-color:${C.sun}; }
        .rv-hero-title { font-family:'Quicksand',sans-serif; font-weight:700; font-size:clamp(34px,6vw,52px); color:#fff; margin:0; line-height:1.05; }
        .rv-hero-sub { max-width:540px; margin:14px auto 0; color:rgba(255,255,255,0.92); font-size:15.5px; line-height:1.55; }
        .rv-search-card { max-width:760px; margin:0 auto; background:#fff; border-radius:22px; padding:22px; box-shadow:0 18px 40px rgba(14,107,78,0.18); position:relative; z-index:1; }
        .rv-diet-row { display:flex; gap:8px; flex-wrap:wrap; margin-bottom:14px; }
        .rv-search-box { display:flex; align-items:center; gap:10px; background:${C.bg}; border:1.5px solid ${C.line}; border-radius:14px; padding:13px 16px; }
        .rv-search-box input { border:none; outline:none; background:transparent; font-size:14.5px; width:100%; color:${C.ink}; font-family:'Inter',sans-serif; }
        .rv-filters { max-width:1080px; margin:22px auto 0; padding:0 24px; display:flex; gap:8px; flex-wrap:wrap; align-items:center; }
        .rv-pill { padding:7px 15px; border-radius:999px; font-size:13px; font-weight:600; cursor:pointer; border:1.5px solid ${C.line}; white-space:nowrap; }
        .rv-grid { max-width:1080px; margin:24px auto 0; padding:0 24px 64px; display:grid; grid-template-columns:repeat(auto-fill, minmax(250px, 1fr)); gap:18px; }
        .rv-card { background:#fff; border-radius:18px; border:1px solid ${C.line}; overflow:hidden; cursor:pointer; display:flex; flex-direction:column; transition:transform .15s ease, box-shadow .15s ease; }
        .rv-card:hover { transform:translateY(-3px); box-shadow:0 14px 28px rgba(30,46,36,0.10); }
        .rv-card-img { width:100%; height:150px; object-fit:cover; display:block; }
        .rv-illus { width:100%; height:150px; position:relative; display:flex; align-items:center; justify-content:center; overflow:hidden; }
        .rv-illus-emoji { font-size:46px; filter:drop-shadow(0 4px 10px rgba(0,0,0,0.18)); z-index:1; }
        .rv-illus-blob { position:absolute; width:80px; height:80px; border-radius:50%; background:rgba(255,255,255,0.16); }
        .rv-card-badge-left { position:absolute; top:10px; left:10px; }
        .rv-card-badge-right { position:absolute; top:10px; right:46px; background:rgba(255,255,255,0.95); color:${C.coralDark}; font-size:11px; font-weight:700; padding:3px 9px; border-radius:999px; }
        .rv-fav-btn { position:absolute; top:8px; right:8px; border:none; border-radius:50%; width:30px; height:30px; display:flex; align-items:center; justify-content:center; cursor:pointer; }
        .rv-card-title { font-family:'Quicksand',sans-serif; font-size:16.5px; font-weight:700; color:${C.ink}; margin:0; line-height:1.3; }
        .rv-card-lock-overlay { position:absolute; inset:0; background:linear-gradient(180deg, rgba(20,30,24,0.15), rgba(20,30,24,0.55)); display:flex; align-items:flex-end; justify-content:center; padding-bottom:10px; }
        .rv-card-lock-badge { display:inline-flex; align-items:center; gap:5px; background:${C.sun}; color:${C.coralDark}; font-size:11.5px; font-weight:700; padding:4px 11px; border-radius:999px; }
        .rv-empty { text-align:center; padding:60px 20px; color:${C.inkSoft}; }
        .rv-modal-overlay { position:fixed; inset:0; background:rgba(15,30,22,0.5); z-index:50; display:flex; align-items:flex-start; justify-content:center; padding:4vh 14px; overflow-y:auto; }
        .rv-modal { background:#fff; border-radius:22px; max-width:620px; width:100%; overflow:hidden; }
        .rv-modal-close { position:absolute; top:14px; right:14px; background:#fff; border:none; border-radius:50%; width:32px; height:32px; display:flex; align-items:center; justify-content:center; cursor:pointer; }
        .rv-modal-title { font-family:'Quicksand',sans-serif; font-size:25px; font-weight:700; color:${C.ink}; margin:0; line-height:1.2; }
        .rv-section-label { font-size:12.5px; font-weight:700; letter-spacing:0.5px; text-transform:uppercase; margin-bottom:10px; }
        .rv-save-btn { margin-left:auto; border:1.5px solid; border-radius:999px; padding:6px 13px; font-size:12.5px; font-weight:700; display:inline-flex; align-items:center; gap:6px; cursor:pointer; background:#fff; }
        .rv-tip-box { background:#FFF1EC; border-radius:14px; padding:16px 18px; display:flex; gap:12px; margin-bottom:26px; }
        .rv-paywall { text-align:center; padding:30px 10px 34px; }
        .rv-paywall-icon { width:52px; height:52px; border-radius:50%; background:linear-gradient(135deg, ${C.heroFrom}, ${C.heroTo}); display:flex; align-items:center; justify-content:center; margin:0 auto; }
        .rv-upgrade-btn { display:inline-flex; align-items:center; justify-content:center; gap:8px; background:${C.coral}; color:#fff; border:none; border-radius:999px; padding:12px 22px; font-size:14.5px; font-weight:700; cursor:pointer; }
        .rv-upgrade-btn:disabled { opacity: 0.7; cursor: default; }
        .rv-premium-modal { max-width:440px; }
        .rv-premium-hero { background:linear-gradient(135deg, ${C.heroFrom}, ${C.heroTo}); padding:32px 26px 26px; text-align:center; position:relative; }
        .rv-plan-card { position:relative; border:1.5px solid ${C.line}; border-radius:14px; padding:14px 12px; text-align:left; cursor:pointer; background:#fff; }
        .rv-plan-badge { position:absolute; top:-9px; right:10px; background:${C.coral}; color:#fff; font-size:10px; font-weight:700; padding:2px 8px; border-radius:999px; }
        .rv-input { border:1.5px solid ${C.line}; border-radius:10px; padding:11px 13px; font-size:14px; font-family:'Inter',sans-serif; outline:none; }
        .rv-input:focus { border-color: ${C.veganaDark}; }
        .rv-lang-btn { display:inline-flex; align-items:center; gap:5px; background:rgba(255,255,255,0.22); color:#fff; border:1px solid rgba(255,255,255,0.4); border-radius:999px; padding:7px 12px; font-size:12px; font-weight:700; cursor:pointer; letter-spacing:0.3px; }
        .rv-nav-tabs { max-width:760px; margin:-30px auto 20px; position:relative; z-index:3; display:flex; justify-content:center; gap:4px; background:#fff; border-radius:16px; padding:5px; box-shadow:0 8px 24px rgba(14,107,78,0.12); }
        .rv-nav-tab { display:inline-flex; align-items:center; gap:7px; padding:10px 20px; border:none; border-radius:12px; background:transparent; font-size:13.5px; font-weight:600; color:${C.inkSoft}; cursor:pointer; white-space:nowrap; }
        .rv-nav-tab-active { background:${C.veganaBg}; color:${C.veganaDark}; }
        .rv-plan-section { max-width:1080px; margin:0 auto; padding:0 24px 64px; }
        .rv-week-grid { overflow-x:auto; }
        .rv-week-grid-mobile { display:none; }
        .rv-week-header { display:grid; grid-template-columns:80px repeat(7, 1fr); gap:4px; margin-bottom:4px; }
        .rv-week-corner { }
        .rv-week-day-label { text-align:center; font-size:12px; font-weight:700; color:${C.veganaDark}; padding:8px 4px; text-transform:uppercase; letter-spacing:0.3px; }
        .rv-week-row { display:grid; grid-template-columns:80px repeat(7, 1fr); gap:4px; margin-bottom:4px; }
        .rv-week-meal-label { display:flex; align-items:center; gap:5px; font-size:12px; font-weight:600; color:${C.inkSoft}; padding:0 4px; }
        .rv-week-meal-text { display:none; }
        .rv-week-cell { min-height:70px; background:#fff; border:1.5px solid ${C.line}; border-radius:12px; display:flex; align-items:center; justify-content:center; padding:6px; min-width:110px; }
        .rv-week-add { background:none; border:2px dashed ${C.line}; border-radius:10px; width:100%; height:100%; min-height:58px; cursor:pointer; display:flex; align-items:center; justify-content:center; }
        .rv-week-add:hover { border-color:${C.vegana}; background:${C.veganaBg}; }
        .rv-week-recipe { position:relative; width:100%; display:flex; flex-direction:column; align-items:center; gap:4px; }
        .rv-week-recipe-img { width:40px; height:40px; border-radius:8px; object-fit:cover; }
        .rv-week-recipe-name { font-size:10.5px; font-weight:600; color:${C.ink}; text-align:center; line-height:1.2; overflow:hidden; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; }
        .rv-week-remove { position:absolute; top:-4px; right:-4px; width:18px; height:18px; border-radius:50%; background:${C.coral}; border:none; display:flex; align-items:center; justify-content:center; cursor:pointer; color:#fff; }
        .rv-picker-item { display:flex; align-items:center; gap:12px; padding:10px 12px; border:1.5px solid ${C.line}; border-radius:12px; background:#fff; width:100%; }
        .rv-picker-item:hover { border-color:${C.vegana}; background:${C.veganaBg}; }
        .rv-shopping-section { max-width:600px; margin:0 auto; padding:0 24px 64px; }
        .rv-shop-item { display:flex; align-items:flex-start; gap:12px; padding:12px 14px; background:#fff; border:1px solid ${C.line}; border-radius:12px; cursor:pointer; width:100%; text-align:left; }
        .rv-shop-item:hover { border-color:${C.vegana}; }
        .rv-shop-check { width:20px; height:20px; border:2px solid ${C.line}; border-radius:6px; display:flex; align-items:center; justify-content:center; flex-shrink:0; margin-top:1px; }
        .rv-chef-section { max-width:700px; margin:0 auto; padding:0 24px 64px; }
        .rv-chef-gate { text-align:center; padding:48px 20px; background:#fff; border-radius:18px; border:1px solid ${C.line}; }
        .rv-chef-chat { background:#fff; border-radius:18px; border:1px solid ${C.line}; overflow:hidden; display:flex; flex-direction:column; height:calc(100vh - 340px); min-height:400px; }
        .rv-chef-messages { flex:1; overflow-y:auto; padding:20px; display:flex; flex-direction:column; gap:14px; }
        .rv-chef-msg { display:flex; gap:10px; align-items:flex-start; max-width:85%; }
        .rv-chef-msg-user { align-self:flex-end; flex-direction:row-reverse; }
        .rv-chef-msg-bot { align-self:flex-start; }
        .rv-chef-avatar { width:30px; height:30px; border-radius:50%; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
        .rv-chef-msg-bot .rv-chef-avatar { background:linear-gradient(135deg, ${C.heroFrom}, ${C.heroTo}); }
        .rv-chef-msg-user .rv-chef-avatar { background:${C.coral}; }
        .rv-chef-bubble { padding:10px 14px; border-radius:16px; font-size:14px; line-height:1.55; }
        .rv-chef-msg-bot .rv-chef-bubble { background:${C.bg}; color:${C.ink}; border-bottom-left-radius:4px; }
        .rv-chef-msg-user .rv-chef-bubble { background:linear-gradient(135deg, ${C.heroFrom}, ${C.heroTo}); color:#fff; border-bottom-right-radius:4px; }
        .rv-chef-thinking { opacity:0.7; font-style:italic; }
        .rv-chef-input-row { display:flex; gap:8px; padding:14px; border-top:1px solid ${C.line}; background:#fff; }
        .rv-chef-input { flex:1; border:1.5px solid ${C.line}; border-radius:12px; padding:11px 14px; font-size:14px; font-family:'Inter',sans-serif; outline:none; }
        .rv-chef-input:focus { border-color:${C.veganaDark}; }
        .rv-chef-send { width:42px; height:42px; border-radius:50%; background:linear-gradient(135deg, ${C.heroFrom}, ${C.heroTo}); border:none; color:#fff; display:flex; align-items:center; justify-content:center; cursor:pointer; flex-shrink:0; }
        .rv-chef-send:disabled { opacity:0.4; cursor:default; }
        @media (min-width: 800px) {
          .rv-week-meal-text { display:inline; }
        }
        @media (max-width: 768px) {
          .rv-grid { grid-template-columns:repeat(2, 1fr); }
        }
        @media (max-width: 640px) {
          .rv-hero { padding:28px 14px 20px; }
          .rv-hero-topbar { gap:6px; justify-content:center; }
          .rv-hero-badge { font-size:11px; padding:5px 10px; }
          .rv-hero-icon-btn { font-size:11px; padding:7px 10px; gap:4px; }
          .rv-hero-title { font-size:26px; }
          .rv-hero-sub { font-size:13px; margin-top:8px; }
          .rv-nav-tabs { margin:0 10px 12px; gap:2px; padding:4px; border-radius:12px; position:relative; z-index:1; box-shadow:0 4px 12px rgba(14,107,78,0.08); }
          .rv-nav-tab { padding:8px 8px; font-size:11px; gap:3px; border-radius:10px; }
          .rv-nav-tab svg { width:13px; height:13px; }
          .rv-search-card { margin:0 10px; padding:12px; border-radius:14px; box-shadow:0 4px 12px rgba(14,107,78,0.08); }
          .rv-diet-row { gap:5px; margin-bottom:10px; }
          .rv-search-box { padding:9px 12px; border-radius:10px; }
          .rv-search-box input { font-size:13px; }
          .rv-filters { padding:0 10px; margin-top:12px; gap:6px; }
          .rv-pill { padding:5px 10px; font-size:11px; }
          .rv-grid { padding:0 14px 50px; gap:14px; grid-template-columns:1fr; }
          .rv-card-img { height:180px; }
          .rv-illus { height:180px; }
          .rv-card-title { font-size:16px; }
          .rv-modal-overlay { padding:2vh 8px; }
          .rv-modal { border-radius:16px; }
          .rv-modal-title { font-size:19px; }
          .rv-plan-section { padding:0 10px 50px; }
          .rv-week-grid { overflow-x:visible; }
          .rv-week-header { display:none; }
          .rv-week-row { display:none; }
          .rv-week-grid-mobile { display:flex; flex-direction:column; gap:12px; }
          .rv-week-day-card { background:#fff; border:1.5px solid ${C.line}; border-radius:14px; padding:12px; }
          .rv-week-day-card-title { font-size:13px; font-weight:700; color:${C.veganaDark}; text-transform:uppercase; letter-spacing:0.3px; margin-bottom:10px; }
          .rv-week-day-meals { display:grid; grid-template-columns:repeat(4, 1fr); gap:6px; }
          .rv-week-day-meal-label { font-size:10px; font-weight:600; color:${C.inkSoft}; text-align:center; margin-bottom:4px; }
          .rv-week-cell { min-height:60px; min-width:0; padding:4px; }
          .rv-week-recipe-name { font-size:9px; }
          .rv-week-recipe-img { width:30px; height:30px; }
          .rv-shopping-section { padding:0 10px 50px; }
          .rv-chef-section { padding:0 10px 50px; }
          .rv-chef-chat { height:calc(100vh - 280px); min-height:320px; }
          .rv-chef-bubble { font-size:13px; padding:9px 12px; }
          .rv-chef-input { font-size:13px; padding:10px 12px; }
          .rv-premium-modal { max-width:95vw; }
        }
        @media (max-width: 380px) {
          .rv-hero-badge { display:none; }
          .rv-hero-title { font-size:23px; }
          .rv-hero-sub { font-size:12.5px; }
        }
      `}</style>

      <header className="rv-hero">
        <div className="rv-hero-topbar">
          <div className="rv-hero-badge"><Sparkles size={14} /> {t("hero.badge")}</div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="rv-lang-btn" onClick={toggleLang}>
              <Globe size={13} /> {currentLang === "es" ? "EN" : "ES"}
            </button>
            {user ? (
              <button className="rv-hero-icon-btn" onClick={() => supabase.auth.signOut()}><LogOut size={14} /> {t("nav.logout")}</button>
            ) : (
              <button className="rv-hero-icon-btn" onClick={() => setMostrarAuth(true)}><LogIn size={14} /> {t("nav.login")}</button>
            )}
            <button className="rv-hero-icon-btn rv-hero-premium-btn" onClick={() => setMostrarPremium(true)}><Crown size={14} /> {isPremiumUser ? t("nav.premiumActive") : t("nav.premium")}</button>
          </div>
        </div>
        <h1 className="rv-hero-title">{t("hero.title")}</h1>
        <p className="rv-hero-sub">{t("hero.subtitle")}</p>
      </header>

      <div className="rv-nav-tabs">
        <button className={`rv-nav-tab ${vista === "recetas" ? "rv-nav-tab-active" : ""}`} onClick={() => setVista("recetas")}>
          <UtensilsCrossed size={15} /> {t("nav.recipes")}
        </button>
        <button className={`rv-nav-tab ${vista === "plan" ? "rv-nav-tab-active" : ""}`} onClick={() => setVista("plan")}>
          <CalendarDays size={15} /> {t("nav.weekPlan")}
        </button>
        <button className={`rv-nav-tab ${vista === "lista" ? "rv-nav-tab-active" : ""}`} onClick={() => setVista("lista")}>
          <ShoppingCart size={15} /> {t("nav.shopping")}
        </button>
        <button className={`rv-nav-tab ${vista === "chef" ? "rv-nav-tab-active" : ""}`} onClick={() => setVista("chef")} style={vista === "chef" ? {} : { background: `linear-gradient(135deg, ${C.heroFrom}15, ${C.heroTo}15)` }}>
          <Bot size={15} /> {t("nav.chefIA")}
        </button>
      </div>

      {vista === "recetas" && (
        <>
          <div className="rv-search-card">
            <div className="rv-diet-row">
              <Pill active={dieta === "todas"} onClick={() => setDieta("todas")}>{t("filter.all")}</Pill>
              <Pill active={dieta === "vegetariana"} onClick={() => setDieta("vegetariana")} color={C.vegetariana}>{t("filter.vegetarian")}</Pill>
              <Pill active={dieta === "vegana"} onClick={() => setDieta("vegana")} color={C.vegana}>{t("filter.vegan")}</Pill>
            </div>
            <div className="rv-search-box">
              <Search size={17} color={C.inkSoft} />
              <input type="text" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder={t("search.placeholder")} />
              {busqueda && <button onClick={() => setBusqueda("")} style={{ border: "none", background: "none", cursor: "pointer" }}><X size={16} color={C.inkSoft} /></button>}
            </div>
          </div>

          <div className="rv-filters">
            <Pill active={comida === "todas"} onClick={() => setComida("todas")} color={C.veganaDark}>{t("filter.allMeals")}</Pill>
            {Object.keys(MEAL_EMOJI).map((key) => (
              <Pill key={key} active={comida === key} onClick={() => setComida(key)} color={C.veganaDark}>{MEAL_EMOJI[key]} {t(`meal.${key}`)}</Pill>
            ))}
            <span style={{ width: 1, alignSelf: "stretch", background: C.line }} />
            <Pill active={dificultad === 0} onClick={() => setDificultad(0)} color={C.coral}>{t("filter.allDifficulty")}</Pill>
            {[1, 2, 3].map((n) => (
              <Pill key={n} active={dificultad === n} onClick={() => setDificultad(n)} color={C.coral}>{t(`difficulty.${n}`)}</Pill>
            ))}
            <span style={{ width: 1, alignSelf: "stretch", background: C.line }} />
            <Pill active={soloFavoritas} onClick={() => setSoloFavoritas((v) => !v)} color={C.coral}>{t("filter.favorites")}</Pill>
            {hayFiltrosActivos && <button onClick={limpiarFiltros} style={{ fontSize: 13, color: C.coralDark, background: "none", border: "none", cursor: "pointer", fontWeight: 700, marginLeft: "auto" }}>{t("filter.clearFilters")}</button>}
          </div>

          {recetasFiltradas.length === 0 ? (
            <div className="rv-empty"><div style={{ fontSize: 40, marginBottom: 12 }}>🍂</div><p style={{ fontSize: 15, whiteSpace: "pre-line" }}>{t("empty.message")}</p></div>
          ) : (
            <div className="rv-grid">
              {recetasFiltradas.map((r) => (
                <RecipeCard key={r.id} receta={r} isFav={favoritas.includes(r.id)} isPremiumUser={isPremiumUser} onToggleFav={toggleFav} onOpen={setSeleccionada} t={t} />
              ))}
            </div>
          )}
          <footer style={{ textAlign: "center", padding: "0 24px 40px", color: C.inkSoft, fontSize: 12.5 }}>{t("footer.text")}</footer>
        </>
      )}

      {vista === "plan" && (
        <WeeklyPlan planData={planData} recetas={RECETAS} isPremiumUser={isPremiumUser} onAssign={assignPlan} onRemove={removePlan} onNeedAuth={() => setMostrarAuth(true)} user={user} t={t} />
      )}

      {vista === "lista" && (
        <ShoppingList planData={planData} recetas={RECETAS} t={t} />
      )}

      {vista === "chef" && (
        <ChefIA user={user} userPlan={userPlan} onNeedAuth={() => setMostrarAuth(true)} onNeedUpgrade={() => setMostrarPremium(true)} t={t} />
      )}

      <RecipeModal
        receta={seleccionada}
        isFav={seleccionada ? favoritas.includes(seleccionada.id) : false}
        isPremiumUser={isPremiumUser}
        onToggleFav={toggleFav}
        onClose={() => setSeleccionada(null)}
        onQuierePremium={() => { setSeleccionada(null); setMostrarPremium(true); }}
        onAddToPlan={assignPlan}
        user={user}
        t={t}
      />

      {mostrarAuth && <AuthModal onClose={() => setMostrarAuth(false)} onAuthed={() => setMostrarAuth(false)} t={t} />}
      {mostrarPremium && (
        <PremiumModal isPremiumUser={isPremiumUser} userPlan={userPlan} cargando={cargandoCheckout} initialTier={premiumTier} onClose={() => setMostrarPremium(false)} onSuscribirse={iniciarCheckout} t={t} />
      )}

      <footer style={{ textAlign: "center", padding: "20px 24px 32px", display: "flex", justifyContent: "center", gap: 18, flexWrap: "wrap" }}>
        <a href="/precios.html" style={{ fontSize: 12, color: C.inkSoft }}>{t("footer.pricing")}</a>
        <a href="/terminos.html" style={{ fontSize: 12, color: C.inkSoft }}>{t("footer.terms")}</a>
        <a href="/privacidad.html" style={{ fontSize: 12, color: C.inkSoft }}>{t("footer.privacy")}</a>
        <a href="/reembolsos.html" style={{ fontSize: 12, color: C.inkSoft }}>{t("footer.refunds")}</a>
        <a href="mailto:academiadigital311@gmail.com" style={{ fontSize: 12, color: C.inkSoft }}>{t("footer.contact")}</a>
      </footer>
    </div>
  );
}
