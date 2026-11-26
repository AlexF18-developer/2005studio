/** localStorage seguro: nunca rompe la app (modo incógnito, cuota llena, JSON corrupto). */
export const readJSON = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

export const writeJSON = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* sin almacenamiento disponible: se mantiene solo en memoria */
  }
};
