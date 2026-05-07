import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView, TextInput, ActivityIndicator,} from "react-native";

import { supabase } from "./supabase";

export default function App() {
  const [sillas, setSillas] = useState([]);
  const [sillaSeleccionada, setSillaSeleccionada] = useState(null);

  const [horaSeleccionada, setHoraSeleccionada] = useState(null);

  const [nombreCliente, setNombreCliente] = useState("");

  const [loading, setLoading] = useState(true);

  const horas = [
    "09:00",
    "10:00",
    "11:00",
    "12:00",
    "14:00",
    "15:00",
  ];

  // =========================
  // OBTENER SILLAS
  // =========================

  useEffect(() => {
    obtenerSillas();
  }, []);

  const obtenerSillas = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("sillas")
      .select("*")
      .order("numero", { ascending: true });

    if (error) {
      console.log(error);
      Alert.alert("Error", "No se pudieron cargar las sillas");
    } else {
      setSillas(data);
    }

    setLoading(false);
  };

  // =========================
  // GUARDAR CITA
  // =========================

  const reservarCita = async () => {
    if (!nombreCliente) {
      Alert.alert("Error", "Ingresa tu nombre");
      return;
    }

    if (!sillaSeleccionada) {
      Alert.alert("Error", "Selecciona una silla");
      return;
    }

    if (!horaSeleccionada) {
      Alert.alert("Error", "Selecciona una hora");
      return;
    }

    const fechaActual = new Date().toISOString().split("T")[0];

    const { error } = await supabase.from("citas").insert([
      {
        cliente_nombre: nombreCliente,
        silla_id: sillaSeleccionada.id,
        fecha: fechaActual,
        hora: horaSeleccionada,
      },
    ]);

    if (error) {
      console.log(error);
      Alert.alert("Error", "No se pudo guardar la cita");
    } else {
      Alert.alert(
        "Cita Reservada",
        `${nombreCliente}, tu cita fue registrada`
      );

      // Reiniciar formulario
      setNombreCliente("");
      setSillaSeleccionada(null);
      setHoraSeleccionada(null);

      obtenerSillas();
    }
  };

  // =========================
  // PANTALLA DE CARGA
  // =========================

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="black" />
        <Text>Cargando información...</Text>
      </View>
    );
  }

  // =========================
  // INTERFAZ
  // =========================

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.titulo}>Barbería Tauros</Text>

      <Text style={styles.descripcion}>
        Reserva tu cita fácilmente desde tu celular
      </Text>

      {/* NOMBRE */}
      <Text style={styles.subtitulo}>Nombre del cliente</Text>

      <TextInput
        style={styles.input}
        placeholder="Ingresa tu nombre"
        value={nombreCliente}
        onChangeText={setNombreCliente}
      />

      {/* SILLAS */}
      <Text style={styles.subtitulo}>Selecciona una silla</Text>

      <View style={styles.grid}>
        {sillas.map((silla) => (
          <TouchableOpacity
            key={silla.id}
            style={[
              styles.botonSilla,
              sillaSeleccionada?.id === silla.id &&
                styles.sillaSeleccionada,
            ]}
            onPress={() => setSillaSeleccionada(silla)}
          >
            <Text style={styles.textoBoton}>
              Silla {silla.numero}
            </Text>

            <Text style={styles.estado}>
              {silla.estado === "libre"
                ? "🟢 Libre"
                : "🔴 Ocupada"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* HORAS */}
      <Text style={styles.subtitulo}>Selecciona una hora</Text>

      <View style={styles.grid}>
        {horas.map((hora) => (
          <TouchableOpacity
            key={hora}
            style={[
              styles.botonHora,
              horaSeleccionada === hora &&
                styles.horaSeleccionada,
            ]}
            onPress={() => setHoraSeleccionada(hora)}
          >
            <Text style={styles.textoBoton}>{hora}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* BOTON */}
      <TouchableOpacity
        style={styles.botonReservar}
        onPress={reservarCita}
      >
        <Text style={styles.textoReservar}>
          Reservar cita
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// =========================
// ESTILOS
// =========================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f2f2f2",
    padding: 20,
    marginTop: 40,
  },

  titulo: {
    fontSize: 30,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
    color: "#111",
  },

  descripcion: {
    textAlign: "center",
    fontSize: 16,
    marginBottom: 20,
    color: "#555",
  },

  subtitulo: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 10,
    color: "#222",
  },

  input: {
    backgroundColor: "white",
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ccc",
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  botonSilla: {
    width: "48%",
    backgroundColor: "#ddd",
    padding: 20,
    borderRadius: 12,
    marginBottom: 10,
    alignItems: "center",
  },

  sillaSeleccionada: {
    backgroundColor: "#4CAF50",
  },

  botonHora: {
    backgroundColor: "#999",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    width: "30%",
    alignItems: "center",
  },

  horaSeleccionada: {
    backgroundColor: "#2196F3",
  },

  textoBoton: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },

  estado: {
    marginTop: 5,
    color: "white",
    fontWeight: "bold",
  },

  botonReservar: {
    backgroundColor: "black",
    padding: 18,
    borderRadius: 12,
    marginTop: 30,
    marginBottom: 40,
    alignItems: "center",
  },

  textoReservar: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});