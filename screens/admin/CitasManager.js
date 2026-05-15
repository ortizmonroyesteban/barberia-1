import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, Alert, Platform } from "react-native";
import { supabase } from "../../supabase";
import { globalStyles } from "../../styles/globalStyles";

export default function CitasManager() {
  const [citas, setCitas] = useState([]);
  const [cargando, setCargando] = useState(false);

  useEffect(() => { cargar(); }, []);

  const cargar = async () => {
    const { data } = await supabase
      .from("citas")
      .select("*, barberos!barbero_id(nombre), sillas!silla_id(numero)")
      .order("created_at", { ascending: false });
    setCitas(data || []);
  };

  const eliminar = async (id) => {
    const confirmado =
      Platform.OS === "web"
        ? window.confirm("¿Estás seguro?")
        : await new Promise((resolve) => {
            Alert.alert("Eliminar", "¿Estás seguro?", [
              { text: "Cancelar", onPress: () => resolve(false) },
              { text: "Eliminar", onPress: () => resolve(true) },
            ]);
          });

    if (!confirmado) return;

    setCargando(true);
    const { error } = await supabase.from("citas").delete().eq("id", id);
    if (error) {
      Alert.alert("Error", "No se pudo eliminar");
      setCargando(false);
      return;
    }
    await cargar();
    setCargando(false);
  };

  return (
    <View style={globalStyles.card}>
      <Text style={globalStyles.section}>Citas agendadas</Text>
      {citas.map((c) => (
        <View key={c.id} style={globalStyles.citaCard}>
          <Text style={globalStyles.citaTexto}>👤 Cliente: {c.cliente_nombre}</Text>
          <Text style={globalStyles.citaTexto}>✂️ Barbero: {c.barberos?.nombre || "Desconocido"}</Text>
          <Text style={globalStyles.citaTexto}>💺 Silla: {c.sillas?.numero || "?"}</Text>
          <Text style={globalStyles.citaTexto}>📅 Fecha: {c.fecha}</Text>
          <Text style={globalStyles.citaTexto}>🕒 Hora: {c.hora}</Text>
          <TouchableOpacity
            style={{ backgroundColor: "red", padding: 10, borderRadius: 10, marginTop: 10 }}
            onPress={() => eliminar(c.id)}
          >
            <Text style={{ color: "white" }}>Eliminar cita</Text>
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );
}
