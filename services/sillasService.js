import { supabase } from "../supabase";

export const obtenerSillas = async () => {
  const { data, error } = await supabase
    .from("sillas")
    .select("*")
    .order("numero");

  if (error) {
    console.log(error);
    return [];
  }

  return data;
};
