import React, { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, Alert, StyleSheet } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { obtenerCitasPorBarberoYFecha } from "../services/citasService";
import { obtenerTodasLasAsignaciones } from "../services/barberoSillasService";
import { horas } from "../utils/horarios";

export default function TimeSlotScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { barbero, fecha } = route.params;

  const [ocupadas, setOcupadas] = useState([]);
  const [cargando, setCargando] = useState(true);

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const toLocalDateStr = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };
  const hoyLocalStr = toLocalDateStr(hoy);

  useEffect(() => {
    cargarHorarios();
  }, []);

  const cargarHorarios = async () => {
    setCargando(true);
    try {
      const citas = await obtenerCitasPorBarberoYFecha(barbero.id, fecha);
      setOcupadas(citas);
    } catch (_) {}
    setCargando(false);
  };

  const esPasada = (hora) => {
    if (fecha !== hoyLocalStr) return false;
    const ahora = new Date();
    const minutosActuales = ahora.getHours() * 60 + ahora.getMinutes();
    const [h, m] = hora.split(":").map(Number);
    return h * 60 + m <= minutosActuales;
  };

  const seleccionar = async (hora) => {
    let asignaciones;
    try {
      asignaciones = await obtenerTodasLasAsignaciones();
    } catch (_) { return; }
    const asignacion = asignaciones.find(a => a.barbero_id === barbero.id);
    const sillaId = asignacion?.silla_id;
    if (!sillaId) { Alert.alert("Sin silla", "Este barbero no tiene una silla asignada"); return; }

    navigation.navigate("Booking", {
      barbero,
      fecha,
      hora,
      sillaId,
    });
  };

  const slots = horas.map((hora) => ({
    hora,
    ocupada: ocupadas.includes(hora),
    pasada: esPasada(hora),
  }));

  const renderSlot = ({ item }) => {
    const { hora, ocupada, pasada } = item;
    const disponible = !ocupada && !pasada;
    const bgColor = disponible ? "#4CAF50" : "#9E9E9E";

    return (
      <TouchableOpacity
        style={[styles.slot, { backgroundColor: bgColor }]}
        disabled={!disponible}
        onPress={() => seleccionar(hora)}
        activeOpacity={0.7}
      >
        <Text style={styles.slotText}>{hora}</Text>
        {ocupada && <Text style={styles.slotSub}>Ocupado</Text>}
        {pasada && <Text style={styles.slotSub}>Pasado</Text>}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Text style={styles.backText}>← Cambiar fecha</Text>
      </TouchableOpacity>

      <View style={styles.header}>
        <Text style={styles.headerTitle}>✂️ {barbero.nombre}</Text>
        <Text style={styles.headerDate}>{fecha}</Text>
      </View>

      {cargando ? (
        <Text style={styles.loading}>Cargando horarios...</Text>
      ) : (
        <FlatList
          data={slots}
          keyExtractor={(item) => item.hora}
          renderItem={renderSlot}
          numColumns={3}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.grid}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#121212" },
  backBtn: { paddingHorizontal: 20, paddingTop: 50, paddingBottom: 10 },
  backText: { color: "#D4AF37", fontSize: 18, fontWeight: "bold" },
  header: { alignItems: "center", paddingVertical: 15, marginHorizontal: 15, backgroundColor: "#1E1E1E", borderRadius: 20, marginBottom: 15 },
  headerTitle: { color: "white", fontSize: 22, fontWeight: "bold" },
  headerDate: { color: "#D4AF37", fontSize: 16, marginTop: 5 },
  loading: { color: "#999", textAlign: "center", marginTop: 40, fontSize: 16 },
  grid: { paddingHorizontal: 15, paddingBottom: 30 },
  row: { justifyContent: "space-between", marginBottom: 12 },
  slot: { width: "31%", paddingVertical: 20, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  slotText: { color: "white", fontSize: 16, fontWeight: "bold" },
  slotSub: { color: "rgba(255,255,255,0.7)", fontSize: 11, marginTop: 3 },
});
