import { useMemo } from 'react';
import type { ChartConfiguration } from 'chart.js';
import type { Filtro, Registro } from '../types';
import { anios, construirInforme, filtrar } from '../lib/agregados';
import { fmtInt, fmtMoney } from '../lib/format';
import { coloresChart, tickMoneda } from '../lib/temaChart';
import { descargar } from '../lib/storage';
import ChartCanvas from '../components/ChartCanvas';
import FiltroBar from '../components/FiltroBar';
import Icon from '../components/Icon';
import logo from '../assets/logo.jpg';

interface Props {
  registros: Registro[];
  filtro: Filtro;
  onFiltro: (f: Filtro) => void;
  tema: string;
}

const COLS = ['id','fecha','tipo','eje','unidad','beneficiario','aporte','motivo','costo','inversion','horas','contacto','observaciones'] as const;
const HEADER = ['ID','Fecha','Tipo de movimiento','Eje estratégico','Unidad de negocio','Beneficiario / Institución','Donación o aporte','Descripción','Costo interno (ARS)','Inversión (ARS)','Horas de voluntariado','Contacto','Observaciones'];

export default function Informes({ registros, filtro, onFiltro, tema }: Props) {
  const inf = useMemo(() => construirInforme(registros, filtro), [registros, filtro]);

  const charts = useMemo(() => {
    const T = coloresChart();
    const palette = [T.c2, T.c3, T.c1, T.c4, T.c5, T.c6];
    const eje: ChartConfiguration<'doughnut'> = {
      type: 'doughnut',
      data: {
        labels: inf.ejes.map((e) => e.label),
        datasets: [{
          data: inf.ejes.map((e) => e.accionesRaw),
          backgroundColor: inf.ejes.map((_, i) => palette[i % palette.length]),
          borderColor: T.panel, borderWidth: 3,
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
        scales: { x: { grid: { display: false } }, y: { beginAtZero: true, grid: { color: T.grid }, ticks: { callback: tickMoneda } } },
      },
    };
    return { eje, fin };
  }, [inf, tema]);

  const exportarCsv = () => {
    const data = filtrar(registros, filtro).slice().sort((a, b) => (a.fecha || '').localeCompare(b.fecha || ''));
    const esc = (v: unknown) => '"' + String(v ?? '').replace(/"/g, '""') + '"';
    const lineas = [HEADER.join(','), ...data.map((r) => COLS.map((c) => esc(r[c])).join(','))];
    const suf = [filtro.y, filtro.m].filter(Boolean).join('-');
    descargar(
      new Blob(['﻿' + lineas.join('\r\n')], { type: 'text/csv;charset=utf-8;' }),
      `fundacion-huentala-informe${suf ? '-' + suf : ''}.csv`
    );
  };

  const destacados = [
    { clase: 'a', n: fmtInt(inf.res.acciones), l: 'Acciones realizadas', s: `${fmtInt(inf.res.beneficiarios)} organizaciones alcanzadas` },
    { clase: 'b', n: fmtMoney(inf.res.costo), l: 'Costo interno invertido', s: inf.res.inversion > 0 ? 'Valor de mercado: ' + fmtMoney(inf.res.inversion) : 'Inversión aún sin cargar' },
    { clase: 'c', n: inf.ratio !== null ? inf.ratio.toFixed(1) + '×' : '—', l: 'Valor apalancado', s: inf.ratio !== null ? 'Por cada $1 de costo interno' : 'Requiere costo e inversión cargados' },
  ];

  const resumen = [
    { n: fmtInt(inf.res.donaciones), l: 'Donaciones realizadas' },
    { n: fmtInt(inf.res.beneficiarios), l: 'Beneficiarios distintos' },
    { n: fmtMoney(inf.res.costo), l: 'Costo interno' },
    { n: fmtMoney(inf.res.inversion), l: 'Inversión (valor)' },
    { n: fmtInt(inf.res.horas), l: 'Horas de voluntariado' },
  ];

  return (
    <section className="view active">
      <FiltroBar filtro={filtro} anios={anios(registros)} onChange={onFiltro}>
        <button className="btn secondary" onClick={exportarCsv}><Icon name="download" /> Exportar CSV</button>
        <button className="btn secondary" onClick={() => window.print()}><Icon name="print" /> Imprimir / PDF</button>
      </FiltroBar>

      <div className="report-doc">
        <div className="rd-head">
          <div className="rd-brand">
            <div className="rd-logo"><img src={logo} alt="Fundación Huentala" /></div>
            <div>
              <div className="rd-title">Informe de gestión social</div>
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

        <div className="rd-highlight">
          {destacados.map((d) => (
            <div key={d.l} className={`rd-hl ${d.clase}`}>
              <div className="hn">{d.n}</div>
              <div className="hl">{d.l}</div>
              <div className="hs">{d.s}</div>
            </div>
          ))}
        </div>

        <div className="report-summary">
          {resumen.map((c) => (
            <div key={c.l} className="cell"><div className="n">{c.n}</div><div className="l">{c.l}</div></div>
          ))}
        </div>

        <div className="rd-charts">
          <div className="rd-chart-card">
            <h4 className="rd-h4">Distribución por eje estratégico</h4>
            <ChartCanvas config={charts.eje} />
          </div>
          <div className="rd-chart-card">
            <h4 className="rd-h4">Costo interno vs. Inversión</h4>
            <ChartCanvas config={charts.fin} />
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
                    <td className="num barcell">{e.acciones}<span className="cellbar"><span style={{ width: `${e.bar}%` }} /></span></td>
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
                    <td className="num barcell">{u.acciones}<span className="cellbar"><span style={{ width: `${u.bar}%` }} /></span></td>
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
