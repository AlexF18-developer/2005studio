import { useEffect, useState } from 'react';

const parts = (ms) => {
  const t = Math.max(0, ms);
  return [
    ['Días', Math.floor(t / 86_400_000)],
    ['Horas', Math.floor(t / 3_600_000) % 24],
    ['Min', Math.floor(t / 60_000) % 60],
    ['Seg', Math.floor(t / 1000) % 60],
  ];
};

export default function Countdown({ target }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="countdown" aria-label="Cuenta regresiva">
      {parts(target.getTime() - now).map(([label, value]) => (
        <div key={label} className="countdown-item">
          <strong key={value} className="tick">{String(value).padStart(2, '0')}</strong>
          <span>{label}</span>
        </div>
      ))}
    </div>
  );
}
