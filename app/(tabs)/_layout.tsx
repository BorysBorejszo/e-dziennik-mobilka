import Entypo from "@expo/vector-icons/Entypo";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Tabs, useRouter, useSegments } from "expo-router";
import "../globals.css";
import { PanGestureHandler, State, GestureHandlerRootView } from "react-native-gesture-handler";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import React from "react";
import Ionicons from "@expo/vector-icons/build/Ionicons";
import { SidebarProvider, SidebarTrigger } from "../components/ui/sidebar";
import AppSidebar from "../components/app-sidebar";
import { useTheme } from "../theme/ThemeContext";


export default function Layout() {
  const router = useRouter();
  const segments = useSegments();

  // route order must match the Tabs.Screen order below
  const routes = ["index", "schedule", "settings", "grades", "attendance", "messages"];

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

  const { theme } = useTheme();

  const bg = theme === 'dark' ? '#000' : '#fff';
  const tabBarBg = theme === 'dark' ? '#0b0b0b' : '#f8fafc';
  const tabBarBorder = theme === 'dark' ? '#374151' : '#e5e7eb';
  const activeTint = theme === 'dark' ? '#60A5FA' : '#2563EB';
  const inactiveTint = theme === 'dark' ? '#9CA3AF' : '#6B7280';

  return (
    <SidebarProvider>
      {/* ThemeProvider exists at app/_layout.tsx (root) — don't re-create here in normal use */}
        <GestureHandlerRootView style={{ flex: 1, backgroundColor: bg }}>
          <PanGestureHandler onHandlerStateChange={onGestureEvent} activeOffsetX={[-10, 10]}>
            <SafeAreaView style={{ flex: 1, backgroundColor: bg }}>
            {/* App Sidebar (sliding drawer) */}
            <AppSidebar />

            {/* Trigger removed from top — triggers are placed inline in page headers */}

            <Tabs
          screenOptions={{
            headerShown: false,
            tabBarStyle: {
              backgroundColor: tabBarBg,
              // remove default top border / shadow on iOS and elevation on Android
              borderTopWidth: 0,
              borderTopColor: 'transparent',
              elevation: 0,
              shadowColor: 'transparent',
              shadowOpacity: 0,
              shadowOffset: { width: 0, height: 0 },
              shadowRadius: 0,
              height: 72,
              paddingBottom: 8,
              paddingTop: 6,
            },
            tabBarActiveTintColor: activeTint,
            tabBarInactiveTintColor: inactiveTint,
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
                <Ionicons name="ribbon-outline" size={24} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="attendance"
            options={{
              title: "Frekwencja",
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="stats-chart-outline" size={24} color={color} />
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
            </SafeAreaView>
          </PanGestureHandler>
        </GestureHandlerRootView>
    </SidebarProvider>
  );
}
