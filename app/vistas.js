/* CELIDER Tab — vistas. Cada función devuelve HTML. */
'use strict';

const ui = {
  menu: false, capa: null, buscar: '', buscarJuez: '', buscarMocion: '', vistaEq: 'tarjetas', filtroDist: '',
  pestTabla: 'equipos', practicaSel: null, rondaPest: 'salas', verPublico: false, asisPest: 'pasar', editSala: null, rondaExp: null,
};
let borrador = {};
function rutaActual() { return (location.hash.slice(1) || (typeof MODO === 'undefined' || MODO === 'admin' ? 'inicio' : 'vivo')).split('/'); }

// ---------------- piezas ----------------
const avEq = (e, cls = '') => e ? `<div class="av ${cls}" style="background:${colorDist(e.distrito)}" title="${esc(nombreDist(e.distrito))}">${esc(iniciales(e.nombre))}</div>` : `<div class="av ${cls} persona">?</div>`;
const avPersona = (n, cls = 'p') => `<div class="av persona ${cls}">${esc(inicialesPersona(n))}</div>`;
const etqDist = c => `<span class="etq"><i class="punto" style="background:${colorDist(c)}"></i>${esc(c)}</span>`;
function cab(titulo, sub = '', acciones = '', eti = '') {
  return `<div class="cabeza"><div>${eti ? `<div class="eti">${eti}</div>` : ''}<h1>${titulo}</h1>${sub ? `<p>${sub}</p>` : ''}</div><div class="acciones">${acciones}</div></div>`;
}
const vacio = (icono, titulo, texto = '', boton = '') => `<div class="vacio">${ico(icono)}<b>${titulo}</b>${texto ? `<div>${texto}</div>` : ''}${boton ? `<div style="margin-top:16px">${boton}</div>` : ''}</div>`;
function anillo(frac, tam = 92, grosor = 9, centro = '', color = 'var(--acento)') {
  const r = (tam - grosor) / 2, c = 2 * Math.PI * r, f = Math.max(0, Math.min(1, frac || 0));
  return `<div class="anillo" style="width:${tam}px;height:${tam}px"><svg width="${tam}" height="${tam}"><circle cx="${tam / 2}" cy="${tam / 2}" r="${r}" fill="none" stroke="var(--s3)" stroke-width="${grosor}"/><circle cx="${tam / 2}" cy="${tam / 2}" r="${r}" fill="none" stroke="${color}" stroke-width="${grosor}" stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - f)}" style="transition:stroke-dashoffset .6s"/></svg><div class="centro">${centro}</div></div>`;
}
const barra = pct => `<div class="barra-p"><i style="width:${Math.max(0, Math.min(100, pct || 0))}%"></i></div>`;
const rondaActiva = () => [...S.rondas].reverse().find(r => r.debates.length && estadoRonda(r) < 3);
const opcionesDist = (sel, todos = true) => (todos ? `<option value="">Todos los distritos</option>` : '') + S.torneo.distritos.map(d => `<option value="${d.codigo}" ${sel === d.codigo ? 'selected' : ''}>${esc(nombreDist(d.codigo))}</option>`).join('');
function chipsDist(lista) {
  return `<div class="chips"><button class="chip ${!ui.filtroDist ? 'on' : ''}" data-a="filtroDist" data-v="">Todos <span class="n">${lista.length}</span></button>${S.torneo.distritos.map(d => `<button class="chip ${ui.filtroDist === d.codigo ? 'on' : ''}" data-a="filtroDist" data-v="${d.codigo}"><i style="background:${colorDist(d.codigo)}"></i>${esc(d.nombre || d.codigo)} <span class="n">${lista.filter(e => e.distrito === d.codigo).length}</span></button>`).join('')}</div>`;
}

// ---------------- marco ----------------
const MENU = [
  ['inicio', 'inicio', 'Inicio'],
  'Preparación', ['equipos', 'equipos', 'Equipos'], ['jueces', 'jueces', 'Jueces'], ['asistencia', 'asistencia', 'Asistencia'], ['mociones', 'mociones', 'Mociones'],
  'Competencia', ['rondas', 'rondas', 'Rondas'], ['cronometro', 'cronometro', 'Cronómetro'], ['tablas', 'tablas', 'Tablas'], ['eliminatorias', 'eliminatorias', 'Eliminatorias'],
  'Salida', ['vivo', 'rayo', 'Portal en vivo'], ['publico', 'pantalla', 'Pantalla pública'], ['exportar', 'exportar', 'Exportar e imprimir'], ['ajustes', 'ajustes', 'Ajustes'],
];
const TITULOS = { inicio: 'Inicio', equipos: 'Equipos', jueces: 'Jueces', asistencia: 'Asistencia', mociones: 'Mociones', rondas: 'Rondas', ronda: 'Rondas', boleta: 'Rondas', cronometro: 'Cronómetro', tablas: 'Tablas', eliminatorias: 'Eliminatorias', juez: 'Vista de juez', exportar: 'Exportar e imprimir', ajustes: 'Ajustes' };
function marco(ruta, contenido, migas = '') {
  const activa = m => ruta === m || (m === 'rondas' && (ruta === 'ronda' || ruta === 'boleta'));
  const ra = rondaActiva();
  const pendientes = ra ? ra.debates.filter(d => !completo(d)).length : 0;
  return `<div class="app">
    <aside class="lateral ${ui.menu ? 'abierto' : ''}">
      <div class="marca"><div class="sello"></div><div><b>CELIDER TAB</b><small>Regional 17 · WSDC</small></div></div>
      <nav>${MENU.map(m => typeof m === 'string' ? `<div class="grupo">${m}</div>`
        : `<a href="#${m[0]}" ${['publico', 'vivo'].includes(m[0]) ? 'target="_blank"' : ''} class="${activa(m[0]) ? 'on' : ''}">${ico(m[1])}${m[2]}${['publico', 'vivo'].includes(m[0]) ? ico('externo', 'ext') : ''}${m[0] === 'rondas' && pendientes ? `<span class="badge">${pendientes}</span>` : ''}</a>`).join('')}</nav>
      <div class="pie"><img src="img/sello.jpg" alt=""><div>Club Escolar de Liderazgo<br>Ministerio de Educación · R17</div></div>
    </aside>
    <div class="contenido">
      <header class="barra">
        <button class="btn icono fant barra-movil" data-a="menu" title="Menú">${ico('menu')}</button>
        <div class="ruta">${migas || `<b>${TITULOS[ruta] || 'Inicio'}</b>`}</div>
        <div class="espacio"></div>
        ${ra ? `<a class="vivo ocultable" href="#ronda/${ra.id}"><i></i>${esc(ra.nombre)} · ${ra.debates.filter(completo).length}/${ra.debates.length} boletas</a>` : ''}
        <span id="estadoNube" class="nube ocultable"></span>
        <div class="buscador" data-a="paleta">${ico('buscar')}<span>Buscar o ir a…</span><kbd>Ctrl K</kbd></div>
        <button class="btn icono fant" data-a="deshacer" title="Deshacer (Ctrl+Z)">${ico('deshacer')}</button>
        <button class="btn icono fant" data-a="tema" title="Cambiar tema">${ico(document.documentElement.dataset.tema === 'claro' ? 'luna' : 'sol')}</button>
        <a class="btn sec ocultable" href="#publico" target="_blank">${ico('pantalla')}Pantalla</a>
      </header>
      <main>${contenido}</main>
    </div>
  </div>${capa()}`;
}

