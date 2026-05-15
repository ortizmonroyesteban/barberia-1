import React, { useEffect, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert } from "react-native";
import { supabase } from "../../supabase";
import { globalStyles } from "../../styles/globalStyles";

export default function BarberManager() {
  const [barberos, setBarberos] = useState([]);
  const [nuevoBarbero, setNuevoBarbero] = useState("");
  const [cargando, setCargando] = useState(false);

  useEffect(() => { cargar(); }, []);

  const cargar = async () => {
    const { data } = await supabase.from("barberos").select("*").order("nombre");
    setBarberos(data || []);
  };

  const agregar = async () => {
    if (!nuevoBarbero) {
      Alert.alert("Error", "Ingresa el nombre");
      return;
    }
    setCargando(true);
    await supabase.from("barberos").insert([{ nombre: nuevoBarbero, activo: true }]);
    setNuevoBarbero("");
    await cargar();
    setCargando(false);
  };

  const eliminar = async (id) => {
    setCargando(true);
    await supabase.from("barberos").delete().eq("id", id);
    await cargar();
    setCargando(false);
  };

  return (
    <>
      <View style={globalStyles.card}>
        <Text style={globalStyles.section}>Registrar barbero</Text>
        <TextInput
          style={globalStyles.input}
          placeholder="Nombre del barbero"
          placeholderTextColor="#999"
          value={nuevoBarbero}
          onChangeText={setNuevoBarbero}
        />
        <TouchableOpacity
          style={[globalStyles.addBtn, cargando && { opacity: 0.5 }]}
          disabled={cargando}
          onPress={agregar}
        >
          <Text style={globalStyles.addTexto}>
            {cargando ? "Guardando..." : "Agregar barbero"}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={globalStyles.card}>
        <Text style={globalStyles.section}>Gestión de barberos</Text>
        {barberos.map((b) => (
          <View key={b.id} style={globalStyles.barberoCard}>
            <View>
              <Text style={globalStyles.barberoNombre}>{b.nombre}</Text>
              <Text style={globalStyles.citaTexto}>
                {b.activo ? "🟢 Activo" : "🔴 Inactivo"}
              </Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <TouchableOpacity
                style={{ backgroundColor: "red", padding: 10, borderRadius: 10, marginLeft: 10 }}
                onPress={() => eliminar(b.id)}
              >
                <Text style={{ color: "white" }}>Eliminar</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>
    </>
  );
}
