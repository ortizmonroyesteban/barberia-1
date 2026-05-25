participante 1: Esteban Ortiz 
participante 2: Julian Camargo

# Tauros Barbería

<p align="center">
  <strong>Aplicación móvil para gestión de citas en barbería</strong>
  <br />
  React Native · Expo · Supabase
</p>

## Tabla de Contenidos

- [Acerca del Proyecto](#acerca-del-proyecto)
- [Funcionalidades](#funcionalidades)
- [Stack Tecnológico](#stack-tecnológico)
- [Arquitectura](#arquitectura)
- [Requisitos](#requisitos)
- [Instalación y Configuración](#instalación-y-configuración)
  - [Variables de Entorno](#variables-de-entorno)
  - [Base de Datos (Supabase)](#base-de-datos-supabase)
- [Uso](#uso)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Licencia](#licencia)

---

## Acerca del Proyecto

**Tauros Barbería** es una aplicación móvil desarrollada en React Native (Expo) que permite a los clientes de una barbería agendar citas de forma rápida y sencilla. Cuenta con un panel de administración para la gestión de barberos, horarios, sillas y citas, así como un panel exclusivo para que los barberos gestionen su disponibilidad y agenda.

El backend está impulsado por **Supabase**, que proporciona la base de datos PostgreSQL, suscripciones en tiempo real y una API segura.

---

## Funcionalidades

### Clientes
- Visualización de sillas disponibles con barberos asignados
- Agenda de citas seleccionando barbero, fecha y horario disponible
- Consulta y cancelación de citas propias mediante número de teléfono

### Barberos
- Inicio de sesión mediante selección de nombre y contraseña compartida
- Activación/desactivación de disponibilidad
- Asignación y cambio de silla
- Actualización de número de contacto
- Aceptación (confirmación) o cancelación de citas entrantes
- Suscripciones en tiempo real a cambios en su agenda

### Administradores
- Acceso protegido mediante contraseña
- Dashboard con resumen de citas del día y barberos activos
- CRUD completo de barberos (nombre, especialidad, fotografía, teléfono, estado)
- Gestión de horarios por barbero (día por día con hora de inicio y fin)
- Administración de sillas (alta, baja y consulta de asignación)
- Visualización y eliminación de citas (próximas y pasadas, con filtros por barbero y fecha)

---

## Stack Tecnológico

| Categoría | Tecnología | Versión |
|---|---|---|
| Framework | React Native (Expo) | SDK 54 |
| Lenguaje | JavaScript (ES2020+) | — |
| Navegación | @react-navigation/native-stack + @react-navigation/drawer | 7.x |
| Backend | Supabase (PostgreSQL + Realtime) | ^2.105.3 |
| Persistencia Local | @react-native-async-storage/async-storage | ^2.2.0 |
| Gestos | react-native-gesture-handler | ^2.28.0 |
| Animaciones | react-native-reanimated | ^4.1.1 |
| Date/Time Picker | @react-native-community/datetimepicker | ^8.4.4 |

---

## Arquitectura

La aplicación sigue una estructura de navegación basada en **native-stack** con un **drawer navigator** anidado para la sección administrativa.

```
App.js → NativeStackNavigator
├── HomeScreen                    # Pantalla principal
├── BarberDetailScreen            # Detalle del barbero y selección de fecha
├── TimeSlotScreen                # Selección de horario disponible
├── BookingScreen                 # Formulario de registro de cita
├── ConfirmationScreen            # Confirmación de cita agendada
├── BarberoScreen                 # Panel del barbero
├── MyBookingsScreen              # Consulta de citas por teléfono
└── AdminDrawer (DrawerNavigator)
    ├── AdminDashboardScreen      # Panel principal de administración
    ├── AdminBarbersScreen        # CRUD de barberos
    ├── AdminScheduleScreen       # Gestión de horarios
    ├── AdminSillasScreen         # Gestión de sillas
    └── AdminBookingsScreen       # Gestión de citas
```

### Flujo de Datos

- **Supabase**: almacenamiento de barberos, sillas, asignaciones barbero-silla y citas, con suscripciones en tiempo real mediante `postgres_changes`.
- **AsyncStorage**: persistencia local de horarios por barbero (`@horarios_{barberoId}`) y sesión del administrador (`@admin_session`).
- Las suscripciones en tiempo real mantienen sincronizadas las pantallas ante cambios externos.

---

## Requisitos

- Node.js 18 o superior
- Expo CLI (`npm install -g expo-cli`)
- Un proyecto activo en [Supabase](https://supabase.com)

---

## Instalación y Configuración

```bash
# Clonar el repositorio
git clone https://github.com/tu-usuario/tauros-barberia.git
cd tauros-barberia

# Instalar dependencias
npm install
```

### Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto con las credenciales de tu proyecto de Supabase:

```env
EXPO_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key-publica
```

> **Nota**: Las variables con prefijo `EXPO_PUBLIC_` son expuestas al cliente por Expo. La anon key de Supabase está diseñada para uso público en el cliente, pero se recomienda restringirla mediante RLS (Row Level Security) en producción.

### Base de Datos (Supabase)

Ejecuta el siguiente script SQL en el editor SQL de tu proyecto Supabase para crear las tablas necesarias:

```sql
-- Tabla de barberos
CREATE TABLE barberos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  especialidad TEXT,
  foto_url TEXT,
  telefono TEXT,
  activo BOOLEAN DEFAULT true,
  admin_activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla de sillas
CREATE TABLE sillas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  numero INTEGER NOT NULL UNIQUE,
  estado TEXT DEFAULT 'libre',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla de asignación barbero-silla
CREATE TABLE barbero_sillas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  barbero_id UUID REFERENCES barberos(id) ON DELETE CASCADE,
  silla_id UUID REFERENCES sillas(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(barbero_id, silla_id)
);

-- Tabla de citas
CREATE TABLE citas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente_nombre TEXT NOT NULL,
  barbero_id UUID REFERENCES barberos(id),
  silla_id UUID REFERENCES sillas(id),
  fecha DATE NOT NULL,
  hora TIME NOT NULL,
  telefono TEXT,
  estado TEXT DEFAULT 'pendiente',
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## Uso

```bash
# Iniciar servidor de desarrollo
npx expo start
```

Una vez iniciado, puedes:
- Escanear el código QR con la aplicación **Expo Go** en tu dispositivo físico
- Presionar `a` para abrir en un emulador de Android
- Presionar `i` para abrir en un simulador de iOS
- Presionar `w` para abrir en el navegador web

### Credenciales de Acceso

| Rol | Contraseña |
|---|---|
| Administrador | `admin123` |
| Barbero | `barbero123` |

> Las contraseñas están hardcodeadas por simplicidad. En una versión de producción se recomienda implementar autenticación con Supabase Auth.

### Paleta de Colores

| Elemento | Código |
|---|---|
| Fondo principal | `#1A1A2E` |
| Acento dorado | `#C8962A` |
| Tarjetas | `#1E1E1E` |
| Inputs | `#2A2A2A` |
| Texto | `#FFFFFF` |

---

## Estructura del Proyecto

```
barberia/
├── App.js                        # Punto de entrada: configuración del navegador
├── app.json                      # Configuración de Expo
├── babel.config.js               # Configuración de Babel (Expo preset + Reanimated)
├── supabase.js                   # Inicialización del cliente de Supabase
├── components/
│   ├── CustomAlert.js            # Sistema de alertas personalizadas con React Context
│   ├── DatePicker.js             # Selector de fecha nativo (iOS/Android)
│   ├── DatePicker.web.js         # Selector de fecha para web
│   ├── LoadingScreen.js          # Componente de carga con spinner y ErrorView
│   ├── TimePicker.js             # Selector de hora nativo (iOS/Android)
│   └── TimePicker.web.js         # Selector de hora para web
├── screens/
│   ├── HomeScreen.js             # Pantalla principal con lista de sillas
│   ├── BarberDetailScreen.js     # Información del barbero y selección de fecha
│   ├── TimeSlotScreen.js         # Slots horarios disponibles
│   ├── BookingScreen.js          # Formulario de registro de datos del cliente
│   ├── ConfirmationScreen.js     # Pantalla de confirmación de cita
│   ├── BarberoScreen.js          # Panel de gestión para barberos
│   ├── MyBookingsScreen.js       # Consulta de citas por teléfono
│   └── admin/
│       ├── AdminLoginScreen.js     # Autenticación del administrador
│       ├── AdminDashboardScreen.js # Panel principal del administrador
│       ├── AdminBarbersScreen.js   # CRUD de barberos
│       ├── AdminScheduleScreen.js  # Gestión de horarios por barbero
│       ├── AdminSillasScreen.js    # Administración de sillas
│       ├── AdminBookingsScreen.js  # Visualización y gestión de citas
│       └── AdminDrawer.js          # Navegador tipo drawer para el panel admin
├── services/
│   ├── adminAuthService.js        # Autenticación del administrador
│   ├── barberosService.js         # Operaciones sobre la tabla barberos
│   ├── barberoSillasService.js    # Asignación barbero-silla
│   ├── citasService.js            # Registro y consulta de citas
│   ├── horarioService.js          # Carga y guardado de horarios (AsyncStorage)
│   └── sillasService.js           # Operaciones sobre la tabla sillas
└── utils/
    └── horarios.js                # Slots predefinidos y utilidad fechaLocal()
```

---

## Licencia

Este proyecto es de uso privado. Todos los derechos reservados.