// ---------------- inicio ----------------
function vInicio() {
  const deb = suma(S.equipos.map(e => e.miembros.length));
  const st = standings(), conRes = st.some(f => f.jugados);
  const ra = rondaActiva(), ult = S.rondas[S.rondas.length - 1];
  const p = S.practicas[S.practicas.length - 1], a = p ? asistenciaDe(p.id) : null;
  const totalBoletas = suma(S.rondas.map(r => r.debates.filter(completo).length));
  const pasos = [
    ['Equipos cargados', S.equipos.length > 0, '#equipos'],
    ['Jueces registrados', S.jueces.length > 0, '#jueces'],
    ['Asistencia de la práctica', S.practicas.length > 0, '#asistencia'],
    ['Ronda emparejada', S.rondas.some(r => r.debates.length), '#rondas'],
    ['Moción publicada', S.rondas.some(r => r.mocionPublicada), ult ? '#ronda/' + ult.id : '#rondas'],
    ['Boletas completas', S.rondas.some(r => r.debates.length && r.debates.every(completo)), ult ? '#ronda/' + ult.id : '#rondas'],
  ];
  const siguiente = pasos.find(x => !x[1]);
  const porDist = S.torneo.distritos.map(d => ({ d, v: suma(st.filter(f => f.e.distrito === d.codigo).map(f => f.v)), n: S.equipos.filter(e => e.distrito === d.codigo).length }));
  const maxV = Math.max(1, ...porDist.map(x => x.v));
  const asisPracticas = S.practicas.slice(-8).map(pr => ({ pr, n: Object.values(asistenciaDe(pr.id).miembros).filter(Boolean).length }));
  const maxA = Math.max(1, ...asisPracticas.map(x => x.n));

  return `
  <section class="hero">
    <div class="eti">Club Escolar de Liderazgo · Regional 17</div>
    <h1>${esc(S.torneo.nombre)}</h1>
    <p>${esc(S.torneo.subtitulo)} · ${S.equipos.length} equipos de ${S.torneo.distritos.length} distritos, formato WSDC.</p>
    <div class="acciones">
      ${ra ? `<a class="btn prim" href="#ronda/${ra.id}">${ico('rayo')}Continuar ${esc(ra.nombre)}</a>` : siguiente ? `<a class="btn prim" href="${siguiente[2]}">${ico('flecha')}${esc(siguiente[0])}</a>` : `<a class="btn prim" href="#rondas">${ico('mas')}Nueva ronda</a>`}
      <a class="btn sec" href="#publico" target="_blank">${ico('pantalla')}Abrir pantalla pública</a>
      <a class="btn sec" href="#exportar">${ico('exportar')}Exportar</a>
    </div>
  </section>
  <div class="rejilla r4" style="margin-bottom:18px">
    <div class="panel kpi"><div class="icono">${ico('equipos')}</div><div><b class="cuenta" data-n="${S.equipos.filter(e => !e.swing).length}">${S.equipos.filter(e => !e.swing).length}</b><small>Equipos</small></div><div class="extra">${S.torneo.distritos.length} distritos</div></div>
    <div class="panel kpi c2"><div class="icono">${ico('microfono')}</div><div><b>${deb}</b><small>Debatientes</small></div><div class="extra">${a ? Object.values(a.miembros).filter(Boolean).length + ' en la última' : ''}</div></div>
    <div class="panel kpi c3"><div class="icono">${ico('jueces')}</div><div><b>${S.jueces.length}</b><small>Jueces</small></div><div class="extra">${S.practicas.length} prácticas</div></div>
    <div class="panel kpi c4"><div class="icono">${ico('rondas')}</div><div><b>${S.rondas.length}</b><small>Rondas</small></div><div class="extra">${totalBoletas} debates cerrados</div></div>
  </div>
  <div class="rejilla r-2-1" style="margin-bottom:18px">
    ${ra ? panelRondaActiva(ra) : `<div class="panel"><div class="tit">${ico('check')}<h3>Para arrancar la práctica</h3></div>
      <div style="display:grid;gap:8px">${pasos.map(([t, ok, h], i) => `<a href="${h}" class="fila" style="padding:10px 12px;border-radius:12px;background:var(--s2);color:var(--texto)">
        <span class="rk ${ok ? '' : ''}" style="${ok ? 'background:var(--ok);color:#03251a' : ''}">${ok ? ico('check') : i + 1}</span><b style="font-weight:600">${t}</b>${!ok && siguiente && siguiente[0] === t ? '<span class="etq acento" style="margin-left:auto">Siguiente</span>' : ''}</a>`).join('')}</div></div>`}
    <div class="panel"><div class="tit">${ico('tablas')}<h3>Arriba en la tabla</h3><a class="acc chico-txt" href="#tablas">Ver todo</a></div>
      ${conRes ? st.slice(0, 5).map((f, i) => `<div class="fila clic" data-a="perfilEquipo" data-id="${f.e.id}" style="padding:8px 0;border-bottom:1px solid var(--borde);flex-wrap:nowrap">
        <span class="rk ${i < 3 ? 'r' + (i + 1) : ''}">${i + 1}</span>${avEq(f.e, 'p')}<div class="crece"><b style="display:block;font-size:13.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(f.e.nombre)}</b><small class="chico-txt">${fmt(f.pts)} pts</small></div><span class="etq ok">${f.v} V</span></div>`).join('')
      : vacio('tablas', 'Sin resultados todavía', 'Aparecen en cuanto se guarde la primera boleta.')}
    </div>
  </div>
  <div class="rejilla r3">
    <div class="panel"><div class="tit">${ico('asistencia')}<h3>Asistencia por práctica</h3></div>
      ${asisPracticas.length ? `<div class="barras">${asisPracticas.map(x => `<div class="b"><em>${x.n}</em><i style="height:${x.n / maxA * 100}%"></i><span>${esc(fechaLarga(x.pr.fecha))}</span></div>`).join('')}</div>` : vacio('asistencia', 'Sin prácticas', 'Crea la primera en Asistencia.')}
    </div>
    <div class="panel"><div class="tit">${ico('grafica')}<h3>Victorias por distrito</h3></div>
      ${porDist.map(x => `<div class="hbar"><span class="fila" style="gap:8px;flex-wrap:nowrap"><i class="punto" style="background:${colorDist(x.d.codigo)}"></i>${esc(x.d.nombre || x.d.codigo)}</span><div class="barra-p"><i style="width:${x.v / maxV * 100}%;background:${colorDist(x.d.codigo)}"></i></div><span class="num">${x.v}</span></div>`).join('')}
      <p class="chico-txt" style="margin:10px 0 0">${porDist.map(x => `${x.d.codigo}: ${x.n} equipos`).join(' · ')}</p>
    </div>
    <div class="panel"><div class="tit">${ico('rayo')}<h3>Actividad reciente</h3></div>
      ${S.actividad.length ? `<div class="feed">${S.actividad.slice(0, 14).map(x => `<div><i class="punto"></i><span>${esc(x.txt)}</span><small>${hace(x.t)}</small></div>`).join('')}</div>` : vacio('rayo', 'Nada por aquí aún', 'Lo que hagas en el torneo aparecerá en esta lista.')}
    </div>
  </div>`;
}
function panelRondaActiva(r) {
  const ok = r.debates.filter(completo).length, n = r.debates.length;
  return `<div class="panel"><div class="tit">${ico('rayo')}<h3>${esc(r.nombre)} en curso</h3><span class="acc etq ${r.mocionPublicada ? 'ok' : 'warn'}">${r.mocionPublicada ? 'Moción publicada' : 'Moción sin publicar'}</span></div>
    <div class="fila" style="gap:22px;align-items:center;flex-wrap:nowrap">
      ${anillo(n ? ok / n : 0, 120, 11, `<b>${ok}/${n}</b><small>boletas</small>`)}
      <div class="crece">
        ${r.mocion ? `<div class="chico-txt">Moción</div><div style="font-weight:700;font-size:16px;line-height:1.35;margin-bottom:12px">${esc(r.mocion)}</div>` : '<div class="chico-txt" style="margin-bottom:12px">Todavía no hay moción para esta ronda.</div>'}
        <div class="fila" style="gap:6px;margin-bottom:14px">${r.debates.map(d => `<a href="#ronda/${r.id}" title="${esc(d.aula)}: ${esc(nombreEq(d.prop))} vs ${esc(nombreEq(d.opp))}" style="width:16px;height:16px;border-radius:5px;background:${completo(d) ? 'var(--ok)' : boletasDe(d).length ? 'var(--warn)' : 'var(--s3)'}"></a>`).join('')}</div>
        <div class="acciones"><a class="btn prim chico" href="#ronda/${r.id}">${ico('flecha')}Abrir ronda</a><a class="btn sec chico" href="#cronometro">${ico('cronometro')}Cronómetro</a></div>
      </div>
    </div></div>`;
}

// ---------------- equipos ----------------
function statsEquipo(id) {
  const st = standings(), i = st.findIndex(f => f.e.id === id), f = st[i];
  return { pos: i >= 0 ? i + 1 : null, f, asis: pctAsistencia('equipos', id) };
}
function vEquipos() {
  const q = ui.buscar.trim().toLowerCase();
  const base = S.equipos.filter(e => !q || (e.nombre + ' ' + e.centro + ' ' + e.manager + ' ' + e.miembros.map(m => m.nombre).join(' ')).toLowerCase().includes(q));
  const lista = base.filter(e => !ui.filtroDist || e.distrito === ui.filtroDist);
  const st = standings(), pos = new Map(st.map((f, i) => [f.e.id, f]));
  const tarjetas = `<div class="cuadro-eq">${lista.map(e => {
    const f = pos.get(e.id), asis = pctAsistencia('equipos', e.id);
    return `<div class="panel eq-card" style="--c:${colorDist(e.distrito)}" data-a="perfilEquipo" data-id="${e.id}">
      <div class="top">${avEq(e, 'g')}<div class="crece"><h3>${esc(e.nombre)}</h3><div class="meta">${e.centro !== e.nombre ? esc(e.centro) + ' · ' : ''}${esc(nombreDist(e.distrito))}</div></div>${e.swing ? '<span class="etq warn">Comodín</span>' : ''}</div>
      <div class="miembros">${e.miembros.map(m => `<span class="persona-chip">${avPersona(m.nombre, '')}${esc(m.nombre.split(' ')[0])}</span>`).join('')}${e.miembros.length < 5 ? `<button class="persona-chip agregar" data-a="agregarIntegrante" data-id="${e.id}" title="Agregar una persona a ${esc(e.nombre)}">${ico('mas')}Agregar</button>` : ''}${e.miembros.length < 3 ? '<span class="etq err">Faltan integrantes</span>' : ''}</div>
      <div class="stats"><div><b>${f && f.jugados ? `${f.v}-${f.jugados - f.v}` : '—'}</b><small>Récord</small></div><div><b>${f && f.jugados ? fmt(f.pts) : '—'}</b><small>Puntos</small></div><div><b>${asis == null ? '—' : asis + '%'}</b><small>Asistencia</small></div></div>
    </div>`; }).join('')}</div>`;
  const tabla = `<div class="tabla"><table><thead><tr><th>Equipo</th><th>Distrito</th><th>Integrantes</th><th class="n">Récord</th><th class="n">Puntos</th><th class="n">Asist.</th><th>Team manager</th><th></th></tr></thead><tbody>
    ${lista.map(e => { const f = pos.get(e.id), asis = pctAsistencia('equipos', e.id); return `<tr class="clic" data-a="perfilEquipo" data-id="${e.id}"><td><div class="celda-eq">${avEq(e, 'p')}<div><b>${esc(e.nombre)}</b>${e.centro !== e.nombre ? `<small>${esc(e.centro)}</small>` : ''}</div></div></td><td>${etqDist(e.distrito)}</td><td style="white-space:nowrap"><span class="${e.miembros.length < 3 ? 'etq err' : 'etq'}">${e.miembros.length}/5</span>${e.miembros.length < 5 ? ` <button class="btn icono chico fant" data-a="agregarIntegrante" data-id="${e.id}" title="Agregar integrante">${ico('mas')}</button>` : ''}</td><td class="n">${f && f.jugados ? `${f.v}-${f.jugados - f.v}` : '—'}</td><td class="n">${f && f.jugados ? fmt(f.pts) : '—'}</td><td class="n">${asis == null ? '—' : asis + '%'}</td><td class="chico-txt">${esc(e.manager || '—')}</td>
      <td class="n"><button class="btn icono chico fant" data-a="editarEquipo" data-id="${e.id}" title="Editar">${ico('editar')}</button></td></tr>`; }).join('')}
  </tbody></table></div>`;
  return cab('Equipos', `${S.equipos.length} equipos y ${suma(S.equipos.map(e => e.miembros.length))} debatientes del registro de la Regional 17. Toca un equipo para ver su perfil.`,
    `<div class="segmento"><button class="${ui.vistaEq === 'tarjetas' ? 'on' : ''}" data-a="vistaEq" data-v="tarjetas">${ico('cuadricula')}</button><button class="${ui.vistaEq === 'lista' ? 'on' : ''}" data-a="vistaEq" data-v="lista">${ico('lista')}</button></div>
     <button class="btn sec" data-a="expExcel" data-v="Equipos">${ico('exportar')}Excel</button>
     <button class="btn prim" data-a="nuevoEquipo">${ico('mas')}Agregar equipo</button>`) + `
  <div class="fila" style="margin-bottom:16px;gap:14px"><div class="campo-buscar">${ico('buscar')}<input data-i="buscar" placeholder="Buscar equipo, centro, debatiente o manager" value="${esc(ui.buscar)}"></div></div>
  <div style="margin-bottom:18px">${chipsDist(base)}</div>
  ${lista.length ? (ui.vistaEq === 'lista' ? tabla : tarjetas) : `<div class="panel">${vacio('buscar', 'Ningún equipo coincide', 'Prueba con otro nombre o quita el filtro de distrito.')}</div>`}`;
}
function capaEquipo(id) {
  const e = id ? eqPorId(id) : { nombre: '', centro: '', distrito: ui.filtroDist || '17-01', swing: false, miembros: [], manager: '' };
  const filas = Array.from({ length: 5 }, (_, i) => e.miembros[i] || { nombre: '', curso: '' });
  return `<form class="modal" data-form="equipo" data-id="${id || ''}">
    <div class="cab-m">${id ? avEq(e) : `<div class="av persona">${ico('mas')}</div>`}<h2>${id ? 'Editar equipo' : 'Nuevo equipo'}</h2><button type="button" class="btn icono fant cerrar" data-a="cerrarCapa">${ico('cerrar')}</button></div>
    <div class="cuerpo-m">
      <label>Nombre del equipo</label><input name="nombre" required value="${esc(e.nombre)}" placeholder="Ej.: Eva May Russell B" autofocus>
      <div class="rejilla r2" style="gap:12px"><div><label>Centro educativo</label><input name="centro" required value="${esc(e.centro)}"></div>
      <div><label>Distrito</label><select name="distrito">${opcionesDist(e.distrito, false)}</select></div></div>
      <label>Integrantes · mínimo 3, máximo 5</label>
      ${filas.map((m, i) => `<div class="fila" style="margin-bottom:8px;flex-wrap:nowrap"><span class="rk" style="width:26px;height:26px;font-size:13px">${i + 1}</span><input class="crece" name="m${i}" value="${esc(m.nombre)}" placeholder="${i < 3 ? 'Nombre completo' : 'Opcional'}"><input style="width:150px" name="c${i}" value="${esc(m.curso)}" placeholder="Curso"><input type="hidden" name="id${i}" value="${esc(m.id || '')}"></div>`).join('')}
      <div class="rejilla r2" style="gap:12px"><div><label>Team manager</label><input name="manager" value="${esc(e.manager)}"></div>
      <div><label>Equipo comodín</label><label class="check" style="height:42px"><span class="switch"><input type="checkbox" name="swing" ${e.swing ? 'checked' : ''}><span></span></span>Completa salas impares, no sale en tablas</label></div></div>
    </div>
    <div class="pie-m">${id ? `<button type="button" class="btn peligro" data-a="borrarEquipo" data-id="${id}" style="margin-right:auto">${ico('borrar')}Eliminar</button>` : ''}<button type="button" class="btn sec" data-a="cerrarCapa">Cancelar</button><button class="btn prim">${ico('check')}Guardar</button></div>
  </form>`;
}
function capaIntegrante(id) {
  const e = eqPorId(id); if (!e) return '';
  const libres = 5 - e.miembros.length;
  return `<form class="modal" data-form="integrante" data-id="${id}" style="width:min(460px,100%)">
    <div class="cab-m">${avEq(e)}<h2>Agregar al equipo</h2><button type="button" class="btn icono fant cerrar" data-a="cerrarCapa">${ico('cerrar')}</button></div>
    <div class="cuerpo-m">
      <p class="chico-txt" style="margin:0 0 12px">${esc(e.nombre)} · ${e.miembros.length} de 5 integrantes${e.miembros.length ? ': ' + e.miembros.map(m => esc(m.nombre.split(' ')[0])).join(', ') : ''}</p>
      <label>Nombre completo</label><input name="nombre" required placeholder="Ej.: María Fernanda Reyes" autofocus autocomplete="off">
      <label>Curso <span class="chico-txt">· opcional</span></label><input name="curso" placeholder="Ej.: 5to de secundaria" autocomplete="off">
      ${libres > 1 ? `<label class="check" style="margin-top:12px"><span class="switch"><input type="checkbox" name="otro" ${ui.otroIntegrante ? 'checked' : ''}><span></span></span>Agregar a otra persona después</label>` : ''}
    </div>
    <div class="pie-m"><button type="button" class="btn sec" data-a="cerrarCapa">Cancelar</button><button class="btn prim">${ico('check')}Agregar</button></div>
  </form>`;
}
function capaPerfil(id) {
  const e = eqPorId(id); if (!e) return '';
  const { pos, f, asis } = statsEquipo(id);
  const ors = tablaOradores();
  return `<div class="modal">
    <div class="cab-m"><span class="chico-txt">Perfil del equipo</span><button class="btn icono fant cerrar" data-a="cerrarCapa">${ico('cerrar')}</button></div>
    <div class="cuerpo-m">
      <div class="perfil-cab">${avEq(e, 'g')}<div><h2>${esc(e.nombre)}</h2><div class="chico-txt" style="margin-top:4px">${esc(e.centro)}</div><div class="fila" style="gap:6px;margin-top:8px">${etqDist(e.distrito)}${e.swing ? '<span class="etq warn">Comodín</span>' : ''}${e.manager ? `<span class="etq">${ico('usuario')} ${esc(e.manager)}</span>` : ''}</div></div></div>
      <div class="mini-kpis"><div><b>${pos && f.jugados ? '#' + pos : '—'}</b><small>Posición</small></div><div><b>${f ? `${f.v}-${f.jugados - f.v}` : '—'}</b><small>Récord</small></div><div><b>${f && f.jugados ? fmt(f.pts) : '—'}</b><small>Puntos</small></div><div><b>${asis == null ? '—' : asis + '%'}</b><small>Asistencia</small></div></div>
      <div class="fila" style="margin:6px 0 10px;justify-content:space-between"><h3 style="margin:0">Integrantes <span class="chico-txt">${e.miembros.length}/5</span></h3>${e.miembros.length < 5 ? `<button class="btn sec chico" data-a="agregarIntegrante" data-id="${e.id}">${ico('mas')}Agregar integrante</button>` : ''}</div>
      <div class="tabla" style="margin-bottom:18px"><table><thead><tr><th>Debatiente</th><th class="n">Discursos</th><th class="n">Promedio</th><th class="n">Asist.</th></tr></thead><tbody>
        ${e.miembros.map(m => { const o = ors.find(x => x.id === m.id); const pa = pctAsistencia('miembros', m.id); return `<tr><td><div class="celda-eq">${avPersona(m.nombre)}<div><b>${esc(m.nombre)}</b><small>${esc(m.curso || '')}</small></div></div></td><td class="n">${o ? o.puntos.length : 0}</td><td class="n">${o && o.puntos.length ? fmt(prom(o.puntos)) : '—'}</td><td class="n">${pa == null ? '—' : pa + '%'}</td></tr>`; }).join('')}
      </tbody></table></div>
      <h3 style="margin:6px 0 10px">Historial de debates</h3>
      ${f && f.hist.length ? `<div class="tabla"><table><tbody>${f.hist.map(h => `<tr><td><span class="vd ${h.gano ? 'v' : 'd'}">${h.gano ? 'V' : 'D'}</span></td><td><b>${esc(h.ronda)}</b><div class="chico-txt">contra ${esc(nombreEq(h.rival))}</div></td><td><span class="etq ${h.lado}">${h.lado === 'prop' ? 'Prop.' : 'Op.'}</span></td><td class="n">${fmt(h.pts)}</td></tr>`).join('')}</tbody></table></div>` : '<div class="chico-txt">Aún no ha debatido.</div>'}
    </div>
    <div class="pie-m"><button class="btn sec" data-a="editarEquipo" data-id="${e.id}">${ico('editar')}Editar</button></div>
  </div>`;
}

// ---------------- jueces ----------------
function vJueces() {
  const sinAgregar = S.equipos.filter(e => e.manager && !S.jueces.some(j => j.nombre === e.manager)).length;
  const q = ui.buscarJuez.trim().toLowerCase();
  const lista = S.jueces.filter(j => !q || (j.nombre + ' ' + j.centro).toLowerCase().includes(q));
  return cab('Jueces', 'Se reparten entre las salas evitando que juzguen a equipos de su propio centro.',
    `${sinAgregar ? `<button class="btn sec" data-a="managersJueces">${ico('equipos')}Agregar ${sinAgregar} team managers</button>` : ''}${S.jueces.length && sb ? `<button class="btn sec" data-a="copiarTodos">${ico('copiar')}Copiar todos los enlaces</button>` : ''}<button class="btn prim" data-a="nuevoJuez">${ico('mas')}Agregar juez</button>`) +
  (S.jueces.length && sb ? `<div class="aviso info">${ico('juez')}<div>Cada juez tiene su <b>enlace privado</b>: con él ve su sala y envía la boleta desde el teléfono. Mándalo por WhatsApp con el botón verde. Si un enlace se filtra, usa <b>Cambiar enlace</b>.</div></div>` : '') +
  (S.jueces.length ? `<div class="fila" style="margin-bottom:16px"><div class="campo-buscar">${ico('buscar')}<input data-i="buscarJuez" placeholder="Buscar juez o centro" value="${esc(ui.buscarJuez)}"></div></div>
  <div class="tabla"><table><thead><tr><th>Juez</th><th class="ocu-movil">Centro</th><th class="n ocu-movil">Salas juzgadas</th><th class="n ocu-movil">Boletas</th><th class="ocu-movil">Asistencia</th><th></th></tr></thead><tbody>
  ${lista.map(j => { const salas = suma(S.rondas.map(r => r.debates.filter(d => d.jueces.includes(j.id)).length)); const bol = suma(S.rondas.map(r => r.debates.filter(d => d.boletas[j.id]).length)); const pa = pctAsistencia('jueces', j.id);
    return `<tr><td><div class="celda-eq">${avPersona(j.nombre, '')}<b>${esc(j.nombre)}</b></div></td><td class="chico-txt ocu-movil">${esc(j.centro || '—')}</td><td class="n ocu-movil">${salas}</td><td class="n ocu-movil">${bol}</td><td class="ocu-movil" style="min-width:140px">${pa == null ? '<span class="tenue">—</span>' : `<div class="fila" style="flex-wrap:nowrap;gap:8px"><div class="crece">${barra(pa)}</div><span class="num chico-txt">${pa}%</span></div>`}</td>
    <td class="n" style="white-space:nowrap">${sb && j.token ? `<button class="btn chico sec" data-a="qrJuez" data-id="${j.id}" title="Ver enlace y código QR">${ico('externo')}Enlace</button><a class="btn icono chico fant wa" target="_blank" href="https://wa.me/?text=${encodeURIComponent(textoEnlace(j))}" title="Enviar por WhatsApp">${ico('mensaje')}</a><button class="btn icono chico fant" data-a="copiarEnlace" data-id="${j.id}" title="Copiar enlace">${ico('copiar')}</button><button class="btn icono chico fant" data-a="regenerarToken" data-id="${j.id}" title="Cambiar enlace">${ico('reiniciar')}</button>` : `<a class="btn icono chico fant" href="#juez/${j.id}" title="Su vista">${ico('juez')}</a>`}<button class="btn icono chico fant" data-a="editarJuez" data-id="${j.id}" title="Editar">${ico('editar')}</button><button class="btn icono chico fant" data-a="borrarJuez" data-id="${j.id}" title="Quitar">${ico('borrar')}</button></td></tr>`; }).join('')}
  </tbody></table></div>` : `<div class="panel">${vacio('jueces', 'Aún no hay jueces', 'Agrégalos uno por uno o trae de una vez a los team managers de los equipos.', sinAgregar ? `<button class="btn prim" data-a="managersJueces">${ico('equipos')}Agregar ${sinAgregar} team managers</button>` : '')}</div>`);
}
function capaJuez(id) {
  const j = id ? juezPorId(id) : { nombre: '', centro: '' };
  return `<form class="modal" data-form="juez" data-id="${id || ''}" style="width:min(480px,100%)">
    <div class="cab-m"><h2>${id ? 'Editar juez' : 'Nuevo juez'}</h2><button type="button" class="btn icono fant cerrar" data-a="cerrarCapa">${ico('cerrar')}</button></div>
    <div class="cuerpo-m"><label>Nombre</label><input name="nombre" required value="${esc(j.nombre)}" autofocus>
    <label>Centro o institución</label><input name="centro" value="${esc(j.centro)}" list="centros" placeholder="Para evitar conflictos de interés"><datalist id="centros">${[...new Set(S.equipos.map(e => e.centro))].map(c => `<option value="${esc(c)}">`).join('')}</datalist></div>
    <div class="pie-m"><button type="button" class="btn sec" data-a="cerrarCapa">Cancelar</button><button class="btn prim">${ico('check')}Guardar</button></div></form>`;
}

// ---------------- asistencia ----------------
function vAsistencia() {
  const p = S.practicas.find(x => x.id === ui.practicaSel) || S.practicas[S.practicas.length - 1];
  if (p) ui.practicaSel = p.id;
  const acciones = `<input type="date" id="fechaNueva" value="${hoyISO()}" style="width:auto"><button class="btn prim" data-a="nuevaPractica">${ico('mas')}Nueva práctica</button>`;
  if (!p) return cab('Asistencia', 'Crea la práctica del día y marca quién llegó. Solo los equipos presentes entran a los emparejamientos.', acciones) + `<div class="panel">${vacio('asistencia', 'Todavía no hay prácticas', 'Elige la fecha arriba y pulsa “Nueva práctica”.')}</div>`;
  const a = asistenciaDe(p.id);
  const pres = S.equipos.filter(e => a.equipos[e.id]).length, mie = Object.values(a.miembros).filter(Boolean).length, jz = S.jueces.filter(j => a.jueces[j.id]).length;
  const totalMie = suma(S.equipos.map(e => e.miembros.length));
  const pills = `<div class="practicas">${[...S.practicas].reverse().map(x => { const ax = asistenciaDe(x.id), n = S.equipos.filter(e => ax.equipos[e.id]).length;
    return `<button class="practica ${x.id === p.id ? 'on' : ''}" data-a="practica" data-id="${x.id}"><b>${esc(x.nombre)}</b><small>${esc(fechaLarga(x.fecha))} · ${n} equipos</small>${barra(S.equipos.length ? n / S.equipos.length * 100 : 0)}</button>`; }).join('')}</div>`;
  const top = cab('Asistencia', 'Marca quién llegó. Solo los equipos presentes entran a los emparejamientos.', acciones) + pills +
    `<div class="pestanas"><button class="${ui.asisPest === 'pasar' ? 'on' : ''}" data-a="asisPest" data-p="pasar">${ico('check')}Pasar lista</button><button class="${ui.asisPest === 'historial' ? 'on' : ''}" data-a="asisPest" data-p="historial">${ico('grafica')}Historial</button></div>`;
  if (ui.asisPest === 'historial') return top + vHistorial();
  return top + `
  <div class="rejilla r3" style="margin-bottom:18px">
    <div class="panel kpi"><div class="icono">${ico('equipos')}</div><div><b>${pres}<span class="chico-txt"> / ${S.equipos.length}</span></b><small>Equipos presentes</small></div>${anillo(S.equipos.length ? pres / S.equipos.length : 0, 50, 6)}</div>
    <div class="panel kpi c2"><div class="icono">${ico('microfono')}</div><div><b>${mie}<span class="chico-txt"> / ${totalMie}</span></b><small>Debatientes presentes</small></div>${anillo(totalMie ? mie / totalMie : 0, 50, 6, '', 'var(--prop)')}</div>
    <div class="panel kpi c3"><div class="icono">${ico('jueces')}</div><div><b>${jz}<span class="chico-txt"> / ${S.jueces.length}</span></b><small>Jueces presentes</small></div>${anillo(S.jueces.length ? jz / S.jueces.length : 0, 50, 6, '', 'var(--warn)')}</div>
  </div>
  <div class="acciones" style="margin-bottom:18px"><button class="btn sec chico" data-a="asisTodos" data-v="1">${ico('check')}Marcar a todos</button><button class="btn sec chico" data-a="asisTodos" data-v="0">Desmarcar a todos</button><span class="crece"></span><button class="btn peligro chico" data-a="borrarPractica" data-id="${p.id}">${ico('borrar')}Eliminar práctica</button></div>
  ${S.torneo.distritos.map(d => {
    const eqs = S.equipos.filter(e => e.distrito === d.codigo); if (!eqs.length) return '';
    const n = eqs.filter(e => a.equipos[e.id]).length;
    return `<section class="asis-grupo"><div class="fila"><i class="punto" style="background:${colorDist(d.codigo)};width:10px;height:10px"></i><h2 style="font-size:20px">${esc(nombreDist(d.codigo))}</h2><span class="etq">${n}/${eqs.length}</span><span class="crece"></span><button class="btn fant chico" data-a="asisDistrito" data-d="${d.codigo}" data-v="${n === eqs.length ? 0 : 1}">${n === eqs.length ? 'Desmarcar distrito' : 'Marcar distrito'}</button></div>
    ${eqs.map(e => { const k = e.miembros.filter(m => a.miembros[m.id]).length;
      return `<div class="asis-eq ${a.equipos[e.id] ? 'presente' : ''}">
        <div class="nom"><label class="switch"><input type="checkbox" data-c="asisEquipo" data-id="${e.id}" ${a.equipos[e.id] ? 'checked' : ''}><span></span></label>${avEq(e, 'p')}<div class="crece"><b>${esc(e.nombre)}</b><small class="chico-txt" style="${a.equipos[e.id] && k < 3 ? 'color:var(--err)' : ''}">${k} de ${e.miembros.length} presentes${a.equipos[e.id] && k < 3 ? ' · faltan para debatir' : ''}</small></div></div>
        <div class="toggles">${e.miembros.map(m => `<label class="toggle-p"><input type="checkbox" data-c="asisMiembro" data-id="${m.id}" data-eq="${e.id}" ${a.miembros[m.id] ? 'checked' : ''}><span class="av">${esc(inicialesPersona(m.nombre))}</span>${esc(m.nombre)}</label>`).join('')}</div>
      </div>`; }).join('')}</section>`;
  }).join('')}
  <section class="asis-grupo"><div class="fila"><h2 style="font-size:20px">Jueces</h2><span class="etq">${jz}/${S.jueces.length}</span></div>
  ${S.jueces.length ? `<div class="toggles">${S.jueces.map(j => `<label class="toggle-p"><input type="checkbox" data-c="asisJuez" data-id="${j.id}" ${a.jueces[j.id] ? 'checked' : ''}><span class="av">${esc(inicialesPersona(j.nombre))}</span>${esc(j.nombre)}</label>`).join('')}</div>` : '<p class="chico-txt">No hay jueces registrados. Agrégalos en <a href="#jueces">Jueces</a>.</p>'}</section>`;
}
function vHistorial() {
  const ps = S.practicas;
  const cols = `minmax(170px,260px) repeat(${ps.length},minmax(26px,1fr)) 56px`;
  return `<div class="panel"><div class="tit">${ico('grafica')}<h3>Mapa de asistencia</h3><span class="acc fila" style="gap:12px;font-size:12px;color:var(--suave)"><span class="fila" style="gap:5px"><i class="punto" style="background:var(--ok)"></i>Completo</span><span class="fila" style="gap:5px"><i class="punto" style="background:color-mix(in srgb,var(--ok) 45%,var(--s3))"></i>Incompleto</span><span class="fila" style="gap:5px"><i class="punto" style="background:var(--s3)"></i>Ausente</span></span></div>
    <div style="overflow-x:auto"><div class="mapa" style="grid-template-columns:${cols};min-width:${260 + ps.length * 30}px">
      <div></div>${ps.map((p, i) => `<div class="cab" title="${esc(p.nombre)} · ${esc(p.fecha)}">${i + 1}</div>`).join('')}<div class="cab">%</div>
      ${S.equipos.map(e => `<div class="nom" title="${esc(e.nombre)}">${esc(e.nombre)}</div>${ps.map(p => { const a = asistenciaDe(p.id); const k = e.miembros.filter(m => a.miembros[m.id]).length;
        return `<div class="c ${a.equipos[e.id] ? (k >= Math.min(3, e.miembros.length) && k === e.miembros.length ? 'si' : 'parcial') : ''}" title="${esc(p.nombre)}: ${a.equipos[e.id] ? k + ' de ' + e.miembros.length : 'ausente'}"></div>`; }).join('')}<div class="pct">${pctAsistencia('equipos', e.id) ?? 0}%</div>`).join('')}
    </div></div></div>
    <div class="acciones" style="margin-top:14px"><button class="btn sec" data-a="expExcel" data-v="Asistencia">${ico('exportar')}Excel de asistencia</button><button class="btn sec" data-a="imprimirAsistencia">${ico('imprimir')}Reporte en PDF</button></div>`;
}

// ---------------- mociones ----------------
const TEMAS = ['Educación', 'Tecnología', 'Política', 'Economía', 'Sociedad', 'Medio ambiente', 'Salud', 'Internacional', 'Ética', 'Cultura', 'Otro'];
function vMociones() {
  const q = ui.buscarMocion.trim().toLowerCase();
  const usadas = S.rondas.filter(r => r.mocion && !S.mociones.some(m => m.texto === r.mocion));
  const lista = S.mociones.filter(m => !q || (m.texto + ' ' + m.info + ' ' + m.tema).toLowerCase().includes(q));
  return cab('Banco de mociones', 'Guarda mociones para las próximas rondas. Al usarlas quedan marcadas con la ronda donde salieron.',
    `<button class="btn prim" data-a="nuevaMocion">${ico('mas')}Agregar moción</button>`) +
  (usadas.length ? `<div class="aviso info">${ico('alerta')}<div>Hay ${usadas.length} moción(es) usadas en rondas que no están en el banco. <button class="btn chico sec" data-a="importarMocionesRondas" style="margin-left:8px">Agregarlas</button></div></div>` : '') +
  (S.mociones.length ? `<div class="fila" style="margin-bottom:16px"><div class="campo-buscar">${ico('buscar')}<input data-i="buscarMocion" placeholder="Buscar por texto o tema" value="${esc(ui.buscarMocion)}"></div></div>
   ${lista.map(m => { const r = m.usada && rondaPorId(m.usada); return `<div class="panel mocion-item"><div class="kpi" style="padding:0"><div class="icono">${ico('mociones')}</div></div><div class="crece"><p>${esc(m.texto)}</p>${m.info ? `<div class="info">${esc(m.info)}</div>` : ''}<div class="fila" style="gap:6px;margin-top:10px">${m.tema ? `<span class="etq">${esc(m.tema)}</span>` : ''}${r ? `<span class="etq ok">${ico('check')} Usada en ${esc(r.nombre)}</span>` : '<span class="etq acento">Disponible</span>'}</div></div>
     <div class="acc"><button class="btn icono chico fant" data-a="copiarMocion" data-id="${m.id}" title="Copiar">${ico('copiar')}</button><button class="btn icono chico fant" data-a="editarMocion" data-id="${m.id}" title="Editar">${ico('editar')}</button><button class="btn icono chico fant" data-a="borrarMocion" data-id="${m.id}" title="Borrar">${ico('borrar')}</button></div></div>`; }).join('') || `<div class="panel">${vacio('buscar', 'Nada coincide')}</div>`}`
  : `<div class="panel">${vacio('mociones', 'El banco está vacío', 'Agrega mociones con anticipación y luego elígelas en cada ronda con un clic.', `<button class="btn prim" data-a="nuevaMocion">${ico('mas')}Agregar la primera</button>`)}</div>`);
}
function capaMocion(id) {
  const m = id ? S.mociones.find(x => x.id === id) : { texto: '', info: '', tema: '' };
  return `<form class="modal" data-form="mocion" data-id="${id || ''}">
    <div class="cab-m"><h2>${id ? 'Editar moción' : 'Nueva moción'}</h2><button type="button" class="btn icono fant cerrar" data-a="cerrarCapa">${ico('cerrar')}</button></div>
    <div class="cuerpo-m"><label>Moción</label><textarea name="texto" required placeholder="Esta Cámara…" style="font-size:16px" autofocus>${esc(m.texto)}</textarea>
    <label>Infoslide (opcional)</label><textarea name="info" placeholder="Contexto o definiciones">${esc(m.info)}</textarea>
    <label>Tema</label><div class="chips">${TEMAS.map(t => `<label class="chip ${m.tema === t ? 'on' : ''}" style="margin:0"><input type="radio" name="tema" value="${t}" ${m.tema === t ? 'checked' : ''} style="display:none" onchange="this.closest('.chips').querySelectorAll('.chip').forEach(c=>c.classList.toggle('on',c.contains(this)))">${t}</label>`).join('')}</div></div>
    <div class="pie-m"><button type="button" class="btn sec" data-a="cerrarCapa">Cancelar</button><button class="btn prim">${ico('check')}Guardar</button></div></form>`;
}

// ---------------- rondas ----------------
function vRondas() {
  return cab('Rondas', 'Formato WSDC: dos equipos por sala, Proposición contra Oposición.') + `
  <form data-form="ronda" class="panel" style="margin-bottom:20px"><div class="fila" style="align-items:end;gap:12px">
    <div style="width:200px"><label style="margin-top:0">Nombre</label><input name="nombre" value="Ronda ${S.rondas.length + 1}"></div>
    <div class="crece" style="min-width:220px"><label style="margin-top:0">Toma la asistencia de</label><select name="practica" required>${S.practicas.map(p => `<option value="${p.id}">${esc(p.nombre)} · ${esc(fechaLarga(p.fecha))}</option>`).reverse().join('') || '<option value="">Primero crea una práctica en Asistencia</option>'}</select></div>
    <label class="check" style="margin-bottom:10px"><input type="checkbox" name="generar" checked> Emparejar al crear</label>
    <button class="btn prim" ${S.practicas.length ? '' : 'disabled'}>${ico('mas')}Crear ronda</button></div></form>
  ${S.rondas.length ? [...S.rondas].reverse().map(r => { const p = S.practicas.find(x => x.id === r.practicaId); const ok = r.debates.filter(completo).length, est = estadoRonda(r);
    return `<a class="panel ronda-card" href="#ronda/${r.id}" style="color:inherit"><div class="numero">${r.numero}</div>
      <div><div class="fila" style="gap:8px"><h2 style="font-size:22px">${esc(r.nombre)}</h2><span class="etq ${est === 3 ? 'ok' : est === 0 ? '' : 'warn'}">${PASOS_RONDA[est]}</span>${r.silenciosa ? '<span class="etq">Silenciosa</span>' : ''}${r.drawPublicado || r.mocionPublicada ? `<span class="etq acento">${ico('pantalla')} En pantalla</span>` : ''}</div>
        <div class="chico-txt" style="margin:4px 0 10px">${p ? esc(p.nombre) + ' · ' + esc(fechaLarga(p.fecha)) : ''} · ${r.debates.length} salas${r.mocion ? ' · ' + esc(r.mocion.slice(0, 80)) + (r.mocion.length > 80 ? '…' : '') : ''}</div>
        <div class="pasos" style="max-width:380px">${[1, 2, 3].map(k => `<span class="${est >= k ? 'on' : ''}"></span>`).join('')}</div></div>
      ${anillo(r.debates.length ? ok / r.debates.length : 0, 64, 7, `<b style="font-size:17px">${ok}/${r.debates.length}</b>`)}</a>`; }).join('')
  : `<div class="panel">${vacio('rondas', 'Aún no hay rondas', S.practicas.length ? 'Crea la primera con el formulario de arriba.' : 'Primero pasa la asistencia de la práctica.', S.practicas.length ? '' : `<a class="btn prim" href="#asistencia">${ico('asistencia')}Ir a Asistencia</a>`)}</div>`}`;
}
function chipEq(d, lado, res) {
  const e = eqPorId(d[lado]);
  if (!e) return `<div class="eq-arrastre vacio-eq" data-drop="${d.id}|${lado}">Elegir equipo<select data-c="drawEquipo" data-d="${d.id}" data-lado="${lado}"><option value=""></option>${S.equipos.map(x => `<option value="${x.id}">${esc(x.nombre)}</option>`).join('')}</select></div>`;
  return `<div class="eq-arrastre ${res && res.ganador === lado ? 'gano' : ''}" draggable="true" data-drag="${d.id}|${lado}" data-drop="${d.id}|${lado}" title="Arrastra para intercambiar con otro equipo">${avEq(e, 'p')}<div class="txt"><b>${esc(e.nombre)}</b><small>${res ? `<span class="num" style="color:var(--texto);font-weight:700">${fmt(res[lado])}</span> pts${res.ganador === lado ? ' · gana' : ''}` : esc(nombreDist(e.distrito))}</small></div></div>`;
}
function vRonda(id) {
  const r = rondaPorId(id); if (!r) return `<div class="panel">${vacio('alerta', 'Ronda no encontrada')}</div>`;
  const a = asistenciaDe(r.practicaId), p = S.practicas.find(x => x.id === r.practicaId);
  const alertas = alertasDraw(r), pest = ui.rondaPest;
  const ok = r.debates.filter(completo).length;
  let cuerpo = '';
  if (pest === 'salas') {
    const presentes = S.equipos.filter(e => a.equipos[e.id] && !e.swing).length;
    cuerpo = `<div class="acciones" style="margin-bottom:16px">
      <button class="btn ${r.debates.length ? 'sec' : 'prim'}" data-a="generarDraw" data-id="${r.id}">${ico('dado')}${r.debates.length ? 'Volver a emparejar' : 'Generar emparejamientos'}</button>
      <button class="btn sec" data-a="agregarDebate" data-id="${r.id}">${ico('mas')}Agregar sala</button>
      <button class="btn ${r.drawPublicado ? 'prim' : 'sec'}" data-a="publicarDraw" data-id="${r.id}">${ico(r.drawPublicado ? 'ojo' : 'pantalla')}${r.drawPublicado ? 'Salas en pantalla' : 'Mostrar salas en pantalla'}</button>
      <button class="btn sec" data-a="imprimirPuertas" data-id="${r.id}">${ico('imprimir')}Hojas para las puertas</button>
      <span class="crece"></span><span class="chico-txt">${presentes} equipos · ${S.jueces.filter(j => a.jueces[j.id]).length} jueces presentes${presentes % 2 ? ' · impar' : ''}</span>
    </div>
    ${alertas.filter(x => !x[0]).map(x => `<div class="aviso err">${ico('alerta')}${esc(x[1])}</div>`).join('')}
    ${r.debates.length ? `<p class="chico-txt" style="margin:0 0 12px">Arrastra un equipo sobre otro para intercambiarlos. Usa ${ico('intercambiar')} para invertir posturas.</p><div class="salas">${r.debates.map(d => {
      const res = resultado(d), av = alertas.filter(x => x[0] === d.id), edit = ui.editSala === d.id;
      return `<div class="panel sala ${av.length ? 'alerta' : ''}">
        <div class="cab"><input data-c="drawAula" data-d="${d.id}" value="${esc(d.aula)}" title="Nombre del aula">${res ? `<span class="etq ok">${ico('check')} Cerrada</span>` : boletasDe(d).length ? '<span class="etq warn">Parcial</span>' : ''}
          <div class="acc"><button class="btn icono chico fant" data-a="editarSala" data-d="${d.id}" title="Cambiar equipos">${ico('editar')}</button><button class="btn icono chico fant" data-a="cambiarLados" data-d="${d.id}" title="Invertir posturas">${ico('intercambiar')}</button><button class="btn icono chico fant" data-a="borrarDebate" data-d="${d.id}" title="Quitar sala">${ico('borrar')}</button></div></div>
        ${av.length ? `<div class="avisos">${ico('alerta')}${esc(av.map(x => x[1]).join(' · '))}</div>` : ''}
        <div class="lados">
          <div class="lado-s prop"><div class="rot">Proposición</div>${edit ? `<select data-c="drawEquipo" data-d="${d.id}" data-lado="prop"><option value="">—</option>${S.equipos.map(x => `<option value="${x.id}" ${x.id === d.prop ? 'selected' : ''}>${esc(x.nombre)}</option>`).join('')}</select>` : chipEq(d, 'prop', res)}</div>
          <div class="vs"><span>VS</span></div>
          <div class="lado-s opp"><div class="rot" style="text-align:right">Oposición</div>${edit ? `<select data-c="drawEquipo" data-d="${d.id}" data-lado="opp"><option value="">—</option>${S.equipos.map(x => `<option value="${x.id}" ${x.id === d.opp ? 'selected' : ''}>${esc(x.nombre)}</option>`).join('')}</select>` : chipEq(d, 'opp', res)}</div>
        </div>
        <div class="jueces">${ico('jueces')}${[0, 1, 2].map(k => k <= d.jueces.length ? `<select data-c="drawJuez" data-d="${d.id}" data-k="${k}"><option value="">${k === 0 ? 'Sin juez' : '+ panel'}</option>${S.jueces.map(j => `<option value="${j.id}" ${d.jueces[k] === j.id ? 'selected' : ''}>${esc(j.nombre)}${a.jueces[j.id] ? '' : ' (ausente)'}</option>`).join('')}</select>` : '').join('')}</div>
        <div class="pie-sala">${res ? `Gana <b style="color:var(--texto)">${esc(nombreEq(d[res.ganador]))}</b> por ${fmt(res.margen)}` : `${boletasDe(d).length}/${Math.max(1, d.jueces.length)} boletas`}
          <div class="acciones">${(d.jueces.length ? d.jueces : ['tab']).map(j => `<a class="btn ${d.boletas[j] ? 'sec' : 'prim'} chico" href="#boleta/${r.id}/${d.id}/${j}">${ico(d.boletas[j] ? 'check' : 'juez')}${d.jueces.length > 1 ? esc((juezPorId(j) || {}).nombre?.split(' ')[0] || '') : d.boletas[j] ? 'Revisar' : 'Boleta'}</a>`).join('')}</div></div>
      </div>`; }).join('')}</div>` : `<div class="panel">${vacio('dado', 'Sin emparejamientos', `${presentes} equipos presentes en ${esc(p ? p.nombre : 'la práctica')}.`, `<button class="btn prim" data-a="generarDraw" data-id="${r.id}">${ico('dado')}Generar emparejamientos</button>`)}</div>`}
    ${(r.descansos || []).length ? `<div class="aviso warn" style="margin-top:14px">${ico('alerta')}Descansa esta ronda: ${esc(r.descansos.map(nombreEq).join(', '))}</div>` : ''}`;
  } else if (pest === 'mocion') {
    const libres = S.mociones.filter(m => !m.usada || m.usada === r.id);
    cuerpo = `<div class="rejilla r-2-1"><div class="panel">
      ${libres.length ? `<label style="margin-top:0">Elegir del banco</label><select data-c="elegirMocion" data-id="${r.id}"><option value="">— ${libres.length} mociones disponibles —</option>${libres.map(m => `<option value="${m.id}">${esc(m.texto.slice(0, 110))}</option>`).join('')}</select>` : ''}
      <label>Moción</label><textarea data-c="mocion" data-id="${r.id}" placeholder="Esta Cámara…" style="font-size:17px;min-height:110px">${esc(r.mocion || '')}</textarea>
      <label>Infoslide <span class="tenue">(opcional)</span></label><textarea data-c="infoslide" data-id="${r.id}" placeholder="Contexto o definiciones necesarias para entender la moción">${esc(r.infoslide || '')}</textarea>
      <div class="acciones" style="margin-top:16px">
        ${r.mocionPublicada ? `<button class="btn peligro" data-a="ocultarMocion" data-id="${r.id}">${ico('ojoNo')}Quitar de la pantalla</button>` : `<button class="btn prim" data-a="publicarMocion" data-id="${r.id}">${ico('pantalla')}Publicar e iniciar ${Math.round(S.torneo.tiempos.prep / 60)} min de preparación</button>`}
        <button class="btn sec" data-a="guardarMocionBanco" data-id="${r.id}">${ico('mociones')}Guardar en el banco</button>
        <a class="btn fant" href="#cronometro">${ico('cronometro')}Cronómetro</a>
      </div></div>
      <div class="panel" style="background:linear-gradient(140deg,#0b3366,#072144);color:#fff;border-color:rgba(124,251,221,.25)"><div class="chico-txt" style="color:#7cfbdd;font-weight:800;letter-spacing:2px;text-transform:uppercase;font-size:11px">Vista previa · pantalla</div>
        <div style="font-family:var(--cond);font-weight:800;font-size:28px;line-height:1.08;margin:12px 0">${esc(r.mocion || 'La moción aparecerá aquí')}</div>${r.infoslide ? `<div style="color:#b6e7ff;font-size:13px;border-left:3px solid #7cfbdd;padding-left:10px;white-space:pre-wrap">${esc(r.infoslide)}</div>` : ''}
        <div style="margin-top:14px"><span class="etq ${r.mocionPublicada ? 'ok' : ''}" style="${r.mocionPublicada ? '' : 'background:rgba(255,255,255,.08);color:#b6e7ff'}">${r.mocionPublicada ? 'Publicada' : 'Sin publicar'}</span></div></div></div>`;
  } else {
    cuerpo = `<div class="fila" style="margin-bottom:14px"><label class="check"><span class="switch"><input type="checkbox" data-c="silenciosa" data-id="${r.id}" ${r.silenciosa ? 'checked' : ''}><span></span></span>Ronda silenciosa: los resultados no salen en la pantalla pública</label></div>
    <div class="tabla"><table><thead><tr><th>Sala</th><th>Proposición</th><th>Oposición</th><th>Resultado</th><th>Boletas</th></tr></thead><tbody>
    ${r.debates.map(d => { const res = resultado(d); const js = d.jueces.length ? d.jueces : ['tab'];
      const celda = l => `<td><div class="celda-eq">${avEq(eqPorId(d[l]), 'p')}<div><b style="${res && res.ganador === l ? '' : res ? 'font-weight:500;color:var(--suave)' : ''}">${esc(nombreEq(d[l]))}</b>${res ? `<small class="num">${fmt(res[l])}</small>` : ''}</div></div></td>`;
      return `<tr><td><b>${esc(d.aula)}</b></td>${celda('prop')}${celda('opp')}
        <td>${res ? `<span class="etq ${res.ganador}">Gana ${res.ganador === 'prop' ? 'Prop.' : 'Op.'}</span><div class="chico-txt num" style="margin-top:4px">+${fmt(res.margen)}${res.n > 1 ? ' · ' + res.votos : ''}</div>` : '<span class="etq">Pendiente</span>'}</td>
        <td><div class="acciones" style="gap:6px">${js.map(j => `<a class="btn ${d.boletas[j] ? 'sec' : 'prim'} chico" href="#boleta/${r.id}/${d.id}/${j}">${ico(d.boletas[j] ? 'check' : 'juez')}${d.boletas[j] ? 'Revisar' : 'Llenar'}${j === 'tab' ? '' : ' · ' + esc((juezPorId(j)?.nombre || 'Juez').split(' ')[0])}</a>`).join('')}</div></td></tr>`; }).join('') || `<tr><td colspan="5">${vacio('dado', 'Primero genera los emparejamientos')}</td></tr>`}
    </tbody></table></div>
    <div class="acciones" style="margin-top:14px"><button class="btn sec" data-a="imprimirBoletas" data-id="${r.id}">${ico('imprimir')}Boletas en blanco para imprimir</button><button class="btn sec" data-a="expExcel" data-v="Resultados">${ico('exportar')}Resultados en Excel</button></div>`;
  }
  return cab(esc(r.nombre), `${p ? esc(p.nombre) + ' · ' + esc(fechaLarga(p.fecha)) + ' · ' : ''}${r.debates.length} salas · ${ok} cerradas`,
    `<div style="width:220px"><div class="chico-txt" style="margin-bottom:6px">${PASOS_RONDA[estadoRonda(r)]}</div><div class="pasos">${[1, 2, 3].map(k => `<span class="${estadoRonda(r) >= k ? 'on' : ''}"></span>`).join('')}</div></div>
     <button class="btn icono fant" data-a="borrarRonda" data-id="${r.id}" title="Eliminar ronda">${ico('borrar')}</button>`) +
    `<div class="pestanas">${[['salas', 'Salas', r.debates.length], ['mocion', 'Moción', ''], ['resultados', 'Resultados', `${ok}/${r.debates.length}`]].map(([k, t, n]) => `<button class="${pest === k ? 'on' : ''}" data-a="rondaPest" data-p="${k}">${t}${n !== '' ? ` <span class="n">${n}</span>` : ''}</button>`).join('')}</div>` + cuerpo;
}

// ---------------- boleta ----------------
const paso = (nombre, min, max, valor) => `<div class="paso"><button type="button" data-paso="-0.5" tabindex="-1">−</button><input type="number" inputmode="decimal" step="0.5" min="${min}" max="${max}" placeholder="${min}–${max}" data-i="pt" name="${nombre}" value="${valor ?? ''}"><button type="button" data-paso="0.5" tabindex="-1">+</button></div>`;
function vBoleta(rid, did, jid) {
  const r = rondaPorId(rid), d = r && r.debates.find(x => x.id === did);
  if (!d) return `<div class="panel">${vacio('alerta', 'Sala no encontrada')}</div>`;
  const b = d.boletas[jid];
  const modo = (borrador.clave === `${rid}/${did}/${jid}` && borrador.modo) || (b && b.modo) || S.torneo.modoPuntaje;
  const a = asistenciaDe(r.practicaId);
  const lado = l => {
    const eq = eqPorId(d[l]); if (!eq) return `<div class="panel">${vacio('alerta', 'Falta el equipo de ' + (l === 'prop' ? 'Proposición' : 'Oposición'))}</div>`;
    const presentes = eq.miembros.filter(m => a.miembros[m.id]);
    const base = d.oradores ? d.oradores[l] : { s: (presentes.length >= 3 ? presentes : eq.miembros).slice(0, 3).map(m => m.id), r: null };
    const rep = base.r || base.s[0];
    const opts = sel => eq.miembros.map(m => `<option value="${m.id}" ${m.id === sel ? 'selected' : ''}>${esc(m.nombre)}${a.miembros[m.id] ? '' : ' (ausente)'}</option>`).join('');
    const fila = (i, esRep) => {
      const p = esRep ? ((b && b[l].rep) || {}) : ((b && b[l].puntos[i]) || {}), E = esRep ? ESCALA.replica : ESCALA.constructivo, k = esRep ? 'r' : i;
      const campos = modo === 'desglosado'
        ? [['c', 'Contenido'], ['e', 'Estilo'], ['s', 'Estrategia']].map(([x, n]) => `<div><label>${n} <span>${E[x][0]}–${E[x][1]}</span></label>${paso(`${l}-${k}-${x}`, E[x][0], E[x][1], p[x])}</div>`).join('')
        : `<div><label>Puntaje <span>${E.min}–${E.max}</span></label>${paso(`${l}-${k}-t`, E.min, E.max, p.t)}</div>`;
      return `<div class="orador ${modo === 'directo' ? 'directo' : ''} ${esRep ? 'rep' : ''}"><div class="sel"><label>${esRep ? 'Réplica · 1.º o 2.º orador' : (i + 1) + '.º orador'}</label><select data-i="pt" name="${esRep ? l + '-r' : l + '-s' + i}">${opts(esRep ? rep : base.s[i])}</select></div>${campos}<div class="tot" id="t-${l}-${k}">–</div></div>`;
    };
    return `<div class="panel boleta-lado ${l}"><div class="cabeza-l">${avEq(eq)}<div><div class="postura">${l === 'prop' ? 'Proposición' : 'Oposición'}</div><h3 style="font-size:17px">${esc(eq.nombre)}</h3></div><div class="total-l"><b id="t-${l}">–</b><small>total</small></div></div>
      <div class="cuerpo">${[0, 1, 2].map(i => fila(i, false)).join('')}${fila(0, true)}</div></div>`;
  };
  const juez = jid === 'tab' ? 'Mesa de tabulación' : (juezPorId(jid) || {}).nombre || '';
  return cab(`${esc(d.aula)} <span class="tenue" style="font-weight:700">·</span> Boleta`, `${ico('juez')} ${esc(juez)}${r.mocion ? ` &nbsp;·&nbsp; ${esc(r.mocion)}` : ''}`,
    `<div class="segmento"><button class="${modo === 'desglosado' ? 'on' : ''}" data-a="modoBoleta" data-m="desglosado">Por criterio</button><button class="${modo === 'directo' ? 'on' : ''}" data-a="modoBoleta" data-m="directo">Puntaje directo</button></div>
     <button class="btn icono sec" data-a="imprimirBoletaSala" data-r="${rid}" data-d="${did}" title="Imprimir en blanco">${ico('imprimir')}</button>
     <a class="btn sec" href="${vueltaBoleta(r.id)}">${ico('atras')}Volver</a>`) + `
  <form data-form="boleta" data-r="${rid}" data-d="${did}" data-j="${jid}" data-modo="${modo}">
    <div class="rejilla lados-boleta">${lado('prop')}${lado('opp')}</div>
    <div class="marcador"><div class="proporcion"><i id="pr-prop" style="width:50%"></i><i id="pr-opp" style="width:50%"></i></div>
      <div class="fila-m"><div><span class="l prop">Proposición</span><b class="t" id="m-prop">–</b></div>
      <div class="medio"><div id="m-gana">Completa la boleta</div><button class="btn prim">${ico('check')}Guardar boleta</button></div>
      <div class="der"><span class="l opp">Oposición</span><b class="t" id="m-opp">–</b></div></div></div>
    <div id="avisosBoleta"></div>
    ${b ? `<button type="button" class="btn peligro chico" data-a="borrarBoleta" data-r="${rid}" data-d="${did}" data-j="${jid}">${ico('borrar')}Borrar esta boleta</button>` : ''}
  </form>
  <p class="chico-txt" style="margin-top:14px">Escala WSDC: discursos 60–80 (Contenido 40 %, Estilo 40 %, Estrategia 20 %); réplica 30–40. Gana quien sume más; no hay empates. Usa los botones − y + para ajustar de medio en medio punto.</p>`;
}
function leerBoleta(form) {
  const modo = form.dataset.modo, f = n => { const el = form.elements[n]; return el && el.value !== '' ? Number(el.value) : null; };
  const out = { modo, prop: {}, opp: {}, errores: [] };
  for (const l of ['prop', 'opp']) {
    if (!form.elements[`${l}-s0`]) { out.errores.push('Falta un equipo en esta sala.'); out[l] = { puntos: [], rep: { t: null }, total: null, s: [], r: '' }; continue; }
    const lado = { s: [0, 1, 2].map(i => form.elements[`${l}-s${i}`].value), r: form.elements[`${l}-r`].value, puntos: [], rep: null };
    const pieza = (clave, E) => {
      if (modo === 'desglosado') {
        const c = f(`${l}-${clave}-c`), e = f(`${l}-${clave}-e`), s = f(`${l}-${clave}-s`);
        const t = c != null && e != null && s != null ? c + e + s : null;
        const fuera = [['c', c], ['e', e], ['s', s]].filter(([k, v]) => v != null && (v < E[k][0] || v > E[k][1])).map(([k]) => k);
        return { c, e, s, t, fuera };
      }
      const t = f(`${l}-${clave}-t`); return { t, fuera: t != null && (t < E.min || t > E.max) ? ['t'] : [] };
    };
    lado.puntos = [0, 1, 2].map(i => pieza(i, ESCALA.constructivo));
    lado.rep = pieza('r', ESCALA.replica);
    lado.total = [...lado.puntos, lado.rep].every(p => p.t != null) ? suma(lado.puntos.map(p => p.t)) + lado.rep.t : null;
    out[l] = lado;
    const nom = l === 'prop' ? 'Proposición' : 'Oposición';
    if (new Set(lado.s).size < 3) out.errores.push(`${nom}: los 3 oradores deben ser personas distintas.`);
    if (!lado.s.slice(0, 2).includes(lado.r)) out.errores.push(`${nom}: la réplica la hace el 1.º o el 2.º orador.`);
    if ([...lado.puntos, lado.rep].some(p => p.fuera.length)) out.errores.push(`${nom}: hay puntajes fuera de la escala.`);
    if (lado.total == null) out.errores.push(`${nom}: faltan puntajes.`);
  }
  if (out.prop.total != null && out.opp.total != null && out.prop.total === out.opp.total) out.errores.push('Empate: en WSDC no hay empates. Ajusta algún puntaje.');
  return out;
}
function recalcBoleta() {
  const form = $('form[data-form=boleta]'); if (!form) return;
  const b = leerBoleta(form);
  for (const l of ['prop', 'opp']) {
    (b[l].puntos || []).forEach((p, i) => { const el = $(`#t-${l}-${i}`); if (el) el.textContent = p.t ?? '–'; });
    const er = $(`#t-${l}-r`); if (er) er.textContent = b[l].rep.t ?? '–';
    const t = $(`#t-${l}`); if (t) t.textContent = b[l].total ?? '–';
    $(`#m-${l}`).textContent = b[l].total ?? '–';
  }
  for (const inp of $$('input[data-i=pt]', form)) {
    const v = inp.value === '' ? null : Number(inp.value);
    inp.closest('.paso').classList.toggle('fuera', v != null && (v < Number(inp.min) || v > Number(inp.max)));
  }
  const tp = b.prop.total || 0, to = b.opp.total || 0;
  if (tp + to) { $('#pr-prop').style.width = tp / (tp + to) * 100 + '%'; $('#pr-opp').style.width = to / (tp + to) * 100 + '%'; }
  const g = $('#m-gana');
  if (b.prop.total != null && b.opp.total != null && b.prop.total !== b.opp.total) { const gp = b.prop.total > b.opp.total; g.textContent = `Gana ${gp ? 'Proposición' : 'Oposición'} por ${fmt(Math.abs(b.prop.total - b.opp.total))}`; g.style.color = gp ? 'var(--prop)' : 'var(--opp)'; }
  else { g.textContent = b.prop.total != null && b.prop.total === b.opp.total ? 'Empate: no se permite' : 'Completa la boleta'; g.style.color = b.prop.total != null && b.prop.total === b.opp.total ? 'var(--err)' : ''; }
  $('#avisosBoleta').innerHTML = b.errores.length && (b.prop.total != null || b.opp.total != null) ? `<div class="aviso err">${ico('alerta')}<div>${b.errores.map(esc).join('<br>')}</div></div>` : '';
}

