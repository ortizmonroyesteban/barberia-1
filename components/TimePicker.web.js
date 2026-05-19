import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

export default function TimePicker({ value, onTimeChange }) {
  const id = "time-picker-input";

  const handleChange = (e) => {
    onTimeChange(e.target.value);
  };

  return (
    <View>
      <TouchableOpacity style={styles.btn} onPress={() => document.getElementById(id)?.showPicker()}>
        <Text style={styles.btnText}>{value}</Text>
      </TouchableOpacity>
      <input
        id={id}
        type="time"
        value={value}
        onChange={handleChange}
        style={{
          position: "absolute",
          opacity: 0,
          width: 0,
          height: 0,
          pointerEvents: "none",
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  btn: { backgroundColor: "#2A2A2A", padding: 14, borderRadius: 12, alignItems: "center" },
  btnText: { color: "#D4AF37", fontSize: 22, fontWeight: "bold" },
});
