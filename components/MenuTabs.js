import React from "react";
import { View, TouchableOpacity, Text,} from "react-native";

import { globalStyles } from "../styles/globalStyles";

export default function MenuTabs({
  pantalla,
  setPantalla,
}) {
  return (
    <View style={globalStyles.menu}>
      <TouchableOpacity
        style={[
          globalStyles.menuBtn,
          pantalla === "cliente" &&
            globalStyles.menuActivo,
        ]}
        onPress={() =>
          setPantalla("cliente")
        }
      >
        <Text style={globalStyles.menuTexto}>
          Cliente
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          globalStyles.menuBtn,
          pantalla === "admin" &&
            globalStyles.menuActivo,
        ]}
        onPress={() => setPantalla("admin")}
      >
        <Text style={globalStyles.menuTexto}>
          Admin
        </Text>
      </TouchableOpacity>
    </View>
  );
}
