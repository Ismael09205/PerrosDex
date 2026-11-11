import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import { entrenadorRepository } from '@/data/repositories/entrenador-repository';
import type { Entrenador } from '@/domain/models/entrenador';

// Es un ViewModel compartido: al entrenador lo necesitan la Pokédex, la
// captura y el perfil. Por eso vive en un contexto de React y no en una
// sola pantalla. No sabe nada de Google ni de tokens: solo pide al
// repositorio y expone lo que la interfaz necesita.
type EstadoEntrenador = {
  entrenador: Entrenador | null;
  // false mientras se lee la sesión guardada; evita mostrar el botón de
  // login un instante y esconderlo enseguida.
  listo: boolean;
  entrando: boolean;
  error: string | null;
  iniciarSesion: () => void;
  cerrarSesion: () => void;
};

const EntrenadorContext = createContext<EstadoEntrenador | null>(null);

export function EntrenadorProvider({ children }: { children: ReactNode }) {
  const [entrenador, setEntrenador] = useState<Entrenador | null>(null);
  const [listo, setListo] = useState(false);
  const [entrando, setEntrando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    entrenadorRepository
      .obtenerActual()
      .then(setEntrenador)
      .catch(() => setEntrenador(null))
      .finally(() => setListo(true));
    // Si la sesión vence o se cierra, todas las pantallas se enteran.
    return entrenadorRepository.escucharCambios(setEntrenador);
  }, []);

  async function iniciarSesion() {
    setEntrando(true);
    setError(null);
    try {
      const nuevo = await entrenadorRepository.iniciarSesionConGoogle();
      if (nuevo) setEntrenador(nuevo);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo iniciar sesión');
    } finally {
      setEntrando(false);
    }
  }

  async function cerrarSesion() {
    try {
      await entrenadorRepository.cerrarSesion();
      setEntrenador(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo cerrar la sesión');
    }
  }

  return (
    <EntrenadorContext.Provider
      value={{ entrenador, listo, entrando, error, iniciarSesion, cerrarSesion }}>
      {children}
    </EntrenadorContext.Provider>
  );
}

export function useEntrenador(): EstadoEntrenador {
  const valor = useContext(EntrenadorContext);
  if (!valor) throw new Error('useEntrenador debe usarse dentro de <EntrenadorProvider>');
  return valor;
}
