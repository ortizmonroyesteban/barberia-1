import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert } from "react-native";
import { globalStyles } from "../../styles/globalStyles";

const CLAVE_ADMIN = "admin123";

export default function AdminLogin({ onLogin }) {
  const [password, setPassword] = useState("");

  const ingresar = () => {
    if (password === CLAVE_ADMIN) {
      onLogin();
    } else {
      Alert.alert("Error", "Contraseña incorrecta");
    }
  };

  return (
    <View style={globalStyles.card}>
      <Text style={globalStyles.section}>Acceso administrador</Text>
      <TextInput
        style={globalStyles.input}
        placeholder="Contraseña"
        placeholderTextColor="#999"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <TouchableOpacity style={globalStyles.addBtn} onPress={ingresar}>
        <Text style={globalStyles.addTexto}>Ingresar</Text>
      </TouchableOpacity>
    </View>
  );
}
