import { StyleSheet } from "react-native";

export const globalStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
  },

  header: {
    paddingTop: 60,
    paddingBottom: 30,
    alignItems: "center",
    backgroundColor: "#1E1E1E",
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },

  logo: {
    fontSize: 50,
  },

  titulo: {
    color: "#D4AF37",
    fontSize: 32,
    fontWeight: "bold",
    marginTop: 10,
  },

  subtituloHeader: {
    color: "#CCC",
    marginTop: 5,
  },

  menu: {
    flexDirection: "row",
    justifyContent: "center",
    marginVertical: 20,
  },

  menuBtn: {
    backgroundColor: "#333",
    padding: 15,
    borderRadius: 10,
    marginHorizontal: 10,
    width: 120,
    alignItems: "center",
  },

  menuActivo: {
    backgroundColor: "#D4AF37",
  },

  menuTexto: {
    color: "white",
    fontWeight: "bold",
  },

  card: {
    backgroundColor: "#1E1E1E",
    marginHorizontal: 15,
    marginBottom: 20,
    borderRadius: 20,
    padding: 20,
  },

  section: {
    color: "#FFF",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
  },

  input: {
    backgroundColor: "#2A2A2A",
    color: "white",
    padding: 15,
    borderRadius: 12,
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  silla: {
    width: "48%",
    backgroundColor: "#2E7D32",
    padding: 18,
    borderRadius: 15,
    marginBottom: 10,
    alignItems: "center",
  },

  sillaSeleccionada: {
    backgroundColor: "#D4AF37",
  },

  sillaTexto: {
    color: "white",
    fontWeight: "bold",
  },

  sillaTextoSeleccionado: {
    color: "#121212",
  },

  horaBtn: {
    backgroundColor: "#333",
    width: "30%",
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    alignItems: "center",
  },

  horaBtnSeleccionado: {
    backgroundColor: "#D4AF37",
  },

  horaTexto: {
    color: "white",
    fontWeight: "bold",
  },

  horaTextoSeleccionado: {
    color: "#121212",
  },

  reservarBtn: {
    backgroundColor: "#D4AF37",
    marginHorizontal: 20,
    padding: 18,
    borderRadius: 15,
    alignItems: "center",
    marginBottom: 40,
  },

  reservarTexto: {
    color: "#121212",
    fontSize: 20,
    fontWeight: "bold",
  },

  addBtn: {
    backgroundColor: "#D4AF37",
    padding: 15,
    borderRadius: 12,
    marginTop: 15,
    alignItems: "center",
  },

  addTexto: {
    color: "#121212",
    fontWeight: "bold",
  },

  barberoCard: {
    backgroundColor: "#2A2A2A",
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  barberoNombre: {
    color: "white",
    fontWeight: "bold",
    fontSize: 18,
  },

  citaCard: {
    backgroundColor: "#2A2A2A",
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
  },

  citaTexto: {
    color: "white",
  },
});