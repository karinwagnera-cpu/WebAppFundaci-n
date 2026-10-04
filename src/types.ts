export type Vista = 'dashboard' | 'registro' | 'campanas' | 'calendario' | 'analitica' | 'documentacion' | 'configuracion';
export type Rol = 'admin' | 'viewer';
export type Tema = 'light' | 'dark';
export type EstadoCampania = 'planificada' | 'activa' | 'finalizada';

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
  fotosCount?: number;
  tieneFotos?: boolean;
  constanciaCount?: number;
  tieneConstancia?: boolean;
}

/** Filtro compartido por Dashboard, Registro e Informes. */
export interface Filtro {
  y: string;
  m: string;
  e: string;
}

export interface Adjunto {
  name: string;
  type: string;
  size: number;
  data: string;
}

export interface DocMeta {
  id: number;
  nombre: string;
  categoria: string;
  fecha: string | null;
  notas: string;
  tipo: string;
  size: number;
  data: string;
}

export interface RegistroForm {
  editingId: number | null;
  fecha: string;
  tipo: string;
  eje: string;
  ejeSecundario: string;
  unidad: string;
  beneficiario: string;
  aporte: string;
  motivo: string;
  costo: string;
  inversion: string;
  horas: string;
  contacto: string;
  observaciones: string;
  numeroCertificado: string;
  numeroFactura: string;
  fotos: Adjunto[];
  consts: Adjunto[];
}

export interface DocForm {
  nombre: string;
  categoria: string;
  fecha: string;
  notas: string;
  file: Adjunto | null;
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
