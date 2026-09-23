import { useMemo, useState } from 'react';
import type { ChartConfiguration } from 'chart.js';
import type { CampoAgrupacion, MetricaGrafico, Registro, TipoGrafico } from '../types';
import { agruparParaGrafico } from '../lib/agregados';
import { tickMoneda } from '../lib/temaChart';
import ChartCanvas from '../components/ChartCanvas';
import Icon from '../components/Icon';

const PALETA = ['#6E1F32', '#B4863C', '#6B7D5A', '#3E6B6B', '#9C9284', '#A6624B', '#9A3350', '#591827'];

interface Props {
  registros: Registro[];
  onCerrar: () => void;
}

const CAMPOS: Array<{ value: CampoAgrupacion; label: string }> = [
  { value: 'eje', label: 'Eje estratégico principal' },
  { value: 'ejeSecundario', label: 'Eje estratégico secundario' },
  { value: 'unidad', label: 'Unidad de negocio' },
  { value: 'tipo', label: 'Tipo de movimiento' },
  { value: 'mes', label: 'Mes' },
  { value: 'beneficiario', label: 'Beneficiario' },
];

const METRICAS: Array<{ value: MetricaGrafico; label: string }> = [
  { value: 'cantidad', label: 'Cantidad de registros' },
  { value: 'inversion', label: 'Inversión (ARS)' },
  { value: 'costo', label: 'Costo interno (ARS)' },
  { value: 'horas', label: 'Horas de voluntariado' },
];

const TIPOS: Array<{ value: TipoGrafico; label: string }> = [
  { value: 'bar', label: 'Barras' },
  { value: 'pie', label: 'Torta' },
  { value: 'line', label: 'Líneas' },
];

export default function ConstruirGraficoModal({ registros, onCerrar }: Props) {
  const [campo, setCampo] = useState<CampoAgrupacion>('eje');
  const [metrica, setMetrica] = useState<MetricaGrafico>('cantidad');
  const [tipo, setTipo] = useState<TipoGrafico>('bar');

  const agrupado = useMemo(() => agruparParaGrafico(registros, campo, metrica), [registros, campo, metrica]);

  const config = useMemo<ChartConfiguration>(() => {
    const style = getComputedStyle(document.body);
    const ink = style.getPropertyValue('--ink').trim() || '#221C17';
    const grid = style.getPropertyValue('--line').trim() || '#eee';
    const panel = style.getPropertyValue('--panel').trim() || '#fff';
    const colores = agrupado.labels.map((_, i) => PALETA[i % PALETA.length]);
    const esMoneda = metrica === 'inversion' || metrica === 'costo';
    return {
      type: tipo,
      data: {
        labels: agrupado.labels,
        datasets: [{
          data: agrupado.data,
          backgroundColor: tipo === 'line' ? 'rgba(110,31,50,.12)' : colores,
          borderColor: tipo === 'pie' ? panel : '#6E1F32',
          borderWidth: 2,
          fill: tipo === 'line',
          tension: 0.3,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: tipo === 'pie', position: 'right', labels: { color: ink } },
        },
        scales: tipo === 'pie' ? {} : {
          x: { ticks: { color: ink }, grid: { color: grid } },
          y: { beginAtZero: true, ticks: esMoneda ? { color: ink, callback: tickMoneda } : { color: ink }, grid: { color: grid } },
        },
      },
    };
  }, [agrupado, tipo, metrica]);

  return (
    <div className="modal-backdrop show" onClick={(e) => { if (e.target === e.currentTarget) onCerrar(); }}>
      <div className="modal">
        <h2>Crear gráfico con la selección</h2>
        <div className="modal-sub">{registros.length} registro{registros.length !== 1 ? 's' : ''} seleccionado{registros.length !== 1 ? 's' : ''}.</div>

        <div className="ux-grid">
          <div className="field c4">
            <label htmlFor="gbCampo">Agrupar por</label>
            <select id="gbCampo" value={campo} onChange={(e) => setCampo(e.target.value as CampoAgrupacion)}>
              {CAMPOS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <div className="field c4">
            <label htmlFor="gbMetrica">Medir</label>
            <select id="gbMetrica" value={metrica} onChange={(e) => setMetrica(e.target.value as MetricaGrafico)}>
              {METRICAS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </div>
          <div className="field c4">
            <label htmlFor="gbTipo">Tipo de gráfico</label>
            <select id="gbTipo" value={tipo} onChange={(e) => setTipo(e.target.value as TipoGrafico)}>
              {TIPOS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
        </div>

        {agrupado.labels.length === 0 ? (
          <div className="empty" style={{ margin: '18px 0' }}>
            <div className="empty-icon"><Icon name="chart" size={26} /></div>
            <div className="big">Sin datos para graficar</div>
            <p>Los registros seleccionados no tienen valores cargados para esta métrica.</p>
          </div>
        ) : (
          <div className="panel" style={{ marginTop: 18 }}>
            <ChartCanvas config={config} height={320} />
          </div>
        )}

        <div className="modal-actions">
          <button type="button" className="btn secondary" onClick={onCerrar}>Cerrar</button>
        </div>
      </div>
    </div>
  );
}
