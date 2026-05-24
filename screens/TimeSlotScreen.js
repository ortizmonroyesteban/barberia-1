import React, { useEffect, useState, useMemo, useCallback } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { supabase } from "../supabase";
import { obtenerHorarios } from "../services/horarioService";

const diasSemana = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

export default function TimeSlotScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { barbero, sillaId, sillaNum, fecha, fechaObj } = route.params;
  const [citas, setCitas] = useState([]);
  const [horarios, setHorarios] = useState({});
  const [cargando, setCargando] = useState(true);

  const cargarCitas = useCallback(async () => {
    if (!barbero) return;
    try {
      const [citasRes, horariosData] = await Promise.all([
        supabase
          .from("citas")
          .select("hora")
          .eq("barbero_id", barbero.id)
          .eq("fecha", fecha)
          .in("estado", ["pendiente", "confirmada"]),
        obtenerHorarios(barbero.id),
      ]);
      setCitas(citasRes.data || []);
      setHorarios(horariosData);
    } catch (_) {
      setCitas([]);
      setHorarios({});
    }
    setCargando(false);
  }, [barbero, fecha]);

  useEffect(() => { cargarCitas(); }, [cargarCitas]);

  useEffect(() => {
    const channel = supabase
      .channel("timeslot-citas")
      .on("postgres_changes", { event: "*", schema: "public", table: "citas" }, cargarCitas)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [cargarCitas]);

  const slotStatus = useMemo(() => {
    const ahora = new Date();
    const hoyLocal = ahora.getFullYear() + "-" + String(ahora.getMonth() + 1).padStart(2, "0") + "-" + String(ahora.getDate()).padStart(2, "0");
    const horaActual = ahora.toTimeString().slice(0, 5);
    const diaNombre = fechaObj ? diasSemana[fechaObj.getDay()] : diasSemana[new Date(fecha + "T12:00:00").getDay()];
    const horarioDia = horarios[diaNombre];
    const barberoTrabaja = horarioDia?.active;

    if (!barberoTrabaja || !horarioDia?.inicio || !horarioDia?.fin) return [];

    const [hInicio, mInicio] = horarioDia.inicio.split(":").map(Number);
    const [hFin, mFin] = horarioDia.fin.split(":").map(Number);
    const inicioMinutos = hInicio * 60 + mInicio;
    const finMinutos = hFin * 60 + mFin;
    const ocupadas = new Set(citas.map(c => c.hora?.slice(0, 5)));

    const resultado = [];
    for (let m = inicioMinutos; m < finMinutos; m += 60) {
      const hh = String(Math.floor(m / 60)).padStart(2, "0");
      const mm = String(m % 60).padStart(2, "0");
      const horaStr = `${hh}:${mm}`;
      const ocupada = ocupadas.has(horaStr);
      const pasada = fecha === hoyLocal && horaStr <= horaActual;
      resultado.push({ hora: horaStr, ocupada, pasada, disponible: !ocupada && !pasada });
    }
    return resultado;
  }, [citas, fecha, horarios, fechaObj]);

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Text style={styles.backText}>← Volver</Text>
      </TouchableOpacity>

      <View style={styles.header}>
        <Text style={styles.headerTitle}>{barbero?.nombre || "Barbero"}</Text>
        <Text style={styles.headerDate}>{fecha}</Text>
      </View>

      {cargando ? (
        <Text style={styles.loading}>Cargando horarios...</Text>
      ) : slotStatus.length === 0 ? (
        <Text style={styles.loading}>No hay horarios disponibles este día</Text>
      ) : (
        <View style={styles.grid}>
            {slotStatus.map(slot => (
              <TouchableOpacity
                key={slot.hora}
                style={[styles.slot, {
                  backgroundColor: slot.disponible ? "#4CAF50" : "#9E9E9E",
                  opacity: slot.disponible ? 1 : 0.6,
                }]}
                disabled={!slot.disponible}
                onPress={() =>
                  navigation.navigate("Booking", {
                    barbero, sillaId, sillaNum, fecha, hora: slot.hora, fechaObj,
                  })
                }
              >
                <Text style={styles.slotText}>{slot.hora.slice(0, 5)}</Text>
                <Text style={styles.slotSub}>
                  {slot.disponible ? "Disponible" : slot.pasada ? "Pasado" : "Ocupado"}
                </Text>
              </TouchableOpacity>
            ))}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1A1A2E" },
  backBtn: { paddingHorizontal: 20, paddingBottom: 10 },
  backText: { color: "#C8962A", fontSize: 18, fontWeight: "bold" },

  header: { alignItems: "center", paddingVertical: 15, marginHorizontal: 15, backgroundColor: "#1E1E1E", borderRadius: 20, elevation: 3, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4 },
  headerTitle: { color: "white", fontSize: 22, fontWeight: "bold" },
  headerDate: { color: "#C8962A", fontSize: 16, marginTop: 4 },
  loading: { color: "#999", textAlign: "center", fontSize: 16, marginTop: 40 },

  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", paddingHorizontal: 15, paddingVertical: 20 },
  slot: { width: "31%", paddingVertical: 20, borderRadius: 16, alignItems: "center", marginBottom: 12, elevation: 2, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.15, shadowRadius: 3 },
  slotText: { color: "white", fontSize: 16, fontWeight: "bold" },
  slotSub: { color: "rgba(255,255,255,0.7)", fontSize: 11, marginTop: 4 },
});
