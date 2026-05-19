import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { registrarCita } from "../services/citasService";
import { obtenerSillas } from "../services/sillasService";

export default function BookingScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { barbero, fecha, hora, sillaId } = route.params;

  const [clienteNombre, setClienteNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [cargando, setCargando] = useState(false);

  const confirmar = async () => {
    if (!clienteNombre.trim()) {
      Alert.alert("Error", "Ingresa tu nombre");
      return;
    }

    const tel = telefono.trim();
    if (tel && !/^\d+$/.test(tel)) {
      Alert.alert("Error", "El teléfono solo debe contener números");
      return;
    }
    if (tel && tel.length < 7) {
      Alert.alert("Error", "El teléfono debe tener al menos 7 dígitos");
      return;
    }

    setCargando(true);
    let ok;
    try {
      ok = await registrarCita({
        clienteNombre: clienteNombre.trim(),
        sillaId,
        barberoId: barbero.id,
        fecha,
        hora,
        telefono: telefono.trim() || null,
      });
    } catch (_) { ok = false; }
    setCargando(false);

    if (!ok) { Alert.alert("Error", "No se pudo registrar la cita. Intenta de nuevo."); return; }

    let sillas;
    try { sillas = await obtenerSillas(); } catch (_) { sillas = []; }
    const silla = sillas.find(s => s.id === sillaId);
    navigation.navigate("Confirmation", {
      clienteNombre: clienteNombre.trim(),
      telefono: telefono.trim(),
      barberoNombre: barbero.nombre,
      fecha,
      hora,
      sillaNumero: silla?.numero ?? "—",
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>← Volver</Text>
          </TouchableOpacity>

          <View style={styles.summary}>
            <Text style={styles.summaryTitle}>{barbero.nombre}</Text>
            <Text style={styles.summaryDetail}>{fecha} — {hora}</Text>
          </View>

          <View style={styles.form}>
            <Text style={styles.label}>Nombre del cliente</Text>
            <TextInput
              style={styles.input}
              placeholder="Ingresa tu nombre"
              placeholderTextColor="#999"
              value={clienteNombre}
              onChangeText={setClienteNombre}
            />

            <Text style={styles.label}>Teléfono (opcional)</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: 3001234567"
              placeholderTextColor="#999"
              value={telefono}
              onChangeText={t => setTelefono(t.replace(/[^0-9]/g, ""))}
              keyboardType="numeric"
              maxLength={15}
            />

            <TouchableOpacity
              style={[styles.confirmBtn, cargando && { opacity: 0.5 }]}
              disabled={cargando}
              onPress={confirmar}
            >
              <Text style={styles.confirmText}>
                {cargando ? "Reservando..." : "Confirmar cita"}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#121212" },
  scroll: { flexGrow: 1 },
  backBtn: { paddingHorizontal: 20, paddingBottom: 10 },
  backText: { color: "#D4AF37", fontSize: 18, fontWeight: "bold" },
  summary: { alignItems: "center", paddingVertical: 20, marginHorizontal: 15, backgroundColor: "#1E1E1E", borderRadius: 20, marginBottom: 20 },
  summaryTitle: { color: "white", fontSize: 22, fontWeight: "bold" },
  summaryDetail: { color: "#D4AF37", fontSize: 16, marginTop: 5 },
  form: { marginHorizontal: 15 },
  label: { color: "white", fontSize: 16, fontWeight: "bold", marginBottom: 10, marginTop: 15 },
  input: { backgroundColor: "#2A2A2A", color: "white", padding: 15, borderRadius: 12, fontSize: 16 },
  confirmBtn: { backgroundColor: "#D4AF37", padding: 18, borderRadius: 15, alignItems: "center", marginTop: 30 },
  confirmText: { color: "#121212", fontSize: 20, fontWeight: "bold" },
});
