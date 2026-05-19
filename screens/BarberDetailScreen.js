import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, Alert, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import DatePicker from "../components/DatePicker";
import { obtenerHorarios } from "../services/horarioService";

const DIAS_LABEL = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

const iniciales = (nombre) =>
  nombre.split(" ").map(p => p[0]).join("").slice(0, 2).toUpperCase();

export default function BarberDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { silla, barbero } = route.params;

  const [horarios, setHorarios] = useState([]);
  const [diasActivos, setDiasActivos] = useState([]);

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
    const diaSemana = DIAS_LABEL[d.getDay()];
    const mes = String(d.getMonth() + 1).padStart(2, "0");
    const dia = String(d.getDate()).padStart(2, "0");
    return `${diaSemana} ${dia}/${mes}`;
  };

  const [fechaSeleccionada, setFechaSeleccionada] = useState(toLocalDateStr(hoy));

  useEffect(() => {
    obtenerHorarios(barbero.id).then(h => {
      setHorarios(h);
      const activos = h.filter(hh => hh.inicio !== hh.fin).map(hh => hh.dia);
      setDiasActivos(activos);
    });
  }, [barbero.id]);

  const esDiaActivo = (date) => {
    const diaSemana = String(date.getDay());
    return diasActivos.includes(diaSemana);
  };

  const handleDateChange = (fechaStr) => {
    const parts = fechaStr.split("-");
    const dateObj = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    if (!esDiaActivo(dateObj)) {
      Alert.alert("No disponible", "El barbero no trabaja ese día. Selecciona otra fecha.");
      return;
    }
    setFechaSeleccionada(fechaStr);
    navigation.navigate("TimeSlot", { silla, barbero, fecha: fechaStr });
  };

  const diasTrabajo = horarios
    .filter(h => h.inicio !== h.fin)
    .map(h => h.label)
    .join(", ");

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Text style={styles.backText}>← Volver</Text>
      </TouchableOpacity>

      <View style={styles.hero}>
        <View style={[styles.avatar, !barbero.activo && styles.avatarInactivo]}>
          <Text style={styles.avatarText}>{iniciales(barbero.nombre)}</Text>
        </View>
        <Text style={styles.nombre}>{barbero.nombre}</Text>
        <Text style={styles.especialidad}>Barbero profesional</Text>
        <Text style={styles.sillaInfo}>Silla {silla.numero}</Text>
        {!barbero.activo && (
          <View style={styles.inactivoBadge}>
            <Text style={styles.inactivoText}>Inactivo</Text>
          </View>
        )}
      </View>

      <View style={styles.dateSection}>
        <Text style={styles.dateLabel}>Selecciona una fecha</Text>
        {diasTrabajo ? (
          <Text style={styles.diasTrabajo}>Días de atención: {diasTrabajo}</Text>
        ) : null}
        <DatePicker
          value={fechaSeleccionada}
          min={hoy}
          max={maxDate}
          formatDate={formatDate}
          onDateChange={handleDateChange}
        />
        <Text style={styles.dateHint}>
          Solo se muestran fechas con horario activo
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#121212" },
  backBtn: { paddingHorizontal: 20, paddingBottom: 10 },
  backText: { color: "#D4AF37", fontSize: 18, fontWeight: "bold" },
  hero: { alignItems: "center", paddingVertical: 30, marginHorizontal: 15, backgroundColor: "#1E1E1E", borderRadius: 25, marginTop: 10 },
  avatar: { width: 100, height: 100, borderRadius: 50, backgroundColor: "#2E7D32", justifyContent: "center", alignItems: "center" },
  avatarInactivo: { backgroundColor: "#555" },
  avatarText: { color: "white", fontSize: 36, fontWeight: "bold" },
  nombre: { color: "#D4AF37", fontSize: 28, fontWeight: "bold", marginTop: 15 },
  especialidad: { color: "#CCC", fontSize: 16, marginTop: 5 },
  sillaInfo: { color: "#888", fontSize: 14, marginTop: 5 },
  inactivoBadge: { backgroundColor: "#555", paddingHorizontal: 15, paddingVertical: 5, borderRadius: 20, marginTop: 10 },
  inactivoText: { color: "white", fontSize: 14, fontWeight: "bold" },
  dateSection: { marginHorizontal: 15, marginTop: 25 },
  dateLabel: { color: "white", fontSize: 20, fontWeight: "bold", marginBottom: 5 },
  diasTrabajo: { color: "#4CAF50", fontSize: 14, marginBottom: 15 },
  dateHint: { color: "#999", fontSize: 14, textAlign: "center", marginTop: 15 },
});
