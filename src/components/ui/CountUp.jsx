import { useEffect, useRef, useState } from 'react';

/** Número que cuenta hacia arriba cuando entra en pantalla. */
export default function CountUp({ end, suffix = '', duration = 1800 }) {
  const ref = useRef(null);
  const [value, setValue] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    let frame;
    const io = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      io.disconnect();
      const start = performance.now();
      const step = (t) => {
        const p = Math.min((t - start) / duration, 1);
        setValue(Math.round(end * (1 - (1 - p) ** 3)));
        if (p < 1) frame = requestAnimationFrame(step);
      };
      frame = requestAnimationFrame(step);
    }, { threshold: 0.4 });
    io.observe(el);
    return () => { io.disconnect(); cancelAnimationFrame(frame); };
  }, [end, duration]);

  return <span ref={ref}>{value.toLocaleString('es-PE')}{suffix}</span>;
}
