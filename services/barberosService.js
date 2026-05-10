import { supabase } from "../supabase";

export const obtenerBarberos = async () => {
  const { data } = await supabase
    .from("barberos")
    .select("*");

  return data;
};

export const agregarBarbero = async (
  nombre
) => {
  await supabase.from("barberos").insert([
    {
      nombre,
      activo: true,
    },
  ]);
};

export const cambiarEstadoBarbero = async (
  id,
  estado
) => {
  await supabase
    .from("barberos")
    .update({
      activo: !estado,
    })
    .eq("id", id);
};
