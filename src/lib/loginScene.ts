export type Periodo = 'amanecer' | 'mediodia' | 'atardecer' | 'noche';

export interface EscenaLogin {
  cielo: [string, string, string];
  astro: 'sol' | 'luna';
  astroCentro: string;
  astroBorde: string;
  glow: string;
  glowOpacidad: number;
  montaniaFondo: string;
  montaniaFrente: string;
  estrellas: number;
}

const ESCENAS: Record<Periodo, EscenaLogin> = {
  amanecer: {
    cielo: ['#9C9284', '#A6624B', '#D2A44F'],
    astro: 'sol', astroCentro: '#FBF9F5', astroBorde: '#D2A44F', glow: '#D2A44F', glowOpacidad: 0.25,
    montaniaFondo: '#A6624B', montaniaFrente: '#6E1F32',
    estrellas: 2,
  },
  mediodia: {
    cielo: ['#B4863C', '#D2A44F', '#F6EEE0'],
    astro: 'sol', astroCentro: '#FFFFFF', astroBorde: '#F6EEE0', glow: '#FBF9F5', glowOpacidad: 0.35,
    montaniaFondo: '#9C9284', montaniaFrente: '#6E1F32',
    estrellas: 0,
  },
  atardecer: {
    cielo: ['#591827', '#6E1F32', '#B4863C'],
    astro: 'sol', astroCentro: '#FBF9F5', astroBorde: '#B4863C', glow: '#B4863C', glowOpacidad: 0.22,
    montaniaFondo: '#A6624B', montaniaFrente: '#591827',
    estrellas: 6,
  },
  noche: {
    cielo: ['#180810', '#3A1220', '#591827'],
    astro: 'luna', astroCentro: '#FBF9F5', astroBorde: '#DBD0BF', glow: '#DBD0BF', glowOpacidad: 0.15,
    montaniaFondo: '#591827', montaniaFrente: '#180810',
    estrellas: 12,
  },
};

export function periodoActual(hora = new Date().getHours()): Periodo {
  if (hora >= 6 && hora < 11) return 'amanecer';
  if (hora >= 11 && hora < 17) return 'mediodia';
  if (hora >= 17 && hora < 20) return 'atardecer';
  return 'noche';
}

export function escenaLogin(periodo: Periodo = periodoActual()): EscenaLogin {
  return ESCENAS[periodo];
}
