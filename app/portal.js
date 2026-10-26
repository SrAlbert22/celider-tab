/* CELIDER Tab — portal en vivo (público), portal del juez y acceso de administración. */
'use strict';

const PESTANAS_VIVO = [['salas', 'rondas', 'Salas'], ['equipos', 'tablas', 'Equipos'], ['oradores', 'microfono', 'Oradores'], ['replicas', 'reiniciar', 'Réplicas'], ['asistencia', 'asistencia', 'Asistencia'], ['eliminatorias', 'eliminatorias', 'Eliminatorias']];
ui.buscarVivo = ui.buscarVivo || '';

function cabezaPortal(extra = '') {
  return `<header class="portal-cab"><div class="marca"><div class="sello"></div><div><b>CELIDER TAB</b><small>${esc(S.torneo.nombre)}</small></div></div>
    <span class="vivo" title="Se actualiza solo"><i></i>En vivo</span>${extra}
    <button class="btn icono fant" data-a="tema" title="Cambiar tema">${ico(document.documentElement.dataset.tema === 'claro' ? 'luna' : 'sol')}</button></header>`;
}
function rondaVisible() { return [...S.rondas].reverse().find(r => r.debates.length); }

// ---------------- portal público ----------------
function vVivo(tab = 'salas', extra) {
  const pest = PESTANAS_VIVO.some(p => p[0] === tab) ? tab : 'salas';
  let cuerpo = '';
  if (pest === 'salas') cuerpo = vivoSalas(extra);
  else if (pest === 'equipos') {
    const st = standings(true), hay = st.some(f => f.jugados);
    cuerpo = hay ? podio(st.slice(0, 3).map(f => ({ av: avEq(f.e, 'g'), nombre: f.e.nombre, dato: `${f.v} V · ${fmt(f.pts)} pts` }))) + `<div class="tabla"><table><thead><tr><th>#</th><th>Equipo</th><th class="n">V</th><th class="n">Puntos</th><th class="n ocultable">Margen</th><th class="ocultable">Rondas</th></tr></thead><tbody>
      ${st.map((f, i) => `<tr><td><span class="rk ${i < 3 && f.jugados ? 'r' + (i + 1) : ''}">${i + 1}</span></td><td><div class="celda-eq">${avEq(f.e, 'p')}<div><b>${esc(f.e.nombre)}</b><small>${esc(nombreDist(f.e.distrito))}</small></div></div></td><td class="n" style="font-weight:700;font-size:16px">${f.v}</td><td class="n">${fmt(f.pts)}</td><td class="n ocultable">${f.margen > 0 ? '+' : ''}${fmt(f.margen)}</td><td class="ocultable" style="white-space:nowrap">${f.hist.map(h => `<span class="vd ${h.gano ? 'v' : 'd'}">${h.gano ? 'V' : 'D'}</span>`).join('')}</td></tr>`).join('')}</tbody></table></div>`
      : `<div class="panel">${vacio('tablas', 'La tabla aparecerá con los primeros resultados')}</div>`;
  } else if (pest === 'oradores' || pest === 'replicas') {
    const rep = pest === 'replicas', filas = rankingOradores(rep, true);
    cuerpo = filas.length ? (filas.length >= 3 ? podio(filas.slice(0, 3).map(o => ({ av: `<div class="av g persona">${esc(inicialesPersona(o.nombre))}</div>`, nombre: o.nombre, dato: `${fmt(o.prom)} de promedio` }))) : '') +
      `<div class="tabla"><table><thead><tr><th>#</th><th>${rep ? 'Orador de réplica' : 'Orador'}</th><th class="ocultable">Equipo</th><th class="n">Prom.</th><th class="n">${rep ? 'Rép.' : 'Disc.'}</th></tr></thead><tbody>
      ${filas.map((o, i) => `<tr><td><span class="rk ${i < 3 ? 'r' + (i + 1) : ''}">${i + 1}</span></td><td><b>${esc(o.nombre)}</b><div class="chico-txt">${esc(nombreEq(o.equipo))}</div></td><td class="ocultable chico-txt">${esc(nombreEq(o.equipo))}</td><td class="n" style="font-weight:700">${fmt(o.prom)}</td><td class="n">${o.arr.length}</td></tr>`).join('')}</tbody></table></div>`
      : `<div class="panel">${vacio('microfono', 'Todavía no hay puntajes publicados')}</div>`;
  } else if (pest === 'asistencia') {
    const ps = S.practicas;
    cuerpo = ps.length ? `<div class="aviso info">${ico('asistencia')}<div>${ps.length} práctica${ps.length > 1 ? 's' : ''} registrada${ps.length > 1 ? 's' : ''}. ¡Cada práctica cuenta para llegar listos al torneo!</div></div>
      <div class="tabla"><table><thead><tr><th>Equipo</th><th>Asistencia</th><th class="n">Prácticas</th></tr></thead><tbody>
      ${[...S.equipos].sort((a, b) => (pctAsistencia('equipos', b.id) ?? 0) - (pctAsistencia('equipos', a.id) ?? 0)).map(e => { const pa = pctAsistencia('equipos', e.id) ?? 0; const n = ps.filter(p => asistenciaDe(p.id).equipos[e.id]).length;
        return `<tr><td><div class="celda-eq">${avEq(e, 'p')}<b>${esc(e.nombre)}</b></div></td><td style="min-width:140px"><div class="fila" style="flex-wrap:nowrap;gap:8px"><div class="crece">${barra(pa)}</div><span class="num chico-txt">${pa}%</span></div></td><td class="n">${n}/${ps.length}</td></tr>`; }).join('')}</tbody></table></div>`
      : `<div class="panel">${vacio('asistencia', 'Aún no hay prácticas registradas')}</div>`;
  } else {
    const E = S.elim, u = E.rondas[E.rondas.length - 1], campeon = u && u.debates.length === 1 && u.debates[0].ganador ? u.debates[0][u.debates[0].ganador] : null;
    cuerpo = E.rondas.length ? `<div class="panel" style="padding:20px"><div class="cuadro">${E.rondas.map((ro, k) => `<div class="col ${k === E.rondas.length - 1 && !(ro.debates.length > 1 && !campeon) ? 'ultima' : ''}"><h3>${esc(ro.nombre)}</h3>${ro.debates.map(d => `<div class="llave">${['a', 'b'].map(x => `<button disabled class="${d.ganador === x ? 'gana' : d.ganador ? 'pierde' : ''}"><span class="sem">${d['s' + x]}</span><span>${esc(nombreEq(d[x]))}</span><span class="post ${d.prop === x ? 'prop' : 'opp'}">${d.prop === x ? 'PROP' : 'OPP'}</span></button>`).join('')}</div>`).join('')}</div>`).join('')}
      ${campeon ? `<div class="col ultima"><h3>Campeón</h3><div class="campeon">${ico('tablas')}<b>${esc(nombreEq(campeon))}</b></div></div>` : ''}</div></div>`
      : `<div class="panel">${vacio('eliminatorias', 'Las eliminatorias se publicarán al terminar las rondas')}</div>`;
  }
  return `<div class="portal">${cabezaPortal(`<a class="btn sec chico ocultable" href="#publico" target="_blank">${ico('pantalla')}Proyector</a>`)}
    <nav class="portal-tabs">${PESTANAS_VIVO.map(([k, i, t]) => `<a href="#vivo/${k}" class="${pest === k ? 'on' : ''}">${ico(i)}${t}</a>`).join('')}</nav>
    <main class="portal-cuerpo">${cuerpo}</main>
    <footer class="portal-pie">Club Escolar de Liderazgo · Regional Educativa 17 · <a href="#entrar">Administración</a></footer></div>`;
}
function vivoSalas(rid) {
  const r = rondaPorId(rid) || rondaVisible();
  if (!r) return `<div class="panel">${vacio('rondas', 'Todavía no hay salas publicadas', 'Cuando se publique la próxima ronda la verás aquí al instante, sin recargar.')}</div>`;
  const q = ui.buscarVivo.trim().toLowerCase();
  const lista = r.debates.filter(d => !q || (nombreEq(d.prop) + ' ' + nombreEq(d.opp) + ' ' + d.aula).toLowerCase().includes(q));
  const otras = S.rondas.filter(x => x.debates.length);
  return `${otras.length > 1 ? `<div class="chips" style="margin-bottom:14px">${otras.map(x => `<a class="chip ${x.id === r.id ? 'on' : ''}" href="#vivo/salas/${x.id}">${esc(x.nombre)}</a>`).join('')}</div>` : ''}
    ${enCursoVivo(r)}
    <div class="fila" style="margin-bottom:14px"><h2 style="font-size:22px">${esc(r.nombre)}</h2><span class="etq">${r.debates.length} salas</span><span class="crece"></span></div>
    <div class="campo-buscar" style="margin-bottom:14px">${ico('buscar')}<input data-i="buscarVivo" placeholder="Busca tu equipo o tu aula" value="${esc(ui.buscarVivo)}"></div>
    <div class="salas-vivo">${lista.map(d => { const res = !r.silenciosa && resultado(d);
      const lado = l => { const e = eqPorId(d[l]); const deb = debatientesDe(r, d[l]); return `<div class="eq-v ${l} ${res && res.ganador === l ? 'gano' : ''}">${avEq(e, 'p')}<div class="txt"><small>${l === 'prop' ? 'Proposición' : 'Oposición'}</small><b>${esc(nombreEq(d[l]))}</b>${deb.length ? `<div class="deb-v">${deb.map(m => `<span>${esc(m.nombre)}</span>`).join('')}</div>` : ''}</div>${res ? `<span class="num">${fmt(res[l])}</span>` : ''}</div>`; };
      return `<div class="panel sala-v"><div class="cab-v"><b>${esc(d.aula)}</b>${res ? `<span class="etq ok">${ico('check')} Gana ${res.ganador === 'prop' ? 'Prop.' : 'Op.'}</span>` : boletasDe(d).length ? '<span class="etq warn">Boleta en camino</span>' : '<span class="etq">En debate</span>'}</div>${lado('prop')}${lado('opp')}
        <div class="jz">${ico('jueces')}${esc(d.jueces.map(j => (juezPorId(j) || {}).nombre).filter(Boolean).join(', ') || 'Juez por asignar')}</div></div>`; }).join('') || vacio('buscar', 'No hay salas con ese nombre')}</div>
    ${(r.descansos || []).length ? `<div class="aviso warn" style="margin-top:14px">${ico('alerta')}Descansa: ${esc(r.descansos.map(nombreEq).join(', '))}</div>` : ''}`;
}

