import { useEffect } from "react";
import type { ReactNode } from "react";
import { X } from "lucide-react";

export function Modal({
  abierto,
  titulo,
  eyebrow,
  onClose,
  children,
  footer,
  ancho = "max-w-lg",
}: {
  abierto: boolean;
  titulo: string;
  eyebrow?: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  ancho?: string;
}) {
  useEffect(() => {
    if (!abierto) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [abierto, onClose]);

  if (!abierto) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      <button
        aria-label="Cerrar"
        onClick={onClose}
        className="absolute inset-0 bg-navy-deep/80 backdrop-blur-sm"
      />
      <div
        role="dialog"
        aria-modal="true"
        className={`panel-luxe relative w-full ${ancho} max-h-[85vh] overflow-y-auto rounded-xl p-7 animate-scale-in`}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            {eyebrow ? (
              <p className="text-[0.62rem] uppercase tracking-[0.34em] text-primary/70">
                {eyebrow}
              </p>
            ) : null}
            <h2 className="mt-1 font-display text-2xl">{titulo}</h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="rounded-md border border-border p-2 text-muted-foreground transition-colors hover:text-primary"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-5 h-px hairline-gold" />

        <div className="mt-5 space-y-4">{children}</div>

        {footer ? <div className="mt-7 flex flex-wrap justify-end gap-3">{footer}</div> : null}
      </div>
    </div>
  );
}
