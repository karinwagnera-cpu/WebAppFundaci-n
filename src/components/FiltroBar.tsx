import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { Filtro } from '../types';
import { EJES } from '../lib/constants';
import { mesesOpciones, tituloEje } from '../lib/format';
import Icon from './Icon';

interface Props {
  filtro: Filtro;
  anios: string[];
  onChange: (f: Filtro) => void;
  children?: ReactNode;
}

const alternar = (lista: string[], v: string) => (lista.includes(v) ? lista.filter((x) => x !== v) : [...lista, v]);

/** Botón único de filtros con panel desplegable (año / mes / eje). */
export default function FiltroBar({ filtro, anios, onChange, children }: Props) {
  const [abierto, setAbierto] = useState(false);
  const activo = Boolean(filtro.y.length || filtro.m.length || filtro.e || filtro.desde || filtro.hasta);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!abierto) return;
    const cerrar = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent) {
        if (e.key === 'Escape') setAbierto(false);
        return;
      }
      if (ref.current && !ref.current.contains(e.target as Node)) setAbierto(false);
    };
    document.addEventListener('click', cerrar);
    document.addEventListener('keydown', cerrar);
    return () => {
      document.removeEventListener('click', cerrar);
      document.removeEventListener('keydown', cerrar);
    };
  }, [abierto]);

  return (
    <div ref={ref} className={'filters' + (abierto ? ' open' : '')}>
      <div className="filter-toggle-wrap">
        <button type="button" className={'filter-toggle' + (activo ? ' has-active' : '')} onClick={() => setAbierto((v) => !v)}>
          <Icon name="filter" />
          <span className="ft-label">Filtros</span>
          <span className="fdot" />
          <Icon name="caret" className="ft-caret" />
        </button>
        <div className="filter-panel">
          <div className="fp-head">
            <span>Filtros</span>
            <button type="button" className="fp-close" aria-label="Cerrar" onClick={() => setAbierto(false)}>✕</button>
          </div>
          <div className="fp-row">
            <label>Año <em>(podés elegir varios)</em></label>
            <div className="fp-chips">
              {anios.map((y) => (
                <button key={y} type="button" className={'fp-chip' + (filtro.y.includes(y) ? ' on' : '')} aria-pressed={filtro.y.includes(y)} onClick={() => onChange({ ...filtro, y: alternar(filtro.y, y) })}>{y}</button>
              ))}
            </div>
          </div>
          <div className="fp-row">
            <label>Mes <em>(podés elegir varios)</em></label>
            <div className="fp-chips months">
              {mesesOpciones().map((m) => (
                <button key={m.value} type="button" className={'fp-chip' + (filtro.m.includes(m.value) ? ' on' : '')} aria-pressed={filtro.m.includes(m.value)} title={m.label} onClick={() => onChange({ ...filtro, m: alternar(filtro.m, m.value) })}>{m.label.slice(0, 3)}</button>
              ))}
            </div>
          </div>
          <div className="fp-row">
            <label>Eje estratégico</label>
            <select value={filtro.e} onChange={(e) => onChange({ ...filtro, e: e.target.value })}>
              <option value="">Todos los ejes</option>
              {EJES.map((e) => <option key={e} value={e}>{tituloEje(e)}</option>)}
            </select>
          </div>
          <div className="fp-row">
            <label>Rango personalizado</label>
            <div className="fp-range">
              <label className="fp-date">
                <span>Desde</span>
                <input type="date" value={filtro.desde} max={filtro.hasta || undefined} onChange={(e) => onChange({ ...filtro, desde: e.target.value })} />
              </label>
              <label className="fp-date">
                <span>Hasta</span>
                <input type="date" value={filtro.hasta} min={filtro.desde || undefined} onChange={(e) => onChange({ ...filtro, hasta: e.target.value })} />
              </label>
            </div>
          </div>
          <div className="fp-actions">
            <button type="button" className="fp-clear" onClick={() => onChange({ y: [], m: [], e: '', desde: '', hasta: '' })}>
              Limpiar filtros
            </button>
          </div>
        </div>
      </div>
      {children}
    </div>
  );
}
