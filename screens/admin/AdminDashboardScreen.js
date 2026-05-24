import React, { useEffect, useState, useCallback } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, CommonActions } from "@react-navigation/native";
import { supabase } from "../../supabase";
import { fechaLocal } from "../../utils/horarios";
import LoadingScreen, { ErrorView } from "../../components/LoadingScreen";

const accesos = [
  { label: "Barberos", icon: "✂️", route: "AdminBarbers", color: "#C8962A" },
  { label: "Horarios", icon: "📅", route: "AdminSchedule", color: "#C8962A" },
  { label: "Sillas", icon: "💺", route: "AdminSillas", color: "#C8962A" },
  { label: "Citas", icon: "📋", route: "AdminBookings", color: "#C8962A" },
];

export default function AdminDashboardScreen() {
  const navigation = useNavigation();
  const [citasHoy, setCitasHoy] = useState(0);
  const [barberosActivos, setBarberosActivos] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const hoy = fechaLocal();
      const [citasRes, barberosRes] = await Promise.all([
        supabase.from("citas").select("id").eq("fecha", hoy).in("estado", ["pendiente", "confirmada"]),
        supabase.from("barberos").select("id").eq("admin_activo", true).eq("activo", true),
      ]);
      if (citasRes.error) throw citasRes.error;
      if (barberosRes.error) throw barberosRes.error;
      setCitasHoy(citasRes.data?.length || 0);
      setBarberosActivos(barberosRes.data?.length || 0);
    } catch (e) {
      setError(e.message || "Error al cargar datos");
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const logout = () => {
    navigation.getParent()?.dispatch(CommonActions.reset({ index: 0, routes: [{ name: "Home" }] }));
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.openDrawer()}>
          <Text style={styles.menuIcon}>☰</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Dashboard</Text>
        <TouchableOpacity onPress={logout}>
          <Text style={styles.logoutText}>Salir</Text>
        </TouchableOpacity>
      </View>

      {cargando ? <LoadingScreen /> : error ? <ErrorView message={error} onRetry={cargar} /> : (
      <ScrollView contentContainerStyle={{ padding: 15 }}>
        <View style={styles.resumenRow}>
          <View style={[styles.resumenCard, { backgroundColor: "#C8962A" }]}>  
            <Text style={styles.resumenNum}>{citasHoy}</Text>
            <Text style={styles.resumenLabel}>Citas hoy</Text>
          </View>
          <View style={[styles.resumenCard, { backgroundColor: "#4CAF50" }]}>
            <Text style={styles.resumenNum}>{barberosActivos}</Text>
            <Text style={styles.resumenLabel}>Barberos activos</Text>
          </View>
        </View>

        <Text style={styles.accesosTitle}>Gestión rápida</Text>
        <View style={styles.accesosGrid}>
          {accesos.map(item => (
            <TouchableOpacity key={item.label} style={[styles.accesoBtn, { backgroundColor: item.color }]} onPress={() => navigation.navigate(item.route)}>
              <Text style={styles.accesoIcon}>{item.icon}</Text>
              <Text style={styles.accesoLabel}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1A1A2E" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: "#1E1E1E", paddingHorizontal: 20, paddingVertical: 16, borderBottomLeftRadius: 25, borderBottomRightRadius: 25, elevation: 4, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4 },
  headerTitle: { color: "#C8962A", fontSize: 20, fontWeight: "bold" },
  menuIcon: { color: "white", fontSize: 26 },
  logoutText: { color: "#9E9E9E", fontSize: 15, fontWeight: "bold" },

  resumenRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 24, paddingHorizontal: 15, marginTop: 20 },
  resumenCard: { width: "48%", padding: 25, borderRadius: 20, alignItems: "center", elevation: 4, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4 },
  resumenNum: { color: "white", fontSize: 42, fontWeight: "bold" },
  resumenLabel: { color: "rgba(255,255,255,0.8)", fontSize: 14, marginTop: 4 },

  accesosTitle: { color: "white", fontSize: 20, fontWeight: "bold", marginBottom: 14, paddingHorizontal: 15 },
  accesosGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", paddingHorizontal: 15 },
  accesoBtn: { width: "48%", alignItems: "center", padding: 24, borderRadius: 16, marginBottom: 12, elevation: 3, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4 },
  accesoIcon: { fontSize: 32, marginBottom: 8 },
  accesoLabel: { color: "white", fontSize: 16, fontWeight: "bold" },
});
