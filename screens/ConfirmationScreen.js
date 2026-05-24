import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute, CommonActions } from "@react-navigation/native";

export default function ConfirmationScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { nombre, barbero, silla, fecha, hora, telefono } = route.params;

  const details = [
    { label: "Cliente", value: nombre },
    { label: "Barbero", value: barbero },
    { label: "Silla", value: `Silla ${silla}` },
    { label: "Fecha", value: fecha },
    { label: "Hora", value: hora },
    ...(telefono ? [{ label: "Teléfono", value: telefono }] : []),
  ];

  const volverInicio = () => {
    navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: "Home" }] }));
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} keyboardShouldPersistTaps="always">
        <View style={styles.successSection}>
          <View style={styles.checkCircle}>
            <Text style={styles.checkMark}>✓</Text>
          </View>
          <Text style={styles.successTitle}>¡Cita confirmada!</Text>
          <Text style={styles.successSub}>Te esperamos en Tauro's Barbería</Text>
        </View>

        <View style={styles.cards}>
          {details.map(d => (
            <View key={d.label} style={styles.card}>
              <Text style={styles.cardLabel}>{d.label}</Text>
              <Text style={styles.cardValue}>{d.value}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity style={styles.homeBtn} onPress={volverInicio}>
          <Text style={styles.homeBtnText}>Volver al inicio</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1A1A2E" },
  successSection: { alignItems: "center", paddingTop: 60, paddingBottom: 20 },
  checkCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: "#4CAF50", justifyContent: "center", alignItems: "center", elevation: 6, shadowColor: "#4CAF50", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.4, shadowRadius: 6 },
  checkMark: { color: "white", fontSize: 40, fontWeight: "bold" },
  successTitle: { color: "#4CAF50", fontSize: 26, fontWeight: "bold", marginTop: 12 },
  successSub: { color: "#CCC", fontSize: 16, marginTop: 4 },

  cards: { marginHorizontal: 15, marginTop: 10 },
  card: { backgroundColor: "#1E1E1E", padding: 16, borderRadius: 14, marginBottom: 10, flexDirection: "row", justifyContent: "space-between", elevation: 2, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.15, shadowRadius: 3 },
  cardLabel: { color: "#999", fontSize: 14, fontWeight: "bold" },
  cardValue: { color: "white", fontSize: 16, fontWeight: "bold" },
  homeBtn: { backgroundColor: "#C8962A", marginHorizontal: 15, padding: 18, borderRadius: 15, marginTop: 10, alignItems: "center", elevation: 4, shadowColor: "#C8962A", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 5 },
  homeBtnText: { color: "#1A1A2E", fontSize: 18, fontWeight: "bold" },
});
