import { Accelerometer } from 'expo-sensors';
 
const UMBRAL_CAIDA_LIBRE = 0.35; // g
const DURACION_MINIMA_CAIDA_MS = 120;
const UMBRAL_IMPACTO = 2.2; // g
const VENTANA_IMPACTO_MS = 1000;
 
// Envuelve el sensor y entrega un solo evento: "hubo una caída".
// Quien lo usa no necesita saber nada de vectores ni de unidades g.
// Devuelve la función para dejar de escuchar.
export function escucharCaidas(alCaer: () => void): () => void {
  let inicioCaidaLibre: number | null = null;
  let finCaidaLibre: number | null = null;
 
  let diag = { desde: Date.now(), n: 0, total: 0, min: Infinity, max: 0 }; // TEMPORAL
  console.log('acel: escuchando caídas'); // TEMPORAL

  Accelerometer.setUpdateInterval(40);
  const suscripcion = Accelerometer.addListener(({ x, y, z }) => {
    const magnitud = Math.sqrt(x * x + y * y + z * z);
    const ahora = Date.now();
    // TEMPORAL (calibración): un resumen por segundo con el mínimo y el
    // máximo, para no perder un pico entre tantas líneas.
    diag.n++;
    if (++diag.total <= 5) console.log(`acel: lectura ${diag.total} = ${magnitud.toFixed(2)}`);
    diag.min = Math.min(diag.min, magnitud);
    diag.max = Math.max(diag.max, magnitud);
    if (ahora - diag.desde >= 1000) {
      console.log(
        `acel: ${diag.n} lecturas, min ${diag.min.toFixed(2)}, max ${diag.max.toFixed(2)}`,
      );
      diag = { ...diag, desde: ahora, n: 0, min: Infinity, max: 0 };
    }

    if (magnitud < UMBRAL_CAIDA_LIBRE) {
      inicioCaidaLibre ??= ahora;
      return;
    }
    if (inicioCaidaLibre !== null) {
      console.log(`acel: caída libre de ${ahora - inicioCaidaLibre} ms`); // TEMPORAL
      if (ahora - inicioCaidaLibre >= DURACION_MINIMA_CAIDA_MS) finCaidaLibre = ahora;
      inicioCaidaLibre = null;
    }
    if (finCaidaLibre !== null) {
      if (ahora - finCaidaLibre > VENTANA_IMPACTO_MS) finCaidaLibre = null;
      else if (magnitud > UMBRAL_IMPACTO) {
        console.log(`acel: impacto ${magnitud.toFixed(2)} g a los ${ahora - finCaidaLibre} ms`); // TEMPORAL
        finCaidaLibre = null;
        alCaer();
      }
    }
  });
 
  return () => {
    console.log('acel: dejó de escuchar'); // TEMPORAL
    suscripcion.remove();
  };
}
