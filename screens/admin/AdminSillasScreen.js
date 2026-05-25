import React, { useEffect, useState, useCallback } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { supabase } from "../../supabase";
import { ErrorView } from "../../components/LoadingScreen";
import { useAlert } from "../../components/CustomAlert";

export default function AdminSillasScreen() {
  const navigation = useNavigation();
  const { showAlert } = useAlert();
  const [sillas, setSillas] = useState([]);
  const [asignaciones, setAsignaciones] = useState([]);
  const [barberos, setBarberos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [s, a, b] = await Promise.all([
        supabase.from("sillas").select("*").order("numero"),
        supabase.from("barbero_sillas").select("silla_id, barbero_id"),
        supabase.from("barberos").select("id, nombre, activo"),
      ]);
      if (s.error) throw s.error;
      setSillas(s.data || []);
      setAsignaciones(a.data || []);
      setBarberos(b.data || []);
    } catch (e) {
      setError(e.message || "Error al cargar sillas");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  useEffect(() => {
    const channel = supabase
      .channel("admin-sillas")
      .on("postgres_changes", { event: "*", schema: "public", table: "sillas" }, cargar)
      .on("postgres_changes", { event: "*", schema: "public", table: "barbero_sillas" }, cargar)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const barberoDeSilla = (sillaId) => {
    const asig = asignaciones.find(a => a.silla_id === sillaId);
    if (!asig) return null;
    return barberos.find(b => b.id === asig.barbero_id);
  };

  const agregar = async () => {
    const maxNum = sillas.reduce((m, s) => Math.max(m, s.numero || 0), 0);
    try {
      const { error } = await supabase.from("sillas").insert([{ numero: maxNum + 1, estado: "libre" }]);
      if (error) showAlert("Error", error.message);
    } catch (_) { showAlert("Error", "Error de conexión"); }
  };

  const eliminar = async (id) => {
    const barbero = barberoDeSilla(id);
    if (barbero) { showAlert("Error", `La silla está asignada a ${barbero.nombre}`); return; }
    try {
      const { error } = await supabase.from("sillas").delete().eq("id", id);
      if (error) showAlert("Error", error.message);
    } catch (_) { showAlert("Error", "Error de conexión"); }
  };

  const renderItem = ({ item }) => {
    const barbero = barberoDeSilla(item.id);
    const ocupada = !!barbero;
    return (
      <View style={styles.card}>
        <View style={styles.cardNum}>
          <Text style={styles.cardNumText}>{item.numero}</Text>
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.cardSilla}>Silla {item.numero}</Text>
          <Text style={styles.cardBarbero}>{barbero ? barbero.nombre : "Sin asignar"}</Text>
        </View>
        <View style={[styles.badge, ocupada ? styles.badgeOcupada : styles.badgeLibre]}>
          <Text style={styles.badgeText}>{ocupada ? "Ocupada" : "Libre"}</Text>
        </View>
        <TouchableOpacity onPress={() => eliminar(item.id)}>
          <Text style={styles.deleteIcon}>🗑️</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate("AdminDashboard")} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Sillas</Text>
        <TouchableOpacity style={styles.addBtn} onPress={agregar}>
          <Text style={styles.addBtnText}>+ Agregar</Text>
        </TouchableOpacity>
      </View>
      {loading ? (
        <ActivityIndicator size="large" color="#C8962A" style={{ marginTop: 60 }} />
      ) : error ? (
        <ErrorView message={error} onRetry={cargar} />
      ) : (
      <FlatList
        data={sillas}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.emptyText}>No hay sillas registradas</Text>}
      />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1A1A2E" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: "#1E1E1E", paddingHorizontal: 20, paddingVertical: 14, borderBottomLeftRadius: 25, borderBottomRightRadius: 25 },
  headerTitle: { color: "#C8962A", fontSize: 20, fontWeight: "bold" },
  addBtn: { backgroundColor: "#C8962A", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  addBtnText: { color: "white", fontSize: 14, fontWeight: "bold" },
  card: { backgroundColor: "#1E1E1E", flexDirection: "row", alignItems: "center", padding: 15, borderRadius: 15, marginBottom: 10 },
  cardNum: { width: 44, height: 44, borderRadius: 12, backgroundColor: "#2A2A2A", justifyContent: "center", alignItems: "center" },
  cardNumText: { color: "#C8962A", fontSize: 18, fontWeight: "bold" },
  cardInfo: { flex: 1, marginLeft: 12 },
  cardSilla: { color: "white", fontSize: 15, fontWeight: "bold" },
  cardBarbero: { color: "#888", fontSize: 12, marginTop: 2 },
  badge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 16, marginRight: 10 },
  badgeOcupada: { backgroundColor: "#9E9E9E" },
  badgeLibre: { backgroundColor: "#4CAF50" },
  badgeText: { color: "white", fontSize: 11, fontWeight: "bold" },
  backBtn: { paddingVertical: 4 },
  backText: { color: "#C8962A", fontSize: 18, fontWeight: "bold" },
  deleteIcon: { fontSize: 18 },
  list: { padding: 15 },
  emptyText: { color: "#999", textAlign: "center", marginTop: 40, fontSize: 15 },
});
