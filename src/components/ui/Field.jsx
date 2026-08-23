const inputClass =
  "h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm text-ink placeholder:text-ink-faint outline-none transition-shadow focus:border-brand-400 focus:ring-2 focus:ring-brand-200";

export function Input({ className = "", ...props }) {
  return <input className={`${inputClass} ${className}`} {...props} />;
}

export function Select({ className = "", children, ...props }) {
  return (
    <select className={`${inputClass} pr-8 ${className}`} {...props}>
      {children}
    </select>
  );
}

export function Textarea({ className = "", ...props }) {
  return (
    <textarea
      className={`min-h-24 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-faint outline-none transition-shadow focus:border-brand-400 focus:ring-2 focus:ring-brand-200 ${className}`}
      {...props}
    />
  );
}

export function Label({ className = "", ...props }) {
  return <label className={`mb-1.5 block text-sm font-medium text-ink ${className}`} {...props} />;
}

export function FormRow({ label, hint, children, className = "" }) {
  return (
    <div className={className}>
      {label ? <Label>{label}</Label> : null}
      {children}
      {hint ? <p className="mt-1.5 text-xs text-ink-faint">{hint}</p> : null}
    </div>
  );
}