// tarjeta "En curso": moción, quiénes se enfrentan y el tiempo
function enCursoVivo(r) {
  const actual = (rondaEnCurso() || {}).id === r.id;   // el tiempo y la sala en pantalla solo se muestran en la ronda en curso
  const c = S.crono, sala = actual ? salaEnPantalla(r) : null, hay = actual && cronoActivo();
  const mocion = r.mocion ? `<div class="mocion-vivo"><div class="eti">${ico('mociones')} Moción · ${esc(r.nombre)}</div><p>${esc(r.mocion)}</p>${r.infoslide ? `<div class="info">${esc(r.infoslide)}</div>` : ''}</div>`
    : `<div class="mocion-vivo pendiente"><div class="eti">${ico('mociones')} Moción · ${esc(r.nombre)}</div><p>La moción se anuncia al empezar la ronda.</p></div>`;
  const habla = c.tipo === 'prep' ? '' : c.lado;
  const equipo = l => { const deb = debatientesDe(r, sala[l]);
    return `<div class="vs-lado ${l} ${habla === l && hay ? 'habla' : ''}"><small>${l === 'prop' ? 'Proposición' : 'Oposición'}</small>${avEq(eqPorId(sala[l]), 'g')}<b>${esc(nombreEq(sala[l]))}</b><div class="deb-v">${deb.map(m => `<span>${esc(m.nombre)}</span>`).join('')}</div>${habla === l && hay ? `<em>${ico('microfono')} Habla ahora</em>` : ''}</div>`; };
  const enfrentan = sala && sala.prop && sala.opp ? `<div class="panel vs-vivo"><div class="cab-v"><b>${esc(sala.aula)}</b><span class="chico-txt">${r.debates.length > 1 ? 'Sala en pantalla' : esc(r.nombre)}</span></div><div class="vs-cuerpo">${equipo('prop')}<div class="vs-x">VS</div>${equipo('opp')}</div></div>` : '';
  const reloj = hay ? `<div class="panel crono-vivo ${c.tipo === 'prep' ? 'prep' : c.lado}"><div class="eti"><i class="${c.corriendo ? 'on' : ''}"></i>${c.corriendo ? 'En curso' : 'En pausa'} · ${esc(c.etiqueta)}</div>
      <div class="num grande" data-reloj="${c.tipo === 'prep' ? 'restante' : 'transcurrido'}">${mmss(c.tipo === 'prep' ? c.duracion - transcurrido(c) : transcurrido(c))}</div>
      <div class="barra-c"><i data-barra-crono></i></div><div class="pie-c"><span data-estado-crono></span><span class="chico-txt num">${c.tipo === 'prep' ? 'cuenta regresiva' : 'de ' + mmss(c.duracion)}</span></div></div>` : '';
  return `<div class="en-curso ${reloj ? 'con-reloj' : ''}">${mocion}${reloj}</div>${enfrentan}`;
}

