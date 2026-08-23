const VARIANTS = {
  primary: "bg-brand-500 text-white hover:bg-brand-600 shadow-sm shadow-brand-500/20",
  secondary: "bg-surface text-ink border border-border hover:bg-surface-muted",
  ghost: "bg-transparent text-ink-soft hover:bg-surface-muted hover:text-ink",
  danger: "bg-surface text-bad border border-bad/30 hover:bg-bad-bg",
  dangerSolid: "bg-bad text-white hover:bg-red-700"
};

const SIZES = {
  sm: "h-8 px-3 text-sm rounded-lg gap-1.5",
  md: "h-10 px-4 text-sm rounded-xl gap-2",
  lg: "h-11 px-5 text-base rounded-xl gap-2"
};

export default function Button({
  variant = "secondary",
  size = "md",
  className = "",
  type = "button",
  ...props
}) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...props}
    />
  );
}
