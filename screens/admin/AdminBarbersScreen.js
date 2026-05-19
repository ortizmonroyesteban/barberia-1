import React, { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, Modal, TextInput, Switch, Alert, StyleSheet, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { supabase } from "../../supabase";
import { obtenerSillas } from "../../services/sillasService";

export default function AdminBarbersScreen() {
  const navigation = useNavigation();
  const [barberos, setBarberos] = useState([]);
  const [sillas, setSillas] = useState([]);
  const [asignaciones, setAsignaciones] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [nombreInput, setNombreInput] = useState("");
  const [especialidadInput, setEspecialidadInput] = useState("");
  const [sillaSeleccionada, setSillaSeleccionada] = useState(null);
  const [editando, setEditando] = useState(null);
  const [editNombre, setEditNombre] = useState("");
  const [editEspecialidad, setEditEspecialidad] = useState("");
  const [editSillaSeleccionada, setEditSillaSeleccionada] = useState(null);

  const cargar = async () => {
    const [b, s, a] = await Promise.all([
      supabase.from("barberos").select("id, nombre, activo, admin_activo, especialidad").order("nombre"),
      obtenerSillas(),
      supabase.from("barbero_sillas").select("silla_id, barbero_id"),
    ]);
    setBarberos(b.data || []);
    setSillas(s);
    setAsignaciones(a.data || []);
  };

  useEffect(() => { cargar(); }, []);

  useEffect(() => {
    const channel = supabase
      .channel("admin-barbers")
      .on("postgres_changes", { event: "*", schema: "public", table: "barberos" }, cargar)
      .on("postgres_changes", { event: "*", schema: "public", table: "barbero_sillas" }, cargar)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

    const sillaBarbero = (barberoId) => {
    const asig = asignaciones.find(a => a.barbero_id === barberoId);
    if (!asig) return null;
    return sillas.find(s => s.id === asig.silla_id);
  };

  const agregar = async () => {
    if (!nombreInput.trim()) { Alert.alert("Error", "Ingresa el nombre"); return; }
    setCargando(true);
    try {
      const { data, error } = await supabase
        .from("barberos")
        .insert([{ nombre: nombreInput.trim(), especialidad: especialidadInput.trim() || null, activo: true, admin_activo: true }])
        .select();
      if (error) { Alert.alert("Error", error.message); setCargando(false); return; }
      const nuevoBarbero = data?.[0];
      if (nuevoBarbero && sillaSeleccionada) {
        const { data: actual } = await supabase.from("barbero_sillas").select("barbero_id").eq("silla_id", sillaSeleccionada).maybeSingle();
        if (actual) await supabase.from("barbero_sillas").delete().eq("silla_id", sillaSeleccionada);
        await supabase.from("barbero_sillas").insert([{ barbero_id: nuevoBarbero.id, silla_id: sillaSeleccionada }]);
        await supabase.from("sillas").update({ estado: "ocupada" }).eq("id", sillaSeleccionada);
      }
      setNombreInput("");
      setEspecialidadInput("");
      setSillaSeleccionada(null);
      setModalVisible(false);
      await cargar();
    } catch (_) { Alert.alert("Error", "Error de conexión al agregar barbero"); }
    setCargando(false);
  };

  const toggleAdminActivo = async (barbero) => {
    const nuevo = !barbero.admin_activo;
    try {
      await supabase.from("barberos").update({ admin_activo: nuevo, activo: nuevo ? barbero.activo : false }).eq("id", barbero.id);
      if (!nuevo) {
        const { data: asigs } = await supabase.from("barbero_sillas").select("silla_id").eq("barbero_id", barbero.id);
        await supabase.from("barbero_sillas").delete().eq("barbero_id", barbero.id);
        if (asigs) for (const a of asigs) await supabase.from("sillas").update({ estado: "libre" }).eq("id", a.silla_id);
      }
      await cargar();
    } catch (_) {}
  };

  const abrirEditar = (barbero) => {
    setEditando(barbero);
    setEditNombre(barbero.nombre);
    setEditEspecialidad(barbero.especialidad || "");
    const asig = asignaciones.find(a => a.barbero_id === barbero.id);
    setEditSillaSeleccionada(asig ? asig.silla_id : null);
    setEditModalVisible(true);
  };

  const guardarEdicion = async () => {
    if (!editNombre.trim()) { Alert.alert("Error", "El nombre no puede estar vacío"); return; }
    setCargando(true);
    try {
      const { error } = await supabase
        .from("barberos")
        .update({ nombre: editNombre.trim(), especialidad: editEspecialidad.trim() || null })
        .eq("id", editando.id);
      if (error) { Alert.alert("Error", error.message); setCargando(false); return; }
      const asigActual = asignaciones.find(a => a.barbero_id === editando.id);
      if (editSillaSeleccionada !== (asigActual?.silla_id || null)) {
        if (asigActual) {
          await supabase.from("barbero_sillas").delete().eq("barbero_id", editando.id);
          await supabase.from("sillas").update({ estado: "libre" }).eq("id", asigActual.silla_id);
        }
        if (editSillaSeleccionada) {
          const { data: dueno } = await supabase.from("barbero_sillas").select("barbero_id").eq("silla_id", editSillaSeleccionada).maybeSingle();
          if (dueno) await supabase.from("barbero_sillas").delete().eq("silla_id", editSillaSeleccionada);
          await supabase.from("barbero_sillas").insert([{ barbero_id: editando.id, silla_id: editSillaSeleccionada }]);
          await supabase.from("sillas").update({ estado: "ocupada" }).eq("id", editSillaSeleccionada);
        }
      }
      setEditModalVisible(false);
      setEditando(null);
      await cargar();
    } catch (_) { Alert.alert("Error", "Error de conexión al guardar"); }
    setCargando(false);
  };

  const confirmarEliminar = () => {
    if (Platform.OS === "web") return window.confirm("¿Eliminar este barbero y todas sus citas?");
    return new Promise(resolve => {
      Alert.alert("Eliminar", "¿Eliminar este barbero y todas sus citas?", [
        { text: "Cancelar", onPress: () => resolve(false) },
        { text: "Eliminar", onPress: () => resolve(true) },
      ]);
    });
  };

  const eliminar = async (id) => {
    const confirmado = await confirmarEliminar();
    if (!confirmado) return;
    setCargando(true);
    try {
      const { data: asigs } = await supabase.from("barbero_sillas").select("silla_id").eq("barbero_id", id);
      await supabase.from("barbero_sillas").delete().eq("barbero_id", id);
      await supabase.from("citas").delete().eq("barbero_id", id);
      await supabase.from("barberos").delete().eq("id", id);
      if (asigs) for (const a of asigs) await supabase.from("sillas").update({ estado: "libre" }).eq("id", a.silla_id);
      await cargar();
    } catch (_) { Alert.alert("Error", "Error de conexión al eliminar"); }
    setCargando(false);
  };

  const renderItem = ({ item }) => {
    const silla = sillaBarbero(item.id);
    return (
      <View style={styles.card}>
        <View style={styles.cardInfo}>
          <Text style={styles.nombre}>{item.nombre}</Text>
          {item.especialidad ? <Text style={styles.especialidad}>{item.especialidad}</Text> : null}
          <Text style={styles.sillaAsignada}>
            {silla ? `💺 Silla ${silla.numero}` : "🚫 Sin silla"}
          </Text>
          <Text style={styles.estado}>
            {item.admin_activo
              ? (item.activo ? "🟢 Activo" : "🟡 Barbero inactivo")
              : "🔴 Desactivado por admin"}
          </Text>
        </View>
        <Switch
          value={item.admin_activo}
          onValueChange={() => toggleAdminActivo(item)}
          trackColor={{ false: "#555", true: "#2E7D32" }}
          thumbColor="white"
        />
        <TouchableOpacity style={styles.editBtn} onPress={() => abrirEditar(item)}>
          <Text style={styles.editBtnText}>✏️</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteBtn} onPress={() => eliminar(item.id)}>
          <Text style={styles.deleteBtnText}>🗑️</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Text style={styles.backText}>← Volver</Text>
      </TouchableOpacity>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Gestión de Barberos</Text>
      </View>

      <FlatList
        data={barberos}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
      />

      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Nuevo barbero</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Nombre completo"
              placeholderTextColor="#999"
              value={nombreInput}
              onChangeText={setNombreInput}
            />
            <TextInput
              style={[styles.modalInput, { marginTop: 12 }]}
              placeholder="Especialidad (ej. Cortes clásicos)"
              placeholderTextColor="#999"
              value={especialidadInput}
              onChangeText={setEspecialidadInput}
            />
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => { setModalVisible(false); setNombreInput(""); setEspecialidadInput(""); }}>
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.saveBtn, cargando && { opacity: 0.5 }]} disabled={cargando} onPress={agregar}>
                <Text style={styles.saveBtnText}>{cargando ? "..." : "Agregar"}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={editModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Editar barbero</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Nombre"
              placeholderTextColor="#999"
              value={editNombre}
              onChangeText={setEditNombre}
            />
            <TextInput
              style={[styles.modalInput, { marginTop: 12 }]}
              placeholder="Especialidad"
              placeholderTextColor="#999"
              value={editEspecialidad}
              onChangeText={setEditEspecialidad}
            />
            <Text style={styles.pickerLabel}>Silla asignada</Text>
            <View style={styles.sillaRow}>
              {sillas.map(s => (
                <TouchableOpacity
                  key={s.id}
                  style={[styles.sillaBtn, editSillaSeleccionada === s.id && styles.sillaBtnActive]}
                  onPress={() => setEditSillaSeleccionada(editSillaSeleccionada === s.id ? null : s.id)}
                >
                  <Text style={[styles.sillaBtnText, editSillaSeleccionada === s.id && styles.sillaBtnTextActive]}>
                    {s.numero}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => { setEditModalVisible(false); setEditando(null); }}>
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.saveBtn, cargando && { opacity: 0.5 }]} disabled={cargando} onPress={guardarEdicion}>
                <Text style={styles.saveBtnText}>{cargando ? "..." : "Guardar"}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#121212" },
  backBtn: { paddingHorizontal: 20, paddingBottom: 10 },
  backText: { color: "#D4AF37", fontSize: 18, fontWeight: "bold" },
  header: { paddingHorizontal: 20, paddingTop: 0, paddingBottom: 15, backgroundColor: "#1E1E1E", borderBottomLeftRadius: 25, borderBottomRightRadius: 25 },
  headerTitle: { color: "#D4AF37", fontSize: 20, fontWeight: "bold" },
  list: { padding: 15, paddingBottom: 80 },
  card: { backgroundColor: "#1E1E1E", flexDirection: "row", alignItems: "center", padding: 15, borderRadius: 15, marginBottom: 10 },
  cardInfo: { flex: 1, marginLeft: 5 },
  nombre: { color: "white", fontSize: 17, fontWeight: "bold" },
  especialidad: { color: "#CCC", fontSize: 13, marginTop: 2 },
  sillaAsignada: { color: "#999", fontSize: 13, marginTop: 2 },
  estado: { color: "#999", fontSize: 13, marginTop: 2 },
  editBtn: { marginLeft: 10 },
  editBtnText: { fontSize: 20 },
  deleteBtn: { marginLeft: 8 },
  deleteBtnText: { fontSize: 20 },
  fab: { position: "absolute", bottom: 25, right: 20, backgroundColor: "#D4AF37", width: 60, height: 60, borderRadius: 30, justifyContent: "center", alignItems: "center", elevation: 6, zIndex: 10 },
  fabText: { color: "#121212", fontSize: 30, fontWeight: "bold", marginTop: -2 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "center", padding: 30 },
  modal: { backgroundColor: "#1E1E1E", borderRadius: 25, padding: 25 },
  modalTitle: { color: "#D4AF37", fontSize: 22, fontWeight: "bold", marginBottom: 20, textAlign: "center" },
  modalInput: { backgroundColor: "#2A2A2A", color: "white", padding: 15, borderRadius: 12, fontSize: 16 },
  pickerLabel: { color: "#CCC", fontSize: 14, fontWeight: "bold", marginTop: 15, marginBottom: 8 },
  sillaRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  sillaBtn: { backgroundColor: "#333", paddingHorizontal: 18, paddingVertical: 12, borderRadius: 12, borderWidth: 2, borderColor: "transparent" },
  sillaBtnActive: { borderColor: "#D4AF37", backgroundColor: "#2A2A2A" },
  sillaBtnText: { color: "#999", fontSize: 16, fontWeight: "bold" },
  sillaBtnTextActive: { color: "#D4AF37" },
  modalBtns: { flexDirection: "row", justifyContent: "space-between", marginTop: 24 },
  cancelBtn: { backgroundColor: "#555", padding: 12, borderRadius: 12, flex: 1, marginRight: 10, alignItems: "center" },
  cancelBtnText: { color: "white", fontWeight: "bold" },
  saveBtn: { backgroundColor: "#D4AF37", padding: 12, borderRadius: 12, flex: 1, marginLeft: 10, alignItems: "center" },
  saveBtnText: { color: "#121212", fontWeight: "bold" },
});
