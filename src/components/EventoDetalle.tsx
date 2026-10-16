import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { Evento } from '../types';
import { MESES } from '../lib/constants';
import { colorEvento, etiquetaRecordatorio, horaTexto, isoDia, sumarDias } from '../lib/eventos';
import Icon from './Icon';

interface Props {
  evento: Evento;
  /** Elemento clickeado: el popover se ubica al lado, como en Google Calendar. */
  ancla: DOMRect;
  puedeEditar: boolean;
  onCerrar: () => void;
  onEditar: () => void;
  onEliminar: () => void;
  onCargarRegistro: () => void;
}

const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

const fechaLarga = (d: Date) => `${DIAS[d.getDay()]} ${d.getDate()} de ${MESES[d.getMonth()].toLowerCase()}`;

function cuando(ev: Evento): string {
  const i = new Date(ev.inicio);
  const f = new Date(ev.fin);
  if (ev.todoElDia) {
    const ultimo = sumarDias(f, -1);
    return isoDia(ultimo) === isoDia(i) ? fechaLarga(i) : `${fechaLarga(i)} – ${fechaLarga(ultimo)}`;
  }
  return `${fechaLarga(i)} · ${horaTexto(i)} – ${horaTexto(f)}`;
}

const ANCHO = 360;
const MARGEN = 12;

export default function EventoDetalle({ evento, ancla, puedeEditar, onCerrar, onEditar, onEliminar, onCargarRegistro }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  // A la derecha del evento si entra; si no, a la izquierda; siempre dentro de la pantalla.
  useLayoutEffect(() => {
    const alto = ref.current?.offsetHeight ?? 240;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const ancho = Math.min(ANCHO, vw - MARGEN * 2);
    let left = ancla.right + 8;
    if (left + ancho > vw - MARGEN) left = ancla.left - ancho - 8;
    if (left < MARGEN) left = Math.max(MARGEN, (vw - ancho) / 2);
    const top = Math.min(Math.max(MARGEN, ancla.top), vh - alto - MARGEN);
    setPos({ top: Math.max(MARGEN, top), left });
  }, [ancla, evento]);

  useEffect(() => {
    const fuera = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) onCerrar(); };
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') onCerrar(); };
    // En el próximo tick, para que el mismo clic que lo abrió no lo cierre.
    const t = setTimeout(() => document.addEventListener('mousedown', fuera));
    document.addEventListener('keydown', esc);
    return () => {
      clearTimeout(t);
      document.removeEventListener('mousedown', fuera);
      document.removeEventListener('keydown', esc);
    };
  }, [onCerrar]);

  return (
    <div
      ref={ref}
      className="ev-pop"
      role="dialog"
      aria-label={evento.titulo}
      style={{ top: pos?.top ?? -9999, left: pos?.left ?? -9999, width: Math.min(ANCHO, window.innerWidth - MARGEN * 2) }}
    >
      <div className="ev-pop-tools">
        {puedeEditar && (
          <>
            <button className="icon-btn" onClick={onEditar} aria-label="Editar evento" title="Editar"><Icon name="edit" /></button>
            <button className="icon-btn" onClick={onEliminar} aria-label="Eliminar evento" title="Eliminar"><Icon name="trash" /></button>
          </>
        )}
        <button className="icon-btn" onClick={onCerrar} aria-label="Cerrar" title="Cerrar"><Icon name="close" /></button>
      </div>

      <div className="ev-pop-row">
        <span className="ev-pop-sq" style={{ background: colorEvento(evento.color) }} />
        <div>
          <div className="ev-pop-title">{evento.titulo}</div>
          <div className="ev-pop-when">{cuando(evento)}</div>
        </div>
      </div>

      {evento.ubicacion && (
        <div className="ev-pop-row"><Icon name="edit" className="icon ev-pop-icon" /><span>{evento.ubicacion}</span></div>
      )}
      {evento.descripcion && (
        <div className="ev-pop-row"><Icon name="file" className="icon ev-pop-icon" /><span className="ev-pop-desc">{evento.descripcion}</span></div>
      )}
      {evento.invitados.length > 0 && (
        <div className="ev-pop-row">
          <Icon name="users" className="icon ev-pop-icon" />
          <div>
            <div>{evento.invitados.length} invitado{evento.invitados.length === 1 ? '' : 's'}</div>
            <ul className="ev-pop-list">{evento.invitados.map((e) => <li key={e}>{e}</li>)}</ul>
          </div>
        </div>
      )}
      {evento.recordatorios.length > 0 && (
        <div className="ev-pop-row">
          <Icon name="mail" className="icon ev-pop-icon" />
          <span>{evento.recordatorios.map(etiquetaRecordatorio).join(', ')}</span>
        </div>
      )}

      {puedeEditar && (
        <div className="ev-pop-foot">
          <button className="ev-link" onClick={onCargarRegistro}>Cargar como registro de acción</button>
        </div>
      )}
    </div>
  );
}
