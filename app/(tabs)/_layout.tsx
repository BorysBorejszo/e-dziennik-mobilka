import Entypo from "@expo/vector-icons/Entypo";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Tabs, useRouter, useSegments } from "expo-router";
import "../globals.css";
import { PanGestureHandler, State, GestureHandlerRootView } from "react-native-gesture-handler";
import { View } from "react-native";
import React from "react";

export default function Layout() {
  const router = useRouter();
  const segments = useSegments();

  // route order must match the Tabs.Screen order below
  const routes = ["index", "schedule", "settings", "grades", "behavior", "messages"];

  // determine current active segment (last segment)
  const currentSegment = segments[segments.length - 1] || "index";
  const currentIndex = Math.max(0, routes.indexOf(currentSegment) === -1 ? 0 : routes.indexOf(currentSegment));

  const navigateToIndex = (i: number) => {
    const idx = (i + routes.length) % routes.length;
    const route = routes[idx];
    // route 'index' corresponds to root '/'
    const path = route === "index" ? "/" : `/${route}`;
  // router.replace has a strict typed signature from expo-router; cast to any to allow dynamic path
  router.replace(path as any);
  };

  const onGestureEvent = (event: any) => {
    const ne = event.nativeEvent;
    if (ne.state === State.END) {
      const dx = ne.translationX;
      const threshold = 80;
      if (dx < -threshold) {
        // swipe left -> next
        navigateToIndex(currentIndex + 1);
      } else if (dx > threshold) {
        // swipe right -> previous
        navigateToIndex(currentIndex - 1);
      }
    }
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PanGestureHandler onHandlerStateChange={onGestureEvent} activeOffsetX={[-10, 10]}>
        <View style={{ flex: 1 }}>
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
              title: "Główna",
              tabBarIcon: ({ color, size }) => (
                <Entypo name="home" size={size ?? 20} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="schedule"
            options={{
              title: "Plan",
              tabBarIcon: ({ color, size }) => (
                <Entypo name="calendar" size={size ?? 20} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="settings"
            options={{
              title: "Ustawienia",
              tabBarIcon: ({ color, size }) => (
                <Entypo name="cog" size={size ?? 20} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="grades"
            options={{
              title: "Oceny",
              tabBarIcon: ({ color, size }) => (
                <MaterialIcons name="calculate" size={size ?? 20} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="behavior"
            options={{
              title: "Zachowanie",
              tabBarIcon: ({ color, size }) => (
                <Entypo name="star" size={size ?? 20} color={color} />
              ),
            }}
          />
          
          <Tabs.Screen
            name="messages"
            options={{
              title: "Wiadomości",
              tabBarIcon: ({ color, size }) => (
                <Entypo name="chat" size={size ?? 20} color={color} />
              ),
            }}
          />
        </Tabs>
        </View>
      </PanGestureHandler>
    </GestureHandlerRootView>
  );
}
