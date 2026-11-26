import { PAYMENT_METHODS } from '../config/store';

export const STATUS = {
  pendiente: { label: 'Pendiente de pago', tone: 'warning', step: 0 },
  verificando: { label: 'Pago por verificar', tone: 'info', step: 0 },
  confirmado: { label: 'Confirmado', tone: 'gold', step: 1 },
  enviado: { label: 'En camino', tone: 'purple', step: 2 },
  entregado: { label: 'Entregado', tone: 'success', step: 3 },
  cancelado: { label: 'Cancelado', tone: 'danger', step: -1 },
};

export const STEPS = ['Recibido', 'Confirmado', 'En camino', 'Entregado'];

/** Máquina de estados: transiciones permitidas desde el panel. */
export const TRANSITIONS = {
  pendiente: ['verificando', 'confirmado', 'cancelado'],
  verificando: ['confirmado', 'pendiente', 'cancelado'],
  confirmado: ['enviado', 'cancelado'],
  enviado: ['entregado'],
  entregado: [],
  cancelado: [],
};

export const SALE_STATUSES = ['confirmado', 'enviado', 'entregado'];

export const statusLabel = (s) => STATUS[s]?.label ?? s;
export const statusTone = (s) => STATUS[s]?.tone ?? 'muted';
export const paymentLabel = (id) => PAYMENT_METHODS.find((m) => m.id === id)?.label ?? id;
export const canTransition = (from, to) => (TRANSITIONS[from] ?? []).includes(to);
