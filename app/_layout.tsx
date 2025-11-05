import Entypo from "@expo/vector-icons/Entypo";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Tabs } from "expo-router";
import "./globals.css";

export default function Layout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#0b0b0b",
          borderTopColor: "#374151",
          height: 72,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarActiveTintColor: "#60A5FA",
        tabBarInactiveTintColor: "#9CA3AF",
        tabBarLabelStyle: { fontSize: 12 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <Entypo name="home" size={size ?? 20} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="schedule"
        options={{
          title: "Schedule",
          tabBarIcon: ({ color, size }) => (
            <Entypo name="calendar" size={size ?? 20} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color, size }) => (
            <Entypo name="cog" size={size ?? 20} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="grades"
        options={{
          title: "Grades",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="calculate" size={size ?? 20} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="behavior"
        options={{
          title: "Behavior",
          tabBarIcon: ({ color, size }) => (
            <Entypo name="star" size={size ?? 20} color={color} />
          ),
        }}
      />
      
      <Tabs.Screen
        name="messages"
        options={{
          title: "Messages",
          tabBarIcon: ({ color, size }) => (
            <Entypo name="chat" size={size ?? 20} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
