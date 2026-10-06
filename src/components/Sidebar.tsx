import type { Vista } from '../types';
import Icon, { type IconName } from './Icon';
import logo from '../assets/logo.jpg';

const ITEMS: Array<{ vista: Vista; label: string; icon: IconName }> = [
  { vista: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
  { vista: 'registro', label: 'Registro', icon: 'registro' },
  { vista: 'calendario', label: 'Calendario', icon: 'calendario' },
  { vista: 'campanas', label: 'Campañas', icon: 'campanas' },
  { vista: 'analitica', label: 'Analítica', icon: 'informes' },
  { vista: 'documentacion', label: 'Documentos', icon: 'documentacion' },
];

interface Props {
  vista: Vista;
  onVista: (v: Vista) => void;
  onClose: () => void;
}

export default function Sidebar({ vista, onVista, onClose }: Props) {
  return (
    <aside className="sidebar">
      <div className="sidebar-head">
        <div className="logo-badge">
          <img src={logo} alt="Fundación Huentala" />
        </div>
        <button className="sidebar-close" onClick={onClose} aria-label="Cerrar menú">✕</button>
      </div>
      <nav className="sidebar-nav">
        {ITEMS.map((it) => (
          <button
            key={it.vista}
            className={'nav-item' + (vista === it.vista ? ' active' : '')}
            title={it.label}
            onClick={() => onVista(it.vista)}
          >
            <Icon name={it.icon} />
            <span className="nav-label">{it.label}</span>
          </button>
        ))}
        <button
          className={'nav-item nav-item-bottom' + (vista === 'configuracion' ? ' active' : '')}
          title="Configuración"
          onClick={() => onVista('configuracion')}
        >
          <Icon name="settings" />
          <span className="nav-label">Configuración</span>
        </button>
      </nav>
    </aside>
  );
}
