// ============================================================
//  Calificador de Equipos — CeluCenter
//  Despliega como Web App > "Anyone" > Execute as "Me"
//  Copia el URL desplegado en calificador/js/config.js
// ============================================================

const SPREADSHEET_ID = 'REPLACE_WITH_YOUR_GOOGLE_SHEET_ID';

const CRITERIA_IDS = ['creativity', 'participation', 'editing', 'content', 'presentation'];

// Nombres que aparecerán en la pantalla de resultados
const JUECES = {
  '1': 'Juez 1',
  '2': 'Juez 2',
  '3': 'Juez 3',
  '4': 'Juez 4',
};

// ── Entry point ──────────────────────────────────────────────────────────────
function doGet(e) {
  const p  = e.parameter;
  const cb = p.callback;
  let result;

  try {
    switch (p.action) {
      case 'equipos':    result = getEquipos();                    break;
      case 'add':        result = addEquipo(p.nombre, p.producto); break;
      case 'del':        result = delEquipo(p.id);                 break;
      case 'save':       result = saveScore(p);                    break;
      case 'resultados': result = getResultados();                 break;
      case 'my_scores':  result = getMyScores(p.juez);            break;
      case 'ping':       result = { ok: true };                    break;
      default:           result = { error: 'acción desconocida' };
    }
  } catch (err) {
    result = { error: String(err) };
  }

  const json = JSON.stringify(result);
  if (cb) {
    return ContentService
      .createTextOutput(`${cb}(${json})`)
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService
    .createTextOutput(json)
    .setMimeType(ContentService.MimeType.JSON);
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function openSS() {
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}

function ensureSheet(name, headers) {
  const ss    = openSS();
  let   sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(headers);
  }
  return sheet;
}

function deleteRowsWhere(sheet, predicate) {
  const rows = sheet.getDataRange().getValues();
  for (let i = rows.length - 1; i >= 1; i--) {
    if (predicate(rows[i])) sheet.deleteRow(i + 1);
  }
}

// ── Equipos CRUD ──────────────────────────────────────────────────────────────
function getEquipos() {
  const sheet = ensureSheet('Equipos', ['id', 'nombre', 'producto', 'ts']);
  const rows  = sheet.getDataRange().getValues().slice(1);
  return {
    equipos: rows
      .filter(r => r[0])
      .map(r => ({ id: r[0], nombre: r[1], producto: r[2] })),
  };
}

function addEquipo(nombre, producto) {
  if (!nombre || !producto) return { error: 'Faltan datos' };
  const sheet = ensureSheet('Equipos', ['id', 'nombre', 'producto', 'ts']);
  const id    = Utilities.getUuid();
  sheet.appendRow([id, nombre.trim(), producto.trim(), new Date().toISOString()]);
  return { ok: true, id };
}

function delEquipo(id) {
  if (!id) return { error: 'id requerido' };
  deleteRowsWhere(
    ensureSheet('Equipos', ['id', 'nombre', 'producto', 'ts']),
    r => r[0] === id
  );
  deleteRowsWhere(
    ensureSheet('Calificaciones', ['juez', 'equipo_id', ...CRITERIA_IDS, 'ts']),
    r => r[1] === id
  );
  return { ok: true };
}

// ── Calificaciones ────────────────────────────────────────────────────────────
function saveScore(p) {
  const { juez, equipo_id } = p;
  if (!juez || !equipo_id) return { error: 'Faltan datos' };

  const scores = CRITERIA_IDS.map(c => Number(p[c]) || 0);
  const sheet  = ensureSheet('Calificaciones', ['juez', 'equipo_id', ...CRITERIA_IDS, 'ts']);
  const rows   = sheet.getDataRange().getValues();
  const now    = new Date().toISOString();

  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === juez && rows[i][1] === equipo_id) {
      sheet.getRange(i + 1, 3, 1, CRITERIA_IDS.length + 1).setValues([[...scores, now]]);
      return { ok: true, updated: true };
    }
  }
  sheet.appendRow([juez, equipo_id, ...scores, now]);
  return { ok: true, updated: false };
}

function getMyScores(juez) {
  if (!juez) return { error: 'juez requerido' };
  const sheet  = ensureSheet('Calificaciones', ['juez', 'equipo_id', ...CRITERIA_IDS, 'ts']);
  const rows   = sheet.getDataRange().getValues().slice(1);
  const scores = {};
  for (const row of rows) {
    if (row[0] !== juez) continue;
    const s = {};
    CRITERIA_IDS.forEach((c, i) => { s[c] = Number(row[i + 2]) || 0; });
    scores[row[1]] = s;
  }
  return { scores };
}

// ── Resultados (promedio de todos los jueces) ─────────────────────────────────
function getResultados() {
  const { equipos } = getEquipos();
  const sheet = ensureSheet('Calificaciones', ['juez', 'equipo_id', ...CRITERIA_IDS, 'ts']);
  const rows  = sheet.getDataRange().getValues().slice(1);

  // equipo_id → juezId → { criterion: score }
  const map = {};
  for (const row of rows) {
    const [juez, equipo_id, ...rest] = row;
    if (!juez || !equipo_id) continue;
    if (!map[equipo_id]) map[equipo_id] = {};
    const s = {};
    CRITERIA_IDS.forEach((c, i) => { s[c] = Number(rest[i]) || 0; });
    map[equipo_id][juez] = s;
  }

  const results = equipos.map(eq => {
    const byJuez  = map[eq.id] || {};
    const juezIds = Object.keys(byJuez);

    const avg = {};
    CRITERIA_IDS.forEach(c => {
      const vals = juezIds.map(j => byJuez[j][c]).filter(v => v > 0);
      avg[c] = vals.length
        ? parseFloat((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2))
        : 0;
    });

    const total_avg = parseFloat(
      Object.values(avg).reduce((a, b) => a + b, 0).toFixed(2)
    );

    return {
      id:           eq.id,
      nombre:       eq.nombre,
      producto:     eq.producto,
      avg_scores:   avg,
      total_avg,
      by_juez:      byJuez,
      judges_rated: juezIds.length,
    };
  }).sort((a, b) => b.total_avg - a.total_avg);

  return {
    results,
    jueces:    JUECES,
    max_score: CRITERIA_IDS.length * 5,   // 25
    ts:        new Date().toISOString(),
  };
}
