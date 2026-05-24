import React, { useState, memo } from "react";
import { TouchableOpacity, Text, View, Platform } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";

const DatePicker = memo(function DatePicker({ value, min, max, onChange }) {
  const [show, setShow] = useState(false);

  const displayValue = value
    ? value.toLocaleDateString("es-ES", { weekday: "long", year: "numeric", month: "long", day: "numeric" })
    : null;

  const handleChange = (_event, date) => {
    if (Platform.OS === "android") setShow(false);
    if (date && onChange) onChange(date);
  };

  return (
    <>
      <TouchableOpacity
        style={{ backgroundColor: "#2A2A2A", padding: 15, borderRadius: 12, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}
        onPress={() => setShow(true)}
      >
        <Text style={{ color: value ? "white" : "#999" }}>
          {displayValue || "Seleccionar fecha"}
        </Text>
        <Text style={{ color: "#C8962A", fontSize: 18 }}>📅</Text>
      </TouchableOpacity>
      {show && Platform.OS === "android" && (
        <DateTimePicker
          value={value || new Date()}
          mode="date"
          minimumDate={min}
          maximumDate={max}
          onChange={handleChange}
        />
      )}
      {show && Platform.OS === "ios" && (
        <View style={{ marginTop: 10, backgroundColor: "#2A2A2A", borderRadius: 12, padding: 10 }}>
          <DateTimePicker
            value={value || new Date()}
            mode="date"
            minimumDate={min}
            maximumDate={max}
            onChange={handleChange}
            style={{ backgroundColor: "#2A2A2A" }}
          />
          <TouchableOpacity
            style={{ backgroundColor: "#C8962A", padding: 12, borderRadius: 10, alignItems: "center", marginTop: 5 }}
            onPress={() => setShow(false)}
          >
            <Text style={{ color: "#1A1A2E", fontWeight: "bold" }}>Listo</Text>
          </TouchableOpacity>
        </View>
      )}
    </>
  );
});

export default DatePicker;
