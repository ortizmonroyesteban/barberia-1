import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet } from "react-native";
import { loginAdmin } from "../../services/adminAuthService";

export default function AdminLoginScreen({ navigation }) {
  const [password, setPassword] = useState("");
  const [cargando, setCargando] = useState(false);

  const ingresar = async () => {
    if (!password) {
      Alert.alert("Error", "Ingresa la contraseña");
      return;
    }
    setCargando(true);
    let ok;
    try { ok = await loginAdmin(password); } catch (_) { ok = false; }
    setCargando(false);
    if (ok) {
      navigation.replace("AdminDrawer");
    } else {
      Alert.alert("Error", "Contraseña incorrecta");
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Text style={styles.backText}>← Volver</Text>
      </TouchableOpacity>

      <View style={styles.card}>
        <Text style={styles.lockIcon}>🔐</Text>
        <Text style={styles.title}>Acceso administrador</Text>
        <TextInput
          style={styles.input}
          placeholder="Contraseña"
          placeholderTextColor="#999"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        <TouchableOpacity
          style={[styles.loginBtn, cargando && { opacity: 0.5 }]}
          disabled={cargando}
          onPress={ingresar}
        >
          <Text style={styles.loginText}>
            {cargando ? "Verificando..." : "Ingresar"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#121212" },
  backBtn: { paddingHorizontal: 20, paddingTop: 50, paddingBottom: 10 },
  backText: { color: "#D4AF37", fontSize: 18, fontWeight: "bold" },
  card: { marginHorizontal: 15, marginTop: 40, backgroundColor: "#1E1E1E", borderRadius: 25, padding: 30, alignItems: "center" },
  lockIcon: { fontSize: 50 },
  title: { color: "#D4AF37", fontSize: 24, fontWeight: "bold", marginTop: 15, marginBottom: 25 },
  input: { backgroundColor: "#2A2A2A", color: "white", padding: 15, borderRadius: 12, fontSize: 16, width: "100%" },
  loginBtn: { backgroundColor: "#D4AF37", padding: 15, borderRadius: 12, alignItems: "center", marginTop: 20, width: "100%" },
  loginText: { color: "#121212", fontSize: 18, fontWeight: "bold" },
});
