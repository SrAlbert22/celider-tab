/* CELIDER Tab — controlador: rutas, acciones, atajos, arrastrar y soltar, impresión. */
'use strict';

// ---------------- tema ----------------
function aplicarTema(t) { document.documentElement.dataset.tema = t; try { localStorage.setItem('celider-tema', t); } catch (e) { /* sin almacenamiento */ } }
try { aplicarTema(localStorage.getItem('celider-tema') || 'oscuro'); } catch (e) { aplicarTema('oscuro'); }

// ---------------- render ----------------
const VISTAS = { inicio: vInicio, equipos: vEquipos, asistencia: vAsistencia, jueces: vJueces, mociones: vMociones, rondas: vRondas, ronda: vRonda, boleta: vBoleta, cronometro: vCronometro, tablas: vTablas, eliminatorias: vEliminatorias, exportar: vExportar, juez: vJuez, ajustes: vAjustes };
const raiz = document.getElementById('raiz');
const CAMPOS_BUSQUEDA = ['buscar', 'buscarJuez', 'buscarMocion', 'buscarVivo'];
function render() {
  const [ruta, ...args] = rutaActual();
  if (ruta === 'publico') { document.body.className = 'publico'; raiz.innerHTML = vPublico(); return; }
  document.body.className = '';
  const act = document.activeElement, foco = act && act.dataset && CAMPOS_BUSQUEDA.includes(act.dataset.i) ? [act.dataset.i, act.selectionStart] : null;
  const portal = ruta === 'vivo' || ruta === 'j' || ruta === 'entrar' || MODO !== 'admin';
  if (portal) {
    raiz.innerHTML = (ruta === 'j' ? vPortalJuez(...args) : ruta === 'vivo' ? vVivo(...args) : MODO === 'admin' ? vVivo() : vEntrar()) + capa();
    if (ruta === 'j' && args[1] === 'boleta') recalcBoleta();
    if (foco) { const n = $(`[data-i="${foco[0]}"]`); if (n) { n.focus(); n.setSelectionRange(foco[1], foco[1]); } }
    return;
  }
  let migas = '';
  if (ruta === 'ronda' || ruta === 'boleta') { const r = rondaPorId(args[0]); migas = `<a href="#rondas">Rondas</a><span class="tenue">/</span><b>${esc(r ? r.nombre : '')}</b>${ruta === 'boleta' ? '<span class="tenue">/</span><b>Boleta</b>' : ''}`; }
  if (ruta === 'juez' && args[0]) migas = `<a href="#juez">Vista de juez</a><span class="tenue">/</span><b>${esc((juezPorId(args[0]) || {}).nombre || '')}</b>`;
  raiz.innerHTML = marco(ruta, (VISTAS[ruta] || vInicio)(...args), migas);
  if (ruta === 'boleta') recalcBoleta();
  if (foco) { const n = $(`[data-i="${foco[0]}"]`); if (n) { n.focus(); n.setSelectionRange(foco[1], foco[1]); } }
  if (ui.capa && ui.capa.t === 'paleta') enfocarPaleta();
  pintarEstadoNube();
}
function cambio(sinDeshacer) { guardar(sinDeshacer); render(); }
let rutaPrevia = '', rutaVista = location.hash;
window.addEventListener('hashchange', async () => {
  rutaPrevia = rutaVista; rutaVista = location.hash; ui.menu = false; ui.capa = null; ui.editSala = null;
  const [ruta, token] = rutaActual();
  if (sb && ruta === 'j' && token && (!JUEZ || JUEZ.token !== token)) { render(); await entrarJuez(token); }
  render(); window.scrollTo(0, 0);
});
const vueltaBoleta = rid => MODO !== 'admin' && JUEZ ? '#j/' + JUEZ.token : rutaPrevia.startsWith('#juez/') ? rutaPrevia : '#ronda/' + rid;
const enEdicion = () => rutaActual()[0] === 'boleta' || (rutaActual()[0] === 'j' && rutaActual()[2] === 'boleta') || ui.capa || (document.activeElement && ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName));
window.addEventListener('storage', e => {
  if (e.key !== CLAVE || MODO !== 'admin' || sb) return;
  S = cargar(); ultimoGuardado = JSON.stringify(S);
  if (rutaActual()[0] === 'publico' || !enEdicion()) render();
});
// rotación de escenas en la pantalla pública
setInterval(() => {
  if (rutaActual()[0] !== 'publico') return;
  const n = escenasPublico().length;
  if (n > 1 && Date.now() - ultimoCambioEscena > 12000) { escenaPub = (escenaPub + 1) % n; ultimoCambioEscena = Date.now(); render(); }
}, 1000);

