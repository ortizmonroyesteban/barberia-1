import React from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";

export default function LoadingScreen({ message = "Cargando..." }) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#C8962A" />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

export function ErrorView({ message, onRetry }) {
  return (
    <View style={styles.container}>
      <Text style={styles.errorIcon}>⚠️</Text>
      <Text style={styles.errorText}>{message}</Text>
      {onRetry && (
        <Text style={styles.retryBtn} onPress={onRetry}>Reintentar</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#1A1A2E", padding: 30 },
  text: { color: "#C8962A", fontSize: 16, marginTop: 16, fontWeight: "bold" },
  errorIcon: { fontSize: 40 },
  errorText: { color: "#CCC", fontSize: 15, textAlign: "center", marginTop: 12, lineHeight: 22 },
  retryBtn: { color: "#C8962A", fontSize: 16, fontWeight: "bold", marginTop: 20, padding: 10, borderWidth: 1, borderColor: "#C8962A", borderRadius: 10, overflow: "hidden" },
});
