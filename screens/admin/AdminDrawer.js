import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { createDrawerNavigator, DrawerContentScrollView } from "@react-navigation/drawer";
import { useNavigation } from "@react-navigation/native";
import AdminDashboardScreen from "./AdminDashboardScreen";
import AdminBarbersScreen from "./AdminBarbersScreen";
import AdminScheduleScreen from "./AdminScheduleScreen";
import AdminBookingsScreen from "./AdminBookingsScreen";

const Drawer = createDrawerNavigator();

function CustomDrawerContent(props) {
  const navigation = useNavigation();
  const items = [
    { label: "Dashboard", icon: "📊", screen: "AdminDashboard" },
    { label: "Barberos", icon: "✂️", screen: "AdminBarbers" },
    { label: "Horarios", icon: "🕐", screen: "AdminSchedule" },
    { label: "Citas", icon: "📋", screen: "AdminBookings" },
  ];

  return (
    <View style={styles.drawerContainer}>
      <View style={styles.drawerHeader}>
        <Text style={styles.drawerTitle}>Tauros Barbería</Text>
        <Text style={styles.drawerSub}>Panel Admin</Text>
      </View>
      <DrawerContentScrollView {...props}>
        {items.map((item) => (
          <TouchableOpacity
            key={item.screen}
            style={[
              styles.drawerItem,
              props.state.routeNames[props.state.index] === item.screen && styles.drawerItemActive,
            ]}
            onPress={() => navigation.navigate(item.screen)}
          >
            <Text style={styles.drawerItemIcon}>{item.icon}</Text>
            <Text style={styles.drawerItemText}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </DrawerContentScrollView>
      <TouchableOpacity style={styles.backHomeBtn} onPress={() => navigation.reset({ index: 0, routes: [{ name: "Home" }] })}>
        <Text style={styles.backHomeText}>← Salir al inicio</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function AdminDrawer() {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerType: "front",
        drawerStyle: { backgroundColor: "#1E1E1E", width: 260 },
        overlayColor: "rgba(0,0,0,0.7)",
      }}
    >
      <Drawer.Screen name="AdminDashboard" component={AdminDashboardScreen} />
      <Drawer.Screen name="AdminBarbers" component={AdminBarbersScreen} />
      <Drawer.Screen name="AdminSchedule" component={AdminScheduleScreen} />
      <Drawer.Screen name="AdminBookings" component={AdminBookingsScreen} />
    </Drawer.Navigator>
  );
}

const styles = StyleSheet.create({
  drawerContainer: { flex: 1, backgroundColor: "#1E1E1E" },
  drawerHeader: { paddingTop: 50, paddingBottom: 20, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: "#333" },
  drawerTitle: { color: "#D4AF37", fontSize: 22, fontWeight: "bold" },
  drawerSub: { color: "#999", fontSize: 14, marginTop: 3 },
  drawerItem: { flexDirection: "row", alignItems: "center", paddingVertical: 15, paddingHorizontal: 20 },
  drawerItemActive: { backgroundColor: "#2E7D32" },
  drawerItemIcon: { fontSize: 22, marginRight: 15 },
  drawerItemText: { color: "white", fontSize: 16, fontWeight: "bold" },
  backHomeBtn: { padding: 18, borderTopWidth: 1, borderTopColor: "#333", alignItems: "center" },
  backHomeText: { color: "#D4AF37", fontSize: 16, fontWeight: "bold" },
});
