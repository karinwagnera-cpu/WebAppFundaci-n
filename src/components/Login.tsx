import { useState } from 'react';
import { iniciarSesion, iniciarSesionGoogle } from '../lib/auth';
import { escenaLogin } from '../lib/loginScene';
import Icon from './Icon';
import logo from '../assets/logo.jpg';

const ESTRELLAS = [
  [30, 24, 1.4, 0.8], [64, 44, 1, 0.5], [110, 20, 1.6, 0.7], [150, 50, 1, 0.4],
  [280, 30, 1.3, 0.6], [320, 54, 1, 0.5], [360, 22, 1.5, 0.8], [20, 60, 1, 0.4],
  [95, 66, 1.1, 0.5], [250, 60, 1, 0.4], [340, 70, 1.2, 0.6], [180, 18, 1, 0.5],
] as const;

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [conGoogle, setConGoogle] = useState(false);
  const [escena] = useState(() => escenaLogin());

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setEnviando(true);
    try {
      await iniciarSesion(email.trim(), password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo iniciar sesión.');
    } finally {
      setEnviando(false);
    }
  };

  const conGoogleClick = async () => {
    setError('');
    setConGoogle(true);
    try {
      await iniciarSesionGoogle();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo iniciar sesión con Google.');
      setConGoogle(false);
    }
  };

  return (
    <div className="login-wrap">
      <div className="login-shell">
        <div className="login-scene">
          <svg viewBox="0 0 400 230" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
            <defs>
              <linearGradient id="loginSky" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={escena.cielo[0]} />
                <stop offset="55%" stopColor={escena.cielo[1]} />
                <stop offset="100%" stopColor={escena.cielo[2]} />
              </linearGradient>
              <radialGradient id="loginAstro" cx="50%" cy="45%" r="55%">
                <stop offset="0%" stopColor={escena.astroCentro} />
                <stop offset="100%" stopColor={escena.astroBorde} />
              </radialGradient>
            </defs>
            <rect x="0" y="0" width="400" height="230" fill="url(#loginSky)" />
            <circle cx="200" cy="72" r="56" fill={escena.glow} opacity={escena.glowOpacidad} />
            <circle cx="200" cy="72" r="32" fill="url(#loginAstro)" />
            {escena.astro === 'luna' && (
              <>
                <circle cx="211" cy="62" r="5" fill={escena.astroBorde} opacity="0.5" />
                <circle cx="190" cy="80" r="3.5" fill={escena.astroBorde} opacity="0.5" />
                <circle cx="195" cy="60" r="2.5" fill={escena.astroBorde} opacity="0.4" />
              </>
            )}
            {ESTRELLAS.slice(0, escena.estrellas).map(([cx, cy, r, o], i) => (
              <circle key={i} cx={cx} cy={cy} r={r} fill="#FBF9F5" opacity={o} />
            ))}
            <path d="M0,150 L40,120 L80,140 L130,100 L180,135 L230,105 L280,140 L330,110 L370,138 L400,120 L400,230 L0,230 Z" fill={escena.montaniaFondo} opacity="0.9" />
            <path d="M0,185 L50,150 L100,180 L160,135 L220,178 L270,145 L330,183 L380,155 L400,170 L400,230 L0,230 Z" fill={escena.montaniaFrente} />
          </svg>
          <div className="login-brand">
            <div className="login-logo"><img src={logo} alt="Fundación Huentala" /></div>
            <h1>Fundación Huentala</h1>
          </div>
        </div>

        <form className="login-card" onSubmit={enviar}>
          <p className="login-sub">Iniciá sesión para entrar al panel de gestión.</p>

          <button type="button" className="btn-google" disabled={conGoogle} onClick={conGoogleClick}>
            <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
              <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 8 3l5.7-5.7C34.6 6.1 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.6-.4-3.5z" />
              <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.9 18.9 13 24 13c3.1 0 5.8 1.1 8 3l5.7-5.7C34.6 6.1 29.6 4 24 4 16.3 4 9.6 8.3 6.3 14.7z" />
              <path fill="#4CAF50" d="M24 44c5.5 0 10.4-1.9 14.2-5.1l-6.6-5.6c-2 1.5-4.6 2.6-7.6 2.6-5.3 0-9.7-3.1-11.3-7.5l-6.6 5.1C9.5 39.6 16.2 44 24 44z" />
              <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.3 5.8l6.6 5.6C40.9 36.4 44 30.9 44 24c0-1.3-.1-2.6-.4-3.5z" />
            </svg>
            {conGoogle ? 'Redirigiendo…' : 'Continuar con Google'}
          </button>

          <div className="login-divider"><span>o</span></div>

          <div className="login-field">
            <label htmlFor="loginEmail" className="sr-only">Email</label>
            <div className="login-input-wrap">
              <Icon name="mail" size={16} />
              <input
                id="loginEmail" type="email" required autoFocus value={email}
                placeholder="Email" onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>
          <div className="login-field">
            <label htmlFor="loginPass" className="sr-only">Contraseña</label>
            <div className="login-input-wrap">
              <Icon name="lock" size={16} />
              <input
                id="loginPass" type="password" required value={password}
                placeholder="Contraseña" onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error && <div className="login-error">{error}</div>}

          <button type="submit" className="btn" disabled={enviando} style={{ width: '100%' }}>
            {enviando ? 'Ingresando…' : 'Ingresar'}
          </button>
          <p className="login-hint">¿No tenés cuenta? Pedile a un administrador que te la cree.</p>
        </form>
      </div>
    </div>
  );
}
