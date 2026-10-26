/* CELIDER Tab — conexión en vivo con Supabase.
   Público: lee una copia sin datos sensibles. Jueces: entran con su enlace privado. Administración: entra con PIN. */
'use strict';

const NUBE = {
  url: 'https://fakkqpwgidjvodippxup.supabase.co',
  clave: 'sb_publishable_3C3Jueq_dsv75UwmOm0UnA_b-tlgAXc',
  torneo: (new URLSearchParams(location.search).get('t') || 'r17').toLowerCase().replace(/[^a-z0-9-]/g, '') || 'r17',
};
const sb = window.supabase ? window.supabase.createClient(NUBE.url, NUBE.clave, { auth: { persistSession: false } }) : null;
let MODO = sb ? 'publico' : 'admin';   // sin conexión a la nube, la app funciona como antes, solo en este navegador
let PIN = null, JUEZ = null, BOLETAS = [], miVersion = 0, subiendo = false, tSubida = null, estadoNube = sb ? 'conectando' : 'local';
const CLAVE_PIN = 'celider-pin-' + NUBE.torneo, CLAVE_JUEZ = 'celider-juez-' + NUBE.torneo;

// ---------------- copia pública ----------------
function instantaneaPublica(src) {
  const P = JSON.parse(JSON.stringify(src));
  P.jueces = P.jueces.map(j => ({ id: j.id, nombre: j.nombre, centro: j.centro || '' }));
  P.actividad = []; P.mociones = []; P.practicas = P.practicas || [];
  for (const r of P.rondas) {
    if (!r.mocionPublicada) { r.mocion = ''; r.infoslide = ''; }
    const cerrada = r.debates.length && r.debates.every(completo);
    if (!r.drawPublicado && !cerrada) { r.debates = []; r.descansos = []; r.oculta = true; }
    for (const d of r.debates) { d.boletas = {}; d.oradores = null; }
  }
  if (!P.elim.publicado) P.elim = { rondas: [], publicado: false };
  return P;
}
function aplicarBoletas() {
  const por = {};
  for (const b of BOLETAS) (por[b.debate] ||= []).push(b);
  for (const r of S.rondas) for (const d of r.debates) {
    const filas = (por[d.id] || []).sort((a, b) => new Date(a.enviada) - new Date(b.enviada));
    if (filas.length || MODO !== 'admin') {
      d.boletas = {};
      for (const x of filas) d.boletas[x.juez] = x.datos.boleta;
      d.oradores = filas.length ? filas[filas.length - 1].datos.oradores : (MODO === 'admin' ? d.oradores : null);
    }
  }
}
const tokenNuevo = () => { const a = new Uint8Array(9); crypto.getRandomValues(a); return [...a].map(x => 'abcdefghjkmnpqrstuvwxyz23456789'[x % 31]).join(''); };
function asegurarTokens() { let n = 0; for (const j of S.jueces) if (!j.token) { j.token = tokenNuevo(); n++; } return n; }
const enlaceJuez = j => `${location.origin}${location.pathname}${location.search}#j/${j.token}`;

// ---------------- estado de conexión ----------------
function pintarEstadoNube() {
  const el = $('#estadoNube'); if (!el) return;
  const txt = { ok: 'En línea · guardado', guardando: 'Guardando…', error: 'Sin conexión · reintentando', conectando: 'Conectando…', local: 'Solo en este equipo' }[estadoNube];
  el.className = 'nube ' + estadoNube; el.innerHTML = `<i></i>${txt}`;
}

// ---------------- administración ----------------
function programarSubida() {
  if (!sb || MODO !== 'admin' || !PIN) return;
  clearTimeout(tSubida); estadoNube = 'guardando'; pintarEstadoNube();
  tSubida = setTimeout(subir, 650);
}
async function subir() {
  if (subiendo) { tSubida = setTimeout(subir, 400); return; }
  subiendo = true;
  asegurarTokens();
  const jueces = S.jueces.map(j => ({ token: j.token, juez_id: j.id, nombre: j.nombre }));
  const { data, error } = await sb.rpc('admin_guardar', { p_torneo: NUBE.torneo, p_pin: PIN, p_privado: S, p_publico: instantaneaPublica(S), p_jueces: jueces });
  subiendo = false;
  if (error) { estadoNube = 'error'; pintarEstadoNube(); if (/PIN/.test(error.message)) return salirAdmin('El PIN cambió; vuelve a entrar.'); tSubida = setTimeout(subir, 4000); return; }
  miVersion = data; estadoNube = 'ok'; pintarEstadoNube();
}
async function entrarAdmin(pin, silencioso) {
  const { data, error } = await sb.rpc('admin_entrar', { p_torneo: NUBE.torneo, p_pin: pin });
  if (error) { if (!silencioso) toast(/PIN/.test(error.message) ? 'PIN incorrecto' : 'No hay conexión', 'error'); return false; }
  PIN = pin; MODO = 'admin';
  try { localStorage.setItem(CLAVE_PIN, pin); } catch (e) { /* sin almacenamiento */ }
  const vacio = !data.datos || !data.datos.torneo;
  S = vacio ? cargar() : migrar(data.datos);   // la primera vez se sube lo que había en este equipo
  miVersion = data.version;
  await traerBoletas();
  if (!BOLETAS.length) await subirBoletasLocales();
  aplicarBoletas();
  asegurarTokens();
  ultimoGuardado = JSON.stringify(S);
  try { localStorage.setItem(CLAVE, ultimoGuardado); } catch (e) { /* sin espacio */ }
  if (vacio) registrar('Publicó el torneo en línea');
  estadoNube = 'ok'; subir();
  return true;
}
async function subirBoletasLocales() {
  for (const r of S.rondas) for (const d of r.debates) for (const [j, b] of Object.entries(d.boletas || {}))
    if (b && b.ok && d.oradores) await sb.rpc('admin_boleta', { p_torneo: NUBE.torneo, p_pin: PIN, p_ronda: r.id, p_debate: d.id, p_juez: j, p_datos: { boleta: b, oradores: d.oradores } });
  await traerBoletas();
}
function salirAdmin(motivo) {
  PIN = null; MODO = 'publico';
  try { localStorage.removeItem(CLAVE_PIN); } catch (e) { /* nada */ }
  if (motivo) toast(motivo, 'error');
  cargarPublico().then(() => { location.hash = '#vivo'; render(); });
}
async function boletaNube(r, d, juez, boleta) {
  if (!sb) return true;
  const datos = boleta ? { boleta, oradores: d.oradores } : null;
  const { error } = MODO === 'admin'
    ? await sb.rpc('admin_boleta', { p_torneo: NUBE.torneo, p_pin: PIN, p_ronda: r.id, p_debate: d.id, p_juez: juez, p_datos: datos })
    : await sb.rpc('juez_enviar', { p_token: JUEZ.token, p_ronda: r.id, p_debate: d.id, p_datos: datos });
  if (error) { toast(error.message.includes('asignada') ? 'Esa sala ya no está asignada a ti. Recarga la página.' : 'No se pudo enviar la boleta. Revisa tu conexión e inténtalo otra vez.', 'error'); return false; }
  BOLETAS = BOLETAS.filter(b => !(b.debate === d.id && b.juez === juez));
  if (boleta) BOLETAS.push({ torneo: NUBE.torneo, ronda: r.id, debate: d.id, juez, datos, enviada: new Date().toISOString() });
  return true;
}

