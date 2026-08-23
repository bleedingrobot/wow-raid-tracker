export function Card({ className = "", ...props }) {
  return (
    <div
      className={`rounded-2xl border border-border bg-surface shadow-card ${className}`}
      {...props}
    />
  );
}

export function CardHeader({ title, subtitle, actions, className = "" }) {
  return (
    <div className={`flex items-start justify-between gap-4 p-5 pb-4 ${className}`}>
      <div className="min-w-0">
        <h2 className="text-base font-semibold text-ink truncate">{title}</h2>
        {subtitle ? <p className="mt-0.5 text-sm text-ink-soft">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function CardBody({ className = "", ...props }) {
  return <div className={`px-5 pb-5 ${className}`} {...props} />;
}
