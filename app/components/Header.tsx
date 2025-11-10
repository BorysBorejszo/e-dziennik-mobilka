import React from "react";
import { View, Text } from "react-native";
import Entypo from "@expo/vector-icons/Entypo";
import { SidebarTrigger } from "./ui/sidebar";

type Props = {
  title: string;
  subtitle?: string;
};

export default function Header({ title, subtitle }: Props) {
  return (
    <View style={{ backgroundColor: "#000", zIndex: 20 }} className="px-4 pb-4">
      <View className="flex-row items-start">
        <SidebarTrigger style={{ marginRight: 10, marginTop: 4 }}>
          <Entypo name="menu" size={26} color="#60A5FA" />
        </SidebarTrigger>

        <View>
          <Text className="text-white text-3xl font-bold">{title}</Text>
          {subtitle ? <Text className="text-gray-400 text-lg mt-1">{subtitle}</Text> : null}
        </View>
      </View>
    </View>
  );
}
