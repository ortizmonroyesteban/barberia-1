import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";

export default function ConfirmationScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { clienteNombre, telefono, barberoNombre, fecha, hora, sillaNumero } = route.params;

  const volverInicio = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: "Home" }],
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.successSection}>
        <View style={styles.checkCircle}>
          <Text style={styles.checkMark}>✓</Text>
        </View>
        <Text style={styles.successTitle}>Cita confirmada</Text>
        <Text style={styles.successSub}>Tu reserva se registró correctamente</Text>
      </View>

      <View style={styles.cards}>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Cliente</Text>
          <Text style={styles.cardValue}>{clienteNombre}</Text>
        </View>

        {telefono ? (
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Teléfono</Text>
            <Text style={styles.cardValue}>{telefono}</Text>
          </View>
        ) : null}

        <View style={styles.card}>
          <Text style={styles.cardLabel}>Barbero</Text>
          <Text style={styles.cardValue}>{barberoNombre}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>Fecha</Text>
          <Text style={styles.cardValue}>{fecha}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>Hora</Text>
          <Text style={styles.cardValue}>{hora}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>Silla</Text>
          <Text style={styles.cardValue}>💺 {sillaNumero}</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.homeBtn} onPress={volverInicio}>
        <Text style={styles.homeBtnText}>Volver al inicio</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#121212" },
  successSection: { alignItems: "center", paddingTop: 60, paddingBottom: 20 },
  checkCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: "#4CAF50", justifyContent: "center", alignItems: "center" },
  checkMark: { color: "white", fontSize: 40, fontWeight: "bold" },
  successTitle: { color: "#4CAF50", fontSize: 26, fontWeight: "bold", marginTop: 15 },
  successSub: { color: "#CCC", fontSize: 16, marginTop: 5 },
  cards: { marginHorizontal: 15, marginTop: 10 },
  card: { backgroundColor: "#1E1E1E", padding: 15, borderRadius: 14, marginBottom: 10, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  cardLabel: { color: "#999", fontSize: 14, fontWeight: "bold" },
  cardValue: { color: "white", fontSize: 16, fontWeight: "bold" },
  homeBtn: { backgroundColor: "#D4AF37", marginHorizontal: 15, padding: 18, borderRadius: 15, alignItems: "center", marginTop: 10 },
  homeBtnText: { color: "#121212", fontSize: 18, fontWeight: "bold" },
});
