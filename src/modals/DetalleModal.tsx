import { useEffect, useState } from 'react';
import type { Registro } from '../types';
import { ESTADO_ACCION_LABEL } from '../lib/constants';
import { fmtFecha, fmtMoney, tituloEje, tituloTexto } from '../lib/format';
import Icon from '../components/Icon';

interface Props {
  registro: Registro;
  puedeEditar: boolean;
  onCerrar: () => void;
  onEditar: () => void;
}

const cargado = (v: unknown): boolean => v !== null && v !== undefined && String(v).trim() !== '';

export default function DetalleModal({ registro: r, puedeEditar, onCerrar, onEditar }: Props) {
  const fotos = r.fotos ?? [];
  const consts = r.consts ?? [];
  const [previewIdx, setPreviewIdx] = useState<number | null>(null);

  useEffect(() => {
    if (previewIdx === null) return;
    const cerrarTecla = (e: KeyboardEvent) => { if (e.key === 'Escape') setPreviewIdx(null); };
    document.addEventListener('keydown', cerrarTecla);
    return () => document.removeEventListener('keydown', cerrarTecla);
  }, [previewIdx]);

  const campos: Array<{ label: string; val: string; num?: boolean }> = [];
  const push = (label: string, val: string, num?: boolean) => { if (cargado(val)) campos.push({ label, val, num }); };
  push('Aporte', tituloTexto(r.aporte));
  push('Costo interno', cargado(r.costo) ? fmtMoney(r.costo) : '', true);
  push('Inversión (valor)', cargado(r.inversion) ? fmtMoney(r.inversion) : '', true);
  push('Horas de voluntariado', cargado(r.horas) ? `${r.horas} hs` : '', true);
  push('Contacto', tituloTexto(r.contacto));
  push('N° de certificado', r.numeroCertificado || '');
  push('N° de factura', r.numeroFactura || '');

  const hayDesc = cargado(r.motivo) || cargado(r.observaciones);

  return (
    <div className="modal-backdrop show" onClick={(e) => { if (e.target === e.currentTarget) onCerrar(); }}>
      <div className="modal detail-modal">
        <div className="detail-head">
          <div>
            <div className="detail-eyebrow">{r.tipo || 'Detalle de acción'}</div>
            <h2>{tituloTexto(r.beneficiario) || 'Sin nombre'}</h2>
            <div className="detail-meta">
              {r.estado && r.estado !== 'realizada' && (
                <span className={`chip estado-badge estado-${r.estado}`}>{ESTADO_ACCION_LABEL[r.estado]}</span>
              )}
              {r.eje && <span className="chip eje">{tituloEje(r.eje)}</span>}
              {r.ejeSecundario && <span className="chip">{tituloEje(r.ejeSecundario)}</span>}
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
            {fotos.length > 0 && (
              <div className="detail-media-section">
                <div className="detail-media-title">Fotos ({fotos.length})</div>
                <div className="detail-photos">
                  {fotos.map((f, i) => (
                    <button
                      key={i} type="button" className="foto-thumb"
                      onClick={() => setPreviewIdx(i)}
                      aria-label={`Ver vista previa de ${f.name || 'foto'}`}
                    >
                      <img src={f.url} alt={f.name || 'Foto'} />
                      {f.name && <span className="foto-name">{f.name}</span>}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {consts.length > 0 && (
              <div className="detail-media-section">
                <div className="detail-media-title">Constancia firmada</div>
                <div className="detail-const">
                  {consts.map((c, i) => (
                    <a key={i} href={c.url} target="_blank" rel="noopener noreferrer">
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

      {previewIdx !== null && fotos[previewIdx] && (
        <div className="lightbox" onClick={() => setPreviewIdx(null)}>
          <button className="lightbox-close" onClick={() => setPreviewIdx(null)} aria-label="Cerrar vista previa">✕</button>
          <img src={fotos[previewIdx].url} alt={fotos[previewIdx].name || 'Foto'} onClick={(e) => e.stopPropagation()} />
          {fotos[previewIdx].name && <div className="lightbox-caption">{fotos[previewIdx].name}</div>}
        </div>
      )}
    </div>
  );
}
