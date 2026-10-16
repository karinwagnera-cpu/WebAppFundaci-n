import { useEffect, useMemo, useRef, useState } from 'react';
import type { Evento, Registro } from '../types';
import { LEYENDA, MESES } from '../lib/constants';
import { ejeClase, tituloEje, tituloTexto } from '../lib/format';
import {
  bloquesDelDia, colorEvento, fechaLocal, horaTexto, inicioSemana, isoDia, ocupaDia, sumarDias,
} from '../lib/eventos';
import Icon from '../components/Icon';
import EventoDetalle from '../components/EventoDetalle';

interface Props {
  registros: Registro[];
  eventos: Evento[];
  puedeEditar: boolean;
  /** Mensaje cuando la agenda no está disponible (ej. falta crear la tabla en Supabase). */
  avisoAgenda: string | null;
  onVer: (id: number) => void;
  onNuevoEvento: (fecha: string, hora?: string) => void;
  onEditarEvento: (ev: Evento) => void;
  onEliminarEvento: (id: number) => void;
  onCargarRegistro: (fecha: string) => void;
}

type Modo = 'dia' | 'semana' | 'mes' | 'agenda';

const MODOS: Array<{ key: Modo; label: string }> = [
  { key: 'dia', label: 'Día' },
  { key: 'semana', label: 'Semana' },
  { key: 'mes', label: 'Mes' },
  { key: 'agenda', label: 'Agenda' },
];

const DIAS_CORTOS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const DIAS_LARGOS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const HORA_PX = 48;
const KEY_MODO = 'fh_cal_modo';

const leerModo = (): Modo => {
  try {
    const m = localStorage.getItem(KEY_MODO);
    if (m === 'dia' || m === 'semana' || m === 'mes' || m === 'agenda') return m;
  } catch { /* sin preferencia guardada */ }
  // En el celular la semana queda muy apretada: arranca en el día, como Google.
  return window.innerWidth < 700 ? 'dia' : 'semana';
};

const mesCorto = (m: number) => MESES[m].slice(0, 3).toLowerCase();

const tituloRegistro = (r: Registro) => tituloTexto(r.beneficiario) || 'Acción';

const rangoHoras = (ev: Evento) => `${horaTexto(new Date(ev.inicio))} – ${horaTexto(new Date(ev.fin))}`;

