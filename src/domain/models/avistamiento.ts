export type Avistamiento = {
  id: string;
  perroId: string;
  nombrePerro: string;
  // Quién lo capturó. El id identifica; el apodo solo se muestra.
  entrenadorId: string | null;
  apodo: string;
  fotoUrl: string;
  latitud: number;
  longitud: number;
  creadoEn: string;
};