// ---------------- impresión ----------------
function imprimir(html, horizontal = false) {
  const cont = $('#impresion');
  cont.innerHTML = `<style>@page{size:A4 ${horizontal ? 'landscape' : 'portrait'};margin:12mm}</style>` + html;
  document.body.classList.add('imprimiendo');
  const fin = () => { document.body.classList.remove('imprimiendo'); window.removeEventListener('afterprint', fin); };
  window.addEventListener('afterprint', fin);
  setTimeout(() => window.print(), 300);
}
const enc = (titulo, sub = '') => `<div class="enc"><img src="img/celider-navy.png" alt=""><div><h1>${titulo}</h1><small>${esc(S.torneo.nombre)}${sub ? ' · ' + sub : ''} · ${new Date().toLocaleDateString('es-DO', { day: 'numeric', month: 'long', year: 'numeric' })}</small></div></div>`;
function hojaTablas() {
  const st = standings(true).filter(f => f.jugados), ors = rankingOradores(false, true), reps = rankingOradores(true, true);
  return `<div class="hoja">${enc('Tabla de equipos', 'victorias, puntos, margen')}<table><thead><tr><th>#</th><th>Equipo</th><th>Distrito</th><th>V</th><th>Puntos</th><th>Margen</th><th>Debates</th></tr></thead><tbody>${st.map((f, i) => `<tr><td>${i + 1}</td><td><b>${esc(f.e.nombre)}</b></td><td>${esc(f.e.distrito)}</td><td>${f.v}</td><td>${fmt(f.pts)}</td><td>${fmt(f.margen)}</td><td>${f.jugados}</td></tr>`).join('')}</tbody></table></div>
  <div class="hoja">${enc('Ranking de oradores', 'promedio de discursos 60–80')}<table><thead><tr><th>#</th><th>Orador</th><th>Equipo</th><th>Discursos</th><th>Promedio</th><th>Total</th></tr></thead><tbody>${ors.map((o, i) => `<tr><td>${i + 1}</td><td><b>${esc(o.nombre)}</b></td><td>${esc(nombreEq(o.equipo))}</td><td>${o.arr.length}</td><td>${fmt(o.prom)}</td><td>${fmt(o.total)}</td></tr>`).join('')}</tbody></table>
  <h3 style="margin:16px 0 8px">Réplicas</h3><table><thead><tr><th>#</th><th>Orador</th><th>Equipo</th><th>Réplicas</th><th>Promedio</th></tr></thead><tbody>${reps.slice(0, 15).map((o, i) => `<tr><td>${i + 1}</td><td>${esc(o.nombre)}</td><td>${esc(nombreEq(o.equipo))}</td><td>${o.arr.length}</td><td>${fmt(o.prom)}</td></tr>`).join('')}</tbody></table></div>`;
}
function hojaBoleta(r, d) {
  const jueces = d.jueces.map(j => (juezPorId(j) || {}).nombre).filter(Boolean).join(', ') || '________________';
  const lado = l => { const e = eqPorId(d[l]);
    return `<h3 style="margin:12px 0 6px;color:${l === 'prop' ? '#1f6feb' : '#e0365f'}">${l === 'prop' ? 'PROPOSICIÓN' : 'OPOSICIÓN'} · ${esc(e ? e.nombre : '')}</h3>
    <table><thead><tr><th style="width:34%">Orador</th><th>Contenido 24–32</th><th>Estilo 24–32</th><th>Estrategia 12–16</th><th>Total 60–80</th></tr></thead><tbody>
    ${[1, 2, 3].map(i => `<tr><td class="caja">${i}.º</td><td></td><td></td><td></td><td></td></tr>`).join('')}
    <tr><td class="caja">Réplica <small>(1.º o 2.º)</small></td><td style="color:#8a97ab">12–16</td><td style="color:#8a97ab">12–16</td><td style="color:#8a97ab">6–8</td><td style="color:#8a97ab">30–40</td></tr>
    <tr><td colspan="4" style="text-align:right"><b>TOTAL DEL EQUIPO</b></td><td></td></tr></tbody></table>
    <div style="font-size:10.5px;color:#56657d">Integrantes: ${e ? e.miembros.map(m => esc(m.nombre)).join(' · ') : ''}</div>`; };
  return `<div class="hoja">${enc('Boleta WSDC · ' + esc(d.aula), esc(r.nombre) + ' · Juez: ' + esc(jueces))}${lado('prop')}${lado('opp')}
    <table style="margin-top:14px"><tr><td style="width:55%;height:34px">Equipo ganador:</td><td>Margen:</td></tr><tr><td colspan="2" style="height:52px;vertical-align:bottom">Firma del juez:</td></tr></table>
    <p style="font-size:10px;color:#56657d;margin:6px 0 0">No hay empates. Contenido 40 %, Estilo 40 %, Estrategia 20 %.</p></div>`;
}
function hojaPuerta(r, d) {
  return `<div class="hoja"><div class="puerta"><div style="font-size:14px;letter-spacing:5px;font-weight:800;color:#56657d">${esc(r.nombre.toUpperCase())}</div><div class="aula">${esc(d.aula)}</div>
    <div class="eq">${esc(nombreEq(d.prop))}</div><div class="lado p">Proposición</div>
    <div style="font-family:var(--cond);font-size:28px;color:#8a97ab;margin:6mm 0">VS</div>
    <div class="eq" style="margin-top:0">${esc(nombreEq(d.opp))}</div><div class="lado o">Oposición</div>
    <div style="margin-top:10mm;font-size:15px">Juez: <b>${esc(d.jueces.map(j => (juezPorId(j) || {}).nombre).filter(Boolean).join(', ') || '—')}</b></div></div></div>`;
}
function diplomas() {
  const st = standings().filter(f => f.jugados), ors = rankingOradores(false), reps = rankingOradores(true);
  const u = S.elim.rondas[S.elim.rondas.length - 1], campeon = u && u.debates.length === 1 && u.debates[0].ganador ? u.debates[0][u.debates[0].ganador] : null;
  const lugares = ['Primer lugar', 'Segundo lugar', 'Tercer lugar'];
  const items = [];
  if (campeon) items.push(['Equipo campeón', nombreEq(campeon), (eqPorId(campeon) || {}).centro]);
  st.slice(0, 3).forEach((f, i) => items.push([`${lugares[i]} · fase preliminar`, f.e.nombre, `${f.v} victorias · ${fmt(f.pts)} puntos`]));
  ors.slice(0, 3).forEach((o, i) => items.push([`${i === 0 ? 'Mejor orador' : lugares[i] + ' · oradores'}`, o.nombre, `${nombreEq(o.equipo)} · promedio ${fmt(o.prom)}`]));
  if (reps[0]) items.push(['Mejor réplica', reps[0].nombre, `${nombreEq(reps[0].equipo)} · promedio ${fmt(reps[0].prom)}`]);
  return items.map(([tipo, quien, det]) => `<div class="hoja"><div class="diploma"><img src="img/celider-navy.png" alt=""><div class="tipo">Reconocimiento</div><h2>${esc(tipo)}</h2><div class="quien">${esc(quien)}</div>
    <p>${esc(det || '')}</p><p>${esc(S.torneo.nombre)} · Club Escolar de Liderazgo, Regional Educativa 17</p>
    <div class="firmas"><div>Coordinación CELIDER R17</div><div>Jurado del torneo</div></div></div></div>`).join('');
}

