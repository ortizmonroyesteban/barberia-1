import React, { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, Modal, TextInput, Alert, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { supabase } from "../../supabase";
import { obtenerHorarios, guardarHorario } from "../../services/horarioService";

export default function AdminScheduleScreen() {
  const navigation = useNavigation();
  const [barberos, setBarberos] = useState([]);
  const [barberoSeleccionado, setBarberoSeleccionado] = useState(null);
  const [horarios, setHorarios] = useState([]);
  const [editando, setEditando] = useState(null);
  const [horaInput, setHoraInput] = useState("");

  useEffect(() => {
    supabase.from("barberos").select("*").order("nombre").then(({ data }) => {
      setBarberos(data || []);
    });
  }, []);

  useEffect(() => {
    if (barberoSeleccionado) {
      obtenerHorarios(barberoSeleccionado.id).then(setHorarios);
    }
  }, [barberoSeleccionado]);

  const abrirEditor = async (dia, campo) => {
    const actual = horarios.find(h => h.dia === dia);
    if (!actual) return;
    setEditando({ dia, campo });
    setHoraInput(actual[campo]);
  };

  const guardarHora = async () => {
    if (!editando) return;
    if (!/^\d{2}:\d{2}$/.test(horaInput)) {
      Alert.alert("Error", "Formato inválido. Usa HH:MM");
      return;
    }
    const { dia, campo } = editando;
    const nuevos = horarios.map(h => h.dia === dia ? { ...h, [campo]: horaInput } : h);
    setHorarios(nuevos);
    setEditando(null);
    try {
      await guardarHorario(barberoSeleccionado.id, dia, nuevos.find(h => h.dia === dia).inicio, nuevos.find(h => h.dia === dia).fin);
    } catch (_) {}
  };

  const renderDia = ({ item }) => (
    <View style={styles.diaRow}>
      <Text style={styles.diaLabel}>{item.label}</Text>
      <View style={styles.horaRow}>
        <TouchableOpacity style={styles.horaBtn} onPress={() => abrirEditor(item.dia, "inicio")}>
          <Text style={styles.horaLabel}>Inicio</Text>
          <Text style={styles.horaValue}>{item.inicio}</Text>
        </TouchableOpacity>
        <Text style={styles.separator}>—</Text>
        <TouchableOpacity style={styles.horaBtn} onPress={() => abrirEditor(item.dia, "fin")}>
          <Text style={styles.horaLabel}>Fin</Text>
          <Text style={styles.horaValue}>{item.fin}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Text style={styles.backText}>← Volver</Text>
      </TouchableOpacity>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Horarios</Text>
      </View>

      <View style={styles.pickerRow}>
        {barberos.map(b => (
          <TouchableOpacity
            key={b.id}
            style={[styles.pickerBtn, barberoSeleccionado?.id === b.id && styles.pickerBtnActive]}
            onPress={() => setBarberoSeleccionado(b)}
          >
            <Text style={[styles.pickerText, barberoSeleccionado?.id === b.id && styles.pickerTextActive]}>
              {b.nombre}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {!barberoSeleccionado ? (
        <Text style={styles.hint}>Selecciona un barbero</Text>
      ) : (
        <FlatList
          data={horarios}
          keyExtractor={(item) => item.dia}
          renderItem={renderDia}
          contentContainerStyle={styles.list}
        />
      )}

      <Modal visible={!!editando} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>
              Editar {editando?.campo === "inicio" ? "inicio" : "fin"}
            </Text>
            <TextInput
              style={styles.modalInput}
              placeholder="HH:MM (ej. 09:00)"
              placeholderTextColor="#666"
              value={horaInput}
              onChangeText={setHoraInput}
              maxLength={5}
            />
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditando(null)}>
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={guardarHora}>
                <Text style={styles.saveBtnText}>Guardar</Text>
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
  pickerRow: { flexDirection: "row", flexWrap: "wrap", padding: 15, gap: 8 },
  pickerBtn: { backgroundColor: "#333", paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20 },
  pickerBtnActive: { backgroundColor: "#2E7D32" },
  pickerText: { color: "white", fontSize: 14 },
  pickerTextActive: { color: "white", fontWeight: "bold" },
  hint: { color: "#999", textAlign: "center", marginTop: 40, fontSize: 16 },
  list: { padding: 15 },
  diaRow: { backgroundColor: "#1E1E1E", padding: 15, borderRadius: 15, marginBottom: 10 },
  diaLabel: { color: "white", fontSize: 17, fontWeight: "bold", marginBottom: 10 },
  horaRow: { flexDirection: "row", alignItems: "center" },
  horaBtn: { backgroundColor: "#2A2A2A", padding: 12, borderRadius: 12, flex: 1, alignItems: "center" },
  horaLabel: { color: "#999", fontSize: 12 },
  horaValue: { color: "#D4AF37", fontSize: 18, fontWeight: "bold", marginTop: 3 },
  separator: { color: "#555", fontSize: 18, marginHorizontal: 12 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "center", padding: 30 },
  modal: { backgroundColor: "#1E1E1E", borderRadius: 25, padding: 25 },
  modalTitle: { color: "#D4AF37", fontSize: 20, fontWeight: "bold", marginBottom: 15, textAlign: "center" },
  modalInput: { backgroundColor: "#2A2A2A", color: "white", padding: 15, borderRadius: 12, fontSize: 18, textAlign: "center" },
  modalBtns: { flexDirection: "row", justifyContent: "space-between", marginTop: 20 },
  cancelBtn: { backgroundColor: "#555", padding: 12, borderRadius: 12, flex: 1, marginRight: 10, alignItems: "center" },
  cancelBtnText: { color: "white", fontWeight: "bold" },
  saveBtn: { backgroundColor: "#D4AF37", padding: 12, borderRadius: 12, flex: 1, marginLeft: 10, alignItems: "center" },
  saveBtnText: { color: "#121212", fontWeight: "bold" },
});
