import React from "react";
import { StatusBar } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import HomeScreen from "./screens/HomeScreen";
import BarberDetailScreen from "./screens/BarberDetailScreen";
import TimeSlotScreen from "./screens/TimeSlotScreen";
import BookingScreen from "./screens/BookingScreen";
import ConfirmationScreen from "./screens/ConfirmationScreen";
import AdminLoginScreen from "./screens/admin/AdminLoginScreen";
import AdminDrawer from "./screens/admin/AdminDrawer";
import BarberoScreen from "./screens/BarberoScreen";
import MyBookingsScreen from "./screens/MyBookingsScreen";
import { AlertProvider } from "./components/CustomAlert";

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <AlertProvider>
    <GestureHandlerRootView style={{ flex: 1, overflow: "hidden" }}>
      <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar barStyle="light-content" />
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: "#1A1A2E" },
          }}
        >
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="BarberDetail" component={BarberDetailScreen} />
          <Stack.Screen name="TimeSlot" component={TimeSlotScreen} />
          <Stack.Screen name="Booking" component={BookingScreen} />
          <Stack.Screen name="Confirmation" component={ConfirmationScreen} />
          <Stack.Screen name="AdminLogin" component={AdminLoginScreen} />
          <Stack.Screen name="AdminDrawer" component={AdminDrawer} />
          <Stack.Screen name="BarberPanel" component={BarberoScreen} />
          <Stack.Screen name="MyBookings" component={MyBookingsScreen} />
        </Stack.Navigator>
      </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
    </AlertProvider>
  );
}
