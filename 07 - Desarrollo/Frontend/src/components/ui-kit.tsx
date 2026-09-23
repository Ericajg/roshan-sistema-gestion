import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

// ---------------------------------------------------------------------------
// Tarjeta resumen (mismo lenguaje visual que las tarjetas de Pagos)
// ---------------------------------------------------------------------------

export function StatCard({
  label,
  valor,
  detalle,
}: {
  label: string;
  valor: string;
  detalle?: string;
}) {
  return (
    <div className="panel-luxe rounded-xl p-6">
      <p className="text-[0.62rem] uppercase tracking-[0.28em] text-muted-foreground">{label}</p>
      <p className="mt-3 font-display text-3xl text-primary">{valor}</p>
      {detalle ? <p className="mt-1 text-xs text-muted-foreground">{detalle}</p> : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Badge de estado
// ---------------------------------------------------------------------------

export type Tono = "oro" | "verde" | "rojo" | "ambar" | "neutro";

const tonoClase: Record<Tono, string> = {
  oro: "border-primary/45 text-primary",
  verde: "border-status-success/55 text-status-success",
  rojo: "border-status-danger/55 text-status-danger",
  ambar: "border-status-warning/55 text-status-warning",
  neutro: "border-border text-muted-foreground",
};

export function Badge({ tono, children }: { tono: Tono; children: ReactNode }) {
  return (
    <span
      className={`inline-block whitespace-nowrap rounded-full border px-3 py-1 text-[0.65rem] uppercase tracking-[0.2em] ${tonoClase[tono]}`}
    >
      {children}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Botones
// ---------------------------------------------------------------------------

export const btnPrimario =
  "inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40";

export const btnFantasma =
  "inline-flex items-center justify-center gap-2 rounded-md border border-primary/50 px-4 py-2 text-sm text-primary transition-colors hover:bg-primary/10";

export const btnNeutro =
  "inline-flex items-center justify-center gap-2 rounded-md border border-border px-4 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground";

export const btnPeligro =
  "inline-flex items-center justify-center gap-2 rounded-md border border-status-danger/50 px-4 py-2 text-sm text-status-danger transition-colors hover:bg-status-danger/10";

export const btnExito =
  "inline-flex items-center justify-center gap-2 rounded-md border border-status-success/55 px-4 py-2 text-sm text-status-success transition-colors hover:bg-status-success/10";

// ---------------------------------------------------------------------------
// Campos de formulario
// ---------------------------------------------------------------------------

const campoBase =
  "w-full rounded-md border border-input bg-navy-deep/40 px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary/60";

export function Campo({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="text-[0.62rem] uppercase tracking-[0.28em] text-muted-foreground">
        {label}
      </span>
      <span className="mt-2 block">{children}</span>
      {hint ? <span className="mt-1 block text-xs text-muted-foreground">{hint}</span> : null}
    </label>
  );
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${campoBase} ${props.className ?? ""}`} />;
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`${campoBase} ${props.className ?? ""}`} />;
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`${campoBase} ${props.className ?? ""}`} />;
}

// ---------------------------------------------------------------------------
// Fila de detalle (modales / fichas)
// ---------------------------------------------------------------------------

export function Detalle({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-border/40 pb-2">
      <span className="text-[0.62rem] uppercase tracking-[0.28em] text-muted-foreground">
        {label}
      </span>
      <span className="text-right text-sm">{children}</span>
    </div>
  );
}
