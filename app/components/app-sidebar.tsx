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
import { router } from "expo-router";

export function AppSidebar() {
  const { close } = useSidebar();

  return (
    <Sidebar>
      <SidebarHeader>
        <Text style={{ color: "#fff", fontWeight: "700", fontSize: 18 }}>Menu</Text>
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
            <Text style={{ color: "#fff" }}>Strona główna</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={close} style={{ paddingVertical: 10 }}>
            <Text style={{ color: "#fff" }}>Plan lekcji</Text>
          </TouchableOpacity>
        </SidebarGroup>

        <SidebarGroup title="Ustawienia">
          <TouchableOpacity onPress={close} style={{ paddingVertical: 10 }}>
            <Text style={{ color: "#fff" }}>Profil</Text>
          </TouchableOpacity>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <TouchableOpacity onPress={close} style={{ paddingVertical: 6 }}>
          <Text style={{ color: "#9CA3AF" }}>Zamknij</Text>
        </TouchableOpacity>
      </SidebarFooter>
    </Sidebar>
  );
}

export default AppSidebar;
