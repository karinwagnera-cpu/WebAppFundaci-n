import { useEffect, useRef } from 'react';
import { Chart, registerables, type ChartConfiguration } from 'chart.js';
import type { Tema } from '../types';
import { coloresChart } from '../lib/temaChart';

Chart.register(...registerables);
Chart.defaults.font.family = "'Montserrat','Segoe UI',-apple-system,Helvetica,Arial,sans-serif";

interface Props {
  config: ChartConfiguration;
  height?: number;
  tema?: Tema;
}

/** Monta un gráfico de Chart.js y lo reconstruye cuando cambia la configuración. */
export default function ChartCanvas({ config, height = 260, tema = 'light' }: Props) {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    // Color por defecto de etiquetas/referencias/números (Chart.js usa un gris fijo si no
    // se lo pisa), para que se lean bien también en modo oscuro.
    Chart.defaults.color = coloresChart(tema).ink;
    const chart = new Chart(ref.current, config);
    return () => chart.destroy();
  }, [config, tema]);

  return (
    <div className="chart-wrap" style={{ height }}>
      <canvas ref={ref} />
    </div>
  );
}
