"use strict";
const STORE = "sur-task-manager:v1";
const ESTADOS = ["Pendiente", "En curso", "Bloqueada", "Hecha"];
const PERIODICIDADES = ["Semanal", "Quincenal", "Mensual", "Trimestral", "Anual"];
const MESES = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];

const $ = (s, r = document) => r.querySelector(s);
const esc = v => String(v ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const clone = o => JSON.parse(JSON.stringify(o));

/* ---------- estado ---------- */
function fresh() { return { empresas: clone(SEED.empresas), catalogo: [...SEED.catalogo], estados: {} }; }
function load() {
  try { const s = JSON.parse(localStorage.getItem(STORE)); if (s && s.empresas) return s; } catch (e) {}
  return fresh();
}
let db = load();
function save() {
  try { localStorage.setItem(STORE, JSON.stringify(db)); } catch (e) { alert("No se pudo guardar en el navegador: " + e.message); }
}
const ui = { view: "tablero", mes: new Date().toISOString().slice(0, 7),
  f: { empresa: "", resp: "", proceso: "", per: "", estado: "", ocultarHechas: false, agrupar: true }, q: "" };

/* ---------- periodos ---------- */
const pad = n => String(n).padStart(2, "0");
const fmt = d => `${pad(d.getUTCDate())}/${pad(d.getUTCMonth() + 1)}`;
// Devuelve [{key,label,orden}] de los periodos de una periodicidad que caen en el mes "YYYY-MM".
function periodos(per, mes) {
  const [y, m] = mes.split("-").map(Number);
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
  if (per === "Mensual") return [{ key: `M:${mes}`, label: `${MESES[m - 1]} ${y}` }];
  if (per === "Quincenal") return [
    { key: `Q:${mes}-1`, label: `1ª quincena (1–15)` },
    { key: `Q:${mes}-2`, label: `2ª quincena (16–${last})` }];
  if (per === "Semanal") {
    const out = [];
    for (let d = 1; d <= last; d++) {
      const dt = new Date(Date.UTC(y, m - 1, d));
      if (dt.getUTCDay() === 1) {
        const fin = new Date(dt.getTime() + 6 * 864e5);
        out.push({ key: `W:${dt.toISOString().slice(0, 10)}`, label: `Semana ${fmt(dt)}–${fmt(fin)}` });
      }
    }
    return out;
  }
  if (per === "Trimestral") return m % 3 === 0 ? [{ key: `T:${y}-Q${m / 3}`, label: `Trimestre ${m / 3} ${y}` }] : [];
  if (per === "Anual") return m === 12 ? [{ key: `A:${y}`, label: `Año ${y}` }] : [];
  return [];
}
function tareasDelMes(mes) {
  const out = [];
  for (const e of db.empresas) {
    if (e.estado !== "Activo") continue;
    for (const p of e.procesos) for (const pr of periodos(p.periodicidad, mes)) {
      const id = `${e.id}|${p.proceso}|${pr.key}`;
      const s = db.estados[id] || {};
      out.push({ id, e, proceso: p.proceso, per: p.periodicidad, periodo: pr, estado: s.estado || "Pendiente", nota: s.nota || "" });
    }
  }
  return out;
}

/* ---------- vistas ---------- */
const opts = (arr, sel, blank) => (blank !== undefined ? `<option value="">${esc(blank)}</option>` : "") +
  arr.map(v => `<option ${v === sel ? "selected" : ""}>${esc(v)}</option>`).join("");
const uniq = a => [...new Set(a.filter(Boolean).map(String))].sort((x, y) => x.localeCompare(y, "es"));

function vTablero() {
  const all = tareasDelMes(ui.mes), f = ui.f;
  const resp = uniq(db.empresas.flatMap(e => [e.finanzas, e.contabilidad]));
  const ts = all.filter(t =>
    (!f.empresa || t.e.id === f.empresa) && (!f.proceso || t.proceso === f.proceso) && (!f.per || t.per === f.per) &&
    (!f.estado || t.estado === f.estado) && (!f.resp || t.e.finanzas === f.resp || t.e.contabilidad === f.resp) &&
    !(f.ocultarHechas && t.estado === "Hecha"));
  const cnt = s => all.filter(t => t.estado === s).length;
  const pct = all.length ? Math.round(cnt("Hecha") / all.length * 100) : 0;
  ts.sort((a, b) => a.e.nombre.localeCompare(b.e.nombre, "es") || db.catalogo.indexOf(a.proceso) - db.catalogo.indexOf(b.proceso) || a.periodo.key.localeCompare(b.periodo.key));
  let rows = "", last = null;
  for (const t of ts) {
    if (f.agrupar && last !== t.e.id) {
      last = t.e.id;
      rows += `<tr class="grp"><td colspan="6">${esc(t.e.nombre)} <span class="muted">· ${esc(t.e.grupo || "sin grupo")} · Fin: ${esc(t.e.finanzas || "—")} · Cont: ${esc(t.e.contabilidad || "—")}</span></td></tr>`;
    }
    rows += `<tr class="${t.estado === "Hecha" ? "done" : ""}">
      ${f.agrupar ? "" : `<td>${esc(t.e.nombre)}</td>`}
      <td>${esc(t.proceso)}</td>
      <td><span class="tag rep" title="Tarea recurrente">↻ ${esc(t.per)}</span></td>
      <td>${esc(t.periodo.label)}</td>
      <td><select data-est="${esc(t.id)}" class="st st-${t.estado}">${opts(ESTADOS, t.estado)}</select></td>
      <td><input data-nota="${esc(t.id)}" value="${esc(t.nota)}" placeholder="Nota"></td></tr>`;
  }
  return `
  <div class="bar">
    <button data-mes="-1">◀</button><input type="month" id="mes" value="${ui.mes}"><button data-mes="1">▶</button>
    <div class="progress" title="${pct}% hecho"><i style="width:${pct}%"></i></div><b>${pct}%</b>
  </div>
  <div class="kpis">
    <div class="kpi"><b>${all.length}</b><span>Tareas del mes</span></div>
    ${ESTADOS.map(s => `<div class="kpi"><b class="st-${s}">${cnt(s)}</b><span>${s}</span></div>`).join("")}
  </div>
  <div class="bar">
    <select data-f="empresa"><option value="">Todas las empresas</option>${db.empresas.map(e => `<option value="${e.id}" ${f.empresa === e.id ? "selected" : ""}>${esc(e.nombre)}</option>`).join("")}</select>
    <select data-f="resp">${opts(resp, f.resp, "Todos los responsables")}</select>
    <select data-f="proceso">${opts(db.catalogo, f.proceso, "Todos los procesos")}</select>
    <select data-f="per">${opts(PERIODICIDADES, f.per, "Toda periodicidad")}</select>
    <select data-f="estado">${opts(ESTADOS, f.estado, "Todo estado")}</select>
    <label style="flex-direction:row;align-items:center;gap:4px"><input type="checkbox" data-c="ocultarHechas" ${f.ocultarHechas ? "checked" : ""}> Ocultar hechas</label>
    <label style="flex-direction:row;align-items:center;gap:4px"><input type="checkbox" data-c="agrupar" ${f.agrupar ? "checked" : ""}> Agrupar por empresa</label>
  </div>
  <div class="card"><table><thead><tr>${f.agrupar ? "" : "<th>Empresa</th>"}<th>Proceso</th><th>Periodicidad</th><th>Período</th><th>Estado</th><th>Nota</th></tr></thead>
  <tbody>${rows || `<tr><td colspan="6" class="muted">Sin tareas para estos filtros.</td></tr>`}</tbody></table></div>`;
}

function vEmpresas() {
  const q = ui.q.toLowerCase();
  const es = db.empresas.filter(e => !q || [e.nombre, e.grupo, e.rut, e.finanzas, e.contabilidad].join(" ").toLowerCase().includes(q));
  return `<div class="bar"><h2>Empresas (${db.empresas.length})</h2><input id="q" placeholder="Buscar…" value="${esc(ui.q)}"><div class="spacer"></div>
    <button class="primary" data-edit="new">+ Agregar empresa</button></div>
  <div class="card"><table><thead><tr><th>Empresa</th><th>Grupo</th><th>RUT</th><th>Servicio</th><th>Finanzas</th><th>Contab.</th><th>Estado</th><th>Procesos</th></tr></thead><tbody>
  ${es.map(e => `<tr><td><a href="#" data-edit="${e.id}">${esc(e.nombre)}</a></td><td>${esc(e.grupo)}</td><td>${esc(e.rut)}</td><td>${esc(e.servicio)}</td>
    <td>${esc(e.finanzas)}</td><td>${esc(e.contabilidad)}</td><td>${esc(e.estado)}</td>
    <td>${e.procesos.map(p => `<span class="tag" title="${esc(p.proceso)}">${esc(p.proceso.split(" ")[0])} · ${esc(p.periodicidad)}</span>`).join(" ")}</td></tr>`).join("")}
  </tbody></table></div>`;
}

function vProcesos() {
  const uso = n => db.empresas.filter(e => e.procesos.some(p => p.proceso === n)).length;
  return `<div class="bar"><h2>Catálogo de procesos</h2><div class="spacer"></div>
    <input id="nuevoProc" placeholder="Nuevo proceso…"><button class="primary" data-addproc>+ Agregar</button></div>
  <div class="card"><table><thead><tr><th>Proceso</th><th>Empresas que lo usan</th><th></th></tr></thead><tbody>
  ${db.catalogo.map(n => `<tr><td>${esc(n)}</td><td>${uso(n)}</td><td style="text-align:right">
    <button data-renproc="${esc(n)}">Renombrar</button> <button class="danger" data-delproc="${esc(n)}">Eliminar</button></td></tr>`).join("")}
  </tbody></table></div>
  <p class="muted">La periodicidad se define por empresa (pestaña Empresas), porque cada cliente puede tener una distinta para el mismo proceso.</p>`;
}

/* ---------- edición de empresa ---------- */
const CAMPOS = [["nombre","Nombre"],["grupo","Grupo"],["rut","RUT"],["tipo","Tipo"],["complejidad","Complejidad"],["servicio","Servicio"],["finanzas","Finanzas (resp.)"],["contabilidad","Contabilidad (resp.)"],["carga","Carga"]];
function editEmpresa(id) {
  const e = id === "new" ? { id: "e" + Date.now(), nombre: "", estado: "Activo", tipo: "Regular", procesos: [] } : clone(db.empresas.find(x => x.id === id));
  const dlg = $("#dlg");
  const procRow = p => `<div class="row"><select data-p="proceso">${opts(db.catalogo, p.proceso)}</select><select data-p="per">${opts(PERIODICIDADES, p.periodicidad)}</select><button data-rmp type="button">✕</button></div>`;
  dlg.innerHTML = `<h2>${id === "new" ? "Nueva empresa" : "Editar empresa"}</h2>
   <div class="grid">${CAMPOS.map(([k, l]) => `<label>${l}<input data-k="${k}" list="dl-${k}" value="${esc(e[k])}"></label>`).join("")}
   <label>Estado<select data-k="estado">${opts(["Activo", "Inactivo"], e.estado)}</select></label></div>
   ${CAMPOS.map(([k]) => `<datalist id="dl-${k}">${uniq(db.empresas.map(x => x[k])).map(v => `<option value="${esc(v)}">`).join("")}</datalist>`).join("")}
   <h2 style="font-size:14px">Procesos y periodicidad</h2><div id="procs">${e.procesos.map(procRow).join("")}</div>
   <button type="button" id="addp">+ Proceso</button>
   <div class="actions">${id !== "new" ? `<button class="danger" id="delE" style="margin-right:auto">Eliminar</button>` : ""}<button id="cancel">Cancelar</button><button class="primary" id="ok">Guardar</button></div>`;
  $("#addp", dlg).onclick = () => $("#procs", dlg).insertAdjacentHTML("beforeend", procRow({ proceso: db.catalogo[0], periodicidad: "Mensual" }));
  dlg.onclick = ev => { if (ev.target.matches("[data-rmp]")) ev.target.parentElement.remove(); };
  $("#cancel", dlg).onclick = () => dlg.close();
  if ($("#delE", dlg)) $("#delE", dlg).onclick = () => {
    if (!confirm(`¿Eliminar ${e.nombre}? Se pierde su historial de estados.`)) return;
    db.empresas = db.empresas.filter(x => x.id !== e.id);
    for (const k of Object.keys(db.estados)) if (k.startsWith(e.id + "|")) delete db.estados[k];
    save(); dlg.close(); render();
  };
  $("#ok", dlg).onclick = () => {
    dlg.querySelectorAll("[data-k]").forEach(i => e[i.dataset.k] = i.value.trim());
    if (!e.nombre) return alert("El nombre es obligatorio.");
    e.carga = Number(e.carga) || 0;
    const seen = new Set(); e.procesos = [];
    for (const r of dlg.querySelectorAll("#procs .row")) {
      const p = { proceso: r.querySelector("[data-p=proceso]").value, periodicidad: r.querySelector("[data-p=per]").value };
      if (seen.has(p.proceso)) return alert(`Proceso repetido: ${p.proceso}`);
      seen.add(p.proceso); e.procesos.push(p);
    }
    const i = db.empresas.findIndex(x => x.id === e.id);
    if (i < 0) db.empresas.push(e); else db.empresas[i] = e;
    save(); dlg.close(); render();
  };
  dlg.showModal();
}

/* ---------- render y eventos ---------- */
function render() {
  document.querySelectorAll("nav button").forEach(b => b.classList.toggle("active", b.dataset.view === ui.view));
  $("#app").innerHTML = { tablero: vTablero, empresas: vEmpresas, procesos: vProcesos }[ui.view]();
}
document.querySelector("nav").onclick = e => { if (e.target.dataset.view) { ui.view = e.target.dataset.view; render(); } };

const app = $("#app");
app.addEventListener("change", e => {
  const t = e.target, d = t.dataset;
  if (d.est) { (db.estados[d.est] ||= {}).estado = t.value; save(); render(); }
  else if (d.nota !== undefined) { (db.estados[d.nota] ||= {}).nota = t.value; save(); }
  else if (d.f) { ui.f[d.f] = t.value; render(); }
  else if (d.c) { ui.f[d.c] = t.checked; render(); }
  else if (t.id === "mes" && t.value) { ui.mes = t.value; render(); }
});
app.addEventListener("input", e => {
  if (e.target.id === "q") { ui.q = e.target.value; const p = e.target.selectionStart; render(); const q = $("#q"); q.focus(); q.setSelectionRange(p, p); }
});
app.addEventListener("click", e => {
  const d = e.target.dataset;
  if (d.mes) { const [y, m] = ui.mes.split("-").map(Number); const n = new Date(Date.UTC(y, m - 1 + Number(d.mes), 1)); ui.mes = n.toISOString().slice(0, 7); render(); }
  else if (d.edit) { e.preventDefault(); editEmpresa(d.edit); }
  else if (d.addproc !== undefined) {
    const n = $("#nuevoProc").value.trim();
    if (!n) return; if (db.catalogo.includes(n)) return alert("Ya existe.");
    db.catalogo.push(n); save(); render();
  }
  else if (d.renproc) {
    const n = prompt("Nuevo nombre:", d.renproc)?.trim();
    if (!n || n === d.renproc) return; if (db.catalogo.includes(n)) return alert("Ya existe.");
    db.catalogo[db.catalogo.indexOf(d.renproc)] = n;
    db.empresas.forEach(em => em.procesos.forEach(p => { if (p.proceso === d.renproc) p.proceso = n; }));
    const ne = {}; for (const [k, v] of Object.entries(db.estados)) { const s = k.split("|"); if (s[1] === d.renproc) s[1] = n; ne[s.join("|")] = v; }
    db.estados = ne; save(); render();
  }
  else if (d.delproc) {
    if (!confirm(`¿Eliminar "${d.delproc}"? Se quitará de todas las empresas y se pierde su historial.`)) return;
    db.catalogo = db.catalogo.filter(x => x !== d.delproc);
    db.empresas.forEach(em => em.procesos = em.procesos.filter(p => p.proceso !== d.delproc));
    for (const k of Object.keys(db.estados)) if (k.split("|")[1] === d.delproc) delete db.estados[k];
    save(); render();
  }
});

$("#btnExport").onclick = () => {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([JSON.stringify(db, null, 1)], { type: "application/json" }));
  a.download = `sur-task-manager-${new Date().toISOString().slice(0, 10)}.json`; a.click();
};
$("#btnImport").onclick = () => $("#fileImport").click();
$("#fileImport").onchange = async e => {
  try {
    const j = JSON.parse(await e.target.files[0].text());
    if (!Array.isArray(j.empresas) || !Array.isArray(j.catalogo) || typeof j.estados !== "object") throw new Error("Formato inválido");
    if (!confirm("Esto reemplaza todos los datos actuales. ¿Continuar?")) return;
    db = j; save(); render();
  } catch (err) { alert("No se pudo importar: " + err.message); }
  e.target.value = "";
};
$("#btnReset").onclick = () => { if (confirm("Se descartan cambios y estados y se vuelve al Excel original. ¿Continuar?")) { db = fresh(); save(); render(); } };

render();
