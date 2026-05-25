import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { supabase } from "../supabase";
import { useAlert } from "../components/CustomAlert";

export default function MyBookingsScreen() {
  const navigation = useNavigation();
  const { showAlert } = useAlert();
  const [telefono, setTelefono] = useState("");
  const [citas, setCitas] = useState([]);
  const [buscando, setBuscando] = useState(false);
  const [buscado, setBuscado] = useState(false);

  const buscar = async () => {
    const tel = telefono.replace(/[^0-9]/g, "");
    if (tel.length < 7) { showAlert("Error", "Ingresa un teléfono válido"); return; }
    setBuscando(true);
    setBuscado(false);
    try {
      const { data } = await supabase
        .from("citas")
        .select("id, cliente_nombre, barbero_id, fecha, hora, telefono, estado, silla_id, sillas!silla_id(numero), barberos!barbero_id(nombre, telefono)")
        .eq("telefono", tel)
        .order("fecha", { ascending: false })
        .order("hora", { ascending: false });
      setCitas(data || []);
    } catch (_) { showAlert("Error", "Error al buscar citas"); }
    setBuscando(false);
    setBuscado(true);
  };

  const estadoTexto = (estado) => {
    switch (estado) {
      case "confirmada": return "Confirmada";
      case "cancelada": return "Cancelada";
      default: return "Pendiente";
    }
  };

  const estadoColor = (estado) => {
    switch (estado) {
      case "confirmada": return "#4CAF50";
      case "cancelada": return "#999";
      default: return "#C8962A";
    }
  };

  const cancelarCita = (id) => {
    showAlert("Cancelar cita", "¿Estás seguro de cancelar esta cita?", [
      { text: "No" },
      { text: "Sí, cancelar", onPress: async () => {
        const anterior = citas;
        setCitas(prev => prev.filter(c => c.id !== id));
        try {
          await supabase.from("citas").delete().eq("id", id);
        } catch (_) { setCitas(anterior); }
      }},
    ]);
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardFecha}>{item.fecha}</Text>
        <Text style={[styles.cardEstado, { color: estadoColor(item.estado) }]}>
          {estadoTexto(item.estado)}
        </Text>
      </View>
      <Text style={styles.cardDetalle}>Cliente: {item.cliente_nombre}</Text>
      <Text style={styles.cardDetalle}>Barbero: {item.barberos?.nombre || "?"}</Text>
      <Text style={styles.cardDetalle}>Hora: {item.hora?.slice(0, 5)}</Text>
      {item.sillas?.numero && <Text style={styles.cardDetalle}>Silla: {item.sillas.numero}</Text>}
      {item.telefono && <Text style={styles.cardDetalle}>Tel. cliente: {item.telefono}</Text>}
      {item.barberos?.telefono && <Text style={styles.cardDetalle}>Tel. barbero: {item.barberos.telefono}</Text>}
      <TouchableOpacity style={styles.cancelBtn} onPress={() => cancelarCita(item.id)}>
        <Text style={styles.cancelBtnText}>Cancelar cita</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Text style={styles.backText}>← Volver</Text>
      </TouchableOpacity>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mis citas</Text>
      </View>

      <View style={styles.searchSection}>
        <TextInput
          style={styles.input}
          placeholder="Tu número de teléfono"
          placeholderTextColor="#999"
          keyboardType="phone-pad"
          value={telefono}
          onChangeText={setTelefono}
        />
        <TouchableOpacity style={styles.searchBtn} disabled={buscando} onPress={buscar}>
          <Text style={styles.searchBtnText}>{buscando ? "..." : "Buscar"}</Text>
        </TouchableOpacity>
      </View>

      {buscando ? (
        <ActivityIndicator size="large" color="#C8962A" style={{ marginTop: 40 }} />
      ) : buscado && citas.length === 0 ? (
        <Text style={styles.emptyText}>No se encontraron citas con ese teléfono</Text>
      ) : (
        <FlatList
          data={citas}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
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

  searchSection: { flexDirection: "row", paddingHorizontal: 15, marginTop: 20, gap: 10 },
  input: { backgroundColor: "#2A2A2A", color: "white", padding: 16, borderRadius: 12, fontSize: 16, borderWidth: 1, borderColor: "#333", flex: 1 },
  searchBtn: { backgroundColor: "#C8962A", paddingHorizontal: 24, borderRadius: 12, justifyContent: "center" },
  searchBtnText: { color: "#1A1A2E", fontWeight: "bold", fontSize: 16 },

  list: { padding: 15, paddingBottom: 30 },
  emptyText: { color: "#999", textAlign: "center", marginTop: 40, fontSize: 15 },
  card: { backgroundColor: "#1E1E1E", borderRadius: 15, padding: 16, marginBottom: 10 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  cardFecha: { color: "#C8962A", fontSize: 15, fontWeight: "bold" },
  cardEstado: { fontSize: 13, fontWeight: "bold" },
  cardDetalle: { color: "#CCC", fontSize: 14, marginTop: 3 },
  cancelBtn: { backgroundColor: "#9E9E9E", padding: 12, borderRadius: 10, alignItems: "center", marginTop: 12 },
  cancelBtnText: { color: "white", fontWeight: "bold", fontSize: 14 },
});
