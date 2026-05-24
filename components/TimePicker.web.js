import React, { memo } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

const TimePicker = memo(function TimePicker({ value, onChange }) {
  const id = "time-picker-input";

  const handleChange = (e) => {
    onChange(e.target.value);
  };

  return (
    <View>
      <TouchableOpacity style={styles.btn} onPress={() => document.getElementById(id)?.showPicker()}>
        <Text style={styles.btnText}>{value || "Seleccionar"}</Text>
      </TouchableOpacity>
      <input
        id={id}
        type="time"
        value={value || "09:00"}
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
});

export default TimePicker;

const styles = StyleSheet.create({
  btn: { backgroundColor: "#2A2A2A", padding: 14, borderRadius: 12, alignItems: "center" },
  btnText: { color: "#C8962A", fontSize: 22, fontWeight: "bold" },
});
