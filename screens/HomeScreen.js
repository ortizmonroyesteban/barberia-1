import React, { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, StatusBar } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { supabase } from "../supabase";
import { obtenerSillasConBarbero } from "../services/sillasService";

const iniciales = (nombre) =>
  nombre ? nombre.split(" ").map(p => p[0]).join("").slice(0, 2).toUpperCase() : "?";

export default function HomeScreen() {
  const navigation = useNavigation();
  const [sillas, setSillas] = useState([]);

  const cargar = () => {
    obtenerSillasConBarbero().then(setSillas).catch(() => {});
  };

  useEffect(() => { cargar(); }, []);

  useEffect(() => {
    const channel = supabase
      .channel("home-sillas")
      .on("postgres_changes", { event: "*", schema: "public", table: "barberos" }, cargar)
      .on("postgres_changes", { event: "*", schema: "public", table: "barbero_sillas" }, cargar)
      .on("postgres_changes", { event: "*", schema: "public", table: "sillas" }, cargar)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>Tauros Barbería</Text>
          <TouchableOpacity style={styles.adminBtn} onPress={() => navigation.navigate("AdminLogin")}>
            <Text style={styles.adminBtnText}>Admin</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.hero}>
        <Text style={styles.heroEmoji}>🦌</Text>
        <Text style={styles.heroTitle}>Tauros Barbería</Text>
        <Text style={styles.heroSubtitle}>Estilo y tradición en cada corte</Text>
        <Text style={styles.heroHint}>Toca una silla para agendar tu cita</Text>
      </View>

      <View style={styles.listSection}>
        <FlatList
          data={sillas}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const tieneBarbero = !!item.barbero;
            const barberoActivo = tieneBarbero && item.barbero.activo;
            const disponible = barberoActivo;
            return (
              <TouchableOpacity
                style={styles.card}
                onPress={() => {
                  if (!disponible) return;
                  navigation.navigate("BarberDetail", { silla: item, barbero: item.barbero });
                }}
                activeOpacity={disponible ? 0.7 : 1}
              >
                <View style={[styles.sillaNum, !disponible && styles.sillaNumDisabled]}>
                  <Text style={styles.sillaNumText}>{item.numero}</Text>
                </View>
                <View style={styles.cardInfo}>
                  <Text style={styles.cardSilla}>Silla {item.numero}</Text>
                  <Text style={styles.cardName}>
                    {tieneBarbero ? item.barbero.nombre : "Sin barbero asignado"}
                  </Text>
                </View>
                <View style={[styles.badge, disponible ? styles.badgeDisponible : styles.badgeNoDisponible]}>
                  <Text style={styles.badgeText}>
                    {disponible ? "Disponible" : "No disponible"}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No hay sillas registradas</Text>
          }
        />
      </View>

      <TouchableOpacity
        style={styles.barberPanelBtn}
        onPress={() => navigation.navigate("BarberPanel")}
      >
        <Text style={styles.barberPanelText}>🔐 Acceso barberos</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#121212" },
  header: { backgroundColor: "#1E1E1E", paddingBottom: 15, paddingHorizontal: 20, borderBottomLeftRadius: 25, borderBottomRightRadius: 25 },
  headerTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  headerTitle: { color: "#D4AF37", fontSize: 22, fontWeight: "bold" },
  adminBtn: { backgroundColor: "#D4AF37", paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8 },
  adminBtnText: { color: "#121212", fontSize: 14, fontWeight: "bold" },

  hero: { alignItems: "center", paddingVertical: 30, marginHorizontal: 15, backgroundColor: "#1E1E1E", borderRadius: 25, marginTop: 20 },
  heroEmoji: { fontSize: 60 },
  heroTitle: { color: "#D4AF37", fontSize: 28, fontWeight: "bold", marginTop: 10 },
  heroSubtitle: { color: "#CCC", fontSize: 16, marginTop: 5 },
  heroHint: { color: "#999", fontSize: 14, marginTop: 15, fontStyle: "italic" },

  listSection: { paddingHorizontal: 15, marginTop: 20, flex: 1 },

  card: { backgroundColor: "#1E1E1E", flexDirection: "row", alignItems: "center", padding: 15, borderRadius: 15, marginBottom: 12 },
  sillaNum: { width: 50, height: 50, borderRadius: 12, backgroundColor: "#2E7D32", justifyContent: "center", alignItems: "center" },
  sillaNumDisabled: { backgroundColor: "#555" },
  sillaNumText: { color: "white", fontSize: 20, fontWeight: "bold" },
  cardInfo: { flex: 1, marginLeft: 15 },
  cardSilla: { color: "#D4AF37", fontSize: 14, fontWeight: "bold" },
  cardName: { color: "white", fontSize: 15, marginTop: 2 },
  badge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  badgeDisponible: { backgroundColor: "#1B5E20" },
  badgeNoDisponible: { backgroundColor: "#555" },
  badgeText: { color: "white", fontSize: 12, fontWeight: "bold" },

  emptyText: { color: "#999", textAlign: "center", marginTop: 20 },

  barberPanelBtn: { backgroundColor: "#333", marginHorizontal: 15, marginVertical: 15, padding: 15, borderRadius: 12, alignItems: "center" },
  barberPanelText: { color: "white", fontWeight: "bold", fontSize: 16 },
});