export default function Calendario({
  registros, eventos, puedeEditar, avisoAgenda, onVer, onNuevoEvento, onEditarEvento, onEliminarEvento, onCargarRegistro,
}: Props) {
  const [cursor, setCursor] = useState(() => new Date());
  const [modo, setModoState] = useState<Modo>(leerModo);
  const [detalle, setDetalle] = useState<{ ev: Evento; rect: DOMRect } | null>(null);

  const setModo = (m: Modo) => {
    setModoState(m);
    try { localStorage.setItem(KEY_MODO, m); } catch { /* preferencia opcional */ }
  };

  const hoy = isoDia(new Date());
  const year = cursor.getFullYear();
  const month = cursor.getMonth();

  const registrosPorDia = useMemo(() => {
    const map = new Map<string, Registro[]>();
    registros.forEach((r) => {
      if (!r.fecha) return;
      const arr = map.get(r.fecha) || [];
      arr.push(r);
      map.set(r.fecha, arr);
    });
    return map;
  }, [registros]);

  const eventosDe = (dia: string) =>
    eventos.filter((ev) => ocupaDia(ev, dia)).sort((a, b) => Number(b.todoElDia) - Number(a.todoElDia) || a.inicio.localeCompare(b.inicio));

  // Si el evento abierto se editó o borró, el detalle tiene que reflejarlo.
  useEffect(() => {
    if (!detalle) return;
    const actual = eventos.find((e) => e.id === detalle.ev.id);
    if (!actual) setDetalle(null);
    else if (actual !== detalle.ev) setDetalle({ ev: actual, rect: detalle.rect });
  }, [eventos, detalle]);

  const abrirEvento = (ev: Evento, e: React.MouseEvent) => {
    e.stopPropagation();
    setDetalle({ ev, rect: (e.currentTarget as HTMLElement).getBoundingClientRect() });
  };

  const mover = (n: number) => {
    if (modo === 'dia') setCursor((c) => sumarDias(c, n));
    else if (modo === 'semana') setCursor((c) => sumarDias(c, 7 * n));
    else setCursor(new Date(year, month + n, 1));
  };

  const irADia = (dia: string) => { setCursor(fechaLocal(dia)); setModo('dia'); };

  const titulo = useMemo(() => {
    if (modo === 'dia') {
      return `${DIAS_LARGOS[cursor.getDay()]} ${cursor.getDate()} de ${MESES[month].toLowerCase()} de ${year}`;
    }
    if (modo === 'semana') {
      const ini = inicioSemana(cursor);
      const fin = sumarDias(ini, 6);
      if (ini.getMonth() === fin.getMonth()) return `${MESES[ini.getMonth()]} ${ini.getFullYear()}`;
      return ini.getFullYear() === fin.getFullYear()
        ? `${mesCorto(ini.getMonth())} – ${mesCorto(fin.getMonth())} ${fin.getFullYear()}`
        : `${mesCorto(ini.getMonth())} ${ini.getFullYear()} – ${mesCorto(fin.getMonth())} ${fin.getFullYear()}`;
    }
    return `${MESES[month]} ${year}`;
  }, [modo, cursor, month, year]);

  const dias = useMemo(() => {
    if (modo === 'dia') return [isoDia(cursor)];
    const ini = inicioSemana(cursor);
    return Array.from({ length: 7 }, (_, i) => isoDia(sumarDias(ini, i)));
  }, [modo, cursor]);

  return (
    <section className={'view active' + (modo !== 'agenda' ? ' cal-fit' : '')}>
      <div className="cal-toolbar">
        <div className="cal-nav">
          {puedeEditar && (
            <button className="btn cal-crear" onClick={() => onNuevoEvento(modo === 'dia' ? isoDia(cursor) : hoy)}>
              <Icon name="plus" /> Crear
            </button>
          )}
          <button className="btn secondary small" onClick={() => setCursor(new Date())}>Hoy</button>
          <button className="icon-btn cal-prev" onClick={() => mover(-1)} aria-label="Anterior"><Icon name="chevronLeft" size={20} /></button>
          <button className="icon-btn cal-next" onClick={() => mover(1)} aria-label="Siguiente"><Icon name="chevronRight" size={20} /></button>
          <h2 className={'cal-period' + (modo === 'dia' ? ' sin-cap' : '')}>{titulo}</h2>
        </div>
        <div className="cal-viewtoggle">
          {MODOS.map((m) => (
            <button key={m.key} className={'cal-vt' + (modo === m.key ? ' active' : '')} onClick={() => setModo(m.key)}>{m.label}</button>
          ))}
        </div>
      </div>

      {avisoAgenda && <div className="cal-aviso">{avisoAgenda}</div>}

      {(modo === 'dia' || modo === 'semana') && (
        <GrillaHoras
          dias={dias}
          hoy={hoy}
          registrosPorDia={registrosPorDia}
          eventos={eventos}
          puedeEditar={puedeEditar}
          onVer={onVer}
          onAbrirEvento={abrirEvento}
          onNuevoEvento={onNuevoEvento}
          onIrADia={irADia}
        />
      )}

      {modo === 'mes' && (
        <VistaMes
          year={year}
          month={month}
          hoy={hoy}
          registrosPorDia={registrosPorDia}
          eventosDe={eventosDe}
          puedeEditar={puedeEditar}
          onVer={onVer}
          onAbrirEvento={abrirEvento}
          onNuevoEvento={onNuevoEvento}
          onIrADia={irADia}
        />
      )}

      {modo === 'agenda' && (
        <VistaAgenda
          year={year}
          month={month}
          hoy={hoy}
          registrosPorDia={registrosPorDia}
          eventosDe={eventosDe}
          onVer={onVer}
          onAbrirEvento={abrirEvento}
        />
      )}

      {detalle && (
        <EventoDetalle
          evento={detalle.ev}
          ancla={detalle.rect}
          puedeEditar={puedeEditar}
          onCerrar={() => setDetalle(null)}
          onEditar={() => { onEditarEvento(detalle.ev); setDetalle(null); }}
          onEliminar={() => onEliminarEvento(detalle.ev.id)}
          onCargarRegistro={() => { onCargarRegistro(isoDia(new Date(detalle.ev.inicio))); setDetalle(null); }}
        />
      )}
    </section>
  );
}

