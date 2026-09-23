import { EJE_CLASE, MESES } from './constants';

const nf = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 });

export const fmtMoney = (n: number | null | undefined): string => '$ ' + nf.format(Math.round(n || 0));
export const fmtInt = (n: number | null | undefined): string => nf.format(n || 0);

export const fmtFecha = (iso: string | null | undefined): string =>
  iso ? iso.split('-').reverse().join('/') : '—';

export const tituloEje = (e: string | null | undefined): string =>
  e ? e.charAt(0) + e.slice(1).toLowerCase() : 'Sin eje';

const MINUS = new Set(['de','del','la','las','los','el','y','e','o','u','en','a','para','por','con','al','un','una']);

/** Pasa texto histórico en mayúsculas a capitalización tipo título, respetando siglas. */
export function tituloTexto(s: string | null | undefined): string {
  if (s === null || s === undefined || s === '') return '';
  const str = String(s);
  if (str !== str.toUpperCase()) return str;
  return str
    .toLowerCase()
    .split(/(\s+|\/|-)/)
    .map((w, i) => {
      if (/^\s+$/.test(w) || w === '/' || w === '-') return w;
      const clean = w.replace(/[^a-záéíóúñü]/gi, '');
      if (clean.length >= 2 && clean.length <= 3 && !MINUS.has(clean)) return w.toUpperCase();
      if (i > 0 && MINUS.has(clean)) return clean;
      return w.charAt(0).toUpperCase() + w.slice(1);
    })
    .join('');
}

/** Normaliza la unidad histórica (con typos o combinada) a la lista cerrada actual. */
export function parseUnidades(raw: string | null | undefined): string[] {
  if (!raw) return ['Otro'];
  const s = String(raw).toUpperCase();
  const out: string[] = [];
  if (s.includes('WINE')) out.push('Huentala Wines');
  if (s.includes('SHERATON')) out.push('Sheraton Mendoza');
  if ((s.includes('HUALTA') || s.includes('HUENTALA')) && !s.includes('WINE')) out.push('Huentala Hotel');
  if (s.includes('FUNDACIÓN') || s.includes('FUNDACION')) out.push('Fundación');
  if (!out.length) out.push('Otro');
  return out;
}

export function ejeClase(eje: string | null | undefined): string {
  const e = (eje || '').toUpperCase();
  const hit = EJE_CLASE.find(([needle]) => e.includes(needle));
  return hit ? hit[1] : 'eje-otro';
}

export function humanSize(bytes: number | null | undefined): string {
  if (!bytes) return '0 KB';
  if (bytes < 1024 * 1024) return Math.max(1, Math.round(bytes / 1024)) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

export const nombreMes = (m: number): string => MESES[m];

export const mesesOpciones = (): Array<{ value: string; label: string }> =>
  MESES.map((m, i) => ({ value: String(i + 1).padStart(2, '0'), label: m }));
