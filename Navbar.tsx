import type { Rol, Tema, Vista } from '../types';
import { TITULOS } from '../lib/constants';
import Icon from './Icon';

interface Props {
  vista: Vista;
  rol: Rol;
  tema: Tema;
  guardado: boolean;
  busqueda: string;
  onBusqueda: (q: string) => void;
  onTema: () => void;
  onMenu: () => void;
  onPerfil: () => void;
}

export default function Navbar({ vista, rol, tema, guardado, busqueda, onBusqueda, onTema, onMenu, onPerfil }: Props) {
  return (
    <header className="navbar">
      <div className="navbar-left">
        <button className="hamburger" onClick={onMenu} aria-label="Abrir menú">
          <span /><span /><span />
        </button>
        <h1 className="navbar-title">{TITULOS[vista]}</h1>
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
          <span className="avatar">FH</span>
        </button>
      </div>
    </header>
  );
}
