import React, { useEffect, useState } from "react";

import { View, Text, TextInput, TouchableOpacity, Alert} from "react-native";

import { globalStyles } from "../styles/globalStyles";

import {
  obtenerSillas,
} from "../services/sillasService";

import {
  registrarCita,
} from "../services/citasService";

import { horas } from "../utils/horarios";

export default function ClienteScreen() {
  const [clienteNombre, setClienteNombre] =
    useState("");

  const [sillas, setSillas] = useState([]);

  const [sillaSeleccionada, setSillaSeleccionada] =
    useState(null);

  const [horaSeleccionada, setHoraSeleccionada] =
    useState(null);

  useEffect(() => {
    cargarSillas();
  }, []);

  const cargarSillas = async () => {
    const data = await obtenerSillas();

    setSillas(data);
  };

  const reservar = async () => {
    if (
      !clienteNombre ||
      !sillaSeleccionada ||
      !horaSeleccionada
    ) {
      Alert.alert(
        "Error",
        "Completa toda la información"
      );

      return;
    }

    const resultado = await registrarCita({
      clienteNombre,
      sillaId: sillaSeleccionada.id,
      hora: horaSeleccionada,
    });

    if (resultado) {
      Alert.alert(
        "Correcto",
        "Cita registrada"
      );

      setClienteNombre("");
      setSillaSeleccionada(null);
      setHoraSeleccionada(null);
    }
  };

  return (
    <>
      <View style={globalStyles.card}>
        <Text style={globalStyles.section}>
          Nombre del cliente
        </Text>

        <TextInput
          style={globalStyles.input}
          placeholder="Ingresa tu nombre"
          placeholderTextColor="#999"
          value={clienteNombre}
          onChangeText={setClienteNombre}
        />
      </View>

      <View style={globalStyles.card}>
        <Text style={globalStyles.section}>
          Sillas disponibles
        </Text>

        <View style={globalStyles.grid}>
          {sillas.map((silla) => (
            <TouchableOpacity
              key={silla.id}
              style={globalStyles.silla}
              onPress={() =>
                setSillaSeleccionada(silla)
              }
            >
              <Text
                style={globalStyles.sillaTexto}
              >
                💺 Silla {silla.numero}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={globalStyles.card}>
        <Text style={globalStyles.section}>
          Horarios
        </Text>

        <View style={globalStyles.grid}>
          {horas.map((hora) => (
            <TouchableOpacity
              key={hora}
              style={globalStyles.horaBtn}
              onPress={() =>
                setHoraSeleccionada(hora)
              }
            >
              <Text
                style={globalStyles.horaTexto}
              >
                {hora}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <TouchableOpacity
        style={globalStyles.reservarBtn}
        onPress={reservar}
      >
        <Text style={globalStyles.reservarTexto}>
          Reservar cita
        </Text>
      </TouchableOpacity>
    </>
  );
}
