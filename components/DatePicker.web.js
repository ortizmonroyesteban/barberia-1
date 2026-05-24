import React, { useRef, memo } from "react";
import { TouchableOpacity, Text, View } from "react-native";

const toDateStr = (d) => {
  if (!d) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const DatePicker = memo(function DatePicker({ value, min, max, onChange }) {
  const inputRef = useRef(null);

  const abrir = () => {
    inputRef.current?.showPicker?.() ?? inputRef.current?.click();
  };

  const displayValue = value
    ? value.toLocaleDateString("es-ES", { weekday: "long", year: "numeric", month: "long", day: "numeric" })
    : null;

  return (
    <View style={{ position: "relative" }}>
      <input
        ref={inputRef}
        type="date"
        value={value ? toDateStr(value) : ""}
        min={toDateStr(min)}
        max={toDateStr(max)}
        onChange={(e) => {
          if (e.target.value && onChange) {
            const [y, m, d] = e.target.value.split("-").map(Number);
            onChange(new Date(y, m - 1, d));
          }
        }}
        style={{ position: "absolute", opacity: 0, width: 1, height: 1, top: 0, left: 0, zIndex: -1 }}
        tabIndex={-1}
      />
      <TouchableOpacity
        style={{ backgroundColor: "#2A2A2A", padding: 15, borderRadius: 12, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}
        onPress={abrir}
      >
        <Text style={{ color: value ? "white" : "#999" }}>
          {displayValue || "Seleccionar fecha"}
        </Text>
        <Text style={{ color: "#C8962A", fontSize: 18 }}>📅</Text>
      </TouchableOpacity>
    </View>
  );
});

export default DatePicker;
