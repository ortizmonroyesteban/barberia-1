import AsyncStorage from "@react-native-async-storage/async-storage";

const CLAVE_ADMIN = "admin123";
const SESSION_KEY = "@admin_session";

export const loginAdmin = async (password) => {
  if (password !== CLAVE_ADMIN) return false;
  const session = { autenticado: true, timestamp: Date.now() };
  await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return true;
};

export const checkAdminSession = async () => {
  const raw = await AsyncStorage.getItem(SESSION_KEY);
  if (!raw) return false;
  try {
    const session = JSON.parse(raw);
    return session.autenticado === true;
  } catch {
    return false;
  }
};

export const logoutAdmin = async () => {
  await AsyncStorage.removeItem(SESSION_KEY);
};
