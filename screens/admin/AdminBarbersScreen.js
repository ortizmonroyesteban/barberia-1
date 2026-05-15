import React, { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, Modal, TextInput, Switch, Alert, StyleSheet, Platform } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { supabase } from "../../supabase";

export default function AdminBarbersScreen() {
  const navigation = useNavigation();
  const [barberos, setBarberos] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [nombreInput, setNombreInput] = useState("");
  const [editando, setEditando] = useState(null);
  const [editNombre, setEditNombre] = useState("");

  useEffect(() => { cargar(); }, []);

  const cargar = async () => {
    const { data } = await supabase.from("barberos").select("*").order("nombre");
    setBarberos(data || []);
  };

  const agregar = async () => {
    if (!nombreInput.trim()) { Alert.alert("Error", "Ingresa el nombre"); return; }
    setCargando(true);
    try {
      const { error } = await supabase.from("barberos").insert([{ nombre: nombreInput.trim(), activo: true }]);
      if (error) { Alert.alert("Error", error.message); setCargando(false); return; }
      setNombreInput("");
      setModalVisible(false);
      await cargar();
    } catch (_) { Alert.alert("Error", "Error de conexión al agregar barbero"); }
    setCargando(false);
  };

  const toggleActivo = async (barbero) => {
    try {
      await supabase.from("barberos").update({ activo: !barbero.activo }).eq("id", barbero.id);
      await cargar();
    } catch (_) {}
  };

  const abrirEditar = (barbero) => {
    setEditando(barbero);
    setEditNombre(barbero.nombre);
    setEditModalVisible(true);
  };

  const guardarEdicion = async () => {
    if (!editNombre.trim()) { Alert.alert("Error", "El nombre no puede estar vacío"); return; }
    setCargando(true);
    try {
      const { error } = await supabase.from("barberos").update({ nombre: editNombre.trim() }).eq("id", editando.id);
      if (error) { Alert.alert("Error", error.message); setCargando(false); return; }
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
      await supabase.from("barbero_sillas").delete().eq("barbero_id", id);
      await supabase.from("citas").delete().eq("barbero_id", id);
      await supabase.from("barberos").delete().eq("id", id);
      await cargar();
    } catch (_) { Alert.alert("Error", "Error de conexión al eliminar"); }
    setCargando(false);
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardInfo}>
        <Text style={styles.nombre}>✂️ {item.nombre}</Text>
        <Text style={styles.estado}>{item.activo ? "🟢 Activo" : "🔴 Inactivo"}</Text>
      </View>
      <Switch
        value={item.activo}
        onValueChange={() => toggleActivo(item)}
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

  return (
    <View style={styles.container}>
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
              placeholder="Nombre"
              placeholderTextColor="#999"
              value={nombreInput}
              onChangeText={setNombreInput}
            />
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => { setModalVisible(false); setNombreInput(""); }}>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#121212" },
  backBtn: { paddingHorizontal: 20, paddingTop: 50, paddingBottom: 10 },
  backText: { color: "#D4AF37", fontSize: 18, fontWeight: "bold" },
  header: { paddingHorizontal: 20, paddingTop: 0, paddingBottom: 15, backgroundColor: "#1E1E1E", borderBottomLeftRadius: 25, borderBottomRightRadius: 25 },
  headerTitle: { color: "#D4AF37", fontSize: 20, fontWeight: "bold" },
  list: { padding: 15, paddingBottom: 80 },
  card: { backgroundColor: "#1E1E1E", flexDirection: "row", alignItems: "center", padding: 15, borderRadius: 15, marginBottom: 10 },
  cardInfo: { flex: 1 },
  nombre: { color: "white", fontSize: 17, fontWeight: "bold" },
  estado: { color: "#999", fontSize: 13, marginTop: 3 },
  editBtn: { marginLeft: 10 },
  editBtnText: { fontSize: 20 },
  deleteBtn: { marginLeft: 8 },
  deleteBtnText: { fontSize: 20 },
  fab: { position: "absolute", bottom: 25, right: 20, backgroundColor: "#D4AF37", width: 60, height: 60, borderRadius: 30, justifyContent: "center", alignItems: "center", elevation: 6 },
  fabText: { color: "#121212", fontSize: 30, fontWeight: "bold", marginTop: -2 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "center", padding: 30 },
  modal: { backgroundColor: "#1E1E1E", borderRadius: 25, padding: 25 },
  modalTitle: { color: "#D4AF37", fontSize: 22, fontWeight: "bold", marginBottom: 20, textAlign: "center" },
  modalInput: { backgroundColor: "#2A2A2A", color: "white", padding: 15, borderRadius: 12, fontSize: 16 },
  modalBtns: { flexDirection: "row", justifyContent: "space-between", marginTop: 20 },
  cancelBtn: { backgroundColor: "#555", padding: 12, borderRadius: 12, flex: 1, marginRight: 10, alignItems: "center" },
  cancelBtnText: { color: "white", fontWeight: "bold" },
  saveBtn: { backgroundColor: "#D4AF37", padding: 12, borderRadius: 12, flex: 1, marginLeft: 10, alignItems: "center" },
  saveBtnText: { color: "#121212", fontWeight: "bold" },
});
