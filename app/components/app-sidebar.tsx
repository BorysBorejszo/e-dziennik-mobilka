import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarGroup,
  SidebarFooter,
  useSidebar,
} from "./ui/sidebar";
import { useTheme } from "../theme/ThemeContext";
import { router } from "expo-router";

export function AppSidebar() {
  const { close } = useSidebar();
  const { theme } = useTheme();

  return (
    <Sidebar>
      <SidebarHeader>
        <Text style={{ color: theme === 'dark' ? '#fff' : '#0f172a', fontWeight: '700', fontSize: 18 }}>Menu</Text>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup title="Nawigacja">
          <TouchableOpacity
            onPress={() => {

              close();
              router.push("/");
            }}
            style={{ paddingVertical: 10 }}
          >
            <Text style={{ color: theme === 'dark' ? '#fff' : '#0f172a' }}>Strona główna</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={close} style={{ paddingVertical: 10 }}>
            <Text style={{ color: theme === 'dark' ? '#fff' : '#0f172a' }}>Plan lekcji</Text>
          </TouchableOpacity>
        </SidebarGroup>

        <SidebarGroup title="Ustawienia">
          <TouchableOpacity onPress={close} style={{ paddingVertical: 10 }}>
            <Text style={{ color: theme === 'dark' ? '#fff' : '#0f172a' }}>Profil</Text>
          </TouchableOpacity>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <TouchableOpacity onPress={close} style={{ paddingVertical: 6 }}>
          <Text style={{ color: theme === 'dark' ? '#9CA3AF' : '#6b7280' }}>Zamknij</Text>
        </TouchableOpacity>
      </SidebarFooter>
    </Sidebar>
  );
}

export default AppSidebar;
