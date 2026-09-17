// ─── RIFA CELUCENTER — Google Apps Script ───
// Conectar al Google Sheet de boletos:
// https://docs.google.com/spreadsheets/d/1pPSjqEtK3LYmpkqK1yY-N9FnMEzstoSvWuEXTPcsjyY
//
// Instrucciones:
// 1. Abre script.google.com → Nuevo proyecto
// 2. Pega este código
// 3. Despliega → Nueva implementación → Aplicación web
//    - Ejecutar como: Yo
//    - Quién puede acceder: Cualquier persona
// 4. Copia la URL y ponla en index.html → const GAS_URL = '...'

const SHEET_ID = '1pPSjqEtK3LYmpkqK1yY-N9FnMEzstoSvWuEXTPcsjyY';

function doGet(e) {
  const p = e.parameter;
  const action = p.action || 'registrar';
  const cb = p.callback || '';

  try {
    let result;
    if      (action === 'registrar') result = registrarAsistencia(p);
    else if (action === 'list')      result = listarAsistencia(p);
    else if (action === 'ganador')   result = registrarGanador(p);
    else if (action === 'ganadores') result = listarGanadores(p);
    else result = { error: 'accion no reconocida' };
    return jsonResp(result, cb);
  } catch(err) {
    return jsonResp({ error: err.message }, cb);
  }
}

// ─── ASISTENCIA ───
function registrarAsistencia(p) {
  const nombre = p.nombre;
  const rifa   = p.rifa || 'sep2026';
  if (!nombre) return { error: 'nombre requerido' };

  const ss    = SpreadsheetApp.openById(SHEET_ID);
  const shName = 'Asistencia_' + rifa;
  let sheet   = ss.getSheetByName(shName);
  if (!sheet) {
    sheet = ss.insertSheet(shName);
    sheet.appendRow(['Nombre', 'Hora', 'Dispositivo']);
    sheet.setFrozenRows(1);
  }

  const data = sheet.getDataRange().getValues();
  const yaRegistrado = data.slice(1).some(row => row[0] === nombre);
  if (!yaRegistrado) {
    sheet.appendRow([nombre, new Date().toISOString(), p.device || '']);
  }

  return { ok: true, yaRegistrado };
}

function listarAsistencia(p) {
  const rifa   = p.rifa || 'sep2026';
  const ss     = SpreadsheetApp.openById(SHEET_ID);
  const sheet  = ss.getSheetByName('Asistencia_' + rifa);
  if (!sheet) return { registros: [] };

  const data = sheet.getDataRange().getValues().slice(1);
  return { registros: data.map(r => ({ nombre: r[0], hora: r[1] })) };
}

// ─── GANADORES ───
function registrarGanador(p) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  let sheet = ss.getSheetByName('Ganadores');
  if (!sheet) {
    sheet = ss.insertSheet('Ganadores');
    sheet.appendRow(['Rifa', 'Premio', 'Boleto', 'Nombre', 'Fecha']);
    sheet.setFrozenRows(1);
    // Formato de encabezado
    sheet.getRange(1, 1, 1, 5).setFontWeight('bold').setBackground('#2aabd2').setFontColor('#ffffff');
  }

  sheet.appendRow([
    p.rifa   || 'sep2026',
    p.premio || '1',
    Number(p.boleto),
    p.nombre,
    new Date().toISOString()
  ]);

  return { ok: true };
}

function listarGanadores(p) {
  const rifa  = p.rifa || 'sep2026';
  const ss    = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName('Ganadores');
  if (!sheet) return { ganadores: [] };

  const data = sheet.getDataRange().getValues().slice(1)
    .filter(r => r[0] === rifa);

  return {
    ganadores: data.map(r => ({
      rifa:   r[0],
      premio: r[1],
      boleto: r[2],
      nombre: r[3],
      fecha:  r[4]
    }))
  };
}

// ─── HELPER ───
function jsonResp(data, callback) {
  const json    = JSON.stringify(data);
  const content = callback ? `${callback}(${json})` : json;
  return ContentService.createTextOutput(content)
    .setMimeType(ContentService.MimeType.JAVASCRIPT);
}
