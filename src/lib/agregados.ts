import type { CampoAgrupacion, Filtro, MetricaGrafico, Registro } from '../types';
import { EJES, UNIDADES, MESES } from './constants';
import { fmtInt, fmtMoney, parseUnidades, tituloEje, tituloTexto } from './format';

export function filtrar(registros: Registro[], f: Filtro): Registro[] {
  return registros.filter((r) => {
    if (f.y && (!r.fecha || r.fecha.slice(0, 4) !== f.y)) return false;
    if (f.m && (!r.fecha || r.fecha.slice(5, 7) !== f.m)) return false;
    if (f.e && r.eje !== f.e && r.ejeSecundario !== f.e) return false;
    return true;
  });
}

export interface Resumen {
  acciones: number;
  donaciones: number;
  beneficiarios: number;
  horas: number;
  costo: number;
  inversion: number;
  conCosto: number;
}

const cargado = (v: unknown): boolean => v !== null && v !== undefined && v !== '';

export function resumen(data: Registro[]): Resumen {
  // El costo/inversión ya invertidos cuentan siempre, sea la acción pasada, planificada a futuro
  // o cancelada; "acciones" y "conCosto" en cambio reflejan solo lo ya realizado (para el
  // conteo del Dashboard), dejando afuera lo planificado y lo cancelado.
  const realizadas = data.filter((r) => r.estado !== 'planificada' && r.estado !== 'cancelada');
  return {
    acciones: realizadas.length,
    donaciones: data.filter((r) => r.tipo === 'Donación realizada').length,
    beneficiarios: new Set(data.map((r) => (r.beneficiario || '').trim().toUpperCase()).filter(Boolean)).size,
    horas: data.reduce((s, r) => s + (Number(r.horas) || 0), 0),
    costo: data.filter((r) => cargado(r.costo)).reduce((s, r) => s + (Number(r.costo) || 0), 0),
    inversion: data.filter((r) => cargado(r.inversion)).reduce((s, r) => s + (Number(r.inversion) || 0), 0),
    conCosto: realizadas.filter((r) => cargado(r.costo)).length,
  };
}

export const anios = (registros: Registro[]): string[] =>
  Array.from(new Set(registros.filter((r) => r.fecha).map((r) => r.fecha!.slice(0, 4)))).sort((a, b) => b.localeCompare(a));

export interface FilaEje {
  key: string;
  label: string;
  accionesRaw: number;
  acciones: string;
  ben: string;
  costo: string;
  inversion: string;
  bar: number;
}

export interface FilaUnidad {
  label: string;
  acciones: string;
  costo: string;
  inversion: string;
  bar: number;
}

export interface Informe {
  data: Registro[];
  res: Resumen;
  ejes: FilaEje[];
  unidades: FilaUnidad[];
  ratio: number | null;
  periodo: string;
  totalUnidad: { acciones: string; costo: string; inversion: string };
}

