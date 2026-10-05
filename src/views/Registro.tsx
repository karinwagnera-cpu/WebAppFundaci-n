import { useEffect, useMemo, useState } from 'react';
import type { Filtro, Registro } from '../types';
import { anios } from '../lib/agregados';
import { ESTADO_ACCION_LABEL } from '../lib/constants';
import { fmtFecha, fmtMoney, tituloEje, tituloTexto } from '../lib/format';
import FiltroBar from '../components/FiltroBar';
import Icon from '../components/Icon';
import ConstruirGraficoModal from '../modals/ConstruirGraficoModal';

interface Props {
  registros: Registro[];
  filtro: Filtro;
  onFiltro: (f: Filtro) => void;
  busqueda: string;
  onBusqueda: (q: string) => void;
  puedeEditar: boolean;
  onVer: (id: number) => void;
  onEditar: (id: number) => void;
  onEliminar: (id: number) => void;
  onNuevo: () => void;
}

const num = (v: unknown): boolean => v !== null && v !== undefined && v !== '';

type ColumnaFiltrable = 'fecha' | 'tipo' | 'eje' | 'unidad' | 'beneficiario' | 'aporte' | 'costo' | 'inversion' | 'horas' | 'numeroCertificado' | 'numeroFactura';

const valorColumna = (r: Registro, col: ColumnaFiltrable): string => {
  switch (col) {
    case 'fecha': return fmtFecha(r.fecha);
    case 'tipo': return r.tipo || '';
    case 'eje': return tituloEje(r.eje) + (r.ejeSecundario ? ' ' + tituloEje(r.ejeSecundario) : '');
    case 'unidad': return tituloTexto(r.unidad);
    case 'beneficiario': return tituloTexto(r.beneficiario);
    case 'aporte': return tituloTexto(r.aporte);
    case 'costo': return num(r.costo) ? fmtMoney(r.costo) : '';
    case 'inversion': return num(r.inversion) ? fmtMoney(r.inversion) : '';
    case 'horas': return num(r.horas) ? String(r.horas) : '';
    case 'numeroCertificado': return r.numeroCertificado || '';
    case 'numeroFactura': return r.numeroFactura || '';
    default: return '';
  }
};

const COLUMNAS: Array<{ col: ColumnaFiltrable; label: string; num?: boolean }> = [
  { col: 'fecha', label: 'Fecha' },
  { col: 'tipo', label: 'Tipo' },
  { col: 'eje', label: 'Eje' },
  { col: 'unidad', label: 'Unidad' },
  { col: 'beneficiario', label: 'Beneficiario' },
  { col: 'aporte', label: 'Aporte' },
  { col: 'costo', label: 'Costo interno', num: true },
  { col: 'inversion', label: 'Inversión', num: true },
  { col: 'horas', label: 'Horas', num: true },
  { col: 'numeroCertificado', label: 'N° Certificado' },
  { col: 'numeroFactura', label: 'N° Factura' },
];

