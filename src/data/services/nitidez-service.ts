import { File } from 'expo-file-system';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { decode } from 'jpeg-js';

// Mide qué tan nítida es una foto con la varianza del Laplaciano:
// el Laplaciano resalta los bordes, y una foto movida o desenfocada casi
// no tiene bordes, así que su varianza sale baja.
//
// Se analiza una copia pequeña (256 px de ancho) porque decodificar la
// foto completa en JavaScript tardaría segundos. Para detectar una foto
// movida no hace falta más detalle.
const ANCHO_ANALISIS = 256;

export async function medirNitidez(fotoUri: string): Promise<number> {
  const imagen = await ImageManipulator.manipulate(fotoUri)
    .resize({ width: ANCHO_ANALISIS, height: null })
    .renderAsync();
  const copia = await imagen.saveAsync({ format: SaveFormat.JPEG, compress: 0.9 });

  try {
    const bytes = new Uint8Array(await new File(copia.uri).arrayBuffer());
    // useTArray: true evita el Buffer de Node, que React Native no tiene.
    const { width, height, data } = decode(bytes, { useTArray: true });
    return varianzaLaplaciano(data, width, height);
  } finally {
    // La copia era solo para medir; no se queda ocupando espacio.
    new File(copia.uri).delete();
  }
}

function varianzaLaplaciano(rgba: Uint8Array, ancho: number, alto: number): number {
  // Escala de grises con los pesos usuales de luminancia.
  const gris = new Float32Array(ancho * alto);
  for (let i = 0; i < gris.length; i++) {
    const p = i * 4;
    gris[i] = 0.299 * rgba[p] + 0.587 * rgba[p + 1] + 0.114 * rgba[p + 2];
  }

  // Laplaciano 3x3 (vecinos arriba, abajo, izquierda y derecha) sin los bordes.
  let suma = 0;
  let sumaCuadrados = 0;
  let n = 0;
  for (let y = 1; y < alto - 1; y++) {
    for (let x = 1; x < ancho - 1; x++) {
      const i = y * ancho + x;
      const l = gris[i - ancho] + gris[i + ancho] + gris[i - 1] + gris[i + 1] - 4 * gris[i];
      suma += l;
      sumaCuadrados += l * l;
      n++;
    }
  }
  const media = suma / n;
  return sumaCuadrados / n - media * media;
}
