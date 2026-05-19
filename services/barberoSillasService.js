import { supabase } from "../supabase";

export const obtenerAsignaciones = async (barberoId) => {
  const { data } = await supabase
    .from("barbero_sillas")
    .select("silla_id")
    .eq("barbero_id", barberoId);
  return data ? data.map(a => a.silla_id) : [];
};

export const obtenerTodasLasAsignaciones = async () => {
  const { data } = await supabase.from("barbero_sillas").select("silla_id, barbero_id");
  return data || [];
};

export const asignarSilla = async (barberoId, sillaId) => {
  await supabase.from("barbero_sillas").insert([
    { barbero_id: barberoId, silla_id: sillaId }
  ]);
};

export const desasignarSilla = async (barberoId, sillaId) => {
  await supabase.from("barbero_sillas").delete()
    .eq("barbero_id", barberoId)
    .eq("silla_id", sillaId);
};
