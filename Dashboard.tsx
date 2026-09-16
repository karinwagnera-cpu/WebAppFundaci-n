import { useMemo } from 'react';
import type { ChartConfiguration } from 'chart.js';
import type { Filtro, Registro } from '../types';
import { EJES, UNIDADES } from '../lib/constants';
import { filtrar, resumen, anios } from '../lib/agregados';
import { fmtInt, fmtMoney, parseUnidades, tituloEje } from '../lib/format';
import { coloresChart, tickMoneda } from '../lib/temaChart';
import ChartCanvas from '../components/ChartCanvas';
import FiltroBar from '../components/FiltroBar';
import Icon, { type IconName } from '../components/Icon';

interface Props {
  registros: Registro[];
  filtro: Filtro;
  onFiltro: (f: Filtro) => void;
  tema: string;
}

const KPIS: Array<{ tono: string; icon: IconName; label: string }> = [
  { tono: 'hl-maroon', icon: 'check', label: 'Acciones realizadas' },
  { tono: 'hl-gold', icon: 'heart', label: 'Donaciones realizadas' },
  { tono: 'hl-teal', icon: 'users', label: 'Beneficiarios' },
  { tono: 'hl-sage', icon: 'clock', label: 'Horas de voluntariado' },
  { tono: 'hl-rose', icon: 'money', label: 'Costo interno invertido' },
];

export default function Dashboard({ registros, filtro, onFiltro, tema }: Props) {
  const data = useMemo(() => filtrar(registros, filtro), [registros, filtro]);
  const res = useMemo(() => resumen(data), [data]);

  const charts = useMemo(() => {
    const T = coloresChart();
    const palette = [T.c2, T.c3, T.c1, T.c4, T.c5, T.c6];

    const cuenta = new Map<string, number>();
    EJES.forEach((e) => cuenta.set(e, 0));
    data.forEach((r) => { if (r.eje && cuenta.has(r.eje)) cuenta.set(r.eje, cuenta.get(r.eje)! + 1); });
    const ejeLabels = EJES.filter((e) => cuenta.get(e)! > 0).sort((a, b) => cuenta.get(b)! - cuenta.get(a)!);

    const eje: ChartConfiguration = {
      type: 'bar',
      data: {
        labels: ejeLabels.map(tituloEje),
        datasets: [{
          data: ejeLabels.map((e) => cuenta.get(e)!),
          backgroundColor: ejeLabels.map((_, i) => palette[i % palette.length]),
          borderRadius: 5, maxBarThickness: 26,
        }],
      },
      options: {
        indexAxis: 'y', responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { x: { ticks: { precision: 0 }, grid: { color: T.grid } }, y: { grid: { display: false } } },
      },
    };

    const porAnio = new Map<string, number>();
    data.forEach((r) => { if (r.fecha) { const y = r.fecha.slice(0, 4); porAnio.set(y, (porAnio.get(y) || 0) + 1); } });
    const labelsAnio = Array.from(porAnio.keys()).sort();
    const sinFecha = data.filter((r) => !r.fecha).length;

    const anual: ChartConfiguration = {
      type: 'line',
      data: {
        labels: sinFecha ? [...labelsAnio, 'S/D'] : labelsAnio,
        datasets: [{
          data: sinFecha ? [...labelsAnio.map((y) => porAnio.get(y)!), sinFecha] : labelsAnio.map((y) => porAnio.get(y)!),
          borderColor: T.maroon, backgroundColor: 'transparent', fill: false, tension: 0.4,
          pointBackgroundColor: T.maroon, pointRadius: 4, pointHoverRadius: 6, borderWidth: 2.5,
        }],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { x: { grid: { display: false } }, y: { beginAtZero: true, ticks: { precision: 0 }, grid: { color: T.grid } } },
      },
    };

    const porUnidad = new Map<string, number>();
    UNIDADES.forEach((u) => porUnidad.set(u, 0));
    data.forEach((r) => parseUnidades(r.unidad).forEach((u) => porUnidad.set(u, (porUnidad.get(u) || 0) + 1)));
    const uLabels = UNIDADES.filter((u) => porUnidad.get(u)! > 0);

    const unidad: ChartConfiguration<'doughnut'> = {
      type: 'doughnut',
      data: {
        labels: [...uLabels],
        datasets: [{
          data: uLabels.map((u) => porUnidad.get(u)!),
          backgroundColor: [T.c1, T.c2, T.c3, T.c4, T.c5], borderColor: T.panel, borderWidth: 3,
        }],
      },
      options: {
        responsive: true, maintainAspectRatio: false, cutout: '62%',
        plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 11 } } } },
      },
    };

    const financiero: ChartConfiguration = {
      type: 'bar',
      data: {
        labels: ['Costo interno', 'Inversión (valor de mercado)'],
        datasets: [{ data: [res.costo, res.inversion], backgroundColor: [T.c5, T.c1], borderRadius: 8, maxBarThickness: 60 }],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c) => fmtMoney(c.parsed.y) } } },
        scales: { x: { grid: { display: false } }, y: { beginAtZero: true, grid: { color: T.grid }, ticks: { callback: tickMoneda } } },
      },
    };

    return { eje, anual, unidad, financiero };
  }, [data, res, tema]);

  const valores = [
    fmtInt(res.acciones), fmtInt(res.donaciones), fmtInt(res.beneficiarios), fmtInt(res.horas), fmtMoney(res.costo),
  ];
  const subs = [
    'Todas las categorías', 'Tipo "Donación realizada"', 'Organizaciones distintas', 'Tipo "Voluntariado"',
    res.acciones ? `${res.conCosto} de ${res.acciones} acciones con costo cargado` : '',
  ];
  const ratio = res.costo > 0 ? (res.inversion / res.costo).toFixed(1) + '×' : '—';

  return (
    <section className="view active">
      <FiltroBar filtro={filtro} anios={anios(registros)} onChange={onFiltro} />

      <div className="kpi-grid">
        {KPIS.map((k, i) => (
          <div key={k.label} className={`kpi hl ${k.tono}`}>
            <div className="icon-badge"><Icon name={k.icon} /></div>
            <div className="val">{valores[i]}</div>
            <div className="lbl">{k.label}</div>
            <div className="sub">{subs[i]}</div>
          </div>
        ))}
      </div>

      <div className="panel-grid">
        <div className="panel">
          <h3>Acciones por eje estratégico</h3>
          <ChartCanvas config={charts.eje} />
        </div>
        <div className="panel">
          <h3>Evolución anual</h3>
          <ChartCanvas config={charts.anual} />
        </div>
        <div className="panel">
          <h3>Distribución por unidad de negocio</h3>
          <ChartCanvas config={charts.unidad} />
        </div>
        <div className="panel">
          <h3>Costo interno vs. Inversión</h3>
          <div className="fin-summary">
            <div className="fin-cell">
              <div className="fl"><span className="swatch" style={{ background: 'var(--chart-5)' }} />Costo interno</div>
              <div className="fn">{fmtMoney(res.costo)}</div>
            </div>
            <div className="fin-cell">
              <div className="fl"><span className="swatch" style={{ background: 'var(--chart-1)' }} />Inversión (valor)</div>
              <div className="fn">{fmtMoney(res.inversion)}</div>
            </div>
            <div className="fin-cell highlight">
              <div className="fl">Valor apalancado</div>
              <div className="fn">{ratio}</div>
            </div>
          </div>
          <ChartCanvas config={charts.financiero} height={200} />
        </div>
      </div>
    </section>
  );
}