export default function RegistroView({
  registros, filtro, onFiltro, busqueda, onBusqueda, puedeEditar, onVer, onEditar, onEliminar, onNuevo,
}: Props) {
  const [pagina, setPagina] = useState(1);
  const [porPagina, setPorPagina] = useState(25);
  const [colFiltros, setColFiltros] = useState<Partial<Record<ColumnaFiltrable, string>>>({});
  const [colAbierta, setColAbierta] = useState<ColumnaFiltrable | null>(null);
  const [seleccionados, setSeleccionados] = useState<Set<number>>(new Set());
  const [graficoAbierto, setGraficoAbierto] = useState(false);

  const setColFiltro = (col: ColumnaFiltrable, valor: string) => {
    setColFiltros((f) => ({ ...f, [col]: valor }));
    setPagina(1);
  };
  const colFiltrosActivos = Object.values(colFiltros).some((v) => v && v.trim());

  useEffect(() => {
    if (!colAbierta) return;
    const cerrarClic = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('.col-filter-btn, .col-filter-popover')) return;
      setColAbierta(null);
    };
    const cerrarTecla = (e: KeyboardEvent) => { if (e.key === 'Escape') setColAbierta(null); };
    document.addEventListener('click', cerrarClic);
    document.addEventListener('keydown', cerrarTecla);
    return () => {
      document.removeEventListener('click', cerrarClic);
      document.removeEventListener('keydown', cerrarTecla);
    };
  }, [colAbierta]);

  const filas = useMemo(() => {
    const q = busqueda.toLowerCase().trim();
    return registros
      .filter((r) => {
        if (filtro.y && (!r.fecha || r.fecha.slice(0, 4) !== filtro.y)) return false;
        if (filtro.m && (!r.fecha || r.fecha.slice(5, 7) !== filtro.m)) return false;
        if (filtro.e && r.eje !== filtro.e && r.ejeSecundario !== filtro.e) return false;
        if (q && ![r.beneficiario, r.aporte, r.contacto, r.motivo, r.eje, r.ejeSecundario, r.unidad, r.numeroCertificado, r.numeroFactura].join(' ').toLowerCase().includes(q)) return false;
        for (const [col, val] of Object.entries(colFiltros)) {
          if (!val || !val.trim()) continue;
          if (!valorColumna(r, col as ColumnaFiltrable).toLowerCase().includes(val.toLowerCase().trim())) return false;
        }
        return true;
      })
      .sort((a, b) => (b.fecha || '').localeCompare(a.fecha || ''));
  }, [registros, filtro, busqueda, colFiltros]);

  const totalPags = Math.max(1, Math.ceil(filas.length / porPagina));
  const actual = Math.min(pagina, totalPags);
  const visibles = filas.slice((actual - 1) * porPagina, (actual - 1) * porPagina + porPagina);

  const numeros: Array<number | '…'> = [];
  for (let i = 1; i <= totalPags; i++) {
    if (i === 1 || i === totalPags || (i >= actual - 1 && i <= actual + 1)) numeros.push(i);
    else if (numeros[numeros.length - 1] !== '…') numeros.push('…');
  }

  const idsFiltrados = useMemo(() => filas.map((r) => r.id), [filas]);
  const todoSeleccionado = idsFiltrados.length > 0 && idsFiltrados.every((id) => seleccionados.has(id));
  const algunoSeleccionado = seleccionados.size > 0;

  const toggleFila = (id: number) => {
    setSeleccionados((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };
  const toggleTodo = () => {
    setSeleccionados((s) => {
      if (todoSeleccionado) {
        const next = new Set(s);
        idsFiltrados.forEach((id) => next.delete(id));
        return next;
      }
      return new Set([...s, ...idsFiltrados]);
    });
  };
  const registrosSeleccionados = useMemo(
    () => registros.filter((r) => seleccionados.has(r.id)),
    [registros, seleccionados]
  );

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
        <div className="search-row">
          <div className="searchbox">
            <Icon name="search" />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => { onBusqueda(e.target.value); setPagina(1); }}
              placeholder="Buscar beneficiario, evento…"
            />
          </div>
        </div>
        <div className="reg-actions">
          <FiltroBar filtro={filtro} anios={anios(registros)} onChange={(f) => { onFiltro(f); setPagina(1); }} />
          {colFiltrosActivos && (
            <button className="btn secondary small" onClick={() => setColFiltros({})}>
              Limpiar filtros de columna
            </button>
          )}
          {puedeEditar && (
            <button className="btn" onClick={onNuevo}>
              <Icon name="plus" /> Nuevo registro
            </button>
          )}
        </div>
      </div>

      {algunoSeleccionado && (
        <div className="selection-bar">
          <span>{seleccionados.size} registro{seleccionados.size !== 1 ? 's' : ''} seleccionado{seleccionados.size !== 1 ? 's' : ''}</span>
          <button className="btn secondary small" onClick={() => setGraficoAbierto(true)}>
            <Icon name="chart" size={14} /> Crear gráfico
          </button>
          <button className="btn secondary small" onClick={() => setSeleccionados(new Set())}>Deseleccionar</button>
        </div>
      )}

      <div className="table-card">
        <div className="scroll-hint">
          <Icon name="scrollx" size={14} /> Deslizá horizontalmente para ver todas las columnas
        </div>
        <div className="table-scroll reg">
          <table>
            <thead>
              <tr>
                <th className="col-fila">
                  <input type="checkbox" checked={todoSeleccionado} onChange={toggleTodo} aria-label="Seleccionar todo" />{' '}
                  <span>Fila</span>
                </th>
                {COLUMNAS.map((c) => (
                  <th key={c.col} className={c.num ? 'num' : ''}>
                    <span className="th-inline">
                      {c.label}
                      <button
                        type="button"
                        className={'col-filter-btn' + (colFiltros[c.col] ? ' active' : '')}
                        onClick={() => setColAbierta((v) => (v === c.col ? null : c.col))}
                        aria-label={`Filtrar por ${c.label}`}
                      >
                        <Icon name="filter" size={12} />
                      </button>
                      {colAbierta === c.col && (
                        <div className="col-filter-popover" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="text"
                            autoFocus
                            value={colFiltros[c.col] || ''}
                            onChange={(e) => setColFiltro(c.col, e.target.value)}
                            placeholder={`Filtrar ${c.label.toLowerCase()}…`}
                          />
                          <button type="button" onClick={() => setColAbierta(null)}>Listo</button>
                        </div>
                      )}
                    </span>
                  </th>
                ))}
                <th>Docs</th><th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {visibles.map((r, i) => (
                <tr key={r.id} className={seleccionados.has(r.id) ? 'row-selected' : ''}>
                  <td className="col-fila">
                    <div className="fila-cell">
                      <input type="checkbox" checked={seleccionados.has(r.id)} onChange={() => toggleFila(r.id)} aria-label="Seleccionar fila" />
                      <span className="fila-num">{(actual - 1) * porPagina + i + 1}</span>
                    </div>
                  </td>
                  <td>
                    {fmtFecha(r.fecha)}
                    {r.estado && r.estado !== 'realizada' && (
                      <span className={`badge estado-badge estado-${r.estado}`} style={{ marginLeft: 6 }}>
                        {ESTADO_ACCION_LABEL[r.estado]}
                      </span>
                    )}
                  </td>
                  <td>{r.tipo || '—'}</td>
                  <td>
                    {tituloEje(r.eje)}
                    {r.ejeSecundario && <span className="eje-sec"> + {tituloEje(r.ejeSecundario)}</span>}
                  </td>
                  <td>{tituloTexto(r.unidad) || '—'}</td>
                  <td>{tituloTexto(r.beneficiario) || '—'}</td>
                  <td className="wrap">{tituloTexto(r.aporte) || '—'}</td>
                  <td className="num">{num(r.costo) ? fmtMoney(r.costo) : '—'}</td>
                  <td className="num">{num(r.inversion) ? fmtMoney(r.inversion) : '—'}</td>
                  <td className="num">{num(r.horas) ? r.horas : '—'}</td>
                  <td>{r.numeroCertificado || '—'}</td>
                  <td>{r.numeroFactura || '—'}</td>
                  <td>
                    <div className="docs-col">
                      <span className={r.tieneFotos ? 'has' : ''}><Icon name="photo" size={14} />{r.fotosCount || 0}</span>
                      <span className={r.tieneConstancia ? 'has' : ''}><Icon name="informes" size={14} />{r.constanciaCount || 0}</span>
                    </div>
                  </td>
                  <td className="actions">
                    <div className="row-acts">
                      <button className="icon-act" onClick={() => onVer(r.id)} aria-label="Ver" title="Ver"><Icon name="eye" size={16} /></button>
                      {puedeEditar && (
                        <>
                          <button className="icon-act" onClick={() => onEditar(r.id)} aria-label="Editar" title="Editar"><Icon name="edit" size={16} /></button>
                          <button className="icon-act danger" onClick={() => onEliminar(r.id)} aria-label="Eliminar" title="Eliminar"><Icon name="trash" size={16} /></button>
                        </>
                      )}
                    </div>
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
            <button className="btn secondary small" onClick={() => { onFiltro({ y: '', m: '', e: '' }); onBusqueda(''); setColFiltros({}); }}>
              Limpiar filtros
            </button>
            {puedeEditar && <button className="btn small" onClick={onNuevo}>+ Nuevo registro</button>}
          </div>
        </div>
      )}

      {graficoAbierto && (
        <ConstruirGraficoModal registros={registrosSeleccionados} onCerrar={() => setGraficoAbierto(false)} />
      )}
    </section>
  );
}
