import type { Adjunto, ArchivoLeido, Campania, DocMeta, Prefs, Registro } from '../types';
import { normalizarEstadoAccion } from './constants';
import { supabase } from './supabaseClient';

const KEY_REGISTROS = 'fh_registros';
const KEY_DOCS = 'fh_docs';
const KEY_CAMPANAS = 'fh_campanas';
const KEY_PREFS = 'fh_prefs';

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export const loadRegistros = (): Registro[] | null => {
  try {
    const raw = localStorage.getItem(KEY_REGISTROS);
    return raw ? (JSON.parse(raw) as Registro[]) : null;
  } catch {
    return null;
  }
};
export const saveRegistros = (regs: Registro[]): boolean => write(KEY_REGISTROS, regs);

export const loadDocs = (): DocMeta[] => read<DocMeta[]>(KEY_DOCS, []);
export const saveDocs = (docs: DocMeta[]): boolean => write(KEY_DOCS, docs);

export const loadCampanas = (): Campania[] | null => {
  try {
    const raw = localStorage.getItem(KEY_CAMPANAS);
    return raw ? (JSON.parse(raw) as Campania[]) : null;
  } catch {
    return null;
  }
};
export const saveCampanas = (camps: Campania[]): boolean => write(KEY_CAMPANAS, camps);

export const loadPrefs = (): Partial<Prefs> => read<Partial<Prefs>>(KEY_PREFS, {});
export const savePrefs = (prefs: Prefs): boolean => write(KEY_PREFS, prefs);

