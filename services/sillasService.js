import { supabase } from "../supabase";

export const obtenerSillas = async () => {
  const { data, error } = await supabase
    .from("sillas")
    .select("id, numero, estado")
    .order("numero");

  if (error) {
    console.log(error);
    return [];
  }

  return data;
};

export const obtenerSillasConBarbero = async () => {
  const [sillasRes, asigRes, barberosRes] = await Promise.all([
    supabase.from("sillas").select("id, numero, estado").order("numero"),
    supabase.from("barbero_sillas").select("silla_id, barbero_id"),
    supabase.from("barberos").select("id, nombre, activo, admin_activo"),
  ]);

  const sillas = sillasRes.data || [];
  const asignaciones = asigRes.data || [];
  const barberos = barberosRes.data || [];

  return sillas
    .map(silla => {
      const asig = asignaciones.find(a => a.silla_id === silla.id);
      const barbero = asig ? barberos.find(b => b.id === asig.barbero_id) : null;
      return { ...silla, barbero: barbero || null };
    })
    .filter(s => !s.barbero || (s.barbero.admin_activo && s.barbero.activo));
};
