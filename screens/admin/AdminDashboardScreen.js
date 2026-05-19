import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { supabase } from "../../supabase";
import { logoutAdmin } from "../../services/adminAuthService";

export default function AdminDashboardScreen() {
  const navigation = useNavigation();
  const [citasHoy, setCitasHoy] = useState(0);
  const [barberosActivos, setBarberosActivos] = useState(0);

  const hoy = new Date();
  const toLocalDateStr = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const { count: citas } = await supabase
        .from("citas")
        .select("*", { count: "exact", head: true })
        .eq("fecha", toLocalDateStr(hoy));

      const { count: activos } = await supabase
        .from("barberos")
        .select("*", { count: "exact", head: true })
        .eq("activo", true);

      setCitasHoy(citas ?? 0);
      setBarberosActivos(activos ?? 0);
    } catch (_) {}
  };

  const cerrarSesion = async () => {
    await logoutAdmin();
    navigation.getParent()?.reset({ index: 0, routes: [{ name: "Home" }] });
  };

  const accesos = [
    { label: "Barberos", icon: "✂️", screen: "AdminBarbers", color: "#2E7D32" },
    { label: "Horarios", icon: "🕐", screen: "AdminSchedule", color: "#1565C0" },
    { label: "Sillas", icon: "💺", screen: "AdminSillas", color: "#4CAF50" },
    { label: "Citas", icon: "📋", screen: "AdminBookings", color: "#6A1B9A" },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => { navigation.openDrawer(); }} style={styles.menuBtn}>
            <Text style={styles.menuIcon}>☰</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.headerTitle}>Panel Admin</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={cerrarSesion}>
            <Text style={styles.logoutText}>Cerrar sesión</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        <View style={styles.resumenRow}>
          <View style={[styles.resumenCard, { backgroundColor: "#1B5E20" }]}>
            <Text style={styles.resumenNum}>{citasHoy}</Text>
            <Text style={styles.resumenLabel}>Citas hoy</Text>
          </View>
          <View style={[styles.resumenCard, { backgroundColor: "#1565C0" }]}>
            <Text style={styles.resumenNum}>{barberosActivos}</Text>
            <Text style={styles.resumenLabel}>Activos</Text>
          </View>
        </View>

        <Text style={styles.accesosTitle}>Accesos rápidos</Text>
        {accesos.map((a) => (
          <TouchableOpacity
            key={a.screen}
            style={[styles.accesoBtn, { backgroundColor: a.color }]}
            onPress={() => navigation.navigate(a.screen)}
          >
            <Text style={styles.accesoIcon}>{a.icon}</Text>
            <Text style={styles.accesoLabel}>{a.label}</Text>
            <Text style={styles.accesoArrow}>›</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#121212" },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 15, paddingBottom: 15, paddingTop: 10, backgroundColor: "#1E1E1E", borderBottomLeftRadius: 25, borderBottomRightRadius: 25 },
  headerLeft: { width: 50, alignItems: "flex-start" },
  headerTitle: { flex: 1, textAlign: "center", color: "#D4AF37", fontSize: 20, fontWeight: "bold" },
  headerRight: { width: 100, alignItems: "flex-end" },
  menuBtn: { padding: 8 },
  menuIcon: { color: "white", fontSize: 26 },
  logoutText: { color: "#FF6B6B", fontWeight: "bold", fontSize: 13 },
  body: { padding: 15 },
  resumenRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 25 },
  resumenCard: { width: "48%", padding: 25, borderRadius: 20, alignItems: "center" },
  resumenNum: { color: "white", fontSize: 42, fontWeight: "bold" },
  resumenLabel: { color: "rgba(255,255,255,0.8)", fontSize: 14, marginTop: 5 },
  accesosTitle: { color: "white", fontSize: 20, fontWeight: "bold", marginBottom: 15 },
  accesoBtn: { flexDirection: "row", alignItems: "center", padding: 18, borderRadius: 16, marginBottom: 12 },
  accesoIcon: { fontSize: 28 },
  accesoLabel: { color: "white", fontSize: 18, fontWeight: "bold", flex: 1, marginLeft: 15 },
  accesoArrow: { color: "white", fontSize: 28, fontWeight: "bold" },
});
