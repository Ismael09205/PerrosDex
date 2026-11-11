// Quien juega: una cuenta de Google o, como plan B, un apodo (cuenta
// anónima). Las dos son cuentas de Supabase Auth. El id es el que manda:
// dos personas pueden llamarse igual, pero nunca tener el mismo id.
export type Entrenador = {
  id: string;
  apodo: string;
  email: string | null;
};
