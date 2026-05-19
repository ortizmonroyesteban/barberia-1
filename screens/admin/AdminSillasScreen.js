import React, { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, Alert, StyleSheet, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { supabase } from "../../supabase";

export default function AdminSillasScreen() {
  const navigation = useNavigation();
  const [sillas, setSillas] = useState([]);
  const [asignaciones, setAsignaciones] = useState([]);
  const [barberos, setBarberos] = useState([]);
  const [cargando, setCargando] = useState(false);

  const cargar = async () => {
    const [s, a, b] = await Promise.all([
      supabase.from("sillas").select("id, numero, estado").order("numero"),
      supabase.from("barbero_sillas").select("silla_id, barbero_id"),
      supabase.from("barberos").select("id, nombre, activo"),
    ]);
    setSillas(s.data || []);
    setAsignaciones(a.data || []);
    setBarberos(b.data || []);
  };

  useEffect(() => { cargar(); }, []);

  useEffect(() => {
    const channel = supabase
      .channel("admin-sillas")
      .on("postgres_changes", { event: "*", schema: "public", table: "sillas" }, cargar)
      .on("postgres_changes", { event: "*", schema: "public", table: "barbero_sillas" }, cargar)
      .on("postgres_changes", { event: "*", schema: "public", table: "barberos" }, cargar)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const barberoDeSilla = (sillaId) => {
    const asig = asignaciones.find(a => a.silla_id === sillaId);
    if (!asig) return null;
    return barberos.find(b => b.id === asig.barbero_id) || null;
  };

  const agregarSilla = async () => {
    const maxNum = sillas.reduce((m, s) => Math.max(m, s.numero), 0);
    const nuevoNum = maxNum + 1;
    setCargando(true);
    try {
      const { error } = await supabase.from("sillas").insert([{ numero: nuevoNum, estado: "libre" }]);
      if (error) { Alert.alert("Error", error.message); setCargando(false); return; }
      await cargar();
    } catch (_) { Alert.alert("Error", "Error de conexión"); }
    setCargando(false);
  };

  const confirmarEliminar = () => {
    if (Platform.OS === "web") return window.confirm("¿Eliminar esta silla?");
    return new Promise(resolve => {
      Alert.alert("Eliminar", "¿Eliminar esta silla?", [
        { text: "Cancelar", onPress: () => resolve(false) },
        { text: "Eliminar", onPress: () => resolve(true) },
      ]);
    });
  };

  const eliminarSilla = async (id, numero) => {
    const barbero = barberoDeSilla(id);
    if (barbero) {
      Alert.alert("Ocupada", `La silla ${numero} está asignada a ${barbero.nombre}. Desasígnala primero.`);
      return;
    }
    const confirmado = await confirmarEliminar();
    if (!confirmado) return;
    setCargando(true);
    try {
      await supabase.from("barbero_sillas").delete().eq("silla_id", id);
      await supabase.from("citas").delete().eq("silla_id", id);
      await supabase.from("sillas").delete().eq("id", id);
      await cargar();
    } catch (_) { Alert.alert("Error", "Error de conexión al eliminar"); }
    setCargando(false);
  };

  const renderItem = ({ item }) => {
    const barbero = barberoDeSilla(item.id);
    const ocupada = item.estado === "ocupada";
    return (
      <View style={styles.card}>
        <View style={styles.cardNum}>
          <Text style={styles.cardNumText}>{item.numero}</Text>
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.cardTitle}>Silla {item.numero}</Text>
          <Text style={styles.cardSub}>
            {barbero ? `${barbero.nombre}` : "Sin barbero asignado"}
          </Text>
        </View>
        <View style={[styles.badge, ocupada ? styles.badgeOcupada : styles.badgeLibre]}>
          <Text style={styles.badgeText}>{ocupada ? "Ocupada" : "Libre"}</Text>
        </View>
        <TouchableOpacity style={styles.deleteBtn} onPress={() => eliminarSilla(item.id, item.numero)}>
          <Text style={styles.deleteBtnText}>🗑️</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Text style={styles.backText}>← Volver</Text>
      </TouchableOpacity>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Gestión de Sillas</Text>
        <TouchableOpacity style={styles.addBtn} disabled={cargando} onPress={agregarSilla}>
          <Text style={styles.addBtnText}>+ Agregar</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={sillas}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>No hay sillas registradas</Text>}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#121212" },
  backBtn: { paddingHorizontal: 20, paddingBottom: 10 },
  backText: { color: "#D4AF37", fontSize: 18, fontWeight: "bold" },
  header: { paddingHorizontal: 20, paddingTop: 0, paddingBottom: 15, backgroundColor: "#1E1E1E", borderBottomLeftRadius: 25, borderBottomRightRadius: 25, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  headerTitle: { color: "#D4AF37", fontSize: 20, fontWeight: "bold" },
  addBtn: { backgroundColor: "#2E7D32", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  addBtnText: { color: "white", fontWeight: "bold", fontSize: 14 },
  list: { padding: 15 },
  card: { backgroundColor: "#1E1E1E", flexDirection: "row", alignItems: "center", padding: 15, borderRadius: 15, marginBottom: 10 },
  cardNum: { width: 44, height: 44, borderRadius: 12, backgroundColor: "#2A2A2A", justifyContent: "center", alignItems: "center" },
  cardNumText: { color: "#D4AF37", fontSize: 18, fontWeight: "bold" },
  cardInfo: { flex: 1, marginLeft: 12 },
  cardTitle: { color: "white", fontSize: 16, fontWeight: "bold" },
  cardSub: { color: "#999", fontSize: 13, marginTop: 2 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeOcupada: { backgroundColor: "#8B0000" },
  badgeLibre: { backgroundColor: "#2E7D32" },
  badgeText: { color: "white", fontSize: 11, fontWeight: "bold" },
  deleteBtn: { marginLeft: 10 },
  deleteBtnText: { fontSize: 20 },
  empty: { color: "#999", textAlign: "center", marginTop: 30, fontSize: 16 },
});
