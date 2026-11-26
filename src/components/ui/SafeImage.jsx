import { useState } from 'react';
import { asset } from '../../lib/asset';

const FALLBACK = asset('img/placeholder.svg');

/** <img> con respaldo si la URL falla y carga diferida. Acepta rutas de /public o URL completas. */
export default function SafeImage({ src, alt = '', className = '', eager = false, ...rest }) {
  const [failedSrc, setFailedSrc] = useState(null);
  const broken = !src || failedSrc === src;
  return (
    <img
      src={broken ? FALLBACK : asset(src)}
      alt={alt}
      className={className}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      onError={() => setFailedSrc(src)}
      {...rest}
    />
  );
}