export function descargar(blob: Blob, nombre: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nombre;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** Tope por archivo subido al bucket de adjuntos. */
export const MAX_ATTACH_BYTES = 15 * 1024 * 1024;

// --- Datos compartidos (Supabase) ---------------------------------------
// registros y campañas viven en Postgres, y las fotos/flyers/constancias en
// Supabase Storage (bucket "adjuntos"), para que todos los usuarios vean lo
// mismo desde cualquier dispositivo; localStorage queda solo como caché de
// lectura sin conexión.
export { supabaseDisponible } from './supabaseClient';

interface RegistroRow {
  id: number;
  fecha: string | null;
  tipo: string | null;
  eje: string | null;
  eje_secundario: string | null;
  unidad: string | null;
  beneficiario: string | null;
  aporte: string | null;
  motivo: string | null;
  costo: number | null;
  contacto: string | null;
  constancia: string | null;
  observaciones: string | null;
  difusion: string | null;
  horas: number | null;
  inversion: number | null;
  numero_certificado: string | null;
  numero_factura: string | null;
  estado: string | null;
  fotos: Adjunto[] | null;
  consts: Adjunto[] | null;
  fotos_count: number;
  tiene_fotos: boolean;
  constancia_count: number;
  tiene_constancia: boolean;
}

const registroDesdeFila = (row: RegistroRow): Registro => ({
  id: row.id,
  fecha: row.fecha,
  tipo: row.tipo,
  eje: row.eje,
  ejeSecundario: row.eje_secundario,
  unidad: row.unidad,
  beneficiario: row.beneficiario,
  aporte: row.aporte,
  motivo: row.motivo,
  costo: row.costo,
  contacto: row.contacto,
  constancia: row.constancia,
  observaciones: row.observaciones,
  difusion: row.difusion,
  horas: row.horas,
  inversion: row.inversion,
  numeroCertificado: row.numero_certificado,
  numeroFactura: row.numero_factura,
  estado: normalizarEstadoAccion(row.estado),
  fotos: row.fotos ?? [],
  consts: row.consts ?? [],
  fotosCount: row.fotos_count,
  tieneFotos: row.tiene_fotos,
  constanciaCount: row.constancia_count,
  tieneConstancia: row.tiene_constancia,
});

const filaDesdeRegistro = (r: Registro): RegistroRow => ({
  id: r.id,
  fecha: r.fecha,
  tipo: r.tipo,
  eje: r.eje,
  eje_secundario: r.ejeSecundario ?? null,
  unidad: r.unidad,
  beneficiario: r.beneficiario,
  aporte: r.aporte ?? null,
  motivo: r.motivo ?? null,
  costo: r.costo ?? null,
  contacto: r.contacto ?? null,
  constancia: r.constancia ?? null,
  observaciones: r.observaciones ?? null,
  difusion: r.difusion ?? null,
  horas: r.horas ?? null,
  inversion: r.inversion ?? null,
  numero_certificado: r.numeroCertificado ?? null,
  numero_factura: r.numeroFactura ?? null,
  estado: normalizarEstadoAccion(r.estado),
  fotos: r.fotos ?? [],
  consts: r.consts ?? [],
  fotos_count: r.fotosCount ?? 0,
  tiene_fotos: r.tieneFotos ?? false,
  constancia_count: r.constanciaCount ?? 0,
  tiene_constancia: r.tieneConstancia ?? false,
});

export async function fetchRegistrosRemoto(): Promise<Registro[]> {
  if (!supabase) throw new Error('Supabase no está configurado.');
  const { data, error } = await supabase.from('registros').select('*').order('id');
  if (error) throw error;
  return (data as RegistroRow[]).map(registroDesdeFila);
}

export async function upsertRegistroRemoto(rec: Registro): Promise<void> {
  if (!supabase) throw new Error('Supabase no está configurado.');
  const { error } = await supabase.from('registros').upsert(filaDesdeRegistro(rec));
  if (error) throw error;
}

export async function deleteRegistroRemoto(id: number): Promise<void> {
  if (!supabase) throw new Error('Supabase no está configurado.');
  const { error } = await supabase.from('registros').delete().eq('id', id);
  if (error) throw error;
}

export async function reemplazarRegistrosRemoto(regs: Registro[]): Promise<void> {
  if (!supabase) throw new Error('Supabase no está configurado.');
  const { error: delError } = await supabase.from('registros').delete().gte('id', 0);
  if (delError) throw delError;
  if (regs.length) {
    const { error } = await supabase.from('registros').insert(regs.map(filaDesdeRegistro));
    if (error) throw error;
  }
}

export async function insertarRegistrosRemoto(regs: Registro[]): Promise<void> {
  if (!supabase) throw new Error('Supabase no está configurado.');
  if (!regs.length) return;
  const { error } = await supabase.from('registros').insert(regs.map(filaDesdeRegistro));
  if (error) throw error;
}

interface CampaniaRow {
  id: number;
  nombre: string;
  descripcion: string | null;
  eje: string | null;
  estado: Campania['estado'];
  inicio: string | null;
  fin: string | null;
  meta_benef: number;
  benef: number;
  meta_acc: number;
  acc: number;
}

const campaniaDesdeFila = (row: CampaniaRow): Campania => ({
  id: row.id,
  nombre: row.nombre,
  desc: row.descripcion ?? '',
  eje: row.eje ?? '',
  estado: row.estado,
  inicio: row.inicio,
  fin: row.fin,
  metaBenef: row.meta_benef,
  benef: row.benef,
  metaAcc: row.meta_acc,
  acc: row.acc,
});

const filaDesdeCampania = (c: Campania): CampaniaRow => ({
  id: c.id,
  nombre: c.nombre,
  descripcion: c.desc ?? null,
  eje: c.eje,
  estado: c.estado,
  inicio: c.inicio,
  fin: c.fin,
  meta_benef: c.metaBenef,
  benef: c.benef,
  meta_acc: c.metaAcc,
  acc: c.acc,
});

export async function fetchCampanasRemoto(): Promise<Campania[]> {
  if (!supabase) throw new Error('Supabase no está configurado.');
  const { data, error } = await supabase.from('campanas').select('*').order('id');
  if (error) throw error;
  return (data as CampaniaRow[]).map(campaniaDesdeFila);
}

export async function upsertCampaniaRemoto(camp: Campania): Promise<void> {
  if (!supabase) throw new Error('Supabase no está configurado.');
  const { error } = await supabase.from('campanas').upsert(filaDesdeCampania(camp));
  if (error) throw error;
}

export async function deleteCampaniaRemoto(id: number): Promise<void> {
  if (!supabase) throw new Error('Supabase no está configurado.');
  const { error } = await supabase.from('campanas').delete().eq('id', id);
  if (error) throw error;
}

const BUCKET_ADJUNTOS = 'adjuntos';

/** Sube un archivo al bucket compartido de Storage y devuelve su URL pública. */
export async function subirAdjunto(file: File, carpeta: 'fotos' | 'consts'): Promise<Adjunto> {
  if (!supabase) throw new Error('Supabase no está configurado.');
  if (file.size > MAX_ATTACH_BYTES) {
    throw new Error(`"${file.name}" pesa más de ${Math.round(MAX_ATTACH_BYTES / 1024 / 1024)} MB. Elegí un archivo más liviano.`);
  }
  const limpio = file.name.replace(/[^\w.-]+/g, '_');
  const path = `${carpeta}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${limpio}`;
  const { error } = await supabase.storage.from(BUCKET_ADJUNTOS).upload(path, file, { contentType: file.type });
  if (error) throw new Error(`No se pudo subir "${file.name}": ${error.message}`);
  const { data } = supabase.storage.from(BUCKET_ADJUNTOS).getPublicUrl(path);
  return { name: file.name, type: file.type, size: file.size, url: data.publicUrl, path };
}

/** Borra del bucket los adjuntos de un registro eliminado; los errores no bloquean el borrado del registro. */
export async function eliminarAdjuntosStorage(adjuntos: Adjunto[]): Promise<void> {
  if (!supabase || !adjuntos.length) return;
  try { await supabase.storage.from(BUCKET_ADJUNTOS).remove(adjuntos.map((a) => a.path)); } catch { /* no bloquea */ }
}

/** Documentación sigue en localStorage: lee el archivo como data URL, con el tope de espacio del navegador. */
const MAX_DOC_BYTES = 4.3 * 1024 * 1024;
export function leerArchivoLocal(file: File): Promise<ArchivoLeido> {
  return new Promise((resolve, reject) => {
    if (file.size > MAX_DOC_BYTES) {
      reject(new Error(`"${file.name}" pesa más de 4.3 MB. Elegí un archivo más liviano.`));
      return;
    }
    const rd = new FileReader();
    rd.onload = () => resolve({ name: file.name, type: file.type, size: file.size, data: String(rd.result) });
    rd.onerror = () => reject(new Error(`No se pudo leer "${file.name}".`));
    rd.readAsDataURL(file);
  });
}
