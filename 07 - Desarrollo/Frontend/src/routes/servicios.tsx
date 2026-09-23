import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Clock, Pencil, Plus, Power } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Modal } from "@/components/Modal";
import {
  Badge,
  Campo,
  Input,
  Select,
  StatCard,
  Textarea,
  btnNeutro,
  btnPrimario,
} from "@/components/ui-kit";
import { formatoMoneda, type Servicio } from "@/lib/mock-data";
import {
  useAlternarServicio,
  useCrearServicio,
  useEditarServicio,
  useServicios,
} from "@/lib/queries";

export const Route = createFileRoute("/servicios")({
  head: () => ({
    meta: [
      { title: "Servicios y precios — Roshan Masajes" },
      {
        name: "description",
        content:
          "Catálogo de masajes de Roshan: duración, precio y disponibilidad de cada servicio.",
      },
      { property: "og:title", content: "Servicios y precios — Roshan Masajes" },
      {
        property: "og:description",
        content: "Duración, precio y estado de cada masaje del estudio Roshan.",
      },
    ],
  }),
  component: Servicios,
});

const vacio: Omit<Servicio, "id"> = {
  nombre: "",
  precio: 25000,
  duracion: 60,
  descripcion: "",
  activo: true,
};

function Servicios() {
  const { data: servicios = [] } = useServicios();
  const crearServicio = useCrearServicio();
  const editarServicio = useEditarServicio();
  const alternarServicio = useAlternarServicio();
  const [editando, setEditando] = useState<Servicio | "nuevo" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const activos = servicios.filter((s) => s.activo);
  const promedio = activos.length
    ? Math.round(activos.reduce((a, s) => a + s.precio, 0) / activos.length)
    : 0;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Catálogo del estudio"
        title="Servicios"
        description="Duración, precio y disponibilidad. Los servicios inactivos no se ofrecen al agendar."
        actions={
          <button className={btnPrimario} onClick={() => setEditando("nuevo")}>
            <Plus className="h-4 w-4" /> Nuevo servicio
          </button>
        }
      />

      <div className="grid gap-5 md:grid-cols-3">
        <StatCard label="Servicios activos" valor={String(activos.length)} />
        <StatCard label="Precio promedio" valor={formatoMoneda(promedio)} />
        <StatCard
          label="Inactivos"
          valor={String(servicios.length - activos.length)}
          detalle="No se ofrecen al agendar"
        />
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {servicios.map((s) => (
          <article
            key={s.id}
            className={`panel-luxe flex flex-col rounded-xl p-6 ${s.activo ? "" : "opacity-60"}`}
          >
            <div className="flex items-start justify-between gap-3">
              <h2 className="font-display text-2xl leading-tight">{s.nombre}</h2>
              <Badge tono={s.activo ? "verde" : "neutro"}>{s.activo ? "Activo" : "Inactivo"}</Badge>
            </div>

            <p className="mt-3 text-sm text-muted-foreground">{s.descripcion}</p>

            <div className="mt-5 flex items-end justify-between">
              <p className="font-display text-3xl text-primary">{formatoMoneda(s.precio)}</p>
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="h-3.5 w-3.5" /> {s.duracion} min
              </p>
            </div>

            <div className="mt-5 flex gap-2 border-t border-border/50 pt-4">
              <button className={`${btnNeutro} flex-1`} onClick={() => setEditando(s)}>
                <Pencil className="h-3.5 w-3.5" /> Editar
              </button>
              <button
                className={`${btnNeutro} flex-1 ${s.activo ? "hover:text-status-danger" : "hover:text-status-success"}`}
                onClick={() => alternarServicio.mutate({ id: s.id, activo: s.activo })}
              >
                <Power className="h-3.5 w-3.5" /> {s.activo ? "Desactivar" : "Activar"}
              </button>
            </div>
          </article>
        ))}
      </div>

      {error ? <p className="text-sm text-status-danger">{error}</p> : null}

      {editando ? (
        <ServicioFormModal
          servicio={editando === "nuevo" ? null : editando}
          onClose={() => setEditando(null)}
          onGuardar={async (datos) => {
            setError(null);
            try {
              if (editando === "nuevo") await crearServicio.mutateAsync(datos);
              else await editarServicio.mutateAsync({ id: editando.id, datos });
              setEditando(null);
            } catch (e) {
              setError(e instanceof Error ? e.message : "No se pudo guardar el servicio");
            }
          }}
        />
      ) : null}
    </div>
  );
}

function ServicioFormModal({
  servicio,
  onClose,
  onGuardar,
}: {
  servicio: Servicio | null;
  onClose: () => void;
  onGuardar: (datos: Omit<Servicio, "id">) => void | Promise<void>;
}) {
  const [form, setForm] = useState<Omit<Servicio, "id">>(
    servicio
      ? {
          nombre: servicio.nombre,
          precio: servicio.precio,
          duracion: servicio.duracion,
          descripcion: servicio.descripcion,
          activo: servicio.activo,
        }
      : vacio,
  );

  const puede = form.nombre.trim().length > 0 && form.precio > 0;

  return (
    <Modal
      abierto
      eyebrow="Servicios"
      titulo={servicio ? "Editar servicio" : "Nuevo servicio"}
      onClose={onClose}
      footer={
        <>
          <button className={btnNeutro} onClick={onClose}>
            Cancelar
          </button>
          <button className={btnPrimario} disabled={!puede} onClick={() => void onGuardar(form)}>
            Guardar servicio
          </button>
        </>
      }
    >
      <Campo label="Nombre">
        <Input
          value={form.nombre}
          onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
        />
      </Campo>

      <div className="grid grid-cols-2 gap-4">
        <Campo label="Precio">
          <Input
            type="number"
            min={0}
            step={500}
            value={form.precio}
            onChange={(e) => setForm((f) => ({ ...f, precio: Number(e.target.value) }))}
          />
        </Campo>
        <Campo label="Duración">
          <Select
            value={form.duracion}
            onChange={(e) => setForm((f) => ({ ...f, duracion: Number(e.target.value) }))}
          >
            <option value={30}>30 min</option>
            <option value={60}>60 min</option>
            <option value={90}>90 min</option>
            <option value={120}>120 min</option>
          </Select>
        </Campo>
      </div>

      <Campo label="Descripción">
        <Textarea
          rows={3}
          value={form.descripcion}
          onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))}
        />
      </Campo>

      {servicio ? null : (
        <p className="text-xs text-muted-foreground">
          El servicio se crea activo. Para desactivarlo, usá el botón "Desactivar" de su tarjeta.
        </p>
      )}
    </Modal>
  );
}
