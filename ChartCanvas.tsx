import { useEffect, useRef } from 'react';
import { Chart, registerables, type ChartConfiguration } from 'chart.js';

Chart.register(...registerables);
Chart.defaults.font.family = "'Montserrat','Segoe UI',-apple-system,Helvetica,Arial,sans-serif";

interface Props {
  config: ChartConfiguration;
  height?: number;
}

/** Monta un gráfico de Chart.js y lo reconstruye cuando cambia la configuración. */
export default function ChartCanvas({ config, height = 260 }: Props) {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    const chart = new Chart(ref.current, config);
    return () => chart.destroy();
  }, [config]);

  return (
    <div className="chart-wrap" style={{ height }}>
      <canvas ref={ref} />
    </div>
  );
}
