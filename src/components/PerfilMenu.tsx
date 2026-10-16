import { useEffect, useRef } from 'react';
import type { Rol } from '../types';

interface Props {
  rol: Rol;
  email: string | null;
  avatarUrl: string | null;
  puedeEditar: boolean;
  mostrarSesion: boolean;
  onAbrirPerfil: () => void;
  onCerrarSesion: () => void;
  onBackup: () => void;
  onImportar: (file: File) => void;
  onReset: () => void;
  onCerrar: () => void;
}

export default function PerfilMenu({ rol, email, avatarUrl, puedeEditar, mostrarSesion, onAbrirPerfil, onCerrarSesion, onBackup, onImportar, onReset, onCerrar }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fuera = (e: MouseEvent | TouchEvent) => {
      const t = e.target as Element | null;
      // El botón de perfil hace su propio toggle; no cerramos acá para evitar que reabra.
      if (!t || ref.current?.contains(t) || t.closest('.profile-btn')) return;
      onCerrar();
    };
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') onCerrar(); };
    document.addEventListener('mousedown', fuera);
    document.addEventListener('touchstart', fuera);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('mousedown', fuera);
      document.removeEventListener('touchstart', fuera);
      document.removeEventListener('keydown', esc);
    };
  }, [onCerrar]);

  return (
    <div className="profile-menu show" ref={ref}>
      <div className="profile-menu-head">
        <span className="avatar big" style={{ overflow: 'hidden' }}>
          {avatarUrl ? <img src={avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : 'FH'}
        </span>
        <div>
          <div className="pm-name">{email || 'Fundación Huentala'}</div>
          <div className="pm-sub">{rol === 'viewer' ? 'Solo lectura' : 'Administrador'}</div>
        </div>
      </div>
      {mostrarSesion && <button className="pm-item" onClick={onAbrirPerfil}>Mi perfil</button>}
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
