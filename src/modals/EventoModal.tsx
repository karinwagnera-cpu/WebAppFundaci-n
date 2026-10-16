import { useMemo, useState } from 'react';
import type { Evento, EventoForm, MiembroDirectorio, UsuarioPlataforma } from '../types';
import {
  COLORES_EVENTO, RECORDATORIOS_OPCIONES, etiquetaRecordatorio, formDesdeEvento, formVacio,
} from '../lib/eventos';
import Icon from '../components/Icon';

interface Props {
  evento: Evento | null;
  fechaInicial?: string;
  horaInicial?: string;
  usuarios: UsuarioPlataforma[];
  directorio: MiembroDirectorio[];
  onGuardar: (form: EventoForm) => void | Promise<void>;
  onEliminar: (id: number) => void;
  onCargarRegistro: (fecha: string) => void;
  onCerrar: () => void;
}

interface Contacto { email: string; nombre: string; grupo: 'Usuarios de la plataforma' | 'Directorio' }

export default function EventoModal({
  evento, fechaInicial, horaInicial, usuarios, directorio, onGuardar, onEliminar, onCargarRegistro, onCerrar,
}: Props) {
  const [form, setForm] = useState<EventoForm>(() => (evento ? formDesdeEvento(evento) : formVacio(fechaInicial, horaInicial)));
  const [guardando, setGuardando] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [listaAbierta, setListaAbierta] = useState(false);
  const set = <K extends keyof EventoForm>(key: K, value: EventoForm[K]) => setForm((f) => ({ ...f, [key]: value }));

  const contactos = useMemo<Contacto[]>(() => {
    const vistos = new Set<string>();
    const lista: Contacto[] = [];
    directorio.forEach((m) => {
      const email = m.email.toLowerCase();
      if (vistos.has(email)) return;
      vistos.add(email);
      lista.push({ email, nombre: m.cargo ? `${m.nombre} · ${m.cargo}` : m.nombre, grupo: 'Directorio' });
    });
    usuarios.forEach((u) => {
      const email = u.email.toLowerCase();
      if (vistos.has(email)) return;
      vistos.add(email);
      lista.push({ email, nombre: email, grupo: 'Usuarios de la plataforma' });
    });
    return lista;
  }, [usuarios, directorio]);

  const nombreDe = (email: string) => contactos.find((c) => c.email === email)?.nombre.split(' · ')[0] ?? email;

  const sugerencias = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return contactos.filter((c) => !form.invitados.includes(c.email) && (!q || c.email.includes(q) || c.nombre.toLowerCase().includes(q)));
  }, [contactos, busqueda, form.invitados]);

  const invitar = (email: string) => { set('invitados', [...form.invitados, email]); setBusqueda(''); };
  const quitar = (email: string) => set('invitados', form.invitados.filter((e) => e !== email));
  const invitarTodos = (grupo: Contacto['grupo']) =>
    set('invitados', [...new Set([...form.invitados, ...contactos.filter((c) => c.grupo === grupo).map((c) => c.email)])]);

  const cambiarAviso = (i: number, min: number) => set('recordatorios', form.recordatorios.map((r, j) => (j === i ? min : r)));
  const quitarAviso = (i: number) => set('recordatorios', form.recordatorios.filter((_, j) => j !== i));
  const agregarAviso = () => {
    const libre = RECORDATORIOS_OPCIONES.find((m) => !form.recordatorios.includes(m)) ?? 60;
    set('recordatorios', [...form.recordatorios, libre]);
  };

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    try { await onGuardar(form); } finally { setGuardando(false); }
  };

  const grupos: Contacto['grupo'][] = ['Directorio', 'Usuarios de la plataforma'];

  return (
    <div className="modal-backdrop show" onClick={(e) => { if (e.target === e.currentTarget) onCerrar(); }}>
      <div className="modal ev-modal">
        <form onSubmit={enviar}>
          <div className="ev-title-row">
            <span className="ev-color-dot" style={{ background: COLORES_EVENTO.find((c) => c.key === form.color)?.hex }} />
            <input
              className="ev-title-input" type="text" placeholder="Agregá un título" autoFocus
              value={form.titulo} onChange={(e) => set('titulo', e.target.value)} aria-label="Título"
            />
            <button type="button" className="icon-btn" onClick={onCerrar} aria-label="Cerrar"><Icon name="close" /></button>
          </div>

          <div className="ev-row">
            <Icon name="clock" className="icon ev-row-icon" />
            <div className="ev-when">
              <input type="date" value={form.fecha} aria-label="Fecha"
                onChange={(e) => setForm((f) => ({ ...f, fecha: e.target.value, fechaFin: f.fechaFin < e.target.value ? e.target.value : f.fechaFin }))} />
              {form.todoElDia ? (
                <>
                  <span className="ev-sep">hasta</span>
                  <input type="date" value={form.fechaFin} min={form.fecha} aria-label="Fecha de fin" onChange={(e) => set('fechaFin', e.target.value)} />
                </>
              ) : (
                <>
                  <input type="time" step={900} value={form.horaInicio} aria-label="Hora de inicio" onChange={(e) => set('horaInicio', e.target.value)} />
                  <span className="ev-sep">–</span>
                  <input type="time" step={900} value={form.horaFin} aria-label="Hora de fin" onChange={(e) => set('horaFin', e.target.value)} />
                </>
              )}
              <label className="ev-check">
                <input type="checkbox" checked={form.todoElDia} onChange={(e) => set('todoElDia', e.target.checked)} /> Todo el día
              </label>
            </div>
          </div>

          <div className="ev-row">
            <Icon name="users" className="icon ev-row-icon" />
            <div className="ev-invitados">
              {form.invitados.length > 0 && (
                <div className="ev-chips">
                  {form.invitados.map((email) => (
                    <span key={email} className="ev-chip" title={email}>
                      {nombreDe(email)}
                      <button type="button" onClick={() => quitar(email)} aria-label={`Quitar a ${email}`}>×</button>
                    </span>
                  ))}
                </div>
              )}
              <div className="ev-picker">
                <input
                  type="text" placeholder="Agregar invitados" value={busqueda}
                  onChange={(e) => { setBusqueda(e.target.value); setListaAbierta(true); }}
                  onFocus={() => setListaAbierta(true)}
                  onBlur={() => setTimeout(() => setListaAbierta(false), 150)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); if (sugerencias[0]) invitar(sugerencias[0].email); } }}
                />
                {listaAbierta && (
                  <div className="ev-sugerencias">
                    {contactos.length === 0 && (
                      <div className="ev-sug-vacio">No hay contactos cargados. Agregá miembros del directorio en Configuración.</div>
                    )}
                    {grupos.map((g) => {
                      const items = sugerencias.filter((c) => c.grupo === g);
                      if (!items.length) return null;
                      return (
                        <div key={g}>
                          <div className="ev-sug-grupo">
                            {g}
                            <button type="button" onMouseDown={(e) => { e.preventDefault(); invitarTodos(g); }}>Invitar a todos</button>
                          </div>
                          {items.map((c) => (
                            <button type="button" key={c.email} className="ev-sug" onMouseDown={(e) => { e.preventDefault(); invitar(c.email); }}>
                              <span className="ev-sug-avatar">{c.nombre.charAt(0).toUpperCase()}</span>
                              <span className="ev-sug-text">
                                <span>{c.nombre}</span>
                                {c.nombre !== c.email && <small>{c.email}</small>}
                              </span>
                            </button>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="ev-row">
            <Icon name="mail" className="icon ev-row-icon" />
            <div className="ev-avisos">
              {form.recordatorios.map((min, i) => (
                <div key={i} className="ev-aviso">
                  <span>Aviso por mail</span>
                  <select value={min} onChange={(e) => cambiarAviso(i, Number(e.target.value))}>
                    {RECORDATORIOS_OPCIONES.map((m) => <option key={m} value={m}>{etiquetaRecordatorio(m)}</option>)}
                  </select>
                  <button type="button" className="ev-x" onClick={() => quitarAviso(i)} aria-label="Quitar aviso">×</button>
                </div>
              ))}
              <button type="button" className="ev-link" onClick={agregarAviso}>Agregar aviso</button>
              {form.recordatorios.length > 0 && form.invitados.length === 0 && (
                <div className="ev-hint">Sin invitados no le llega el aviso a nadie.</div>
              )}
            </div>
          </div>

          <div className="ev-row">
            <Icon name="edit" className="icon ev-row-icon" />
            <div className="ev-grow">
              <input type="text" placeholder="Agregar ubicación" value={form.ubicacion} onChange={(e) => set('ubicacion', e.target.value)} />
              <textarea rows={3} placeholder="Agregar descripción" value={form.descripcion} onChange={(e) => set('descripcion', e.target.value)} />
            </div>
          </div>

          <div className="ev-row">
            <span className="ev-row-icon" />
            <div className="ev-colores" role="radiogroup" aria-label="Color">
              {COLORES_EVENTO.map((c) => (
                <button
                  key={c.key} type="button" role="radio" aria-checked={form.color === c.key} title={c.label}
                  className={'ev-swatch' + (form.color === c.key ? ' on' : '')} style={{ background: c.hex }}
                  onClick={() => set('color', c.key)}
                />
              ))}
            </div>
          </div>

          <div className="modal-actions">
            {form.editingId ? (
              <button type="button" className="btn danger" style={{ marginRight: 'auto' }} onClick={() => onEliminar(form.editingId!)}>
                Eliminar
              </button>
            ) : (
              <button type="button" className="ev-link" style={{ marginRight: 'auto' }} onClick={() => onCargarRegistro(form.fecha)}>
                ¿Es una acción ya realizada? Cargala como registro
              </button>
            )}
            <button type="button" className="btn secondary" onClick={onCerrar} disabled={guardando}>Cancelar</button>
            <button type="submit" className="btn" disabled={guardando}>{guardando ? 'Guardando…' : 'Guardar'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
