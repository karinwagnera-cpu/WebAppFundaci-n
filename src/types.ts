export type Vista = 'dashboard' | 'registro' | 'campanas' | 'calendario' | 'analitica' | 'documentacion' | 'configuracion';
export type Rol = 'admin' | 'viewer';
export type Tema = 'light' | 'dark';
export type EstadoCampania = 'planificada' | 'activa' | 'finalizada';
export type EstadoAccion = 'planificada' | 'realizada' | 'cancelada';

export interface Registro {
  id: number;
  fecha: string | null;
  tipo: string | null;
  eje: string | null;
  ejeSecundario?: string | null;
  unidad: string | null;
  beneficiario: string | null;
  aporte?: string | null;
  motivo?: string | null;
  costo?: number | null;
  contacto?: string | null;
  constancia?: string | null;
  observaciones?: string | null;
  difusion?: string | null;
  horas?: number | null;
  inversion?: number | null;
  numeroCertificado?: string | null;
  numeroFactura?: string | null;
  estado?: EstadoAccion | null;
  /**
   * Renglones de aporte de la acción (unidad, tipo, montos…). Vacío en los
   * registros cargados antes de que existiera; en ese caso se arman a partir de
   * los campos sueltos (unidad, costo, etc.), que además se siguen guardando con
   * los totales para que versiones viejas de la app y los exportes sigan andando.
   */
  aportes?: Aporte[];
  fotos?: Adjunto[];
  consts?: Adjunto[];
  fotosCount?: number;
  tieneFotos?: boolean;
  constanciaCount?: number;
  tieneConstancia?: boolean;
}

/** Filtro compartido por Dashboard, Registro e Informes. */
export interface Filtro {
  y: string[];
  m: string[];
  e: string;
  /** Rango personalizado (YYYY-MM-DD), opcional. */
  desde: string;
  hasta: string;
}

export interface Adjunto {
  name: string;
  type: string;
  size: number;
  url: string;
  path: string;
}

export interface DocMeta {
  id: number;
  nombre: string;
  categoria: string;
  fecha: string | null;
  notas: string;
  tipo: string;
  size: number;
  url: string;
  path: string;
}

/** Un renglón de aporte dentro de una acción (por ejemplo, los desayunos de una unidad de negocio). */
export interface Aporte {
  unidad: string;
  tipo: string;
  descripcion: string;
  costo: number | null;
  inversion: number | null;
  horas: number | null;
  numeroCertificado: string | null;
  numeroFactura: string | null;
}

/** Aporte tal como se edita en el formulario (los números como texto). */
export interface AporteForm {
  unidad: string;
  tipo: string;
  descripcion: string;
  costo: string;
  inversion: string;
  horas: string;
  numeroCertificado: string;
  numeroFactura: string;
}

export interface RegistroForm {
  editingId: number | null;
  fecha: string;
  eje: string;
  ejeSecundario: string;
  beneficiario: string;
  motivo: string;
  contacto: string;
  observaciones: string;
  aportes: AporteForm[];
  /** El registro viejo nombraba varias unidades y se repartieron los montos en partes iguales. */
  aportesRepartidos: boolean;
  estado: EstadoAccion;
  fotos: Adjunto[];
  consts: Adjunto[];
}

export interface DocForm {
  nombre: string;
  categoria: string;
  fecha: string;
  notas: string;
  file: File | null;
}

export interface Prefs {
  theme: Tema;
}

export interface Campania {
  id: number;
  nombre: string;
  desc: string;
  eje: string;
  estado: EstadoCampania;
  inicio: string | null;
  fin: string | null;
  metaBenef: number;
  benef: number;
  metaAcc: number;
  acc: number;
}

export interface CampaniaForm {
  editingId: number | null;
  nombre: string;
  desc: string;
  eje: string;
  estado: EstadoCampania;
  inicio: string;
  fin: string;
  metaBenef: string;
  benef: string;
  metaAcc: string;
  acc: string;
}

/** Agrupación posible para el gráfico ad-hoc construido desde la selección de filas en Registro. */
export type CampoAgrupacion = 'eje' | 'ejeSecundario' | 'unidad' | 'tipo' | 'mes' | 'beneficiario';
export type MetricaGrafico = 'cantidad' | 'inversion' | 'costo' | 'horas';
export type TipoGrafico = 'bar' | 'pie' | 'line';

/** Evento de la agenda: liviano, independiente de los registros de acciones. */
export interface Evento {
  id: number;
  titulo: string;
  descripcion: string;
  ubicacion: string;
  todoElDia: boolean;
  /** ISO. En eventos de todo el día: 00:00 del primer día. */
  inicio: string;
  /** ISO. En eventos de todo el día: 00:00 del día siguiente al último (exclusivo). */
  fin: string;
  color: string;
  invitados: string[];
  /** Minutos antes del inicio en que se avisa por mail. */
  recordatorios: number[];
  registroId: number | null;
}

export interface EventoForm {
  editingId: number | null;
  titulo: string;
  descripcion: string;
  ubicacion: string;
  todoElDia: boolean;
  fecha: string;
  fechaFin: string;
  horaInicio: string;
  horaFin: string;
  color: string;
  invitados: string[];
  recordatorios: number[];
}

export interface MiembroDirectorio {
  id: number;
  nombre: string;
  email: string;
  cargo: string;
}

export interface UsuarioPlataforma {
  email: string;
  rol: Rol;
}