// ---------------- portal del juez ----------------
function vPortalJuez(token, sub, rid, did) {
  if (!JUEZ || JUEZ.token !== token) return `<div class="cargando"><div class="sello"></div><span>Abriendo tu enlace…</span></div>`;
  if (JUEZ.invalido) return `<div class="portal">${cabezaPortal()}<main class="portal-cuerpo"><div class="panel">${vacio('alerta', 'Este enlace de juez no es válido', 'Puede que lo hayan cambiado. Pide tu enlace nuevo a la organización.', `<a class="btn sec" href="#vivo">Ver el torneo en vivo</a>`)}</div></main></div>`;
  if (sub === 'boleta') return `<div class="portal">${cabezaPortal()}<main class="portal-cuerpo">${vBoleta(rid, did, JUEZ.id)}</main></div>`;
  const asign = S.rondas.flatMap(r => r.debates.filter(d => d.jueces.includes(JUEZ.id)).map(d => ({ r, d }))).reverse();
  const pend = asign.filter(x => !x.d.boletas[JUEZ.id]).length;
  return `<div class="portal">${cabezaPortal()}<main class="portal-cuerpo">
    <section class="hero" style="padding:24px"><div class="eti">Portal del juez</div><h1 style="font-size:36px">Hola, ${esc(primerNombre(JUEZ.nombre))}</h1>
      <p style="margin-bottom:0">${pend ? `Tienes ${pend} boleta${pend > 1 ? 's' : ''} por llenar.` : asign.length ? 'Tus boletas están al día. ¡Gracias!' : 'Aún no tienes salas asignadas. Esta página se actualiza sola.'} Este enlace es personal: no lo compartas.</p></section>
    ${asign.map(({ r, d }) => { const hecha = !!d.boletas[JUEZ.id];
      return `<div class="panel sala-v" style="margin-bottom:12px"><div class="cab-v"><b>${esc(d.aula)}</b><span class="chico-txt">${esc(r.nombre)}</span><span class="crece"></span>${hecha ? `<span class="etq ok">${ico('check')} Enviada</span>` : '<span class="etq warn">Pendiente</span>'}</div>
        ${['prop', 'opp'].map(l => `<div class="eq-v ${l}">${avEq(eqPorId(d[l]), 'p')}<div class="txt"><small>${l === 'prop' ? 'Proposición' : 'Oposición'}</small><b>${esc(nombreEq(d[l]))}</b></div></div>`).join('')}
        ${r.mocion ? `<div class="jz" style="color:var(--texto)">${ico('mociones')}${esc(r.mocion)}</div>` : ''}
        <div style="padding:12px 14px"><a class="btn ${hecha ? 'sec' : 'prim'}" style="width:100%" href="#j/${JUEZ.token}/boleta/${r.id}/${d.id}">${ico(hecha ? 'editar' : 'juez')}${hecha ? 'Revisar mi boleta' : 'Llenar boleta'}</a></div></div>`; }).join('')}
    <div class="acciones" style="justify-content:center;margin-top:18px"><a class="btn sec" href="#vivo">${ico('rayo')}Ver el torneo en vivo</a></div>
  </main></div>`;
}

