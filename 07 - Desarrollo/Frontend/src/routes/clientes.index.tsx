import { Link, createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AlertTriangle, ChevronRight, Pencil, Plus, Search } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Modal } from "@/components/Modal";
import {
  Badge,
  Campo,
  Input,
  Textarea,
  btnNeutro,
  btnPrimario,
  StatCard,
} from "@/components/ui-kit";
import { fechaLarga, type Cliente } from "@/lib/mock-data";
import { nombreCompleto, iniciales, posiblesDuplicados } from "@/lib/store";
import { useClientes, useCrearCliente, useEditarCliente } from "@/lib/queries";

export const Route = createFileRoute("/clientes/")({
  head: () => ({
    meta: [
      { title: "Clientes — Roshan Masajes" },
      {
        name: "description",
        content:
          "Listado de clientes de Roshan Masajes con teléfono, historial de sesiones y preferencias.",
      },
      { property: "og:title", content: "Clientes — Roshan Masajes" },
      {
        property: "og:description",
        content: "Base de clientes del estudio Roshan: contacto, historial y observaciones.",
      },
    ],
  }),
  component: Clientes,
});

const vacio = {
  nombre: "",
  apellido: "",
  telefono: "",
  email: "",
  fechaNacimiento: "",
  observaciones: "",
};