// ---------------- cronómetro ----------------
function vCronometro() {
  const t = S.torneo.tiempos, c = S.crono;
  const lado = c.tipo === 'prep' ? 'prep' : c.lado || (DISCURSOS[c.indice] || [])[2] || '';
  return cab('Cronómetro', `Discursos de ${mmss(t.constructivo)}, réplicas de ${mmss(t.replica)} y ${mmss(t.prep)} de preparación. Se cambian en Ajustes.`,
    `<a class="btn sec" href="#publico" target="_blank">${ico('pantalla')}Pantalla pública</a>`) + `
  <div class="crono">
    <div class="panel reloj-panel" id="relojPanel">
      <div class="quien ${lado}">${esc(c.etiqueta)}</div>
      <div class="esfera"><svg viewBox="0 0 320 320"><circle class="pista" cx="160" cy="160" r="140" fill="none" stroke-width="14"/><circle data-anillo cx="160" cy="160" r="140" fill="none" stroke-width="14" stroke-linecap="round" stroke-dasharray="${ANILLO}" stroke-dashoffset="${ANILLO}"/></svg>
        <div class="dentro"><div class="reloj" data-reloj="${c.tipo === 'prep' ? 'restante' : 'transcurrido'}">00:00</div><span data-estado-crono></span><span class="chico-txt num">${c.tipo === 'prep' ? 'cuenta regresiva' : 'de ' + mmss(c.duracion)}</span></div></div>
      <div class="controles">
        <button class="btn icono sec" data-a="cronoAjuste" data-s="-15" title="Restar 15 s">−15</button>
        <button class="btn icono sec" data-a="cronoReiniciar" title="Reiniciar (R)">${ico('reiniciar')}</button>
        <button class="btn prim grande" data-a="cronoIniciar" title="Iniciar o pausar (Espacio)">${ico(c.corriendo ? 'pausa' : 'play')}</button>
        <button class="btn icono sec" data-a="cronoSiguiente" title="Siguiente orador (N)">${ico('siguiente')}</button>
        <button class="btn icono sec" data-a="cronoAjuste" data-s="15" title="Sumar 15 s">+15</button>
      </div>
      <div class="atajos"><span><kbd>Espacio</kbd>iniciar / pausar</span><span><kbd>N</kbd>siguiente</span><span><kbd>R</kbd>reiniciar</span><span><kbd>P</kbd>preparación</span><span><kbd>F</kbd>pantalla completa</span><span><kbd>B</kbd>campana</span></div>
    </div>
    ${(() => { const r = rondaEnCurso(); if (!r || r.debates.length < 2) return ''; const s = salaEnPantalla(r);
      return `<div class="panel sala-pantalla"><div class="tit">${ico('pantalla')}<h3>Sala que se proyecta</h3></div><select data-c="salaPantalla">${r.debates.map(d => `<option value="${d.id}" ${s && s.id === d.id ? 'selected' : ''}>${esc(d.aula)} · ${esc(nombreEq(d.prop))} vs ${esc(nombreEq(d.opp))}</option>`).join('')}</select><p class="chico-txt" style="margin:8px 0 0">El portal en vivo y la pantalla pública muestran esta sala con su tiempo.</p></div>`; })()}
    <div class="panel"><div class="tit">${ico('microfono')}<h3>Orden de oradores</h3><button class="acc btn icono chico fant" data-a="pantallaCompleta" title="Pantalla completa">${ico('pantallaCompleta')}</button></div>
      <div class="orden-oradores">
        <button class="prep ${c.tipo === 'prep' ? 'on' : ''}" data-a="cronoPrep"><span class="n">${ico('mociones')}</span>Preparación<span class="t">${mmss(t.prep)}</span></button>
        ${DISCURSOS.map(([n, tipo, l], i) => `<button class="${l} ${c.tipo !== 'prep' && c.indice === i ? 'on' : ''}" data-a="cronoDiscurso" data-i="${i}"><span class="n">${tipo === 'replica' ? 'R' : Math.floor(i / 2) + 1}</span>${n}<span class="t">${mmss(t[tipo])}</span></button>`).join('')}
      </div>
      <div style="border-top:1px solid var(--borde);margin-top:14px;padding-top:14px" class="acciones"><button class="btn sec chico" data-a="campana">${ico('campana')}Probar campana</button></div>
      <p class="chico-txt" style="margin:12px 0 0">Campanas: una al terminar el minuto protegido, una al empezar el último minuto, dos al cumplirse el tiempo y tres al terminar la gracia (${t.gracia} s). Deja esta pestaña abierta para que suenen.</p>
    </div>
  </div>`;
}

