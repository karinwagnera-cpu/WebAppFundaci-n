import { useState } from 'react';
import { iniciarSesion } from '../lib/auth';
import logo from '../assets/logo.jpg';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

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

  return (
    <div className="login-wrap">
      <form className="login-card" onSubmit={enviar}>
        <div className="login-logo"><img src={logo} alt="Fundación Huentala" /></div>
        <h1>Fundación Huentala</h1>
        <p className="login-sub">Iniciá sesión para entrar al panel de gestión.</p>

        <div className="field">
          <label htmlFor="loginEmail">Email</label>
          <input
            id="loginEmail" type="email" required autoFocus value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="loginPass">Contraseña</label>
          <input
            id="loginPass" type="password" required value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {error && <div className="login-error">{error}</div>}

        <button type="submit" className="btn" disabled={enviando} style={{ width: '100%' }}>
          {enviando ? 'Ingresando…' : 'Ingresar'}
        </button>
        <p className="login-hint">¿No tenés cuenta? Pedile a un administrador que te la cree.</p>
      </form>
    </div>
  );
}