// ---------------- acceso de administración ----------------
function vEntrar() {
  return `<div class="portal"><div class="entrar"><form class="panel" data-form="entrar">
    <div class="sello" style="width:64px;height:64px;margin:0 auto 14px"></div>
    <h1 style="font-size:30px;text-align:center">Administración</h1>
    <p class="chico-txt" style="text-align:center;margin:6px 0 18px">Escribe el PIN de la organización.</p>
    <input name="pin" type="password" inputmode="numeric" autocomplete="current-password" placeholder="PIN" required autofocus style="text-align:center;font-size:22px;letter-spacing:6px">
    <button class="btn prim" style="width:100%;margin-top:14px">${ico('flecha')}Entrar</button>
    <a href="#vivo" class="chico-txt" style="display:block;text-align:center;margin-top:16px">Ver el torneo en vivo</a></form></div></div>`;
}

// ---------------- enlaces de jueces (administración) ----------------
function capaQR(id) {
  const j = juezPorId(id); if (!j) return '';
  const url = enlaceJuez(j);
  let qr = '';
  try { const q = qrcode(0, 'M'); q.addData(url); q.make(); qr = q.createSvgTag({ cellSize: 6, margin: 3, scalable: true }); } catch (e) { qr = ''; }
  return `<div class="modal" style="width:min(440px,100%)"><div class="cab-m"><h2>Enlace de ${esc(primerNombre(j.nombre))}</h2><button class="btn icono fant cerrar" data-a="cerrarCapa">${ico('cerrar')}</button></div>
    <div class="cuerpo-m" style="text-align:center">${qr ? `<div class="qr">${qr}</div>` : ''}<p class="chico-txt" style="word-break:break-all;margin:12px 0">${esc(url)}</p>
    <div class="acciones" style="justify-content:center"><button class="btn prim" data-a="copiarEnlace" data-id="${j.id}">${ico('copiar')}Copiar</button><a class="btn sec" target="_blank" href="https://wa.me/?text=${encodeURIComponent(textoEnlace(j))}">${ico('mensaje')}WhatsApp</a></div></div></div>`;
}
const textoEnlace = j => `Hola, ${primerNombre(j.nombre)}. Este es tu enlace personal de juez para ${S.torneo.nombre}: ${enlaceJuez(j)} — Ahí verás tu sala y llenarás la boleta. No lo compartas.`;

const primerNombre = n => (String(n).split(/\s+/).find(w => !/^(prof|profa|lic|licda|dr|dra|ing|sr|sra)\.?$/i.test(w)) || n);
