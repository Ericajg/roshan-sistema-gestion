import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { ApiError, api, clearToken, getToken, setOnUnauthorized, setToken } from "./api";

export type Usuario = {
  id_usuario: number;
  usuario: string;
};

type LoginRespuesta = {
  ok: boolean;
  mensaje: string;
  token: string;
  usuario: Usuario;
};

const STORAGE_KEY_USUARIO = "roshan.usuario";

type AuthValue = {
  usuario: Usuario | null;
  listo: boolean;
  cargando: boolean;
  error: string | null;
  iniciarSesion: (usuario: string, password: string) => Promise<boolean>;
  cerrarSesion: () => void;
};

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [listo, setListo] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cerrarSesion = useCallback(() => {
    setUsuario(null);
    clearToken();
    try {
      window.localStorage.removeItem(STORAGE_KEY_USUARIO);
    } catch {
      // almacenamiento no disponible
    }
  }, []);

  // Si el backend responde 401 en cualquier pedido, cerramos la sesión acá.
  useEffect(() => {
    setOnUnauthorized(cerrarSesion);
  }, [cerrarSesion]);

  useEffect(() => {
    try {
      const token = getToken();
      const guardado = window.localStorage.getItem(STORAGE_KEY_USUARIO);
      if (token && guardado) setUsuario(JSON.parse(guardado) as Usuario);
    } catch {
      // almacenamiento no disponible
    }
    setListo(true);
  }, []);

  const iniciarSesion = useCallback(async (nombreUsuario: string, password: string) => {
    setCargando(true);
    setError(null);
    try {
      const respuesta = await api.post<LoginRespuesta>("/api/login", {
        usuario: nombreUsuario,
        contraseña: password,
      });

      setToken(respuesta.token);
      setUsuario(respuesta.usuario);
      try {
        window.localStorage.setItem(STORAGE_KEY_USUARIO, JSON.stringify(respuesta.usuario));
      } catch {
        // almacenamiento no disponible
      }
      return true;
    } catch (e) {
      const mensaje = e instanceof ApiError ? e.message : "No se pudo conectar con el servidor";
      setError(mensaje);
      return false;
    } finally {
      setCargando(false);
    }
  }, []);

  const value = useMemo(
    () => ({ usuario, listo, cargando, error, iniciarSesion, cerrarSesion }),
    [usuario, listo, cargando, error, iniciarSesion, cerrarSesion],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
}
