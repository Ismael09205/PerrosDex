import type { User } from '@supabase/supabase-js';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';

import type { Entrenador } from '@/domain/models/entrenador';

import { supabase } from '../services/supabase-service';

// Solo hace algo en la web: cierra la ventana emergente del login cuando
// Google vuelve a la app. En Android e iOS no hace nada.
WebBrowser.maybeCompleteAuthSession();

// El "entrenador" ahora es una cuenta de Google verificada por Supabase Auth.
// Hacia arriba se sigue entregando un modelo de dominio: ninguna pantalla
// sabe que existen Google, tokens ni sesiones.

// Mismas reglas que el CHECK de la columna avistamientos.apodo: 3 a 20
// caracteres, sin espacios. El nombre de Google se adapta a esas reglas.
function apodoDesde(usuario: User): string {
  const datos = usuario.user_metadata ?? {};
  const candidatos = [
    // Si entró con apodo (cuenta anónima), ese manda.
    datos.apodo,
    datos.full_name,
    datos.name,
    usuario.email?.split('@')[0],
  ].filter((v): v is string => typeof v === 'string');

  for (const candidato of candidatos) {
    const limpio = candidato
      .trim()
      .replace(/\s+/g, '_')
      .replace(/[^a-zA-Z0-9_ñÑáéíóúÁÉÍÓÚ-]/g, '')
      .slice(0, 20);
    if (limpio.length >= 3) return limpio;
  }
  return 'entrenador';
}

function aDominio(usuario: User): Entrenador {
  return { id: usuario.id, apodo: apodoDesde(usuario), email: usuario.email ?? null };
}

export const entrenadorRepository = {
  async obtenerActual(): Promise<Entrenador | null> {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw new Error(`No se pudo leer la sesión: ${error.message}`);
    return data.session ? aDominio(data.session.user) : null;
  },

  // Avisa cada vez que alguien entra, sale o se renueva la sesión.
  // Devuelve la función para dejar de escuchar.
  escucharCambios(alCambiar: (entrenador: Entrenador | null) => void): () => void {
    const { data } = supabase.auth.onAuthStateChange((_evento, sesion) => {
      alCambiar(sesion ? aDominio(sesion.user) : null);
    });
    return () => data.subscription.unsubscribe();
  },

  // Devuelve null si la persona cerró la ventana de Google sin entrar.
  async iniciarSesionConGoogle(): Promise<Entrenador | null> {
    // En un development build esto es poliperrodex://; en Expo Go, exp://…
    // Esa URL debe estar en Supabase > Authentication > URL Configuration.
    const redirectTo = Linking.createURL('/');
    console.log(`login: redirectTo=${redirectTo}`); // TEMPORAL

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      // La app abre el navegador por su cuenta (abajo), no supabase-js.
      options: { redirectTo, skipBrowserRedirect: true },
    });
    if (error) throw new Error(`No se pudo iniciar el login: ${error.message}`);

    const resultado = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
    console.log(`login: navegador=${resultado.type}`); // TEMPORAL
    if (resultado.type !== 'success') return null;

    const { queryParams } = Linking.parse(resultado.url);
    const errorGoogle = queryParams?.error_description ?? queryParams?.error;
    if (errorGoogle) throw new Error(`Google rechazó el login: ${String(errorGoogle)}`);

    const codigo = queryParams?.code;
    if (typeof codigo !== 'string') throw new Error('Google no devolvió el código de acceso');

    const sesion = await supabase.auth.exchangeCodeForSession(codigo);
    if (sesion.error) throw new Error(`No se pudo crear la sesión: ${sesion.error.message}`);
    return aDominio(sesion.data.user);
  },

  // Plan B sin Google: una cuenta anónima de Supabase Auth con un apodo.
  // Tiene un id real y una sesión, así que las mismas políticas de RLS la
  // protegen. Requiere activar "Allow anonymous sign-ins" en Supabase.
  async entrarConApodo(apodo: string): Promise<Entrenador> {
    const { data, error } = await supabase.auth.signInAnonymously({
      options: { data: { apodo: apodo.trim() } },
    });
    if (error) throw new Error(`No se pudo entrar con el apodo: ${error.message}`);
    if (!data.user) throw new Error('Supabase no devolvió el usuario');
    return aDominio(data.user);
  },

  async cerrarSesion(): Promise<void> {
    const { error } = await supabase.auth.signOut();
    if (error) throw new Error(`No se pudo cerrar la sesión: ${error.message}`);
  },
};
