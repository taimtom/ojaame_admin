type Props = {
  percent: number;
  size?: number;
};

export function PlaybookProgressRing({ percent, size = 72 }: Props) {
  const stroke = 6;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;
  const complete = percent >= 100;

  return (
    <div
      className="progress-ring"
      style={{ width: size, height: size, position: 'relative' }}
      aria-label={`${percent}% complete`}
    >
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#334155"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={complete ? '#4ade80' : '#38bdf8'}
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <span
        className="progress-ring-label"
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 700,
          fontSize: size > 60 ? 16 : 13,
        }}
      >
        {percent}%
      </span>
    </div>
  );
}
