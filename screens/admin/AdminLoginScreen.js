import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { loginAdmin } from "../../services/adminAuthService";
import { useAlert } from "../../components/CustomAlert";

export default function AdminLoginScreen() {
  const navigation = useNavigation();
  const { showAlert } = useAlert();
  const [password, setPassword] = useState("");
  const [cargando, setCargando] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const ingresar = async () => {
    if (!password.trim()) { showAlert("Error", "Ingresa la contraseña"); return; }
    setCargando(true);
    const ok = await loginAdmin(password.trim());
    setCargando(false);
    if (ok) navigation.replace("AdminDrawer");
    else showAlert("Error", "Contraseña incorrecta");
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1, justifyContent: "center" }}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Volver</Text>
        </TouchableOpacity>

        <View style={styles.card}>
          <Text style={styles.lockIcon}>🔐</Text>
          <Text style={styles.title}>Acceso Admin</Text>
          <View style={styles.passwordRow}>
            <TextInput style={styles.input} placeholder="Contraseña" placeholderTextColor="#999"
              secureTextEntry={!showPassword} value={password} onChangeText={setPassword} />
            <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPassword(!showPassword)}>
              <View style={styles.eyeIcon}>
                <Text style={styles.eyeText}>👁</Text>
                {!showPassword && <View style={styles.eyeLine} />}
              </View>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={[styles.loginBtn, cargando && { opacity: 0.5 }]} disabled={cargando} onPress={ingresar}>
            <Text style={styles.loginText}>{cargando ? "..." : "Ingresar"}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1A1A2E" },
  backBtn: { paddingHorizontal: 20, paddingBottom: 10 },
  backText: { color: "#C8962A", fontSize: 18, fontWeight: "bold" },

  card: { marginHorizontal: 15, marginTop: 40, backgroundColor: "#1E1E1E", borderRadius: 25, padding: 30, alignItems: "center", elevation: 6, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6 },
  lockIcon: { fontSize: 50 },
  title: { color: "#C8962A", fontSize: 24, fontWeight: "bold", marginVertical: 16 },
  passwordRow: { width: "100%", flexDirection: "row", alignItems: "center", marginBottom: 16 },
  input: { backgroundColor: "#2A2A2A", color: "white", padding: 16, borderRadius: 12, fontSize: 16, borderWidth: 1, borderColor: "#333", flex: 1, borderTopRightRadius: 0, borderBottomRightRadius: 0 },
  eyeBtn: { backgroundColor: "#2A2A2A", padding: 16, borderRadius: 12, borderWidth: 1, borderColor: "#333", borderTopLeftRadius: 0, borderBottomLeftRadius: 0, borderLeftWidth: 0 },
  eyeIcon: { width: 24, height: 24, justifyContent: "center", alignItems: "center" },
  eyeText: { fontSize: 20 },
  eyeLine: { position: "absolute", width: "100%", height: 2, backgroundColor: "#C8962A", transform: [{ rotate: "-45deg" }] },
  loginBtn: { backgroundColor: "#C8962A", padding: 16, borderRadius: 12, width: "100%", alignItems: "center", elevation: 4, shadowColor: "#C8962A", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 5 },
  loginText: { color: "#1A1A2E", fontSize: 18, fontWeight: "bold" },
});