function Clientes() {
  const { data: clientes = [] } = useClientes();
  const crearCliente = useCrearCliente();
  const editarCliente = useEditarCliente();
  const [busqueda, setBusqueda] = useState("");
  const [editando, setEditando] = useState<Cliente | "nuevo" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return clientes;
    return clientes.filter((c) =>
      `${c.nombre} ${c.apellido} ${c.telefono}`.toLowerCase().includes(q),
    );
  }, [clientes, busqueda]);

  const clientesSinSesiones = clientes.filter((c) => c.sesionesRealizadas === 0).length;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Base del estudio"
        title="Clientes"
        description="Contacto, historial de sesiones y preferencias de cada persona."
        actions={
          <button className={btnPrimario} onClick={() => setEditando("nuevo")}>
            <Plus className="h-4 w-4" /> Nuevo cliente
          </button>
        }
      />

      <div className="grid gap-5 md:grid-cols-3">
        <StatCard label="Clientes registrados" valor={String(clientes.length)} />
        <StatCard
          label="Sesiones realizadas"
          valor={String(clientes.reduce((a, c) => a + c.sesionesRealizadas, 0))}
        />
        <StatCard label="Clientes sin sesiones" valor={String(clientesSinSesiones)} />
      </div>

      <label className="relative block max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por nombre, apellido o teléfono"
          className="pl-9"
        />
      </label>

      <div className="panel-luxe overflow-x-auto rounded-xl">
        <table className="w-full min-w-[960px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-[0.62rem] uppercase tracking-[0.24em] text-muted-foreground">
              <th className="px-6 py-4">Cliente</th>
              <th className="px-6 py-4">Contacto</th>
              <th className="px-6 py-4">Última sesión</th>
              <th className="px-6 py-4 text-center">Sesiones</th>
              <th className="px-6 py-4 text-center">Editar</th>
              <th className="px-6 py-4 text-center">Ficha</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.map((c) => (
              <tr
                key={c.id}
                className="border-b border-border/40 last:border-b-0 hover:bg-accent/40"
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-primary/40 font-display text-sm text-primary">
                      {iniciales(c)}
                    </span>
                    <div>
                      <p className="text-foreground">{nombreCompleto(c)}</p>
                      {c.observaciones ? (
                        <p className="mt-1 max-w-64 whitespace-normal text-xs leading-relaxed text-muted-foreground">
                          {c.observaciones}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-muted-foreground">
                  <p className="text-foreground/90">{c.telefono}</p>
                  <p className="text-xs">{c.email}</p>
                </td>
                <td className="px-6 py-4 text-muted-foreground">
                  {c.ultimaSesion ? fechaLarga(c.ultimaSesion) : "Sin sesiones"}
                </td>
                <td className="px-6 py-4 text-center">
                  <Badge tono={c.sesionesRealizadas > 0 ? "oro" : "neutro"}>
                    {c.sesionesRealizadas}
                  </Badge>
                </td>
                <td className="px-6 py-4 text-center">
                  <button
                    aria-label={`Editar ${nombreCompleto(c)}`}
                    title="Editar cliente"
                    onClick={() => setEditando(c)}
                    className="inline-flex rounded-md border border-border p-2 text-muted-foreground transition-colors hover:text-primary"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                </td>
                <td className="px-6 py-4 text-center">
                  <Link
                    to="/clientes/$clienteId"
                    params={{ clienteId: c.id }}
                    className="inline-flex items-center gap-1 rounded-md border border-primary/45 px-3 py-2 text-xs uppercase tracking-[0.18em] text-primary transition-colors hover:bg-primary/10"
                  >
                    Ficha <ChevronRight className="h-3 w-3" />
                  </Link>
                </td>
              </tr>
            ))}
            {!filtrados.length ? (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center text-muted-foreground">
                  No se encontraron clientes con ese criterio.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {error ? <p className="text-sm text-status-danger">{error}</p> : null}

      {editando ? (
        <ClienteFormModal
          cliente={editando === "nuevo" ? null : editando}
          clientesExistentes={clientes}
          onClose={() => setEditando(null)}
          onGuardar={async (datos) => {
            setError(null);
            try {
              if (editando === "nuevo") await crearCliente.mutateAsync(datos);
              else await editarCliente.mutateAsync({ id: editando.id, datos });
              setEditando(null);
            } catch (e) {
              setError(e instanceof Error ? e.message : "No se pudo guardar el cliente");
            }
          }}
        />
      ) : null}
    </div>
  );
}

export function ClienteFormModal({
  cliente,
  clientesExistentes = [],
  onClose,
  onGuardar,
}: {
  cliente: Cliente | null;
  clientesExistentes?: Cliente[];
  onClose: () => void;
  onGuardar: (datos: Omit<Cliente, "id">) => void | Promise<void>;
}) {
  const [form, setForm] = useState<Omit<Cliente, "id">>(
    cliente
      ? {
          nombre: cliente.nombre,
          apellido: cliente.apellido,
          telefono: cliente.telefono,
          email: cliente.email,
          fechaNacimiento: cliente.fechaNacimiento,
          observaciones: cliente.observaciones,
        }
      : vacio,
  );

  const set = (campo: keyof typeof form) => (valor: string) =>
    setForm((f) => ({ ...f, [campo]: valor }));

  const puede = form.nombre.trim() && form.apellido.trim() && form.telefono.trim();

  // RF-02 / RN-02: avisar si hay un cliente parecido, sin bloquear la carga.
  const duplicados = posiblesDuplicados(form, clientesExistentes, cliente?.id);

  return (
    <Modal
      abierto
      eyebrow="Clientes"
      titulo={cliente ? "Editar cliente" : "Nuevo cliente"}
      onClose={onClose}
      footer={
        <>
          <button className={btnNeutro} onClick={onClose}>
            Cancelar
          </button>
          <button className={btnPrimario} disabled={!puede} onClick={() => void onGuardar(form)}>
            Guardar cliente
          </button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo label="Nombre *">
          <Input required value={form.nombre} onChange={(e) => set("nombre")(e.target.value)} />
        </Campo>
        <Campo label="Apellido *">
          <Input required value={form.apellido} onChange={(e) => set("apellido")(e.target.value)} />
        </Campo>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Campo label="Teléfono *">
          <Input required value={form.telefono} onChange={(e) => set("telefono")(e.target.value)} />
        </Campo>
        <Campo label="Fecha de nacimiento">
          <Input
            type="date"
            value={form.fechaNacimiento}
            onChange={(e) => set("fechaNacimiento")(e.target.value)}
          />
        </Campo>
      </div>

      {duplicados.length ? (
        <div className="rounded-md border border-status-warning/50 bg-status-warning/10 px-4 py-3">
          <p className="flex items-center gap-2 text-xs text-status-warning">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
            Ya existe{duplicados.length > 1 ? "n" : ""} un cliente parecido. Revisá antes de crear
            uno nuevo:
          </p>
          <ul className="mt-2 space-y-1">
            {duplicados.map((d) => (
              <li key={d.id}>
                <Link
                  to="/clientes/$clienteId"
                  params={{ clienteId: d.id }}
                  onClick={onClose}
                  className="text-xs text-primary underline underline-offset-2"
                >
                  {nombreCompleto(d)} · {d.telefono}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <Campo label="Email">
        <Input type="email" value={form.email} onChange={(e) => set("email")(e.target.value)} />
      </Campo>

      <Campo label="Observaciones" hint="Preferencias, alergias, presión, aromas.">
        <Textarea
          rows={3}
          value={form.observaciones}
          onChange={(e) => set("observaciones")(e.target.value)}
        />
      </Campo>
    </Modal>
  );
}
