import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Platform, ScrollView, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { supabase } from "../../supabase";
import DatePicker from "../../components/DatePicker";
import { fechaLocal } from "../../utils/horarios";
import { ErrorView } from "../../components/LoadingScreen";
import { useAlert } from "../../components/CustomAlert";

export default function AdminBookingsScreen() {
  const navigation = useNavigation();
  const { showAlert } = useAlert();
  const [modo, setModo] = useState("proximas");
  const [citas, setCitas] = useState([]);
  const [barberos, setBarberos] = useState([]);
  const [filtroBarbero, setFiltroBarbero] = useState(null);
  const [filtroFecha, setFiltroFecha] = useState(null);
  const [expandido, setExpandido] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const citasRef = useRef(citas);
  citasRef.current = citas;

  const cargarBarberos = useCallback(() =>
    supabase.from("barberos").select("id, nombre, telefono").order("nombre").then(({ data }) => { setBarberos(data || []); }), []);

  const cargarCitas = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const hoy = fechaLocal();
      let q = supabase.from("citas").select("id, cliente_nombre, barbero_id, fecha, hora, telefono, estado, silla_id, sillas!silla_id(numero)").order("fecha").order("hora");
      if (modo === "proximas") {
        q = q.gte("fecha", hoy).in("estado", ["pendiente", "confirmada"]);
      } else {
        q = q.or(`fecha.lt.${hoy},estado.eq.cancelada`);
      }
      if (filtroBarbero) q = q.eq("barbero_id", filtroBarbero);
      if (filtroFecha) { const d = typeof filtroFecha === "string" ? filtroFecha : fechaLocal(filtroFecha); q = q.eq("fecha", d); }
      const { data, error: err } = await q;
      if (err) throw err;
      setCitas(data || []);
    } catch (e) {
      setError(e.message || "Error al cargar citas");
    } finally {
      setCargando(false);
    }
  }, [modo, filtroBarbero, filtroFecha]);

  useEffect(() => { cargarBarberos(); cargarCitas(); }, [cargarBarberos, cargarCitas]);

  useEffect(() => {
    const channel = supabase
      .channel("admin-bookings")
      .on("postgres_changes", { event: "*", schema: "public", table: "citas" }, cargarCitas)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [cargarCitas]);

  const confirmarEliminar = (id) => {
    if (Platform.OS === "web") {
      if (window.confirm("¿Eliminar esta cita?")) ejecutarEliminar(id);
      return;
    }
    showAlert("Eliminar", "¿Eliminar esta cita?", [
      { text: "Cancelar" },
      { text: "Eliminar", onPress: () => ejecutarEliminar(id) },
    ]);
  };

  const ejecutarEliminar = useCallback(async (id) => {
    const anterior = citasRef.current;
    setCitas(prev => prev.filter(c => c.id !== id));
    try {
      const { error } = await supabase.from("citas").delete().eq("id", id);
      if (error) { setCitas(anterior); showAlert("Error", error.message); }
    } catch (_) { setCitas(anterior); }
  }, []);

  const barberoNombre = useMemo(() => {
    const m = {};
    barberos.forEach(b => { m[b.id] = b.nombre; });
    return m;
  }, [barberos]);

  const barberoTelefono = useMemo(() => {
    const m = {};
    barberos.forEach(b => { m[b.id] = b.telefono; });
    return m;
  }, [barberos]);

  const renderItem = ({ item }) => {
    const abierto = expandido === item.id;
    return (
      <TouchableOpacity activeOpacity={0.7} onPress={() => setExpandido(abierto ? null : item.id)}>
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.clienteNombre}>{item.cliente_nombre}</Text>
            <Text style={styles.citaFecha}>{item.fecha}</Text>
          </View>
          <View style={styles.estadoRow}>
            <Text style={[
              styles.estadoText,
              item.estado === "confirmada" && styles.estadoConfirmada,
              item.estado === "cancelada" && styles.estadoCancelada,
              item.estado === "pendiente" && styles.estadoPendiente,
            ]}>
              {item.estado === "confirmada" ? "✅ Confirmada" : item.estado === "cancelada" ? "❌ Cancelada" : "⏳ Pendiente"}
            </Text>
          </View>
          {abierto && (
            <View style={styles.cardDetalle}>
              <Text style={styles.detalleText}>Barbero: {barberoNombre[item.barbero_id] || "?"}</Text>
              {barberoTelefono[item.barbero_id] && <Text style={styles.detalleText}>Tel. barbero: {barberoTelefono[item.barbero_id]}</Text>}
              <Text style={styles.detalleText}>Hora: {item.hora?.slice(0, 5)}</Text>
              {item.sillas?.numero && <Text style={styles.detalleText}>Silla: {item.sillas.numero}</Text>}
              {item.telefono && <Text style={styles.detalleText}>Teléfono: {item.telefono}</Text>}
              <TouchableOpacity style={styles.deleteBtn} onPress={() => confirmarEliminar(item.id)}>
                <Text style={styles.deleteBtnText}>Eliminar</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.navigate("AdminDashboard")}>
          <Text style={styles.backText}>← Volver</Text>
        </TouchableOpacity>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Citas</Text>
      </View>

      <View style={styles.segmentRow}>
        <TouchableOpacity style={[styles.segmentBtn, modo === "proximas" && styles.segmentBtnActive]} onPress={() => setModo("proximas")}>
          <Text style={[styles.segmentText, modo === "proximas" && styles.segmentTextActive]}>Próximas</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.segmentBtn, modo === "pasadas" && styles.segmentBtnActive]} onPress={() => setModo("pasadas")}>
          <Text style={[styles.segmentText, modo === "pasadas" && styles.segmentTextActive]}>Pasadas</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.filtros}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
          <View style={{ flexDirection: "row", gap: 8 }}>
            {barberos.map(b => (
              <TouchableOpacity
                key={b.id}
                style={[styles.filtroBtn, filtroBarbero === b.id && styles.filtroBtnActive]}
                onPress={() => setFiltroBarbero(filtroBarbero === b.id ? null : b.id)}
              >
                <Text style={[styles.filtroBtnText, filtroBarbero === b.id && styles.filtroBtnTextActive]}>{b.nombre}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
        <DatePicker value={filtroFecha} onChange={setFiltroFecha} />
      </View>

      {cargando ? (
        <ActivityIndicator size="large" color="#C8962A" style={{ marginTop: 60 }} />
      ) : error ? (
        <ErrorView message={error} onRetry={cargarCitas} />
      ) : (
      <FlatList
        data={citas}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>{modo === "proximas" ? "No hay citas próximas" : "No hay citas pasadas"}</Text>}
      />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1A1A2E" },
  backBtn: { paddingHorizontal: 20, paddingVertical: 10 },
  backText: { color: "#C8962A", fontSize: 18, fontWeight: "bold" },
  header: { paddingHorizontal: 20, paddingVertical: 14, backgroundColor: "#1E1E1E", borderBottomLeftRadius: 25, borderBottomRightRadius: 25 },
  headerTitle: { color: "#C8962A", fontSize: 20, fontWeight: "bold" },

  filtros: { paddingHorizontal: 15, paddingTop: 14 },
  filtroBtn: { backgroundColor: "#333", paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20 },
  filtroBtnActive: { backgroundColor: "#4CAF50" },
  filtroBtnText: { color: "#CCC", fontWeight: "bold" },
  filtroBtnTextActive: { color: "white" },
  list: { padding: 15, paddingBottom: 30 },
  empty: { color: "#999", textAlign: "center", marginTop: 40, fontSize: 15 },

  card: { backgroundColor: "#1E1E1E", borderRadius: 15, marginBottom: 10, padding: 14 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  clienteNombre: { color: "white", fontSize: 16, fontWeight: "bold" },
  citaFecha: { color: "#C8962A", fontSize: 14, fontWeight: "bold" },
  estadoRow: { marginTop: 4 },
  estadoText: { fontSize: 13, fontWeight: "bold" },
  estadoConfirmada: { color: "#4CAF50" },
  estadoCancelada: { color: "#999" },
  estadoPendiente: { color: "#C8962A" },

  cardDetalle: { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: "#333" },
  detalleText: { color: "#CCC", fontSize: 14, marginBottom: 4 },
  deleteBtn: { backgroundColor: "#9E9E9E", padding: 10, borderRadius: 10, alignItems: "center", marginTop: 8 },
  deleteBtnText: { color: "white", fontWeight: "bold", fontSize: 14 },

  segmentRow: { flexDirection: "row", marginHorizontal: 15, marginTop: 12, backgroundColor: "#2A2A2A", borderRadius: 12, padding: 3 },
  segmentBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: "center" },
  segmentBtnActive: { backgroundColor: "#C8962A" },
  segmentText: { color: "#999", fontWeight: "bold", fontSize: 14 },
  segmentTextActive: { color: "#1A1A2E" },
});
