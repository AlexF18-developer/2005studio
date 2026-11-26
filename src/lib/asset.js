/**
 * Convierte rutas de /public ("images/01_racing_club.jpg") en URLs que funcionan
 * tanto en local como en GitHub Pages (/2005studio/...). Las URL completas se respetan.
 */
export const asset = (path) => {
  if (!path) return path;
  if (/^(https?:|data:|blob:)/i.test(path)) return path;
  return `${import.meta.env.BASE_URL}${path.replace(/^\/+/, '')}`;
};