// ---------------- acciones ----------------
function buscarDebate(id) { for (const r of S.rondas) { const d = r.debates.find(x => x.id === id); if (d) return d; } return null; }
const rondaDeDebate = id => S.rondas.find(r => r.debates.some(d => d.id === id));
function abrirCapa(c) { ui.capa = c; render(); setTimeout(() => { const f = $('.velo [autofocus]'); if (f) f.focus(); }, 30); }
function cerrarCapa() { ui.capa = null; render(); }
const ACC = {
  menu() { ui.menu = !ui.menu; render(); },
  tema(el) { const t = el.dataset && el.dataset.v ? el.dataset.v : (document.documentElement.dataset.tema === 'claro' ? 'oscuro' : 'claro'); aplicarTema(t); render(); },
  deshacer() { deshacer(); },
  paleta() { paleta.q = ''; paleta.sel = 0; abrirCapa({ t: 'paleta' }); },
  cerrarCapa,
  filtroDist(el) { ui.filtroDist = el.dataset.v; render(); },
  vistaEq(el) { ui.vistaEq = el.dataset.v; render(); },
  nuevoEquipo() { abrirCapa({ t: 'equipo' }); },
  editarEquipo(el, ev) { ev && ev.stopPropagation(); abrirCapa({ t: 'equipo', id: el.dataset.id }); },
  perfilEquipo(el) { abrirCapa({ t: 'perfil', id: el.dataset.id }); },
  agregarIntegrante(el, ev) { ev && ev.stopPropagation(); ui.volverPerfil = ui.capa && ui.capa.t === 'perfil'; abrirCapa({ t: 'integrante', id: el.dataset.id }); },
  borrarEquipo(el) {
    const e = eqPorId(el.dataset.id);
    if (S.rondas.some(r => r.debates.some(d => d.prop === e.id || d.opp === e.id))) return toast('Ese equipo ya tiene debates; edítalo en vez de eliminarlo.', 'error');
    if (!confirm(`¿Eliminar el equipo ${e.nombre}?`)) return;
    S.equipos = S.equipos.filter(x => x !== e); registrar(`Eliminó el equipo ${e.nombre}`); ui.capa = null; cambio();
    toast('Equipo eliminado', '', ['Deshacer', deshacer]);
  },
  nuevoJuez() { abrirCapa({ t: 'juez' }); },
  editarJuez(el) { abrirCapa({ t: 'juez', id: el.dataset.id }); },
  borrarJuez(el) {
    const j = juezPorId(el.dataset.id); if (!confirm(`¿Quitar a ${j.nombre}?`)) return;
    S.jueces = S.jueces.filter(x => x !== j); S.rondas.forEach(r => r.debates.forEach(d => d.jueces = d.jueces.filter(x => x !== j.id)));
    cambio(); toast('Juez quitado', '', ['Deshacer', deshacer]);
  },
  managersJueces() {
    let n = 0;
    for (const e of S.equipos) if (e.manager && !S.jueces.some(j => j.nombre === e.manager)) { S.jueces.push({ id: uid('j'), nombre: e.manager, centro: e.centro }); n++; }
    registrar(`Agregó ${n} team managers como jueces`); cambio(); toast(`${n} jueces agregados`);
  },
  practica(el) { ui.practicaSel = el.dataset.id; render(); },
  nuevaPractica() {
    const fecha = ($('#fechaNueva') || {}).value || hoyISO();
    const p = { id: uid('p'), fecha, nombre: 'Práctica ' + (S.practicas.length + 1) };
    S.practicas.push(p); ui.practicaSel = p.id; ui.asisPest = 'pasar'; registrar(`Creó ${p.nombre} (${fecha})`);
    guardar(); if (rutaActual()[0] !== 'asistencia') location.hash = '#asistencia'; else render();
  },
  borrarPractica(el) {
    if (S.rondas.some(r => r.practicaId === el.dataset.id)) return toast('Hay rondas que usan esa práctica.', 'error');
    if (!confirm('¿Eliminar esta práctica y su asistencia?')) return;
    S.practicas = S.practicas.filter(p => p.id !== el.dataset.id); delete S.asistencia[el.dataset.id]; ui.practicaSel = null; cambio();
    toast('Práctica eliminada', '', ['Deshacer', deshacer]);
  },
  asisPest(el) { ui.asisPest = el.dataset.p; render(); },
  asisTodos(el) {
    const a = asistenciaDe(ui.practicaSel), v = el.dataset.v === '1';
    for (const e of S.equipos) { a.equipos[e.id] = v; for (const m of e.miembros) a.miembros[m.id] = v; }
    for (const j of S.jueces) a.jueces[j.id] = v;
    cambio();
  },
  asisDistrito(el) {
    const a = asistenciaDe(ui.practicaSel), v = el.dataset.v === '1';
    for (const e of S.equipos.filter(x => x.distrito === el.dataset.d)) { a.equipos[e.id] = v; for (const m of e.miembros) a.miembros[m.id] = v; }
    cambio();
  },
  rondaPest(el) { ui.rondaPest = el.dataset.p; render(); },
  generarDraw(el) {
    const r = rondaPorId(el.dataset.id);
    if (r.debates.some(d => boletasDe(d).length) && !confirm('Esta ronda ya tiene boletas. ¿Rehacer los emparejamientos y borrar sus resultados?')) return;
    const a = asistenciaDe(r.practicaId);
    if (S.equipos.filter(e => a.equipos[e.id] && !e.swing).length < 2) return toast('Marca al menos 2 equipos presentes en Asistencia.', 'error');
    generarDraw(r); registrar(`Emparejó ${r.nombre}: ${r.debates.length} salas`); cambio(); toast(`${r.debates.length} salas listas`, '', ['Deshacer', deshacer]);
  },
  agregarDebate(el) { const r = rondaPorId(el.dataset.id); const d = { id: uid('d'), aula: S.torneo.aulas[r.debates.length] || 'Sala ' + (r.debates.length + 1), prop: '', opp: '', jueces: [], boletas: {}, oradores: null }; r.debates.push(d); ui.editSala = d.id; cambio(); },
  editarSala(el) { ui.editSala = ui.editSala === el.dataset.d ? null : el.dataset.d; render(); },
  cambiarLados(el) { const d = buscarDebate(el.dataset.d); if (boletasDe(d).length && !confirm('Ya hay boletas en esta sala; se borrarán. ¿Seguir?')) return; [d.prop, d.opp] = [d.opp, d.prop]; d.boletas = {}; d.oradores = null; cambio(); },
  borrarDebate(el) { if (!confirm('¿Quitar esta sala?')) return; for (const r of S.rondas) r.debates = r.debates.filter(d => d.id !== el.dataset.d); cambio(); toast('Sala quitada', '', ['Deshacer', deshacer]); },
  publicarDraw(el) { const r = rondaPorId(el.dataset.id); r.drawPublicado = !r.drawPublicado; if (r.drawPublicado) { S.publico.rondaId = r.id; registrar(`Publicó las salas de ${r.nombre}`); } cambio(); },
  publicarMocion(el) {
    const r = rondaPorId(el.dataset.id); if (!r.mocion) return toast('Escribe la moción primero.', 'error');
    r.mocionPublicada = true; S.publico.rondaId = r.id;
    let m = S.mociones.find(x => x.texto === r.mocion);
    if (!m) { m = { id: uid('m'), texto: r.mocion, info: r.infoslide || '', tema: '' }; S.mociones.push(m); }
    m.usada = r.id;
    ponerCrono(-1, 'prep', 'Tiempo de preparación', S.torneo.tiempos.prep, 'prep'); S.crono.corriendo = true; S.crono.inicio = Date.now();
    registrar(`Publicó la moción de ${r.nombre}`); cambio(); toast('Moción en pantalla · preparación en marcha');
  },
  ocultarMocion(el) { rondaPorId(el.dataset.id).mocionPublicada = false; cambio(); },
  guardarMocionBanco(el) {
    const r = rondaPorId(el.dataset.id); if (!r.mocion) return toast('No hay moción escrita.', 'error');
    if (S.mociones.some(m => m.texto === r.mocion)) return toast('Esa moción ya está en el banco.');
    S.mociones.push({ id: uid('m'), texto: r.mocion, info: r.infoslide || '', tema: '', usada: r.id }); cambio(); toast('Guardada en el banco de mociones');
  },
  borrarRonda(el) { if (!confirm('¿Eliminar esta ronda con todos sus resultados?')) return; const r = rondaPorId(el.dataset.id); S.rondas = S.rondas.filter(x => x !== r); S.mociones.forEach(m => { if (m.usada === r.id) m.usada = null; }); registrar(`Eliminó ${r.nombre}`); guardar(); location.hash = '#rondas'; toast('Ronda eliminada', '', ['Deshacer', deshacer]); },
  modoBoleta(el) { const f = $('form[data-form=boleta]'); if (!f) return; guardarBorrador(f, el.dataset.m); render(); restaurarBorrador(); },
  async borrarBoleta(el) {
    const d = buscarDebate(el.dataset.d), r = rondaDeDebate(el.dataset.d); if (!confirm('¿Borrar esta boleta?')) return;
    if (sb && !(await boletaNube(r, d, el.dataset.j, null))) return;
    delete d.boletas[el.dataset.j]; if (!boletasDe(d).length) d.oradores = null; cambio(); toast('Boleta borrada');
  },
  salir() { if (confirm('¿Cerrar la sesión de administración en este equipo?')) salirAdmin(); },
  qrJuez(el) { abrirCapa({ t: 'qr', id: el.dataset.id }); },
  copiarEnlace(el) { const j = juezPorId(el.dataset.id); copiar(enlaceJuez(j), `Enlace de ${j.nombre.split(' ')[0]} copiado`); },
  copiarTodos() { asegurarTokens(); copiar(S.jueces.map(j => `${j.nombre}: ${enlaceJuez(j)}`).join('\n'), `${S.jueces.length} enlaces copiados`); },
  regenerarToken(el) { const j = juezPorId(el.dataset.id); if (!confirm(`¿Cambiar el enlace de ${j.nombre}? El anterior dejará de funcionar.`)) return; j.token = tokenNuevo(); cambio(); toast('Enlace nuevo listo; envíaselo otra vez'); },
  imprimirBoletaSala(el) { const r = rondaPorId(el.dataset.r); imprimir(hojaBoleta(r, r.debates.find(d => d.id === el.dataset.d))); },
  imprimirBoletas(el) { const r = rondaPorId(el.dataset.id); if (!r.debates.length) return toast('Esa ronda no tiene salas.', 'error'); imprimir(r.debates.map(d => hojaBoleta(r, d)).join('')); },
  imprimirPuertas(el) { const r = rondaPorId(el.dataset.id); if (!r.debates.length) return toast('Esa ronda no tiene salas.', 'error'); imprimir(r.debates.map(d => hojaPuerta(r, d)).join(''), true); },
  imprimirSalas(el) { const r = rondaPorId(el.dataset.id); imprimir(`<div class="hoja">${enc(esc(r.nombre) + ' · Salas', r.mocionPublicada ? esc(r.mocion) : '')}<table><thead><tr><th>Aula</th><th>Proposición</th><th>Oposición</th><th>Jueces</th></tr></thead><tbody>${r.debates.map(d => `<tr><td><b>${esc(d.aula)}</b></td><td>${esc(nombreEq(d.prop))}</td><td>${esc(nombreEq(d.opp))}</td><td>${esc(d.jueces.map(j => (juezPorId(j) || {}).nombre).join(', '))}</td></tr>`).join('')}</tbody></table>${(r.descansos || []).length ? `<p>Descansa: ${esc(r.descansos.map(nombreEq).join(', '))}</p>` : ''}</div>`); },
  imprimirTabla() { if (!standings().some(f => f.jugados)) return toast('Todavía no hay resultados para imprimir.', 'error'); imprimir(hojaTablas()); },
  imprimirDiplomas() { if (!standings().some(f => f.jugados)) return toast('Todavía no hay resultados para los diplomas.', 'error'); imprimir(diplomas(), true); registrar('Imprimió diplomas'); },
  imprimirAsistencia() {
    if (!S.practicas.length) return toast('Todavía no hay prácticas.', 'error');
    imprimir(`<div class="hoja">${enc('Reporte de asistencia', `${S.practicas.length} prácticas`)}<table><thead><tr><th>Equipo</th><th>Distrito</th><th>Asistencia</th><th>Integrantes</th></tr></thead><tbody>${S.equipos.map(e => `<tr><td><b>${esc(e.nombre)}</b></td><td>${esc(e.distrito)}</td><td>${pctAsistencia('equipos', e.id)}%</td><td style="font-size:10.5px">${e.miembros.map(m => `${esc(m.nombre)} (${pctAsistencia('miembros', m.id)}%)`).join(' · ')}</td></tr>`).join('')}</tbody></table></div>`);
  },
  expExcel(el) { exportarExcel(el.dataset && el.dataset.v ? el.dataset.v : undefined); guardar(); },
  exportarJSON() { descargar(`celider-tab-copia-${hoyISO()}.json`, JSON.stringify(S, null, 1), 'application/json'); toast('Copia descargada'); },
  cronoIniciar() { const c = S.crono; if (c.corriendo) { c.acumulado = transcurrido(c); c.corriendo = false; c.inicio = null; } else { c.corriendo = true; c.inicio = Date.now(); campana(0); } cambio(true); },
  cronoReiniciar() { const c = S.crono; ponerCrono(c.indice, c.tipo, c.etiqueta, c.duracion, c.lado); cambio(true); },
  cronoDiscurso(el) { const i = +el.dataset.i, [n, tipo, l] = DISCURSOS[i]; ponerCrono(i, tipo, n, S.torneo.tiempos[tipo], l); cambio(true); },
  cronoSiguiente() { const i = S.crono.tipo === 'prep' ? 0 : (S.crono.indice + 1) % DISCURSOS.length; const [n, tipo, l] = DISCURSOS[i]; ponerCrono(i, tipo, n, S.torneo.tiempos[tipo], l); cambio(true); },
  cronoPrep() { ponerCrono(-1, 'prep', 'Tiempo de preparación', S.torneo.tiempos.prep, 'prep'); cambio(true); },
  cronoAjuste(el) { const c = S.crono, d = Number(el.dataset.s) * (c.tipo === 'prep' ? -1 : 1); c.acumulado = Math.max(0, transcurrido(c) + d); if (c.corriendo) c.inicio = Date.now(); ultimoTranscurrido = c.acumulado; cambio(true); },
  campana() { campana(1); },
  pantallaCompleta() { const p = $('#relojPanel'); if (document.fullscreenElement) document.exitFullscreen(); else if (p && p.requestFullscreen) p.requestFullscreen(); },
  pestTabla(el) { ui.pestTabla = el.dataset.p; render(); },
  generarElim() {
    const n = S.torneo.breakSize, st = standings().filter(f => f.jugados);
    if (st.length < n) return toast(`Solo hay ${st.length} equipos con resultados.`, 'error');
    if (S.elim.rondas.length && !confirm('¿Rehacer el cuadro de eliminatorias?')) return;
    const orden = ordenSembrado(n), top = st.slice(0, n), debates = [];
    for (let i = 0; i < n; i += 2) { const sa = orden[i], sb = orden[i + 1]; debates.push({ a: top[sa - 1].e.id, b: top[sb - 1].e.id, sa, sb, prop: 'a', ganador: null }); }
    S.elim.rondas = [{ nombre: NOMBRES_ELIM[n], debates }]; registrar(`Armó el cuadro de ${NOMBRES_ELIM[n].toLowerCase()}`); cambio();
  },
  ganaElim(el) {
    const k = +el.dataset.k, j = +el.dataset.j, E = S.elim, d = E.rondas[k].debates[j];
    d.ganador = d.ganador === el.dataset.x ? null : el.dataset.x;
    E.rondas = E.rondas.slice(0, k + 1);
    const ro = E.rondas[k];
    if (ro.debates.length > 1 && ro.debates.every(x => x.ganador)) {
      const g = ro.debates.map(x => ({ id: x[x.ganador], s: x['s' + x.ganador] })), debates = [];
      for (let i = 0; i < g.length; i += 2) debates.push({ a: g[i].id, b: g[i + 1].id, sa: g[i].s, sb: g[i + 1].s, prop: g[i].s < g[i + 1].s ? 'a' : 'b', ganador: null });
      E.rondas.push({ nombre: NOMBRES_ELIM[g.length] || 'Ronda', debates });
    }
    if (ro.debates.length === 1 && d.ganador) { registrar(`${nombreEq(d[d.ganador])} es campeón`); toast(`${nombreEq(d[d.ganador])} es el campeón`); }
    cambio();
  },
  ladosElim(el) { const d = S.elim.rondas[+el.dataset.k].debates[+el.dataset.j]; d.prop = d.prop === 'a' ? 'b' : 'a'; cambio(); },
  publicarElim() { S.elim.publicado = !S.elim.publicado; cambio(); },
  nuevaMocion() { abrirCapa({ t: 'mocion' }); },
  editarMocion(el) { abrirCapa({ t: 'mocion', id: el.dataset.id }); },
  borrarMocion(el) { if (!confirm('¿Borrar esta moción del banco?')) return; S.mociones = S.mociones.filter(m => m.id !== el.dataset.id); cambio(); toast('Moción borrada', '', ['Deshacer', deshacer]); },
  copiarMocion(el) { const m = S.mociones.find(x => x.id === el.dataset.id); try { navigator.clipboard.writeText(m.texto); toast('Moción copiada'); } catch (e) { toast('No se pudo copiar', 'error'); } },
  importarMocionesRondas() { for (const r of S.rondas) if (r.mocion && !S.mociones.some(m => m.texto === r.mocion)) S.mociones.push({ id: uid('m'), texto: r.mocion, info: r.infoslide || '', tema: '', usada: r.id }); cambio(); },
  reiniciarTodo() { if (confirm('¿Seguro? Se borra todo: rondas, resultados, asistencia, jueces y mociones.') && confirm('Última confirmación: ¿reiniciar el torneo?')) { S = estadoInicial(); guardar(); location.hash = '#inicio'; render(); toast('Torneo reiniciado', '', ['Deshacer', deshacer]); } },
};

