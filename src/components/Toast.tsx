import { useEffect, useState } from 'react';
import { registrarListenerToast, type ToastMsg } from '../lib/notificaciones';
import Icon from './Icon';

const DURACION_MS = 6000;

export default function Toast() {
  const [mensajes, setMensajes] = useState<ToastMsg[]>([]);

  useEffect(() => {
    registrarListenerToast((msg) => {
      setMensajes((ms) => [...ms, msg]);
      setTimeout(() => setMensajes((ms) => ms.filter((m) => m.id !== msg.id)), DURACION_MS);
    });
    return () => registrarListenerToast(null);
  }, []);

  if (!mensajes.length) return null;

  return (
    <div className="toast-stack">
      {mensajes.map((m) => (
        <div key={m.id} className={`toast toast-${m.tipo}`}>
          <Icon name={m.tipo === 'error' ? 'close' : m.tipo === 'ok' ? 'check' : 'eye'} size={16} />
          <span>{m.texto}</span>
          <button
            type="button" aria-label="Cerrar aviso"
            onClick={() => setMensajes((ms) => ms.filter((x) => x.id !== m.id))}
          >✕</button>
        </div>
      ))}
    </div>
  );
}
