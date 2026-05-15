import React, { useState } from "react";
import { ScrollView } from "react-native";
import AdminLogin from "./admin/AdminLogin";
import BarberManager from "./admin/BarberManager";
import ChairManager from "./admin/ChairManager";
import CitasManager from "./admin/CitasManager";

export default function AdminScreen() {
  const [autenticado, setAutenticado] = useState(false);

  if (!autenticado) {
    return <AdminLogin onLogin={() => setAutenticado(true)} />;
  }

  return (
    <ScrollView>
      <BarberManager />
      <ChairManager />
      <CitasManager />
    </ScrollView>
  );
}
