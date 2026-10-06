/**
 * Reemplazo de alert()/confirm() nativos por componentes propios (Toast / ConfirmDialog),
 * sin necesitar Context ni prop-drilling: cualquier módulo llama notificar()/confirmar()
 * directamente, y App.tsx registra los handlers reales al montar los componentes.
 * Si nada se registró todavía (improbable, pero defensivo), cae al nativo del navegador.
 */

export type TipoToast = 'error' | 'info' | 'ok';

export interface ToastMsg {
  id: number;
  tipo: TipoToast;
  texto: string;
}

type ListenerToast = (msg: ToastMsg) => void;
let listenerToast: ListenerToast | null = null;
let contador = 0;

export function registrarListenerToast(l: ListenerToast | null): void {
  listenerToast = l;
}

export function notificar(texto: string, tipo: TipoToast = 'error'): void {
  contador += 1;
  const msg: ToastMsg = { id: contador, tipo, texto };
  if (listenerToast) listenerToast(msg);
  else window.alert(texto);
}

export interface ConfirmOpciones {
  titulo?: string;
  mensaje: string;
  textoConfirmar?: string;
  peligroso?: boolean;
  /** Si se define, el usuario debe tipear exactamente este texto para habilitar el botón de confirmar. */
  requiereTexto?: string;
}

type HandlerConfirm = (opts: ConfirmOpciones) => Promise<boolean>;
let handlerConfirm: HandlerConfirm | null = null;

export function registrarHandlerConfirm(h: HandlerConfirm | null): void {
  handlerConfirm = h;
}

export function confirmar(opts: ConfirmOpciones): Promise<boolean> {
  if (handlerConfirm) return handlerConfirm(opts);
  return Promise.resolve(window.confirm(opts.mensaje));
}