// ---------------- tablas ----------------
function podio(items) {
  if (items.length < 3) return '';
  const orden = [[items[1], 2], [items[0], 1], [items[2], 3]];
  return `<div class="podio">${orden.map(([x, k]) => `<div class="p${k}"><div class="esc">${x.av}<b>${esc(x.nombre)}</b><div class="pts">${x.dato}</div></div><div class="base">${k}</div></div>`).join('')}</div>`;
}
function vTablas() {
  const pub = ui.verPublico, dist = ui.filtroDist, pest = ui.pestTabla;
  let cuerpo = '';
  if (pest === 'equipos') {
    const st = standings(pub).filter(f => !dist || f.e.distrito === dist), hay = st.some(f => f.jugados);
    cuerpo = (hay ? podio(st.slice(0, 3).map(f => ({ av: avEq(f.e, 'g'), nombre: f.e.nombre, dato: `${f.v} V · ${fmt(f.pts)} pts` }))) : '') + `<div class="tabla"><table><thead><tr><th>#</th><th>Equipo</th><th>Distrito</th><th class="n">V</th><th class="n">Puntos</th><th class="n">Margen</th><th class="n">Deb.</th><th>Ronda a ronda</th></tr></thead><tbody>
    ${st.map((f, i) => `<tr class="clic" data-a="perfilEquipo" data-id="${f.e.id}"><td><span class="rk ${hay && i < 3 ? 'r' + (i + 1) : ''}">${i + 1}</span></td><td><div class="celda-eq">${avEq(f.e, 'p')}<div><b>${esc(f.e.nombre)}</b>${f.e.centro !== f.e.nombre ? `<small>${esc(f.e.centro)}</small>` : ''}</div></div></td><td>${etqDist(f.e.distrito)}</td><td class="n" style="font-size:16px;font-weight:700">${f.v}</td><td class="n">${fmt(f.pts)}</td><td class="n" style="color:${f.margen > 0 ? 'var(--ok)' : f.margen < 0 ? 'var(--err)' : ''}">${f.margen > 0 ? '+' : ''}${fmt(f.margen)}</td><td class="n">${f.jugados}</td><td style="white-space:nowrap">${f.hist.map(h => `<span class="vd ${h.gano ? 'v' : 'd'}" title="${esc(h.ronda)} · ${h.lado === 'prop' ? 'Proposición' : 'Oposición'} contra ${esc(nombreEq(h.rival))}">${h.gano ? 'V' : 'D'}</span>`).join('')}</td></tr>`).join('')}
    </tbody></table></div>`;
  } else if (pest === 'distritos') {
    const st = standings(pub);
    const filas = S.torneo.distritos.map(d => { const fs = st.filter(f => f.e.distrito === d.codigo); const deb = suma(fs.map(f => f.jugados)); return { d, n: fs.length, v: suma(fs.map(f => f.v)), deb, pp: deb ? suma(fs.map(f => f.pts)) / deb : 0, mejor: fs[0] }; }).sort((a, b) => (b.deb ? b.v / b.deb : 0) - (a.deb ? a.v / a.deb : 0));
    cuerpo = `<div class="tabla"><table><thead><tr><th>Distrito</th><th class="n">Equipos</th><th class="n">Victorias</th><th>% de victorias</th><th class="n">Puntos por debate</th><th>Mejor equipo</th></tr></thead><tbody>
      ${filas.map(x => `<tr><td><div class="fila" style="gap:10px"><i class="punto" style="background:${colorDist(x.d.codigo)};width:12px;height:12px"></i><b>${esc(nombreDist(x.d.codigo))}</b></div></td><td class="n">${x.n}</td><td class="n">${x.v}</td><td style="min-width:160px"><div class="fila" style="flex-wrap:nowrap;gap:8px"><div class="crece">${barra(x.deb ? x.v / x.deb * 100 : 0)}</div><span class="num chico-txt">${x.deb ? Math.round(x.v / x.deb * 100) : 0}%</span></div></td><td class="n">${x.deb ? fmt(x.pp) : '—'}</td><td>${x.mejor && x.mejor.jugados ? esc(x.mejor.e.nombre) : '—'}</td></tr>`).join('')}</tbody></table></div>`;
  } else {
    const rep = pest === 'replicas', filas = rankingOradores(rep, pub, dist);
    cuerpo = (filas.length >= 3 ? podio(filas.slice(0, 3).map(o => ({ av: `<div class="av g persona">${esc(inicialesPersona(o.nombre))}</div>`, nombre: o.nombre, dato: `${fmt(o.prom)} de promedio` }))) : '') +
    `<div class="tabla"><table><thead><tr><th>#</th><th>${rep ? 'Orador de réplica' : 'Orador'}</th><th>Equipo</th><th class="n">${rep ? 'Réplicas' : 'Discursos'}</th><th class="n">Promedio</th><th class="n">Total</th><th>Puntajes</th></tr></thead><tbody>
    ${filas.map((o, i) => `<tr><td><span class="rk ${i < 3 ? 'r' + (i + 1) : ''}">${i + 1}</span></td><td><div class="celda-eq">${avPersona(o.nombre)}<b>${esc(o.nombre)}</b></div></td><td><div class="celda-eq">${avEq(eqPorId(o.equipo), 'p')}<span class="chico-txt">${esc(nombreEq(o.equipo))}</span></div></td><td class="n">${o.arr.length}</td><td class="n" style="font-size:16px;font-weight:700">${fmt(o.prom)}</td><td class="n">${fmt(o.total)}</td><td class="num chico-txt">${o.arr.map(fmt).join(' · ')}</td></tr>`).join('') || `<tr><td colspan="7">${vacio('microfono', 'Todavía no hay puntajes')}</td></tr>`}
    </tbody></table></div><p class="chico-txt">Se ordena por promedio, lo justo cuando los integrantes rotan entre rondas; si empatan, decide el total.</p>`;
  }
  const hoja = { equipos: 'Tabla de equipos', oradores: 'Oradores', replicas: 'Réplicas', distritos: 'Tabla de equipos' }[pest];
  return cab('Tablas', pest === 'equipos' ? 'Orden: victorias, luego puntos totales, luego margen.' : pest === 'oradores' ? 'Discursos constructivos, escala 60–80.' : pest === 'replicas' ? 'Discursos de réplica, escala 30–40.' : 'Rendimiento de cada distrito educativo.',
    `<button class="btn sec" data-a="expExcel" data-v="${hoja}">${ico('exportar')}Excel</button><button class="btn sec" data-a="imprimirTabla">${ico('imprimir')}PDF</button>
     <label class="check btn sec" style="margin:0"><span class="switch"><input type="checkbox" data-c="mostrarTabla" ${S.publico.mostrarTabla ? 'checked' : ''}><span></span></span>En pantalla</label>`) + `
  <div class="pestanas">${[['equipos', 'Equipos', 'equipos'], ['oradores', 'Oradores', 'microfono'], ['replicas', 'Réplicas', 'reiniciar'], ['distritos', 'Distritos', 'grafica']].map(([k, t, i]) => `<button class="${pest === k ? 'on' : ''}" data-a="pestTabla" data-p="${k}">${ico(i)}${t}</button>`).join('')}</div>
  ${pest !== 'distritos' ? `<div class="fila" style="margin-bottom:18px;gap:14px">${chipsDist(S.equipos.filter(e => !e.swing))}<span class="crece"></span><label class="check"><span class="switch"><input type="checkbox" data-c="verPublico" ${pub ? 'checked' : ''}><span></span></span>Ocultar rondas silenciosas</label></div>` : ''}` + cuerpo;
}