// ---------------- público y jueces ----------------
async function traerBoletas() {
  const { data } = await sb.from('boletas').select('*').eq('torneo', NUBE.torneo);
  BOLETAS = data || [];
}
async function cargarPublico() {
  const [{ data }] = await Promise.all([sb.from('torneo_publico').select('datos,version').eq('id', NUBE.torneo).maybeSingle(), traerBoletas()]);
  S = data && data.datos && data.datos.torneo ? migrar(data.datos) : instantaneaPublica(estadoInicial());
  aplicarBoletas();
  estadoNube = 'ok';
}
async function entrarJuez(token) {
  if (JUEZ && JUEZ.token === token) return true;
  const { data } = await sb.rpc('juez_entrar', { p_token: token });
  if (!data) { JUEZ = { token, invalido: true }; return false; }
  JUEZ = { token, id: data.juez, nombre: data.nombre };
  try { localStorage.setItem(CLAVE_JUEZ, token); } catch (e) { /* nada */ }
  return true;
}

// ---------------- en vivo ----------------
function suscribir() {
  sb.channel('torneo-' + NUBE.torneo)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'torneo_publico', filter: `id=eq.${NUBE.torneo}` }, async p => {
      const v = p.new && p.new.version;
      if (MODO === 'admin') {
        if (subiendo || !v || v <= miVersion) return;
        const { data } = await sb.rpc('admin_entrar', { p_torneo: NUBE.torneo, p_pin: PIN });
        if (data && data.datos && data.datos.torneo && data.version > miVersion) { S = migrar(data.datos); miVersion = data.version; aplicarBoletas(); ultimoGuardado = JSON.stringify(S); if (!enEdicion()) render(); }
        return;
      }
      if (p.new && p.new.datos && p.new.datos.torneo) { S = migrar(p.new.datos); aplicarBoletas(); refrescarEnVivo(); }
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'boletas', filter: `torneo=eq.${NUBE.torneo}` }, p => {
      const viejo = p.old || {}, nuevo = p.new || {};
      BOLETAS = BOLETAS.filter(b => !(b.debate === (nuevo.debate || viejo.debate) && b.juez === (nuevo.juez || viejo.juez)));
      if (p.eventType !== 'DELETE') BOLETAS.push(nuevo);
      aplicarBoletas();
      if (MODO === 'admin') {
        if (p.eventType !== 'DELETE') { const d = buscarDebate(nuevo.debate); const j = juezPorId(nuevo.juez); if (d && j) toast(`Boleta recibida: ${d.aula} · ${j.nombre.split(' ')[0]}`); }
        guardar(true); if (!enEdicion()) render();
      } else refrescarEnVivo();
    })
    .subscribe(estado => { if (estado === 'SUBSCRIBED' && estadoNube !== 'guardando') { estadoNube = MODO === 'admin' || estadoNube === 'conectando' ? 'ok' : estadoNube; pintarEstadoNube(); } else if (estado === 'CHANNEL_ERROR' || estado === 'TIMED_OUT') { estadoNube = 'error'; pintarEstadoNube(); } });
}
function refrescarEnVivo() {
  const [ruta, , sub] = rutaActual();
  if (ruta === 'j' && sub === 'boleta') return;   // no interrumpir a un juez que está llenando la boleta
  if (document.activeElement && ['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;
  render();
}

// ---------------- arranque ----------------
async function iniciarNube() {
  if (!sb) { render(); return; }
  raiz.innerHTML = `<div class="cargando"><div class="sello"></div><span>Conectando con el torneo…</span></div>`;
  const [ruta, token] = rutaActual();
  let pin = null; try { pin = localStorage.getItem(CLAVE_PIN); } catch (e) { /* nada */ }
  try {
    if (pin && ruta !== 'j' && await entrarAdmin(pin, true)) { /* administración lista */ }
    else {
      await cargarPublico();
      if (ruta === 'j' && token) await entrarJuez(token);
    }
  } catch (e) { estadoNube = 'error'; }
  suscribir();
  if (!location.hash) location.hash = MODO === 'admin' ? '#inicio' : '#vivo';
  render();
}
