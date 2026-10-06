import { useState } from 'react';
import { cambiarPassword, subirAvatar } from '../lib/auth';
import { mensajeError } from '../lib/format';
import { notificar } from '../lib/notificaciones';

interface Props {
  userId: string;
  email: string | null;
  avatarUrl: string | null;
  onAvatarActualizado: (url: string) => void;
  onCerrar: () => void;
}

export default function PerfilUsuarioModal({ userId, email, avatarUrl, onAvatarActualizado, onCerrar }: Props) {
  const [subiendo, setSubiendo] = useState(false);
  const [password1, setPassword1] = useState('');
  const [password2, setPassword2] = useState('');
  const [guardandoPass, setGuardandoPass] = useState(false);
  const [mensajePass, setMensajePass] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);

  const subir = async (file: File | undefined) => {
    if (!file) return;
    setSubiendo(true);
    try {
      const url = await subirAvatar(file, userId);
      onAvatarActualizado(url);
      notificar('Foto de perfil actualizada.', 'ok');
    } catch (err) {
      notificar(mensajeError(err));
    } finally {
      setSubiendo(false);
    }
  };

  const guardarPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMensajePass(null);
    if (password1.length < 8) {
      setMensajePass({ tipo: 'error', texto: 'La contraseña tiene que tener al menos 8 caracteres.' });
      return;
    }
    if (password1 !== password2) {
      setMensajePass({ tipo: 'error', texto: 'Las contraseñas no coinciden.' });
      return;
    }
    setGuardandoPass(true);
    try {
      await cambiarPassword(password1);
      setMensajePass({ tipo: 'ok', texto: 'Contraseña actualizada.' });
      setPassword1('');
      setPassword2('');
    } catch (err) {
      setMensajePass({ tipo: 'error', texto: mensajeError(err) });
    } finally {
      setGuardandoPass(false);
    }
  };

  return (
    <div className="modal-backdrop show" onClick={(e) => { if (e.target === e.currentTarget) onCerrar(); }}>
      <div className="modal" style={{ maxWidth: 440 }}>
        <h2>Mi perfil</h2>
        <div className="modal-sub">{email}</div>

        <div className="form-section-title">Foto de perfil</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
          <span className="avatar big" style={{ overflow: 'hidden' }}>
            {avatarUrl ? <img src={avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : 'FH'}
          </span>
          <label className={'btn secondary small attach-btn' + (subiendo ? ' disabled' : '')}>
            {subiendo ? 'Subiendo…' : 'Cambiar foto'}
            <input
              type="file" accept="image/*" disabled={subiendo} style={{ display: 'none' }}
              onChange={(e) => subir(e.target.files?.[0])}
            />
          </label>
        </div>

        <div className="form-section-title">Cambiar contraseña</div>
        <form onSubmit={guardarPassword}>
          <div className="ux-grid">
            <div className="field c6">
              <label htmlFor="pwNueva">Nueva contraseña</label>
              <input id="pwNueva" type="password" value={password1} onChange={(e) => setPassword1(e.target.value)} autoComplete="new-password" />
            </div>
            <div className="field c6">
              <label htmlFor="pwConfirmar">Confirmar contraseña</label>
              <input id="pwConfirmar" type="password" value={password2} onChange={(e) => setPassword2(e.target.value)} autoComplete="new-password" />
            </div>
          </div>
          {mensajePass && (
            <div className={mensajePass.tipo === 'error' ? 'login-error' : 'login-error'} style={mensajePass.tipo === 'ok' ? { background: 'var(--sage-tint)', color: '#3E5A31' } : undefined}>
              {mensajePass.texto}
            </div>
          )}
          <div className="modal-actions">
            <button type="button" className="btn secondary" onClick={onCerrar}>Cerrar</button>
            <button type="submit" className="btn" disabled={guardandoPass}>{guardandoPass ? 'Guardando…' : 'Guardar contraseña'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
