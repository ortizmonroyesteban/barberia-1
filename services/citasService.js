import { supabase } from "../supabase";

export const registrarCita = async ({
  clienteNombre,
  sillaId,
  barberoId,
  fecha,
  hora,
  telefono,
}) => {
  const { data: dup, error: dupErr } = await supabase
    .from("citas")
    .select("id")
    .eq("barbero_id", barberoId)
    .eq("fecha", fecha)
    .eq("hora", hora)
    .in("estado", ["pendiente", "confirmada"])
    .limit(1);

  if (dupErr) return false;
  if (dup && dup.length > 0) return false;

  const payload = {
    cliente_nombre: clienteNombre,
    silla_id: sillaId,
    barbero_id: barberoId,
    fecha,
    hora: hora?.slice(0, 5),
  };

  payload.telefono = telefono || null;
  payload.estado = "pendiente";

  const { error } = await supabase.from("citas").insert([payload]);

  if (error) { return false; }

  return true;
};

export const obtenerCitasPorBarberoYFecha = async (barberoId, fecha) => {
  const { data, error } = await supabase
    .from("citas")
    .select("hora")
    .eq("barbero_id", barberoId)
    .eq("fecha", fecha)
    .in("estado", ["pendiente", "confirmada"]);

  if (error) { return []; }

  return data.map(c => c.hora?.slice(0, 5));
};