export function construirInforme(registros: Registro[], f: Filtro): Informe {
  const data = filtrar(registros, f);
  const res = resumen(data);

  const byEje = new Map<string, { acciones: number; ben: Set<string>; costo: number; inversion: number }>();
  EJES.forEach((e) => byEje.set(e, { acciones: 0, ben: new Set(), costo: 0, inversion: 0 }));
  data.forEach((r) => {
    // Una acción con eje principal + secundario cuenta en los dos (para análisis cruzado),
    // pero el dinero se reparte entre ambos para no inflar los totales (mismo criterio que unidades múltiples).
    const ejesAccion = [r.eje, r.ejeSecundario].filter((e): e is string => Boolean(e) && byEje.has(e as string));
    if (!ejesAccion.length) return;
    ejesAccion.forEach((e) => {
      const slot = byEje.get(e)!;
      slot.acciones++;
      if (r.beneficiario) slot.ben.add(r.beneficiario.trim().toUpperCase());
      slot.costo += (Number(r.costo) || 0) / ejesAccion.length;
      slot.inversion += (Number(r.inversion) || 0) / ejesAccion.length;
    });
  });
  const activos = EJES.filter((e) => (byEje.get(e)?.acciones ?? 0) > 0);
  const maxEje = Math.max(1, ...activos.map((e) => byEje.get(e)!.acciones));
  const ejes: FilaEje[] = activos.map((e) => {
    const s = byEje.get(e)!;
    return {
      key: e,
      label: tituloEje(e),
      accionesRaw: s.acciones,
      acciones: fmtInt(s.acciones),
      ben: fmtInt(s.ben.size),
      costo: fmtMoney(s.costo),
      inversion: fmtMoney(s.inversion),
      bar: Math.round((s.acciones / maxEje) * 100),
    };
  });

  const byUnidad = new Map<string, { acciones: number; costo: number; inversion: number }>();
  UNIDADES.forEach((u) => byUnidad.set(u, { acciones: 0, costo: 0, inversion: 0 }));
  data.forEach((r) => {
    const us = parseUnidades(r.unidad);
    us.forEach((u) => {
      const slot = byUnidad.get(u);
      if (!slot) return;
      slot.acciones++;
      slot.costo += (Number(r.costo) || 0) / us.length;
      slot.inversion += (Number(r.inversion) || 0) / us.length;
    });
  });
  const uActivas = UNIDADES.filter((u) => (byUnidad.get(u)?.acciones ?? 0) > 0);
  const maxU = Math.max(1, ...uActivas.map((u) => byUnidad.get(u)!.acciones));
  const unidades: FilaUnidad[] = uActivas.map((u) => {
    const s = byUnidad.get(u)!;
    return {
      label: u,
      acciones: fmtInt(s.acciones),
      costo: fmtMoney(s.costo),
      inversion: fmtMoney(s.inversion),
      bar: Math.round((s.acciones / maxU) * 100),
    };
  });
  const tot = uActivas.reduce(
    (acc, u) => {
      const s = byUnidad.get(u)!;
      return { acciones: acc.acciones + s.acciones, costo: acc.costo + s.costo, inversion: acc.inversion + s.inversion };
    },
    { acciones: 0, costo: 0, inversion: 0 }
  );

  const partes = [f.y ? `Año ${f.y}` : 'Histórico completo'];
  if (f.m) partes.push(MESES[parseInt(f.m, 10) - 1]);
  if (f.e) partes.push(tituloEje(f.e));

  return {
    data,
    res,
    ejes,
    unidades,
    ratio: res.costo > 0 && res.inversion > 0 ? res.inversion / res.costo : null,
    periodo: partes.join(' · '),
    totalUnidad: { acciones: fmtInt(tot.acciones), costo: fmtMoney(tot.costo), inversion: fmtMoney(tot.inversion) },
  };
}

const claveAgrupacion = (r: Registro, campo: CampoAgrupacion): string => {
  switch (campo) {
    case 'eje': return r.eje ? tituloEje(r.eje) : 'Sin eje';
    case 'ejeSecundario': return r.ejeSecundario ? tituloEje(r.ejeSecundario) : 'Sin eje secundario';
    case 'unidad': return tituloTexto(r.unidad) || 'Sin unidad';
    case 'tipo': return r.tipo || 'Sin tipo';
    case 'mes': return r.fecha ? MESES[parseInt(r.fecha.slice(5, 7), 10) - 1] : 'Sin fecha';
    case 'beneficiario': return tituloTexto(r.beneficiario) || 'Sin beneficiario';
    default: return 'Otro';
  }
};

const valorMetrica = (r: Registro, metrica: MetricaGrafico): number => {
  switch (metrica) {
    case 'cantidad': return 1;
    case 'inversion': return Number(r.inversion) || 0;
    case 'costo': return Number(r.costo) || 0;
    case 'horas': return Number(r.horas) || 0;
    default: return 0;
  }
};

export interface GraficoAdHoc {
  labels: string[];
  data: number[];
}

/** Agrupa un conjunto de registros (típicamente una selección manual) por un campo y suma una métrica. */
export function agruparParaGrafico(registros: Registro[], campo: CampoAgrupacion, metrica: MetricaGrafico): GraficoAdHoc {
  const grupos = new Map<string, number>();
  registros.forEach((r) => {
    const k = claveAgrupacion(r, campo);
    grupos.set(k, (grupos.get(k) || 0) + valorMetrica(r, metrica));
  });
  const entradas = Array.from(grupos.entries()).sort((a, b) => b[1] - a[1]);
  return { labels: entradas.map((e) => e[0]), data: entradas.map((e) => e[1]) };
}
