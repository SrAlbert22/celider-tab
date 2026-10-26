/* CELIDER Tab — núcleo: estado, cálculos WSDC, emparejamientos, cronómetro y exportaciones.
   Todo se guarda en este navegador (localStorage). */
'use strict';

const CLAVE = 'celider-tab-v1';
const ESCALA = {
  constructivo: { min: 60, max: 80, c: [24, 32], e: [24, 32], s: [12, 16] },
  replica:      { min: 30, max: 40, c: [12, 16], e: [12, 16], s: [6, 8] },
};
const DISCURSOS = [
  ['1.º Proposición', 'constructivo', 'prop'], ['1.º Oposición', 'constructivo', 'opp'],
  ['2.º Proposición', 'constructivo', 'prop'], ['2.º Oposición', 'constructivo', 'opp'],
  ['3.º Proposición', 'constructivo', 'prop'], ['3.º Oposición', 'constructivo', 'opp'],
  ['Réplica Oposición', 'replica', 'opp'], ['Réplica Proposición', 'replica', 'prop'],
];
const COLORES_DIST = ['#7cfbdd', '#6cc4ff', '#ffc35c', '#ff8a7a', '#b8f36b', '#d7b3ff', '#7ee0ff'];

// ---------------- estado ----------------
function estadoInicial() {
  return {
    version: 2,
    torneo: {
      nombre: 'Torneo Regional de Debate R17', subtitulo: 'Rondas de práctica · CELIDER',
      distritos: ['17-01', '17-02', '17-03', '17-04', '17-05'].map(c => ({ codigo: c, nombre: '' })),
      aulas: Array.from({ length: 16 }, (_, i) => 'Aula ' + (i + 1)),
      tiempos: { prep: 900, constructivo: 480, replica: 240, protegido: 60, gracia: 15 },
      rondasPreliminares: 4, breakSize: 8, jueces: 'uno', modoPuntaje: 'desglosado',
    },
    equipos: JSON.parse(JSON.stringify(window.EQUIPOS_INICIALES || [])),
    jueces: [], practicas: [], asistencia: {}, rondas: [], mociones: [], actividad: [],
    elim: { rondas: [], publicado: false },
    publico: { mostrarTabla: false, rondaId: null, vista: 'auto' },
    crono: { indice: 0, etiqueta: DISCURSOS[0][0], tipo: 'constructivo', lado: 'prop', duracion: 480, inicio: null, acumulado: 0, corriendo: false },
  };
}
function migrar(s) {
  const b = estadoInicial();
  for (const k in b) if (!(k in s)) s[k] = b[k];
  for (const k in b.torneo) if (!(k in s.torneo)) s.torneo[k] = b.torneo[k];
  for (const k in b.publico) if (!(k in s.publico)) s.publico[k] = b.publico[k];
  s.version = 2;
  return s;
}
function cargar() {
  try { const t = localStorage.getItem(CLAVE); if (t) return migrar(JSON.parse(t)); } catch (e) { /* datos dañados */ }
  return estadoInicial();
}
let S = cargar();
let ultimoGuardado = JSON.stringify(S);
const pilaDeshacer = [];
function guardar(sinDeshacer = false) {
  if (typeof MODO !== 'undefined' && MODO !== 'admin') return;
  const nuevo = JSON.stringify(S);
  if (nuevo === ultimoGuardado) return;
  if (!sinDeshacer) { pilaDeshacer.push(ultimoGuardado); if (pilaDeshacer.length > 40) pilaDeshacer.shift(); }
  ultimoGuardado = nuevo;
  try { localStorage.setItem(CLAVE, nuevo); } catch (e) { toast('No se pudo guardar en este navegador', 'error'); }
  if (typeof programarSubida === 'function') programarSubida();
}
function deshacer() {
  if (!pilaDeshacer.length) return toast('No hay nada que deshacer');
  ultimoGuardado = pilaDeshacer.pop(); S = migrar(JSON.parse(ultimoGuardado));
  try { localStorage.setItem(CLAVE, ultimoGuardado); } catch (e) { /* sin espacio */ }
  if (typeof programarSubida === 'function') programarSubida();
  render(); toast('Cambio deshecho');
}
function registrar(txt, tipo = '') { S.actividad.unshift({ t: Date.now(), txt, tipo }); S.actividad.length = Math.min(S.actividad.length, 80); }

