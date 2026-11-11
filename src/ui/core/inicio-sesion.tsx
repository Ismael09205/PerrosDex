import { StyleSheet, View } from 'react-native';

import { Boton } from './boton';
import { useEntrenador } from './entrenador-view-model';
import { colores, espacio } from './tema';
import { Texto } from './texto';

// Reemplaza al formulario del apodo: ya no se escribe un nombre, se entra
// con una cuenta de Google y Supabase garantiza que eres tú.
export function InicioSesion() {
  const { iniciarSesion, entrando, error } = useEntrenador();

  return (
    <View style={estilos.caja}>
      <Texto variante="subtitulo">¿Quién eres, entrenador?</Texto>
      <Texto variante="nota">
        Entra con tu cuenta de Google. Tus capturas quedan a tu nombre y nadie más
        puede registrar perros por ti.
      </Texto>
      {error && <Texto style={{ color: colores.alerta }}>{error}</Texto>}
      <Boton titulo="Entrar con Google" onPress={iniciarSesion} cargando={entrando} />
    </View>
  );
}

const estilos = StyleSheet.create({
  caja: { gap: espacio.m, padding: espacio.l },
});
