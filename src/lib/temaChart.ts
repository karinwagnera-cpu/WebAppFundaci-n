import type { Tema } from '../types';

export interface ColoresChart {
  ink: string; grid: string; panel: string; panel2: string;
  c1: string; c2: string; c3: string; c4: string; c5: string; c6: string;
  maroon: string;
}

// Mismos valores que :root / [data-theme] en styles.css. Se definen acá en vez de
// leerlos del DOM (getComputedStyle) porque el atributo data-theme se aplica en un
// useEffect que corre DESPUÉS del render en el que useMemo arma la config del
// gráfico: leer el DOM en ese momento devolvía el color del tema anterior.
const PALETAS: Record<Tema, Omit<ColoresChart, 'c1' | 'c2' | 'c3' | 'c4' | 'c5' | 'c6'>> = {
  light: { ink: '#56493C', grid: '#EFE7DA', panel: '#FFFFFF', panel2: '#FBF9F5', maroon: '#6E1F32' },
  dark: { ink: '#E8EBF0', grid: '#242C39', panel: '#171D28', panel2: '#1C2330', maroon: '#C24B67' },
};

const CHART_COLORS = { c1: '#6E1F32', c2: '#B4863C', c3: '#6B7D5A', c4: '#3E6B6B', c5: '#9C9284', c6: '#A6624B' };

export const coloresChart = (tema: Tema = 'light'): ColoresChart => ({
  ...PALETAS[tema],
  ...CHART_COLORS,
});

export const tickMoneda = (v: number | string): string => {
  const n = Number(v);
  return '$' + (n >= 1000000 ? (n / 1000000).toFixed(1) + 'M' : n >= 1000 ? Math.round(n / 1000) + 'k' : n);
};