const CAMBIOS = {
  asisEquipo(el) { const a = asistenciaDe(ui.practicaSel), e = eqPorId(el.dataset.id); a.equipos[e.id] = el.checked; for (const m of e.miembros) a.miembros[m.id] = el.checked; cambio(); },
  asisMiembro(el) { const a = asistenciaDe(ui.practicaSel); a.miembros[el.dataset.id] = el.checked; if (el.checked) a.equipos[el.dataset.eq] = true; cambio(); },
  asisJuez(el) { asistenciaDe(ui.practicaSel).jueces[el.dataset.id] = el.checked; cambio(); },
  drawAula(el) { buscarDebate(el.dataset.d).aula = el.value.trim() || 'Sala'; guardar(); },
  drawEquipo(el) { const d = buscarDebate(el.dataset.d); d[el.dataset.lado] = el.value; d.boletas = {}; d.oradores = null; cambio(); },
  drawJuez(el) { const d = buscarDebate(el.dataset.d), k = +el.dataset.k; if (el.value) d.jueces[k] = el.value; else d.jueces.splice(k, 1); d.jueces = [...new Set(d.jueces.filter(Boolean))]; cambio(); },
  mocion(el) { rondaPorId(el.dataset.id).mocion = el.value.trim(); cambio(); },
  infoslide(el) { rondaPorId(el.dataset.id).infoslide = el.value.trim(); cambio(); },
  elegirMocion(el) {
    const r = rondaPorId(el.dataset.id), m = S.mociones.find(x => x.id === el.value); if (!m) return;
    S.mociones.forEach(x => { if (x.usada === r.id) x.usada = null; });
    r.mocion = m.texto; r.infoslide = m.info || ''; m.usada = r.id; cambio(); toast('Moción cargada desde el banco');
  },
  silenciosa(el) { rondaPorId(el.dataset.id).silenciosa = el.checked; cambio(); },
  verPublico(el) { ui.verPublico = el.checked; render(); },
  mostrarTabla(el) { S.publico.mostrarTabla = el.checked; cambio(); },
  salaPantalla(el) { S.publico.salaId = el.value; const r = rondaEnCurso(); if (r) S.publico.rondaId = r.id; cambio(true); },
  breakSize(el) { S.torneo.breakSize = +el.value; cambio(); },
  rondaExp(el) { ui.rondaExp = el.value; render(); },
  torneo(el) { S.torneo[el.dataset.k] = el.value; cambio(); },
  distrito(el) { S.torneo.distritos[+el.dataset.i].nombre = el.value.trim(); cambio(); },
  aulas(el) { S.torneo.aulas = el.value.split('\n').map(x => x.trim()).filter(Boolean); cambio(); },
  tiempo(el) {
    const k = el.dataset.k, v = S.torneo.tiempos[k], n = Math.max(0, Number(el.value) || 0);
    S.torneo.tiempos[k] = el.dataset.u === 'm' ? n * 60 + (v % 60) : Math.floor(v / 60) * 60 + Math.min(59, n);
    cambio();
  },
  importarJSON(el) {
    const f = el.files[0]; if (!f) return;
    f.text().then(t => { const d = JSON.parse(t); if (!d.equipos || !d.torneo) throw new Error(); if (confirm('Esto reemplaza todos los datos actuales. ¿Seguir?')) { S = migrar(d); cambio(); toast('Copia cargada', '', ['Deshacer', deshacer]); } }).catch(() => toast('Ese archivo no es una copia válida', 'error'));
  },
  importarCSV(el) {
    const f = el.files[0]; if (!f) return;
    f.text().then(t => {
      const filas = parseCSV(t.replace(/^﻿/, '')); filas.shift();
      let n = 0;
      for (const c of filas) {
        if (!c[0] || !c[0].trim()) continue;
        const integrantes = (c[4] || '').split('|').map(x => x.trim()).filter(Boolean), id = uid('e');
        S.equipos.push({ id, codigo: '', nombre: c[0].trim(), centro: (c[1] || c[0]).trim(), distrito: S.torneo.distritos.some(d => d.codigo === (c[2] || '').trim()) ? c[2].trim() : '17-01', swing: /^s[ií]/i.test(c[3] || ''), miembros: integrantes.slice(0, 5).map((x, i) => ({ id: id + 'm' + (i + 1), nombre: x, curso: '' })), manager: (c[5] || '').trim() });
        n++;
      }
      registrar(`Importó ${n} equipos`); cambio(); toast(`${n} equipos importados`, '', ['Deshacer', deshacer]);
    });
  },
};
function parseCSV(t) {
  const filas = []; let fila = [], campo = '', q = false;
  const l0 = t.split('\n')[0], sep = (l0.match(/;/g) || []).length > (l0.match(/,/g) || []).length ? ';' : ',';
  for (let i = 0; i < t.length; i++) {
    const ch = t[i];
    if (q) { if (ch === '"' && t[i + 1] === '"') { campo += '"'; i++; } else if (ch === '"') q = false; else campo += ch; }
    else if (ch === '"') q = true; else if (ch === sep) { fila.push(campo); campo = ''; }
    else if (ch === '\n' || ch === '\r') { if (ch === '\r' && t[i + 1] === '\n') i++; fila.push(campo); filas.push(fila); fila = []; campo = ''; }
    else campo += ch;
  }
  if (campo || fila.length) { fila.push(campo); filas.push(fila); }
  return filas;
}

