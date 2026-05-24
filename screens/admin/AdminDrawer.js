import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { createDrawerNavigator, DrawerContentScrollView } from "@react-navigation/drawer";
import { CommonActions } from "@react-navigation/native";
import AdminDashboardScreen from "./AdminDashboardScreen";
import AdminBarbersScreen from "./AdminBarbersScreen";
import AdminScheduleScreen from "./AdminScheduleScreen";
import AdminSillasScreen from "./AdminSillasScreen";
import AdminBookingsScreen from "./AdminBookingsScreen";

const Drawer = createDrawerNavigator();

function CustomDrawerContent(props) {
  const drawerNav = props.navigation;
  const currentRoute = props.state?.routes?.[props.state.index]?.name;
  const items = [
    { label: "Dashboard", icon: "📊", route: "AdminDashboard" },
    { label: "Barberos", icon: "✂️", route: "AdminBarbers" },
    { label: "Horarios", icon: "📅", route: "AdminSchedule" },
    { label: "Sillas", icon: "💺", route: "AdminSillas" },
    { label: "Citas", icon: "📋", route: "AdminBookings" },
  ];

  return (
    <SafeAreaView style={styles.drawerContainer} edges={["top", "bottom"]}>
      <View style={styles.drawerHeader}>
        <Text style={styles.drawerTitle}>Tauro's Admin</Text>
        <Text style={styles.drawerSub}>Panel de administración</Text>
      </View>
      <DrawerContentScrollView {...props} style={{ flex: 1 }} contentContainerStyle={{ flex: 1 }}>
        {items.map(item => {
          const active = currentRoute === item.route;
          return (
            <TouchableOpacity
              key={item.label}
              style={[styles.drawerItem, active && styles.drawerItemActive]}
              onPress={() => { drawerNav.navigate(item.route); drawerNav.closeDrawer(); }}
            >
              <Text style={styles.drawerItemIcon}>{item.icon}</Text>
              <Text style={styles.drawerItemText}>{item.label}</Text>
            </TouchableOpacity>
          );
        })}
      </DrawerContentScrollView>
      <TouchableOpacity style={styles.backHomeBtn}
        onPress={() => drawerNav.getParent()?.dispatch(CommonActions.reset({ index: 0, routes: [{ name: "Home" }] }))}
      >
        <Text style={styles.backHomeText}>← Cerrar sesión</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

export default function AdminDrawer() {
  return (
    <Drawer.Navigator
      drawerContent={CustomDrawerContent}
      screenOptions={{
        headerShown: false,
        drawerType: "front",
        swipeEnabled: Platform.OS !== "web",
        drawerStyle: { width: 260, backgroundColor: "#1E1E1E" },
        overlayColor: "rgba(0,0,0,0.5)",
      }}
    >
      <Drawer.Screen name="AdminDashboard" component={AdminDashboardScreen} />
      <Drawer.Screen name="AdminBarbers" component={AdminBarbersScreen} />
      <Drawer.Screen name="AdminSchedule" component={AdminScheduleScreen} />
      <Drawer.Screen name="AdminSillas" component={AdminSillasScreen} />
      <Drawer.Screen name="AdminBookings" component={AdminBookingsScreen} />
    </Drawer.Navigator>
  );
}

const styles = StyleSheet.create({
  drawerContainer: { flex: 1, backgroundColor: "#1E1E1E" },
  drawerHeader: { padding: 24, borderBottomWidth: 1, borderBottomColor: "#333" },
  drawerTitle: { color: "#C8962A", fontSize: 22, fontWeight: "bold" },
  drawerSub: { color: "#999", fontSize: 14, marginTop: 2 },
  drawerItem: { flexDirection: "row", alignItems: "center", paddingVertical: 15, paddingHorizontal: 22 },
  drawerItemActive: { backgroundColor: "#C8962A" },
  drawerItemIcon: { fontSize: 20, marginRight: 14 },
  drawerItemText: { color: "white", fontSize: 16, fontWeight: "bold" },
  backHomeBtn: { padding: 18, borderTopWidth: 1, borderTopColor: "#333" },
  backHomeText: { color: "#C8962A", fontSize: 16, fontWeight: "bold" },
});
