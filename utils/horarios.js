export const horas = [
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
];

export const fechaLocal = (fecha = new Date()) =>
  fecha.getFullYear() + "-" + String(fecha.getMonth() + 1).padStart(2, "0") + "-" + String(fecha.getDate()).padStart(2, "0");
