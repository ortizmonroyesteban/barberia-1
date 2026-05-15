import { supabase } from "../supabase";

export const obtenerCitas = async () => {
  const { data, error } = await supabase
    .from("citas")
    .select("*")
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    console.log(error);
    return [];
  }

  return data;
};

export const registrarCita = async ({
  clienteNombre,
  sillaId,
  barberoId,
  fecha,
  hora,
  telefono,
}) => {
  const payload = {
    cliente_nombre: clienteNombre,
    silla_id: sillaId,
    barbero_id: barberoId,
    fecha,
    hora: hora?.slice(0, 5),
  };

  payload.telefono = telefono || null;

  const { error } = await supabase.from("citas").insert([payload]);

  if (error) {
    console.log(error);
    return false;
  }

  return true;
};

export const obtenerCitasPorBarberoYFecha = async (barberoId, fecha) => {
  const { data, error } = await supabase
    .from("citas")
    .select("hora")
    .eq("barbero_id", barberoId)
    .eq("fecha", fecha);

  if (error) {
    console.log(error);
    return [];
  }

  return data.map(c => c.hora?.slice(0, 5));
};
