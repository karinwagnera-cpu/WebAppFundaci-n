import type { Rol } from '../types';

interface Props {
  rol: Rol;
  email: string | null;
  puedeEditar: boolean;
  mostrarSesion: boolean;
  onCerrarSesion: () => void;
  onBackup: () => void;
  onImportar: (file: File) => void;
  onReset: () => void;
}

export default function PerfilMenu({ rol, email, puedeEditar, mostrarSesion, onCerrarSesion, onBackup, onImportar, onReset }: Props) {
  return (
    <div className="profile-menu show">
      <div className="profile-menu-head">
        <span className="avatar big">FH</span>
        <div>
          <div className="pm-name">{email || 'Fundación Huentala'}</div>
          <div className="pm-sub">{rol === 'viewer' ? 'Solo lectura' : 'Administrador'}</div>
        </div>
      </div>
      <button className="pm-item" onClick={onBackup}>Descargar copia de seguridad</button>
      {puedeEditar && (
        <>
          <label className="pm-item imports" style={{ cursor: 'pointer' }}>
            Importar copia de seguridad
            <input
              type="file" accept="application/json" style={{ display: 'none' }}
              onChange={(e) => { const f = e.target.files?.[0]; if (f) onImportar(f); }}
            />
          </label>
          <button className="pm-item danger" onClick={onReset}>Restablecer al histórico original</button>
        </>
      )}
      {mostrarSesion && (
        <button className="pm-item danger" onClick={onCerrarSesion}>Cerrar sesión</button>
      )}
    </div>
  );
}
