import type { Evento, EventoForm, MiembroDirectorio, Rol, UsuarioPlataforma } from '../types';
import { supabase } from './supabaseClient';

// --- Fechas ----------------------------------------------------------------
// Todo se maneja en hora local del navegador (Argentina); en la base se guarda
// como timestamptz, así que el mismo evento se ve bien desde cualquier lado.

export const isoDia = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export const fechaLocal = (iso: string, hora = '00:00'): Date => new Date(`${iso}T${hora}:00`);

export const sumarDias = (d: Date, n: number): Date => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};

export const horaTexto = (d: Date): string =>
  `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

/** Lunes de la semana de `d` (la semana arranca el lunes, como el resto del panel). */
export const inicioSemana = (d: Date): Date => {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
  return x;
};

/** ¿El evento ocupa (aunque sea en parte) el día `dia` (YYYY-MM-DD)? */
export const ocupaDia = (ev: Evento, dia: string): boolean => {
  const d0 = fechaLocal(dia).getTime();
  const d1 = sumarDias(fechaLocal(dia), 1).getTime();
  const i = new Date(ev.inicio).getTime();
  const f = new Date(ev.fin).getTime();
  // Un evento de duración cero (ej. 10:00–10:00) igual cuenta en su día.
  return i < d1 && (f > d0 || (f === i && i >= d0));
};

// --- Colores y recordatorios ----------------------------------------------

export const COLORES_EVENTO: Array<{ key: string; label: string; hex: string }> = [
  { key: 'maroon', label: 'Bordó', hex: '#6E1F32' },
  { key: 'rosa', label: 'Frambuesa', hex: '#C24B67' },
  { key: 'terracota', label: 'Terracota', hex: '#A6624B' },
  { key: 'dorado', label: 'Dorado', hex: '#B4863C' },
  { key: 'salvia', label: 'Salvia', hex: '#6B7D5A' },
  { key: 'petroleo', label: 'Petróleo', hex: '#3E6B6B' },
  { key: 'azul', label: 'Azul', hex: '#3F5F8C' },
  { key: 'grafito', label: 'Grafito', hex: '#6B6358' },
];

export const colorEvento = (key: string): string =>
  (COLORES_EVENTO.find((c) => c.key === key) ?? COLORES_EVENTO[0]).hex;

export const RECORDATORIOS_OPCIONES = [0, 10, 30, 60, 120, 1440, 2880, 10080];

export function etiquetaRecordatorio(min: number): string {
  if (min === 0) return 'En el momento';
  if (min % 10080 === 0) return min === 10080 ? '1 semana antes' : `${min / 10080} semanas antes`;
  if (min % 1440 === 0) return min === 1440 ? '1 día antes' : `${min / 1440} días antes`;
  if (min % 60 === 0) return min === 60 ? '1 hora antes' : `${min / 60} horas antes`;
  return `${min} minutos antes`;
}

// --- Formulario ------------------------------------------------------------

/** Evento nuevo: por defecto 1 hora, arrancando en la próxima media hora. */
export function formVacio(fecha?: string, hora?: string): EventoForm {
  const ahora = new Date();
  let inicio = hora;
  if (!inicio) {
    const m = ahora.getHours() * 60 + ahora.getMinutes();
    const prox = Math.min(Math.ceil((m + 1) / 30) * 30, 23 * 60);
    inicio = `${String(Math.floor(prox / 60)).padStart(2, '0')}:${String(prox % 60).padStart(2, '0')}`;
  }
  const [h, mi] = inicio.split(':').map(Number);
  const finMin = Math.min(h * 60 + mi + 60, 23 * 60 + 59);
  const dia = fecha ?? isoDia(ahora);
  return {
    editingId: null,
    titulo: '',
    descripcion: '',
    ubicacion: '',
    todoElDia: false,
    fecha: dia,
    fechaFin: dia,
    horaInicio: inicio,
    horaFin: `${String(Math.floor(finMin / 60)).padStart(2, '0')}:${String(finMin % 60).padStart(2, '0')}`,
    color: 'maroon',
    invitados: [],
    recordatorios: [1440],
  };
}

export function formDesdeEvento(ev: Evento): EventoForm {
  const i = new Date(ev.inicio);
  const f = new Date(ev.fin);
  return {
    editingId: ev.id,
    titulo: ev.titulo,
    descripcion: ev.descripcion,
    ubicacion: ev.ubicacion,
    todoElDia: ev.todoElDia,
    fecha: isoDia(i),
    // En todo el día `fin` es exclusivo: el último día es el anterior.
    fechaFin: ev.todoElDia ? isoDia(sumarDias(f, -1)) : isoDia(f),
    horaInicio: ev.todoElDia ? '09:00' : horaTexto(i),
    horaFin: ev.todoElDia ? '10:00' : horaTexto(f),
    color: ev.color,
    invitados: [...ev.invitados],
    recordatorios: [...ev.recordatorios],
  };
}

/** Valida el formulario y devuelve los errores (vacío si está todo bien). */
export function erroresForm(form: EventoForm): string[] {
  const errores: string[] = [];
  if (!form.titulo.trim()) errores.push('Poné un título al evento.');
  if (!form.fecha) errores.push('Elegí la fecha.');
  if (form.todoElDia) {
    if (form.fechaFin && form.fechaFin < form.fecha) errores.push('La fecha de fin no puede ser anterior a la de inicio.');
  } else if (form.horaInicio && form.horaFin && form.horaFin < form.horaInicio) {
    errores.push('La hora de fin no puede ser anterior a la de inicio.');
  }
  return errores;
}

export function eventoDesdeForm(form: EventoForm, id: number): Evento {
  const inicio = form.todoElDia ? fechaLocal(form.fecha) : fechaLocal(form.fecha, form.horaInicio || '00:00');
  const fin = form.todoElDia
    ? sumarDias(fechaLocal(form.fechaFin || form.fecha), 1)
    : fechaLocal(form.fecha, form.horaFin || form.horaInicio || '00:00');
  return {
    id,
    titulo: form.titulo.trim(),
    descripcion: form.descripcion.trim(),
    ubicacion: form.ubicacion.trim(),
    todoElDia: form.todoElDia,
    inicio: inicio.toISOString(),
    fin: fin.toISOString(),
    color: form.color,
    invitados: form.invitados,
    recordatorios: [...new Set(form.recordatorios)].sort((a, b) => a - b),
    registroId: null,
  };
}

// --- Distribución en la grilla de horas -------------------------------------
// Como en Google: los eventos que se pisan se reparten en columnas.

export interface BloqueDia {
  ev: Evento;
  /** Minutos desde las 00:00 del día. */
  desde: number;
  hasta: number;
  col: number;
  cols: number;
}

export function bloquesDelDia(eventos: Evento[], dia: string): BloqueDia[] {
  const d0 = fechaLocal(dia).getTime();
  const bloques = eventos
    .filter((ev) => !ev.todoElDia && ocupaDia(ev, dia))
    .map((ev) => {
      const desde = Math.max(0, (new Date(ev.inicio).getTime() - d0) / 60000);
      const hasta = Math.min(1440, (new Date(ev.fin).getTime() - d0) / 60000);
      // Duración mínima visual de 30 min para que se pueda leer y clickear.
      return { ev, desde, hasta: Math.max(hasta, desde + 30), col: 0, cols: 1 };
    })
    .sort((a, b) => a.desde - b.desde || b.hasta - a.hasta);

  // Agrupa los eventos que se pisan entre sí y asigna columnas dentro de cada grupo.
  let grupo: BloqueDia[] = [];
  let finGrupo = -1;
  const cerrar = () => {
    const cols = grupo.reduce((m, b) => Math.max(m, b.col + 1), 1);
    grupo.forEach((b) => { b.cols = cols; });
    grupo = [];
  };
  for (const b of bloques) {
    if (b.desde >= finGrupo) { cerrar(); finGrupo = -1; }
    const ocupadas = new Set(grupo.filter((o) => o.hasta > b.desde).map((o) => o.col));
    let col = 0;
    while (ocupadas.has(col)) col++;
    b.col = col;
    grupo.push(b);
    finGrupo = Math.max(finGrupo, b.hasta);
  }
  cerrar();
  return bloques;
}

// --- Persistencia ------------------------------------------------------------

const KEY_EVENTOS = 'fh_eventos';

export const loadEventos = (): Evento[] => {
  try {
    const raw = localStorage.getItem(KEY_EVENTOS);
    return raw ? (JSON.parse(raw) as Evento[]) : [];
  } catch {
    return [];
  }
};

export const saveEventos = (evs: Evento[]): void => {
  try { localStorage.setItem(KEY_EVENTOS, JSON.stringify(evs)); } catch { /* sin espacio: queda solo en memoria */ }
};

interface EventoRow {
  id: number;
  titulo: string;
  descripcion: string | null;
  ubicacion: string | null;
  todo_el_dia: boolean;
  inicio: string;
  fin: string;
  color: string;
  invitados: string[] | null;
  recordatorios: number[] | null;
  registro_id: number | null;
}

const eventoDesdeFila = (row: EventoRow): Evento => ({
  id: row.id,
  titulo: row.titulo,
  descripcion: row.descripcion ?? '',
  ubicacion: row.ubicacion ?? '',
  todoElDia: row.todo_el_dia,
  inicio: row.inicio,
  fin: row.fin,
  color: row.color,
  invitados: row.invitados ?? [],
  recordatorios: row.recordatorios ?? [],
  registroId: row.registro_id,
});

const filaDesdeEvento = (ev: Evento): Omit<EventoRow, 'id'> => ({
  titulo: ev.titulo,
  descripcion: ev.descripcion || null,
  ubicacion: ev.ubicacion || null,
  todo_el_dia: ev.todoElDia,
  inicio: ev.inicio,
  fin: ev.fin,
  color: ev.color,
  invitados: ev.invitados,
  recordatorios: ev.recordatorios,
  registro_id: ev.registroId,
});

export async function fetchEventosRemoto(): Promise<Evento[]> {
  if (!supabase) throw new Error('Supabase no está configurado.');
  const { data, error } = await supabase.from('eventos').select('*').order('inicio');
  if (error) throw error;
  return (data as EventoRow[]).map(eventoDesdeFila);
}

/** Inserta (id <= 0) o actualiza el evento y devuelve cómo quedó guardado. */
export async function guardarEventoRemoto(ev: Evento): Promise<Evento> {
  if (!supabase) throw new Error('Supabase no está configurado.');
  const fila = filaDesdeEvento(ev);
  const { data, error } = ev.id > 0
    ? await supabase.from('eventos').update(fila).eq('id', ev.id).select().single()
    : await supabase.from('eventos').insert(fila).select().single();
  if (error) throw error;
  return eventoDesdeFila(data as EventoRow);
}

export async function deleteEventoRemoto(id: number): Promise<void> {
  if (!supabase) throw new Error('Supabase no está configurado.');
  const { error } = await supabase.from('eventos').delete().eq('id', id);
  if (error) throw error;
}

export async function fetchDirectorioRemoto(): Promise<MiembroDirectorio[]> {
  if (!supabase) throw new Error('Supabase no está configurado.');
  const { data, error } = await supabase.from('directorio').select('id, nombre, email, cargo').order('nombre');
  if (error) throw error;
  return (data as Array<{ id: number; nombre: string; email: string; cargo: string | null }>)
    .map((m) => ({ ...m, cargo: m.cargo ?? '' }));
}

export async function agregarMiembroRemoto(m: Omit<MiembroDirectorio, 'id'>): Promise<MiembroDirectorio> {
  if (!supabase) throw new Error('Supabase no está configurado.');
  const { data, error } = await supabase.from('directorio')
    .insert({ nombre: m.nombre, email: m.email, cargo: m.cargo || null })
    .select('id, nombre, email, cargo').single();
  if (error) throw error;
  return { ...data, cargo: data.cargo ?? '' } as MiembroDirectorio;
}

export async function borrarMiembroRemoto(id: number): Promise<void> {
  if (!supabase) throw new Error('Supabase no está configurado.');
  const { error } = await supabase.from('directorio').delete().eq('id', id);
  if (error) throw error;
}

export async function fetchUsuariosPlataforma(): Promise<UsuarioPlataforma[]> {
  if (!supabase) throw new Error('Supabase no está configurado.');
  const { data, error } = await supabase.rpc('usuarios_plataforma');
  if (error) throw error;
  return (data as Array<{ email: string; rol: string }>).map((u) => ({ email: u.email, rol: (u.rol === 'admin' ? 'admin' : 'viewer') as Rol }));
}

/** Postgres avisa así cuando la tabla todavía no existe (falta correr la migración). */
export const faltaMigracion = (err: unknown): boolean => {
  const e = err as { code?: string; message?: string } | null;
  return e?.code === '42P01' || e?.code === 'PGRST205' || e?.code === 'PGRST202' || /does not exist|could not find/i.test(e?.message ?? '');
};
