import type { Aporte, Registro } from '../types';
import { UNIDADES } from './constants';
import { parseUnidades } from './format';

const redondear = (n: number) => Math.round(n * 100) / 100;

/** Reparte un monto en `partes` iguales; el resto por redondeo va al último para que la suma no cambie. */
function repartir(total: number | null | undefined, partes: number): Array<number | null> {
  if (total === null || total === undefined || partes <= 1) return Array.from({ length: Math.max(partes, 1) }, () => total ?? null);
  const parte = redondear(total / partes);
  return Array.from({ length: partes }, (_, i) => (i === partes - 1 ? redondear(total - parte * (partes - 1)) : parte));
}

/** Unidades nombradas en el texto libre de un registro viejo, sin repetir. */
function unidadesDe(raw: string | null | undefined): string[] {
  if (raw && UNIDADES.includes(raw as typeof UNIDADES[number])) return [raw];
  return parseUnidades(raw);
}

/**
 * Aportes de un registro. Si todavía no tiene (registro anterior a los aportes),
 * los arma desde los campos sueltos: un renglón por unidad mencionada, con los
 * montos repartidos en partes iguales (igual que hacía el tablero hasta ahora).
 */
export function aportesDe(r: Registro): { aportes: Aporte[]; repartidos: boolean } {
  if (r.aportes && r.aportes.length) return { aportes: r.aportes, repartidos: false };
  const unidades = unidadesDe(r.unidad);
  const n = unidades.length;
  const costos = repartir(r.costo, n);
  const inversiones = repartir(r.inversion, n);
  const horas = repartir(r.horas, n);
  const aportes = unidades.map((unidad, i) => ({
    unidad,
    tipo: r.tipo ?? '',
    descripcion: r.aporte ?? '',
    costo: costos[i],
    inversion: inversiones[i],
    horas: horas[i],
    numeroCertificado: i === 0 ? r.numeroCertificado ?? null : null,
    numeroFactura: i === 0 ? r.numeroFactura ?? null : null,
  }));
  return { aportes, repartidos: n > 1 && [r.costo, r.inversion, r.horas].some((v) => v !== null && v !== undefined) };
}

const unicos = (valores: Array<string | null | undefined>) =>
  [...new Set(valores.map((v) => (v ?? '').trim()).filter(Boolean))];

const sumar = (valores: Array<number | null>): number | null =>
  valores.some((v) => v !== null) ? redondear(valores.reduce<number>((s, v) => s + (v ?? 0), 0)) : null;

/**
 * Totales de una acción a partir de sus aportes, con la forma de los campos
 * sueltos de siempre (unidad, tipo, costo…). Se guardan junto a los aportes.
 */
export function totalesDe(aportes: Aporte[]) {
  return {
    unidad: unicos(aportes.map((a) => a.unidad)).join(' + ') || null,
    tipo: unicos(aportes.map((a) => a.tipo)).join(' + ') || null,
    aporte: unicos(aportes.map((a) => a.descripcion)).join(' + '),
    costo: sumar(aportes.map((a) => a.costo)),
    inversion: sumar(aportes.map((a) => a.inversion)),
    horas: sumar(aportes.map((a) => a.horas)),
    numeroCertificado: unicos(aportes.map((a) => a.numeroCertificado)).join(', ') || null,
    numeroFactura: unicos(aportes.map((a) => a.numeroFactura)).join(', ') || null,
  };
}