// borrador de boleta al cambiar de modo (para no perder lo escrito)
function guardarBorrador(form, modo) {
  const b = leerBoleta(form), valores = {};
  for (const el of form.elements) if (el.tagName === 'SELECT') valores[el.name] = el.value;
  for (const l of ['prop', 'opp']) { (b[l].puntos || []).forEach((p, i) => { if (p.t != null) valores[`${l}-${i}-t`] = p.t; }); if (b[l].rep && b[l].rep.t != null) valores[`${l}-r-t`] = b[l].rep.t; }
  borrador = { clave: `${form.dataset.r}/${form.dataset.d}/${form.dataset.j}`, modo, valores };
}
function restaurarBorrador() {
  const form = $('form[data-form=boleta]'); if (!form || !borrador.valores) return;
  for (const [n, v] of Object.entries(borrador.valores)) if (form.elements[n]) form.elements[n].value = v;
  recalcBoleta();
}

function copiar(txt, aviso) {
  const hecho = () => toast(aviso);
  if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(txt).then(hecho, () => prompt('Copia este texto:', txt));
  else prompt('Copia este texto:', txt);
}
const FORMS = {
  async entrar(form) {
    const pin = new FormData(form).get('pin').trim(); if (!pin) return;
    if (await entrarAdmin(pin)) { toast('Bienvenido'); location.hash = '#inicio'; render(); }
  },
  async pin(form) {
    const fd = new FormData(form);
    const { error } = await sb.rpc('admin_cambiar_pin', { p_torneo: NUBE.torneo, p_pin: fd.get('actual'), p_nuevo: fd.get('nuevo') });
    if (error) return toast(/PIN incorrecto/.test(error.message) ? 'El PIN actual no es correcto' : error.message, 'error');
    PIN = fd.get('nuevo'); try { localStorage.setItem(CLAVE_PIN, PIN); } catch (e) { /* nada */ }
    form.reset(); toast('PIN cambiado');
  },
  equipo(form) {
    const fd = new FormData(form), id = form.dataset.id;
    const miembros = [0, 1, 2, 3, 4].map(i => ({ id: fd.get('id' + i), nombre: (fd.get('m' + i) || '').trim(), curso: (fd.get('c' + i) || '').trim() })).filter(m => m.nombre);
    if (miembros.length < 3 && !fd.get('swing')) return toast('Un equipo necesita mínimo 3 integrantes.', 'error');
    const datos = { nombre: fd.get('nombre').trim(), centro: fd.get('centro').trim(), distrito: fd.get('distrito'), swing: !!fd.get('swing'), manager: (fd.get('manager') || '').trim() };
    if (id) {
      const e = eqPorId(id); Object.assign(e, datos);
      e.miembros = miembros.map(m => ({ id: m.id || uid(id + 'm'), nombre: m.nombre, curso: m.curso }));
      registrar(`Editó el equipo ${e.nombre}`);
    } else {
      const nid = uid('e'); S.equipos.push({ id: nid, codigo: '', ...datos, miembros: miembros.map((m, i) => ({ id: nid + 'm' + (i + 1), nombre: m.nombre, curso: m.curso })) });
      registrar(`Agregó el equipo ${datos.nombre}`);
    }
    ui.capa = null; cambio(); toast('Equipo guardado');
  },
  integrante(form) {
    const fd = new FormData(form), e = eqPorId(form.dataset.id); if (!e) return;
    const nombre = (fd.get('nombre') || '').trim().replace(/\s+/g, ' '), curso = (fd.get('curso') || '').trim();
    if (!nombre) return toast('Escribe el nombre de la persona.', 'error');
    if (e.miembros.length >= 5) return toast('Este equipo ya tiene 5 integrantes.', 'error');
    if (e.miembros.some(m => m.nombre.toLowerCase() === nombre.toLowerCase())) return toast(`${nombre} ya está en este equipo.`, 'error');
    e.miembros.push({ id: uid(e.id + 'm'), nombre, curso });
    registrar(`Agregó a ${nombre} al equipo ${e.nombre}`);
    ui.otroIntegrante = !!fd.get('otro');
    if (ui.otroIntegrante && e.miembros.length < 5) { cambio(); toast(`${nombre} agregado a ${e.nombre}`); setTimeout(() => { const f = $('.velo [autofocus]'); if (f) f.focus(); }, 30); return; }
    ui.capa = ui.volverPerfil ? { t: 'perfil', id: e.id } : null; ui.volverPerfil = false; cambio(); toast(`${nombre} agregado a ${e.nombre}`);
  },
  juez(form) {
    const fd = new FormData(form), id = form.dataset.id, datos = { nombre: fd.get('nombre').trim(), centro: (fd.get('centro') || '').trim() };
    if (id) Object.assign(juezPorId(id), datos); else { S.jueces.push({ id: uid('j'), ...datos }); registrar(`Agregó al juez ${datos.nombre}`); }
    ui.capa = null; cambio(); toast('Juez guardado');
  },
  mocion(form) {
    const fd = new FormData(form), id = form.dataset.id, datos = { texto: fd.get('texto').trim(), info: (fd.get('info') || '').trim(), tema: fd.get('tema') || '' };
    if (id) Object.assign(S.mociones.find(m => m.id === id), datos); else { S.mociones.push({ id: uid('m'), ...datos, usada: null }); registrar('Agregó una moción al banco'); }
    ui.capa = null; cambio(); toast('Moción guardada');
  },
  ronda(form) {
    const fd = new FormData(form); if (!fd.get('practica')) return;
    const numero = Math.max(0, ...S.rondas.map(r => r.numero)) + 1;
    const r = { id: uid('r'), numero, nombre: fd.get('nombre').trim() || 'Ronda ' + numero, practicaId: fd.get('practica'), debates: [], descansos: [], mocion: '', infoslide: '', mocionPublicada: false, drawPublicado: false, silenciosa: false };
    S.rondas.push(r); registrar(`Creó ${r.nombre}`);
    if (fd.get('generar')) { const a = asistenciaDe(r.practicaId); if (S.equipos.filter(e => a.equipos[e.id] && !e.swing).length >= 2) generarDraw(r); else toast('No hay equipos presentes para emparejar todavía.', 'error'); }
    ui.rondaPest = 'salas'; guardar(); location.hash = '#ronda/' + r.id;
  },
  async boleta(form) {
    const b = leerBoleta(form);
    if (b.errores.length) { recalcBoleta(); return toast(b.errores[0], 'error'); }
    const r = rondaPorId(form.dataset.r), d = r.debates.find(x => x.id === form.dataset.d);
    if (form.dataset.enviando) return;
    const limpio = l => ({ puntos: b[l].puntos.map(p => ({ c: p.c, e: p.e, s: p.s, t: p.t })), rep: { c: b[l].rep.c, e: b[l].rep.e, s: b[l].rep.s, t: b[l].rep.t } });
    d.oradores = { prop: { s: b.prop.s, r: b.prop.r }, opp: { s: b.opp.s, r: b.opp.r } };
    d.boletas[form.dataset.j] = { ok: true, modo: b.modo, prop: limpio('prop'), opp: limpio('opp'), totalProp: b.prop.total, totalOpp: b.opp.total, ganador: b.prop.total > b.opp.total ? 'prop' : 'opp', fecha: Date.now() };
    if (sb) {
      form.dataset.enviando = '1'; const btn = form.querySelector('.marcador .btn.prim'); if (btn) btn.innerHTML = `${ico('reiniciar')}Enviando…`;
      const ok = await boletaNube(r, d, form.dataset.j, d.boletas[form.dataset.j]);
      delete form.dataset.enviando; if (!ok) { if (btn) btn.innerHTML = `${ico('check')}Guardar boleta`; return; }
    }
    if (MODO === 'admin') registrar(`Boleta de ${d.aula} (${r.nombre}): gana ${nombreEq(d[b.prop.total > b.opp.total ? 'prop' : 'opp'])}`);
    borrador = {}; ui.rondaPest = 'salas'; guardar(); toast(MODO === 'admin' ? 'Boleta guardada' : '¡Boleta enviada! Gracias.');
    location.hash = vueltaBoleta(r.id);
  },
};

