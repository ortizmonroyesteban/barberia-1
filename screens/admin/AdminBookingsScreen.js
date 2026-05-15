import React, { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, Alert, TextInput, StyleSheet, Platform, ScrollView } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { supabase } from "../../supabase";

export default function AdminBookingsScreen() {
  const navigation = useNavigation();
  const [citas, setCitas] = useState([]);
  const [barberos, setBarberos] = useState([]);
  const [filtroBarbero, setFiltroBarbero] = useState(null);
  const [filtroFecha, setFiltroFecha] = useState(null);
  const [expandido, setExpandido] = useState(null);
  const [fechaInput, setFechaInput] = useState("");

  useEffect(() => {
    supabase.from("barberos").select("*").order("nombre").then(({ data }) => { setBarberos(data || []); });
    cargar();
  }, []);

  const cargar = async (barberoId, fecha) => {
    let query = supabase
      .from("citas")
      .select("*, barberos!barbero_id(nombre), sillas!silla_id(numero)")
      .order("fecha", { ascending: false })
      .order("hora", { ascending: false });

    if (barberoId) query = query.eq("barbero_id", barberoId);
    if (fecha) query = query.eq("fecha", fecha);

    try {
      const { data } = await query;
      setCitas(data || []);
    } catch (_) { setCitas([]); }
  };

  const aplicarFiltros = () => {
    cargar(filtroBarbero, filtroFecha || null);
  };

  const confirmar = () => {
    if (Platform.OS === "web") return window.confirm("¿Eliminar esta cita?");
    return new Promise(resolve => {
      Alert.alert("Eliminar", "¿Estás seguro?", [
        { text: "Cancelar", onPress: () => resolve(false) },
        { text: "Eliminar", onPress: () => resolve(true) },
      ]);
    });
  };

  const eliminar = async (id) => {
    const confirmado = await confirmar();
    if (!confirmado) return;
    const prev = citas;
    setCitas(p => p.filter(c => c.id !== id));
    setExpandido(null);
    try {
      const { error } = await supabase.from("citas").delete().eq("id", id);
      if (error) { setCitas(prev); Alert.alert("Error", error.message); return; }
      Alert.alert("Eliminada", "La cita se eliminó correctamente");
    } catch (_) { setCitas(prev); Alert.alert("Error", "Error de conexión al eliminar la cita"); }
  };

  const renderItem = ({ item }) => {
    const expanded = expandido === item.id;
    const hora = item.hora?.slice(0, 5);
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => setExpandido(expanded ? null : item.id)}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>👤 {item.cliente_nombre}</Text>
          <Text style={styles.cardFecha}>{item.fecha}</Text>
        </View>
        <Text style={styles.cardSub}>✂️ {item.barberos?.nombre || "?"} — 🕒 {hora}{item.telefono ? ` — 📞 ${item.telefono}` : ""}</Text>

        {expanded && (
          <View style={styles.detalles}>
            <Text style={styles.detalle}>📅 Fecha: {item.fecha}</Text>
            <Text style={styles.detalle}>🕒 Hora: {hora}</Text>
            <Text style={styles.detalle}>✂️ Barbero: {item.barberos?.nombre || "?"}</Text>
            <Text style={styles.detalle}>💺 Silla: {item.sillas?.numero || "?"}</Text>
            {item.telefono && <Text style={styles.detalle}>📞 Tel: {item.telefono}</Text>}
            <TouchableOpacity style={styles.deleteBtn} onPress={() => eliminar(item.id)}>
              <Text style={styles.deleteBtnText}>Eliminar cita</Text>
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Text style={styles.backText}>← Volver</Text>
      </TouchableOpacity>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Citas</Text>
      </View>

      <View style={styles.filtros}>
        <View style={styles.filtroRow}>
          <Text style={styles.filtroLabel}>Barbero:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.barberScroll}>
            <TouchableOpacity
              style={[styles.filtroPickerBtn, !filtroBarbero && styles.filtroPickerBtnActive]}
              onPress={() => setFiltroBarbero(null)}
            >
              <Text style={[styles.filtroPickerText, !filtroBarbero && styles.filtroPickerTextActive]}>Todos</Text>
            </TouchableOpacity>
            {barberos.map(b => (
              <TouchableOpacity
                key={b.id}
                style={[styles.filtroPickerBtn, filtroBarbero === b.id && styles.filtroPickerBtnActive]}
                onPress={() => setFiltroBarbero(b.id)}
              >
                <Text style={[styles.filtroPickerText, filtroBarbero === b.id && styles.filtroPickerTextActive]}>{b.nombre}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.filtroRow}>
          <Text style={styles.filtroLabel}>Fecha:</Text>
          <TextInput
            style={styles.fechaInput}
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#666"
            value={fechaInput}
            onChangeText={setFechaInput}
            onBlur={() => setFiltroFecha(fechaInput || null)}
          />
        </View>

        <TouchableOpacity style={styles.filtrarBtn} onPress={aplicarFiltros}>
          <Text style={styles.filtrarBtnText}>Filtrar</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.limpiarBtn} onPress={() => { setFiltroBarbero(null); setFiltroFecha(null); cargar(); }}>
          <Text style={styles.limpiarBtnText}>Limpiar filtros</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={citas}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>No hay citas</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#121212" },
  backBtn: { paddingHorizontal: 20, paddingTop: 50, paddingBottom: 10 },
  backText: { color: "#D4AF37", fontSize: 18, fontWeight: "bold" },
  header: { paddingHorizontal: 20, paddingTop: 0, paddingBottom: 15, backgroundColor: "#1E1E1E", borderBottomLeftRadius: 25, borderBottomRightRadius: 25 },
  headerTitle: { color: "#D4AF37", fontSize: 20, fontWeight: "bold" },
  filtros: { padding: 15, borderBottomWidth: 1, borderBottomColor: "#333" },
  filtroRow: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", marginBottom: 10, gap: 6 },
  filtroLabel: { color: "#999", fontSize: 14, fontWeight: "bold", marginRight: 6 },
  filtroPickerBtn: { backgroundColor: "#333", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 15 },
  filtroPickerBtnActive: { backgroundColor: "#2E7D32" },
  filtroPickerText: { color: "#CCC", fontSize: 13 },
  filtroPickerTextActive: { color: "white", fontWeight: "bold" },
  fechaInput: { backgroundColor: "#2A2A2A", color: "white", padding: 8, borderRadius: 8, fontSize: 14, minWidth: 120 },
  filtrarBtn: { backgroundColor: "#D4AF37", padding: 10, borderRadius: 10, alignItems: "center", marginBottom: 8 },
  filtrarBtnText: { color: "#121212", fontWeight: "bold" },
  limpiarBtn: { padding: 8, alignItems: "center" },
  limpiarBtnText: { color: "#999", fontSize: 13 },
  barberScroll: { flexDirection: "row", alignItems: "center", gap: 6 },
  list: { padding: 15 },
  card: { backgroundColor: "#1E1E1E", padding: 15, borderRadius: 15, marginBottom: 10 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  cardTitle: { color: "white", fontSize: 17, fontWeight: "bold" },
  cardFecha: { color: "#D4AF37", fontSize: 14 },
  cardSub: { color: "#CCC", fontSize: 14, marginTop: 5 },
  detalles: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: "#333" },
  detalle: { color: "white", fontSize: 14, marginBottom: 5 },
  deleteBtn: { backgroundColor: "#C0392B", padding: 10, borderRadius: 10, alignItems: "center", marginTop: 10 },
  deleteBtnText: { color: "white", fontWeight: "bold" },
  empty: { color: "#999", textAlign: "center", marginTop: 30, fontSize: 16 },
});
