// Supabase guarda la sesión en localStorage, que React Native no trae.
// expo-sqlite lo provee: así el login sobrevive a cerrar la app.
import 'expo-sqlite/localStorage/install';

import { createClient } from '@supabase/supabase-js';
import { AppState } from 'react-native';

import { env } from './env';

// Service: envuelve una fuente de datos externa y nada más.
// No guarda estado ni transforma datos; eso le toca al repositorio.
export const supabase = createClient(env.supabaseUrl, env.supabaseKey, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
    // En el teléfono la URL de vuelta del login la procesamos a mano.
    detectSessionInUrl: false,
    // PKCE: Google devuelve un código de un solo uso en vez de los tokens.
    flowType: 'pkce',
  },
});

// El token solo se renueva mientras la app está al frente; en segundo
// plano el temporizador de JavaScript no es confiable.
AppState.addEventListener('change', (estado) => {
  if (estado === 'active') supabase.auth.startAutoRefresh();
  else supabase.auth.stopAutoRefresh();
});

export function urlPublica(ruta: string): string {
  return supabase.storage.from(env.bucket).getPublicUrl(ruta).data.publicUrl;
}

export async function subirImagen(ruta: string, bytes: ArrayBuffer): Promise<void> {
  const { error } = await supabase.storage
    .from(env.bucket)
    .upload(ruta, bytes, { contentType: 'image/jpeg', upsert: false });
  if (error) throw new Error(`No se pudo subir la foto: ${error.message}`);
}
