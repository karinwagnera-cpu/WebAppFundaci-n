import { useMemo, useState } from 'react';
import type { Campania, EstadoCampania } from '../types';
import { ESTADOS_CAMPANIA, ESTADO_LABEL } from '../lib/constants';
import { fmtInt, tituloEje } from '../lib/format';
import Icon from '../components/Icon';

interface Props {
  campanas: Campania[];
  puedeEditar: boolean;
  onNueva: () => void;
  onEditar: (id: number) => void;
}

const ORDEN_ESTADO: Record<EstadoCampania, number> = { activa: 0, planificada: 1, finalizada: 2 };

export default function Campanas({ campanas, puedeEditar, onNueva, onEditar }: Props) {
  const [busqueda, setBusqueda] = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState<'' | EstadoCampania>('');

  const conteos = useMemo(() => {
    const c: Record<EstadoCampania, number> = { activa: 0, planificada: 0, finalizada: 0 };
    campanas.forEach((c2) => { c[c2.estado]++; });
    return c;
  }, [campanas]);

  const filtradas = useMemo(() => {
    const q = busqueda.toLowerCase().trim();
    return campanas
      .filter((c) => {
        if (estadoFiltro && c.estado !== estadoFiltro) return false;
        if (!q) return true;
        return (c.nombre + ' ' + c.desc).toLowerCase().includes(q);
      })
      .sort((a, b) => {
        const d = ORDEN_ESTADO[a.estado] - ORDEN_ESTADO[b.estado];
        if (d !== 0) return d;
        return (b.inicio || '').localeCompare(a.inicio || '');
      });
  }, [campanas, busqueda, estadoFiltro]);

  return (
    <section className="view active">
      <div className="stat-strip">
        {ESTADOS_CAMPANIA.map((e) => (
          <button
            key={e}
            type="button"
            className={'stat-chip' + (estadoFiltro === e ? ' active' : '')}
            onClick={() => setEstadoFiltro((v) => (v === e ? '' : e))}
          >
            <span className={`estado-dot estado-${e}`} />
            <span className="n">{conteos[e]}</span>
            <span className="l">{ESTADO_LABEL[e]}</span>
          </button>
        ))}
      </div>

      <div className="table-tools">
        <div className="searchbox">
          <Icon name="search" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar campaña…"
          />
        </div>
        {puedeEditar && (
          <button className="btn" onClick={onNueva}>
            <Icon name="plus" /> Nueva campaña
          </button>
        )}
      </div>

      <div className="table-card">
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Campaña</th><th>Eje</th><th>Período</th><th>Estado</th><th>Avance</th><th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtradas.map((c) => {
                const pct = c.metaBenef > 0 ? Math.round((c.benef / c.metaBenef) * 100) : 0;
                return (
                  <tr key={c.id}>
                    <td>
                      <div className="camp-nombre">{c.nombre}</div>
                      {c.desc && <div className="camp-desc">{c.desc}</div>}
                    </td>
                    <td>{tituloEje(c.eje)}</td>
                    <td className="wrap">{c.inicio || '—'} → {c.fin || '—'}</td>
                    <td><span className={`badge estado-badge estado-${c.estado}`}>{ESTADO_LABEL[c.estado]}</span></td>
                    <td style={{ minWidth: 160 }}>
                      <div className="progress-track">
                        <div className={'progress-fill' + (pct >= 100 ? ' done' : '')} style={{ width: `${Math.min(100, pct)}%` }} />
                      </div>
                      <div className="progress-label">{pct}% · {fmtInt(c.benef)}/{fmtInt(c.metaBenef)} beneficiarios</div>
                    </td>
                    <td className="actions">
                      {puedeEditar && (
                        <button className="btn secondary small" onClick={() => onEditar(c.id)}>
                          <Icon name="edit" size={14} /> Editar
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {filtradas.length === 0 && (
        <div className="empty">
          <div className="empty-icon"><Icon name="campanas" size={26} /></div>
          <div className="big">No hay campañas que coincidan</div>
          <p>Probá con otra búsqueda, cambiá el filtro de estado o cargá una nueva campaña.</p>
          <div className="empty-actions">
            <button className="btn secondary small" onClick={() => { setEstadoFiltro(''); setBusqueda(''); }}>
              Limpiar filtros
            </button>
            {puedeEditar && <button className="btn small" onClick={onNueva}>+ Nueva campaña</button>}
          </div>
        </div>
      )}
    </section>
  );
}
