export const TIPOS = [
  'Donación realizada',
  'Donación recibida',
  'Auspicio / Colaboración',
  'Voluntariado / Servicio',
] as const;

export const EJES = [
  'INFANCIA Y EDUCACIÓN',
  'ARTE Y CULTURA',
  'DEPORTE Y TRANSFORMACIÓN SOCIAL',
  'SEGURIDAD ALIMENTARIA Y NUTRICIÓN',
  'EMPLEABILIDAD Y DESARROLLO ECONÓMICO',
] as const;

export const UNIDADES = ['Fundación', 'Sheraton Mendoza', 'Huentala Hotel', 'Huentala Wines', 'Otro'] as const;

export const DOC_CATEGORIAS = ['Legal', 'Gobernanza', 'Comprobantes', 'Institucional', 'Otro'] as const;

export const MESES = [
  'Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre',
] as const;

export const ESTADOS_CAMPANIA = ['activa', 'planificada', 'finalizada'] as const;

export const ESTADO_LABEL: Record<string, string> = {
  activa: 'Activa',
  planificada: 'Planificada',
  finalizada: 'Finalizada',
};

export const EJE_CLASE: Array<[string, string]> = [
  ['INFANCIA', 'eje-infancia'],
  ['ARTE', 'eje-arte'],
  ['DEPORTE', 'eje-deporte'],
  ['SEGURIDAD', 'eje-seguridad'],
  ['EMPLEABILIDAD', 'eje-empleabilidad'],
];

export const LEYENDA: Array<{ clase: string; label: string }> = [
  { clase: 'eje-infancia', label: 'Infancia y educación' },
  { clase: 'eje-arte', label: 'Arte y cultura' },
  { clase: 'eje-deporte', label: 'Deporte y transf. social' },
  { clase: 'eje-seguridad', label: 'Seguridad alimentaria' },
  { clase: 'eje-empleabilidad', label: 'Empleabilidad' },
  { clase: 'eje-otro', label: 'Otro' },
];
