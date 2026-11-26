/** Traduce errores de Firebase a mensajes claros en español. */
const MESSAGES = {
  'auth/invalid-credential': 'Correo o contraseña incorrectos.',
  'auth/wrong-password': 'Correo o contraseña incorrectos.',
  'auth/user-not-found': 'Correo o contraseña incorrectos.',
  'auth/invalid-email': 'El correo no es válido.',
  'auth/email-already-in-use': 'Ya existe una cuenta con ese correo.',
  'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres.',
  'auth/too-many-requests': 'Demasiados intentos. Espera unos minutos e inténtalo otra vez.',
  'auth/network-request-failed': 'Sin conexión. Revisa tu internet.',
  'auth/operation-not-allowed': 'Este método de ingreso no está activado en Firebase → Authentication (Correo/contraseña o Google).',
  'auth/popup-closed-by-user': 'Cerraste la ventana de Google antes de terminar.',
  'auth/cancelled-popup-request': 'Cerraste la ventana de Google antes de terminar.',
  'auth/popup-blocked': 'Tu navegador bloqueó la ventana de Google. Permite las ventanas emergentes e inténtalo otra vez.',
  'auth/unauthorized-domain': 'Este dominio no está autorizado en Firebase → Authentication → Configuración → Dominios autorizados.',
  'auth/account-exists-with-different-credential': 'Ese correo ya tiene cuenta con contraseña. Ingresa con tu correo y contraseña.',
  'auth/configuration-not-found': 'Activa Authentication (Correo/contraseña) en la consola de Firebase.',
  'auth/api-key-not-valid.-please-pass-a-valid-api-key.': 'La API key de Firebase en .env no es válida.',
  'permission-denied': 'No tienes permiso para esta acción (revisa que publicaste firestore.rules).',
  'unavailable': 'Firebase no está disponible. Revisa tu conexión.',
  'not-found': 'No se encontró el registro.',
  'failed-precondition': 'Firestore no está creado aún: créalo en la consola de Firebase.',
};

export const friendlyError = (error) => {
  const code = error?.code ?? '';
  if (MESSAGES[code]) return MESSAGES[code];
  const short = code.replace(/^firestore\//, '');
  if (MESSAGES[short]) return MESSAGES[short];
  if (typeof error?.message === 'string' && error.message.length < 160) return error.message;
  return 'Ocurrió un error inesperado. Inténtalo nuevamente.';
};
