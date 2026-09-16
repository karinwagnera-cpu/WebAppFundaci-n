export interface ColoresChart {
  ink: string; grid: string; panel: string;
  c1: string; c2: string; c3: string; c4: string; c5: string; c6: string;
  maroon: string;
}

const cssVar = (name: string): string =>
  getComputedStyle(document.documentElement).getPropertyValue(name).trim();

export const coloresChart = (): ColoresChart => ({
  ink: cssVar('--ink-soft'),
  grid: cssVar('--grid-line'),
  panel: cssVar('--panel'),
  c1: cssVar('--chart-1'),
  c2: cssVar('--chart-2'),
  c3: cssVar('--chart-3'),
  c4: cssVar('--chart-4'),
  c5: cssVar('--chart-5'),
  c6: cssVar('--chart-6'),
  maroon: cssVar('--maroon'),
});

export const tickMoneda = (v: number | string): string => {
  const n = Number(v);
  return '$' + (n >= 1000000 ? (n / 1000000).toFixed(1) + 'M' : n >= 1000 ? Math.round(n / 1000) + 'k' : n);
};
