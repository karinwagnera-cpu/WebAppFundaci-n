import { useMemo, useState } from 'react';
import type { Registro } from '../types';
import { LEYENDA, MESES } from '../lib/constants';
import { ejeClase, tituloEje, tituloTexto } from '../lib/format';
import Icon from '../components/Icon';

interface Props {
  registros: Registro[];
  onVer: (id: number) => void;
}

type Modo = 'month' | 'agenda';

export default function Calendario({ registros, onVer }: Props) {
  const [cursor, setCursor] = useState(() => new Date());
  const [modo, setModo] = useState<Modo>('month');

  const year = cursor.getFullYear();
  const month = cursor.getMonth();

  const porDia = useMemo(() => {
    const map = new Map<string, Registro[]>();
    registros.forEach((r) => {
      if (!r.fecha) return;
      const arr = map.get(r.fecha) || [];
      arr.push(r);
      map.set(r.fecha, arr);
    });
    return map;
  }, [registros]);

  const celdas = useMemo(() => {
    const primero = new Date(year, month, 1);
    const offset = (primero.getDay() + 6) % 7;
    const inicio = new Date(year, month, 1 - offset);
    const hoyISO = new Date().toISOString().slice(0, 10);
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(inicio);
      d.setDate(inicio.getDate() + i);
      const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      return { iso, dia: d.getDate(), otro: d.getMonth() !== month, hoy: iso === hoyISO, eventos: porDia.get(iso) || [] };
    });
  }, [year, month, porDia]);

  const delMes = useMemo(
    () => registros
      .filter((r) => r.fecha && r.fecha.slice(0, 7) === `${year}-${String(month + 1).padStart(2, '0')}`)
      .sort((a, b) => a.fecha!.localeCompare(b.fecha!)),
    [registros, year, month]
  );

  const mover = (n: number) => setCursor(new Date(year, month + n, 1));

  return (
    <section className="view active">
      <div className="cal-toolbar">
        <div className="cal-nav">
          <button className="icon-btn cal-prev" onClick={() => mover(-1)} aria-label="Anterior"><Icon name="chevronLeft" size={20} /></button>
          <h2 className="cal-period">{MESES[month]} {year}</h2>
          <button className="icon-btn cal-next" onClick={() => mover(1)} aria-label="Siguiente"><Icon name="chevronRight" size={20} /></button>
          <button className="btn secondary small" onClick={() => setCursor(new Date())}>Hoy</button>
        </div>
        <div className="cal-viewtoggle">
          <button className={'cal-vt' + (modo === 'month' ? ' active' : '')} onClick={() => setModo('month')}>Mes</button>
          <button className={'cal-vt' + (modo === 'agenda' ? ' active' : '')} onClick={() => setModo('agenda')}>Agenda</button>
        </div>
      </div>

      {modo === 'month' ? (
        <div className="cal-month">
          <div className="cal-weekdays">
            {['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'].map((d) => <span key={d}>{d}</span>)}
          </div>
          <div className="cal-grid">
            {celdas.map((c) => (
              <div
                key={c.iso}
                className={'cal-cell' + (c.otro ? ' other' : '') + (c.hoy ? ' today' : '') + (c.eventos.length ? ' has-ev' : '')}
              >
                <span className="cal-daynum">{c.dia}</span>
                {c.eventos.slice(0, 3).map((r) => (
                  <span
                    key={r.id}
                    className={`cal-ev ${ejeClase(r.eje)}`}
                    title={r.beneficiario || ''}
                    onClick={() => onVer(r.id)}
                  >
                    {tituloTexto(r.beneficiario) || 'Acción'}
                  </span>
                ))}
                {c.eventos.length > 3 && (
                  <span className="cal-more" onClick={() => setModo('agenda')}>+{c.eventos.length - 3} más</span>
                )}
              </div>
            ))}
          </div>
          <div className="cal-legend">
            {LEYENDA.map((l) => (
              <span key={l.clase} className="lg"><span className={`sw ${l.clase}`} />{l.label}</span>
            ))}
          </div>
        </div>
      ) : (
        <div className="cal-agenda">
          {delMes.length === 0 ? (
            <div className="cal-agenda-empty">
              No hay acciones registradas en {MESES[month]} de {year}.<br />Usá las flechas para navegar a otro mes.
            </div>
          ) : (
            delMes.map((r) => {
              const d = new Date(r.fecha + 'T00:00:00');
              return (
                <div key={r.id} className="cal-agenda-item" onClick={() => onVer(r.id)}>
                  <div className="cal-agenda-date">
                    <span className="d">{d.getDate()}</span>
                    <span className="m">{MESES[d.getMonth()].slice(0, 3)}</span>
                  </div>
                  <div className="cal-agenda-body">
                    <span className="ab-benef">{tituloTexto(r.beneficiario) || 'Acción'}</span>
                    {r.aporte && <span className="ab-aporte">{tituloTexto(r.aporte)}</span>}
                    <div className="ab-tags">
                      {r.eje && <span className={`ab-eje ${ejeClase(r.eje)}`}>{tituloEje(r.eje)}</span>}
                      {r.unidad && <span className="ab-eje eje-otro">{tituloTexto(r.unidad)}</span>}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </section>
  );
}
