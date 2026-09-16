import type { Vista } from '../types';
import Icon, { type IconName } from './Icon';
import logo from '../assets/logo.jpg';

const ITEMS: Array<{ vista: Vista; label: string; icon: IconName }> = [
  { vista: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
  { vista: 'registro', label: 'Registro', icon: 'registro' },
  { vista: 'calendario', label: 'Calendario', icon: 'calendario' },
  { vista: 'informes', label: 'Informes', icon: 'informes' },
  { vista: 'documentacion', label: 'Documentación', icon: 'documentacion' },
];

interface Props {
  vista: Vista;
  onVista: (v: Vista) => void;
  onCollapse: () => void;
  onClose: () => void;
}

export default function Sidebar({ vista, onVista, onCollapse, onClose }: Props) {
  return (
    <aside className="sidebar">
      <div className="sidebar-head">
        <div className="logo-badge">
          <img src={logo} alt="Fundación Huentala" />
        </div>
        <div className="sidebar-brand">
          <span className="name">Fundación Huentala</span>
          <span className="tag">Gestión social</span>
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
      </nav>
      <button className="sidebar-collapse" onClick={onCollapse} title="Contraer menú">
        <Icon name="chevronLeft" />
        <span className="nav-label">Contraer</span>
      </button>
    </aside>
  );
}
