import React, { useEffect, useState, useCallback } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { supabase } from "../supabase";
import { globalStyles } from "../styles/globalStyles";
import { obtenerBarberos } from "../services/barberosService";
import { obtenerSillas } from "../services/sillasService";
import { obtenerTodasLasAsignaciones, asignarSilla, desasignarSilla } from "../services/barberoSillasService";

export default function BarberoScreen() {
  const [paso, setPaso] = useState("login");
  const [barberos, setBarberos] = useState([]);
  const [sillas, setSillas] = useState([]);
  const [barbero, setBarbero] = useState(null);
  const [asignaciones, setAsignaciones] = useState([]);
  const [cargando, setCargando] = useState(false);

  const cargarInicial = useCallback(async () => {
    const [barberosData, asignacionesData] = await Promise.all([
      obtenerBarberos(),
      obtenerTodasLasAsignaciones(),
    ]);
    setBarberos(barberosData);
    setAsignaciones(asignacionesData);
  }, []);

  useEffect(() => { cargarInicial(); }, [cargarInicial]);

  const entrar = async (b) => {
    setBarbero(b);
    setCargando(true);
    try {
      const [sillasData, todas] = await Promise.all([
        obtenerSillas(),
        obtenerTodasLasAsignaciones(),
      ]);
      setSillas(sillasData);
      setAsignaciones(todas);
    } catch (_) { setCargando(false); return; }
    setCargando(false);
    setPaso("asignacion");
  };

  const toggleSilla = async (sillaId) => {
    setCargando(true);
    try {
      const miAsignacion = asignaciones.find(a => a.barbero_id === barbero.id);

      if (miAsignacion && miAsignacion.silla_id === sillaId) {
        await desasignarSilla(barbero.id, sillaId);
        setAsignaciones(prev => prev.filter(a => a.barbero_id !== barbero.id));
      } else {
        if (miAsignacion) {
          await desasignarSilla(barbero.id, miAsignacion.silla_id);
          setAsignaciones(prev => prev.filter(a => a.barbero_id !== barbero.id));
        }
        await asignarSilla(barbero.id, sillaId);
        setAsignaciones(prev => [...prev, { barbero_id: barbero.id, silla_id: sillaId }]);
      }
    } catch (_) {}
    setCargando(false);
  };

  const toggleActivo = async () => {
    setCargando(true);
    try {
      const nuevoEstado = !barbero.activo;
      await supabase.from("barberos").update({ activo: nuevoEstado }).eq("id", barbero.id);
      if (!nuevoEstado) {
        const miAsignacion = asignaciones.find(a => a.barbero_id === barbero.id);
        if (miAsignacion) {
          await desasignarSilla(barbero.id, miAsignacion.silla_id);
          setAsignaciones(prev => prev.filter(a => a.barbero_id !== barbero.id));
        }
      }
      setBarbero(prev => ({ ...prev, activo: nuevoEstado }));
    } catch (_) {}
    setCargando(false);
  };

  const cerrarSesion = async () => {
    setBarbero(null);
    setAsignaciones([]);
    setSillas([]);
    setPaso("login");
    try { await cargarInicial(); } catch (_) {}
  };

  const barberoMap = {};
  barberos.forEach(b => { barberoMap[b.id] = b.nombre; });

  if (paso === "login") {
    return (
      <View style={globalStyles.card}>
        <Text style={globalStyles.section}>Selecciona tu nombre</Text>
        <View style={globalStyles.grid}>
          {barberos.map(b => {
            const sinSilla = !asignaciones.some(a => a.barbero_id === b.id);
            return (
            <TouchableOpacity
              key={b.id}
              style={[
                globalStyles.silla,
                !b.activo && { backgroundColor: "#555", opacity: 0.6 },
                sinSilla && b.activo && { backgroundColor: "#5C3A3A", opacity: 0.6 },
              ]}
              onPress={() => entrar(b)}
            >
              <Text style={[
                globalStyles.sillaTexto,
                !b.activo && { color: "#999" },
                sinSilla && b.activo && { color: "#B56565" },
              ]}>
                ✂️ {b.nombre}
                {!b.activo ? " (Inactivo)" : sinSilla ? " (Sin silla)" : ""}
              </Text>
            </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  }

  return (
    <View style={globalStyles.card}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 15 }}>
        <Text style={globalStyles.section}>✂️ {barbero.nombre}</Text>
        <TouchableOpacity
          style={{ backgroundColor: "#C0392B", paddingHorizontal: 15, paddingVertical: 8, borderRadius: 8 }}
          onPress={cerrarSesion}
        >
          <Text style={{ color: "white", fontWeight: "bold" }}>Salir</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={{
          backgroundColor: barbero.activo ? "#C0392B" : "#2E7D32",
          padding: 12, borderRadius: 12, alignItems: "center", marginBottom: 15,
        }}
        disabled={cargando}
        onPress={toggleActivo}
      >
        <Text style={{ color: "white", fontWeight: "bold", fontSize: 16 }}>
          {barbero.activo ? "🔴 Desactivarme" : "🟢 Activarme"}
        </Text>
      </TouchableOpacity>

      {!barbero.activo ? (
        <View style={{ backgroundColor: "#555", padding: 20, borderRadius: 12, marginBottom: 15, opacity: 0.6 }}>
          <Text style={{ color: "#999", textAlign: "center", fontWeight: "bold" }}>
            Activate para seleccionar sillas
          </Text>
        </View>
      ) : (
        <>
          <Text style={{ color: "#CCC", marginBottom: 15 }}>
            Toca las sillas donde trabajarás
          </Text>
          <View style={globalStyles.grid}>
            {sillas.map(s => {
              const asignacion = asignaciones.find(a => a.silla_id === s.id);
              const esMia = asignacion && asignacion.barbero_id === barbero.id;
              const esDeOtro = asignacion && asignacion.barbero_id !== barbero.id;

              let bgColor = "#444";
              let texto = "Disponible";
              let colorTexto = "#999";
              let disabled = cargando;

              if (esMia) {
                bgColor = "#2E7D32";
                texto = "Tu silla";
                colorTexto = "#A5D6A7";
              } else if (esDeOtro) {
                bgColor = "#8B0000";
                texto = `${barberoMap[asignacion.barbero_id] || "Ocupado"}`;
                colorTexto = "#FF6B6B";
                disabled = true;
              }

              return (
                <TouchableOpacity
                  key={s.id}
                  style={[globalStyles.silla, { backgroundColor: bgColor, opacity: esDeOtro ? 0.6 : 1 }]}
                  disabled={disabled}
                  onPress={() => toggleSilla(s.id)}
                >
                  <Text style={globalStyles.sillaTexto}>
                    💺 Silla {s.numero}
                  </Text>
                  <Text style={{ color: colorTexto, fontSize: 12, marginTop: 4 }}>
                    {texto}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </>
      )}
    </View>
  );
}
