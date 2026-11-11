// Quien juega. Antes era solo un apodo escrito a mano; ahora es una cuenta
// de Google verificada por Supabase Auth. El id es el que manda: dos
// personas pueden llamarse igual, pero nunca tener el mismo id.
export type Entrenador = {
  id: string;
  apodo: string;
  email: string | null;
};
