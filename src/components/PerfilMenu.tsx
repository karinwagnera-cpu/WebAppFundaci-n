import type { Rol } from '../types';

interface Props {
  rol: Rol;
  onRol: (r: Rol) => void;
  onBackup: () => void;
  onImportar: (file: File) => void;
  onReset: () => void;
}

export default function PerfilMenu({ rol, onRol, onBackup, onImportar, onReset }: Props) {
  return (
    <div className="profile-menu show">
      <div className="profile-menu-head">
        <span className="avatar big">FH</span>
        <div>
          <div className="pm-name">Fundación Huentala</div>
          <div className="pm-sub">{rol === 'viewer' ? 'Solo lectura' : 'Administrador'}</div>
        </div>
      </div>
      <div className="pm-role">
        <span className="pm-role-label">Rol activo</span>
        <div className="pm-role-toggle">
          <button className={'pm-role-opt' + (rol === 'admin' ? ' active' : '')} onClick={() => onRol('admin')}>Administrador</button>
          <button className={'pm-role-opt' + (rol === 'viewer' ? ' active' : '')} onClick={() => onRol('viewer')}>Solo ver</button>
        </div>
      </div>
      <button className="pm-item" onClick={onBackup}>Descargar copia de seguridad</button>
      <label className="pm-item imports" style={{ cursor: 'pointer' }}>
        Importar copia de seguridad
        <input
          type="file" accept="application/json" style={{ display: 'none' }}
          onChange={(e) => { const f = e.target.files?.[0]; if (f) onImportar(f); }}
        />
      </label>
      <button className="pm-item danger" onClick={onReset}>Restablecer al histórico original</button>
    </div>
  );
}
