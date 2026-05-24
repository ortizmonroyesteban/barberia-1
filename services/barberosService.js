import { supabase } from "../supabase";

export const obtenerBarberos = async () => {
  const { data, error } = await supabase
    .from("barberos")
    .select("id, nombre, activo, admin_activo, especialidad, foto_url")
    .order("nombre");

  if (error) return [];

  return data;
};
