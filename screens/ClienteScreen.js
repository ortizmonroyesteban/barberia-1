import React, { useEffect, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert } from "react-native";
import DatePicker from "../components/DatePicker";
import { globalStyles } from "../styles/globalStyles";

import {
  obtenerBarberos,
} from "../services/barberosService";

import {
  registrarCita,
  obtenerCitasPorBarberoYFecha,
} from "../services/citasService";

import {
  obtenerTodasLasAsignaciones,
} from "../services/barberoSillasService";

import { horas } from "../utils/horarios";

export default function ClienteScreen() {
  const [clienteNombre, setClienteNombre] =
    useState("");

  const [horaSeleccionada, setHoraSeleccionada] =
    useState(null);

  const [barberos, setBarberos] = useState([]);

  const [barberoSeleccionado, setBarberoSeleccionado] =
    useState(null);

  const [asignaciones, setAsignaciones] = useState([]);

  const [cargando, setCargando] = useState(false);

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const maxDate = new Date(hoy);
  maxDate.setDate(maxDate.getDate() + 7);

  const formatDate = (d) => {
    const diaSemana = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"][d.getDay()];
    const mes = String(d.getMonth() + 1).padStart(2, "0");
    const dia = String(d.getDate()).padStart(2, "0");
    return `${diaSemana} ${dia}/${mes}`;
  };

  const toLocalDateStr = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  const hoyLocalStr = toLocalDateStr(hoy);

  const [fechaSeleccionada, setFechaSeleccionada] = useState(hoyLocalStr);
  const [citasDelDia, setCitasDelDia] = useState([]);

  useEffect(() => {
    cargarBarberos();
    cargarAsignaciones();
  }, []);

  useEffect(() => {
    if (barberoSeleccionado && fechaSeleccionada) {
      obtenerCitasPorBarberoYFecha(barberoSeleccionado.id, fechaSeleccionada).then(setCitasDelDia);
    } else {
      setCitasDelDia([]);
    }
  }, [barberoSeleccionado, fechaSeleccionada]);

  useEffect(() => {
    if (horaSeleccionada && !horaDisponible(horaSeleccionada)) {
      setHoraSeleccionada(null);
    }
  }, [fechaSeleccionada, citasDelDia]);

  const horaDisponible = (hora) => {
    if (citasDelDia.includes(hora)) return false;
    if (fechaSeleccionada === hoyLocalStr) {
      const ahora = new Date();
      const minutosActuales = ahora.getHours() * 60 + ahora.getMinutes();
      const [h, m] = hora.split(":").map(Number);
      return h * 60 + m > minutosActuales;
    }
    return true;
  };

  const cargarBarberos = async () => {
    const data = await obtenerBarberos();

    setBarberos(data);
  };

  const cargarAsignaciones = async () => {
    const data = await obtenerTodasLasAsignaciones();
    setAsignaciones(data);
  };

  const reservar = async () => {
    if (
      !clienteNombre ||
      !barberoSeleccionado ||
      !fechaSeleccionada ||
      !horaSeleccionada
    ) {
      Alert.alert(
        "Error",
        "Completa toda la información"
      );
      return;
    }

    const asignacion = asignaciones.find(a => a.barbero_id === barberoSeleccionado.id);
    if (!asignacion) {
      Alert.alert("Error", "El barbero no tiene una silla asignada");
      return;
    }

    setCargando(true);

    const resultado = await registrarCita({
      clienteNombre,
      sillaId: asignacion.silla_id,
      barberoId: barberoSeleccionado.id,
      fecha: fechaSeleccionada,
      hora: horaSeleccionada,
    });

    setCargando(false);

    if (resultado) {
      Alert.alert("Correcto", "Cita registrada");

      setClienteNombre("");
      setBarberoSeleccionado(null);
      setFechaSeleccionada(hoyLocalStr);
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
          Barbero
        </Text>

        <View style={globalStyles.grid}>
          {barberos.map((barbero) => {
            const inactivo = !barbero.activo;
            const sinSilla = !asignaciones.some(a => a.barbero_id === barbero.id);
            const seleccionado = barberoSeleccionado?.id === barbero.id;

            return (
              <TouchableOpacity
                key={barbero.id}
                disabled={inactivo || sinSilla}
                style={[
                  globalStyles.silla,
                  inactivo && { backgroundColor: "#555", opacity: 0.5 },
                  sinSilla && !inactivo && { backgroundColor: "#5C3A3A", opacity: 0.6 },
                  seleccionado && globalStyles.sillaSeleccionada,
                ]}
                onPress={() => setBarberoSeleccionado(barbero)}
              >
                <Text
                  style={[
                    globalStyles.sillaTexto,
                    inactivo && { color: "#999" },
                    sinSilla && !inactivo && { color: "#B56565" },
                    seleccionado && globalStyles.sillaTextoSeleccionado,
                  ]}
                >
                  ✂️ {barbero.nombre}
                  {inactivo ? " (Inactivo)" : sinSilla ? " (Sin silla)" : ""}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={globalStyles.card}>
        <Text style={globalStyles.section}>Fecha</Text>

        <DatePicker
          value={fechaSeleccionada}
          min={hoy}
          max={maxDate}
          formatDate={formatDate}
          onDateChange={setFechaSeleccionada}
        />
      </View>

      <View style={globalStyles.card}>
        <Text style={globalStyles.section}>
          Horarios
        </Text>

        <View style={globalStyles.grid}>
          {horas.map((hora) => {
            const ocupada = citasDelDia.includes(hora);
            const esPasada = !ocupada && !horaDisponible(hora);
            const disponible = !ocupada && !esPasada;
            const seleccionada = horaSeleccionada === hora;

            let bgColor;
            let txtColor;
            let opacidad = 1;

            if (seleccionada) {
              bgColor = "#D4AF37";
              txtColor = "#121212";
            } else if (ocupada) {
              bgColor = "#8B0000";
              txtColor = "#FF6B6B";
              opacidad = 0.6;
            } else if (esPasada) {
              bgColor = "#444";
              txtColor = "#777";
              opacidad = 0.4;
            } else {
              bgColor = "#333";
              txtColor = "white";
            }

            return (
              <TouchableOpacity
                key={hora}
                disabled={!disponible}
                style={[
                  globalStyles.horaBtn,
                  { backgroundColor: bgColor, opacity: opacidad },
                ]}
                onPress={() => setHoraSeleccionada(hora)}
              >
                <Text style={[globalStyles.horaTexto, { color: txtColor }]}>
                  {hora}
                  {ocupada ? " ❌" : ""}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <TouchableOpacity
        style={[
          globalStyles.reservarBtn,
          cargando && {
            opacity: 0.5,
          },
        ]}
        disabled={cargando}
        onPress={reservar}
      >
        <Text style={globalStyles.reservarTexto}>
          {cargando
            ? "Reservando..."
            : "Reservar cita"}
        </Text>
      </TouchableOpacity>
    </>
  );
}
