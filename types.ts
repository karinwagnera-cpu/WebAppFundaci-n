export type Vista = 'dashboard' | 'registro' | 'calendario' | 'informes' | 'documentacion';
export type Rol = 'admin' | 'viewer';
export type Tema = 'light' | 'dark';

export interface Registro {
  id: number;
  fecha: string | null;
  tipo: string | null;
  eje: string | null;
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
  unidad: string;
  beneficiario: string;
  aporte: string;
  motivo: string;
  costo: string;
  inversion: string;
  horas: string;
  contacto: string;
  observaciones: string;
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
  role: Rol;
  collapsed: boolean;
}
