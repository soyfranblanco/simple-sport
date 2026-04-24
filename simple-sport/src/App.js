import React, { useState, useEffect, useRef } from "react";

// ─── CONFIG ────────────────────────────────────────────────────────────────────
const SUPABASE_URL = "https://uogbjxedooizloiotgea.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVvZ2JqeGVkb29pemxvaW90Z2VhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5ODQ2OTYsImV4cCI6MjA5MjU2MDY5Nn0.rBQVmHctBRXbUZ20hQtZ9088LcSkgH3xEeeKw2fcHtM";
const NUNITO = "'Nunito', sans-serif";
const GEORGIA = "Georgia, serif";

// ─── COLORES ───────────────────────────────────────────────────────────────────
const C = {
  bg: "#080808",
  gold: "#b89a4e",
  txt: "#f0ebe0",
  dim: "rgba(240,235,224,0.45)",
  border: "rgba(184,154,78,0.2)",
  card: "rgba(255,255,255,0.02)",
};

// ─── ESTILOS REUTILIZABLES ─────────────────────────────────────────────────────
const logo = {
  fontFamily: "monospace",
  fontSize: ".65rem",
  letterSpacing: ".5em",
  color: C.gold,
  border: `1px solid ${C.gold}`,
  padding: ".4em 1em",
  display: "inline-block",
  marginBottom: "2.5rem",
};

const lbl = {
  fontFamily: "monospace",
  fontSize: ".5rem",
  letterSpacing: ".3em",
  color: C.gold,
  textTransform: "uppercase",
  display: "block",
  marginBottom: ".3rem",
};

const inp = {
  width: "100%",
  background: "transparent",
  border: "none",
  borderBottom: `1px solid rgba(184,154,78,0.3)`,
  color: C.txt,
  fontFamily: NUNITO,
  fontSize: ".9rem",
  padding: ".55rem 0",
  outline: "none",
  marginBottom: "1.2rem",
  display: "block",
  boxSizing: "border-box",
};

const btnGold = {
  background: C.gold,
  color: C.bg,
  border: "none",
  borderRadius: 24,
  fontFamily: "monospace",
  fontSize: ".62rem",
  letterSpacing: ".3em",
  padding: ".85em 2em",
  cursor: "pointer",
  textTransform: "uppercase",
  width: "100%",
};

const btnOutline = {
  background: "transparent",
  color: C.dim,
  border: `1px solid rgba(184,154,78,0.3)`,
  borderRadius: 24,
  fontFamily: "monospace",
  fontSize: ".62rem",
  letterSpacing: ".3em",
  padding: ".85em 2em",
  cursor: "pointer",
  textTransform: "uppercase",
  width: "100%",
  marginTop: ".6rem",
};

// ─── SYSTEM PROMPT DEPORTIVO ───────────────────────────────────────────────────
const SYSTEM_PROMPT_DEPORTE = `Sos un asistente especializado en rendimiento deportivo basado en Diseño Humano. Tu único rol es analizar el perfil de Diseño Humano de un atleta y traducirlo en información práctica y accionable para su entrenador.

Todas tus respuestas deben estar exclusivamente vinculadas al contexto deportivo: rendimiento, aprendizaje, motivación, toma de decisiones en competencia y vínculo entrenador-atleta. No hagas referencias a la vida personal, profesional o emocional fuera del deporte.

TONO Y ESTILO:
- Directo y claro. Como un colega muy inteligente que sabe mucho.
- Frases cortas. Sin paja. Sin intro genérica.
- Siempre cerrá con algo accionable o una regla práctica clara.
- Sin jerga esotérica. Sin mencionar términos de Diseño Humano que el entrenador no pueda entender — traducí siempre al impacto concreto en el deporte.
- Cuando uses conceptos de DH, explicá inmediatamente qué significa en términos deportivos concretos.

ESTRUCTURA DE RESPUESTA COMPLETA (solo cuando el entrenador pide el perfil completo):
1. Cómo procesa la presión y la competencia
   [texto explicativo + 2 recomendaciones prácticas]
2. Cómo aprende y asimila información nueva
   [texto explicativo + 2 recomendaciones prácticas]
3. Qué lo motiva y qué lo desconecta
   [texto explicativo + 2 recomendaciones prácticas]
4. Cómo toma decisiones en tiempo real
   [texto explicativo + 2 recomendaciones prácticas]
5. Cómo vincularse mejor con este atleta
   [texto explicativo + 2 recomendaciones prácticas]

Para preguntas específicas del entrenador: respondé directo y concreto, sin seguir la estructura de 5 secciones.

LÍMITES:
- Solo contexto deportivo. Si la pregunta no tiene que ver con el rendimiento, el aprendizaje o el vínculo entrenador-atleta, decilo amablemente.
- No hagas diagnósticos médicos ni psicológicos.`;

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function md(t) {
  return t
    .replace(/^### (.+)$/gm, `<span style="color:${C.gold}">$1</span>`)
    .replace(/^## (.+)$/gm, `<span style="color:${C.gold}">$1</span>`)
    .replace(/^# (.+)$/gm, `<span style="color:${C.gold}">$1</span>`)
    .replace(/\*\*(.*?)\*\*/g, `<span style="color:${C.gold}">$1</span>`)
    .replace(/\n/g, "<br/>");
}

async function dbFetch(endpoint, options = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      Prefer: "return=representation",
      ...options.headers,
    },
  });
  return res.json().catch(() => ({}));
}

