import React, { useEffect, useState, useMemo } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import DatePicker from "../components/DatePicker";
import { obtenerHorarios } from "../services/horarioService";

const diasSemana = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

export default function BarberDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { silla } = route.params;
  const barbero = silla?.barbero;
  const [selectedDate, setSelectedDate] = useState(null);
  const [horarios, setHorarios] = useState({});

  useEffect(() => {
    (async () => {
      if (barbero) {
        const h = await obtenerHorarios(barbero.id);
        setHorarios(h);
      }
    })();
  }, [barbero]);

  const puedeAgendar = useMemo(() => {
    if (!selectedDate || !barbero) return false;
    const dia = selectedDate.getDay();
    const diaNombre = diasSemana[dia];
    const horarioDia = horarios[diaNombre];
    if (!horarioDia || !horarioDia.active) return false;
    const hoyDate = new Date(new Date().toDateString());
    const selDate = new Date(selectedDate.toDateString());
    if (selDate < hoyDate) return false;
    const maxDate = new Date(hoyDate);
    maxDate.setDate(maxDate.getDate() + 7);
    if (selDate > maxDate) return false;
    return true;
  }, [selectedDate, horarios, barbero]);

  const hoy = new Date(new Date().toDateString());
  const maxDate = new Date(hoy);
  maxDate.setDate(maxDate.getDate() + 7);
  const disponible = barbero && barbero.admin_activo && barbero.activo;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Volver</Text>
        </TouchableOpacity>

        <View style={styles.hero}>
          {barbero?.foto_url ? (
            <Image source={{ uri: barbero.foto_url }} style={[styles.avatarFoto, !disponible && styles.avatarFotoInactivo]} />
          ) : (
            <View style={[styles.avatar, !disponible && styles.avatarInactivo]}>
              <Text style={styles.avatarText}>{barbero?.nombre?.charAt(0).toUpperCase() || "?"}</Text>
            </View>
          )}
          <Text style={styles.nombre}>{barbero?.nombre || "Sin barbero"}</Text>
          {barbero?.especialidad && <Text style={styles.especialidad}>{barbero.especialidad}</Text>}
          <Text style={styles.sillaInfo}>Silla {silla.numero}</Text>
          {!disponible && (
            <View style={styles.inactivoBadge}>
              <Text style={styles.inactivoText}>🔴 No disponible</Text>
            </View>
          )}
        </View>

        {disponible && (
          <View style={styles.dateSection}>
            <Text style={styles.dateLabel}>Selecciona una fecha</Text>
            {Object.keys(horarios).length > 0 && (
              <Text style={styles.diasTrabajo}>
                📅 Días activos: {Object.entries(horarios).filter(([, v]) => v?.active).map(([d]) => d.charAt(0).toUpperCase() + d.slice(1)).join(", ")}
              </Text>
            )}
            <DatePicker
              value={selectedDate}
              onChange={setSelectedDate}
              min={hoy}
              max={maxDate}
            />
            {selectedDate && !puedeAgendar && (
              <Text style={styles.dateHint}>El barbero no trabaja este día o está fuera del plazo</Text>
            )}
          </View>
        )}

        {puedeAgendar && (
          <TouchableOpacity
            style={styles.continueBtn}
            onPress={() => navigation.navigate("TimeSlot", {
              barbero,
              sillaId: silla.id,
              sillaNum: silla.numero,
              fecha: selectedDate.getFullYear() + "-" + String(selectedDate.getMonth() + 1).padStart(2, "0") + "-" + String(selectedDate.getDate()).padStart(2, "0"),
              fechaObj: selectedDate,
            })}
          >
            <Text style={styles.continueText}>Ver horarios disponibles</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1A1A2E" },
  backBtn: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 10 },
  backText: { color: "#C8962A", fontSize: 18, fontWeight: "bold" },

  hero: { alignItems: "center", paddingVertical: 30, marginHorizontal: 15, backgroundColor: "#1E1E1E", borderRadius: 25, marginTop: 10, elevation: 4, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 5 },
  avatar: { width: 100, height: 100, borderRadius: 12, backgroundColor: "#C8962A", justifyContent: "center", alignItems: "center", marginBottom: 12, borderWidth: 3, borderColor: "rgba(255,255,255,0.3)", elevation: 4, shadowColor: "#C8962A", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4 },
  avatarInactivo: { backgroundColor: "#555", borderColor: "rgba(255,255,255,0.15)" },
  avatarFoto: { width: 100, height: 100, borderRadius: 12, marginBottom: 12, borderWidth: 3, borderColor: "#C8962A", elevation: 4, shadowColor: "#C8962A", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4 },
  avatarFotoInactivo: { opacity: 0.5 },
  avatarText: { color: "white", fontSize: 36, fontWeight: "bold" },
  nombre: { color: "#C8962A", fontSize: 28, fontWeight: "bold" },
  especialidad: { color: "#CCC", fontSize: 16, marginTop: 4 },
  sillaInfo: { color: "#888", fontSize: 14, marginTop: 6 },
  inactivoBadge: { backgroundColor: "#555", paddingHorizontal: 15, paddingVertical: 5, borderRadius: 20, marginTop: 10 },
  inactivoText: { color: "white", fontSize: 14, fontWeight: "bold" },

  dateSection: { marginHorizontal: 15, marginTop: 25, backgroundColor: "#1E1E1E", borderRadius: 20, padding: 20, elevation: 3, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4 },
  dateLabel: { color: "white", fontSize: 20, fontWeight: "bold", marginBottom: 8 },
  diasTrabajo: { color: "#C8962A", fontSize: 14, marginTop: 6 },
  dateHint: { color: "#999", fontSize: 14, textAlign: "center", marginTop: 10 },

  continueBtn: { backgroundColor: "#C8962A", marginHorizontal: 15, marginTop: 24, padding: 18, borderRadius: 15, alignItems: "center", elevation: 4, shadowColor: "#C8962A", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 5 },
  continueText: { color: "#1A1A2E", fontSize: 18, fontWeight: "bold" },
});
