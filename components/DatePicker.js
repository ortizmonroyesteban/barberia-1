import React, { useState } from "react";
import { TouchableOpacity, Text, View, Platform } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";

export default function DatePicker({ value, min, max, onDateChange, formatDate }) {
  const [show, setShow] = useState(false);

  const toLocalDateStr = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  const handleChange = (_event, date) => {
    if (Platform.OS === "android") setShow(false);
    if (date) onDateChange(toLocalDateStr(date));
  };

  return (
    <>
      <TouchableOpacity
        style={{ backgroundColor: "#2A2A2A", padding: 15, borderRadius: 12, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}
        onPress={() => setShow(true)}
      >
        <Text style={{ color: value ? "white" : "#999" }}>
          {value ? formatDate(new Date(value + "T12:00:00")) : "Seleccionar fecha"}
        </Text>
        <Text style={{ color: "#D4AF37", fontSize: 18 }}>📅</Text>
      </TouchableOpacity>
      {show && Platform.OS === "android" && (
        <DateTimePicker
          value={value ? new Date(value + "T12:00:00") : new Date()}
          mode="date"
          minimumDate={min}
          maximumDate={max}
          onChange={handleChange}
        />
      )}
      {show && Platform.OS === "ios" && (
        <View style={{ marginTop: 10, backgroundColor: "#2A2A2A", borderRadius: 12, padding: 10 }}>
          <DateTimePicker
            value={value ? new Date(value + "T12:00:00") : new Date()}
            mode="date"
            minimumDate={min}
            maximumDate={max}
            onChange={handleChange}
            style={{ backgroundColor: "#2A2A2A" }}
          />
          <TouchableOpacity
            style={{ backgroundColor: "#D4AF37", padding: 12, borderRadius: 10, alignItems: "center", marginTop: 5 }}
            onPress={() => setShow(false)}
          >
            <Text style={{ color: "#121212", fontWeight: "bold" }}>Listo</Text>
          </TouchableOpacity>
        </View>
      )}
    </>
  );
}
