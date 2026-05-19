import React, { useEffect, useState, useCallback } from "react";
import { View, Text, TouchableOpacity, Alert, StyleSheet, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { supabase } from "../supabase";

import { obtenerBarberos } from "../services/barberosService";
import { obtenerSillas } from "../services/sillasService";
import { obtenerTodasLasAsignaciones, asignarSilla, desasignarSilla } from "../services/barberoSillasService";

export default function BarberoScreen() {
  const navigation = useNavigation();
  const [paso, setPaso] = useState("login");
  const [barberos, setBarberos] = useState([]);
  const [sillas, setSillas] = useState([]);
  const [barbero, setBarbero] = useState(null);
  const [asignaciones, setAsignaciones] = useState([]);
  const [citas, setCitas] = useState([]);
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

  useEffect(() => {
    const channel = supabase
      .channel("barbero-panel")
      .on("postgres_changes", { event: "*", schema: "public", table: "barberos" }, async () => {
        if (barbero) {
          const { data } = await       supabase.from("barberos").select("id, nombre, activo, admin_activo, especialidad").eq("id", barbero.id).single();
          if (data) setBarbero(data);
        }
        const d = await obtenerBarberos();
        setBarberos(d);
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "barbero_sillas" }, async () => {
        const d = await obtenerTodasLasAsignaciones();
        setAsignaciones(d);
        const s = await obtenerSillas();
        setSillas(s);
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "citas" }, async () => {
        if (barbero) {
          await limpiarCitasVencidas();
          const { data } = await supabase.from("citas").select("id, cliente_nombre, fecha, hora, telefono, estado, silla_id, sillas!silla_id(numero)").eq("barbero_id", barbero.id).order("fecha").order("hora");
          setCitas(data || []);
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [barbero?.id]);

  const entrar = async (b) => {
    setCargando(true);
    try {
      const { data } = await supabase.from("barberos").select("id, nombre, activo, admin_activo, especialidad").eq("id", b.id).single();
      if (data) setBarbero(data);
      else setBarbero(b);
      const s = await obtenerSillas();
      setSillas(s);
          await limpiarCitasVencidas();
      const { data: citasData } = await supabase.from("citas").select("id, cliente_nombre, fecha, hora, telefono, estado, silla_id, sillas!silla_id(numero)").eq("barbero_id", b.id).order("fecha").order("hora");
      setCitas(citasData || []);
    } catch (_) { setBarbero(b); }
    setCargando(false);
    setPaso("panel");
  };

  const toggleSilla = async (sillaId) => {
    const yaAsignada = asignaciones.find(a => a.barbero_id === barbero.id && a.silla_id === sillaId);
    setCargando(true);
    try {
      if (yaAsignada) {
        await desasignarSilla(barbero.id, sillaId);
        await supabase.from("sillas").update({ estado: "libre" }).eq("id", sillaId);
        setAsignaciones(prev => prev.filter(a => !(a.barbero_id === barbero.id && a.silla_id === sillaId)));
      } else {
        const miActual = asignaciones.find(a => a.barbero_id === barbero.id);
        if (miActual) {
          await desasignarSilla(barbero.id, miActual.silla_id);
          await supabase.from("sillas").update({ estado: "libre" }).eq("id", miActual.silla_id);
        }
        await asignarSilla(barbero.id, sillaId);
        await supabase.from("sillas").update({ estado: "ocupada" }).eq("id", sillaId);
        await supabase.from("citas").update({ silla_id: sillaId }).eq("barbero_id", barbero.id).in("estado", ["pendiente", "confirmada"]);
        setAsignaciones(prev => [...prev.filter(a => a.barbero_id !== barbero.id), { barbero_id: barbero.id, silla_id: sillaId }]);
      }
    } catch (_) {}
    setCargando(false);
  };

  const toggleActivo = async () => {
    if (!barbero.admin_activo) {
      Alert.alert("Bloqueado", "El administrador te ha desactivado. No puedes cambiarlo.");
      return;
    }
    setCargando(true);
    try {
      const nuevoEstado = !barbero.activo;
      await supabase.from("barberos").update({ activo: nuevoEstado }).eq("id", barbero.id);
      if (!nuevoEstado) {
        const miAsignacion = asignaciones.find(a => a.barbero_id === barbero.id);
        if (miAsignacion) {
          await desasignarSilla(barbero.id, miAsignacion.silla_id);
          await supabase.from("sillas").update({ estado: "libre" }).eq("id", miAsignacion.silla_id);
          setAsignaciones(prev => prev.filter(a => a.barbero_id !== barbero.id));
        }
      }
      setBarbero(prev => ({ ...prev, activo: nuevoEstado }));
    } catch (_) {}
    setCargando(false);
  };

  const cambiarEstadoCita = async (citaId, nuevoEstado) => {
    setCitas(prev => prev.map(c => c.id === citaId ? { ...c, estado: nuevoEstado } : c));
    try {
      await supabase.from("citas").update({ estado: nuevoEstado }).eq("id", citaId);
    } catch (_) {}
  };

  const limpiarCitasVencidas = async () => {
    try {
      const hoy = new Date();
      const fechaStr = hoy.toISOString().slice(0, 10);
      const horaStr = hoy.toTimeString().slice(0, 5);
      const ayer = new Date(hoy);
      ayer.setDate(ayer.getDate() - 1);
      const ayerStr = ayer.toISOString().slice(0, 10);
      await supabase.from("citas").delete().eq("estado", "cancelada").lt("fecha", fechaStr);
      await supabase.from("citas").delete().eq("estado", "cancelada").eq("fecha", fechaStr).lt("hora", horaStr);
      await supabase.from("citas").delete().eq("estado", "confirmada").lt("fecha", ayerStr);
    } catch (_) {}
  };

  const cerrarSesion = async () => {
    setBarbero(null);
    setAsignaciones([]);
    setSillas([]);
    setCitas([]);
    setPaso("login");
    try { await cargarInicial(); } catch (_) {}
  };

  const barberoMap = {};
  barberos.forEach(b => { barberoMap[b.id] = b.nombre; });

  if (paso === "login") {
    return (
      <SafeAreaView style={styles.container}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Volver</Text>
        </TouchableOpacity>
        <View style={styles.card}>
          <Text style={styles.section}>Selecciona tu nombre</Text>
          <View style={styles.grid}>
            {barberos.map(b => {
              const sinSilla = !asignaciones.some(a => a.barbero_id === b.id);
              return (
                <TouchableOpacity
                  key={b.id}
                  style={[
                    styles.sillaCard,
                    !b.activo && styles.barberoInactivo,
                    sinSilla && b.activo && styles.barberoSinSilla,
                  ]}
                  onPress={() => entrar(b)}
                >
                  <Text style={[
                    styles.sillaCardTexto,
                    !b.activo && styles.barberoInactivoTexto,
                    sinSilla && b.activo && styles.barberoSinSillaTexto,
                  ]}>
                    {b.nombre}
                    {!b.activo ? " (Inactivo)" : sinSilla ? " (Sin silla)" : ""}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Text style={styles.backText}>← Volver</Text>
      </TouchableOpacity>
      <ScrollView style={styles.scroll}>
        <View style={styles.card}>
          <View style={styles.panelHeader}>
            <Text style={styles.section}>{barbero.nombre}</Text>
            <TouchableOpacity style={styles.logoutBtn} onPress={cerrarSesion}>
              <Text style={styles.logoutBtnText}>Salir</Text>
            </TouchableOpacity>
          </View>

          {!barbero.admin_activo && (
            <View style={styles.adminBlockedBanner}>
              <Text style={styles.adminBlockedText}>🚫 Desactivado por administración</Text>
            </View>
          )}
          <TouchableOpacity
            style={[styles.toggleBtn, !barbero.admin_activo ? styles.toggleDisabled : (barbero.activo ? styles.toggleOff : styles.toggleOn)]}
            disabled={cargando || !barbero.admin_activo}
            onPress={toggleActivo}
          >
            <Text style={styles.toggleBtnText}>
              {!barbero.admin_activo ? "🔒 Bloqueado" : (barbero.activo ? "🔴 Desactivarme" : "🟢 Activarme")}
            </Text>
          </TouchableOpacity>

          {!barbero.activo ? (
            <View style={styles.inactivoOverlay}>
              <Text style={styles.inactivoOverlayText}>
                Actívate para seleccionar sillas
              </Text>
            </View>
          ) : (
            <>
              <Text style={styles.sillaHint}>Selecciona tu silla de trabajo (solo una)</Text>
              <View style={styles.grid}>
                {sillas.map(s => {
                  const asignacion = asignaciones.find(a => a.silla_id === s.id);
                  const esMia = asignacion && asignacion.barbero_id === barbero.id;
                  const esDeOtro = asignacion && asignacion.barbero_id !== barbero.id;

                  let bgColor = "#444";
                  let texto = "Disponible";
                  let colorTexto = "#999";
                  let disabled = cargando;

                  if (esMia) {
                    bgColor = "#4CAF50";
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
                      style={[
                        styles.sillaCard,
                        { backgroundColor: bgColor, opacity: esDeOtro ? 0.6 : 1 },
                        esMia && styles.miSilla,
                      ]}
                      disabled={disabled}
                      onPress={() => toggleSilla(s.id)}
                    >
                      <Text style={styles.sillaCardTexto}>
                        💺 Silla {s.numero}
                      </Text>
                      <Text style={[styles.sillaSubtexto, { color: colorTexto }]}>
                        {texto}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </>
          )}
        </View>

        <View style={styles.citasSection}>
          <Text style={styles.section}>📅 Mis citas</Text>
          {citas.length === 0 ? (
            <Text style={styles.sinCitas}>No tienes citas agendadas</Text>
          ) : (
            citas.map(c => {
              const pendiente = c.estado === "pendiente";
              const confirmada = c.estado === "confirmada";
              const cancelada = c.estado === "cancelada";
              return (
                <View key={c.id} style={[styles.citaCard, cancelada && styles.citaCancelada]}>
                  <View style={styles.citaHeader}>
                    <Text style={styles.citaCliente}>👤 {c.cliente_nombre}</Text>
                    <Text style={[styles.citaFecha, cancelada && { color: "#999" }]}>{c.fecha}</Text>
                  </View>
                  <Text style={styles.citaDetalle}>🕒 {c.hora?.slice(0, 5)}</Text>
                  <Text style={styles.citaDetalle}>💺 Silla {c.sillas?.numero || "?"}</Text>
                  {c.telefono && <Text style={styles.citaDetalle}>📞 {c.telefono}</Text>}
                  <Text style={[styles.citaEstado, confirmada && styles.estadoConfirmada, cancelada && styles.estadoCancelada]}>
                    {confirmada ? "✅ Confirmada" : cancelada ? "❌ Cancelada" : "⏳ Pendiente"}
                  </Text>
                  {pendiente && (
                    <View style={styles.citaAcciones}>
                      <TouchableOpacity style={styles.btnConfirmar} onPress={() => cambiarEstadoCita(c.id, "confirmada")}>
                        <Text style={styles.btnAccionTexto}>✅ Aceptar</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.btnCancelar} onPress={() => cambiarEstadoCita(c.id, "cancelada")}>
                        <Text style={styles.btnAccionTexto}>❌ Cancelar</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#121212" },
  backBtn: { paddingHorizontal: 20, paddingBottom: 10 },
  backText: { color: "#D4AF37", fontSize: 18, fontWeight: "bold" },

  barberoInactivo: { backgroundColor: "#555", opacity: 0.6 },
  barberoInactivoTexto: { color: "#999" },
  barberoSinSilla: { backgroundColor: "#5C3A3A", opacity: 0.6 },
  barberoSinSillaTexto: { color: "#B56565" },

  panelHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 15 },
  logoutBtn: { backgroundColor: "#C0392B", paddingHorizontal: 15, paddingVertical: 8, borderRadius: 8 },
  logoutBtnText: { color: "white", fontWeight: "bold" },

  toggleBtn: { padding: 12, borderRadius: 12, alignItems: "center", marginBottom: 15 },
  toggleOn: { backgroundColor: "#2E7D32" },
  toggleOff: { backgroundColor: "#C0392B" },
  toggleDisabled: { backgroundColor: "#555" },
  toggleBtnText: { color: "white", fontWeight: "bold", fontSize: 16 },
  adminBlockedBanner: { backgroundColor: "#8B0000", padding: 12, borderRadius: 12, marginBottom: 15, alignItems: "center" },
  adminBlockedText: { color: "white", fontWeight: "bold", fontSize: 14 },

  inactivoOverlay: { backgroundColor: "#555", padding: 20, borderRadius: 12, marginBottom: 15, opacity: 0.6 },
  inactivoOverlayText: { color: "#999", textAlign: "center", fontWeight: "bold" },

  card: { backgroundColor: "#1E1E1E", marginHorizontal: 15, marginBottom: 20, borderRadius: 20, padding: 20 },
  section: { color: "#FFF", fontSize: 20, fontWeight: "bold", marginBottom: 15 },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  sillaCard: { width: "48%", backgroundColor: "#2E7D32", padding: 18, borderRadius: 15, marginBottom: 10, alignItems: "center" },
  sillaCardTexto: { color: "white", fontWeight: "bold" },
  sillaHint: { color: "#CCC", marginBottom: 15 },
  miSilla: { borderWidth: 2, borderColor: "#4CAF50" },
  sillaSubtexto: { fontSize: 12, marginTop: 4 },
  scroll: { flex: 1 },
  citasSection: { marginHorizontal: 15, marginBottom: 30 },
  sinCitas: { color: "#999", textAlign: "center", marginTop: 10, fontSize: 14 },
  citaCard: { backgroundColor: "#2A2A2A", padding: 15, borderRadius: 15, marginBottom: 10 },
  citaHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 5 },
  citaCliente: { color: "white", fontSize: 16, fontWeight: "bold" },
  citaFecha: { color: "#D4AF37", fontSize: 14 },
  citaDetalle: { color: "#CCC", fontSize: 14, marginTop: 3 },
  citaEstado: { color: "#D4AF37", fontSize: 13, fontWeight: "bold", marginTop: 5 },
  estadoConfirmada: { color: "#4CAF50" },
  estadoCancelada: { color: "#999" },
  citaCancelada: { opacity: 0.5 },
  citaAcciones: { flexDirection: "row", justifyContent: "flex-end", gap: 10, marginTop: 10 },
  btnConfirmar: { backgroundColor: "#2E7D32", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
  btnCancelar: { backgroundColor: "#C0392B", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
  btnAccionTexto: { color: "white", fontWeight: "bold", fontSize: 14 },
});
