import AsyncStorage from "@react-native-async-storage/async-storage";

const DIAS = [
  { key: "1", label: "Lunes" },
  { key: "2", label: "Martes" },
  { key: "3", label: "Miércoles" },
  { key: "4", label: "Jueves" },
  { key: "5", label: "Viernes" },
  { key: "6", label: "Sábado" },
  { key: "0", label: "Domingo" },
];

const getKey = (barberoId) => `@horarios_${barberoId}`;

export const obtenerHorarios = async (barberoId) => {
  const raw = await AsyncStorage.getItem(getKey(barberoId));
  if (!raw) return DIAS.map(d => ({ dia: d.key, label: d.label, inicio: "09:00", fin: "18:00" }));
  try {
    const data = JSON.parse(raw);
    return DIAS.map(d => ({
      dia: d.key,
      label: d.label,
      inicio: data[d.key]?.inicio ?? "09:00",
      fin: data[d.key]?.fin ?? "18:00",
    }));
  } catch {
    return DIAS.map(d => ({ dia: d.key, label: d.label, inicio: "09:00", fin: "18:00" }));
  }
};

export const guardarHorario = async (barberoId, dia, inicio, fin) => {
  const raw = await AsyncStorage.getItem(getKey(barberoId));
  const data = raw ? JSON.parse(raw) : {};
  data[dia] = { inicio, fin };
  await AsyncStorage.setItem(getKey(barberoId), JSON.stringify(data));
};

export { DIAS };
