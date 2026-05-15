import React, { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, StatusBar } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { obtenerBarberos } from "../services/barberosService";
import { obtenerTodasLasAsignaciones } from "../services/barberoSillasService";

const iniciales = (nombre) =>
  nombre.split(" ").map(p => p[0]).join("").slice(0, 2).toUpperCase();

export default function HomeScreen() {
  const navigation = useNavigation();
  const [barberos, setBarberos] = useState([]);
  const [asignaciones, setAsignaciones] = useState([]);

  useEffect(() => {
    Promise.all([obtenerBarberos(), obtenerTodasLasAsignaciones()])
      .then(([b, a]) => { setBarberos(b); setAsignaciones(a); })
      .catch(() => {});
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>Tauros Barbería</Text>
          <TouchableOpacity onPress={() => navigation.navigate("AdminLogin")}>
            <Text style={styles.gearIcon}>⚙️</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.hero}>
        <Text style={styles.heroEmoji}>🦌</Text>
        <Text style={styles.heroTitle}>Tauros Barbería</Text>
        <Text style={styles.heroSubtitle}>Estilo y tradición en cada corte</Text>
        <Text style={styles.heroHint}>Toca un barbero para agendar tu cita</Text>
      </View>

      <View style={styles.listSection}>
        <Text style={styles.listTitle}>Nuestros Barbers</Text>
        <FlatList
          data={barberos}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const inactivo = !item.activo;
            const sinSilla = !asignaciones.some(a => a.barbero_id === item.id);
            return (
              <TouchableOpacity
                style={styles.card}
                onPress={() => navigation.navigate("BarberDetail", { barbero: item })}
              >
                <View style={[styles.avatar, inactivo && styles.avatarInactivo, sinSilla && item.activo && styles.avatarSinSilla]}>
                  <Text style={styles.avatarText}>{iniciales(item.nombre)}</Text>
                </View>
                <View style={styles.cardInfo}>
                  <Text style={styles.cardName}>✂️ {item.nombre}</Text>
                  <Text style={styles.cardSpecialty}>Barbero profesional</Text>
                </View>
                <View style={[
                  styles.badge,
                  inactivo ? styles.badgeInactivo : sinSilla ? styles.badgeSinSilla : styles.badgeActivo,
                ]}>
                  <Text style={styles.badgeText}>
                    {inactivo ? "Inactivo" : sinSilla ? "Sin silla" : "Activo"}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <Text style={{ color: "#999", textAlign: "center", marginTop: 20 }}>
              No hay barberos registrados
            </Text>
          }
        />
      </View>

      <TouchableOpacity
        style={styles.barberPanelBtn}
        onPress={() => navigation.navigate("BarberPanel")}
      >
        <Text style={styles.barberPanelText}>🔐 Acceso barberos</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#121212" },
  header: { backgroundColor: "#1E1E1E", paddingTop: 50, paddingBottom: 15, paddingHorizontal: 20, borderBottomLeftRadius: 25, borderBottomRightRadius: 25 },
  headerTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  headerTitle: { color: "#D4AF37", fontSize: 22, fontWeight: "bold" },
  gearIcon: { fontSize: 26 },

  hero: { alignItems: "center", paddingVertical: 30, marginHorizontal: 15, backgroundColor: "#1E1E1E", borderRadius: 25, marginTop: 20 },
  heroEmoji: { fontSize: 60 },
  heroTitle: { color: "#D4AF37", fontSize: 28, fontWeight: "bold", marginTop: 10 },
  heroSubtitle: { color: "#CCC", fontSize: 16, marginTop: 5 },
  heroHint: { color: "#999", fontSize: 14, marginTop: 15, fontStyle: "italic" },

  listSection: { paddingHorizontal: 15, marginTop: 20, flex: 1 },
  listTitle: { color: "white", fontSize: 20, fontWeight: "bold", marginBottom: 15 },

  card: { backgroundColor: "#1E1E1E", flexDirection: "row", alignItems: "center", padding: 15, borderRadius: 15, marginBottom: 12 },
  avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: "#2E7D32", justifyContent: "center", alignItems: "center" },
  avatarInactivo: { backgroundColor: "#555" },
  avatarSinSilla: { backgroundColor: "#5C3A3A" },
  avatarText: { color: "white", fontSize: 18, fontWeight: "bold" },
  cardInfo: { flex: 1, marginLeft: 15 },
  cardName: { color: "white", fontSize: 17, fontWeight: "bold" },
  cardSpecialty: { color: "#999", fontSize: 13, marginTop: 3 },
  badge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  badgeActivo: { backgroundColor: "#1B5E20" },
  badgeInactivo: { backgroundColor: "#555" },
  badgeSinSilla: { backgroundColor: "#5C3A3A" },
  badgeText: { color: "white", fontSize: 12, fontWeight: "bold" },

  barberPanelBtn: { backgroundColor: "#333", marginHorizontal: 15, marginVertical: 15, padding: 15, borderRadius: 12, alignItems: "center" },
  barberPanelText: { color: "white", fontWeight: "bold", fontSize: 16 },
});