// ---------------- eliminatorias ----------------
const NOMBRES_ELIM = { 2: 'Gran final', 4: 'Semifinales', 8: 'Cuartos de final', 16: 'Octavos de final', 32: 'Dieciseisavos' };
function ordenSembrado(n) { let o = [1]; while (o.length < n) { const m = o.length * 2 + 1; o = o.flatMap(x => [x, m - x]); } return o; }
function vEliminatorias() {
  const E = S.elim;
  const tamanos = [2, 4, 8, 16].filter(n => n <= S.equipos.filter(e => !e.swing).length);
  const u = E.rondas[E.rondas.length - 1], campeon = u && u.debates.length === 1 && u.debates[0].ganador ? u.debates[0][u.debates[0].ganador] : null;
  return cab('Eliminatorias', 'Clasifican los primeros de la tabla. Haz clic en el ganador de cada llave para que avance.',
    `<select style="width:auto" data-c="breakSize">${tamanos.map(n => `<option value="${n}" ${S.torneo.breakSize === n ? 'selected' : ''}>Clasifican ${n} · ${NOMBRES_ELIM[n].toLowerCase()}</option>`).join('')}</select>
     <button class="btn prim" data-a="generarElim">${ico('eliminatorias')}Armar cuadro</button>
     <button class="btn ${E.publicado ? 'prim' : 'sec'}" data-a="publicarElim">${ico('pantalla')}${E.publicado ? 'En pantalla' : 'Mostrar'}</button>
     ${campeon ? `<button class="btn sec" data-a="imprimirDiplomas">${ico('diploma')}Diplomas</button>` : ''}`) +
  (E.rondas.length ? `<div class="panel" style="padding:24px"><div class="cuadro">${E.rondas.map((ro, k) => `<div class="col ${k === E.rondas.length - 1 && !campeon && ro.debates.length > 1 ? '' : k === E.rondas.length - 1 ? 'ultima' : ''}"><h3>${esc(ro.nombre)}</h3>${ro.debates.map((d, j) => `<div class="llave">
      ${['a', 'b'].map(x => `<button data-a="ganaElim" data-k="${k}" data-j="${j}" data-x="${x}" class="${d.ganador === x ? 'gana' : d.ganador ? 'pierde' : ''}"><span class="sem">${d['s' + x]}</span><span>${esc(nombreEq(d[x]))}</span><span class="post ${d.prop === x ? 'prop' : 'opp'}">${d.prop === x ? 'PROP' : 'OPP'}</span></button>`).join('')}
      <div class="pie-llave"><button class="btn chico fant" data-a="ladosElim" data-k="${k}" data-j="${j}">${ico('intercambiar')}Posturas</button><span>${d.ganador ? 'avanza ' + esc(nombreEq(d[d.ganador]).split(' ').slice(0, 3).join(' ')) : 'por jugar'}</span></div>
    </div>`).join('')}</div>`).join('')}
    ${campeon ? `<div class="col ultima"><h3>Campeón</h3><div class="campeon">${ico('tablas')}<div class="chico-txt">${esc(S.torneo.nombre)}</div><b>${esc(nombreEq(campeon))}</b></div></div>` : ''}
  </div></div>` : `<div class="panel">${vacio('eliminatorias', 'El cuadro aún no está armado', 'Cuando terminen las rondas preliminares, elige cuántos equipos clasifican y pulsa “Armar cuadro”.')}</div>`);
}

