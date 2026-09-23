// Cliente HTTP para la API Flask. Agrega el token JWT a cada pedido y
// centraliza el manejo de errores (401 = sesión vencida, resto = mensaje
// del backend en `mensaje`).

// Si no se fija VITE_API_URL a mano, se deduce el backend a partir de cómo
// se accedió al frontend (mismo host, puerto 5000) — así funciona igual
// desde la PC (localhost) o desde el celular por IP, sin tocar nada cuando
// cambia la red.
const API_URL =
  (import.meta.env["VITE_API_URL"] as string | undefined) ??
  `http://${typeof window !== "undefined" ? window.location.hostname : "localhost"}:5000`;
const TOKEN_KEY = "roshan.token";

export function getToken() {
  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string) {
  try {
    window.localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // almacenamiento no disponible
  }
}

export function clearToken() {
  try {
    window.localStorage.removeItem(TOKEN_KEY);
  } catch {
    // almacenamiento no disponible
  }
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, mensaje: string) {
    super(mensaje);
    this.status = status;
  }
}

type Unauthorized = () => void;
let onUnauthorized: Unauthorized | null = null;

/** El AuthProvider se registra acá para poder cerrar sesión ante un 401. */
export function setOnUnauthorized(fn: Unauthorized) {
  onUnauthorized = fn;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> | undefined),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, { ...options, headers });
  } catch {
    throw new ApiError(0, "No se pudo conectar con el servidor");
  }

  const datos = await res.json().catch(() => null);

  if (res.status === 401 && token) {
    // Había un token y lo rechazó: la sesión venció, no una contraseña mal escrita.
    clearToken();
    onUnauthorized?.();
    throw new ApiError(401, "La sesión expiró, iniciá sesión de nuevo");
  }

  if (!res.ok) {
    throw new ApiError(res.status, datos?.mensaje ?? "Ocurrió un error inesperado");
  }

  return datos as T;
}

function conBody(method: string, body?: unknown): RequestInit {
  return body !== undefined ? { method, body: JSON.stringify(body) } : { method };
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) => request<T>(path, conBody("POST", body)),
  put: <T>(path: string, body?: unknown) => request<T>(path, conBody("PUT", body)),
  patch: <T>(path: string, body?: unknown) => request<T>(path, conBody("PATCH", body)),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};
