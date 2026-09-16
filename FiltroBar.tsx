import { useState } from 'react';
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

/** Botón único de filtros con panel desplegable (año / mes / eje). */
export default function FiltroBar({ filtro, anios, onChange, children }: Props) {
  const [abierto, setAbierto] = useState(false);
  const activo = Boolean(filtro.y || filtro.m || filtro.e);

  return (
    <div className={'filters' + (abierto ? ' open' : '')}>
      <button type="button" className={'filter-toggle' + (activo ? ' has-active' : '')} onClick={() => setAbierto((v) => !v)}>
        <Icon name="filter" />
        <span className="ft-label">Filtros</span>
        <span className="fdot" />
        <Icon name="caret" className="ft-caret" />
      </button>
      <div className="filter-panel">
        <div className="fp-row">
          <label>Año</label>
          <select value={filtro.y} onChange={(e) => onChange({ ...filtro, y: e.target.value })}>
            <option value="">Todos los años</option>
            {anios.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <div className="fp-row">
          <label>Mes</label>
          <select value={filtro.m} onChange={(e) => onChange({ ...filtro, m: e.target.value })}>
            <option value="">Todos los meses</option>
            {mesesOpciones().map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
        </div>
        <div className="fp-row">
          <label>Eje estratégico</label>
          <select value={filtro.e} onChange={(e) => onChange({ ...filtro, e: e.target.value })}>
            <option value="">Todos los ejes</option>
            {EJES.map((e) => <option key={e} value={e}>{tituloEje(e)}</option>)}
          </select>
        </div>
        <div className="fp-actions">
          <button type="button" className="fp-clear" onClick={() => onChange({ y: '', m: '', e: '' })}>
            Limpiar filtros
          </button>
        </div>
      </div>
      {children}
    </div>
  );
}
