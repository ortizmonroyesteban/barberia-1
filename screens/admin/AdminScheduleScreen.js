import React, { useEffect, useState, useCallback } from "react";
import { View, Text, TouchableOpacity, Modal, StyleSheet, Platform, ScrollView, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { supabase } from "../../supabase";
import { obtenerHorarios, guardarHorario } from "../../services/horarioService";
import TimePicker from "../../components/TimePicker";
import { ErrorView } from "../../components/LoadingScreen";
import { useAlert } from "../../components/CustomAlert";

const dias = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"];

export default function AdminScheduleScreen() {
  const navigation = useNavigation();
  const { showAlert } = useAlert();
  const [barberos, setBarberos] = useState([]);
  const [selectedBarber, setSelectedBarber] = useState(null);
  const [horarios, setHorarios] = useState({});
  const [editandoDia, setEditandoDia] = useState(null);
  const [tempHora, setTempHora] = useState(null);
  const [tipoPicker, setTipoPicker] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const cargarBarberos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase.from("barberos").select("id, nombre").order("nombre");
      if (err) throw err;
      setBarberos(data || []);
    } catch (e) {
      setError(e.message || "Error al cargar barberos");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargarBarberos(); }, [cargarBarberos]);

  const cargarHorarios = async (barberId) => {
    const h = await obtenerHorarios(barberId);
    setHorarios(h);
  };

  useEffect(() => { if (selectedBarber) cargarHorarios(selectedBarber).catch(() => {}); }, [selectedBarber]);

  const toggleDia = (dia) => {
    const current = horarios[dia] || { active: false, inicio: "09:00", fin: "18:00" };
    setHorarios(prev => ({ ...prev, [dia]: { ...current, active: !current.active } }));
  };

  const abrirTimePicker = (dia, tipo) => {
    const current = horarios[dia] || { active: false, inicio: "09:00", fin: "18:00" };
    setEditandoDia(dia);
    setTipoPicker(tipo);
    setTempHora(current[tipo]);
  };

  const cerrarPicker = () => {
    if (editandoDia && tipoPicker && tempHora != null) {
      setHorarios(prev => ({ ...prev, [editandoDia]: { ...prev[editandoDia], [tipoPicker]: tempHora } }));
    }
    setEditandoDia(null); setTipoPicker(null); setTempHora(null);
  };

  const guardar = async () => {
    if (!selectedBarber) { showAlert("Error", "Selecciona un barbero"); return; }
    try {
      await guardarHorario(selectedBarber, horarios);
      showAlert("Listo", "Horarios guardados");
    } catch {
      showAlert("Error", "No se pudieron guardar los horarios");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.navigate("AdminDashboard")}>
          <Text style={styles.backText}>← Volver</Text>
        </TouchableOpacity>
      <View style={styles.header}><Text style={styles.headerTitle}>Horarios</Text></View>

      {loading ? (
        <ActivityIndicator size="large" color="#C8962A" style={{ marginTop: 60 }} />
      ) : error ? (
        <ErrorView message={error} onRetry={cargarBarberos} />
      ) : (
      <>  
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Barbero</Text>
        <View style={styles.barberosRow}>
          {barberos.map(b => (
            <TouchableOpacity key={b.id}
              style={[styles.pickerBtn, selectedBarber === b.id && styles.pickerBtnActive]}
              onPress={() => setSelectedBarber(b.id)}>
              <Text style={[styles.pickerBtnText, selectedBarber === b.id && styles.pickerBtnTextActive]}>{b.nombre}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {selectedBarber && (
        <>
          <ScrollView style={styles.scroll}>
            {dias.map(dia => {
              const h = horarios[dia] || { active: false, inicio: "09:00", fin: "18:00" };
              return (
                <View key={dia} style={styles.diaRow}>
                  <TouchableOpacity onPress={() => toggleDia(dia)} style={styles.diaHeader}>
                    <View style={[styles.checkbox, h.active && styles.checkboxActive]}>
                      {h.active && <Text style={styles.checkMark}>✓</Text>}
                    </View>
                    <Text style={[styles.diaLabel, h.active && styles.diaLabelActive]}>
                      {dia.charAt(0).toUpperCase() + dia.slice(1)}
                    </Text>
                  </TouchableOpacity>
                  {h.active && (
                    <View style={styles.horasRow}>
                      <TouchableOpacity style={styles.horaBtn} onPress={() => abrirTimePicker(dia, "inicio")}>
                        <Text style={styles.horaLabel}>Inicio</Text>
                        <Text style={styles.horaValue}>{h.inicio}</Text>
                      </TouchableOpacity>
                      <Text style={styles.horaArrow}>→</Text>
                      <TouchableOpacity style={styles.horaBtn} onPress={() => abrirTimePicker(dia, "fin")}>
                        <Text style={styles.horaLabel}>Fin</Text>
                        <Text style={styles.horaValue}>{h.fin}</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              );
            })}
          </ScrollView>

          <TouchableOpacity style={styles.saveBtn} onPress={guardar}>
            <Text style={styles.saveBtnText}>Guardar horarios</Text>
          </TouchableOpacity>
        </>
      )}
      </>
      )}

      <Modal visible={!!editandoDia} transparent animationType="fade" onRequestClose={cerrarPicker}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {tipoPicker === "inicio" ? "Hora de inicio" : "Hora de fin"}
            </Text>
            <TimePicker value={tempHora} onChange={setTempHora} />
            <TouchableOpacity style={styles.doneBtn} onPress={cerrarPicker}>
              <Text style={styles.doneBtnText}>Listo</Text>
            </TouchableOpacity>
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
  header: { paddingHorizontal: 20, paddingVertical: 14, backgroundColor: "#1E1E1E", borderBottomLeftRadius: 25, borderBottomRightRadius: 25 },
  headerTitle: { color: "#C8962A", fontSize: 20, fontWeight: "bold" },

  section: { paddingHorizontal: 15, marginTop: 16 },
  sectionLabel: { color: "white", fontSize: 16, fontWeight: "bold", marginBottom: 10 },
  barberosRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  pickerBtn: { backgroundColor: "#333", paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20 },
  pickerBtnActive: { backgroundColor: "#4CAF50" },
  pickerBtnText: { color: "#CCC", fontWeight: "bold" },
  pickerBtnTextActive: { color: "white" },

  scroll: { marginHorizontal: 15, marginTop: 16 },
  diaRow: { backgroundColor: "#1E1E1E", borderRadius: 15, padding: 14, marginBottom: 8 },
  diaHeader: { flexDirection: "row", alignItems: "center" },
  checkbox: { width: 24, height: 24, borderRadius: 6, backgroundColor: "#333", justifyContent: "center", alignItems: "center" },
  checkboxActive: { backgroundColor: "#4CAF50" },
  checkMark: { color: "white", fontWeight: "bold" },
  diaLabel: { color: "#999", fontSize: 16, fontWeight: "bold", marginLeft: 10 },
  diaLabelActive: { color: "white" },
  horasRow: { flexDirection: "row", alignItems: "center", marginTop: 10, marginLeft: 34 },
  horaBtn: { backgroundColor: "#2A2A2A", paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, alignItems: "center", flex: 1 },
  horaLabel: { color: "#888", fontSize: 12 },
  horaArrow: { color: "#555", fontSize: 18, marginHorizontal: 10 },
  horaValue: { color: "#C8962A", fontSize: 18, fontWeight: "bold", marginTop: 2 },
  saveBtn: { backgroundColor: "#C8962A", marginHorizontal: 15, marginTop: 20, marginBottom: 30, padding: 16, borderRadius: 15, alignItems: "center" },
  saveBtnText: { color: "#1A1A2E", fontSize: 18, fontWeight: "bold" },

  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "center", padding: 30 },
  modalContent: { backgroundColor: "#1E1E1E", borderRadius: 25, padding: 25, alignItems: "center" },
  modalTitle: { color: "#C8962A", fontSize: 20, fontWeight: "bold", marginBottom: 20 },
  doneBtn: { backgroundColor: "#C8962A", padding: 14, borderRadius: 12, width: "100%", alignItems: "center", marginTop: 20 },
  doneBtnText: { color: "#1A1A2E", fontWeight: "bold", fontSize: 16 },
});
