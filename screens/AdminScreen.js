import React, { useEffect, useState } from "react";

import { View, Text, TextInput, TouchableOpacity, Switch, ScrollView, Alert,} from "react-native";

import { supabase } from "../supabase";

import { globalStyles } from "../styles/globalStyles";

export default function AdminScreen() {
  const CLAVE_ADMIN = "admin123";

  const [autenticado, setAutenticado] =
    useState(false);

  const [password, setPassword] =
    useState("");

  const [barberos, setBarberos] =
    useState([]);

  const [sillas, setSillas] = useState([]);

  const [citas, setCitas] = useState([]);

  const [nuevoBarbero, setNuevoBarbero] =
    useState("");

  useEffect(() => {
    if (autenticado) {
      cargarDatos();
    }
  }, [autenticado]);

  const cargarDatos = async () => {
    obtenerBarberos();
    obtenerSillas();
    obtenerCitas();
  };

  const obtenerBarberos = async () => {
    const { data } = await supabase
      .from("barberos")
      .select("*");

    setBarberos(data || []);
  };

  const agregarBarbero = async () => {
    if (!nuevoBarbero) {
      Alert.alert(
        "Error",
        "Ingresa el nombre"
      );

      return;
    }

    await supabase.from("barberos").insert([
      {
        nombre: nuevoBarbero,
        activo: true,
      },
    ]);

    setNuevoBarbero("");

    obtenerBarberos();
  };

  const eliminarBarbero = async (id) => {
    await supabase
      .from("barberos")
      .delete()
      .eq("id", id);

    obtenerBarberos();
  };

  const cambiarEstado = async (
    id,
    estado
  ) => {
    await supabase
      .from("barberos")
      .update({
        activo: !estado,
      })
      .eq("id", id);

    obtenerBarberos();
  };

  const obtenerSillas = async () => {
    const { data } = await supabase
      .from("sillas")
      .select("*")
      .order("numero");

    setSillas(data || []);
  };

  const agregarSilla = async () => {
    const numero = sillas.length + 1;

    await supabase.from("sillas").insert([
      {
        numero,
        estado: "libre",
      },
    ]);

    obtenerSillas();
  };

  const eliminarSilla = async (id) => {
    await supabase
      .from("sillas")
      .delete()
      .eq("id", id);

    obtenerSillas();
  };

  const obtenerCitas = async () => {
    const { data } = await supabase
      .from("citas")
      .select("*")
      .order("created_at", {
        ascending: false,
      });

    setCitas(data || []);
  };

  const eliminarCita = async (id) => {
    await supabase
      .from("citas")
      .delete()
      .eq("id", id);

    obtenerCitas();
  };

  if (!autenticado) {
    return (
      <View style={globalStyles.card}>
        <Text style={globalStyles.section}>
          Acceso administrador
        </Text>

        <TextInput
          style={globalStyles.input}
          placeholder="Contraseña"
          placeholderTextColor="#999"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <TouchableOpacity
          style={globalStyles.addBtn}
          onPress={() => {
            if (password === CLAVE_ADMIN) {
              setAutenticado(true);
            } else {
              Alert.alert(
                "Error",
                "Contraseña incorrecta"
              );
            }
          }}
        >
          <Text style={globalStyles.addTexto}>
            Ingresar
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView>
      {/* AGREGAR BARBERO */}

      <View style={globalStyles.card}>
        <Text style={globalStyles.section}>
          Registrar barbero
        </Text>

        <TextInput
          style={globalStyles.input}
          placeholder="Nombre del barbero"
          placeholderTextColor="#999"
          value={nuevoBarbero}
          onChangeText={setNuevoBarbero}
        />

        <TouchableOpacity
          style={globalStyles.addBtn}
          onPress={agregarBarbero}
        >
          <Text style={globalStyles.addTexto}>
            Agregar barbero
          </Text>
        </TouchableOpacity>
      </View>

      {/* LISTADO BARBEROS */}

      <View style={globalStyles.card}>
        <Text style={globalStyles.section}>
          Gestión de barberos
        </Text>

        {barberos.map((barbero) => (
          <View
            key={barbero.id}
            style={globalStyles.barberoCard}
          >
            <View>
              <Text
                style={globalStyles.barberoNombre}
              >
                {barbero.nombre}
              </Text>

              <Text
                style={globalStyles.citaTexto}
              >
                {barbero.activo
                  ? "🟢 Activo"
                  : "🔴 Inactivo"}
              </Text>
            </View>

            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <Switch
                value={barbero.activo}
                onValueChange={() =>
                  cambiarEstado(
                    barbero.id,
                    barbero.activo
                  )
                }
              />

              <TouchableOpacity
                style={{
                  backgroundColor: "red",
                  padding: 10,
                  borderRadius: 10,
                  marginLeft: 10,
                }}
                onPress={() =>
                  eliminarBarbero(
                    barbero.id
                  )
                }
              >
                <Text
                  style={{ color: "white" }}
                >
                  Eliminar
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>

      {/* GESTIÓN SILLAS */}

      <View style={globalStyles.card}>
        <Text style={globalStyles.section}>
          Gestión de sillas
        </Text>

        <TouchableOpacity
          style={globalStyles.addBtn}
          onPress={agregarSilla}
        >
          <Text style={globalStyles.addTexto}>
            Agregar silla
          </Text>
        </TouchableOpacity>

        {sillas.map((silla) => (
          <View
            key={silla.id}
            style={globalStyles.barberoCard}
          >
            <Text
              style={globalStyles.barberoNombre}
            >
              💺 Silla {silla.numero}
            </Text>

            <TouchableOpacity
              style={{
                backgroundColor: "red",
                padding: 10,
                borderRadius: 10,
              }}
              onPress={() =>
                eliminarSilla(silla.id)
              }
            >
              <Text style={{ color: "white" }}>
                Eliminar
              </Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>

      {/* CITAS */}

      <View style={globalStyles.card}>
        <Text style={globalStyles.section}>
          Citas agendadas
        </Text>

        {citas.map((cita) => (
          <View
            key={cita.id}
            style={globalStyles.citaCard}
          >
            <Text style={globalStyles.citaTexto}>
              👤 {cita.cliente_nombre}
            </Text>

            <Text style={globalStyles.citaTexto}>
              📅 {cita.fecha}
            </Text>

            <Text style={globalStyles.citaTexto}>
              🕒 {cita.hora}
            </Text>

            <TouchableOpacity
              style={{
                backgroundColor: "red",
                padding: 10,
                borderRadius: 10,
                marginTop: 10,
              }}
              onPress={() =>
                eliminarCita(cita.id)
              }
            >
              <Text style={{ color: "white" }}>
                Eliminar cita
              </Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
