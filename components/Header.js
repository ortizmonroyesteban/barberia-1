import React from "react";
import { View, Text } from "react-native";

import { globalStyles } from "../styles/globalStyles";

export default function Header() {
  return (
    <View style={globalStyles.header}>
      <Text style={globalStyles.logo}>✂️</Text>

      <Text style={globalStyles.titulo}>
        Barbería Tauros
      </Text>

      <Text style={globalStyles.subtituloHeader}>
        Sistema de reservas
      </Text>
    </View>
  );
}
