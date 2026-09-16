import { useMemo, useState } from 'react';
import type { Filtro, Registro } from '../types';
import { anios } from '../lib/agregados';
import { fmtFecha, fmtMoney, tituloEje, tituloTexto } from '../lib/format';
import FiltroBar from '../components/FiltroBar';
import Icon from '../components/Icon';

interface Props {
  registros: Registro[];
  filtro: Filtro;
  onFiltro: (f: Filtro) => void;
  busqueda: string;
  onBusqueda: (q: string) => void;
  puedeEditar: boolean;
  onVer: (id: number) => void;
  onEditar: (id: number) => void;
  onNuevo: () => void;
}

const num = (v: unknown): boolean => v !== null && v !== undefined && v !== '';

export default function RegistroView({
  registros, filtro, onFiltro, busqueda, onBusqueda, puedeEditar, onVer, onEditar, onNuevo,
}: Props) {
  const [pagina, setPagina] = useState(1);
  const [porPagina, setPorPagina] = useState(25);

  const filas = useMemo(() => {
    const q = busqueda.toLowerCase().trim();
    return registros
      .filter((r) => {
        if (filtro.y && (!r.fecha || r.fecha.slice(0, 4) !== filtro.y)) return false;
        if (filtro.m && (!r.fecha || r.fecha.slice(5, 7) !== filtro.m)) return false;
        if (filtro.e && r.eje !== filtro.e) return false;
        if (!q) return true;
        return [r.beneficiario, r.aporte, r.contacto, r.motivo, r.eje, r.unidad].join(' ').toLowerCase().includes(q);
      })
      .sort((a, b) => (b.fecha || '').localeCompare(a.fecha || ''));
  }, [registros, filtro, busqueda]);

  const totalPags = Math.max(1, Math.ceil(filas.length / porPagina));
  const actual = Math.min(pagina, totalPags);
  const visibles = filas.slice((actual - 1) * porPagina, (actual - 1) * porPagina + porPagina);

  const numeros: Array<number | '…'> = [];
  for (let i = 1; i <= totalPags; i++) {
    if (i === 1 || i === totalPags || (i >= actual - 1 && i <= actual + 1)) numeros.push(i);
    else if (numeros[numeros.length - 1] !== '…') numeros.push('…');
  }

  const selectorTamano = (
    <select
      className="pg-size"
      aria-label="Registros por página"
      value={porPagina}
      onChange={(e) => { setPorPagina(Number(e.target.value)); setPagina(1); }}
    >
      {[25, 50, 100].map((n) => <option key={n} value={n}>{n} por página</option>)}
    </select>
  );

  return (
    <section className="view active">
      <div className="table-tools">
        <div className="search-row" style={{ display: 'flex', gap: 10, flex: 1 }}>
          <div className="searchbox">
            <Icon name="search" />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => { onBusqueda(e.target.value); setPagina(1); }}
              placeholder="Buscar beneficiario, evento…"
            />
          </div>
          <FiltroBar filtro={filtro} anios={anios(registros)} onChange={(f) => { onFiltro(f); setPagina(1); }} />
        </div>
        {puedeEditar && (
          <button className="btn" onClick={onNuevo}>
            <Icon name="plus" /> Nuevo registro
          </button>
        )}
      </div>

      <div className="table-card">
        <div className="scroll-hint">
          <Icon name="scrollx" size={14} /> Deslizá horizontalmente para ver todas las columnas
        </div>
        <div className="table-scroll reg">
          <table>
            <thead>
              <tr>
                <th>Fecha</th><th>Tipo</th><th>Eje</th><th>Unidad</th><th>Beneficiario</th>
                <th>Aporte</th><th className="num">Costo interno</th><th className="num">Inversión</th>
                <th className="num">Horas</th><th>Docs</th><th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {visibles.map((r) => (
                <tr key={r.id}>
                  <td>{fmtFecha(r.fecha)}</td>
                  <td>{r.tipo || '—'}</td>
                  <td>{tituloEje(r.eje)}</td>
                  <td>{tituloTexto(r.unidad) || '—'}</td>
                  <td>{tituloTexto(r.beneficiario) || '—'}</td>
                  <td className="wrap">{tituloTexto(r.aporte) || '—'}</td>
                  <td className="num">{num(r.costo) ? fmtMoney(r.costo) : '—'}</td>
                  <td className="num">{num(r.inversion) ? fmtMoney(r.inversion) : '—'}</td>
                  <td className="num">{num(r.horas) ? r.horas : '—'}</td>
                  <td>
                    <div className="docs-col">
                      <span className={r.tieneFotos ? 'has' : ''}><Icon name="photo" size={14} />{r.fotosCount || 0}</span>
                      <span className={r.tieneConstancia ? 'has' : ''}><Icon name="informes" size={14} />{r.constanciaCount || 0}</span>
                    </div>
                  </td>
                  <td className="actions">
                    <button className="btn secondary small" onClick={() => onVer(r.id)}>Ver</button>{' '}
                    {puedeEditar && <button className="btn secondary small" onClick={() => onEditar(r.id)}>Editar</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="pagination">
        {filas.length <= porPagina ? (
          <>
            <span className="pg-info">{filas.length} registro{filas.length !== 1 ? 's' : ''}</span>
            {selectorTamano}
          </>
        ) : (
          <>
            <span className="pg-info">
              {(actual - 1) * porPagina + 1}–{Math.min(actual * porPagina, filas.length)} de {filas.length}
            </span>
            <button onClick={() => setPagina(actual - 1)} disabled={actual === 1} aria-label="Anterior">‹</button>
            {numeros.map((n, i) =>
              n === '…'
                ? <span key={`e${i}`} className="pg-info" style={{ margin: '0 2px' }}>…</span>
                : <button key={n} className={n === actual ? 'active' : ''} onClick={() => setPagina(n)}>{n}</button>
            )}
            <button onClick={() => setPagina(actual + 1)} disabled={actual === totalPags} aria-label="Siguiente">›</button>
            {selectorTamano}
          </>
        )}
      </div>

      {filas.length === 0 && (
        <div className="empty">
          <div className="empty-icon"><Icon name="search" size={26} /></div>
          <div className="big">No hay registros que coincidan</div>
          <p>Probá con otra búsqueda, ajustá los filtros o cargá un nuevo registro para verlo acá.</p>
          <div className="empty-actions">
            <button className="btn secondary small" onClick={() => { onFiltro({ y: '', m: '', e: '' }); onBusqueda(''); }}>
              Limpiar filtros
            </button>
            {puedeEditar && <button className="btn small" onClick={onNuevo}>+ Nuevo registro</button>}
          </div>
        </div>
      )}
    </section>
  );
}
