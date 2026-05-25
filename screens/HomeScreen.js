import React, { useEffect, useState, useCallback } from "react";
import { View, Text, TouchableOpacity, FlatList, Image, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { supabase } from "../supabase";
import { obtenerSillasConBarbero } from "../services/sillasService";

const keyExtractor = (item) => item.id;

export default function HomeScreen() {
  const navigation = useNavigation();
  const [sillas, setSillas] = useState([]);

  const cargar = useCallback(async () => {
    const data = await obtenerSillasConBarbero();
    setSillas(data || []);
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  useEffect(() => {
    const channel = supabase
      .channel("home-sillas")
      .on("postgres_changes", { event: "*", schema: "public", table: "sillas" }, cargar)
      .on("postgres_changes", { event: "*", schema: "public", table: "barberos" }, cargar)
      .on("postgres_changes", { event: "*", schema: "public", table: "barbero_sillas" }, cargar)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [cargar]);

  const goToAdmin = useCallback(() => navigation.navigate("AdminLogin"), [navigation]);
  const goToBarberPanel = useCallback(() => navigation.navigate("BarberPanel"), [navigation]);
  const goToMyBookings = useCallback(() => navigation.navigate("MyBookings"), [navigation]);

  const renderItem = useCallback(({ item }) => {
    const ocupada = item.barbero && item.barbero.admin_activo && item.barbero.activo;
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => {
          if (ocupada) navigation.navigate("BarberDetail", { silla: item });
        }}
      >
        <View style={[styles.sillaNum, ocupada ? styles.sillaNumActive : styles.sillaNumDisabled]}>
          <Text style={styles.sillaNumText}>{item.numero}</Text>
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.cardSilla}>Silla {item.numero}</Text>
          {item.barbero ? (
            <View style={styles.cardBarberoRow}>
              {item.barbero.foto_url ? (
                <Image source={{ uri: item.barbero.foto_url }} style={styles.cardBarberoFoto} />
              ) : (
                <View style={styles.cardBarberoAvatar}>
                  <Text style={styles.cardBarberoAvatarText}>{item.barbero.nombre?.charAt(0).toUpperCase() || "?"}</Text>
                </View>
              )}
              <Text style={styles.cardName}>
                {item.barbero.admin_activo && item.barbero.activo
                  ? item.barbero.nombre
                  : `${item.barbero.nombre} (no disponible)`}
              </Text>
            </View>
          ) : null}
        </View>
        <View style={[styles.badge, ocupada ? styles.badgeDisponible : styles.badgeNoDisponible]}>
          <Text style={styles.badgeText}>{ocupada ? "Disponible" : "No disponible"}</Text>
        </View>
      </TouchableOpacity>
    );
  }, [navigation]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Tauro's Barbería</Text>
        <View style={styles.headerBtns}>
          <TouchableOpacity style={styles.myBookingsBtn} onPress={goToMyBookings}>
            <Text style={styles.myBookingsBtnText}>Mis citas</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.adminBtn} onPress={goToAdmin}>
            <Text style={styles.adminBtnText}>Admin</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.hero}>
        <Image source={require("../assets/logo.png")} style={styles.logo} />
        <Text style={styles.heroTitle}>Bienvenido</Text>
        <Text style={styles.heroSubtitle}>Elige tu barbero y reserva tu cita</Text>
        <Text style={styles.heroHint}>Selecciona una silla para empezar</Text>
      </View>

      <View style={styles.listSection}>
        <FlatList
          data={sillas}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={<Text style={styles.emptyText}>No hay sillas disponibles</Text>}
          windowSize={5}
        />
      </View>

      <TouchableOpacity style={styles.barberPanelBtn} onPress={goToBarberPanel}>
        <Text style={styles.barberPanelBtnText}>Panel de barberos</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1A1A2E" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: "#1E1E1E", paddingHorizontal: 20, paddingVertical: 16, borderBottomLeftRadius: 25, borderBottomRightRadius: 25, elevation: 4, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4 },
  headerTitle: { color: "#C8962A", fontSize: 22, fontWeight: "bold" },
  headerBtns: { flexDirection: "row", gap: 8 },
  adminBtn: { backgroundColor: "#C8962A", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, elevation: 2, shadowColor: "#C8962A", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 3 },
  adminBtnText: { color: "#1A1A2E", fontSize: 13, fontWeight: "bold" },
  myBookingsBtn: { backgroundColor: "#2A2A2A", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: "#C8962A" },
  myBookingsBtnText: { color: "#C8962A", fontSize: 13, fontWeight: "bold" },

  hero: { alignItems: "center", paddingVertical: 30, marginHorizontal: 15, backgroundColor: "#1E1E1E", borderRadius: 25, marginTop: 20, elevation: 3, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4 },
  logo: { width: 180, height: 180, borderRadius: 20, marginBottom: 10 },
  heroTitle: { color: "#C8962A", fontSize: 28, fontWeight: "bold", marginTop: 8 },
  heroSubtitle: { color: "#CCC", fontSize: 16, marginTop: 4 },
  heroHint: { color: "#999", fontSize: 14, fontStyle: "italic", marginTop: 8 },

  listSection: { paddingHorizontal: 15, marginTop: 20, flex: 1 },
  card: { backgroundColor: "#1E1E1E", flexDirection: "row", alignItems: "center", padding: 18, borderRadius: 18, marginBottom: 12, elevation: 3, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4 },
  sillaNum: { width: 50, height: 50, borderRadius: 14, justifyContent: "center", alignItems: "center" },
  sillaNumActive: { backgroundColor: "#4CAF50" },
  sillaNumDisabled: { backgroundColor: "#555" },
  sillaNumText: { color: "white", fontSize: 20, fontWeight: "bold" },
  cardInfo: { flex: 1, marginLeft: 15 },
  cardSilla: { color: "#C8962A", fontSize: 14, fontWeight: "bold" },
  cardBarberoRow: { flexDirection: "row", alignItems: "center", marginTop: 4 },
  cardBarberoFoto: { width: 40, height: 40, borderRadius: 8, marginRight: 10, borderWidth: 2, borderColor: "#C8962A" },
  cardBarberoAvatar: { width: 40, height: 40, borderRadius: 8, backgroundColor: "#C8962A", justifyContent: "center", alignItems: "center", marginRight: 10, borderWidth: 2, borderColor: "rgba(255,255,255,0.3)" },
  cardBarberoAvatarText: { color: "white", fontSize: 18, fontWeight: "bold" },
  cardName: { color: "white", fontSize: 15 },
  badge: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },
  badgeDisponible: { backgroundColor: "#4CAF50" },
  badgeNoDisponible: { backgroundColor: "#555" },
  badgeText: { color: "white", fontSize: 12, fontWeight: "bold" },
  listContent: { paddingBottom: 10 },
  emptyText: { color: "#999", textAlign: "center", marginTop: 20 },

  barberPanelBtn: { marginHorizontal: 15, marginVertical: 15, backgroundColor: "#2A2A2A", padding: 16, borderRadius: 14, alignItems: "center", borderWidth: 1, borderColor: "#333" },
  barberPanelBtnText: { color: "#C8962A", textAlign: "center", fontWeight: "bold", fontSize: 15 },
});
