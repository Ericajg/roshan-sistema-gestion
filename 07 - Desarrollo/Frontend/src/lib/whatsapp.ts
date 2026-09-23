// RF-24 / RF-25 / RN-17: el sistema solo prepara el mensaje y el link de
// WhatsApp — quien envía es siempre Riki, tocando el botón. No hay envío
// automático ni integración con la API de WhatsApp Business.

import { fechaLarga } from "./mock-data";

const primerNombre = (nombreCompleto: string) =>
  nombreCompleto.trim().split(/\s+/)[0] ?? nombreCompleto;

/**
 * Normaliza a formato internacional para wa.me. Asume celulares argentinos
 * guardados como "código de área + número" (ej. "1122334455"), sin el 0 ni
 * el 15 de la marcación local — que es como se cargan hoy en el sistema.
 */
export function telefonoWhatsApp(telefono: string): string {
  const digitos = telefono.replace(/\D/g, "");
  if (digitos.startsWith("54")) {
    const resto = digitos.slice(2);
    return resto.startsWith("9") ? digitos : `549${resto}`;
  }
  return `549${digitos}`;
}

export function linkWhatsApp(telefono: string, mensaje: string): string {
  return `https://wa.me/${telefonoWhatsApp(telefono)}?text=${encodeURIComponent(mensaje)}`;
}

type DatosMensajeTurno = {
  cliente: string;
  servicio: string;
  fecha: string;
  hora: string;
};

export function mensajeConfirmacionTurno(turno: DatosMensajeTurno): string {
  return (
    `Hola ${primerNombre(turno.cliente)}! Tu turno de ${turno.servicio} quedó reservado ` +
    `para el ${fechaLarga(turno.fecha)} a las ${turno.hora} hs. Cualquier cosa avisame. ` +
    `¡Gracias! - Roshan Masajes`
  );
}

export function mensajeRecordatorioTurno(turno: DatosMensajeTurno): string {
  return (
    `Hola ${primerNombre(turno.cliente)}! Te recordamos tu turno de ${turno.servicio} ` +
    `mañana ${fechaLarga(turno.fecha)} a las ${turno.hora} hs. ¡Te esperamos! - Roshan Masajes`
  );
}
