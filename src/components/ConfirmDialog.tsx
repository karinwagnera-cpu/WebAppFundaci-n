import { useEffect, useState } from 'react';
import { registrarHandlerConfirm, type ConfirmOpciones } from '../lib/notificaciones';

interface Pendiente extends ConfirmOpciones {
  resolver: (v: boolean) => void;
}

export default function ConfirmDialog() {
  const [pendiente, setPendiente] = useState<Pendiente | null>(null);
  const [texto, setTexto] = useState('');

  useEffect(() => {
    registrarHandlerConfirm((opts) => new Promise<boolean>((resolve) => {
      setTexto('');
      setPendiente({ ...opts, resolver: resolve });
    }));
    return () => registrarHandlerConfirm(null);
  }, []);

  if (!pendiente) return null;

  const cerrar = (resultado: boolean) => {
    pendiente.resolver(resultado);
    setPendiente(null);
  };

  const bloqueadoPorTexto = pendiente.requiereTexto !== undefined && texto !== pendiente.requiereTexto;

  return (
    <div className="modal-backdrop show" onClick={(e) => { if (e.target === e.currentTarget) cerrar(false); }}>
      <div className="modal" style={{ maxWidth: 420 }}>
        <h2>{pendiente.titulo ?? (pendiente.peligroso ? 'Confirmar acción' : 'Confirmar')}</h2>
        <div className="modal-sub" style={{ whiteSpace: 'pre-line' }}>{pendiente.mensaje}</div>

        {pendiente.requiereTexto !== undefined && (
          <div className="field" style={{ marginTop: 16 }}>
            <label htmlFor="confirmTexto">Escribí <strong>{pendiente.requiereTexto}</strong> para confirmar</label>
            <input
              id="confirmTexto" type="text" autoFocus value={texto}
              onChange={(e) => setTexto(e.target.value)}
            />
          </div>
        )}

        <div className="modal-actions">
          <button type="button" className="btn secondary" onClick={() => cerrar(false)}>Cancelar</button>
          <button
            type="button"
            className={pendiente.peligroso ? 'btn danger' : 'btn'}
            disabled={bloqueadoPorTexto}
            onClick={() => cerrar(true)}
          >
            {pendiente.textoConfirmar ?? 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  );
}