// ---------------- exportar ----------------
function vExportar() {
  const r = rondaPorId(ui.rondaExp) || S.rondas[S.rondas.length - 1];
  const exp = (accion, icono, titulo, texto, formato, extra = '', c = '') => `<button class="panel exp ${c}" data-a="${accion}" ${extra}><div class="icono">${ico(icono)}</div><div><b>${titulo}</b><p>${texto}</p><span class="formato">${formato}</span></div></button>`;
  return cab('Exportar e imprimir', 'Todo lo del torneo en Excel, PDF o papel. Para PDF, elige “Guardar como PDF” en la ventana de impresión.') + `
  <h2 style="font-size:20px;margin:4px 0 12px">Excel</h2>
  <div class="rejilla r3" style="margin-bottom:26px">
    ${exp('expExcel', 'grafica', 'Libro completo del torneo', 'Tablas, oradores, réplicas, resultados, puntajes por juez, asistencia, equipos, jueces y mociones.', '.xlsx · 9 hojas', 'data-v=""')}
    ${exp('expExcel', 'tablas', 'Tabla de equipos', 'Posiciones con victorias, puntos y margen.', '.xlsx', 'data-v="Tabla de equipos"', 'c2')}
    ${exp('expExcel', 'microfono', 'Ranking de oradores', 'Promedios y totales de cada debatiente.', '.xlsx', 'data-v="Oradores"', 'c2')}
    ${exp('expExcel', 'rondas', 'Resultados por ronda', 'Cada sala con ganador, margen, jueces y moción.', '.xlsx', 'data-v="Resultados"', 'c3')}
    ${exp('expExcel', 'asistencia', 'Asistencia', 'Presente o ausente por práctica, con porcentaje.', '.xlsx', 'data-v="Asistencia"', 'c3')}
    ${exp('expExcel', 'juez', 'Puntajes por juez', 'Contenido, estilo y estrategia de cada orador.', '.xlsx', 'data-v="Puntajes por orador"', 'c4')}
  </div>
  <div class="fila" style="margin:4px 0 12px"><h2 style="font-size:20px">PDF e impresión</h2><span class="crece"></span>${S.rondas.length ? `<span class="chico-txt">Ronda para hojas y boletas</span><select style="width:auto" data-c="rondaExp">${S.rondas.map(x => `<option value="${x.id}" ${r && x.id === r.id ? 'selected' : ''}>${esc(x.nombre)}</option>`).join('')}</select>` : ''}</div>
  <div class="rejilla r3" style="margin-bottom:26px">
    ${exp('imprimirTabla', 'tablas', 'Tablas oficiales', 'Equipos, oradores y réplicas listos para publicar.', 'PDF')}
    ${exp('imprimirDiplomas', 'diploma', 'Diplomas', 'Tres mejores equipos, tres mejores oradores y mejor réplica, con la identidad del club.', 'PDF · horizontal', '', 'c3')}
    ${exp('imprimirAsistencia', 'asistencia', 'Reporte de asistencia', 'Porcentaje por equipo e integrante.', 'PDF', '', 'c2')}
    ${r ? exp('imprimirPuertas', 'pantalla', 'Hojas para las puertas', `Una hoja por aula de ${esc(r.nombre)} con los equipos y posturas.`, 'PDF', `data-id="${r.id}"`, 'c2') : ''}
    ${r ? exp('imprimirBoletas', 'juez', 'Boletas en blanco', `Una boleta WSDC por sala de ${esc(r.nombre)} para que los jueces llenen a mano.`, 'PDF', `data-id="${r.id}"`, 'c4') : ''}
    ${r ? exp('imprimirSalas', 'lista', 'Lista de salas', `Todas las salas de ${esc(r.nombre)} en una página.`, 'PDF', `data-id="${r.id}"`, 'c4') : ''}
  </div>
  <h2 style="font-size:20px;margin:4px 0 12px">Copia de seguridad</h2>
  <div class="rejilla r3">
    ${exp('exportarJSON', 'exportar', 'Descargar copia', 'Guarda todo el torneo en un archivo. Con él sigues en otra computadora.', '.json')}
    <label class="panel exp" style="margin:0"><div class="icono">${ico('importar')}</div><div><b>Cargar copia</b><p>Reemplaza los datos de este navegador por los de un archivo.</p><span class="formato">.json</span></div><input type="file" accept=".json" data-c="importarJSON" hidden></label>
    <label class="panel exp c2" style="margin:0"><div class="icono">${ico('equipos')}</div><div><b>Importar equipos</b><p>Columnas: Equipo, Centro, Distrito, Comodín, Integrantes (separados por |), Team manager.</p><span class="formato">.csv</span></div><input type="file" accept=".csv" data-c="importarCSV" hidden></label>
  </div>`;
}

