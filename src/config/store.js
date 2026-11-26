/**
 * Datos públicos de 2005 Studio. Edita este archivo para cambiar contacto, pagos o delivery.
 * ⚠️ Revisa los datos de pago (número y titular) antes de publicar.
 */
export const STORE = {
  name: '2005 Studio',
  shortName: '2005',
  tagline: 'Studio',
  slogan: 'Ropa para los que siempre hacen lo suyo',
  whatsapp: '51917233247', // solo dígitos, con código de país
  phoneDisplay: '+51 917 233 247',
  address: 'Tienda online',
  city: 'Lima, Perú',
  hours: 'Atención por WhatsApp · Lun a Sáb 9:00 a.m. - 8:00 p.m.',
  payments: {
    yape: { number: '917 233 247', holder: 'Abraham Alexander Avila Ramirez', qr: 'images/yape_qr.jpg' },
    plin: { number: '917 233 247', holder: 'Abraham Alexander Avila Ramirez' },
    transfer: { bank: '', account: '19493630417077', cci: '', holder: 'Abraham Alexander Avila Ramirez' },
  },
  socials: {
    instagram: 'https://www.instagram.com/alex_fade12',
    instagramHandle: '@alex_fade12',
    facebook: 'https://www.facebook.com/abraham.avila.5686',
    tiktok: 'https://www.tiktok.com/@alexfade16',
    tiktokHandle: '@alexfade16',
  },
  delivery: {
    costCents: 500, // S/ 5.00 a todo Lima
    eta: '24 a 48 horas',
    districts: [
      'Ancón', 'Ate', 'Barranco', 'Breña', 'Carabayllo', 'Chaclacayo', 'Chorrillos', 'Cieneguilla',
      'Comas', 'El Agustino', 'Independencia', 'Jesús María', 'La Molina', 'La Victoria', 'Lima Cercado',
      'Lince', 'Los Olivos', 'Lurigancho-Chosica', 'Lurín', 'Magdalena del Mar', 'Miraflores',
      'Pachacámac', 'Pucusana', 'Pueblo Libre', 'Puente Piedra', 'Punta Hermosa', 'Punta Negra', 'Rímac',
      'San Bartolo', 'San Borja', 'San Isidro', 'San Juan de Lurigancho', 'San Juan de Miraflores',
      'San Luis', 'San Martín de Porres', 'San Miguel', 'Santa Anita', 'Santa María del Mar',
      'Santa Rosa', 'Santiago de Surco', 'Surquillo', 'Villa El Salvador', 'Villa María del Triunfo',
      'Callao',
    ],
  },
  // Cifras reales de la marca (no inventes clientes ni años: se muestran en el inicio).
  stats: { designs: 12, sizes: 3, districts: 44, founded: 2025 },
  collection: 'Drop 01',
};

export const PAYMENT_METHODS = [
  { id: 'yape', label: 'Yape', hint: 'Escanea el QR o yapea al número', className: 'pay-yape' },
  { id: 'plin', label: 'Plin', hint: 'Transferencia inmediata', className: 'pay-plin' },
  { id: 'transferencia', label: 'Transferencia', hint: 'Depósito a cuenta', className: 'pay-bank' },
];

export const GENDERS = [
  { id: 'hombre', label: 'Hombre' },
  { id: 'mujer', label: 'Mujer' },
  { id: 'unisex', label: 'Unisex' },
];

export const LOW_STOCK = 3;
export const MAX_QTY_PER_ITEM = 10;
