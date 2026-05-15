import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { supabase } from "../../supabase";
import { globalStyles } from "../../styles/globalStyles";

export default function ChairManager() {
  const [sillas, setSillas] = useState([]);
  const [cargando, setCargando] = useState(false);

  useEffect(() => { cargar(); }, []);

  const cargar = async () => {
    const { data } = await supabase.from("sillas").select("*").order("numero");
    setSillas(data || []);
  };

  const agregar = async () => {
    setCargando(true);
    const maxNumero = sillas.reduce((max, s) => Math.max(max, s.numero || 0), 0);
    await supabase.from("sillas").insert([{ numero: maxNumero + 1, estado: "libre" }]);
    await cargar();
    setCargando(false);
  };

  const eliminar = async (id) => {
    setCargando(true);
    await supabase.from("sillas").delete().eq("id", id);
    await cargar();
    setCargando(false);
  };

  return (
    <View style={globalStyles.card}>
      <Text style={globalStyles.section}>Gestión de sillas</Text>
      <TouchableOpacity
        style={[globalStyles.addBtn, cargando && { opacity: 0.5 }]}
        disabled={cargando}
        onPress={agregar}
      >
        <Text style={globalStyles.addTexto}>
          {cargando ? "Agregando..." : "Agregar silla"}
        </Text>
      </TouchableOpacity>
      {sillas.map((s) => (
        <View key={s.id} style={globalStyles.barberoCard}>
          <Text style={globalStyles.barberoNombre}>💺 Silla {s.numero}</Text>
          <TouchableOpacity
            style={{ backgroundColor: "red", padding: 10, borderRadius: 10 }}
            onPress={() => eliminar(s.id)}
          >
            <Text style={{ color: "white" }}>Eliminar</Text>
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );
}
