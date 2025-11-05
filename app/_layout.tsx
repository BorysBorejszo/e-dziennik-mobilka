import { Stack } from "expo-router";
import "./globals.css";
import { View } from "react-native";

export default function Layout() {
  return (
    <>
      <Stack />
      <View className="flex-1 bg-black absolute bottom-0 w-full h-24 border-t-2 border-gray-700"></View>
    </>
  );
}
