import type { Rol, Tema } from '../types';
import Icon from './Icon';

interface Props {
  rol: Rol;
  tema: Tema;
  guardado: boolean;
  busqueda: string;
  avatarUrl: string | null;
  onBusqueda: (q: string) => void;
  onTema: () => void;
  onMenu: () => void;
  onPerfil: () => void;
}

export default function Navbar({ rol, tema, guardado, busqueda, avatarUrl, onBusqueda, onTema, onMenu, onPerfil }: Props) {
  return (
    <header className="navbar">
      <div className="navbar-left">
        <button className="hamburger" onClick={onMenu} aria-label="Abrir menú">
          <span /><span /><span />
        </button>
        <h1 className="navbar-title">Fundación Huentala</h1>
        {rol === 'viewer' && (
          <span className="role-badge" style={{ display: 'flex' }}>
            <Icon name="eye" size={15} /> Solo lectura
          </span>
        )}
      </div>
      <div className="navbar-search">
        <Icon name="search" />
        <input
          type="text"
          value={busqueda}
          onChange={(e) => onBusqueda(e.target.value)}
          placeholder="Buscar en registros…"
        />
      </div>
      <div className="navbar-right">
        <span className={'save-pill' + (guardado ? ' show' : '')}><span className="dot" />Guardado</span>
        <button className="icon-btn" onClick={onTema} aria-label="Cambiar tema" title="Cambiar modo claro/oscuro">
          <Icon name={tema === 'dark' ? 'moon' : 'sun'} size={20} />
        </button>
        <button className="profile-btn" onClick={onPerfil} aria-label="Perfil">
          <span className="avatar">
            {avatarUrl ? <img src={avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : 'FH'}
          </span>
        </button>
      </div>
    </header>
  );
}
