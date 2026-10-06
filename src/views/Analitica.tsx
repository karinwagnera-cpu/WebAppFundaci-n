import { useMemo } from 'react';
import type { ChartConfiguration } from 'chart.js';
import type { Campania, Filtro, Registro, Tema } from '../types';
import { anios, construirInforme, filtrar } from '../lib/agregados';
import { fmtInt, fmtMoney } from '../lib/format';
import { coloresChart, tickMoneda } from '../lib/temaChart';
import { exportarRegistrosCsv } from '../lib/csv';
import { ESTADOS_CAMPANIA, ESTADO_LABEL } from '../lib/constants';
import ChartCanvas from '../components/ChartCanvas';
import FiltroBar from '../components/FiltroBar';
import Icon from '../components/Icon';
import logo from '../assets/logo.jpg';

interface Props {
  registros: Registro[];
  campanas: Campania[];
  filtro: Filtro;
  onFiltro: (f: Filtro) => void;
  tema: Tema;
}

export default function Analitica({ registros, campanas, filtro, onFiltro, tema }: Props) {
  const inf = useMemo(() => construirInforme(registros, filtro), [registros, filtro]);

  const campanasFiltradas = useMemo(
    () => campanas.filter((c) => !filtro.e || c.eje === filtro.e),
    [campanas, filtro.e]
  );

  const charts = useMemo(() => {
    const T = coloresChart(tema);
    const palette = [T.c2, T.c3, T.c1, T.c4, T.c5, T.c6];
    const eje: ChartConfiguration<'doughnut'> = {
      type: 'doughnut',
      data: {
        labels: inf.ejes.map((e) => e.label),
        datasets: [{
          data: inf.ejes.map((e) => e.accionesRaw),
          backgroundColor: inf.ejes.map((_, i) => palette[i % palette.length]),
          borderColor: T.panel2, borderWidth: 3,
        }],
      },
      options: {
        responsive: true, maintainAspectRatio: false, cutout: '58%',
        plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 11 }, padding: 10 } } },
      },
    };
    const fin: ChartConfiguration = {
      type: 'bar',
      data: {
        labels: ['Costo interno', 'Inversión'],
        datasets: [{ data: [inf.res.costo, inf.res.inversion], backgroundColor: [T.c5, T.c1], borderRadius: 8, maxBarThickness: 70 }],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c) => fmtMoney(c.parsed.y) } } },
        scales: { x: { grid: { display: false } }, y: { beginAtZero: true, grid: { display: false }, ticks: { callback: tickMoneda } } },
      },
    };

    const porEstado = ESTADOS_CAMPANIA.map((e) => campanasFiltradas.filter((c) => c.estado === e).length);
    const campEstado: ChartConfiguration<'doughnut'> = {
      type: 'doughnut',
      data: {
        labels: ESTADOS_CAMPANIA.map((e) => ESTADO_LABEL[e]),
        datasets: [{ data: porEstado, backgroundColor: [T.c3, T.c2, T.c5], borderColor: T.panel2, borderWidth: 3 }],
      },
      options: {
        responsive: true, maintainAspectRatio: false, cutout: '58%',
        plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 11 }, padding: 10 } } },
      },
    };

    const conMeta = campanasFiltradas.filter((c) => c.metaBenef > 0);
    const efectividad: ChartConfiguration<'bar'> = {
      type: 'bar',
      data: {
        labels: conMeta.map((c) => c.nombre),
        datasets: [{
          data: conMeta.map((c) => Math.round((c.benef / c.metaBenef) * 100)),
          backgroundColor: T.c1, borderRadius: 5, maxBarThickness: 26,
        }],
      },
      options: {
        indexAxis: 'y', responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c) => `${c.parsed.x}% de la meta` } } },
        scales: { x: { beginAtZero: true, grid: { display: false }, ticks: { callback: (v) => `${v}%` } }, y: { grid: { display: false } } },
      },
    };

    return { eje, fin, campEstado, efectividad };
  }, [inf, campanasFiltradas, tema]);

  const exportarCsv = () => {
    const data = filtrar(registros, filtro);
    const suf = [filtro.y, filtro.m].filter(Boolean).join('-');
    exportarRegistrosCsv(data, `fundacion-huentala-informe${suf ? '-' + suf : ''}.csv`);
  };

  const resumen = [
    { n: fmtInt(inf.res.donaciones), l: 'Donaciones realizadas' },
    { n: fmtInt(inf.res.beneficiarios), l: 'Beneficiarios distintos' },
    { n: fmtMoney(inf.res.costo), l: 'Costo interno' },
    { n: fmtMoney(inf.res.inversion), l: 'Inversión (valor)' },
    { n: fmtInt(inf.res.horas), l: 'Horas de voluntariado' },
  ];

  return (
    <section className="view active" id="view-analitica">
      <FiltroBar filtro={filtro} anios={anios(registros)} onChange={onFiltro}>
        <button className="btn secondary small" onClick={exportarCsv}><Icon name="download" /> Exportar CSV</button>
        <button className="btn secondary small" onClick={() => window.print()}><Icon name="print" /> Imprimir / PDF</button>
      </FiltroBar>

      <div className="report-doc">
        <div className="rd-head">
          <div className="rd-brand">
            <div className="rd-logo"><img src={logo} alt="Fundación Huentala" /></div>
            <div>
              <div className="rd-title">Informe de gestión</div>
              <div className="rd-period">{inf.periodo}</div>
            </div>
          </div>
          <div className="rd-meta">
            <div className="rd-org">Fundación Huentala</div>
            <div className="rd-date">
              Generado el {new Date().toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })}
            </div>
          </div>
        </div>

        <div className="report-summary">
          {resumen.map((c) => (
            <div key={c.l} className="cell"><div className="n">{c.n}</div><div className="l">{c.l}</div></div>
          ))}
        </div>

        <h4 className="rd-h4 rd-tabletitle" style={{ marginTop: 4 }}>Campañas del período</h4>
        <div className="rd-charts">
          <div className="rd-chart-card">
            <h4 className="rd-h4">Campañas por estado</h4>
            <ChartCanvas config={charts.campEstado} tema={tema} />
          </div>
          <div className="rd-chart-card">
            <h4 className="rd-h4">Efectividad por campaña (% de meta)</h4>
            <ChartCanvas config={charts.efectividad} tema={tema} />
          </div>
        </div>

        <div className="rd-charts">
          <div className="rd-chart-card">
            <h4 className="rd-h4">Distribución por eje estratégico</h4>
            <ChartCanvas config={charts.eje} tema={tema} />
          </div>
          <div className="rd-chart-card">
            <h4 className="rd-h4">Costo interno vs. Inversión</h4>
            <ChartCanvas config={charts.fin} tema={tema} />
          </div>
        </div>

        <h4 className="rd-h4 rd-tabletitle">Detalle por eje estratégico</h4>
        <div className="table-card" style={{ marginBottom: 24 }}>
          <div className="table-scroll">
            <table className="rep-table t-eje">
              <colgroup>
                <col className="c-name" /><col className="c-num" /><col className="c-num" /><col className="c-num-lg" /><col className="c-num-lg" />
              </colgroup>
              <thead>
                <tr>
                  <th>Eje estratégico</th><th className="num">Acciones</th><th className="num">Beneficiarios</th>
                  <th className="num">Costo interno</th><th className="num">Inversión</th>
                </tr>
              </thead>
              <tbody>
                {inf.ejes.length === 0 ? (
                  <tr><td colSpan={5} style={{ color: 'var(--muted)' }}>Sin datos para este período</td></tr>
                ) : inf.ejes.map((e) => (
                  <tr key={e.key}>
                    <td>{e.label}</td>
                    <td className="num barcell">
                      <span className="cellbar"><span style={{ width: `${e.bar}%` }} /></span>
                      <span className="cellbar-num">{e.acciones}</span>
                    </td>
                    <td className="num">{e.ben}</td>
                    <td className="num">{e.costo}</td>
                    <td className="num">{e.inversion}</td>
                  </tr>
                ))}
              </tbody>
              {inf.ejes.length > 0 && (
                <tfoot>
                  <tr>
                    <td>Total</td>
                    <td className="num">{fmtInt(inf.res.acciones)}</td>
                    <td className="num">{fmtInt(inf.res.beneficiarios)}</td>
                    <td className="num">{fmtMoney(inf.res.costo)}</td>
                    <td className="num">{fmtMoney(inf.res.inversion)}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>

        <h4 className="rd-h4 rd-tabletitle">Detalle por unidad de negocio</h4>
        <div className="table-card">
          <div className="table-scroll">
            <table className="rep-table t-unidad">
              <colgroup><col className="c-name" /><col className="c-num" /><col className="c-num-lg" /><col className="c-num-lg" /></colgroup>
              <thead>
                <tr><th>Unidad</th><th className="num">Acciones</th><th className="num">Costo interno</th><th className="num">Inversión</th></tr>
              </thead>
              <tbody>
                {inf.unidades.length === 0 ? (
                  <tr><td colSpan={4} style={{ color: 'var(--muted)' }}>Sin datos para este período</td></tr>
                ) : inf.unidades.map((u) => (
                  <tr key={u.label}>
                    <td>{u.label}</td>
                    <td className="num barcell">
                      <span className="cellbar"><span style={{ width: `${u.bar}%` }} /></span>
                      <span className="cellbar-num">{u.acciones}</span>
                    </td>
                    <td className="num">{u.costo}</td>
                    <td className="num">{u.inversion}</td>
                  </tr>
                ))}
              </tbody>
              {inf.unidades.length > 0 && (
                <tfoot>
                  <tr>
                    <td>Total</td>
                    <td className="num">{inf.totalUnidad.acciones}</td>
                    <td className="num">{inf.totalUnidad.costo}</td>
                    <td className="num">{inf.totalUnidad.inversion}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>

        <div className="rd-footer">
          Documento generado desde el panel de gestión de Fundación Huentala · Los montos son estimaciones de valorización.
        </div>
      </div>
    </section>
  );
}
