import AsyncStorage from "@react-native-async-storage/async-storage";

const dias = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"];
const getKey = (barberoId) => `@horarios_${barberoId}`;

export const obtenerHorarios = async (barberoId) => {
  try {
    const raw = await AsyncStorage.getItem(getKey(barberoId));
    if (!raw) {
      const defaults = {};
      dias.forEach(d => { defaults[d] = { active: true, inicio: "09:00", fin: "18:00" }; });
      return defaults;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return {};
    }
  } catch {
    const defaults = {};
    dias.forEach(d => { defaults[d] = { active: true, inicio: "09:00", fin: "18:00" }; });
    return defaults;
  }
};

export const guardarHorario = async (barberoId, horarios) => {
  try {
    await AsyncStorage.setItem(getKey(barberoId), JSON.stringify(horarios));
  } catch {
    throw new Error("Error al guardar horarios");
  }
};