// ---------------- vista de juez ----------------
function vJuez(jid) {
  if (!jid) return cab('Vista de juez', 'Cada juez busca su nombre, ve su sala y llena la boleta desde aquí.') +
    (S.jueces.length ? `<div class="fila" style="margin-bottom:16px"><div class="campo-buscar">${ico('buscar')}<input data-i="buscarJuez" placeholder="Busca tu nombre" value="${esc(ui.buscarJuez)}"></div></div>
     <div class="cuadro-eq">${S.jueces.filter(j => !ui.buscarJuez || j.nombre.toLowerCase().includes(ui.buscarJuez.toLowerCase())).map(j => { const pend = S.rondas.flatMap(r => r.debates.filter(d => d.jueces.includes(j.id) && !d.boletas[j.id])).length;
       return `<a class="panel eq-card" href="#juez/${j.id}" style="color:inherit"><div class="top">${avPersona(j.nombre, 'g')}<div class="crece"><h3>${esc(j.nombre)}</h3><div class="meta">${esc(j.centro || '')}</div></div>${pend ? `<span class="etq warn">${pend} pendiente${pend > 1 ? 's' : ''}</span>` : ''}</div></a>`; }).join('')}</div>`
    : `<div class="panel">${vacio('jueces', 'No hay jueces registrados', '', `<a class="btn prim" href="#jueces">Ir a Jueces</a>`)}</div>`);
  const j = juezPorId(jid);
  const asign = S.rondas.flatMap(r => r.debates.filter(d => d.jueces.includes(jid)).map(d => ({ r, d }))).reverse();
  return cab(esc(j ? j.nombre : 'Juez'), 'Tus salas asignadas, de la más reciente a la más antigua.', `<a class="btn sec" href="#juez">${ico('atras')}No soy yo</a>`) +
    (asign.length ? `<div class="salas">${asign.map(({ r, d }) => `<div class="panel sala"><div class="cab"><b style="font-family:var(--cond);font-size:20px">${esc(d.aula)}</b><span class="chico-txt">${esc(r.nombre)}</span>${d.boletas[jid] ? `<span class="etq ok" style="margin-left:auto">${ico('check')} Enviada</span>` : '<span class="etq warn" style="margin-left:auto">Pendiente</span>'}</div>
      <div class="lados"><div class="lado-s prop"><div class="rot">Proposición</div>${chipEq(d, 'prop', null).replace('draggable="true"', '')}</div><div class="vs"><span>VS</span></div><div class="lado-s opp"><div class="rot" style="text-align:right">Oposición</div>${chipEq(d, 'opp', null).replace('draggable="true"', '')}</div></div>
      ${r.mocionPublicada && r.mocion ? `<div class="pie-sala" style="color:var(--texto)">${esc(r.mocion)}</div>` : ''}
      <div class="pie-sala"><a class="btn ${d.boletas[jid] ? 'sec' : 'prim'}" style="width:100%" href="#boleta/${r.id}/${d.id}/${jid}">${ico(d.boletas[jid] ? 'editar' : 'juez')}${d.boletas[jid] ? 'Revisar mi boleta' : 'Llenar boleta'}</a></div></div>`).join('')}</div>`
    : `<div class="panel">${vacio('juez', 'Todavía no tienes salas asignadas')}</div>`);
}

