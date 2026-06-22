import { useMemo } from 'react';

const COLORS = ['#f9a8d4', '#fbcfe8', '#fce7f3', '#bbf7d0', '#86efac', '#fef08a', '#fed7aa'];

export default function PetalRain({ count = 15 }) {
  const petals = useMemo(() => Array.from({ length: count }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    width: `${8 + Math.random() * 14}px`,
    height: `${8 + Math.random() * 14}px`,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    duration: `${5 + Math.random() * 8}s`,
    delay: `${Math.random() * 10}s`,
    borderRadius: Math.random() > 0.5 ? '50% 0 50% 0' : '50% 50% 0 50%',
  })), [count]);

  return (
    <>
      {petals.map(p => (
        <div
          key={p.id}
          className="petal"
          style={{
            left: p.left,
            width: p.width,
            height: p.height,
            background: p.color,
            animationDuration: p.duration,
            animationDelay: p.delay,
            borderRadius: p.borderRadius,
          }}
        />
      ))}
    </>
  );
}
