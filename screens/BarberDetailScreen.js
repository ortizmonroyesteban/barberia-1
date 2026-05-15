import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import DatePicker from "../components/DatePicker";

const iniciales = (nombre) =>
  nombre.split(" ").map(p => p[0]).join("").slice(0, 2).toUpperCase();

export default function BarberDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { barbero } = route.params;

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const maxDate = new Date(hoy);
  maxDate.setDate(maxDate.getDate() + 7);

  const toLocalDateStr = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  const formatDate = (d) => {
    const diaSemana = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"][d.getDay()];
    const mes = String(d.getMonth() + 1).padStart(2, "0");
    const dia = String(d.getDate()).padStart(2, "0");
    return `${diaSemana} ${dia}/${mes}`;
  };

  const [fechaSeleccionada, setFechaSeleccionada] = useState(toLocalDateStr(hoy));

  const handleDateChange = (fecha) => {
    setFechaSeleccionada(fecha);
    navigation.navigate("TimeSlot", { barbero, fecha });
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Text style={styles.backText}>← Volver</Text>
      </TouchableOpacity>

      <View style={styles.hero}>
        <View style={[styles.avatar, !barbero.activo && styles.avatarInactivo]}>
          <Text style={styles.avatarText}>{iniciales(barbero.nombre)}</Text>
        </View>
        <Text style={styles.nombre}>✂️ {barbero.nombre}</Text>
        <Text style={styles.especialidad}>Barbero profesional</Text>
        {!barbero.activo && (
          <View style={styles.inactivoBadge}>
            <Text style={styles.inactivoText}>Inactivo</Text>
          </View>
        )}
      </View>

      <View style={styles.dateSection}>
        <Text style={styles.dateLabel}>Selecciona una fecha</Text>
        <DatePicker
          value={fechaSeleccionada}
          min={hoy}
          max={maxDate}
          formatDate={formatDate}
          onDateChange={handleDateChange}
        />
        <Text style={styles.dateHint}>
          Al elegir fecha verás los horarios disponibles
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#121212" },
  backBtn: { paddingHorizontal: 20, paddingTop: 50, paddingBottom: 10 },
  backText: { color: "#D4AF37", fontSize: 18, fontWeight: "bold" },
  hero: { alignItems: "center", paddingVertical: 30, marginHorizontal: 15, backgroundColor: "#1E1E1E", borderRadius: 25, marginTop: 10 },
  avatar: { width: 100, height: 100, borderRadius: 50, backgroundColor: "#2E7D32", justifyContent: "center", alignItems: "center" },
  avatarInactivo: { backgroundColor: "#555" },
  avatarText: { color: "white", fontSize: 36, fontWeight: "bold" },
  nombre: { color: "#D4AF37", fontSize: 28, fontWeight: "bold", marginTop: 15 },
  especialidad: { color: "#CCC", fontSize: 16, marginTop: 5 },
  inactivoBadge: { backgroundColor: "#555", paddingHorizontal: 15, paddingVertical: 5, borderRadius: 20, marginTop: 10 },
  inactivoText: { color: "white", fontSize: 14, fontWeight: "bold" },
  dateSection: { marginHorizontal: 15, marginTop: 25 },
  dateLabel: { color: "white", fontSize: 20, fontWeight: "bold", marginBottom: 15 },
  dateHint: { color: "#999", fontSize: 14, textAlign: "center", marginTop: 15 },
});
