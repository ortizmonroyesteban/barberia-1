import React, { useState } from "react";
import { ScrollView, StatusBar } from "react-native";

import Header from "./components/Header";
import MenuTabs from "./components/MenuTabs";

import ClienteScreen from "./screens/ClienteScreen";
import AdminScreen from "./screens/AdminScreen";

import { globalStyles } from "./styles/globalStyles";

export default function App() {
  const [pantalla, setPantalla] = useState("cliente");

  return (
    <ScrollView style={globalStyles.container}>
      <StatusBar barStyle="light-content" />

      <Header />

      <MenuTabs
        pantalla={pantalla}
        setPantalla={setPantalla}
      />

      {pantalla === "cliente" ? (
        <ClienteScreen />
      ) : (
        <AdminScreen />
      )}
    </ScrollView>
  );
}
