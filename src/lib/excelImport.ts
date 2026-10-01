import type { Registro } from '../types';
import { EJES, TIPOS } from './constants';
import { descargar } from './storage';

/** Mismas columnas que exportarRegistrosCsv (sin ID: los importados son registros nuevos). */
export const PLANTILLA_HEADERS = [
  'Fecha', 'Tipo de movimiento', 'Eje estratégico principal', 'Eje estratégico secundario',
  'Unidad de negocio', 'Beneficiario / Institución', 'Donación o aporte', 'Descripción',
  'Costo interno (ARS)', 'Inversión (ARS)', 'Horas de voluntariado', 'Contacto',
  'N° de certificado', 'N° de factura', 'Observaciones',
];

const FILA_EJEMPLO = [
  '2026-03-15', 'Donación realizada', 'INFANCIA Y EDUCACIÓN', '',
  'Fundación', 'Escuela N°12', '20 mochilas', 'Kits escolares para inicio de clases',
  '150000', '0', '', 'María Pérez', '', '', '',
];

// Se importa dinámicamente: xlsx pesa ~500KB y solo lo necesita el admin al importar/exportar plantillas.
export async function descargarPlantillaExcel(): Promise<void> {
  const XLSX = await import('xlsx');
  const hoja = XLSX.utils.aoa_to_sheet([PLANTILLA_HEADERS, FILA_EJEMPLO]);
  hoja['!cols'] = PLANTILLA_HEADERS.map(() => ({ wch: 26 }));
  const libro = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(libro, hoja, 'Registros');
  const buffer = XLSX.write(libro, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer;
  descargar(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), 'plantilla-fundacion-huentala-registros.xlsx');
}

const normalizar = (s: unknown): string =>
  String(s ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim();

function matchLista(valor: string, lista: readonly string[]): string | null {
  const n = normalizar(valor);
  return lista.find((op) => normalizar(op) === n) ?? null;
}

function normalizarFecha(valor: unknown): { ok: boolean; valor: string | null } {
  if (valor === '' || valor === null || valor === undefined) return { ok: true, valor: null };
  if (valor instanceof Date) {
    if (Number.isNaN(valor.getTime())) return { ok: false, valor: null };
    const local = new Date(valor.getTime() - valor.getTimezoneOffset() * 60000);
    return { ok: true, valor: local.toISOString().slice(0, 10) };
  }
  const s = String(valor).trim();
  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) return { ok: true, valor: `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}` };
  m = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (m) return { ok: true, valor: `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}` };
  return { ok: false, valor: null };
}

function numeroOpcional(valor: unknown): { ok: boolean; valor: number | null } {
  if (valor === '' || valor === null || valor === undefined) return { ok: true, valor: null };
  const n = typeof valor === 'number' ? valor : Number(String(valor).replace(/[^0-9,.-]/g, '').replace(',', '.'));
  if (Number.isNaN(n)) return { ok: false, valor: null };
  return { ok: true, valor: n };
}

export interface ErrorImportacion { fila: number; motivo: string; }
export interface ResultadoImportacion { validos: Registro[]; errores: ErrorImportacion[]; }

