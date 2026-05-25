import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Image, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { supabase } from "../supabase";
import { fechaLocal } from "../utils/horarios";
import { useAlert } from "../components/CustomAlert";

import { obtenerBarberos } from "../services/barberosService";
import { obtenerSillas } from "../services/sillasService";
import { obtenerTodasLasAsignaciones, asignarSilla, desasignarSilla } from "../services/barberoSillasService";

export default function BarberoScreen() {
  const navigation = useNavigation();
  const { showAlert } = useAlert();
  const [paso, setPaso] = useState("login");
  const [barberos, setBarberos] = useState([]);
  const [sillas, setSillas] = useState([]);
  const [barbero, setBarbero] = useState(null);
  const [asignaciones, setAsignaciones] = useState([]);
  const [citas, setCitas] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [selectedBarber, setSelectedBarber] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [telefonoInput, setTelefonoInput] = useState("");

  const BARBER_PASSWORD = "barbero123";

  const cargarInicial = useCallback(async () => {
    const [barberosData, asignacionesData] = await Promise.all([
      obtenerBarberos(),
      obtenerTodasLasAsignaciones(),
    ]);
    setBarberos(barberosData);
    setAsignaciones(asignacionesData);
  }, []);

  useEffect(() => { cargarInicial(); }, [cargarInicial]);

  const barberoRef = useRef(barbero);
  barberoRef.current = barbero;

  const limpiarCitasVencidas = useCallback(async () => {
    try {
      const hoy = new Date();
      const fechaStr = fechaLocal(hoy);
      const horaStr = hoy.toTimeString().slice(0, 5);
      const ayer = new Date(hoy);
      ayer.setDate(ayer.getDate() - 1);
      const ayerStr = fechaLocal(ayer);
      await supabase.from("citas").delete().eq("estado", "cancelada").lt("fecha", fechaStr);
      await supabase.from("citas").delete().eq("estado", "cancelada").eq("fecha", fechaStr).lt("hora", horaStr);
      await supabase.from("citas").delete().eq("estado", "confirmada").lt("fecha", ayerStr);
    } catch (_) {}
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel("barbero-panel")
      .on("postgres_changes", { event: "*", schema: "public", table: "barberos" }, async () => {
        const b = barberoRef.current;
        if (b) {
          const { data } = await supabase.from("barberos").select("id, nombre, activo, admin_activo, especialidad, foto_url, telefono").eq("id", b.id).single();
          if (data) { setBarbero(data); if (!telefonoInput && data.telefono) setTelefonoInput(data.telefono); }
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
        const b = barberoRef.current;
        if (b) {
          await limpiarCitasVencidas();
          const { data } = await supabase.from("citas").select("id, cliente_nombre, fecha, hora, telefono, estado, silla_id, sillas!silla_id(numero)").eq("barbero_id", b.id).order("fecha").order("hora");
          setCitas(data || []);
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const entrar = async (b) => {
    setCargando(true);
    try {
      const { data } = await supabase.from("barberos").select("id, nombre, activo, admin_activo, especialidad, foto_url, telefono").eq("id", b.id).single();
      if (data) { setBarbero(data); setTelefonoInput(data.telefono || ""); }
      else setBarbero(b);
      const s = await obtenerSillas();
      setSillas(s);
          await limpiarCitasVencidas();
      const { data: citasData } = await supabase.from("citas").select("id, cliente_nombre, fecha, hora, telefono, estado, silla_id, sillas!silla_id(numero)").eq("barbero_id", b.id).order("fecha").order("hora");
      setCitas(citasData || []);
    } catch (_) { setBarbero(b); }
    setCargando(false);
    setPaso("panel");
    setPasswordInput("");
    setSelectedBarber(null);
  };

  const verificarPassword = () => {
    if (passwordInput.trim() !== BARBER_PASSWORD) {
      showAlert("Error", "Contraseña incorrecta");
      setPasswordInput("");
      return;
    }
    if (selectedBarber) entrar(selectedBarber);
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
      showAlert("Bloqueado", "El administrador te ha desactivado. No puedes cambiarlo.");
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

  const guardarTelefono = async () => {
    setCargando(true);
    try {
      await supabase.from("barberos").update({ telefono: telefonoInput.trim() || null }).eq("id", barbero.id);
      setBarbero(prev => ({ ...prev, telefono: telefonoInput.trim() || null }));
      showAlert("Listo", "Número guardado");
    } catch (_) { showAlert("Error", "No se pudo guardar el número"); }
    setCargando(false);
  };

  const cambiarEstadoCita = async (citaId, nuevoEstado) => {
    setCitas(prev => prev.map(c => c.id === citaId ? { ...c, estado: nuevoEstado } : c));
    try {
      await supabase.from("citas").update({ estado: nuevoEstado }).eq("id", citaId);
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

  const barberoMap = useMemo(() => {
    const m = {};
    barberos.forEach(b => { m[b.id] = b.nombre; });
    return m;
  }, [barberos]);

  if (paso === "login") {
    return (
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Volver</Text>
        </TouchableOpacity>
        <View style={styles.card}>
          {!selectedBarber ? (
            <>
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
                      onPress={() => { setSelectedBarber(b); setPasswordInput(""); }}
                    >
                      {b.foto_url ? (
                        <Image source={{ uri: b.foto_url }} style={styles.barberoFoto} />
                      ) : (
                        <View style={[styles.barberoAvatar, b.admin_activo && b.activo ? styles.avatarActive : styles.avatarInactive]}>
                          <Text style={styles.barberoAvatarText}>{b.nombre?.charAt(0).toUpperCase() || "?"}</Text>
                        </View>
                      )}
                      <Text style={[
                        styles.sillaCardTexto,
                        !b.activo && styles.barberoInactivoTexto,
                        sinSilla && b.activo && styles.barberoSinSillaTexto,
                      ]}>
                        {b.nombre}
                      </Text>
                      <Text style={[
                        styles.sillaCardSub,
                        !b.admin_activo ? { color: "#999" } : !b.activo ? { color: "#999" } : sinSilla ? { color: "#B56565" } : { color: "#4CAF50" },
                      ]}>
                        {!b.admin_activo ? "Bloqueado" : !b.activo ? "Inactivo" : sinSilla ? "Sin silla" : "Disponible"}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </>
          ) : (
            <>
              <Text style={styles.section}>Contraseña</Text>
              <Text style={styles.passwordHint}>Ingresa la contraseña para {selectedBarber.nombre}</Text>
              <View style={styles.passwordRow}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Contraseña"
                  placeholderTextColor="#999"
                  secureTextEntry={!showPassword}
                  value={passwordInput}
                  onChangeText={setPasswordInput}
                  autoFocus
                />
                <TouchableOpacity style={styles.passwordEyeBtn} onPress={() => setShowPassword(!showPassword)}>
                  <View style={styles.eyeIcon}>
                    <Text style={styles.eyeText}>👁</Text>
                    {!showPassword && <View style={styles.eyeLine} />}
                  </View>
                </TouchableOpacity>
              </View>
              <TouchableOpacity style={styles.passwordConfirmBtn} onPress={verificarPassword}>
                <Text style={styles.passwordConfirmText}>Entrar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.passwordBackBtn} onPress={() => { setSelectedBarber(null); setPasswordInput(""); }}>
                <Text style={styles.passwordBackText}>← Cambiar barbero</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
        </KeyboardAvoidingView>
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
              <Text style={styles.adminBlockedText}>Desactivado por administración</Text>
            </View>
          )}
          <TouchableOpacity
            style={[styles.toggleBtn, !barbero.admin_activo ? styles.toggleDisabled : (barbero.activo ? styles.toggleOff : styles.toggleOn)]}
            disabled={cargando || !barbero.admin_activo}
            onPress={toggleActivo}
          >
            <Text style={styles.toggleBtnText}>
              {!barbero.admin_activo ? "Bloqueado (admin)" : (barbero.activo ? "Desactivarme" : "Activarme")}
            </Text>
          </TouchableOpacity>

          <View style={styles.telefonoSection}>
            <Text style={styles.telefonoLabel}>Tu número de contacto</Text>
            <View style={styles.telefonoRow}>
              <TextInput
                style={styles.telefonoInput}
                placeholder="Ej. 3001234567"
                placeholderTextColor="#999"
                keyboardType="phone-pad"
                value={telefonoInput}
                onChangeText={setTelefonoInput}
              />
              <TouchableOpacity style={styles.telefonoBtn} disabled={cargando} onPress={guardarTelefono}>
                <Text style={styles.telefonoBtnText}>{cargando ? "..." : "Guardar"}</Text>
              </TouchableOpacity>
            </View>
          </View>

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
                    colorTexto = "white";
                  } else if (esDeOtro) {
                    bgColor = "#9E9E9E";
                    texto = `${barberoMap[asignacion.barbero_id] || "Ocupado"} (Ocupada)`;
                    colorTexto = "white";
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
                        Silla {s.numero}
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
          <Text style={styles.section}>Mis citas</Text>
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
                    <Text style={styles.citaCliente}>Cliente: {c.cliente_nombre}</Text>
                    <Text style={[styles.citaFecha, cancelada && { color: "#999" }]}>{c.fecha}</Text>
                  </View>
                  <Text style={styles.citaDetalle}>Hora: {c.hora?.slice(0, 5)}</Text>
                  <Text style={styles.citaDetalle}>Silla {c.sillas?.numero || "?"}</Text>
                  {c.telefono && <Text style={styles.citaDetalle}>Teléfono: {c.telefono}</Text>}
                  <Text style={[styles.citaEstado, confirmada && styles.estadoConfirmada, cancelada && styles.estadoCancelada]}>
                    {confirmada ? "Confirmada" : cancelada ? "Cancelada" : "Pendiente"}
                  </Text>
                  {pendiente && (
                    <View style={styles.citaAcciones}>
                      <TouchableOpacity style={styles.btnConfirmar} onPress={() => cambiarEstadoCita(c.id, "confirmada")}>
                        <Text style={styles.btnAccionTexto}>Aceptar</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.btnCancelar} onPress={() => cambiarEstadoCita(c.id, "cancelada")}>
                        <Text style={styles.btnAccionTexto}>Cancelar</Text>
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
  container: { flex: 1, backgroundColor: "#1A1A2E" },
  backBtn: { paddingHorizontal: 20, paddingBottom: 10 },
  backText: { color: "#C8962A", fontSize: 18, fontWeight: "bold" },

  barberoInactivo: { backgroundColor: "#555" },
  barberoInactivoTexto: { color: "#999" },
  barberoSinSilla: { backgroundColor: "#9E9E9E" },
  barberoSinSillaTexto: { color: "white" },

  panelHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 15 },
  logoutBtn: { backgroundColor: "#9E9E9E", paddingHorizontal: 15, paddingVertical: 8, borderRadius: 8 },
  logoutBtnText: { color: "white", fontWeight: "bold" },

  toggleBtn: { padding: 12, borderRadius: 12, alignItems: "center", marginBottom: 15 },
  toggleOn: { backgroundColor: "#4CAF50" },
  toggleOff: { backgroundColor: "#9E9E9E" },
  toggleDisabled: { backgroundColor: "#555" },
  toggleBtnText: { color: "white", fontWeight: "bold", fontSize: 16 },
  adminBlockedBanner: { backgroundColor: "#9E9E9E", padding: 12, borderRadius: 12, marginBottom: 15, alignItems: "center" },
  adminBlockedText: { color: "white", fontWeight: "bold", fontSize: 14 },
  avatarActive: { backgroundColor: "#C8962A" },
  avatarInactive: { backgroundColor: "#555" },

  inactivoOverlay: { backgroundColor: "#555", padding: 20, borderRadius: 12, marginBottom: 15, opacity: 0.6 },
  inactivoOverlayText: { color: "#999", textAlign: "center", fontWeight: "bold" },

  card: { backgroundColor: "#1E1E1E", marginHorizontal: 15, marginBottom: 20, borderRadius: 20, padding: 20 },
  section: { color: "#FFF", fontSize: 20, fontWeight: "bold", marginBottom: 15 },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  barberoAvatar: { width: 60, height: 60, borderRadius: 10, justifyContent: "center", alignItems: "center", marginBottom: 8, borderWidth: 2, borderColor: "rgba(255,255,255,0.3)" },
  barberoFoto: { width: 60, height: 60, borderRadius: 10, marginBottom: 8, borderWidth: 2, borderColor: "#C8962A" },
  barberoAvatarText: { color: "white", fontSize: 20, fontWeight: "bold" },
  sillaCard: { width: "48%", backgroundColor: "#4CAF50", padding: 18, borderRadius: 15, marginBottom: 10, alignItems: "center" },
  sillaCardTexto: { color: "white", fontWeight: "bold", fontSize: 15, textAlign: "center" },
  sillaCardSub: { fontSize: 11, marginTop: 3, fontWeight: "bold" },
  sillaHint: { color: "#CCC", marginBottom: 15 },
  miSilla: { borderWidth: 2, borderColor: "#4CAF50" },
  sillaSubtexto: { fontSize: 12, marginTop: 4 },
  scroll: { flex: 1 },
  citasSection: { marginHorizontal: 15, marginBottom: 30 },
  sinCitas: { color: "#999", textAlign: "center", marginTop: 10, fontSize: 14 },
  citaCard: { backgroundColor: "#2A2A2A", padding: 15, borderRadius: 15, marginBottom: 10 },
  citaHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 5 },
  citaCliente: { color: "white", fontSize: 16, fontWeight: "bold" },
  citaFecha: { color: "#C8962A", fontSize: 14 },
  citaDetalle: { color: "#CCC", fontSize: 14, marginTop: 3 },
  citaEstado: { color: "#C8962A", fontSize: 13, fontWeight: "bold", marginTop: 5 },
  estadoConfirmada: { color: "#4CAF50" },
  estadoCancelada: { color: "#999" },
  citaCancelada: { opacity: 0.5 },
  citaAcciones: { flexDirection: "row", justifyContent: "flex-end", gap: 10, marginTop: 10 },
  btnConfirmar: { backgroundColor: "#4CAF50", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
  btnCancelar: { backgroundColor: "#9E9E9E", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
  btnAccionTexto: { color: "white", fontWeight: "bold", fontSize: 14 },
  passwordHint: { color: "#CCC", fontSize: 14, marginBottom: 15, textAlign: "center" },
  passwordRow: { width: "100%", flexDirection: "row", alignItems: "stretch", marginBottom: 15 },
  passwordInput: { backgroundColor: "#2A2A2A", color: "white", padding: 16, borderRadius: 12, fontSize: 16, borderWidth: 1, borderColor: "#333", flex: 1, borderTopRightRadius: 0, borderBottomRightRadius: 0 },
  passwordEyeBtn: { backgroundColor: "#2A2A2A", paddingHorizontal: 14, borderRadius: 12, borderWidth: 1, borderColor: "#333", borderTopLeftRadius: 0, borderBottomLeftRadius: 0, borderLeftWidth: 0, justifyContent: "center", alignItems: "center" },
  eyeIcon: { width: 24, height: 24, justifyContent: "center", alignItems: "center" },
  eyeText: { fontSize: 20 },
  eyeLine: { position: "absolute", width: "100%", height: 2, backgroundColor: "#C8962A", transform: [{ rotate: "-45deg" }] },
  passwordConfirmBtn: { backgroundColor: "#C8962A", padding: 16, borderRadius: 12, width: "100%", alignItems: "center", elevation: 4, shadowColor: "#C8962A", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 5 },
  passwordConfirmText: { color: "#1A1A2E", fontSize: 18, fontWeight: "bold" },
  passwordBackBtn: { marginTop: 12, alignItems: "center" },
  passwordBackText: { color: "#C8962A", fontSize: 15, fontWeight: "bold" },

  telefonoSection: { marginBottom: 15 },
  telefonoLabel: { color: "#CCC", fontSize: 14, marginBottom: 8 },
  telefonoRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  telefonoInput: { backgroundColor: "#2A2A2A", color: "white", padding: 14, borderRadius: 12, fontSize: 16, borderWidth: 1, borderColor: "#333", flex: 1 },
  telefonoBtn: { backgroundColor: "#C8962A", paddingHorizontal: 18, paddingVertical: 14, borderRadius: 12 },
  telefonoBtnText: { color: "#1A1A2E", fontWeight: "bold", fontSize: 14 },
});
