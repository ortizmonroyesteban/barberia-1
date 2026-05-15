import React, { useRef } from "react";
import { TouchableOpacity, Text, View } from "react-native";

const toDateStr = (d) => {
  if (!d) return "";
  if (typeof d === "string") return d;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

export default function DatePicker({ value, min, max, onDateChange, formatDate }) {
  const inputRef = useRef(null);

  const abrir = () => {
    inputRef.current?.showPicker?.() ?? inputRef.current?.click();
  };

  return (
    <View style={{ position: "relative" }}>
      <input
        ref={inputRef}
        type="date"
        value={value || ""}
        min={toDateStr(min)}
        max={toDateStr(max)}
        onChange={(e) => onDateChange(e.target.value)}
        style={{
          position: "absolute", opacity: 0, width: 1, height: 1, top: 0, left: 0, zIndex: -1,
        }}
        tabIndex={-1}
      />
      <TouchableOpacity
        style={{ backgroundColor: "#2A2A2A", padding: 15, borderRadius: 12, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}
        onPress={abrir}
      >
        <Text style={{ color: value ? "white" : "#999" }}>
          {value ? (formatDate ? formatDate(new Date(value + "T12:00:00")) : value) : "Seleccionar fecha"}
        </Text>
        <Text style={{ color: "#D4AF37", fontSize: 18 }}>📅</Text>
      </TouchableOpacity>
    </View>
  );
}
