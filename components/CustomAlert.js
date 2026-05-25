import React, { createContext, useContext, useState, useCallback } from "react";
import { View, Text, TouchableOpacity, Modal, StyleSheet } from "react-native";

const AlertContext = createContext();

export function AlertProvider({ children }) {
  const [visible, setVisible] = useState(false);
  const [config, setConfig] = useState({ title: "", message: "", buttons: [] });

  const showAlert = useCallback((title, message, buttons) => {
    setConfig({ title, message, buttons: buttons || [{ text: "OK" }] });
    setVisible(true);
  }, []);

  const hideAlert = useCallback(() => {
    setVisible(false);
  }, []);

  return (
    <AlertContext.Provider value={{ showAlert }}>
      {children}
      <Modal visible={visible} transparent animationType="fade" onRequestClose={hideAlert}>
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <Text style={styles.title}>{config.title}</Text>
            <Text style={styles.message}>{config.message}</Text>
            <View style={styles.buttonsRow}>
              {config.buttons.map((btn, i) => (
                <TouchableOpacity
                  key={i}
                  style={[
                    styles.btn,
                    i === config.buttons.length - 1 ? styles.btnPrimary : styles.btnSecondary,
                    config.buttons.length === 1 && { flex: 1 },
                  ]}
                  onPress={() => {
                    hideAlert();
                    if (btn.onPress) btn.onPress();
                  }}
                >
                  <Text style={[styles.btnText, i === config.buttons.length - 1 ? styles.btnTextPrimary : styles.btnTextSecondary]}>
                    {btn.text || "OK"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>
    </AlertContext.Provider>
  );
}

export function useAlert() {
  return useContext(AlertContext);
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "center", alignItems: "center", padding: 30 },
  modal: { backgroundColor: "#1E1E1E", borderRadius: 25, padding: 28, width: "100%", maxWidth: 380, elevation: 8, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8 },
  title: { color: "#C8962A", fontSize: 20, fontWeight: "bold", textAlign: "center", marginBottom: 12 },
  message: { color: "#CCC", fontSize: 15, textAlign: "center", lineHeight: 22, marginBottom: 24 },
  buttonsRow: { flexDirection: "row", gap: 10 },
  btn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: "center" },
  btnPrimary: { backgroundColor: "#C8962A" },
  btnSecondary: { backgroundColor: "#555" },
  btnText: { fontWeight: "bold", fontSize: 15 },
  btnTextPrimary: { color: "#1A1A2E" },
  btnTextSecondary: { color: "white" },
});
