import type { ReactNode } from "react";

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <header className="flex items-end justify-between gap-6 border-b border-border pb-6">
      <div>
        <p className="text-[0.65rem] uppercase tracking-[0.4em] text-primary/70">{eyebrow}</p>
        <h1 className="mt-2 text-4xl font-normal">{title}</h1>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground">{description}</p>
      </div>
      {actions ? <div className="flex shrink-0 gap-3">{actions}</div> : null}
    </header>
  );
}
