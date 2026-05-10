import { supabase } from "../supabase";

export const obtenerCitas = async () => {
  const { data } = await supabase
    .from("citas")
    .select("*")
    .order("created_at", {
      ascending: false,
    });

  return data;
};

export const registrarCita = async ({
  clienteNombre,
  sillaId,
  hora,
}) => {
  const fechaActual = new Date()
    .toISOString()
    .split("T")[0];

  const { error } = await supabase
    .from("citas")
    .insert([
      {
        cliente_nombre: clienteNombre,
        silla_id: sillaId,
        fecha: fechaActual,
        hora,
      },
    ]);

  if (error) {
    console.log(error);
    return false;
  }

  return true;
};
