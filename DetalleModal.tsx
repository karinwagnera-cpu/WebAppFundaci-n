import { useEffect, useState } from 'react';
import type { Registro } from '../types';
import { fmtFecha, fmtMoney, tituloEje, tituloTexto } from '../lib/format';
import { loadAdjuntos, type Adjuntos } from '../lib/storage';
import Icon from '../components/Icon';

interface Props {
  registro: Registro;
  puedeEditar: boolean;
  onCerrar: () => void;
  onEditar: () => void;
}

const cargado = (v: unknown): boolean => v !== null && v !== undefined && String(v).trim() !== '';

export default function DetalleModal({ registro: r, puedeEditar, onCerrar, onEditar }: Props) {
  const [adj, setAdj] = useState<Adjuntos>({ fotos: [], consts: [] });
  useEffect(() => { setAdj(loadAdjuntos(r.id)); }, [r.id]);

  const campos: Array<{ label: string; val: string; num?: boolean }> = [];
  const push = (label: string, val: string, num?: boolean) => { if (cargado(val)) campos.push({ label, val, num }); };
  push('Aporte', tituloTexto(r.aporte));
  push('Costo interno', cargado(r.costo) ? fmtMoney(r.costo) : '', true);
  push('Inversión (valor)', cargado(r.inversion) ? fmtMoney(r.inversion) : '', true);
  push('Horas de voluntariado', cargado(r.horas) ? `${r.horas} hs` : '', true);
  push('Contacto', tituloTexto(r.contacto));

  const hayDesc = cargado(r.motivo) || cargado(r.observaciones);

  return (
    <div className="modal-backdrop show" onClick={(e) => { if (e.target === e.currentTarget) onCerrar(); }}>
      <div className="modal detail-modal">
        <div className="detail-head">
          <div>
            <div className="detail-eyebrow">{r.tipo || 'Detalle de acción'}</div>
            <h2>{tituloTexto(r.beneficiario) || 'Sin nombre'}</h2>
            <div className="detail-meta">
              {r.eje && <span className="chip eje">{tituloEje(r.eje)}</span>}
              {r.fecha && <span className="chip">{fmtFecha(r.fecha)}</span>}
              {r.unidad && <span className="chip">{tituloTexto(r.unidad)}</span>}
            </div>
          </div>
          <button className="modal-close" onClick={onCerrar} aria-label="Cerrar">✕</button>
        </div>
        <div className="detail-body">
          <div className="detail-grid">
            {campos.map((c) => (
              <div key={c.label} className="df">
                <span className="df-label">{c.label}</span>
                <span className={'df-val' + (c.num ? ' num' : '')}>{c.val}</span>
              </div>
            ))}
          </div>
          {hayDesc && (
            <div className="detail-desc">
              {cargado(r.motivo) && (<><span className="df-label">Descripción</span>{r.motivo}</>)}
              {cargado(r.observaciones) && (
                <>
                  {cargado(r.motivo) && <div style={{ marginTop: 12 }} />}
                  <span className="df-label">Observaciones</span>{r.observaciones}
                </>
              )}
            </div>
          )}
          <div className="detail-media">
            {adj.fotos.length > 0 && (
              <div className="detail-media-section">
                <div className="detail-media-title">Fotos ({adj.fotos.length})</div>
                <div className="detail-photos">
                  {adj.fotos.map((f, i) => <img key={i} src={f.data} alt="Foto" />)}
                </div>
              </div>
            )}
            {adj.consts.length > 0 && (
              <div className="detail-media-section">
                <div className="detail-media-title">Constancia firmada</div>
                <div className="detail-const">
                  {adj.consts.map((c, i) => (
                    <a key={i} href={c.data} download={c.name || `constancia_${r.id}_${i + 1}`}>
                      <Icon name="file" size={16} />{c.name || `Constancia ${i + 1}`}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="detail-actions">
          <button className="btn secondary" onClick={onCerrar}>Cerrar</button>
          {puedeEditar && <button className="btn" onClick={onEditar}>Editar registro</button>}
        </div>
      </div>
    </div>
  );
}