// ---------------- paleta de búsqueda ----------------
function enfocarPaleta() { const i = $('#entradaPaleta'); if (i && document.activeElement !== i) { i.focus(); i.setSelectionRange(i.value.length, i.value.length); } }
function refrescarPaleta() { const v = $('[data-velo]'); if (v) { v.innerHTML = vPaleta(); enfocarPaleta(); const s = $('.paleta .item.sel'); if (s) s.scrollIntoView({ block: 'nearest' }); } }
function ejecutarPaleta(x) {
  if (!x) return;
  ui.capa = null;
  if (x.href) { if (x.nuevo) { window.open(x.href, '_blank'); render(); } else if (location.hash === x.href) render(); else location.hash = x.href; }
  else { render(); ACC[x.a]({ dataset: { id: x.id || '', v: '' } }); }
}

// ---------------- eventos ----------------
document.addEventListener('click', ev => {
  const velo = ev.target.closest('[data-velo]');
  if (velo && ev.target === velo) return cerrarCapa();
  const pp = ev.target.closest('[data-paso]');
  if (pp) {
    const inp = pp.parentElement.querySelector('input'), paso = Number(pp.dataset.paso);
    const v = inp.value === '' ? (paso > 0 ? Number(inp.min) : Number(inp.max)) : Math.min(Number(inp.max), Math.max(Number(inp.min), Number(inp.value) + paso));
    inp.value = v; recalcBoleta(); return;
  }
  const it = ev.target.closest('[data-paleta]');
  if (it) return ejecutarPaleta(resultadosPaleta()[+it.dataset.paleta]);
  const el = ev.target.closest('[data-a]'); if (!el) return;
  const f = ACC[el.dataset.a]; if (!f) return;
  if (el.tagName !== 'A') ev.preventDefault();
  if (el.dataset.a === 'editarEquipo') ev.stopPropagation();
  f(el, ev);
});
document.addEventListener('change', ev => { const el = ev.target.closest('[data-c]'); if (el && CAMBIOS[el.dataset.c]) CAMBIOS[el.dataset.c](el, ev); });
document.addEventListener('input', ev => {
  if (ev.target.id === 'entradaPaleta') { paleta.q = ev.target.value; paleta.sel = 0; return refrescarPaleta(); }
  const el = ev.target.closest('[data-i]'); if (!el) return;
  if (el.dataset.i === 'pt') return recalcBoleta();
  if (CAMPOS_BUSQUEDA.includes(el.dataset.i)) { ui[el.dataset.i] = el.value; render(); }
});
document.addEventListener('submit', ev => { const f = ev.target.closest('form[data-form]'); if (!f) return; ev.preventDefault(); FORMS[f.dataset.form](f); });
document.addEventListener('keydown', ev => {
  const tecleando = ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement && document.activeElement.tagName);
  if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === 'k') { ev.preventDefault(); return ACC.paleta(); }
  if (ev.key === 'Escape' && ui.capa) { ev.preventDefault(); return cerrarCapa(); }
  if (ui.capa && ui.capa.t === 'paleta') {
    const res = resultadosPaleta();
    if (ev.key === 'ArrowDown') { ev.preventDefault(); paleta.sel = Math.min(res.length - 1, paleta.sel + 1); return refrescarPaleta(); }
    if (ev.key === 'ArrowUp') { ev.preventDefault(); paleta.sel = Math.max(0, paleta.sel - 1); return refrescarPaleta(); }
    if (ev.key === 'Enter') { ev.preventDefault(); return ejecutarPaleta(res[paleta.sel]); }
    return;
  }
  if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === 'z' && !tecleando) { ev.preventDefault(); return deshacer(); }
  if (tecleando || ev.ctrlKey || ev.metaKey || ev.altKey) return;
  if (rutaActual()[0] === 'cronometro') {
    const mapa = { ' ': 'cronoIniciar', n: 'cronoSiguiente', r: 'cronoReiniciar', p: 'cronoPrep', f: 'pantallaCompleta', b: 'campana' };
    const a = mapa[ev.key.toLowerCase()]; if (a) { ev.preventDefault(); ACC[a]({ dataset: {} }); }
  }
});
// arrastrar equipos entre salas
let origenArrastre = null;
document.addEventListener('dragstart', ev => { const el = ev.target.closest('[data-drag]'); if (!el) return; origenArrastre = el.dataset.drag; el.classList.add('arrastrando'); ev.dataTransfer.effectAllowed = 'move'; ev.dataTransfer.setData('text/plain', origenArrastre); });
document.addEventListener('dragend', () => { origenArrastre = null; $$('.arrastrando,.encima').forEach(x => x.classList.remove('arrastrando', 'encima')); });
document.addEventListener('dragover', ev => { const el = ev.target.closest('[data-drop]'); if (!el || !origenArrastre) return; ev.preventDefault(); $$('.encima').forEach(x => x !== el && x.classList.remove('encima')); el.classList.add('encima'); });
document.addEventListener('drop', ev => {
  const el = ev.target.closest('[data-drop]'); if (!el || !origenArrastre) return; ev.preventDefault();
  const [d1, l1] = origenArrastre.split('|'), [d2, l2] = el.dataset.drop.split('|');
  if (d1 === d2 && l1 === l2) return;
  const a = buscarDebate(d1), b = buscarDebate(d2);
  if ((boletasDe(a).length || boletasDe(b).length) && !confirm('Alguna de esas salas ya tiene boletas; se borrarán. ¿Seguir?')) return;
  [a[l1], b[l2]] = [b[l2], a[l1]];
  for (const d of new Set([a, b])) { d.boletas = {}; d.oradores = null; }
  cambio(); toast('Equipos intercambiados', '', ['Deshacer', deshacer]);
});

iniciarNube();
