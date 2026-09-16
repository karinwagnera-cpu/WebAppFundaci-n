import type { Filtro, Registro } from '../types';
import { EJES, UNIDADES, MESES } from './constants';
import { fmtInt, fmtMoney, parseUnidades, tituloEje } from './format';

export function filtrar(registros: Registro[], f: Filtro): Registro[] {
  return registros.filter((r) => {
    if (f.y && (!r.fecha || r.fecha.slice(0, 4) !== f.y)) return false;
    if (f.m && (!r.fecha || r.fecha.slice(5, 7) !== f.m)) return false;
    if (f.e && r.eje !== f.e) return false;
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
  const conCosto = data.filter((r) => cargado(r.costo));
  return {
    acciones: data.length,
    donaciones: data.filter((r) => r.tipo === 'Donación realizada').length,
    beneficiarios: new Set(data.map((r) => (r.beneficiario || '').trim().toUpperCase()).filter(Boolean)).size,
    horas: data.reduce((s, r) => s + (Number(r.horas) || 0), 0),
    costo: conCosto.reduce((s, r) => s + (Number(r.costo) || 0), 0),
    inversion: data.filter((r) => cargado(r.inversion)).reduce((s, r) => s + (Number(r.inversion) || 0), 0),
    conCosto: conCosto.length,
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
    const slot = r.eje ? byEje.get(r.eje) : undefined;
    if (!slot) return;
    slot.acciones++;
    if (r.beneficiario) slot.ben.add(r.beneficiario.trim().toUpperCase());
    slot.costo += Number(r.costo) || 0;
    slot.inversion += Number(r.inversion) || 0;
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
