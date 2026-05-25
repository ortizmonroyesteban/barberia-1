import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { registrarCita } from "../services/citasService";
import { useAlert } from "../components/CustomAlert";

export default function BookingScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { showAlert } = useAlert();
  const { barbero, sillaId, sillaNum, fecha, hora } = route.params;
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [cargando, setCargando] = useState(false);

  const confirmar = async () => {
    if (!nombre.trim()) { showAlert("Error", "Ingresa tu nombre"); return; }
    const tel = telefono.replace(/[^0-9]/g, "");
    if (!tel || tel.length < 7) { showAlert("Error", "Ingresa un teléfono válido (al menos 7 dígitos)"); return; }
    setCargando(true);
    try {
      const cita = await registrarCita({ clienteNombre: nombre.trim(), barberoId: barbero.id, sillaId, fecha, hora, telefono: tel });
      if (cita) {
        navigation.replace("Confirmation", {
          nombre: nombre.trim(), barbero: barbero?.nombre || "Barbero",
          silla: sillaNum, fecha, hora: hora.slice(0, 5), telefono: tel,
        });
      } else {
        showAlert("Error", "No se pudo agendar la cita");
      }
    } catch (_) { showAlert("Error", "Error de conexión"); }
    setCargando(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 60 }} keyboardShouldPersistTaps="always">
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>← Atrás</Text>
          </TouchableOpacity>

          <View style={styles.summary}>
            <Text style={styles.summaryTitle}>Reserva tu cita</Text>
            <Text style={styles.summaryDetail}>✂️ {barbero?.nombre}</Text>
            <Text style={styles.summaryDetail}>📅 {fecha} · 🕒 {hora.slice(0, 5)}</Text>
          </View>

          <View style={styles.form}>
            <Text style={styles.label}>Nombre completo</Text>
            <TextInput style={styles.input} placeholder="Tu nombre" placeholderTextColor="#666"
              value={nombre} onChangeText={setNombre} />

            <Text style={styles.label}>Teléfono (opcional)</Text>
            <TextInput style={styles.input} placeholder="Ej. 1122334455" placeholderTextColor="#666"
              value={telefono} onChangeText={(t) => setTelefono(t.replace(/[^0-9]/g, ""))}
              keyboardType="numeric" maxLength={15} />
          </View>

          <TouchableOpacity style={[styles.confirmBtn, cargando && { opacity: 0.5 }]} disabled={cargando} onPress={confirmar}>
            <Text style={styles.confirmText}>{cargando ? "Reservando..." : "Confirmar cita"}</Text>
          </TouchableOpacity>
        </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1A1A2E" },
  backBtn: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 10 },
  backText: { color: "#C8962A", fontSize: 18, fontWeight: "bold" },

  summary: { alignItems: "center", paddingVertical: 20, marginHorizontal: 15, backgroundColor: "#1E1E1E", borderRadius: 20, elevation: 3, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4 },
  summaryTitle: { color: "white", fontSize: 22, fontWeight: "bold", marginBottom: 8 },
  summaryDetail: { color: "#C8962A", fontSize: 16, marginTop: 4 },

  form: { marginHorizontal: 15, marginTop: 20, backgroundColor: "#1E1E1E", borderRadius: 20, padding: 20, elevation: 3, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4 },
  label: { color: "white", fontSize: 16, fontWeight: "bold", marginBottom: 8, marginTop: 10 },
  input: { backgroundColor: "#2A2A2A", color: "white", padding: 16, borderRadius: 12, fontSize: 16, borderWidth: 1, borderColor: "#333" },

  confirmBtn: { backgroundColor: "#C8962A", padding: 18, borderRadius: 15, marginHorizontal: 15, marginTop: 30, marginBottom: 20, alignItems: "center", elevation: 4, shadowColor: "#C8962A", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 5 },
  confirmText: { color: "#1A1A2E", fontSize: 20, fontWeight: "bold" },
});