// ---------------- utilidades ----------------
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = p => p + Date.now().toString(36).slice(-4) + Math.random().toString(36).slice(2, 6);
const eqPorId = id => S.equipos.find(e => e.id === id);
const juezPorId = id => S.jueces.find(j => j.id === id);
const rondaPorId = id => S.rondas.find(r => r.id === id);
const nombreEq = id => (eqPorId(id) || {}).nombre || '—';
function miembroPorId(id) {
  for (const e of S.equipos) { const m = e.miembros.find(x => x.id === id); if (m) return { m, e }; }
  return null;
}
const nombreDist = c => { const d = S.torneo.distritos.find(x => x.codigo === c); return d && d.nombre ? `${c} · ${d.nombre}` : `Distrito ${c}`; };
const colorDist = c => COLORES_DIST[Math.max(0, S.torneo.distritos.findIndex(d => d.codigo === c)) % COLORES_DIST.length];
const suma = a => a.reduce((x, y) => x + y, 0);
const prom = a => a.length ? suma(a) / a.length : 0;
const r2 = n => Math.round(n * 100) / 100;
const fmt = n => (Math.round(n * 100) / 100).toLocaleString('es-DO', { maximumFractionDigits: 2 });
const mmss = s => { const neg = s < 0; s = Math.abs(Math.round(s)); return `${neg ? '+' : ''}${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`; };
const PALABRAS_VACIAS = new Set(['de', 'del', 'la', 'las', 'los', 'el', 'y', 'en', 'liceo', 'politécnico', 'politecnico', 'centro', 'educativo', 'escuela', 'colegio', 'prof.', 'artes', 'experimental']);
function iniciales(nombre) {
  const p = String(nombre).replace(/[()]/g, '').split(/\s+/).filter(w => w && !PALABRAS_VACIAS.has(w.toLowerCase()));
  const base = p.length ? p : String(nombre).split(/\s+/);
  return ((base[0] || '?')[0] + ((base[1] || '')[0] || '')).toUpperCase();
}
const inicialesPersona = n => String(n).split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();
function mezclar(a) { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
const hoyISO = () => { const d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 10); };
const fechaLarga = iso => { try { return new Date(iso + 'T12:00').toLocaleDateString('es-DO', { weekday: 'short', day: 'numeric', month: 'short' }); } catch (e) { return iso; } };
function hace(t) {
  const s = (Date.now() - t) / 1000;
  if (s < 60) return 'ahora'; if (s < 3600) return `hace ${Math.floor(s / 60)} min`; if (s < 86400) return `hace ${Math.floor(s / 3600)} h`;
  return new Date(t).toLocaleDateString('es-DO', { day: 'numeric', month: 'short' });
}
function toast(t, tipo = '', accion = null) {
  const caja = $('#toasts') || document.body.appendChild(Object.assign(document.createElement('div'), { id: 'toasts' }));
  const d = document.createElement('div'); d.className = 'toast ' + tipo;
  d.innerHTML = `<span>${esc(t)}</span>${accion ? `<button>${esc(accion[0])}</button>` : ''}`;
  if (accion) d.querySelector('button').onclick = () => { accion[1](); d.remove(); };
  caja.appendChild(d); while (caja.children.length > 3) caja.firstChild.remove(); setTimeout(() => d.classList.add('sale'), 3200); setTimeout(() => d.remove(), 3600);
}
function descargar(nombre, contenido, tipo) {
  const a = document.createElement('a'); a.href = URL.createObjectURL(contenido instanceof Blob ? contenido : new Blob([contenido], { type: tipo }));
  a.download = nombre; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
const csv = filas => '﻿' + filas.map(f => f.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');

// ---------------- resultados y tablas ----------------
const boletasDe = d => Object.values(d.boletas || {}).filter(b => b && b.ok);
const completo = d => boletasDe(d).length >= Math.max(1, (d.jueces || []).length);
function resultado(d) {
  const bs = boletasDe(d);
  if (!bs.length || !d.oradores) return null;
  const totProp = prom(bs.map(b => b.totalProp)), totOpp = prom(bs.map(b => b.totalOpp));
  const votosProp = bs.filter(b => b.ganador === 'prop').length, votosOpp = bs.length - votosProp;
  const ganador = votosProp > votosOpp ? 'prop' : votosOpp > votosProp ? 'opp' : (totProp >= totOpp ? 'prop' : 'opp');
  const oradores = [], replicas = [];
  for (const lado of ['prop', 'opp']) {
    const o = d.oradores[lado];
    o.s.forEach((id, i) => oradores.push({ id, equipo: d[lado], lado, pos: i + 1, puntos: r2(prom(bs.map(b => b[lado].puntos[i].t))) }));
    replicas.push({ id: o.r, equipo: d[lado], lado, puntos: r2(prom(bs.map(b => b[lado].rep.t))) });
  }
  return { ganador, prop: r2(totProp), opp: r2(totOpp), margen: r2(Math.abs(totProp - totOpp)), votos: `${Math.max(votosProp, votosOpp)}-${Math.min(votosProp, votosOpp)}`, oradores, replicas, n: bs.length };
}
const rondasVisibles = publico => S.rondas.filter(r => !(publico && r.silenciosa));
function standings(publico = false) {
  const filas = {};
  for (const e of S.equipos) if (!e.swing) filas[e.id] = { e, v: 0, pts: 0, margen: 0, jugados: 0, hist: [] };
  for (const r of rondasVisibles(publico)) for (const d of r.debates) {
    const res = resultado(d); if (!res) continue;
    for (const lado of ['prop', 'opp']) {
      const f = filas[d[lado]]; if (!f) continue;
      const gano = res.ganador === lado;
      f.v += gano ? 1 : 0; f.pts += lado === 'prop' ? res.prop : res.opp; f.margen += gano ? res.margen : -res.margen; f.jugados++;
      f.hist.push({ r: r.numero, ronda: r.nombre, gano, lado, rival: d[lado === 'prop' ? 'opp' : 'prop'], pts: lado === 'prop' ? res.prop : res.opp, margen: res.margen });
    }
  }
  return Object.values(filas).sort((a, b) => b.v - a.v || b.pts - a.pts || b.margen - a.margen || a.e.nombre.localeCompare(b.e.nombre));
}
function tablaOradores(publico = false) {
  const m = {};
  for (const r of rondasVisibles(publico)) for (const d of r.debates) {
    const res = resultado(d); if (!res) continue;
    for (const o of res.oradores) {
      const eq = eqPorId(o.equipo); if (!eq || eq.swing || !o.id) continue;
      (m[o.id] ||= { id: o.id, equipo: o.equipo, puntos: [], replicas: [] }).puntos.push(o.puntos);
    }
    for (const o of res.replicas) {
      const eq = eqPorId(o.equipo); if (!eq || eq.swing || !o.id) continue;
      (m[o.id] ||= { id: o.id, equipo: o.equipo, puntos: [], replicas: [] }).replicas.push(o.puntos);
    }
  }
  return Object.values(m);
}
function rankingOradores(replicas = false, publico = false, dist = '') {
  return tablaOradores(publico).filter(o => (replicas ? o.replicas.length : o.puntos.length) && (!dist || (eqPorId(o.equipo) || {}).distrito === dist))
    .map(o => { const arr = replicas ? o.replicas : o.puntos; const mm = miembroPorId(o.id); return { ...o, nombre: mm ? mm.m.nombre : '—', arr, total: suma(arr), prom: prom(arr) }; })
    .sort((a, b) => b.prom - a.prom || b.total - a.total);
}

// ---------------- asistencia ----------------
const asistenciaDe = pid => (S.asistencia[pid] ||= { equipos: {}, miembros: {}, jueces: {} });
function pctAsistencia(tipo, id) {
  if (!S.practicas.length) return null;
  return Math.round(S.practicas.filter(p => asistenciaDe(p.id)[tipo][id]).length / S.practicas.length * 100);
}

// ---------------- emparejamientos ----------------
function enfrentados(excluirRonda) {
  const set = new Set();
  for (const r of S.rondas) if (r.id !== excluirRonda) for (const d of r.debates) if (d.prop && d.opp) { set.add(d.prop + '|' + d.opp); set.add(d.opp + '|' + d.prop); }
  return set;
}
const vecesProp = (id, excluirRonda) => suma(S.rondas.filter(r => r.id !== excluirRonda).map(r => r.debates.filter(d => d.prop === id).length));
function generarDraw(r) {
  const a = asistenciaDe(r.practicaId);
  const equipos = S.equipos.filter(e => a.equipos[e.id] && !e.swing);
  const swings = S.equipos.filter(e => a.equipos[e.id] && e.swing);
  const previos = enfrentados(r.id);
  const hayResultados = S.rondas.some(x => x.id !== r.id && x.debates.some(d => resultado(d)));
  let orden;
  if (!hayResultados) orden = mezclar(equipos);
  else {
    const pos = new Map(standings().map((f, i) => [f.e.id, i]));
    orden = mezclar(equipos).sort((x, y) => (pos.get(x.id) ?? 999) - (pos.get(y.id) ?? 999));
  }
  r.descansos = [];
  if (orden.length % 2 === 1) {
    if (swings.length) orden.push(swings[0]);
    else {
      const ya = new Set(S.rondas.filter(x => x.id !== r.id).flatMap(x => x.descansos || []));
      let i = orden.length - 1; while (i >= 0 && ya.has(orden[i].id)) i--; if (i < 0) i = orden.length - 1;
      r.descansos.push(orden[i].id); orden.splice(i, 1);
    }
  }
  const pares = [], lista = [...orden];
  while (lista.length > 1) {
    const x = lista.shift();
    let i = lista.findIndex(y => !previos.has(x.id + '|' + y.id) && x.centro !== y.centro);
    if (i < 0) i = lista.findIndex(y => !previos.has(x.id + '|' + y.id));
    if (i < 0) i = 0;
    pares.push([x, lista.splice(i, 1)[0]]);
  }
  const jueces = mezclar(S.jueces.filter(j => a.jueces[j.id]));
  const porSala = S.torneo.jueces === 'panel' && jueces.length >= pares.length * 3 ? 3 : 1;
  r.debates = pares.map(([x, y], i) => {
    const px = vecesProp(x.id, r.id), py = vecesProp(y.id, r.id);
    let prop = x, opp = y;
    if (px > py || (px === py && Math.random() < 0.5)) { prop = y; opp = x; }
    return { id: uid('d'), aula: S.torneo.aulas[i] || 'Sala ' + (i + 1), prop: prop.id, opp: opp.id, jueces: [], boletas: {}, oradores: null };
  });
  for (const d of r.debates) {
    const centros = [eqPorId(d.prop).centro, eqPorId(d.opp).centro];
    for (let k = 0; k < porSala && jueces.length; k++) {
      let i = jueces.findIndex(j => !centros.includes(j.centro)); if (i < 0) i = 0;
      d.jueces.push(jueces.splice(i, 1)[0].id);
    }
  }
  r.drawPublicado = false;
}
function alertasDraw(r) {
  const out = [], previos = enfrentados(r.id), conteo = {};
  for (const d of r.debates) {
    [d.prop, d.opp].forEach(x => { if (x) conteo[x] = (conteo[x] || 0) + 1; });
    if (d.prop && d.opp && previos.has(d.prop + '|' + d.opp)) out.push([d.id, 'Revancha: ya se enfrentaron']);
    const p = eqPorId(d.prop), o = eqPorId(d.opp);
    if (p && o && p.centro === o.centro) out.push([d.id, 'Mismo centro educativo']);
    for (const j of d.jueces) { const jz = juezPorId(j); if (jz && jz.centro && [p && p.centro, o && o.centro].includes(jz.centro)) out.push([d.id, `${jz.nombre.split(' ')[0]} es del mismo centro`]); }
    if (!d.prop || !d.opp) out.push([d.id, 'Falta un equipo']);
  }
  for (const [x, n] of Object.entries(conteo)) if (n > 1) out.push([null, `${nombreEq(x)} aparece ${n} veces`]);
  return out;
}
function estadoRonda(r) {
  if (!r.debates.length) return 0;
  if (r.debates.every(completo)) return 3;
  if (r.mocionPublicada || r.debates.some(d => boletasDe(d).length)) return 2;
  return 1;
}
const PASOS_RONDA = ['Sin emparejar', 'Emparejada', 'En debate', 'Cerrada'];

// ---------------- cronómetro ----------------
let sonidoListo = null;
function campana(veces = 1) {
  try {
    sonidoListo ||= new (window.AudioContext || window.webkitAudioContext)();
    const ctx = sonidoListo;
    for (let i = 0; i < veces; i++) {
      const t0 = ctx.currentTime + i * 0.45;
      for (const [f, g] of [[880, .35], [1760, .12], [2640, .06]]) {
        const o = ctx.createOscillator(), v = ctx.createGain();
        o.frequency.value = f; o.type = 'sine';
        v.gain.setValueAtTime(g, t0); v.gain.exponentialRampToValueAtTime(0.0001, t0 + 1.2);
        o.connect(v).connect(ctx.destination); o.start(t0); o.stop(t0 + 1.25);
      }
    }
  } catch (e) { /* sin audio */ }
}
const transcurrido = c => c.acumulado + (c.corriendo && c.inicio ? (Date.now() - c.inicio) / 1000 : 0);
function marcasCrono(c) {
  const t = S.torneo.tiempos;
  if (c.tipo === 'prep') return [[c.duracion - 300, 1], [c.duracion, 2]];
  if (c.tipo === 'replica') return [[c.duracion - 60, 1], [c.duracion, 2], [c.duracion + t.gracia, 3]];
  return [[t.protegido, 1], [c.duracion - t.protegido, 1], [c.duracion, 2], [c.duracion + t.gracia, 3]];
}
function estadoCrono(c) {
  const t = S.torneo.tiempos, e = transcurrido(c);
  if (c.tipo === 'prep') return e >= c.duracion ? ['fin', 'Se acabó la preparación'] : ['', 'Preparación en curso'];
  if (e > c.duracion + t.gracia) return ['fin', 'Tiempo excedido'];
  if (e > c.duracion) return ['fin', 'Tiempo de gracia'];
  if (c.tipo === 'replica') return ['poi', 'Réplica · sin Puntos de Información'];
  if (e < t.protegido || e > c.duracion - t.protegido) return ['poi', 'Tiempo protegido · sin POI'];
  return ['ok', 'Se aceptan Puntos de Información'];
}
let ultimoTranscurrido = 0;
const ANILLO = 2 * Math.PI * 140;
setInterval(() => {
  const c = S.crono; const e = transcurrido(c);
  const esControl = typeof rutaActual === 'function' && rutaActual()[0] === 'cronometro';
  if (esControl && c.corriendo) for (const [m, n] of marcasCrono(c)) if (m > 0 && ultimoTranscurrido < m && e >= m) campana(n);
  ultimoTranscurrido = e;
  const [cls, txt] = estadoCrono(c);
  for (const el of $$('[data-reloj]')) {
    el.textContent = el.dataset.reloj === 'restante' || c.tipo === 'prep' ? mmss(c.duracion - e) : mmss(e);
    el.dataset.estado = cls;
  }
  for (const el of $$('[data-estado-crono]')) { el.textContent = txt; el.dataset.estado = cls; }
  for (const el of $$('[data-anillo]')) {
    const f = Math.min(1, c.duracion ? e / c.duracion : 0);
    el.style.strokeDashoffset = String(ANILLO * (1 - f)); el.dataset.estado = cls;
  }
  for (const el of $$('[data-barra-crono]')) el.style.width = Math.min(100, c.duracion ? e / c.duracion * 100 : 0) + '%';
}, 200);
// ronda y sala que se están debatiendo ahora (la que se proyecta)
const rondaEnCurso = () => rondaPorId(S.publico.rondaId) || [...S.rondas].reverse().find(x => x.drawPublicado || x.mocionPublicada);
const salaEnPantalla = r => r && r.debates.length ? (r.debates.find(d => d.id === S.publico.salaId) || r.debates[0]) : null;
function debatientesDe(r, eid) {
  const e = eqPorId(eid); if (!e) return [];
  const a = r && r.practicaId ? (S.asistencia || {})[r.practicaId] : null;
  const pres = a ? e.miembros.filter(m => a.miembros && a.miembros[m.id]) : [];
  return pres.length ? pres : e.miembros;
}
const cronoActivo = () => S.crono.corriendo || S.crono.acumulado > 0;
function ponerCrono(indice, tipo, etiqueta, duracion, lado = '') {
  S.crono = { indice, etiqueta, tipo, lado, duracion, inicio: null, acumulado: 0, corriendo: false }; ultimoTranscurrido = 0;
}

// ---------------- exportaciones ----------------
function hojasLibro() {
  const st = standings();
  const hojas = {
    'Tabla de equipos': [['#', 'Equipo', 'Centro', 'Distrito', 'Victorias', 'Puntos', 'Margen', 'Debates'], ...st.map((f, i) => [i + 1, f.e.nombre, f.e.centro, f.e.distrito, f.v, r2(f.pts), r2(f.margen), f.jugados])],
    'Oradores': [['#', 'Orador', 'Equipo', 'Discursos', 'Promedio', 'Total'], ...rankingOradores(false).map((o, i) => [i + 1, o.nombre, nombreEq(o.equipo), o.arr.length, r2(o.prom), r2(o.total)])],
    'Réplicas': [['#', 'Orador', 'Equipo', 'Réplicas', 'Promedio', 'Total'], ...rankingOradores(true).map((o, i) => [i + 1, o.nombre, nombreEq(o.equipo), o.arr.length, r2(o.prom), r2(o.total)])],
    'Resultados': [['Ronda', 'Sala', 'Proposición', 'Puntos Prop.', 'Oposición', 'Puntos Op.', 'Ganador', 'Margen', 'Jueces', 'Moción'],
      ...S.rondas.flatMap(r => r.debates.map(d => { const res = resultado(d); return [r.nombre, d.aula, nombreEq(d.prop), res ? res.prop : '', nombreEq(d.opp), res ? res.opp : '', res ? nombreEq(d[res.ganador]) : 'Pendiente', res ? res.margen : '', d.jueces.map(j => (juezPorId(j) || {}).nombre).join(', '), r.mocion || '']; }))],
    'Puntajes por orador': [['Ronda', 'Sala', 'Equipo', 'Postura', 'Posición', 'Orador', 'Juez', 'Contenido', 'Estilo', 'Estrategia', 'Total'],
      ...S.rondas.flatMap(r => r.debates.flatMap(d => Object.entries(d.boletas).flatMap(([jid, b]) => ['prop', 'opp'].flatMap(l => [...b[l].puntos.map((p, i) => [i + 1, p, d.oradores[l].s[i]]), ['Réplica', b[l].rep, d.oradores[l].r]].map(([pos, p, oid]) =>
        [r.nombre, d.aula, nombreEq(d[l]), l === 'prop' ? 'Proposición' : 'Oposición', pos, (miembroPorId(oid) || { m: {} }).m.nombre, jid === 'tab' ? 'Mesa' : (juezPorId(jid) || {}).nombre, p.c ?? '', p.e ?? '', p.s ?? '', p.t])))))],
    'Asistencia': [['Equipo', 'Integrante', ...S.practicas.map(p => `${p.nombre} (${p.fecha})`), '% asistencia'],
      ...S.equipos.flatMap(e => [[e.nombre, '(equipo)', ...S.practicas.map(p => asistenciaDe(p.id).equipos[e.id] ? 'Presente' : 'Ausente'), (pctAsistencia('equipos', e.id) ?? 0) + '%'],
        ...e.miembros.map(m => [e.nombre, m.nombre, ...S.practicas.map(p => asistenciaDe(p.id).miembros[m.id] ? 'Presente' : 'Ausente'), (pctAsistencia('miembros', m.id) ?? 0) + '%'])])],
    'Equipos': [['Equipo', 'Centro', 'Distrito', 'Comodín', 'Integrante', 'Curso', 'Team manager'], ...S.equipos.flatMap(e => e.miembros.map(m => [e.nombre, e.centro, e.distrito, e.swing ? 'Sí' : 'No', m.nombre, m.curso, e.manager]))],
    'Jueces': [['Juez', 'Centro', 'Salas juzgadas', '% asistencia'], ...S.jueces.map(j => [j.nombre, j.centro, suma(S.rondas.map(r => r.debates.filter(d => d.jueces.includes(j.id)).length)), (pctAsistencia('jueces', j.id) ?? 0) + '%'])],
    'Mociones': [['Moción', 'Infoslide', 'Tema', 'Usada en'], ...S.mociones.map(m => [m.texto, m.info, m.tema, m.usada ? (rondaPorId(m.usada) || {}).nombre || '' : ''])],
  };
  return hojas;
}
function exportarExcel(soloHoja) {
  const hojas = hojasLibro();
  const sel = soloHoja ? { [soloHoja]: hojas[soloHoja] } : hojas;
  const nombre = `CELIDER-${soloHoja ? soloHoja.replace(/\s+/g, '-') : 'torneo-completo'}-${hoyISO()}`;
  if (window.XLSX) {
    const libro = XLSX.utils.book_new();
    for (const [n, filas] of Object.entries(sel)) {
      const h = XLSX.utils.aoa_to_sheet(filas);
      h['!cols'] = filas[0].map((_, i) => ({ wch: Math.min(48, Math.max(8, ...filas.map(f => String(f[i] ?? '').length + 2))) }));
      XLSX.utils.book_append_sheet(libro, h, n.slice(0, 31));
    }
    XLSX.writeFile(libro, nombre + '.xlsx');
  } else {
    for (const [n, filas] of Object.entries(sel)) descargar(`${nombre}-${n}.csv`, csv(filas), 'text/csv');
    toast('Sin internet: se descargó en CSV (también abre en Excel)');
  }
  registrar(`Exportó ${soloHoja || 'el libro completo'} a Excel`, 'export');
}