// ---------------- ajustes ----------------
function inTiempo(clave, etiqueta) {
  const v = S.torneo.tiempos[clave];
  return `<div><label>${etiqueta}</label><div class="fila" style="gap:6px;flex-wrap:nowrap"><input type="number" min="0" style="width:76px" data-c="tiempo" data-k="${clave}" data-u="m" value="${Math.floor(v / 60)}"><span class="chico-txt">min</span><input type="number" min="0" max="59" style="width:76px" data-c="tiempo" data-k="${clave}" data-u="s" value="${v % 60}"><span class="chico-txt">s</span></div></div>`;
}
function vAjustes() {
  const t = S.torneo, claro = document.documentElement.dataset.tema === 'claro';
  return cab('Ajustes', 'Nombre del torneo, distritos, aulas, tiempos y preferencias.') + `
  <div class="rejilla r2">
    <div class="panel"><div class="tit">${ico('tablas')}<h3>Torneo</h3></div>
      <label style="margin-top:0">Nombre</label><input data-c="torneo" data-k="nombre" value="${esc(t.nombre)}">
      <label>Subtítulo</label><input data-c="torneo" data-k="subtitulo" value="${esc(t.subtitulo)}">
      <label>Distritos educativos <span class="tenue">(el nombre es opcional)</span></label>
      ${t.distritos.map((d, i) => `<div class="fila" style="margin-bottom:8px;flex-wrap:nowrap"><span class="etq" style="min-width:74px"><i class="punto" style="background:${colorDist(d.codigo)}"></i>${d.codigo}</span><input class="crece" data-c="distrito" data-i="${i}" value="${esc(d.nombre)}" placeholder="Nombre del distrito"></div>`).join('')}
    </div>
    <div class="panel"><div class="tit">${ico('cronometro')}<h3>Tiempos</h3></div>
      <div class="rejilla r2" style="gap:0 18px">${inTiempo('prep', 'Preparación')}${inTiempo('constructivo', 'Discurso')}${inTiempo('replica', 'Réplica')}${inTiempo('protegido', 'Tiempo protegido')}${inTiempo('gracia', 'Gracia')}</div>
    </div>
    <div class="panel"><div class="tit">${ico('ajustes')}<h3>Preferencias</h3></div>
      <label style="margin-top:0">Apariencia</label><div class="segmento"><button class="${!claro ? 'on' : ''}" data-a="tema" data-v="oscuro">${ico('luna')}Oscuro</button><button class="${claro ? 'on' : ''}" data-a="tema" data-v="claro">${ico('sol')}Claro</button></div>
      <label>Jueces por sala</label><select data-c="torneo" data-k="jueces"><option value="uno" ${t.jueces === 'uno' ? 'selected' : ''}>Un juez por sala</option><option value="panel" ${t.jueces === 'panel' ? 'selected' : ''}>Panel de tres cuando alcancen</option></select>
      <label>Boleta por defecto</label><select data-c="torneo" data-k="modoPuntaje"><option value="desglosado" ${t.modoPuntaje === 'desglosado' ? 'selected' : ''}>Por criterio (Contenido, Estilo, Estrategia)</option><option value="directo" ${t.modoPuntaje === 'directo' ? 'selected' : ''}>Puntaje directo (60–80 y 30–40)</option></select>
    </div>
    <div class="panel"><div class="tit">${ico('escuela')}<h3>Aulas</h3><span class="acc chico-txt">${t.aulas.length} aulas</span></div>
      <textarea data-c="aulas" style="min-height:190px;font-family:var(--mono);font-size:13px" placeholder="Una por línea">${esc(t.aulas.join('\n'))}</textarea>
      <p class="chico-txt" style="margin:8px 0 0">Una por línea, en el orden en que se asignan a las salas.</p>
    </div>
    ${sb ? `<div class="panel" style="grid-column:1/-1"><div class="tit">${ico('rayo')}<h3>En línea y seguridad</h3><span class="acc" id="estadoNube2"></span></div>
      <p class="chico-txt" style="margin-top:0">El torneo se guarda en línea. Todos ven el <a href="#vivo" target="_blank">portal en vivo</a>; solo quien tenga el PIN puede administrar.</p>
      <form data-form="pin" class="fila" style="align-items:end;gap:12px"><div style="width:200px"><label style="margin-top:0">PIN actual</label><input name="actual" type="password" inputmode="numeric" required></div><div style="width:200px"><label style="margin-top:0">PIN nuevo</label><input name="nuevo" type="password" inputmode="numeric" minlength="4" required></div><button class="btn sec">${ico('check')}Cambiar PIN</button><span class="crece"></span><button type="button" class="btn peligro" data-a="salir">${ico('atras')}Cerrar sesión</button></form></div>` : ''}
    <div class="panel" style="grid-column:1/-1;border-color:color-mix(in srgb,var(--err) 35%,transparent)"><div class="tit">${ico('alerta')}<h3>Empezar de cero</h3></div>
      <div class="fila"><p class="chico-txt crece" style="margin:0">Borra rondas, resultados, asistencia, jueces y mociones, y vuelve a cargar los 34 equipos del registro. Descarga una copia antes; no se puede deshacer.</p><a class="btn sec" href="#exportar">${ico('exportar')}Descargar copia</a><button class="btn peligro" data-a="reiniciarTodo">${ico('borrar')}Reiniciar torneo</button></div>
    </div>
  </div>`;
}

// ---------------- pantalla pública ----------------
let escenaPub = 0, ultimoCambioEscena = Date.now();
function escenasPublico() {
  const r = rondaEnCurso();
  const c = S.crono, out = [];
  // durante un discurso la pantalla se queda fija en el debate: moción, quiénes se enfrentan y el tiempo
  if (c.tipo !== 'prep' && cronoActivo()) return [[r && salaEnPantalla(r) && salaEnPantalla(r).prop ? 'debate' : 'crono', r]];
  if (r && r.mocionPublicada && r.mocion) out.push(['mocion', r]);
  else if (c.tipo === 'prep' && (c.corriendo || c.acumulado > 0)) out.push(['prep']);
  if (r && r.drawPublicado && r.debates.length) out.push(['salas', r]);
  if (S.publico.mostrarTabla && standings(true).some(f => f.jugados)) out.push(['tabla']);
  if (S.elim.publicado && S.elim.rondas.length) out.push(['elim']);
  return out;
}
function vPublico() {
  const escenas = escenasPublico(), c = S.crono;
  if (escenaPub >= escenas.length) escenaPub = 0;
  const [tipo, r] = escenas[escenaPub] || [];
  let html = '';
  if (tipo === 'mocion') html = `<div class="rotulo"><i></i>Moción · ${esc(r.nombre)}</div><div class="mocion">${esc(r.mocion)}</div>${r.infoslide ? `<div class="info">${esc(r.infoslide)}</div>` : ''}${salaEnPantalla(r) && salaEnPantalla(r).prop ? vsPub(r, salaEnPantalla(r), '') : ''}
    ${c.tipo === 'prep' && (c.corriendo || c.acumulado > 0) ? `<div style="display:flex;align-items:flex-end;gap:3vw;margin-top:1vh"><div><div class="rotulo">Preparación</div><div class="reloj-pub" data-reloj="restante"></div></div><div style="flex:1;padding-bottom:3vh"><div class="barra-pub"><i data-barra-crono></i></div></div></div>` : ''}`;
  else if (tipo === 'debate') html = escenaDebate(r);
  else if (tipo === 'prep') html = `<div class="rotulo"><i></i>Tiempo de preparación</div><div class="reloj-pub" data-reloj="restante" style="font-size:34vh"></div><div class="barra-pub"><i data-barra-crono></i></div>`;
  else if (tipo === 'crono') html = `<div class="rotulo"><i></i>${esc(c.etiqueta)}</div><div class="reloj-pub" data-reloj="transcurrido" style="font-size:34vh"></div><div><span data-estado-crono style="font-size:2.4vh"></span></div>`;
  else if (tipo === 'salas') html = `<div class="rotulo"><i></i>${esc(r.nombre)} · Salas</div><div class="salas-pub ${r.debates.length > 10 ? 'muchas' : ''}">${r.debates.map((d, i) => `<div class="sala-pub" style="animation-delay:${i * 40}ms"><b>${esc(d.aula)}</b><span class="p">${esc(nombreEq(d.prop))}</span><em>VS</em><span class="o">${esc(nombreEq(d.opp))}</span></div>`).join('')}</div>`;
  else if (tipo === 'tabla') html = `<div class="rotulo"><i></i>Tabla de equipos</div><div class="tabla-pub">${standings(true).filter(f => f.jugados).slice(0, 12).map((f, i) => `<div class="fila-pub" style="animation-delay:${i * 50}ms"><span class="rk ${i < 3 ? 'r' + (i + 1) : ''}">${i + 1}</span><span>${esc(f.e.nombre)}</span><small>${fmt(f.pts)}</small><span class="v">${f.v}V</span></div>`).join('')}</div>`;
  else if (tipo === 'elim') {
    const u = S.elim.rondas[S.elim.rondas.length - 1], fin = u.debates.length === 1 && u.debates[0].ganador;
    html = fin ? `<div class="campeon-pub"><div class="rotulo" style="justify-content:center"><i></i>Campeón</div><b>${esc(nombreEq(u.debates[0][u.debates[0].ganador]))}</b></div>`
      : `<div class="rotulo"><i></i>${esc(u.nombre)}</div><div class="salas-pub">${u.debates.map((d, i) => `<div class="sala-pub" style="grid-template-columns:1fr auto 1fr;animation-delay:${i * 60}ms"><span class="p">${esc(nombreEq(d.a))}</span><em>VS</em><span class="o">${esc(nombreEq(d.b))}</span></div>`).join('')}</div>`;
  }
  return `<div class="pub"><header><img src="img/celider-blanco.png" alt="CELIDER"><div class="t"><h1>${esc(S.torneo.nombre)}</h1><small>${esc(S.torneo.subtitulo)}</small></div></header>
    ${html ? `<div class="escena" data-escena="${escenaPub}">${html}</div>` : `<div class="espera"><img src="img/badge.jpg" alt=""><h2>La próxima ronda aparecerá aquí</h2><p>Club Escolar de Liderazgo · Regional 17</p></div>`}
    ${escenas.length > 1 ? `<div class="puntos-nav">${escenas.map((_, i) => `<i class="${i === escenaPub ? 'on' : ''}"></i>`).join('')}</div>` : ''}
  </div>`;
}

function vsPub(r, d, habla) {
  const lado = l => { const deb = debatientesDe(r, d[l]);
    return `<div class="vs-pub-l ${l} ${habla === l ? 'habla' : ''}"><small>${l === 'prop' ? 'Proposición' : 'Oposición'}${habla === l ? ' · habla ahora' : ''}</small><b>${esc(nombreEq(d[l]))}</b><span>${deb.map(m => esc(m.nombre)).join(' · ')}</span></div>`; };
  return `<div class="vs-pub">${lado('prop')}<div class="vs-pub-x">VS<small>${esc(d.aula)}</small></div>${lado('opp')}</div>`;
}
function escenaDebate(r) {
  const c = S.crono, d = salaEnPantalla(r);
  return `${r.mocion ? `<div class="rotulo"><i></i>Moción · ${esc(r.nombre)}</div><div class="mocion chica">${esc(r.mocion)}</div>` : `<div class="rotulo"><i></i>${esc(r.nombre)}</div>`}
    ${vsPub(r, d, c.lado)}
    <div class="reloj-fila"><div><div class="rotulo">${esc(c.etiqueta)}${c.corriendo ? '' : ' · en pausa'}</div><div class="reloj-pub" data-reloj="transcurrido">${mmss(transcurrido(c))}</div></div>
      <div class="reloj-lado"><span data-estado-crono style="font-size:2.4vh"></span><div class="barra-pub"><i data-barra-crono></i></div><small>de ${mmss(c.duracion)}</small></div></div>`;
}

// ---------------- capas ----------------
function capa() {
  const c = ui.capa; if (!c) return '';
  if (c.t === 'paleta') return `<div class="velo" data-velo>${vPaleta()}</div>`;
  const cont = c.t === 'qr' ? capaQR(c.id) : c.t === 'equipo' ? capaEquipo(c.id) : c.t === 'perfil' ? capaPerfil(c.id) : c.t === 'integrante' ? capaIntegrante(c.id) : c.t === 'juez' ? capaJuez(c.id) : c.t === 'mocion' ? capaMocion(c.id) : '';
  return `<div class="velo ${c.t === 'perfil' ? 'cajon' : ''}" data-velo>${cont}</div>`;
}
const paleta = { q: '', sel: 0 };
function resultadosPaleta() {
  const q = paleta.q.trim().toLowerCase(), out = [];
  const nav = MENU.filter(m => typeof m !== 'string').map(m => ({ sec: 'Ir a', icono: m[1], txt: m[2], href: '#' + m[0], nuevo: m[0] === 'publico' }));
  const acc = [
    { sec: 'Acciones', icono: 'mas', txt: 'Agregar equipo', a: 'nuevoEquipo' }, { sec: 'Acciones', icono: 'mas', txt: 'Agregar juez', a: 'nuevoJuez' },
    { sec: 'Acciones', icono: 'mas', txt: 'Agregar moción', a: 'nuevaMocion' }, { sec: 'Acciones', icono: 'asistencia', txt: 'Nueva práctica de hoy', a: 'nuevaPractica' },
    { sec: 'Acciones', icono: 'exportar', txt: 'Exportar libro completo a Excel', a: 'expExcel' }, { sec: 'Acciones', icono: 'imprimir', txt: 'Imprimir tablas en PDF', a: 'imprimirTabla' },
    { sec: 'Acciones', icono: 'sol', txt: 'Cambiar tema claro / oscuro', a: 'tema' }, { sec: 'Acciones', icono: 'deshacer', txt: 'Deshacer último cambio', a: 'deshacer' },
  ];
  const eqs = S.equipos.map(e => ({ sec: 'Equipos', av: e, txt: e.nombre, sub: e.distrito, a: 'perfilEquipo', id: e.id, buscar: e.nombre + ' ' + e.centro + ' ' + e.miembros.map(m => m.nombre).join(' ') }));
  const per = S.equipos.flatMap(e => e.miembros.map(m => ({ sec: 'Debatientes', icono: 'usuario', txt: m.nombre, sub: e.nombre, a: 'perfilEquipo', id: e.id })));
  const ron = S.rondas.map(r => ({ sec: 'Rondas', icono: 'rondas', txt: r.nombre, sub: r.mocion ? r.mocion.slice(0, 40) : '', href: '#ronda/' + r.id }));
  const jz = S.jueces.map(j => ({ sec: 'Jueces', icono: 'juez', txt: j.nombre, sub: j.centro, href: '#juez/' + j.id }));
  const todo = [...nav, ...acc, ...ron, ...eqs, ...jz, ...per];
  for (const x of todo) if (!q || (x.buscar || x.txt + ' ' + (x.sub || '')).toLowerCase().includes(q)) out.push(x);
  return out.slice(0, q ? 40 : 18);
}
function vPaleta() {
  const res = resultadosPaleta(); if (paleta.sel >= res.length) paleta.sel = 0;
  let sec = '';
  return `<div class="paleta"><div class="entrada">${ico('buscar')}<input id="entradaPaleta" placeholder="Busca equipos, debatientes, jueces, rondas o acciones" value="${esc(paleta.q)}" autocomplete="off"><kbd>Esc</kbd></div>
    <div class="res">${res.map((x, i) => { const h = x.sec !== sec ? `<div class="sec">${x.sec}</div>` : ''; sec = x.sec;
      return h + `<div class="item ${i === paleta.sel ? 'sel' : ''}" data-paleta="${i}">${x.av ? avEq(x.av, 'p') : ico(x.icono)}<span>${esc(x.txt)}</span>${x.sub ? `<small>${esc(x.sub)}</small>` : ''}</div>`; }).join('') || vacio('buscar', 'Nada coincide')}</div></div>`;
}
