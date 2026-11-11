import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { Boton } from './boton';
import { useEntrenador } from './entrenador-view-model';
import { colores, espacio, radio } from './tema';
import { Texto } from './texto';

// Mismas reglas que el CHECK de la tabla avistamientos. Validar aquí no
// sobra: la app da un mensaje claro y la base de datos protege los datos
// si alguien llama a la API sin pasar por la app.
function validarApodo(texto: string): string | null {
  const apodo = texto.trim();
  if (apodo.length < 3) return 'El apodo debe tener al menos 3 caracteres';
  if (apodo.length > 20) return 'El apodo no puede pasar de 20 caracteres';
  if (!/^[a-zA-Z0-9_ñÑáéíóúÁÉÍÓÚ-]+$/.test(apodo)) {
    return 'Usa solo letras, números, guion o guion bajo (sin espacios)';
  }
  return null;
}

// Dos formas de entrar: con Google (la principal) o con un apodo (plan B,
// por ejemplo si en una demo el login de Google no está disponible).
export function InicioSesion() {
  const { iniciarSesion, entrarConApodo, entrando, error } = useEntrenador();
  const [texto, setTexto] = useState('');
  const [errorApodo, setErrorApodo] = useState<string | null>(null);

  function confirmarApodo() {
    const problema = validarApodo(texto);
    if (problema) {
      setErrorApodo(problema);
      return;
    }
    entrarConApodo(texto);
  }

  return (
    <View style={estilos.caja}>
      <Texto variante="subtitulo">¿Quién eres, entrenador?</Texto>
      <Texto variante="nota">
        Entra con tu cuenta de Google. Tus capturas quedan a tu nombre y nadie más
        puede registrar perros por ti.
      </Texto>
      {error && <Texto style={{ color: colores.alerta }}>{error}</Texto>}
      <Boton titulo="Entrar con Google" onPress={iniciarSesion} cargando={entrando} />

      <View style={estilos.separador}>
        <View style={estilos.linea} />
        <Texto variante="nota">o usa un apodo</Texto>
        <View style={estilos.linea} />
      </View>

      <TextInput
        value={texto}
        onChangeText={(valor) => {
          setTexto(valor);
          setErrorApodo(null);
        }}
        placeholder="ej. cazadora_23"
        placeholderTextColor={colores.tintaSuave}
        autoCapitalize="none"
        autoCorrect={false}
        maxLength={20}
        style={estilos.campo}
        onSubmitEditing={confirmarApodo}
      />
      {errorApodo && <Texto style={{ color: colores.alerta }}>{errorApodo}</Texto>}
      <Boton
        titulo="Entrar con apodo"
        variante="secundario"
        onPress={confirmarApodo}
        deshabilitado={entrando}
      />
    </View>
  );
}

const estilos = StyleSheet.create({
  caja: { gap: espacio.m, padding: espacio.l },
  separador: { flexDirection: 'row', alignItems: 'center', gap: espacio.s },
  linea: { flex: 1, height: 1, backgroundColor: colores.linea },
  campo: {
    borderWidth: 1.5,
    borderColor: colores.tinta,
    borderRadius: radio,
    paddingHorizontal: espacio.m,
    minHeight: 48,
    fontSize: 16,
    color: colores.tinta,
    backgroundColor: colores.blanco,
  },
});
