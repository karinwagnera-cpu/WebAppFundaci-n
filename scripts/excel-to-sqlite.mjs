// Migra "ACCIONES FUNDACIÓN HUENTALA.xlsx" (13 hojas, una por año) a un archivo SQLite.
// Uso: node scripts/excel-to-sqlite.mjs
import { DatabaseSync } from 'node:sqlite';
import { existsSync, unlinkSync, readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import * as XLSX from 'xlsx';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const CARPETA_ORIGEN = path.resolve(AQUI, '..', '..');
const ORIGEN = path.join(CARPETA_ORIGEN, readdirSync(CARPETA_ORIGEN).find((f) => /^ACCIONES.*\.xlsx$/i.test(f)));
const DESTINO = path.resolve(AQUI, '..', 'data', 'fundacion-historico.sqlite');

const normalizar = (s) =>
  String(s ?? '').toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim();

// Variantes de nombre de columna vistas en las 13 hojas -> columna canónica.
const MAPA_COLUMNAS = {
  'FECHA': 'fecha',
  'EJE': 'eje',
  'EJE PRINCIPAL': 'eje',
  'BENEFICIARIO': 'beneficiario',
  'DONACION': 'donacion',
  'SERVICIO ADIC.': 'servicio_adicional',
  'EVENTO / MOTIVO': 'motivo',
  'UN. NEGOCIO': 'unidad_negocio',
  'COSTO': 'costo',
  'COSTO INTERNO': 'costo',
  'INVERSION': 'inversion',
  'OBSERVACIONES': 'observaciones',
  'CONTACTO': 'contacto',
  'VOUCHER/ CONSTANCIA': 'constancia',
  'LOGOS AUSPICIANTES': 'logos_auspiciantes',
};

// La planilla mezcla formato US ($118,036.71) y AR ($246.236,55) para el mismo
// numero segun quien cargo la fila. El ultimo separador presente es el decimal;
// el otro (si aparece) es separador de miles y se descarta.
function parseNumero(valor) {
  if (valor === '' || valor === null || valor === undefined) return null;
  let s = String(valor).replace(/[^0-9,.-]/g, '').trim();
  if (!s) return null;
  const lastComma = s.lastIndexOf(',');
  const lastDot = s.lastIndexOf('.');
  if (lastComma > -1 && lastDot > -1) {
    s = lastComma > lastDot ? s.replace(/\./g, '').replace(',', '.') : s.replace(/,/g, '');
  } else if (lastComma > -1) {
    s = (s.length - lastComma - 1 === 2) ? s.replace(',', '.') : s.replace(/,/g, '');
  } else if (lastDot > -1 && s.length - lastDot - 1 === 3) {
    s = s.replace(/\./g, '');
  }
  const n = Number(s);
  return Number.isNaN(n) ? null : n;
}

// Idem con las fechas: la mayoria vienen D/M/Y (convencion AR) pero algunas filas
// se cargaron M/D/Y (ej. "2/13/26" solo puede ser 13 de febrero). Se prueba D/M/Y
// primero y, si el mes da invalido (>12), se reintenta como M/D/Y.
function parseFecha(valor) {
  const s = String(valor ?? '').trim();
  const m = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})/);
  if (!m) return null;
  let [, a, b, y] = m;
  if (y.length === 2) y = (Number(y) > 50 ? '19' : '20') + y;
  const intentar = (d, mo) => {
    if (Number(mo) < 1 || Number(mo) > 12) return null;
    const iso = `${y}-${mo.padStart(2, '0')}-${d.padStart(2, '0')}`;
    const t = new Date(iso + 'T00:00:00');
    return (!Number.isNaN(t.getTime()) && t.getDate() === Number(d)) ? iso : null;
  };
  return intentar(a, b) ?? intentar(b, a);
}

function filaDeEncabezados(aoa) {
  for (let i = 0; i < aoa.length; i++) {
    if ((aoa[i] || []).some((c) => normalizar(c) === 'FECHA')) return i;
  }
  return -1;
}

const libro = XLSX.read(readFileSync(ORIGEN), { type: 'buffer' });
const filas = [];

for (const anio of libro.SheetNames) {
  const hoja = libro.Sheets[anio];
  const aoa = XLSX.utils.sheet_to_json(hoja, { header: 1, raw: false, defval: '' });
  const iEnc = filaDeEncabezados(aoa);
  if (iEnc === -1) { console.warn(`[${anio}] no se encontró fila de encabezados, se omite`); continue; }

  const encabezados = aoa[iEnc].map((h) => MAPA_COLUMNAS[normalizar(h)] ?? null);

  for (let i = iEnc + 1; i < aoa.length; i++) {
    const fila = aoa[i] || [];
    const vacia = fila.every((c) => String(c ?? '').trim() === '');
    if (vacia) continue;

    const obj = { anio };
    fila.forEach((valor, idx) => {
      const col = encabezados[idx];
      if (!col) return;
      obj[col] = String(valor ?? '').trim();
    });
    if (!obj.beneficiario && !obj.fecha) continue; // filas basura sin contenido real

    filas.push({
      anio,
      fecha_raw: obj.fecha || null,
      fecha: parseFecha(obj.fecha),
      eje: obj.eje || null,
      beneficiario: obj.beneficiario || null,
      donacion: obj.donacion || null,
      servicio_adicional: obj.servicio_adicional || null,
      motivo: obj.motivo || null,
      unidad_negocio: obj.unidad_negocio || null,
      costo_raw: obj.costo || null,
      costo: parseNumero(obj.costo),
      inversion_raw: obj.inversion || null,
      inversion: parseNumero(obj.inversion),
      observaciones: obj.observaciones || null,
      contacto: obj.contacto || null,
      constancia: obj.constancia || null,
      logos_auspiciantes: obj.logos_auspiciantes || null,
    });
  }
}

console.log(`Filas extraídas: ${filas.length}`);

if (existsSync(DESTINO)) unlinkSync(DESTINO);
const db = new DatabaseSync(DESTINO);
db.exec(`
  CREATE TABLE acciones_historico (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    anio TEXT NOT NULL,
    fecha_raw TEXT,
    fecha TEXT,
    eje TEXT,
    beneficiario TEXT,
    donacion TEXT,
    servicio_adicional TEXT,
    motivo TEXT,
    unidad_negocio TEXT,
    costo_raw TEXT,
    costo REAL,
    inversion_raw TEXT,
    inversion REAL,
    observaciones TEXT,
    contacto TEXT,
    constancia TEXT,
    logos_auspiciantes TEXT
  );
  CREATE INDEX idx_acciones_anio ON acciones_historico(anio);
  CREATE INDEX idx_acciones_fecha ON acciones_historico(fecha);
`);

const cols = [
  'anio', 'fecha_raw', 'fecha', 'eje', 'beneficiario', 'donacion', 'servicio_adicional',
  'motivo', 'unidad_negocio', 'costo_raw', 'costo', 'inversion_raw', 'inversion',
  'observaciones', 'contacto', 'constancia', 'logos_auspiciantes',
];
const insert = db.prepare(`INSERT INTO acciones_historico (${cols.join(',')}) VALUES (${cols.map(() => '?').join(',')})`);
db.exec('BEGIN');
for (const f of filas) insert.run(...cols.map((c) => f[c] ?? null));
db.exec('COMMIT');

const { total } = db.prepare('SELECT COUNT(*) AS total FROM acciones_historico').get();
console.log(`Filas insertadas en ${DESTINO}: ${total}`);
db.close();