// --- Día / Semana ------------------------------------------------------------

interface GrillaProps {
  dias: string[];
  hoy: string;
  registrosPorDia: Map<string, Registro[]>;
  eventos: Evento[];
  puedeEditar: boolean;
  onVer: (id: number) => void;
  onAbrirEvento: (ev: Evento, e: React.MouseEvent) => void;
  onNuevoEvento: (fecha: string, hora?: string) => void;
  onIrADia: (dia: string) => void;
}

function GrillaHoras({ dias, hoy, registrosPorDia, eventos, puedeEditar, onVer, onAbrirEvento, onNuevoEvento, onIrADia }: GrillaProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [ahora, setAhora] = useState(() => new Date());

  useEffect(() => {
    const t = setInterval(() => setAhora(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);

  // Al entrar, arranca mostrando la mañana (o una hora antes de ahora, si es más tarde).
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const h = new Date().getHours();
    // -10px para que la etiqueta de la primera hora no quede cortada arriba.
    el.scrollTop = (h >= 9 ? h - 1 : 7.5) * HORA_PX - 10;
  }, [dias.length]);

  const minutosAhora = ahora.getHours() * 60 + ahora.getMinutes();
  const todoElDia = dias.map((d) => ({
    regs: registrosPorDia.get(d) || [],
    evs: eventos.filter((ev) => ev.todoElDia && ocupaDia(ev, d)),
  }));
  const maxFilas = Math.max(0, ...todoElDia.map((x) => x.regs.length + x.evs.length));
  const LIMITE = 3;

  const clickHueco = (dia: string, e: React.MouseEvent<HTMLDivElement>) => {
    if (!puedeEditar || e.target !== e.currentTarget) return;
    const y = e.nativeEvent.offsetY;
    const min = Math.min(Math.floor((y / HORA_PX) * 2) * 30, 23 * 60);
    onNuevoEvento(dia, `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`);
  };

  return (
    <div className={'cal-tg' + (dias.length === 1 ? ' un-dia' : '')} style={{ ['--cols' as string]: dias.length }}>
      <div className="cal-tg-head">
        <div className="cal-tg-gutter" />
        {dias.map((d) => {
          const f = fechaLocal(d);
          return (
            <button key={d} className={'cal-tg-day' + (d === hoy ? ' today' : '')} onClick={() => onIrADia(d)}>
              <span className="dow">{DIAS_CORTOS[(f.getDay() + 6) % 7]}</span>
              <span className="num">{f.getDate()}</span>
            </button>
          );
        })}
      </div>

      {maxFilas > 0 && (
        <div className="cal-tg-allday">
          <div className="cal-tg-gutter"><span>Todo el día</span></div>
          {dias.map((d, i) => {
            const { regs, evs } = todoElDia[i];
            const items = [
              ...evs.map((ev) => (
                <span key={'e' + ev.id} className="cal-ev" style={{ background: colorEvento(ev.color) }} onClick={(e) => onAbrirEvento(ev, e)} title={ev.titulo}>
                  {ev.titulo}
                </span>
              )),
              ...regs.map((r) => (
                <span key={'r' + r.id} className={`cal-ev reg ${ejeClase(r.eje)}`} onClick={() => onVer(r.id)} title={r.beneficiario || ''}>
                  {tituloRegistro(r)}
                </span>
              )),
            ];
            return (
              <div key={d} className="cal-tg-allday-cell">
                {items.slice(0, LIMITE)}
                {items.length > LIMITE && (
                  <span className="cal-more" onClick={() => onIrADia(d)}>+{items.length - LIMITE} más</span>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="cal-tg-scroll" ref={scrollRef}>
        <div className="cal-tg-body" style={{ height: 24 * HORA_PX }}>
          <div className="cal-tg-gutter">
            {Array.from({ length: 24 }, (_, h) => (
              <span key={h} className="cal-tg-hour" style={{ top: h * HORA_PX }}>{h === 0 ? '' : `${String(h).padStart(2, '0')}:00`}</span>
            ))}
          </div>
          {dias.map((d) => (
            <div
              key={d}
              className={'cal-tg-col' + (puedeEditar ? ' clickable' : '') + (d === hoy ? ' today' : '')}
              onClick={(e) => clickHueco(d, e)}
              title={puedeEditar ? 'Crear un evento a esta hora' : undefined}
            >
              {bloquesDelDia(eventos, d).map((b) => {
                const alto = ((b.hasta - b.desde) / 60) * HORA_PX - 2;
                return (
                  <div
                    key={b.ev.id}
                    className={'cal-tg-ev' + (alto < 34 ? ' corto' : '')}
                    style={{
                      top: (b.desde / 60) * HORA_PX,
                      height: alto,
                      left: `calc(${(b.col / b.cols) * 100}% + 1px)`,
                      width: `calc(${100 / b.cols}% - 3px)`,
                      background: colorEvento(b.ev.color),
                    }}
                    onClick={(e) => onAbrirEvento(b.ev, e)}
                    title={`${b.ev.titulo} · ${rangoHoras(b.ev)}`}
                  >
                    <span className="t">{b.ev.titulo}</span>
                    <span className="h">{rangoHoras(b.ev)}</span>
                  </div>
                );
              })}
              {d === hoy && (
                <div className="cal-now" style={{ top: (minutosAhora / 60) * HORA_PX }} />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// --- Mes ---------------------------------------------------------------------

interface MesProps {
  year: number;
  month: number;
  hoy: string;
  registrosPorDia: Map<string, Registro[]>;
  eventosDe: (dia: string) => Evento[];
  puedeEditar: boolean;
  onVer: (id: number) => void;
  onAbrirEvento: (ev: Evento, e: React.MouseEvent) => void;
  onNuevoEvento: (fecha: string, hora?: string) => void;
  onIrADia: (dia: string) => void;
}

function VistaMes({ year, month, hoy, registrosPorDia, eventosDe, puedeEditar, onVer, onAbrirEvento, onNuevoEvento, onIrADia }: MesProps) {
  const primero = new Date(year, month, 1);
  const offset = (primero.getDay() + 6) % 7;
  const diasEnMes = new Date(year, month + 1, 0).getDate();
  const semanas = Math.ceil((offset + diasEnMes) / 7);
  const inicio = new Date(year, month, 1 - offset);
  const celdas = Array.from({ length: semanas * 7 }, (_, i) => {
    const d = sumarDias(inicio, i);
    const iso = isoDia(d);
    return { iso, dia: d.getDate(), otro: d.getMonth() !== month, regs: registrosPorDia.get(iso) || [], evs: eventosDe(iso) };
  });
  const LIMITE = 3;

  return (
    <div className="cal-month">
      <div className="cal-weekdays">
        {DIAS_CORTOS.map((d) => <span key={d}>{d}</span>)}
      </div>
      <div className="cal-grid" style={{ gridTemplateRows: `repeat(${semanas}, 1fr)` }}>
        {celdas.map((c) => {
          const items = [
            ...c.evs.map((ev) => ev.todoElDia ? (
              <span key={'e' + ev.id} className="cal-ev" style={{ background: colorEvento(ev.color) }} title={ev.titulo} onClick={(e) => onAbrirEvento(ev, e)}>
                {ev.titulo}
              </span>
            ) : (
              <span key={'e' + ev.id} className="cal-ev-timed" title={`${ev.titulo} · ${rangoHoras(ev)}`} onClick={(e) => onAbrirEvento(ev, e)}>
                <span className="dot" style={{ background: colorEvento(ev.color) }} />
                <span className="h">{horaTexto(new Date(ev.inicio))}</span>
                <span className="t">{ev.titulo}</span>
              </span>
            )),
            ...c.regs.map((r) => (
              <span key={'r' + r.id} className={`cal-ev reg ${ejeClase(r.eje)}`} title={r.beneficiario || ''} onClick={(e) => { e.stopPropagation(); onVer(r.id); }}>
                {tituloRegistro(r)}
              </span>
            )),
          ];
          return (
            <div
              key={c.iso}
              className={'cal-cell' + (c.otro ? ' other' : '') + (c.iso === hoy ? ' today' : '') + (items.length ? ' has-ev' : '') + (puedeEditar ? ' clickable' : '')}
              onClick={() => { if (puedeEditar) onNuevoEvento(c.iso); }}
              title={puedeEditar ? 'Crear un evento en esta fecha' : undefined}
            >
              <button className="cal-daynum" onClick={(e) => { e.stopPropagation(); onIrADia(c.iso); }}>{c.dia}</button>
              {items.slice(0, LIMITE)}
              {items.length > LIMITE && (
                <span className="cal-more" onClick={(e) => { e.stopPropagation(); onIrADia(c.iso); }}>+{items.length - LIMITE} más</span>
              )}
            </div>
          );
        })}
      </div>
      <div className="cal-legend">
        {LEYENDA.map((l) => (
          <span key={l.clase} className="lg"><span className={`sw ${l.clase}`} />{l.label}</span>
        ))}
      </div>
    </div>
  );
}

// --- Agenda ------------------------------------------------------------------

interface AgendaProps {
  year: number;
  month: number;
  hoy: string;
  registrosPorDia: Map<string, Registro[]>;
  eventosDe: (dia: string) => Evento[];
  onVer: (id: number) => void;
  onAbrirEvento: (ev: Evento, e: React.MouseEvent) => void;
}

function VistaAgenda({ year, month, hoy, registrosPorDia, eventosDe, onVer, onAbrirEvento }: AgendaProps) {
  const diasEnMes = new Date(year, month + 1, 0).getDate();
  const dias = Array.from({ length: diasEnMes }, (_, i) => isoDia(new Date(year, month, i + 1)))
    .map((iso) => ({ iso, evs: eventosDe(iso), regs: registrosPorDia.get(iso) || [] }))
    .filter((d) => d.evs.length || d.regs.length);

  if (!dias.length) {
    return (
      <div className="cal-agenda-empty">
        No hay eventos ni acciones en {MESES[month]} de {year}.<br />Usá las flechas para navegar a otro mes.
      </div>
    );
  }

  return (
    <div className="cal-sched">
      {dias.map(({ iso, evs, regs }) => {
        const f = fechaLocal(iso);
        return (
          <div key={iso} className={'cal-sched-day' + (iso === hoy ? ' today' : '')}>
            <div className="cal-sched-date">
              <span className="num">{f.getDate()}</span>
              <span className="lbl">{DIAS_CORTOS[(f.getDay() + 6) % 7]}, {mesCorto(f.getMonth())}</span>
            </div>
            <div className="cal-sched-items">
              {evs.map((ev) => (
                <button key={'e' + ev.id} className="cal-sched-item" onClick={(e) => onAbrirEvento(ev, e)}>
                  <span className="dot" style={{ background: colorEvento(ev.color) }} />
                  <span className="hora">{ev.todoElDia ? 'Todo el día' : rangoHoras(ev)}</span>
                  <span className="tit">{ev.titulo}</span>
                </button>
              ))}
              {regs.map((r) => (
                <button key={'r' + r.id} className="cal-sched-item" onClick={() => onVer(r.id)}>
                  <span className={`dot ${ejeClase(r.eje)}`} />
                  <span className="hora">Acción</span>
                  <span className="tit">
                    {tituloRegistro(r)}
                    {r.eje && <small> · {tituloEje(r.eje)}</small>}
                  </span>
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
