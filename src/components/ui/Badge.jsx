const TONES = {
  neutral: "bg-surface-muted text-ink-soft border-border",
  brand: "bg-brand-50 text-brand-700 border-brand-200",
  good: "bg-good-bg text-good border-good/20",
  warn: "bg-warn-bg text-warn border-warn/20",
  bad: "bg-bad-bg text-bad border-bad/20"
};

export default function Badge({ tone = "neutral", className = "", ...props }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${TONES[tone]} ${className}`}
      {...props}
    />
  );
}
