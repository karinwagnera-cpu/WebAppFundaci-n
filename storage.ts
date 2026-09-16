import type { Adjunto, DocMeta, Prefs, Registro } from '../types';

const KEY_REGISTROS = 'fh_registros';
const KEY_DOCS = 'fh_docs';
const KEY_PREFS = 'fh_prefs';
const KEY_ADJ = (id: number) => `fh_adj_${id}`;

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

export const loadPrefs = (): Partial<Prefs> => read<Partial<Prefs>>(KEY_PREFS, {});
export const savePrefs = (prefs: Prefs): boolean => write(KEY_PREFS, prefs);

export interface Adjuntos {
  fotos: Adjunto[];
  consts: Adjunto[];
}
export const loadAdjuntos = (id: number): Adjuntos => read<Adjuntos>(KEY_ADJ(id), { fotos: [], consts: [] });
export const saveAdjuntos = (id: number, adj: Adjuntos): boolean => write(KEY_ADJ(id), adj);
export const deleteAdjuntos = (id: number): void => {
  try { localStorage.removeItem(KEY_ADJ(id)); } catch { /* sin storage */ }
};

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

export function leerArchivo(file: File): Promise<Adjunto> {
  return new Promise((resolve, reject) => {
    const rd = new FileReader();
    rd.onload = () => resolve({ name: file.name, type: file.type, size: file.size, data: String(rd.result) });
    rd.onerror = () => reject(new Error('No se pudo leer el archivo'));
    rd.readAsDataURL(file);
  });
}
