import React, { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, Modal, TextInput, Switch, StyleSheet, Platform, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { supabase } from "../../supabase";
import { obtenerSillas } from "../../services/sillasService";
import { useAlert } from "../../components/CustomAlert";

export default function AdminBarbersScreen() {
  const navigation = useNavigation();
  const { showAlert } = useAlert();
  const [barberos, setBarberos] = useState([]);
  const [sillas, setSillas] = useState([]);
  const [asignaciones, setAsignaciones] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [nombreInput, setNombreInput] = useState("");
  const [especialidadInput, setEspecialidadInput] = useState("");
  const [sillaSeleccionada, setSillaSeleccionada] = useState(null);
  const [fotoUrlInput, setFotoUrlInput] = useState("");
  const [editando, setEditando] = useState(null);
  const [editNombre, setEditNombre] = useState("");
  const [editEspecialidad, setEditEspecialidad] = useState("");
  const [editSillaSeleccionada, setEditSillaSeleccionada] = useState(null);
  const [editFotoUrl, setEditFotoUrl] = useState("");
  const [telefonoInput, setTelefonoInput] = useState("");
  const [editTelefono, setEditTelefono] = useState("");

  const cargar = async () => {
    const [b, s, a] = await Promise.all([
      supabase.from("barberos").select("id, nombre, activo, admin_activo, especialidad, foto_url, telefono").order("nombre"),
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
    if (!nombreInput.trim()) { showAlert("Error", "Ingresa el nombre"); return; }
    setCargando(true);
    try {
      const { data, error } = await supabase
        .from("barberos")
        .insert([{ nombre: nombreInput.trim(), especialidad: especialidadInput.trim() || null, foto_url: fotoUrlInput.trim() || null, telefono: telefonoInput.trim() || null, activo: true, admin_activo: true }])
        .select();
      if (error) { showAlert("Error", error.message); setCargando(false); return; }
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
      setFotoUrlInput("");
      setModalVisible(false);
      await cargar();
    } catch (_) { showAlert("Error", "Error de conexión al agregar barbero"); }
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
    setEditFotoUrl(barbero.foto_url || "");
    setEditTelefono(barbero.telefono || "");
    setEditModalVisible(true);
  };

  const guardarEdicion = async () => {
    if (!editNombre.trim()) { showAlert("Error", "El nombre no puede estar vacío"); return; }
    setCargando(true);
    try {
      const { error } = await supabase
        .from("barberos")
        .update({ nombre: editNombre.trim(), especialidad: editEspecialidad.trim() || null, foto_url: editFotoUrl.trim() || null, telefono: editTelefono.trim() || null })
        .eq("id", editando.id);
      if (error) { showAlert("Error", error.message); setCargando(false); return; }
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
    } catch (_) { showAlert("Error", "Error de conexión al guardar"); }
    setCargando(false);
  };

  const confirmarEliminar = (id) => {
    if (Platform.OS === "web") {
      if (window.confirm("¿Eliminar este barbero y todas sus citas?")) ejecutarEliminar(id);
      return;
    }
    showAlert("Eliminar", "¿Eliminar este barbero y todas sus citas?", [
      { text: "Cancelar" },
      { text: "Eliminar", onPress: () => ejecutarEliminar(id) },
    ]);
  };

  const ejecutarEliminar = async (id) => {
    setCargando(true);
    try {
      const { data: asigs } = await supabase.from("barbero_sillas").select("silla_id").eq("barbero_id", id);
      await supabase.from("barbero_sillas").delete().eq("barbero_id", id);
      await supabase.from("citas").delete().eq("barbero_id", id);
      await supabase.from("barberos").delete().eq("id", id);
      if (asigs) for (const a of asigs) await supabase.from("sillas").update({ estado: "libre" }).eq("id", a.silla_id);
      await cargar();
    } catch (_) { showAlert("Error", "Error de conexión al eliminar"); }
    setCargando(false);
  };

  const renderItem = ({ item }) => {
    const silla = sillaBarbero(item.id);
    return (
      <View style={styles.card}>
        <View style={styles.fotoWrapper}>
          {item.foto_url ? (
            <Image source={{ uri: item.foto_url }} style={styles.foto} />
          ) : (
            <View style={styles.fotoPlaceholder}>
              <Text style={styles.fotoPlaceholderText}>{item.nombre?.charAt(0).toUpperCase() || "?"}</Text>
            </View>
          )}
        </View>
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
          trackColor={{ false: "#555", true: "#4CAF50" }}
          thumbColor="white"
        />
        <TouchableOpacity style={styles.editBtn} onPress={() => abrirEditar(item)}>
          <Text style={styles.editBtnText}>✏️</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteBtn} onPress={() => confirmarEliminar(item.id)}>
          <Text style={styles.deleteBtnText}>🗑️</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.navigate("AdminDashboard")}>
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

      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
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
            <Text style={styles.pickerLabel}>Silla asignada</Text>
            <View style={styles.sillaRow}>
              {sillas.map(s => (
                <TouchableOpacity
                  key={s.id}
                  style={[styles.sillaBtn, sillaSeleccionada === s.id && styles.sillaBtnActive]}
                  onPress={() => setSillaSeleccionada(sillaSeleccionada === s.id ? null : s.id)}
                >
                  <Text style={[styles.sillaBtnText, sillaSeleccionada === s.id && styles.sillaBtnTextActive]}>
                    {s.numero}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={[styles.fotoUrlRow, { marginTop: 12 }]}>
              <TextInput
                style={styles.modalInput}
                placeholder="URL de la foto (opcional)"
                placeholderTextColor="#999"
                value={fotoUrlInput}
                onChangeText={setFotoUrlInput}
              />
              {fotoUrlInput ? (
                <TouchableOpacity style={styles.clearBtn} onPress={() => setFotoUrlInput("")}>
                  <Text style={styles.clearBtnText}>✕</Text>
                </TouchableOpacity>
              ) : null}
            </View>
            <TextInput
              style={[styles.modalInput, { marginTop: 12 }]}
              placeholder="Teléfono (opcional)"
              placeholderTextColor="#999"
              keyboardType="phone-pad"
              value={telefonoInput}
              onChangeText={setTelefonoInput}
            />
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => { setModalVisible(false); setNombreInput(""); setEspecialidadInput(""); setSillaSeleccionada(null); setFotoUrlInput(""); setTelefonoInput(""); }}>
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.saveBtn, cargando && { opacity: 0.5 }]} disabled={cargando} onPress={agregar}>
                <Text style={styles.saveBtnText}>{cargando ? "..." : "Agregar"}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={editModalVisible} transparent animationType="fade" onRequestClose={() => setEditModalVisible(false)}>
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
            <View style={[styles.fotoUrlRow, { marginTop: 12 }]}>
              <TextInput
                style={styles.modalInput}
                placeholder="URL de la foto (opcional)"
                placeholderTextColor="#999"
                value={editFotoUrl}
                onChangeText={setEditFotoUrl}
              />
              {editFotoUrl ? (
                <TouchableOpacity style={styles.clearBtn} onPress={() => setEditFotoUrl("")}>
                  <Text style={styles.clearBtnText}>✕</Text>
                </TouchableOpacity>
              ) : null}
            </View>
            <TextInput
              style={[styles.modalInput, { marginTop: 12 }]}
              placeholder="Teléfono (opcional)"
              placeholderTextColor="#999"
              keyboardType="phone-pad"
              value={editTelefono}
              onChangeText={setEditTelefono}
            />
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
  container: { flex: 1, backgroundColor: "#1A1A2E" },
  backBtn: { paddingHorizontal: 20, paddingVertical: 10 },
  backText: { color: "#C8962A", fontSize: 18, fontWeight: "bold" },
  header: { paddingHorizontal: 20, paddingTop: 0, paddingBottom: 15, backgroundColor: "#1E1E1E", borderBottomLeftRadius: 25, borderBottomRightRadius: 25, elevation: 4, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4 },
  headerTitle: { color: "#C8962A", fontSize: 20, fontWeight: "bold" },
  list: { padding: 15, paddingBottom: 80 },
  card: { backgroundColor: "#1E1E1E", flexDirection: "row", alignItems: "center", padding: 15, borderRadius: 16, marginBottom: 10, elevation: 3, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4 },
  cardInfo: { flex: 1, marginLeft: 5 },
  nombre: { color: "white", fontSize: 17, fontWeight: "bold" },
  especialidad: { color: "#CCC", fontSize: 13, marginTop: 2 },
  sillaAsignada: { color: "#999", fontSize: 13, marginTop: 2 },
  estado: { color: "#999", fontSize: 13, marginTop: 2 },
  editBtn: { marginLeft: 10 },
  editBtnText: { fontSize: 20 },
  deleteBtn: { marginLeft: 8 },
  deleteBtnText: { fontSize: 20 },
  fab: { position: "absolute", bottom: 25, right: 20, backgroundColor: "#C8962A", width: 60, height: 60, borderRadius: 30, justifyContent: "center", alignItems: "center", elevation: 8, shadowColor: "#C8962A", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 6, zIndex: 10 },
  fabText: { color: "#1A1A2E", fontSize: 30, fontWeight: "bold", marginTop: -2 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "center", padding: 30 },
  modal: { backgroundColor: "#1E1E1E", borderRadius: 25, padding: 25, elevation: 8, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8 },
  modalTitle: { color: "#C8962A", fontSize: 22, fontWeight: "bold", marginBottom: 20, textAlign: "center" },
  modalInput: { backgroundColor: "#2A2A2A", color: "white", padding: 15, borderRadius: 12, fontSize: 16, borderWidth: 1, borderColor: "#333" },
  pickerLabel: { color: "#CCC", fontSize: 14, fontWeight: "bold", marginTop: 15, marginBottom: 8 },
  sillaRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  sillaBtn: { backgroundColor: "#333", paddingHorizontal: 18, paddingVertical: 12, borderRadius: 12, borderWidth: 2, borderColor: "transparent" },
  sillaBtnActive: { borderColor: "#C8962A", backgroundColor: "#2A2A2A" },
  sillaBtnText: { color: "#999", fontSize: 16, fontWeight: "bold" },
  sillaBtnTextActive: { color: "#C8962A" },
  modalBtns: { flexDirection: "row", justifyContent: "space-between", marginTop: 24 },
  cancelBtn: { backgroundColor: "#555", padding: 14, borderRadius: 12, flex: 1, marginRight: 10, alignItems: "center" },
  cancelBtnText: { color: "white", fontWeight: "bold" },
  saveBtn: { backgroundColor: "#C8962A", padding: 14, borderRadius: 12, flex: 1, marginLeft: 10, alignItems: "center", elevation: 3, shadowColor: "#C8962A", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4 },
  saveBtnText: { color: "#1A1A2E", fontWeight: "bold" },
  fotoWrapper: { marginRight: 12 },
  foto: { width: 50, height: 50, borderRadius: 8, borderWidth: 2, borderColor: "#C8962A" },
  fotoPlaceholder: { width: 50, height: 50, borderRadius: 8, backgroundColor: "#C8962A", justifyContent: "center", alignItems: "center", borderWidth: 2, borderColor: "rgba(255,255,255,0.3)" },
  fotoPlaceholderText: { color: "white", fontSize: 22, fontWeight: "bold" },

  fotoUrlRow: { flexDirection: "row", alignItems: "center" },
  clearBtn: { marginLeft: 8, backgroundColor: "#555", width: 44, height: 44, borderRadius: 12, justifyContent: "center", alignItems: "center" },
  clearBtnText: { color: "#CCC", fontSize: 18, fontWeight: "bold" },
});
