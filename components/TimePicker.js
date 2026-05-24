import React, { useState, memo } from "react";
import { View, Text, TouchableOpacity, Platform, StyleSheet } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";

const parseTime = (timeStr) => {
  if (!timeStr) return new Date();
  const [h, m] = timeStr.split(":").map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d;
};

const TimePicker = memo(function TimePicker({ value, onChange }) {
  const [show, setShow] = useState(false);
  const date = parseTime(value);

  const handleChange = (_event, selectedDate) => {
    if (Platform.OS === "android") setShow(false);
    if (!selectedDate) return;
    const h = String(selectedDate.getHours()).padStart(2, "0");
    const m = String(selectedDate.getMinutes()).padStart(2, "0");
    onChange(`${h}:${m}`);
    if (Platform.OS === "ios") setShow(false);
  };

  return (
    <View>
      <TouchableOpacity style={styles.btn} onPress={() => setShow(true)}>
        <Text style={styles.btnText}>{value}</Text>
      </TouchableOpacity>
      {show && (
        <DateTimePicker
          value={date}
          mode="time"
          display="spinner"
          is24Hour
          onChange={handleChange}
        />
      )}
      {Platform.OS === "ios" && show && (
        <TouchableOpacity style={styles.doneBtn} onPress={() => setShow(false)}>
          <Text style={styles.doneText}>Listo</Text>
        </TouchableOpacity>
      )}
    </View>
  );
});

export default TimePicker;

const styles = StyleSheet.create({
  btn: { backgroundColor: "#2A2A2A", padding: 14, borderRadius: 12, alignItems: "center" },
  btnText: { color: "#C8962A", fontSize: 22, fontWeight: "bold" },
  doneBtn: { alignItems: "center", padding: 8 },
  doneText: { color: "#C8962A", fontWeight: "bold", fontSize: 16 },
});