// ─── CITY INPUT ───────────────────────────────────────────────────────────────
function CityInput({ value, onChange, placeholder }) {
  const [sugerencias, setSugerencias] = useState([]);
  const [show, setShow] = useState(false);
  const timer = useRef(null);

  async function buscar(q) {
    if (q.length < 3) { setSugerencias([]); return; }
    try {
      const r = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5&featuretype=city&accept-language=es`);
      const data = await r.json();
      setSugerencias(data.map(d => d.display_name));
    } catch { setSugerencias([]); }
  }

  function handleChange(e) {
    onChange(e.target.value);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => buscar(e.target.value), 400);
    setShow(true);
  }

  return (
    <div style={{ position: "relative", marginBottom: "1.2rem" }}>
      <input style={{ ...inp, marginBottom: 0 }} placeholder={placeholder} value={value}
        onChange={handleChange}
        onBlur={() => setTimeout(() => setShow(false), 200)}
        onFocus={() => sugerencias.length > 0 && setShow(true)} />
      {show && sugerencias.length > 0 && (
        <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#1a1a1a", border: `1px solid ${C.border}`, zIndex: 50, maxHeight: 200, overflowY: "auto" }}>
          {sugerencias.map((s, i) => (
            <div key={i} onClick={() => { onChange(s); setSugerencias([]); setShow(false); }}
              style={{ padding: ".7rem 1rem", fontSize: ".82rem", color: C.dim, cursor: "pointer", borderBottom: `1px solid rgba(184,154,78,0.1)` }}
              onMouseEnter={e => e.target.style.color = C.gold}
              onMouseLeave={e => e.target.style.color = C.dim}>
              {s}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── DEPORTES ─────────────────────────────────────────────────────────────────
const DEPORTES = ["Tenis", "Pádel", "Rugby", "Fútbol", "Básquet", "Natación", "Atletismo", "Golf", "Vóley", "Hockey", "Otro"];

// ─── CHIPS SUGERIDOS ──────────────────────────────────────────────────────────
const CHIPS = [
  "¿Cómo trabaja bajo presión?",
  "¿Cómo aprende mejor la técnica?",
  "¿Qué lo motiva de verdad?",
  "¿Cómo darle feedback efectivo?",
  "¿Cómo toma decisiones en juego?",
  "¿Cómo manejar su frustración?",
];

// ════════════════════════════════════════════════════════════════════════════════
// PANTALLA: BIENVENIDA
// ════════════════════════════════════════════════════════════════════════════════
function Welcome({ go }) {
  return (
    <div style={{ background: C.bg, minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2rem", fontFamily: NUNITO, color: C.txt }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@300;400;600&display=swap');`}</style>
      <div style={logo}>SIMPLE SPORT</div>
      <div style={{ textAlign: "center", maxWidth: 520 }}>
        <div style={{ fontSize: "clamp(1.8rem,4vw,2.6rem)", fontWeight: 300, lineHeight: 1.3, marginBottom: "1.2rem", fontFamily: GEORGIA }}>
          Entrená a la persona.<br />
          <span style={{ color: C.gold, fontStyle: "italic" }}>No sólo al deportista.</span>
        </div>
        <div style={{ color: C.dim, fontSize: ".95rem", lineHeight: 1.8, maxWidth: 420, margin: "0 auto 2.5rem" }}>
          Una herramienta para entrenadores que quieren conocer de verdad a sus atletas — y entrenarlos como tal.
        </div>
        <div style={{ maxWidth: 280, margin: "0 auto", display: "flex", flexDirection: "column", gap: ".7rem" }}>
          <button onClick={() => go("login")} style={btnGold}>Ingresar</button>
          <button onClick={() => go("registro")} style={btnOutline}>Solicitar acceso</button>
        </div>
      </div>
      <div style={{ position: "fixed", bottom: "2rem", fontFamily: "monospace", fontSize: ".48rem", color: "rgba(240,235,224,0.15)", letterSpacing: ".15em", textAlign: "center" }}>
        SIMPLE es una herramienta creada y registrada por Fran Blanco · 2026
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
// PANTALLA: LOGIN
// ════════════════════════════════════════════════════════════════════════════════
function Login({ go, setEntrenador }) {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function ok() {
    if (!email || !pass) { setErr("Completá email y contraseña."); return; }
    setLoading(true); setErr("");
    try {
      const users = await dbFetch(`entrenadores?email=eq.${encodeURIComponent(email.toLowerCase().trim())}&select=*`);
      if (!Array.isArray(users) || users.length === 0) { setErr("Email no encontrado."); setLoading(false); return; }
      const u = users[0];
      if (u.password_hash !== pass) { setErr("Contraseña incorrecta."); setLoading(false); return; }
      setEntrenador(u);
      go("atletas");
    } catch { setErr("Error de conexión. Intentá de nuevo."); }
    setLoading(false);
  }

  return (
    <div style={{ background: C.bg, minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2rem", fontFamily: NUNITO, color: C.txt }}>
      <div style={logo}>SIMPLE SPORT</div>
      <div style={{ width: "100%", maxWidth: 400 }}>
        <div style={{ fontSize: "1.4rem", fontWeight: 300, textAlign: "center", marginBottom: ".3rem", fontFamily: GEORGIA }}>Ingresar</div>
        <div style={{ color: C.dim, textAlign: "center", marginBottom: "1.5rem", fontSize: ".85rem" }}>Acceso exclusivo para entrenadores</div>
        <div style={{ border: `1px solid ${C.border}`, padding: "2.5rem", background: C.card, borderRadius: 16 }}>
          {err && <div style={{ color: "#c06040", fontFamily: "monospace", fontSize: ".6rem", marginBottom: ".8rem", textAlign: "center" }}>{err}</div>}
          <label style={lbl}>Email</label>
          <input style={inp} type="email" placeholder="tu@email.com" value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === "Enter" && ok()} />
          <label style={lbl}>Contraseña</label>
          <input style={{ ...inp }} type="password" placeholder="••••••••" value={pass}
            onChange={e => setPass(e.target.value)}
            onKeyDown={e => e.key === "Enter" && ok()} />
          <button onClick={ok} disabled={loading} style={{ ...btnGold, marginTop: ".5rem", opacity: loading ? 0.6 : 1, cursor: loading ? "wait" : "pointer" }}>
            {loading ? "..." : "Ingresar"}
          </button>
        </div>
        <div style={{ textAlign: "center", marginTop: "1.2rem", color: C.dim, fontFamily: "monospace", fontSize: ".55rem" }}>
          ¿No tenés acceso?{" "}
          <button onClick={() => go("registro")} style={{ color: C.gold, background: "none", border: "none", cursor: "pointer", fontFamily: "monospace", fontSize: ".55rem" }}>
            Solicitalo acá
          </button>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
// PANTALLA: REGISTRO ENTRENADOR
// ════════════════════════════════════════════════════════════════════════════════
function Registro({ go }) {
  const [f, setF] = useState({ nom: "", ape: "", email: "", pass: "", deporte: "" });
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const u = (k, v) => setF(p => ({ ...p, [k]: v }));

  async function ok() {
    if (!f.nom || !f.ape || !f.email || !f.pass) { setErr("Completá todos los campos obligatorios."); return; }
    setLoading(true); setErr("");
    try {
      const dbR = await fetch(`${SUPABASE_URL}/rest/v1/entrenadores`, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, Prefer: "return=minimal" },
        body: JSON.stringify({ email: f.email.toLowerCase().trim(), nombre: f.nom, apellido: f.ape, password_hash: f.pass, deporte_principal: f.deporte }),
      });
      if (!dbR.ok) {
        const e = await dbR.json().catch(() => ({}));
        if (e.code === "23505") { setErr("Ese email ya está registrado."); setLoading(false); return; }
        setErr("Error al crear la cuenta."); setLoading(false); return;
      }
      go("pending");
    } catch { setErr("Error de conexión."); }
    setLoading(false);
  }

  return (
    <div style={{ background: C.bg, minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2rem", fontFamily: NUNITO, color: C.txt }}>
      <div style={logo}>SIMPLE SPORT</div>
      <div style={{ width: "100%", maxWidth: 440 }}>
        <div style={{ fontSize: "1.4rem", fontWeight: 300, textAlign: "center", marginBottom: ".3rem", fontFamily: GEORGIA }}>Solicitar acceso</div>
        <div style={{ color: C.dim, textAlign: "center", marginBottom: "1.5rem", fontSize: ".85rem" }}>Te contactamos para activar tu cuenta.</div>
        <div style={{ border: `1px solid ${C.border}`, padding: "2.5rem", background: C.card, borderRadius: 16 }}>
          {err && <div style={{ color: "#c06040", fontFamily: "monospace", fontSize: ".6rem", marginBottom: ".8rem", textAlign: "center" }}>{err}</div>}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div><label style={lbl}>Nombre *</label><input style={inp} placeholder="Nombre" value={f.nom} onChange={e => u("nom", e.target.value)} /></div>
            <div><label style={lbl}>Apellido *</label><input style={inp} placeholder="Apellido" value={f.ape} onChange={e => u("ape", e.target.value)} /></div>
          </div>
          <label style={lbl}>Email *</label>
          <input style={inp} type="email" placeholder="tu@email.com" value={f.email} onChange={e => u("email", e.target.value)} />
          <label style={lbl}>Deporte principal</label>
          <select style={{ ...inp, background: "transparent" }} value={f.deporte} onChange={e => u("deporte", e.target.value)}>
            <option value="">Seleccioná tu deporte</option>
            {DEPORTES.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <label style={lbl}>Contraseña *</label>
          <input style={inp} type="password" placeholder="Mínimo 6 caracteres" value={f.pass} onChange={e => u("pass", e.target.value)} />
          <button onClick={ok} disabled={loading} style={{ ...btnGold, marginTop: ".5rem", opacity: loading ? 0.6 : 1 }}>
            {loading ? "Enviando..." : "Solicitar acceso"}
          </button>
        </div>
        <div style={{ textAlign: "center", marginTop: "1.2rem", color: C.dim, fontFamily: "monospace", fontSize: ".55rem" }}>
          ¿Ya tenés cuenta?{" "}
          <button onClick={() => go("login")} style={{ color: C.gold, background: "none", border: "none", cursor: "pointer", fontFamily: "monospace", fontSize: ".55rem" }}>
            Ingresá acá
          </button>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
// PANTALLA: PENDING
// ════════════════════════════════════════════════════════════════════════════════
function Pending({ go }) {
  return (
    <div style={{ background: C.bg, minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2rem", fontFamily: GEORGIA, color: C.txt }}>
      <div style={logo}>SIMPLE SPORT</div>
      <div style={{ textAlign: "center", maxWidth: 440 }}>
        <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>✉️</div>
        <div style={{ fontSize: "1.4rem", fontWeight: 300, marginBottom: ".8rem" }}>Solicitud recibida</div>
        <div style={{ color: C.dim, lineHeight: 1.7, marginBottom: "2rem", fontFamily: NUNITO }}>
          Recibimos tu solicitud. En las próximas 24 horas te contactamos para activar tu cuenta.
        </div>
        <button onClick={() => go("welcome")} style={{ color: C.gold, background: "none", border: "none", cursor: "pointer", fontFamily: "monospace", fontSize: ".6rem" }}>
          ← Volver al inicio
        </button>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
// PANTALLA: MIS ATLETAS
// ════════════════════════════════════════════════════════════════════════════════
function MisAtletas({ go, entrenador, setAtletaActivo }) {
  const [atletas, setAtletas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function cargar() {
      try {
        const data = await dbFetch(`atletas?entrenador_email=eq.${encodeURIComponent(entrenador.email)}&order=created_at.desc`);
        if (Array.isArray(data)) setAtletas(data);
      } catch {}
      setLoading(false);
    }
    cargar();
  }, [entrenador.email]);

  function abrir(atleta) {
    setAtletaActivo(atleta);
    go("chat");
  }

  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: NUNITO, color: C.txt }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@300;400;600&display=swap');`}</style>

      {/* Header */}
      <div style={{ padding: ".9rem 2rem", borderBottom: `1px solid rgba(184,154,78,0.15)`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ ...logo, marginBottom: 0 }}>SIMPLE SPORT</div>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <span style={{ color: C.dim, fontSize: ".85rem" }}>Hola, <span style={{ color: C.txt, fontWeight: 600 }}>{entrenador.nombre}</span></span>
          <button onClick={() => go("welcome")} style={{ color: C.gold, background: "none", border: "none", cursor: "pointer", fontFamily: "monospace", fontSize: ".55rem" }}>Salir →</button>
        </div>
      </div>

      {/* Contenido */}
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "2rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "1.8rem" }}>
          <div>
            <div style={{ fontFamily: GEORGIA, fontSize: "1.6rem", fontWeight: 300, marginBottom: ".3rem" }}>Mis atletas</div>
            <div style={{ fontFamily: "monospace", fontSize: ".45rem", letterSpacing: ".25em", color: C.dim }}>
              {loading ? "CARGANDO..." : `${atletas.length} ATLETA${atletas.length !== 1 ? "S" : ""} CARGADO${atletas.length !== 1 ? "S" : ""}`}
            </div>
          </div>
          <button onClick={() => go("nuevo-atleta")} style={{ background: "transparent", border: `1px solid ${C.gold}`, color: C.gold, borderRadius: 20, fontFamily: "monospace", fontSize: ".52rem", letterSpacing: ".2em", padding: ".5em 1.3em", cursor: "pointer", textTransform: "uppercase" }}>
            + Nuevo atleta
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", color: C.dim, fontFamily: "monospace", fontSize: ".55rem", letterSpacing: ".2em", padding: "3rem" }}>CARGANDO...</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "1rem" }}>
            {atletas.map((a, i) => (
              <div key={i} onClick={() => abrir(a)}
                style={{ border: `1px solid rgba(184,154,78,0.2)`, background: C.card, borderRadius: 12, padding: "1.25rem", cursor: "pointer", transition: "all .2s" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = C.gold; e.currentTarget.style.background = "rgba(184,154,78,0.04)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(184,154,78,0.2)"; e.currentTarget.style.background = C.card; }}>
                <div style={{ fontFamily: GEORGIA, fontSize: "1rem", marginBottom: ".4rem" }}>{a.nombre} {a.apellido}</div>
                <div style={{ fontFamily: "monospace", fontSize: ".45rem", letterSpacing: ".25em", color: C.gold, textTransform: "uppercase", marginBottom: ".8rem" }}>{a.deporte}</div>
                {a.diseno && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: ".3rem", marginBottom: ".8rem" }}>
                    {[a.diseno.tipo, `Perfil ${a.diseno.perfil}`, a.diseno.autoridad].filter(Boolean).map((tag, j) => (
                      <span key={j} style={{ fontFamily: "monospace", fontSize: ".4rem", letterSpacing: ".1em", color: C.dim, border: `1px solid rgba(184,154,78,0.15)`, padding: ".25em .6em", borderRadius: 20 }}>{tag}</span>
                    ))}
                  </div>
                )}
                <div style={{ fontFamily: "monospace", fontSize: ".42rem", letterSpacing: ".15em", color: C.gold }}>VER PERFIL →</div>
              </div>
            ))}

            {/* Card agregar */}
            <div onClick={() => go("nuevo-atleta")}
              style={{ border: `1px dashed rgba(184,154,78,0.2)`, borderRadius: 12, padding: "1.25rem", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: ".5rem", minHeight: 140, transition: "all .2s" }}
              onMouseEnter={e => e.currentTarget.style.borderColor = C.gold}
              onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(184,154,78,0.2)"}>
              <div style={{ fontSize: "1.5rem", color: "rgba(184,154,78,0.4)" }}>+</div>
              <div style={{ fontFamily: "monospace", fontSize: ".45rem", letterSpacing: ".2em", color: C.dim, textTransform: "uppercase" }}>Nuevo atleta</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
// PANTALLA: NUEVO ATLETA
// ════════════════════════════════════════════════════════════════════════════════
function NuevoAtleta({ go, entrenador, setAtletaActivo }) {
  const [f, setF] = useState({ nom: "", ape: "", deporte: "", fecha: "", hora: "", lugar: "", contexto: "" });
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const u = (k, v) => setF(p => ({ ...p, [k]: v }));

  async function ok() {
    if (!f.nom || !f.ape || !f.deporte || !f.fecha || !f.hora || !f.lugar) {
      setErr("Completá todos los campos obligatorios."); return;
    }
    setLoading(true); setErr("");
    try {
      // 1. Calcular diseño humano
      const hdR = await fetch("/api/hd", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre: f.nom, apellido: f.ape, birth_date: f.fecha, birth_time: f.hora, ciudad: f.lugar }),
      });
      const diseno = await hdR.json();
      if (diseno.error) { setErr("Error al calcular el diseño: " + diseno.error); setLoading(false); return; }

      // 2. Guardar atleta en Supabase
      const result = await dbFetch("atletas", {
        method: "POST",
        body: JSON.stringify({
          entrenador_email: entrenador.email,
          nombre: f.nom,
          apellido: f.ape,
          deporte: f.deporte,
          fecha_nacimiento: f.fecha,
          hora_nacimiento: f.hora,
          lugar_nacimiento: f.lugar,
          contexto_entrenador: f.contexto || null,
          diseno,
        }),
      });

      const atleta = Array.isArray(result) ? result[0] : result;
      setAtletaActivo({ ...atleta, diseno });
      go("chat");
    } catch (e) {
      setErr("Error: " + (e?.message || "No se pudo conectar."));
    }
    setLoading(false);
  }

  return (
    <div style={{ background: C.bg, minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2rem", fontFamily: NUNITO, color: C.txt }}>
      <div style={{ ...logo, marginBottom: "1.5rem" }}>SIMPLE SPORT</div>
      <div style={{ width: "100%", maxWidth: 480 }}>
        <div style={{ fontFamily: GEORGIA, fontSize: "1.4rem", fontWeight: 300, textAlign: "center", marginBottom: ".3rem" }}>Nuevo atleta</div>
        <div style={{ color: C.dim, textAlign: "center", fontSize: ".85rem", marginBottom: "1.5rem", lineHeight: 1.6 }}>
          Con estos datos generamos el perfil completo. Solo necesitás hacerlo una vez por atleta.
        </div>
        <div style={{ border: `1px solid ${C.border}`, padding: "2.5rem", background: C.card, borderRadius: 16 }}>
          {err && <div style={{ color: "#c06040", fontFamily: "monospace", fontSize: ".6rem", marginBottom: ".8rem", textAlign: "center" }}>{err}</div>}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div><label style={lbl}>Nombre *</label><input style={inp} placeholder="Nombre" value={f.nom} onChange={e => u("nom", e.target.value)} /></div>
            <div><label style={lbl}>Apellido *</label><input style={inp} placeholder="Apellido" value={f.ape} onChange={e => u("ape", e.target.value)} /></div>
          </div>
          <label style={lbl}>Deporte *</label>
          <select style={{ ...inp, background: "transparent", colorScheme: "dark" }} value={f.deporte} onChange={e => u("deporte", e.target.value)}>
            <option value="">Seleccioná el deporte</option>
            {DEPORTES.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div><label style={lbl}>Fecha de nac. *</label><input style={{ ...inp, colorScheme: "dark" }} type="date" value={f.fecha} onChange={e => u("fecha", e.target.value)} /></div>
            <div><label style={lbl}>Hora aprox. *</label><input style={{ ...inp, colorScheme: "dark" }} type="time" value={f.hora} onChange={e => u("hora", e.target.value)} /></div>
          </div>
          <label style={lbl}>Ciudad de nacimiento *</label>
          <CityInput value={f.lugar} onChange={v => u("lugar", v)} placeholder="Ciudad, País" />
          <label style={lbl}>Contexto para el entrenador</label>
          <textarea
            value={f.contexto}
            onChange={e => u("contexto", e.target.value)}
            placeholder="¿Algo específico que quieras entender sobre este atleta? Ej: Le cuesta competir, tiene problemas para recibir feedback..."
            style={{ width: "100%", background: "transparent", border: `1px solid rgba(184,154,78,0.2)`, borderRadius: 8, color: C.txt, fontFamily: NUNITO, fontSize: ".85rem", padding: ".8rem", outline: "none", resize: "vertical", lineHeight: 1.6, minHeight: 80, boxSizing: "border-box", marginBottom: "1.2rem" }}
          />
          <button onClick={ok} disabled={loading} style={{ ...btnGold, opacity: loading ? 0.6 : 1, cursor: loading ? "wait" : "pointer" }}>
            {loading ? "Generando perfil..." : "Generar perfil · $5 USD"}
          </button>
          <button onClick={() => go("atletas")} style={btnOutline}>Cancelar</button>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
// PANTALLA: CHAT CON ATLETA
// ════════════════════════════════════════════════════════════════════════════════
function ChatAtleta({ go, entrenador, atletaActivo, setAtletaActivo }) {
  const [atletas, setAtletas] = useState([]);
  const [msgs, setMsgs] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [convId, setConvId] = useState(null);
  const [perfilOpen, setPerfilOpen] = useState(false);
  const chatEndRef = useRef(null);
  const lastUserRef = useRef(null);
  const chatContainerRef = useRef(null);

  // Cargar lista de atletas
  useEffect(() => {
    async function cargar() {
      try {
        const data = await dbFetch(`atletas?entrenador_email=eq.${encodeURIComponent(entrenador.email)}&order=created_at.desc`);
        if (Array.isArray(data)) setAtletas(data);
      } catch {}
    }
    cargar();
  }, [entrenador.email]);

  // Cargar conversación del atleta activo
  useEffect(() => {
    if (!atletaActivo) return;
    setMsgs([]);
    setConvId(null);
    async function cargarConv() {
      try {
        const data = await dbFetch(`conversaciones_deporte?atleta_id=eq.${atletaActivo.id}&order=updated_at.desc&limit=1`);
        if (Array.isArray(data) && data.length > 0 && data[0].mensajes?.length > 0) {
          setMsgs(data[0].mensajes);
          setConvId(data[0].id);
        }
      } catch {}
    }
    cargarConv();
  }, [atletaActivo?.id]);

  // Scroll
  useEffect(() => {
    if (!msgs.length) return;
    const last = msgs[msgs.length - 1];
    if (last.role === "assistant" && chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [msgs]);

  async function guardarConversacion(mensajes) {
    try {
      if (convId) {
        await dbFetch(`conversaciones_deporte?id=eq.${convId}`, {
          method: "PATCH",
          body: JSON.stringify({ mensajes, updated_at: new Date().toISOString() }),
        });
      } else {
        const result = await dbFetch("conversaciones_deporte", {
          method: "POST",
          body: JSON.stringify({ atleta_id: atletaActivo.id, entrenador_email: entrenador.email, mensajes }),
        });
        if (Array.isArray(result) && result[0]?.id) setConvId(result[0].id);
      }
    } catch {}
  }

  function buildSystemPrompt() {
    const a = atletaActivo;
    const disenoStr = a.diseno ? JSON.stringify(a.diseno) : "No disponible";
    return `${SYSTEM_PROMPT_DEPORTE}

ATLETA: ${a.nombre} ${a.apellido}
DEPORTE: ${a.deporte}
PERFIL DE DISEÑO HUMANO: ${disenoStr}
${a.contexto_entrenador ? `CONTEXTO DEL ENTRENADOR: ${a.contexto_entrenador}` : ""}`;
  }

  async function send(t) {
    const txt = t || input.trim();
    if (!txt || loading || !atletaActivo) return;
    setInput("");
    const next = [...msgs, { role: "user", content: txt }];
    setMsgs(next);
    setLoading(true);
    try {
      const r = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: buildSystemPrompt(),
          messages: next,
        }),
      });
      const d = await r.json();
      const finalMsgs = [...next, { role: "assistant", content: d?.content?.[0]?.text || "Error al generar respuesta." }];
      setMsgs(finalMsgs);
      await guardarConversacion(finalMsgs);
    } catch {
      setMsgs([...next, { role: "assistant", content: "Error de conexión. Intentá de nuevo." }]);
    }
    setLoading(false);
  }

  function cambiarAtleta(a) {
    setAtletaActivo(a);
  }

  if (!atletaActivo) return null;

  return (
    <div style={{ background: C.bg, minHeight: "100vh", display: "flex", flexDirection: "column", fontFamily: NUNITO, color: C.txt }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@300;400;600&display=swap');
        @keyframes p{0%,80%,100%{opacity:.2;transform:scale(.8)}40%{opacity:1;transform:scale(1)}}
        .chat-scroll::-webkit-scrollbar{width:4px}
        .chat-scroll::-webkit-scrollbar-track{background:transparent}
        .chat-scroll::-webkit-scrollbar-thumb{background:rgba(184,154,78,.25);border-radius:2px}
        .chat-scroll{scrollbar-width:thin;scrollbar-color:rgba(184,154,78,.25) transparent}
        .atleta-item:hover{background:rgba(184,154,78,0.04)!important}
      `}</style>

      {/* Header */}
      <div style={{ padding: ".9rem 1.5rem", borderBottom: `1px solid rgba(184,154,78,0.15)`, display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
        <div style={{ ...logo, marginBottom: 0 }}>SIMPLE SPORT</div>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <button onClick={() => go("atletas")} style={{ color: C.dim, background: "none", border: "none", cursor: "pointer", fontFamily: "monospace", fontSize: ".52rem" }}>← Mis atletas</button>
          <button onClick={() => go("welcome")} style={{ color: C.gold, background: "none", border: "none", cursor: "pointer", fontFamily: "monospace", fontSize: ".52rem" }}>Salir →</button>
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

        {/* Sidebar: lista de atletas */}
        <div style={{ width: 220, flexShrink: 0, borderRight: `1px solid rgba(184,154,78,0.12)`, display: "flex", flexDirection: "column", overflowY: "auto" }}>
          <div style={{ padding: "1rem 1rem .5rem", fontFamily: "monospace", fontSize: ".42rem", letterSpacing: ".3em", color: C.gold, textTransform: "uppercase" }}>Mis atletas</div>
          {atletas.map((a, i) => (
            <div key={i} className="atleta-item" onClick={() => cambiarAtleta(a)}
              style={{ padding: ".8rem 1rem", cursor: "pointer", borderLeft: atletaActivo?.id === a.id ? `2px solid ${C.gold}` : "2px solid transparent", background: atletaActivo?.id === a.id ? "rgba(184,154,78,0.06)" : "transparent", transition: "all .15s" }}>
              <div style={{ fontSize: ".88rem", color: C.txt, marginBottom: ".15rem" }}>{a.nombre} {a.apellido}</div>
              <div style={{ fontFamily: "monospace", fontSize: ".4rem", letterSpacing: ".2em", color: C.gold, textTransform: "uppercase" }}>{a.deporte}</div>
            </div>
          ))}
          <div style={{ padding: "1rem", marginTop: "auto" }}>
            <button onClick={() => go("nuevo-atleta")} style={{ width: "100%", background: "transparent", border: `1px dashed rgba(184,154,78,0.25)`, color: C.dim, fontFamily: "monospace", fontSize: ".45rem", letterSpacing: ".15em", padding: ".6em", cursor: "pointer", textTransform: "uppercase" }}>
              + Nuevo atleta
            </button>
          </div>
        </div>

        {/* Chat principal */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
          {/* Sub-header del atleta */}
          <div style={{ padding: ".9rem 1.5rem", borderBottom: `1px solid rgba(184,154,78,0.1)`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontFamily: GEORGIA, fontSize: "1.1rem" }}>{atletaActivo.nombre} {atletaActivo.apellido}</div>
              <div style={{ fontFamily: "monospace", fontSize: ".42rem", letterSpacing: ".2em", color: C.dim, textTransform: "uppercase", marginTop: ".2rem" }}>
                {atletaActivo.deporte}
                {atletaActivo.diseno ? ` · ${atletaActivo.diseno.tipo} · Perfil ${atletaActivo.diseno.perfil} · ${atletaActivo.diseno.autoridad}` : ""}
              </div>
            </div>
            <button onClick={() => setPerfilOpen(v => !v)}
              style={{ background: perfilOpen ? "rgba(184,154,78,0.1)" : "transparent", border: `1px solid ${C.border}`, color: C.gold, fontFamily: "monospace", fontSize: ".48rem", letterSpacing: ".15em", padding: ".45em 1em", cursor: "pointer", textTransform: "uppercase" }}>
              {perfilOpen ? "Cerrar perfil" : "Ver perfil"}
            </button>
          </div>

          {/* Mensajes */}
          <div ref={chatContainerRef} className="chat-scroll"
            style={{ flex: 1, padding: "1.5rem clamp(1rem, 8vw, 5rem)", display: "flex", flexDirection: "column", gap: "1.5rem", overflowY: "auto" }}>
            {msgs.length === 0 && (
              <div style={{ textAlign: "center", padding: "2rem 1rem", border: `1px solid rgba(184,154,78,0.12)` }}>
                <div style={{ fontFamily: GEORGIA, fontSize: "1.2rem", fontWeight: 300, marginBottom: ".5rem" }}>
                  Chateá sobre <span style={{ color: C.gold, fontStyle: "italic" }}>{atletaActivo.nombre}</span>
                </div>
                <div style={{ color: C.dim, fontSize: ".85rem", lineHeight: 1.7, marginBottom: "1.5rem" }}>
                  Cada respuesta está basada en su diseño específico — no en generalidades.
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: ".5rem", justifyContent: "center" }}>
                  {CHIPS.map(c => (
                    <button key={c} onClick={() => send(c)}
                      style={{ fontFamily: "monospace", fontSize: ".52rem", padding: ".45em .9em", border: `1px solid rgba(184,154,78,0.25)`, color: C.dim, cursor: "pointer", background: "transparent", borderRadius: 20 }}
                      onMouseEnter={e => { e.target.style.borderColor = C.gold; e.target.style.color = C.gold; }}
                      onMouseLeave={e => { e.target.style.borderColor = "rgba(184,154,78,0.25)"; e.target.style.color = C.dim; }}>
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {msgs.map((m, i) => (
              <div key={i} ref={m.role === "user" && i === msgs.length - 1 ? lastUserRef : null}
                style={{ textAlign: m.role === "user" ? "right" : "left" }}>
                <div style={{ fontFamily: "monospace", fontSize: ".45rem", letterSpacing: ".3em", textTransform: "uppercase", marginBottom: ".3rem", color: m.role === "user" ? "rgba(240,235,224,0.3)" : C.gold }}>
                  {m.role === "user" ? "Entrenador" : "SIMPLE"}
                </div>
                {m.role === "assistant" ? (
                  <div style={{ fontSize: ".95rem", color: C.txt, lineHeight: 1.85, fontFamily: GEORGIA }}
                    dangerouslySetInnerHTML={{ __html: md(m.content) }} />
                ) : (
                  <div style={{ fontSize: ".92rem", fontStyle: "italic", color: "rgba(240,235,224,0.55)", lineHeight: 1.7, fontFamily: NUNITO }}>
                    {m.content}
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div>
                <div style={{ fontFamily: "monospace", fontSize: ".45rem", letterSpacing: ".3em", color: C.gold, marginBottom: ".3rem" }}>SIMPLE</div>
                <div style={{ display: "flex", gap: 5 }}>
                  {[0, 1, 2].map(i => <div key={i} style={{ width: 5, height: 5, background: C.gold, borderRadius: "50%", animation: `p 1.4s ${i * .2}s infinite ease-in-out` }} />)}
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <div style={{ padding: "1rem 1.5rem", borderTop: `1px solid rgba(184,154,78,0.12)`, display: "flex", gap: ".8rem", alignItems: "flex-end" }}>
            <textarea
              value={input}
              placeholder={`Preguntá sobre ${atletaActivo.nombre}...`}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
              style={{ flex: 1, background: "transparent", border: "none", borderBottom: `1px solid rgba(184,154,78,0.35)`, color: C.txt, fontFamily: GEORGIA, fontSize: ".92rem", padding: ".6rem 0", outline: "none", resize: "none", minHeight: "2rem", lineHeight: 1.5 }}
              rows={1}
            />
            <button onClick={() => send()} disabled={loading || !input.trim()}
              style={{ background: "transparent", border: `1px solid ${C.gold}`, borderRadius: 20, color: C.gold, fontFamily: "monospace", fontSize: ".55rem", letterSpacing: ".2em", padding: ".6em 1.1em", cursor: "pointer", textTransform: "uppercase", marginBottom: 2, opacity: loading || !input.trim() ? 0.3 : 1 }}>
              Enviar
            </button>
          </div>
        </div>

        {/* Panel perfil (slide) */}
        {perfilOpen && atletaActivo.diseno && (
          <div style={{ width: 240, flexShrink: 0, borderLeft: `1px solid rgba(184,154,78,0.12)`, padding: "1.25rem", overflowY: "auto" }}>
            <div style={{ fontFamily: "monospace", fontSize: ".42rem", letterSpacing: ".3em", color: C.gold, textTransform: "uppercase", marginBottom: "1rem" }}>Perfil de diseño</div>
            {[
              ["Tipo", atletaActivo.diseno.tipo],
              ["Autoridad", atletaActivo.diseno.autoridad],
              ["Perfil", atletaActivo.diseno.perfil],
              ["Estrategia", atletaActivo.diseno.estrategia],
              ["Firma", atletaActivo.diseno.firma],
              ["No-self", atletaActivo.diseno.no_self_theme],
              ["Motivación", atletaActivo.diseno.variables?.motivación],
              ["Entorno", atletaActivo.diseno.variables?.entorno],
            ].filter(([, v]) => v).map(([l, v]) => (
              <div key={l} style={{ marginBottom: ".9rem" }}>
                <div style={{ fontFamily: "monospace", fontSize: ".4rem", letterSpacing: ".25em", color: C.gold, textTransform: "uppercase", marginBottom: ".2rem" }}>{l}</div>
                <div style={{ fontSize: ".82rem", color: C.txt }}>{v}</div>
              </div>
            ))}
            <div style={{ borderTop: `1px solid rgba(184,154,78,0.1)`, marginTop: "1rem", paddingTop: "1rem" }}>
              <div style={{ fontFamily: "monospace", fontSize: ".4rem", letterSpacing: ".25em", color: C.gold, textTransform: "uppercase", marginBottom: ".5rem" }}>Deporte</div>
              <div style={{ fontSize: ".82rem", color: C.txt }}>{atletaActivo.deporte}</div>
            </div>
            {atletaActivo.contexto_entrenador && (
              <div style={{ marginTop: ".9rem" }}>
                <div style={{ fontFamily: "monospace", fontSize: ".4rem", letterSpacing: ".25em", color: C.gold, textTransform: "uppercase", marginBottom: ".4rem" }}>Contexto inicial</div>
                <div style={{ fontSize: ".78rem", color: C.dim, lineHeight: 1.6 }}>{atletaActivo.contexto_entrenador}</div>
              </div>
            )}
            <button onClick={() => send("Generá el perfil completo de este atleta con las 5 secciones.")}
              style={{ width: "100%", marginTop: "1.5rem", background: "transparent", border: `1px solid rgba(184,154,78,0.3)`, color: C.gold, fontFamily: "monospace", fontSize: ".45rem", letterSpacing: ".15em", padding: ".65em", cursor: "pointer", textTransform: "uppercase" }}>
              Generar informe completo
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
// APP ROOT
// ════════════════════════════════════════════════════════════════════════════════
export default function App() {
  const [screen, setScreen] = useState("welcome");
  const [entrenador, setEntrenador] = useState(null);
  const [atletaActivo, setAtletaActivo] = useState(null);

  function go(s) { setScreen(s); }

  return (
    <div style={{ background: C.bg, minHeight: "100vh" }}>
      <style>{"*{box-sizing:border-box;margin:0;padding:0}body{background:#080808}input:-webkit-autofill{-webkit-box-shadow:0 0 0 1000px #080808 inset!important;-webkit-text-fill-color:#f0ebe0!important}select option{background:#1a1a1a;color:#f0ebe0}"}</style>
      {screen === "welcome"     && <Welcome go={go} />}
      {screen === "login"       && <Login go={go} setEntrenador={setEntrenador} />}
      {screen === "registro"    && <Registro go={go} />}
      {screen === "pending"     && <Pending go={go} />}
      {screen === "atletas"     && entrenador && <MisAtletas go={go} entrenador={entrenador} setAtletaActivo={setAtletaActivo} />}
      {screen === "nuevo-atleta" && entrenador && <NuevoAtleta go={go} entrenador={entrenador} setAtletaActivo={setAtletaActivo} />}
      {screen === "chat"        && entrenador && atletaActivo && <ChatAtleta go={go} entrenador={entrenador} atletaActivo={atletaActivo} setAtletaActivo={setAtletaActivo} />}
    </div>
  );
}