export async function parseExcelRegistros(file: File, proximoId: number): Promise<ResultadoImportacion> {
  const XLSX = await import('xlsx');
  const buffer = await file.arrayBuffer();
  const libro = XLSX.read(buffer, { type: 'array', cellDates: true });
  const hoja = libro.Sheets[libro.SheetNames[0]];
  if (!hoja) return { validos: [], errores: [{ fila: 0, motivo: 'El archivo no tiene ninguna hoja con datos.' }] };

  const encabezados: string[] = (XLSX.utils.sheet_to_json(hoja, { header: 1 })[0] as string[]) ?? [];
  const mapaEncabezados = new Map(encabezados.map((h) => [normalizar(h), h]));
  const columna = (esperado: string): string | null => mapaEncabezados.get(normalizar(esperado)) ?? null;

  const faltantes = PLANTILLA_HEADERS.filter((h) => !columna(h));
  if (faltantes.length) {
    return { validos: [], errores: [{ fila: 1, motivo: `Faltan columnas en el archivo (usá la plantilla): ${faltantes.join(', ')}` }] };
  }

  const filas = XLSX.utils.sheet_to_json<Record<string, unknown>>(hoja, { defval: '', raw: true });
  const validos: Registro[] = [];
  const errores: ErrorImportacion[] = [];
  let siguienteId = proximoId;

  filas.forEach((fila, i) => {
    const numFila = i + 2; // +1 base 0, +1 por la fila de encabezado
    const get = (h: string) => fila[columna(h) as string];

    const esVacia = PLANTILLA_HEADERS.every((h) => String(get(h) ?? '').trim() === '');
    if (esVacia) return;

    const beneficiario = String(get('Beneficiario / Institución') ?? '').trim();
    const tipoRaw = String(get('Tipo de movimiento') ?? '').trim();
    const ejeRaw = String(get('Eje estratégico principal') ?? '').trim();
    const ejeSecRaw = String(get('Eje estratégico secundario') ?? '').trim();
    const unidad = String(get('Unidad de negocio') ?? '').trim();

    const problemas: string[] = [];
    if (!beneficiario) problemas.push('falta "Beneficiario / Institución"');
    if (!unidad) problemas.push('falta "Unidad de negocio"');

    const tipo = tipoRaw ? matchLista(tipoRaw, TIPOS) : null;
    if (!tipoRaw) problemas.push('falta "Tipo de movimiento"');
    else if (!tipo) problemas.push(`"Tipo de movimiento" no reconocido: "${tipoRaw}"`);

    const eje = ejeRaw ? matchLista(ejeRaw, EJES) : null;
    if (!ejeRaw) problemas.push('falta "Eje estratégico principal"');
    else if (!eje) problemas.push(`"Eje estratégico principal" no reconocido: "${ejeRaw}"`);

    let ejeSecundario: string | null = null;
    if (ejeSecRaw) {
      ejeSecundario = matchLista(ejeSecRaw, EJES);
      if (!ejeSecundario) problemas.push(`"Eje estratégico secundario" no reconocido: "${ejeSecRaw}"`);
      else if (ejeSecundario === eje) problemas.push('el eje secundario no puede ser igual al principal');
    }

    const fechaRes = normalizarFecha(get('Fecha'));
    if (!fechaRes.ok) problemas.push(`"Fecha" inválida: "${get('Fecha')}"`);
    else if (fechaRes.valor) {
      const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
      const d = new Date(fechaRes.valor + 'T00:00:00');
      if (d > hoy) problemas.push('"Fecha" no puede ser futura');
      if (d.getFullYear() < 2014) problemas.push('"Fecha" no puede ser anterior a 2014');
    }

    const costoRes = numeroOpcional(get('Costo interno (ARS)'));
    if (!costoRes.ok || (costoRes.valor !== null && costoRes.valor < 0)) problemas.push('"Costo interno (ARS)" inválido');
    const inversionRes = numeroOpcional(get('Inversión (ARS)'));
    if (!inversionRes.ok || (inversionRes.valor !== null && inversionRes.valor < 0)) problemas.push('"Inversión (ARS)" inválido');
    const horasRes = numeroOpcional(get('Horas de voluntariado'));
    if (!horasRes.ok || (horasRes.valor !== null && horasRes.valor < 0)) problemas.push('"Horas de voluntariado" inválido');

    if (problemas.length) {
      errores.push({ fila: numFila, motivo: problemas.join('; ') });
      return;
    }

    validos.push({
      id: siguienteId++,
      fecha: fechaRes.valor,
      tipo: tipo!,
      eje: eje!,
      ejeSecundario,
      unidad,
      beneficiario,
      aporte: String(get('Donación o aporte') ?? '').trim() || null,
      motivo: String(get('Descripción') ?? '').trim() || null,
      costo: costoRes.valor,
      inversion: inversionRes.valor,
      horas: horasRes.valor,
      contacto: String(get('Contacto') ?? '').trim() || null,
      numeroCertificado: String(get('N° de certificado') ?? '').trim() || null,
      numeroFactura: String(get('N° de factura') ?? '').trim() || null,
      observaciones: String(get('Observaciones') ?? '').trim() || null,
      fotosCount: 0,
      tieneFotos: false,
      constanciaCount: 0,
      tieneConstancia: false,
    });
  });

  return { validos, errores };
}
