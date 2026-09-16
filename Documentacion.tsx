import { useState } from 'react';
import type { DocMeta } from '../types';
import { DOC_CATEGORIAS } from '../lib/constants';
import { fmtFecha, humanSize } from '../lib/format';
import Icon from '../components/Icon';

interface Props {
  docs: DocMeta[];
  puedeEditar: boolean;
  onNuevo: () => void;
  onVer: (id: number) => void;
  onEliminar: (id: number) => void;
}

export default function Documentacion({ docs, puedeEditar, onNuevo, onVer, onEliminar }: Props) {
  const [categoria, setCategoria] = useState('');
  const filas = docs
    .filter((d) => !categoria || d.categoria === categoria)
    .sort((a, b) => (b.fecha || '').localeCompare(a.fecha || ''));

  return (
    <section className="view active">
      <div className="table-tools">
        <div className="field" style={{ minWidth: 220 }}>
          <label htmlFor="docFiltro">Categoría</label>
          <select id="docFiltro" value={categoria} onChange={(e) => setCategoria(e.target.value)}>
            <option value="">Todas las categorías</option>
            {DOC_CATEGORIAS.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        {puedeEditar && <button className="btn" onClick={onNuevo}><Icon name="plus" /> Subir documento</button>}
      </div>

      <div className="table-card">
        <div className="table-scroll">
          <table>
            <thead>
              <tr><th>Documento</th><th>Categoría</th><th>Fecha</th><th>Tamaño</th><th>Acciones</th></tr>
            </thead>
            <tbody>
              {filas.map((d) => (
                <tr key={d.id}>
                  <td>
                    <div className="doc-name-cell">
                      <div className="doc-icon"><Icon name={d.tipo.startsWith('image/') ? 'photo' : 'informes'} /></div>
                      <span>{d.nombre}</span>
                    </div>
                  </td>
                  <td><span className="badge">{d.categoria}</span></td>
                  <td>{fmtFecha(d.fecha)}</td>
                  <td>{humanSize(d.size)}</td>
                  <td className="actions">
                    <button className="btn secondary small" onClick={() => onVer(d.id)}>Ver / descargar</button>{' '}
                    {puedeEditar && <button className="btn danger small" onClick={() => onEliminar(d.id)}>Eliminar</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filas.length === 0 && (
        <div className="empty">
          <div className="empty-icon"><Icon name="file" size={26} /></div>
          <div className="big">Todavía no hay documentos cargados</div>
          <p>Subí estatutos, convenios, actas u otra documentación interna o legal de la Fundación.</p>
        </div>
      )}
    </section>
  );
}
