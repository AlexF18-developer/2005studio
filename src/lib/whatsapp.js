import { STORE } from '../config/store';
import { moneyCents, formatDate } from './format';
import { paymentLabel } from './orderStatus';

export const waLink = (message, phone = STORE.whatsapp) =>
  `https://wa.me/${String(phone).replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;

export const waConsulta = (productName) =>
  waLink(
    productName
      ? `¡Hola ${STORE.name}! 👋 Me interesa "${productName}". ¿Tienen disponible?`
      : `¡Hola ${STORE.name}! 👋 Quisiera hacer una consulta.`,
  );

export const waPedido = (order) => {
  const lines = [
    `¡Hola ${STORE.name}! 🛍️ Acabo de hacer un pedido en la web.`,
    '',
    `*Pedido:* ${order.code}`,
    ...order.items.map((i) => `• ${i.qty} x ${i.name} (Talla ${i.size}${i.color ? `, ${i.color}` : ''}) — ${moneyCents(i.priceCents * i.qty)}`),
    `*Envío:* ${moneyCents(order.shipping.costCents)} (${order.shipping.district})`,
    `*Total:* ${moneyCents(order.totalCents)}`,
    `*Pago:* ${paymentLabel(order.paymentMethod)}`,
  ];
  if (order.operationNumber) lines.push(`*N° operación:* ${order.operationNumber}`);
  lines.push(`*Fecha:* ${formatDate(order.createdAt)}`, '');
  lines.push(order.paymentMethod === 'contraentrega' ? 'Quedo atento(a) a la confirmación. ¡Gracias!' : 'Adjunto la captura de mi pago. ¡Gracias!');
  return waLink(lines.join('\n'));
};

/** Modo vitrina (sin Firebase): arma el pedido completo para enviarlo por WhatsApp. */
export const waPedidoVitrina = ({ items, form, subtotalCents }) => {
  const costCents = STORE.delivery.costCents;
  const lines = [
    `¡Hola ${STORE.name}! 🛍️ Quiero hacer este pedido:`,
    '',
    ...items.map((i) => `• ${i.qty} x ${i.name} (Talla ${i.size}${i.color ? `, ${i.color}` : ''}) — ${moneyCents(i.priceCents * i.qty)}`),
    `*Envío:* ${moneyCents(costCents)} (${form.district})`,
    `*Total:* ${moneyCents(subtotalCents + costCents)}`,
    `*Pago:* ${paymentLabel(form.paymentMethod)}`,
    '',
    `*Nombre:* ${form.name.trim()}`,
    `*Celular:* ${form.phone.trim()}`,
    `*Dirección:* ${form.address.trim()}${form.reference?.trim() ? ` (Ref.: ${form.reference.trim()})` : ''}`,
  ];
  if (form.notes?.trim()) lines.push(`*Notas:* ${form.notes.trim()}`);
  lines.push('', 'Adjunto la captura de mi pago. ¡Gracias!');
  return waLink(lines.join('\n'));
};

/** Normaliza celulares peruanos de 9 dígitos agregando el 51. */
export const waToCustomer = (phone, message) => {
  let digits = String(phone).replace(/\D/g, '');
  if (digits.length === 9) digits = `51${digits}`;
  return waLink(message, digits);
};
