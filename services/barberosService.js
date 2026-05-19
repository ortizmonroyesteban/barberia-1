import { supabase } from "../supabase";

export const obtenerBarberos = async () => {
  const { data, error } = await supabase
    .from("barberos")
    .select("id, nombre, activo, especialidad")
    .order("nombre");

  if (error) {
    console.log(error);
    return [];
  }

  return data;
};
