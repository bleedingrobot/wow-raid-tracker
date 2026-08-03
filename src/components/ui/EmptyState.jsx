export default function EmptyState({ title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-surface-muted px-6 py-12 text-center">
      <h3 className="text-sm font-semibold text-ink">{title}</h3>
      {description ? <p className="mt-1 max-w-sm text-sm text-ink-soft">{description}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
