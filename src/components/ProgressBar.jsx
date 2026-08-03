const TONES = {
  brand: "bg-brand-500",
  good: "bg-good",
  warn: "bg-warn",
  bad: "bg-bad"
};

export default function ProgressBar({ value, tone = "brand" }) {
  const clamped = Math.max(0, Math.min(100, value || 0));
  return (
    <div
      className="h-1.5 w-full overflow-hidden rounded-full bg-surface-muted"
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={`h-full rounded-full transition-all ${TONES[tone] || TONES.brand}`}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
